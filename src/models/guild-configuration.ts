import { Cron } from 'croner';
import mongoose from 'mongoose';
import rootLogger from '../utils/logger';
import client from '../bot/client';
import { Client, Guild, NewsChannel, PermissionFlagsBits, TextChannel } from 'discord.js';

const guildConfigurationSchema = new mongoose.Schema(
  {
    guildId: {
      type: mongoose.SchemaTypes.String,
      required: true,
      unique: true,
      index: true,
    },
    /**
     * The ID of the Discord channel where the bot posts notifications. If not defined, guild will be
     * skipped during processing.
     */
    notificationChannelId: mongoose.SchemaTypes.String,
    /**
     * CRON pattern used for posting notifications. If not defined, guild will be  skipped during
     * processing.
     */
    notificationSchedule: {
      type: mongoose.SchemaTypes.String,
      default: process.env.DEFAULT_NOTIFICATION_SCHEDULE,
      validate: {
        validator: (value: unknown) => {
          if (typeof value !== 'string') return false;

          try {
            const job = new Cron(value);
            job.stop();
            return true;
          } catch {
            return false;
          }
        },
        message: (props: mongoose.ValidatorProps) => `${props.value} is not a valid CRON pattern`,
      },
    },
    notificationsEnabled: {
      type: mongoose.SchemaTypes.Boolean,
      default: false,
      required: true,
    },
    /**
     * Whether the bot should include the poster of the movie in his notification. Only works if the
     * movie has `posterUrl` set.
     */
    includePosterInNotifications: {
      type: mongoose.SchemaTypes.Boolean,
      default: false,
    },
    /**
     * Whether the bot should include the URL of the trailer for the movie in his notification. Only
     * works if the movie has `trailerUrl` set.
     */
    includeTrailerInNotifications: {
      type: mongoose.SchemaTypes.Boolean,
      default: false,
    },
    /**
     * If set to `true`, the bot will post all notifications in all available languages.
     */
    multiLanguageNotifications: {
      type: mongoose.SchemaTypes.Boolean,
      default: false,
    },
    /**
     * Timezone that will be used for date values in messages from the bot. Defaults to `Europe/Vienna` when
     * not defined.
     */
    preferredTimezone: {
      type: mongoose.SchemaTypes.String,
      enum: Intl.supportedValuesOf('timeZone'),
      default: 'Europe/Vienna',
      required: true,
    },
  },
  {
    timestamps: true,
    methods: {
      /**
       * Resolves the guild belonging to this model's `guildId`.
       * @async
       * @throws {Error} If the Discord client is not initialized yet.
       * @returns {Guild} The resolved guild.
       */
      async resolveGuild(): Promise<Guild> {
        const logger = rootLogger.child({ guild: this.guildId });
        if (!client.isReady()) throw new Error('Discord client not ready yet');

        logger.info('Fetching guild from Discord API');
        const guild = await client.guilds.fetch(this.guildId);
        return guild;
      },
      /**
       * Resolves the channel belonging to this model's `notificationChannelId`.
       * @async
       * @throws {Error} If the Discord client is not initialized yet.
       * @returns {NewsChannel | TextChannel | null} The resolved channel or null if the channel is invalid or
       * not configured yet.
       */
      async resolveChannel(): Promise<NewsChannel | TextChannel | null> {
        const logger = rootLogger.child({
          guild: this.guildId,
          channel: this.notificationChannelId,
        });
        if (!client.isReady()) throw new Error('Discord client not ready yet');
        if (!this.notificationChannelId) {
          logger.info('No channel defined in guild configuration');
          return null;
        }

        logger.info('Fetching channel from Discord API');
        const channel = await client.channels.fetch(this.notificationChannelId);
        if (!channel) {
          logger.info('Channel not found');
          return null;
        }

        logger.debug('Checking that channel is a text based channel');
        if (!channel.isSendable() || !('threads' in channel)) {
          logger.info('Channel is not a valid text based channel');
          return null;
        }

        logger.debug('Checking for required permissions in channel');
        const requiredPermissions = [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.CreatePublicThreads,
          PermissionFlagsBits.SendMessagesInThreads,
        ];
        if (this.includePosterInNotifications)
          requiredPermissions.push(PermissionFlagsBits.EmbedLinks);

        const hasRequiredPermissions = requiredPermissions.every(
          // `as Client<true>` can be safely asserted here as this was already checked earlier
          (permission) =>
            !!channel.permissionsFor((client as Client<true>).user.id)?.has(permission),
        );
        if (!hasRequiredPermissions) {
          logger.info('Missing required permission for channel');
          return null;
        }

        return channel;
      },
    },
  },
);

export type GuildConfiguration = mongoose.InferSchemaType<typeof guildConfigurationSchema>;
export const GuildConfigurationModel = mongoose.model(
  'GuildConfiguration',
  guildConfigurationSchema,
);
