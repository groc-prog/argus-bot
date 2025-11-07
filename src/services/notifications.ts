import type mongoose from 'mongoose';
import ServiceBase from './service-base';
import { GuildConfigurationModel } from '../models/guild-configuration';
import { Cron } from 'croner';
import dayjs from 'dayjs';
import { MovieModel, type Movie, type MoviePerformance } from '../models/movie';
import threadNameTemplates from '../templates/guild-notification/thread-name';
import threadAnnouncementTemplates from '../templates/guild-notification/thread-announcement';
import threadMessageTemplates from '../templates/guild-notification/thread-message';
import { Locale, MessageFlags, ThreadAutoArchiveDuration } from 'discord.js';
import WebScraperService from './web-scraper';
import type { MovieAttribute } from '../models/movie-attribute';

interface GuildNotificationContext {
  schedule: string;
  guildIds: Set<string>;
}

type PopulatedMovie = Pick<
  Movie,
  'posterUrl' | 'trailerUrl' | 'title' | 'description' | 'lengthMinutes'
> & {
  fsk?: MovieAttribute | null;
  genres: MovieAttribute[];
  technologyAttributes: MovieAttribute[];
  performances: (Pick<MoviePerformance, 'showtimeUtc'> & {
    attributes: MovieAttribute[];
    theatre: MovieAttribute;
    seatClasses: MovieAttribute[];
  })[];
};

export default class NotificationService extends ServiceBase {
  async initialize(): Promise<void> {
    this.logger.info('Initializing service');
    await this.setupInitialGuildJobs();
  }

  private async setupInitialGuildJobs(): Promise<void> {
    this.logger.info('Setting up scheduled jobs for all guilds');
    const aggregatedGuildSchedules = await GuildConfigurationModel.aggregate<{
      _id: string;
      guildIds: string[];
    }>()
      .match({
        notificationChannelId: {
          $exists: true,
          $ne: null,
        },
        notificationSchedule: {
          $exists: true,
          $ne: null,
        },
        notificationsEnabled: true,
      })
      .group({
        _id: '$notificationSchedule',
        guildIds: {
          $addToSet: '$guildId',
        },
      });

    this.logger.info(`Found ${aggregatedGuildSchedules.length} guild jobs to register`);
    const jobGroups = aggregatedGuildSchedules.map((aggregate) => ({
      schedule: aggregate._id,
      guildIds: new Set(aggregate.guildIds),
    }));

    for (const group of jobGroups) {
      try {
        new Cron(
          group.schedule,
          {
            name: `guild-${group.schedule}`,
            protect: true,
            context: {
              guildIds: group.guildIds,
            },
            catch: (err, job) => {
              const nextScheduleInMs = job.msToNext();
              this.logger.error(
                {
                  err,
                  schedule: job.getPattern(),
                  nextScheduleAt: nextScheduleInMs
                    ? dayjs.utc().add(nextScheduleInMs, 'ms')
                    : 'unknown',
                },
                'Failed to run scheduled guild job',
              );
            },
          },
          async (job, context) => {
            await this.sendGuildNotifications({
              guildIds: (context as Pick<GuildNotificationContext, 'guildIds'>).guildIds,
              schedule: job.getPattern() as string,
            });
          },
        );
        this.logger.info({ schedule: group.schedule }, 'Guild job created successfully');
      } catch (err) {
        this.logger.error(
          { err, schedule: group.schedule },
          'Failed to register guild job. Guild will not receive any notifications',
        );
      }
    }
  }

  private async sendGuildNotifications(context: GuildNotificationContext): Promise<void> {
    const logger = this.logger.child({ schedule: context.schedule });

    logger.info('Fetching movie data from database');
    const movies = (await MovieModel.find({
      'performances.0': {
        $exists: true,
      },
    })
      .populate<{ fsk: MovieAttribute }>({ path: 'fsk', select: 'displayName' })
      .populate<{ genres: MovieAttribute[] }>({ path: 'genres', select: 'displayName' })
      .populate<{ technologyAttributes: MovieAttribute[] }>({
        path: 'technologyAttributes',
        select: 'displayName',
      })
      .populate<{ performances: { attributes: MovieAttribute[] }[] }>({
        path: 'performances.attributes',
        select: 'displayName',
      })
      .populate<{ performances: { seatClasses: MovieAttribute[] }[] }>({
        path: 'performances.seatClasses',
        select: 'displayName',
      })
      .populate<{ performances: { theatre: MovieAttribute }[] }>({
        path: 'performances.theatre',
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
        performances: { $slice: 3 },
      })) as unknown as mongoose.HydratedDocument<PopulatedMovie>[];

    if (movies.length === 0) {
      logger.info('No movies to send notifications for, skipping');
      return;
    }

    logger.info(`Found ${movies.length} movies to send notifications for`);
    for (const guildId of context.guildIds) {
      await this.createAndNotifyGuildThread(guildId, movies);
    }
  }

  private async createAndNotifyGuildThread(
    guildId: string,
    movies: mongoose.HydratedDocument<PopulatedMovie>[],
  ): Promise<void> {
    const logger = this.logger.child({ guild: guildId });
    try {
      logger.info('Getting guild configuration');
      const guildConfiguration = await GuildConfigurationModel.findOne({ guildId });
      if (!guildConfiguration) throw new Error('Guild configuration not found');

      const guild = await guildConfiguration.resolveGuild();
      const channel = await guildConfiguration.resolveChannel();
      if (!channel) throw new Error('Could not resolve channel');

      // We can check any of the three message templates as all of them need to implement
      // all locales from the `MessageDefinition` type.
      const locale = threadNameTemplates.has(guild.preferredLocale)
        ? guild.preferredLocale
        : Locale.EnglishUS;

      logger.info('Starting new thread in channel');
      const thread = await channel.threads.create({
        name: threadNameTemplates.get(locale)!({ date: dayjs.utc().format('YYYY-MM-DD') }),
        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
      });

      const threadLogger = logger.child({ thread: thread.id });
      threadLogger.info('Sending notifications to thread');
      await thread.send({
        content: threadAnnouncementTemplates.get(locale)!({ websiteUrl: WebScraperService.url() }),
      });

      const typingInterval = setInterval(() => {
        threadLogger.debug('Sending typing status to Discord API');
        thread.sendTyping().catch((err: unknown) => {
          threadLogger.error(err, 'Failed to send typing status to Discord API');
        });
      }, 10000);

      let sentMessages = 0;
      let failedMessages = 0;
      for (const movie of movies) {
        try {
          threadLogger.debug({ movie: movie.id }, 'Sending notification for movie');
          await thread.send({
            content: threadMessageTemplates.get(locale)!({
              // TODO: replace this with the actual command name
              performancesCommand: 'placeholder',
              posterUrl: guildConfiguration.includePosterInNotifications ? movie.posterUrl : null,
              trailerUrl: guildConfiguration.includeTrailerInNotifications
                ? movie.trailerUrl
                : null,
              title: movie.title,
              description: movie.description ? `${movie.description.slice(0, 800)}...` : null,
              lengthMinutes: movie.lengthMinutes,
              fsk: movie.fsk?.displayName,
              genres: movie.genres.map((genre) => genre.displayName).join(', '),
              performances: movie.performances.map((performance) => ({
                // Merge performance attributes and movie attributes
                attributes: [...performance.attributes, ...movie.technologyAttributes]
                  .map((attribute) => attribute.displayName)
                  .join(', '),
                theatre: performance.theatre.displayName,
                seatClasses: performance.seatClasses
                  .map((seatClass) => seatClass.displayName)
                  .join(', '),
                showtime: dayjs
                  .utc(performance.showtimeUtc)
                  .tz(guildConfiguration.preferredTimezone)
                  .format('YYYY-MM-DD HH:mm'),
              })),
            }),
            flags: [MessageFlags.SuppressNotifications],
          });

          sentMessages++;
        } catch (err) {
          threadLogger.error({ err, movie: movie.id }, 'Failed to send message to thread');
          failedMessages++;
        }
      }

      threadLogger.debug('Closing typing status interval');
      typingInterval.close();

      if (failedMessages === 0)
        threadLogger.info(`Successfully sent ${sentMessages} movie notifications`);
      else
        threadLogger.warn(
          `Successfully sent ${sentMessages} movie notifications, failed to send ${failedMessages} notifications`,
        );
    } catch (err) {
      logger.error(err, 'Failed to notify guild');
    }
  }
}
