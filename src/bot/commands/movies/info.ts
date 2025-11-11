import moviePerformancesCommand from '@commands/movies/performances';
import mentionMeCommand from '@commands/notifications/mention-me';
import { GuildConfigurationModel } from '@models/guild-configuration';
import { MovieModel, type Movie } from '@models/movie';
import type { MovieAttribute } from '@models/movie-attribute';
import movieEmbedDescriptionTemplates from '@templates/movie/movie-embed-description';
import movieInfoTemplate from '@templates/movie/movie-info';
import movieNotFoundTemplates from '@templates/movie/movie-not-found';
import movieEmbedTitleTemplates from '@templates/movie/movie-poster-embed';
import { sendLocalizedReply } from '@utils/discord';
import { interactionContextAwareLogger } from '@utils/logger';
import type { WithId } from '@utils/mongoose';
import type { DeepWriteable } from '@utils/object';
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Locale,
  MessageFlags,
  SlashCommandBuilder,
  type BaseMessageOptions,
} from 'discord.js';
import Fuse from 'fuse.js';
import { isValidObjectId } from 'mongoose';

type PopulatedMovie = WithId<
  Pick<Movie, 'posterUrl' | 'trailerUrl' | 'title' | 'description' | 'lengthMinutes'> & {
    fsk?: WithId<MovieAttribute> | null;
    genres: WithId<MovieAttribute>[];
    technologyAttributes: WithId<MovieAttribute>[];
  }
>;

export default {
  data: new SlashCommandBuilder()
    .setName('movie-info')
    .setNameLocalization(Locale.German, 'film-info')
    .setDescription('Look at a movie in more detail.')
    .setDescriptionLocalization(Locale.German, 'Mehr Infos über einen Film erfahren.')
    .addStringOption((option) =>
      option
        .setName('movie')
        .setNameLocalization(Locale.German, 'film')
        .setDescription('The movie you want to see more details for.')
        .setDescriptionLocalization(Locale.German, 'Der Film, für den du mehr Infos sehen willst.')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addBooleanOption((option) =>
      option
        .setName('link-trailer')
        .setNameLocalization(Locale.German, 'trailer-verlinken')
        .setDescription('Whether to link the trailer of the movie (when available)')
        .setDescriptionLocalization(
          Locale.German,
          'Ob der Bot in den Filmtrailer (wenn verfügbar) verlinken soll.',
        ),
    )
    .addBooleanOption((option) =>
      option
        .setName('embed-poster')
        .setNameLocalization(Locale.German, 'poster-anhängen')
        .setDescription('Whether to link the poster of the movie (when available)')
        .setDescriptionLocalization(
          Locale.German,
          'Ob der Bot in das Poster (wenn verfügbar) verlinken soll.',
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const movieIdOrTitle = interaction.options.getString('movie', true);
    const linkTrailer = interaction.options.getBoolean('link-trailer');
    const embedPoster = interaction.options.getBoolean('embed-poster');

    const logger = interactionContextAwareLogger(interaction, { movie: movieIdOrTitle });

    logger.info('Fetching movie data from database');
    const movie = (await MovieModel.findOne({
      $or: [
        { _id: isValidObjectId(movieIdOrTitle) ? movieIdOrTitle : null },
        { title: movieIdOrTitle },
      ],
    })
      .populate<{ fsk: MovieAttribute }>({ path: 'fsk', select: 'displayName' })
      .populate<{ genres: MovieAttribute[] }>({ path: 'genres', select: 'displayName' })
      .populate<{ technologyAttributes: MovieAttribute[] }>({
        path: 'technologyAttributes',
        select: 'displayName',
      })
      .select({
        posterUrl: 1,
        trailerUrl: 1,
        title: 1,
        description: 1,
        lengthMinutes: 1,
        fsk: 1,
        genres: 1,
        technologyAttributes: 1,
      })
      .lean()) as unknown as PopulatedMovie | null;

    if (!movie) {
      logger.info('Movie not found');
      await sendLocalizedReply(interaction, movieNotFoundTemplates, {
        interaction: {
          flags: [MessageFlags.Ephemeral],
        },
      });
      return;
    }

    logger.info('Fetching guild configuration for command hint');
    const guildConfiguration = await GuildConfigurationModel.findOne({
      guildId: interaction.guildId,
    })
      .select({ notificationsEnabled: 1 })
      .lean();

    const embeds: DeepWriteable<BaseMessageOptions['embeds']> = [];
    if (embedPoster && movie.posterUrl)
      embeds.push(
        new EmbedBuilder()
          .setTitle(movieEmbedTitleTemplates.get(interaction.locale)!({ title: movie.title }))
          .setURL(movie.posterUrl)
          .setImage(movie.posterUrl)
          .setDescription(movieEmbedDescriptionTemplates.get(interaction.locale)!({})),
      );

    const performancesCommand =
      moviePerformancesCommand.data.name_localizations &&
      interaction.locale in moviePerformancesCommand.data.name_localizations
        ? moviePerformancesCommand.data.name_localizations[interaction.locale]
        : moviePerformancesCommand.data.name;
    const mentionMeCommandName =
      mentionMeCommand.data.name_localizations &&
      interaction.locale in mentionMeCommand.data.name_localizations
        ? mentionMeCommand.data.name_localizations[interaction.locale]
        : mentionMeCommand.data.name;

    await sendLocalizedReply(interaction, movieInfoTemplate, {
      template: {
        title: movie.title,
        description: movie.description,
        lengthMinutes: movie.lengthMinutes,
        fsk: movie.fsk?.displayName,
        trailerUrl: linkTrailer ? movie.trailerUrl : null,
        genres: movie.genres.map((genre) => genre.displayName).join(', '),
        attributes: movie.technologyAttributes.map((attribute) => attribute.displayName).join(', '),
        performancesCommand: performancesCommand,
        showGuildNotificationCommand: guildConfiguration?.notificationsEnabled,
        mentionMeCommand: mentionMeCommandName,
      },
      interaction: {
        flags: [MessageFlags.Ephemeral],
        embeds: embeds as BaseMessageOptions['embeds'],
      },
    });
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    const logger = interactionContextAwareLogger(interaction);
    const focusedOptionValue = interaction.options.getFocused(true);

    logger.info('Getting autocomplete options for movies');
    const movieObjects = await MovieModel.find({})
      .select({
        title: 1,
      })
      .lean();

    const movies = movieObjects.map((movie) => ({
      name: movie.title,
      value: movie._id.toString(),
    }));

    if (focusedOptionValue.value.trim().length === 0) {
      logger.debug('No input to filter yet, returning first 25 options');
      await interaction.respond(movies.slice(0, 25));
      return;
    }

    logger.debug('Fuzzy searching movie options');
    const fuse = new Fuse(movies, {
      keys: ['name'],
    });
    const matches = fuse.search(focusedOptionValue.value);

    await interaction.respond(matches.slice(0, 25).map((match) => match.item));
  },
};
