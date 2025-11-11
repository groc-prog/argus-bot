import movieInfoCommand from '@commands/movies/info';
import moviePerformancesCommand from '@commands/movies/performances';
import mentionMeCommand from '@commands/notifications/mention-me';
import { GuildConfigurationModel } from '@models/guild-configuration';
import { MovieModel, type Movie, type MoviePerformance } from '@models/movie';
import type { MovieAttribute } from '@models/movie-attribute';
import ServiceBase from '@services/service-base';
import WebScraperService from '@services/web-scraper';
import threadAnnouncementTemplates from '@templates/guild-notification/thread-announcement';
import threadMessageTemplates from '@templates/guild-notification/thread-message';
import threadNameTemplates from '@templates/guild-notification/thread-name';
import movieEmbedDescriptionTemplates from '@templates/movie/movie-embed-description';
import movieEmbedTitleTemplates from '@templates/movie/movie-poster-embed';
import type { WithId } from '@utils/mongoose';
import type { DeepWriteable } from '@utils/object';
import { Cron, scheduledJobs } from 'croner';
import dayjs from 'dayjs';
import {
  EmbedBuilder,
  Locale,
  MessageFlags,
  ThreadAutoArchiveDuration,
  type BaseMessageOptions,
} from 'discord.js';

interface JobContext {
  guildIds: Set<string>;
}

type PopulatedMovie = WithId<
  Pick<Movie, 'posterUrl' | 'trailerUrl' | 'title' | 'description' | 'lengthMinutes'> & {
    fsk?: WithId<MovieAttribute> | null;
    genres: WithId<MovieAttribute>[];
    technologyAttributes: WithId<MovieAttribute>[];
    performances: (Pick<MoviePerformance, 'showtimeUtc'> & {
      attributes: WithId<MovieAttribute>[];
      theatre: WithId<MovieAttribute>;
      seatClasses: WithId<MovieAttribute>[];
    })[];
  }
>;

export default class GuildNotificationService extends ServiceBase {
  async initialize(): Promise<void> {
    this.logger.info('Initializing service');
    await this.setupInitialJobs();
  }

  /**
   * Updates the schedule on which a guild gets notified. Both `oldSchedule` or `newSchedule` can be
   * passed as `null` in case there was no old schedule or there should be no new schedule.
   * @param {string} guildId - The ID of the guild to change schedules for.
   * @param {string | null} oldSchedule - The old schedule, if it exists.
   * @param {string | null} newSchedule - The new schedule, if there should be one.
   */
  updateSchedule(guildId: string, oldSchedule: string | null, newSchedule: string | null): void {
    const logger = this.logger.child({
      guild: guildId,
      oldSchedule: oldSchedule ?? undefined,
      newSchedule: newSchedule ?? undefined,
    });
    if (!oldSchedule && !newSchedule) {
      logger.info('No old and new schedules provided, nothing to do');
      return;
    }

    if (oldSchedule) {
      logger.info('Removing guild from old job schedule');
      const oldJob = scheduledJobs.find((job) => job.name === this.getJobName(oldSchedule));

      if (oldJob) {
        logger.debug('Updating context of old job');

        const removed = (oldJob.options.context as JobContext).guildIds.delete(guildId);
        if (removed)
          logger.info('Successfully updated old context, will take effect on next scheduled run');
        else logger.warn('Guild ID not found in job context, skipping context update');
      } else logger.warn('Job not found, skipping context update');
    }

    if (newSchedule) {
      logger.info('Adding guild to new job schedule');
      const job = scheduledJobs.find((job) => job.name === this.getJobName(newSchedule));

      if (!job) {
        logger.info('Job does not exist yet, creating new job');
        this.addJob(newSchedule, new Set([guildId]));
      } else {
        logger.info('Job found, updating context');
        (job.options.context as JobContext).guildIds.add(guildId);
        logger.info('Successfully updated job context, will take effect on next scheduled run');
      }
    }
  }

  private async setupInitialJobs(): Promise<void> {
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

    this.logger.info(`Found ${aggregatedGuildSchedules.length} jobs to register`);
    for (const aggregate of aggregatedGuildSchedules) {
      this.addJob(aggregate._id, new Set(aggregate.guildIds));
    }
  }

  private addJob(schedule: string, guildIds: Set<string>): void {
    const logger = this.logger.child({ schedule, guildIds: Array.from(guildIds) });

    try {
      new Cron(
        schedule,
        {
          name: this.getJobName(schedule),
          protect: true,
          context: {
            guildIds: guildIds,
          } as JobContext,
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
              'Failed to run scheduled job',
            );
          },
        },
        async (job, context) => {
          await this.sendNotifications(
            job.getPattern() as string,
            (context as Pick<JobContext, 'guildIds'>).guildIds,
          );
        },
      );
      logger.info('Job created successfully');
    } catch (err) {
      logger.error(err, 'Failed to register job. Guild will not receive any notifications');
    }
  }

  private async sendNotifications(schedule: string, guildIds: Set<string>): Promise<void> {
    const logger = this.logger.child({ schedule: schedule });

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
      .sort({ title: 'asc' })
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
      })
      .lean()) as unknown as PopulatedMovie[];

    logger.debug('Checking if there are movies with truncated performances');
    const hasTruncatedPerformances = await MovieModel.countDocuments({
      _id: {
        $in: movies.map((movie) => movie._id),
      },
      'performances.3': { $exists: true },
    });

    if (movies.length === 0) {
      logger.info('No movies to send notifications for, skipping');
      return;
    }

    logger.info(`Found ${movies.length} movies to send notifications for`);
    for (const guildId of guildIds) {
      await this.createAndNotifyThread(guildId, movies, hasTruncatedPerformances > 0);
    }
  }

  private async createAndNotifyThread(
    guildId: string,
    movies: PopulatedMovie[],
    performancesTruncated: boolean,
  ): Promise<void> {
    const logger = this.logger.child({ guild: guildId });
    try {
      logger.info('Getting guild configuration');
      const guildConfiguration = await GuildConfigurationModel.findOne({ guildId });
      if (!guildConfiguration) throw new Error('Guild configuration not found');

      const guild = await guildConfiguration.resolveGuild();
      const channel = await guildConfiguration.resolveChannel();
      if (!channel) throw new Error('Could not resolve channel');

      const role = await guildConfiguration.resolveMentionedRole();

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
      const typingInterval = setInterval(() => {
        threadLogger.debug('Sending typing status to Discord API');
        thread.sendTyping().catch((err: unknown) => {
          threadLogger.error(err, 'Failed to send typing status to Discord API');
        });
      }, 5000);

      threadLogger.info(`Sending ${movies.length} notifications to thread`);
      const performancesCommand =
        moviePerformancesCommand.data.name_localizations &&
        locale in moviePerformancesCommand.data.name_localizations
          ? moviePerformancesCommand.data.name_localizations[locale]
          : moviePerformancesCommand.data.name;
      const infoCommand =
        movieInfoCommand.data.name_localizations &&
        locale in movieInfoCommand.data.name_localizations
          ? movieInfoCommand.data.name_localizations[locale]
          : movieInfoCommand.data.name;
      const mentionMeCommandName =
        mentionMeCommand.data.name_localizations &&
        locale in mentionMeCommand.data.name_localizations
          ? mentionMeCommand.data.name_localizations[locale]
          : mentionMeCommand.data.name;

      await thread.send({
        content: threadAnnouncementTemplates.get(locale)!({
          performancesTruncated,
          mentionedRoleId: role?.id,
          websiteUrl: WebScraperService.url(),
          performancesCommand,
          infoCommand,
          mentionMeCommand: mentionMeCommandName,
        }),
      });

      let sentMessages = 0;
      let failedMessages = 0;
      for (const movie of movies) {
        try {
          threadLogger.debug({ movie: movie._id.toString() }, 'Sending notification for movie');
          const embeds: DeepWriteable<BaseMessageOptions['embeds']> = [];
          if (guildConfiguration.includePosterInNotifications && movie.posterUrl)
            embeds.push(
              new EmbedBuilder()
                .setTitle(movieEmbedTitleTemplates.get(locale)!({ title: movie.title }))
                .setURL(movie.posterUrl)
                .setImage(movie.posterUrl)
                .setDescription(movieEmbedDescriptionTemplates.get(locale)!({})),
            );

          await thread.send({
            content: threadMessageTemplates.get(locale)!({
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
            embeds: embeds as BaseMessageOptions['embeds'],
          });

          sentMessages++;
        } catch (err) {
          threadLogger.error(
            { err, movie: movie._id.toString() },
            'Failed to send message to thread',
          );
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

  private getJobName(schedule: string): string {
    return `guild-${schedule}`;
  }
}
