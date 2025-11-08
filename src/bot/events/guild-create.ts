import { GuildConfigurationModel } from '@models/guild-configuration';
import { Events, Guild, PermissionFlagsBits } from 'discord.js';

export default {
  name: Events.GuildCreate,

  async execute(guild: Guild) {
    const logger = guild.client.logger.child({ guild: guild.id });
    logger.info('Joining new guild, setting up defaults for guild configuration');

    try {
      let notificationMentionedRoleId: string | null = null;
      if (guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
        try {
          const roleName = 'MovieNotifications';

          logger.info('Creating role for mentions in guild notifications');
          const role = await guild.roles.create({
            name: roleName,
            reason: 'Role for getting pinged when new movie notifications arrive',
            mentionable: true,
          });

          notificationMentionedRoleId = role.id;
          logger.info(`New role ${roleName} created successfully`);
        } catch (err) {
          logger.error(err, 'Failed to create movie mention role, skipping role setup');
        }
      }

      const configuration = new GuildConfigurationModel({
        guildId: guild.id,
        notificationChannelId: null,
        notificationSchedule: process.env.DEFAULT_NOTIFICATION_SCHEDULE,
        notificationsEnabled: false,
        notificationMentionedRoleId,
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
