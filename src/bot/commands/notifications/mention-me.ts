import unmentionMeCommand from '@commands/notifications/unmention-me';
import statusCommand from '@commands/utils/status';
import { GuildConfigurationModel } from '@models/guild-configuration';
import guildNotFoundTemplates from '@templates/fallback/guild-not-found';
import missingConfigurationTemplates from '@templates/notifications/mention/missing-configuration';
import roleAssignedTemplates from '@templates/notifications/mention/role-assigned';
import { sendLocalizedReply } from '@utils/discord';
import { interactionContextAwareLogger } from '@utils/logger';
import {
  ChatInputCommandInteraction,
  InteractionContextType,
  Locale,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mention-me')
    .setNameLocalization(Locale.German, 'benachrichtige-mich')
    .setDescription('Get mentioned for any future movie updates in this guild.')
    .setDescriptionLocalization(Locale.German, 'Werde bei allen zukünftigen Filmupdates erwähnt.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction: ChatInputCommandInteraction) {
    const logger = interactionContextAwareLogger(interaction);
    logger.info('Checking for required permissions in guild');

    if (!interaction.guild?.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await sendLocalizedReply(interaction, missingConfigurationTemplates, {
        interaction: {
          flags: [MessageFlags.Ephemeral],
        },
      });
      return;
    }

    logger.info('Getting role ID to assign from guild configuration');
    const configuration = await GuildConfigurationModel.findOne({ guildId: interaction.guildId });
    if (!configuration) {
      logger.info('Configuration not found');
      const statusCommandName =
        statusCommand.data.name_localizations &&
        interaction.locale in statusCommand.data.name_localizations
          ? statusCommand.data.name_localizations[interaction.locale]
          : statusCommand.data.name;

      await sendLocalizedReply(interaction, guildNotFoundTemplates, {
        template: { statusCommand: statusCommandName },
        interaction: {
          flags: [MessageFlags.Ephemeral],
        },
      });
      return;
    }

    const role = await configuration.resolveMentionedRole();
    if (!role) {
      logger.info('Defined role not found not found');
      await sendLocalizedReply(interaction, missingConfigurationTemplates, {
        interaction: {
          flags: [MessageFlags.Ephemeral],
        },
      });
      return;
    }

    logger.info({ role: role.id }, 'Fetching user from Discord API');
    const user = await interaction.guild.members.fetch({
      user: interaction.user.id,
    });

    const unmentionMeCommandName =
      unmentionMeCommand.data.name_localizations &&
      interaction.locale in unmentionMeCommand.data.name_localizations
        ? unmentionMeCommand.data.name_localizations[interaction.locale]
        : unmentionMeCommand.data.name;

    if (user.roles.cache.has(role.id)) {
      logger.info({ role: role.id }, 'User has role already assigned');
      await sendLocalizedReply(interaction, roleAssignedTemplates, {
        template: { unmentionMeCommand: unmentionMeCommandName },
        interaction: {
          flags: [MessageFlags.Ephemeral],
        },
      });
      return;
    }

    logger.info({ role: role.id }, 'Assigning role to user');
    await user.roles.add(role.id);
    logger.info({ role: role.id }, 'Role added successfully to user');

    await sendLocalizedReply(interaction, roleAssignedTemplates, {
      template: { unmentionMeCommand: unmentionMeCommandName },
      interaction: {
        flags: [MessageFlags.Ephemeral],
      },
    });
  },
};
