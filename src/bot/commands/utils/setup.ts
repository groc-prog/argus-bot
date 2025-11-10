import statusCommand from '@commands/utils/status';
import { GuildConfigurationModel } from '@models/guild-configuration';
import missingPermissionTemplates from '@templates/fallback/missing-permission';
import configurationUpdatedTemplates from '@templates/setup/configuration-updated';
import invalidChannelTemplates from '@templates/setup/invalid-channel';
import invalidRoleTemplates from '@templates/setup/invalid-role';
import invalidScheduleTemplates from '@templates/setup/invalid-schedule';
import { sendLocalizedReply } from '@utils/discord';
import { interactionContextAwareLogger } from '@utils/logger';
import { Cron } from 'croner';
import {
  AutocompleteInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  InteractionContextType,
  Locale,
  MessageFlags,
  NewsChannel,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';

import GuildNotificationService from '@services/guild-notifications';
import guildNotFoundTemplates from '@templates/fallback/guild-not-found';
import Fuse from 'fuse.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure the bot to your specific needs.')
    .setDescriptionLocalization(
      Locale.German,
      'Konfiguriere den Bot so wie du es dir am besten passt.',
    )
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('schedule')
        .setNameLocalization(Locale.German, 'zeitplan')
        .setDescription('The schedule used by the bot to post movie updates.')
        .setDescriptionLocalization(
          Locale.German,
          'Der Zeitraum, in dem der Bot Filmupdates postet.',
        ),
    )
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setNameLocalization(Locale.German, 'kanal')
        .setDescription('The channel used by the bot to post updates in.')
        .setDescriptionLocalization(
          Locale.German,
          'Der vom Bot benutzte Kanal, um Filmupdates zu posten.',
        )
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addRoleOption((option) =>
      option
        .setName('mentioned-role')
        .setNameLocalization(Locale.German, 'erwähnte-rolle')
        .setDescription('A role which the bot will mention when posting new updates.')
        .setDescriptionLocalization(
          Locale.German,
          'Eine Rolle, die vom Bot beim Posten von Updates erwähnt wird.',
        ),
    )
    .addBooleanOption((option) =>
      option
        .setName('post-movie-updates')
        .setNameLocalization(Locale.German, 'filmupdates-posten')
        .setDescription('Whether the bot should post movie updates in a dedicated channel.')
        .setDescriptionLocalization(
          Locale.German,
          'Ob der Bot in einem Kanal Filmupdates posten soll.',
        ),
    )
    .addBooleanOption((option) =>
      option
        .setName('link-trailer')
        .setNameLocalization(Locale.German, 'trailer-verlinken')
        .setDescription('Whether to link the trailer of the movie (when available)')
        .setDescriptionLocalization(
          Locale.German,
          'Ob der Bot in den Filmtrailer (wenn verfügbar) verlinken soll.',
        ),
    )
    .addBooleanOption((option) =>
      option
        .setName('embed-poster')
        .setNameLocalization(Locale.German, 'poster-anhängen')
        .setDescription('Whether to link the poster of the movie (when available)')
        .setDescriptionLocalization(
          Locale.German,
          'Ob der Bot in das Poster (wenn verfügbar) verlinken soll.',
        ),
    )
    .addStringOption((option) =>
      option
        .setName('preferred-timezone')
        .setNameLocalization(Locale.German, 'bevorzugte-zeitzone')
        .setDescription('The preferred timezone to use when posting movie updates.')
        .setDescriptionLocalization(
          Locale.German,
          'Die bevorzugte Zeitzone, die bei Filmupdates genutzt wird.',
        )
        .setAutocomplete(true),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const schedule = interaction.options.getString('schedule');
    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('mentioned-role');
    const enabled = interaction.options.getBoolean('post-movie-updates');
    const linkTrailer = interaction.options.getBoolean('link-trailer');
    const embedPoster = interaction.options.getBoolean('embed-poster');
    const timezone = interaction.options.getString('preferred-timezone');

    const logger = interactionContextAwareLogger(interaction, {
      schedule,
      channel,
      role,
      enabled,
      linkTrailer,
      embedPoster,
      timezone,
    });

    const permissions = interaction.member?.permissions;
    if (typeof permissions === 'string' || !permissions?.has(PermissionFlagsBits.ManageGuild)) {
      await sendLocalizedReply(interaction, missingPermissionTemplates, {
        interaction: {
          flags: [MessageFlags.Ephemeral],
        },
      });
      return;
    }

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
    const oldSchedule = configuration.notificationSchedule;

    if (enabled) configuration.notificationsEnabled = enabled;
    if (linkTrailer) configuration.includeTrailerInNotifications = linkTrailer;
    if (embedPoster) configuration.includePosterInNotifications = embedPoster;
    if (timezone) configuration.preferredTimezone = timezone;

    if (schedule) {
      logger.info('Validating CRON schedule');
      try {
        const job = new Cron(schedule);
        job.stop();

        logger.debug('CRON schedule valid, assigning new value to configuration');
        configuration.notificationSchedule = schedule;
      } catch (err) {
        logger.error(err, 'Invalid CRON schedule provided');
        await sendLocalizedReply(interaction, invalidScheduleTemplates, {
          template: { schedule },
          interaction: {
            flags: [MessageFlags.Ephemeral],
          },
        });
        return;
      }
    }

    if (channel) {
      let resolvedChannel: NewsChannel | TextChannel | null = null;
      try {
        configuration.notificationChannelId = channel.id;
        resolvedChannel = await configuration.resolveChannel();
      } catch (err) {
        logger.error(err, 'Invalid channel provided');
      }

      if (!resolvedChannel) {
        await sendLocalizedReply(interaction, invalidChannelTemplates, {
          interaction: {
            flags: [MessageFlags.Ephemeral],
          },
        });
        return;
      }
    }

    if (role) {
      let resolvedRole: Role | null = null;
      try {
        configuration.notificationMentionedRoleId = role.id;
        resolvedRole = await configuration.resolveMentionedRole();
      } catch (err) {
        logger.info(err, 'Invalid role provided');
      }

      if (!resolvedRole) {
        await sendLocalizedReply(interaction, invalidRoleTemplates, {
          interaction: {
            flags: [MessageFlags.Ephemeral],
          },
        });
        return;
      }
    }

    logger.info('Saving updated configuration');
    await configuration.save();

    const guildNotificationService = GuildNotificationService.currentInstance();
    guildNotificationService.updateSchedule(
      configuration.guildId,
      oldSchedule,
      configuration.notificationSchedule,
    );

    const resolvedChannel = await configuration.resolveChannel();
    const resolvedRole = await configuration.resolveMentionedRole();

    await sendLocalizedReply(interaction, configurationUpdatedTemplates, {
      template: {
        hasChanges:
          schedule || channel || role || enabled || linkTrailer || embedPoster || timezone,
        channel: resolvedChannel?.name,
        schedule: configuration.notificationSchedule,
        mentionedRole: resolvedRole?.name,
        enabled: configuration.notificationsEnabled,
        includeTrailers: configuration.includeTrailerInNotifications,
        includePosters: configuration.includePosterInNotifications,
        timezone: configuration.preferredTimezone,
      },
      interaction: {
        flags: [MessageFlags.Ephemeral],
      },
    });
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    const logger = interactionContextAwareLogger(interaction);
    const focusedOptionValue = interaction.options.getFocused(true);

    logger.info('Getting autocomplete options for preferred timezone');
    const timezones = Intl.supportedValuesOf('timeZone').map((timezone) => ({
      name: timezone,
      value: timezone,
    }));

    if (focusedOptionValue.value.trim().length === 0) {
      logger.debug('No input to filter yet, returning first 25 options');
      await interaction.respond(timezones.slice(0, 25));
      return;
    }

    logger.debug('Fuzzy searching timezone options');
    const fuse = new Fuse(timezones, {
      keys: ['name'],
    });
    const matches = fuse.search(focusedOptionValue.value);

    await interaction.respond(matches.slice(0, 25).map((match) => match.item));
  },
};
