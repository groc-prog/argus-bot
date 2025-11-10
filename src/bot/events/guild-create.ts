import { GuildConfigurationModel } from '@models/guild-configuration';
import { Events, Guild } from 'discord.js';

export default {
  name: Events.GuildCreate,

  async execute(guild: Guild) {
    const logger = guild.client.logger.child({ guild: guild.id });
    logger.info('Joining new guild, setting up defaults for guild configuration');

    try {
      logger.info('Removing any preexisting configurations');
      await GuildConfigurationModel.deleteOne({ guildId: guild.id });

      const configuration = new GuildConfigurationModel({
        guildId: guild.id,
        notificationChannelId: null,
        notificationSchedule: process.env.DEFAULT_NOTIFICATION_SCHEDULE,
        notificationsEnabled: false,
        includePosterInNotifications: false,
        includeTrailerInNotifications: false,
        multiLanguageNotifications: false,
        preferredTimezone: 'Europe/Vienna',
      });
      await configuration.save();

      logger.info('Successfully created guild configuration');
    } catch (err) {
      logger.error(err, 'Error while creating defaults, guilds needs to be configured manually');
    }
  },
};
