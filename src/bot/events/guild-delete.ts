import { Events, Guild } from 'discord.js';
import { GuildConfigurationModel } from '../../models/guild-configuration';

export default {
  name: Events.GuildDelete,

  async execute(guild: Guild) {
    const logger = guild.client.logger.child({ guild: guild.id });
    logger.info('Kicked from guild, removing guild configuration');

    try {
      await GuildConfigurationModel.deleteOne({ guildId: guild.id });
      logger.info('Successfully deleted guild configuration');
    } catch (err) {
      logger.error(err, 'Error while deleting guild configuration');
    }
  },
};
