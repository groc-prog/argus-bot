import { Events, Guild } from 'discord.js';
import { GuildConfigurationModel } from '../../models/guild-configuration';

export default {
  name: Events.GuildCreate,

  async execute(guild: Guild) {
    const logger = guild.client.logger.child({ guild: guild.id });
    logger.info('Joining new guild, setting up defaults for guild configuration');

    try {
      // We should only ever find existing guild configurations for non-joined guilds if
      // There was a error when the bot was removed. In this case we just reset the
      // configuration to it's defaults.
      await GuildConfigurationModel.updateOne(
        { guildId: guild.id },
        {
          $set: {
            guildId: guild.id,
            notificationChannelId: null,
            notificationSchedule: process.env.DEFAULT_NOTIFICATION_SCHEDULE,
            notificationsEnabled: false,
            includePosterInNotifications: false,
            includeTrailerInNotifications: false,
            multiLanguageNotifications: false,
            preferredTimezone: 'Europe/Vienna',
          },
        },
        { upsert: true },
      );

      logger.info('Successfully created guild configuration');
    } catch (err) {
      logger.error(err, 'Error while creating defaults, guilds needs to be configured manually');
    }
  },
};
