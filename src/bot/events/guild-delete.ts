import { GuildConfigurationModel } from '@models/guild-configuration';
import GuildNotificationService from '@services/guild-notifications';
import { Events, Guild } from 'discord.js';

export default {
  name: Events.GuildDelete,

  async execute(guild: Guild) {
    const logger = guild.client.logger.child({ guild: guild.id });

    try {
      logger.info('Kicked from guild, removing guild configuration');
      const configuration = await GuildConfigurationModel.findOne({ guildId: guild.id });
      if (!configuration) {
        logger.warn('Guild configuration not found, skipping');
        return;
      }

      await configuration.deleteOne();
      logger.info('Successfully deleted guild configuration');

      const guildNotificationService = GuildNotificationService.currentInstance();
      guildNotificationService.updateSchedule(guild.id, configuration.notificationSchedule, null);
    } catch (err) {
      logger.error(err, 'Error while deleting guild configuration');
    }
  },
};
