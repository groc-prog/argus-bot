import mentionMeCommand from '@commands/notifications/mention-me';
import setupCommand from '@commands/utils/setup';
import { GuildConfigurationModel } from '@models/guild-configuration';
import guildNotFoundTemplates from '@templates/fallback/guild-not-found';
import missingConfigurationTemplates from '@templates/notifications/mention/missing-configuration';
import roleRemovedTemplates from '@templates/notifications/mention/role-removed';
import { sendLocalizedReply } from '@utils/discord';
import { interactionContextAwareLogger } from '@utils/logger';
import {
  ChatInputCommandInteraction,
  Locale,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmention-me')
    .setDescription('Stop getting mentioned for any future movie updates in this guild.')
    .setDescriptionLocalization(
      Locale.German,
      'Werde bei keinen zukünftigen Filmupdates mehr erwähnt.',
    ),

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

    logger.info('Getting role ID to remove from guild configuration');
    const configuration = await GuildConfigurationModel.findOne({ guildId: interaction.guildId });
    if (!configuration) {
      const setupCommandName =
        setupCommand.data.name_localizations &&
        interaction.locale in setupCommand.data.name_localizations
          ? setupCommand.data.name_localizations[interaction.locale]
          : setupCommand.data.name;

      await sendLocalizedReply(interaction, guildNotFoundTemplates, {
        template: { setupCommand: setupCommandName },
        interaction: {
          flags: [MessageFlags.Ephemeral],
        },
      });
      return;
    }

    const role = await configuration.resolveMentionedRole();
    if (!role) {
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

    const mentionMeCommandName =
      mentionMeCommand.data.name_localizations &&
      interaction.locale in mentionMeCommand.data.name_localizations
        ? mentionMeCommand.data.name_localizations[interaction.locale]
        : mentionMeCommand.data.name;

    if (!user.roles.cache.has(role.id)) {
      logger.info({ role: role.id }, 'User does not have role assigned');
      await sendLocalizedReply(interaction, roleRemovedTemplates, {
        template: { mentionMeCommand: mentionMeCommandName },
        interaction: {
          flags: [MessageFlags.Ephemeral],
        },
      });
      return;
    }

    logger.info({ role: role.id }, 'Removing role from user');
    await user.roles.remove(role.id);
    logger.info({ role: role.id }, 'Role removed successfully from user');

    await sendLocalizedReply(interaction, roleRemovedTemplates, {
      template: { mentionMeCommand: mentionMeCommandName },
      interaction: {
        flags: [MessageFlags.Ephemeral],
      },
    });
  },
};
