import { cooldownSchema } from '@models/cooldown';
import { Locale } from 'discord.js';
import mongoose from 'mongoose';

const userConfigurationSchema = new mongoose.Schema(
  {
    discordId: {
      type: mongoose.SchemaTypes.String,
      required: true,
      unique: true,
      index: true,
    },
    /**
     * Whether the bot should include the poster of the movie in his notification. Only works if the
     * movie has `posterUrl` set.
     */
    includePosterInNotifications: {
      type: mongoose.SchemaTypes.Boolean,
      default: false,
      required: true,
    },
    /**
     * Whether the bot should include the URL of the trailer for the movie in his notification. Only
     * works if the movie has `trailerUrl` set.
     */
    includeTrailerInNotifications: {
      type: mongoose.SchemaTypes.Boolean,
      default: false,
      required: true,
    },
    /**
     * Locale the user will receive notifications in. Defaults to `Locale.EnglishUS` when not defined.
     */
    preferredLocale: {
      type: mongoose.SchemaTypes.String,
      enum: Object.values(Locale),
      default: Locale.EnglishUS,
      required: true,
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
    /**
     * Settings for temporarily muting all notifications from the bot. Pending notifications will not queue up
     * while notifications are muted.
     */
    muteNotifications: {
      type: cooldownSchema,
    },
  },
  {
    timestamps: true,
  },
);

export type UserConfiguration = mongoose.InferSchemaType<typeof userConfigurationSchema>;
export const UserConfigurationModel = mongoose.model('UserConfiguration', userConfigurationSchema);
