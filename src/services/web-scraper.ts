import { Cron } from 'croner';
import ServiceBase from './service-base';
import dayjs from 'dayjs';
import { load } from 'cheerio';
import { ElementType } from 'domelementtype';
import {
  KnownAttributeCategories as KnownAttributeCategory,
  MovieAttributeModel,
  type MovieAttribute,
} from '../models/movie-attribute';
import { MovieModel, type Movie, type MoviePerformance } from '../models/movie';
import type mongoose from 'mongoose';
import { isObject } from '../utils/object';

type ExtractedMovieAttribute = Omit<MovieAttribute, keyof mongoose.DefaultTimestampProps>;
type ExtractedMovie = Omit<Movie, keyof mongoose.DefaultTimestampProps | 'performances'> & {
  performances: MoviePerformance[];
};

export default class WebScraperService extends ServiceBase {
  private url = 'https://gleisdorf.dieselkino.at/programmuebersicht';

  initialize(): Bun.MaybePromise<void> {
    this.logger.info('Initializing service');

    try {
      new Cron(
        process.env.WEB_SCRAPER_SCHEDULE ?? '',
        {
          name: 'web-scraper',
          protect: true,
          catch: (err, job) => {
            const nextScheduleInMs = job.msToNext();
            this.logger.error(
              {
                err,
                nextScheduleAt: nextScheduleInMs
                  ? dayjs.utc().add(nextScheduleInMs, 'ms')
                  : 'unknown',
              },
              'Failed to run scheduled job',
            );
          },
        },
        async () => {
          this.logger.info('Running scheduled job');
          const scraped = await this.scrapeWebPage();

          if (!('apiData' in scraped)) throw new Error('No apiData property found in scraped data');
          if (!isObject(scraped.apiData)) throw new Error('Expected apiData to be a object');

          await this.extractAndStoreMovieAttributes(scraped.apiData as object);
          await this.extractAndStoreMovies(scraped.apiData as object);
        },
      );
      this.logger.info('Service initialized successfully');
    } catch (err) {
      this.logger.error(err, 'Failed to initialize service. Service will not function as expected');
    }
  }

  private async scrapeWebPage(): Promise<object> {
    this.logger.info({ url: this.url }, 'Fetching web page content');
    const response = await fetch(this.url);
    if (!response.ok)
      throw new Error(`Failed to fetch web page with status code ${response.status}`);

    this.logger.info('Content fetched successfully, parsing content');
    const content = await response.text();
    const $ = load(content);

    this.logger.debug('Querying response for script tag with correct CDATA');
    const ssrScriptTagMatches = $('#pmkino-overview-script-js-extra').get();
    if (ssrScriptTagMatches.length === 0)
      throw new Error('Script tag containing content not found');

    this.logger.debug('Found matching script tag, checking for correct element type');
    const ssrScriptTag = ssrScriptTagMatches[0]?.children[0];
    if (ssrScriptTag?.type !== ElementType.Text)
      throw new Error(`Script tag is not of type ${ElementType.CDATA}`);

    this.logger.debug('Extracting JSON data from script content');
    const sanitizedScriptContent = ssrScriptTag.data
      .replace(/\/\*<!\[CDATA\[ \*\//, '')
      .replace(/\/\* \]\]>\*\//, '')
      .trim();

    const varDeclaration = 'var pmkinoFrontVars = {';
    const startIndex = sanitizedScriptContent.indexOf(varDeclaration);
    if (startIndex === -1) throw new Error('pmkinoFrontVars variable not found in script content');

    const jsonStart = startIndex + varDeclaration.length - 1;
    let depth = 1;
    let jsonEnd = jsonStart;

    while (depth > 0 && jsonEnd < sanitizedScriptContent.length - 1) {
      jsonEnd++;

      const char = sanitizedScriptContent[jsonEnd];
      if (char === '{') depth++;
      if (char === '}') depth--;
    }

    if (depth !== 0) throw new Error('Unbalanced braces while extracting JSON content');
    const jsonStr = sanitizedScriptContent.slice(jsonStart, jsonEnd + 1);

    try {
      this.logger.info('Extracted JSON data from fetched content, attempting to parse');
      const scraped = JSON.parse(jsonStr) as object;
      this.logger.info('Content parsed successfully');

      return scraped;
    } catch (err) {
      throw new Error('Failed to parse extracted JSON', { cause: err });
    }
  }

  private async extractAndStoreMovieAttributes(apiData: object): Promise<void> {
    const toStore: ExtractedMovieAttribute[] = [];
    this.logger.info('Extracting movie attributes from scraped data');

    try {
      if (!('attributes' in apiData))
        throw new Error('No `attributes` property found in `apiData`');
      if (!isObject(apiData.attributes))
        throw new Error('Expected `apiData.attributes` to be a object');

      const attributesCategories = apiData.attributes as Record<string, unknown>;
      this.logger.debug(`Found ${Object.keys(attributesCategories).length} categories to check`);

      for (const category in attributesCategories) {
        const categoryScopedLogger = this.logger.child({ category });

        if (!isObject(attributesCategories[category])) {
          categoryScopedLogger.warn('Encountered category which can not be processed, skipping');
          continue;
        }

        const attributes = attributesCategories[category] as Record<string, unknown>;
        categoryScopedLogger.info(`Found ${Object.keys(attributes).length} attributes to check`);

        for (const attributeKey in attributes) {
          const attribute = attributes[attributeKey] as object;
          const attributeScopedLogger = categoryScopedLogger.child({ attribute: attributeKey });

          if (
            !isObject(attribute) ||
            !('name' in attribute) ||
            typeof attribute.name !== 'string'
          ) {
            attributeScopedLogger.warn(
              'Encountered attribute which can not be processed, skipping',
            );
            continue;
          }

          attributeScopedLogger.debug('Adding attribute to staged attributes');
          toStore.push({
            category: category as KnownAttributeCategory,
            identifier: attributeKey,
            displayName: attribute.name,
          });
        }
      }

      this.logger.info(`Extracted ${toStore.length} attributes, storing to database`);
      const operations = toStore.map((model) => ({
        updateOne: {
          filter: {
            identifier: model.identifier,
            category: model.category,
          },
          update: { $set: model },
          upsert: true,
        },
      }));

      const result = await MovieAttributeModel.bulkWrite(operations);
      this.logger.info(
        `Modified ${result.modifiedCount} existing attributes, created ${result.upsertedCount} new attributes`,
      );
    } catch (err) {
      this.logger.error(err, 'Failed to extract and store movie attributes');
    }
  }

  private async extractAndStoreMovies(apiData: object): Promise<void> {
    const toStore: ExtractedMovie[] = [];
    this.logger.info('Extracting movies from scraped data');

    try {
      if (!('movies' in apiData)) throw new Error('No `movies` property found in `apiData`');
      if (!isObject(apiData.movies)) throw new Error('Expected `apiData.movies` to be a object');

      const moviesObject = apiData.movies as object;
      if (!('items' in moviesObject))
        throw new Error('No `items` property found in `apiData.movies`');
      if (!isObject(moviesObject.items))
        throw new Error('Expected `apiData.movies.items` to be a object');

      const movies = moviesObject.items as Record<string, unknown>;
      this.logger.info(`Found ${Object.keys(movies).length} movies to check`);

      for (const movieId in movies) {
        const movie = await this.resolveMovie(movies, movieId);
        if (movie) toStore.push(movie);
      }

      this.logger.info(`Extracted ${toStore.length} movies, storing to database`);
      const operations = toStore.map((model) => ({
        updateOne: {
          filter: {
            title: model.title,
          },
          update: { $set: model },
          upsert: true,
        },
      }));

      const result = await MovieModel.bulkWrite(operations);
      this.logger.info(
        `Modified ${result.modifiedCount} existing movies, created ${result.upsertedCount} new movies`,
      );
    } catch (err) {
      this.logger.error(err, 'Failed to extract and store movies');
    }
  }

  private async resolveMovie(
    movies: Record<string, unknown>,
    movieId: string,
  ): Promise<ExtractedMovie | null> {
    const movieScopedLogger = this.logger.child({ movie: movieId });

    try {
      const movieData = movies[movieId] as Record<string, unknown>;
      if (!isObject(movieData)) {
        movieScopedLogger.warn('Encountered movie which can not be processed, skipping');
        return null;
      }

      movieScopedLogger.debug('Adding movie to staged movies');
      if (!('title' in movieData) || typeof movieData.title !== 'string') {
        movieScopedLogger.warn('Expected `title` to be a string, skipping');
        return null;
      }

      let resolvedGenres: mongoose.HydratedDocument<MovieAttribute>[] = [];
      if (Array.isArray(movieData.genres)) {
        movieScopedLogger.debug('Resolving ObjectIds for genres');
        resolvedGenres = await MovieAttributeModel.find(
          {
            identifier: { $in: movieData.genres.map(MovieAttributeModel.normalize) },
            category: KnownAttributeCategory.Genres,
          },
          {
            _id: 1,
          },
        );
        movieScopedLogger.debug(`Resolved ${resolvedGenres.length} genres to their ObjectId`);
      }

      let resolvedTechnologyAttributes: mongoose.HydratedDocument<MovieAttribute>[] = [];
      if (Array.isArray(movieData.technologyAttributes)) {
        movieScopedLogger.debug('Resolving ObjectIds for technology attributes');
        const attributeIdentifiers = movieData.technologyAttributes
          .map((attribute) => {
            if (!isObject(attribute) || !('id' in attribute)) return null;
            return (attribute as { id: unknown }).id;
          })
          .filter((identifier) => typeof identifier === 'string');

        resolvedTechnologyAttributes = await MovieAttributeModel.find(
          { identifier: { $in: attributeIdentifiers }, category: KnownAttributeCategory.Technical },
          {
            _id: 1,
          },
        );
        movieScopedLogger.debug(
          `Resolved ${resolvedTechnologyAttributes.length} technology attributes to their ObjectId`,
        );
      }

      let resolvedFsk: mongoose.HydratedDocument<MovieAttribute> | null = null;
      if (movieData.fsk) {
        movieScopedLogger.debug('Resolving ObjectId for fsk');
        resolvedFsk = await MovieAttributeModel.findOne(
          { identifier: movieData.fsk, category: KnownAttributeCategory.Fsk },
          {
            _id: 1,
          },
        );
        movieScopedLogger.debug(`Resolved ObjectId for fsk`);
      }

      const resolvedPerformances: MoviePerformance[] = [];
      if (Array.isArray(movieData.performances)) {
        for (const performance of movieData.performances) {
          if (!isObject(performance)) {
            movieScopedLogger.warn(
              {
                performance:
                  (performance as Record<string, unknown>).id ?? 'unresolved performance',
              },
              'Expected `apiData.movies[].performances[]` to be a object',
            );
            continue;
          }

          const resolvedPerformance = await this.resolveMoviePerformance(
            movieId,
            performance as Record<string, unknown>,
          );
          if (resolvedPerformance) resolvedPerformances.push(resolvedPerformance);
        }
      }

      return {
        posterUrl: typeof movieData.posterURL === 'string' ? movieData.posterURL : null,
        trailerUrl: typeof movieData.trailerURL === 'string' ? movieData.trailerURL : null,
        title: movieData.title,
        description: typeof movieData.description === 'string' ? movieData.description : null,
        lengthMinutes: typeof movieData.length === 'number' ? movieData.length : null,
        fsk: resolvedFsk?._id ?? null,
        genres: resolvedGenres.map((resolved) => resolved._id),
        technologyAttributes: resolvedTechnologyAttributes.map((resolved) => resolved._id),
        performances: resolvedPerformances,
      };
    } catch (err) {
      movieScopedLogger.error(err, 'Failed to extract movie, skipping');
      return null;
    }
  }

  private async resolveMoviePerformance(
    movieId: string,
    performance: Record<string, unknown>,
  ): Promise<MoviePerformance | null> {
    const performanceScopedLogger = this.logger.child({
      movie: movieId,
      performance: performance.id ?? 'unresolved performance',
    });

    try {
      performanceScopedLogger.debug('Resolving movie performance');
      if (!('timeUtc' in performance) || typeof performance.timeUtc !== 'number') {
        performanceScopedLogger.warn('Expected `timeUtc` to be a number, skipping');
        return null;
      }

      let resolvedTheatre: mongoose.HydratedDocument<MovieAttribute> | null = null;
      if ('theatreID' in performance) {
        performanceScopedLogger.debug('Resolving ObjectId for theatre');
        resolvedTheatre = await MovieAttributeModel.findOne(
          { identifier: performance.theatreID, category: KnownAttributeCategory.Theatres },
          {
            _id: 1,
          },
        );
        performanceScopedLogger.debug(`Resolved ObjectId for theatre`);
      }

      let resolvedSeatClasses: mongoose.HydratedDocument<MovieAttribute>[] = [];
      if (Array.isArray(performance.seatClasses)) {
        performanceScopedLogger.debug('Resolving ObjectIds for seat classes');
        const attributeIdentifiers = performance.seatClasses
          .map((attribute) => {
            if (!isObject(attribute) || !('id' in attribute)) return null;
            return (attribute as { id: unknown }).id;
          })
          .filter((identifier) => typeof identifier === 'string');

        resolvedSeatClasses = await MovieAttributeModel.find(
          {
            identifier: { $in: attributeIdentifiers },
            category: KnownAttributeCategory.SeatClasses,
          },
          {
            _id: 1,
          },
        );
        performanceScopedLogger.debug(
          `Resolved ${resolvedSeatClasses.length} seat classes to their ObjectId`,
        );
      }

      let resolvedAttributes: mongoose.HydratedDocument<MovieAttribute>[] = [];
      if (Array.isArray(performance.attributes)) {
        performanceScopedLogger.debug('Resolving ObjectIds for technical attributes');
        const attributeIdentifiers = performance.attributes
          .map((attribute) => {
            if (!isObject(attribute) || !('id' in attribute)) return null;
            return (attribute as { id: unknown }).id;
          })
          .filter((identifier) => typeof identifier === 'string');

        resolvedAttributes = await MovieAttributeModel.find(
          { identifier: { $in: attributeIdentifiers }, category: KnownAttributeCategory.Technical },
          {
            _id: 1,
          },
        );
        performanceScopedLogger.debug(
          `Resolved ${resolvedAttributes.length} technical attributes to their ObjectId`,
        );
      }

      return {
        attributes: resolvedAttributes.map((resolved) => resolved._id),
        showtimeUtc: performance.timeUtc,
        theatre: resolvedTheatre?._id ?? null,
        seatClasses: resolvedSeatClasses.map((resolved) => resolved._id),
      };
    } catch (err) {
      performanceScopedLogger.error(err, 'Failed to extract movie performance, skipping');
      return null;
    }
  }
}
