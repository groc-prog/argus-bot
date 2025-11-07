import { Cron } from 'croner';
import mongoose from 'mongoose';

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
  },
);

export type GuildConfiguration = mongoose.InferSchemaType<typeof guildConfigurationSchema>;
export const GuildConfigurationModel = mongoose.model(
  'GuildConfiguration',
  guildConfigurationSchema,
);
