import movieInfoCommand from '@commands/movies/info';
import commandHelpTemplates from '@templates/help/command-help';
import commandNotFoundTemplate from '@templates/help/command-not-found';
import { interactionContextAwareLogger } from '@utils/logger';
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  InteractionContextType,
  Locale,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import client from '@bot-client';
import { sendLocalizedReply } from '@utils/discord';
import Fuse from 'fuse.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setNameLocalization(Locale.German, 'hilfe')
    .setDescription('Get help any of the available commands.')
    .setDescriptionLocalization(Locale.German, 'Bekomme Hilfe für alle verfügbaren Befehle.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('command')
        .setNameLocalization(Locale.German, 'befehl')
        .setDescription('The command you need help with.')
        .setDescriptionLocalization(Locale.German, 'Der Befehl, für dne du Hilfe brauchst.')
        .setAutocomplete(true)
        .setRequired(true),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const commandName = interaction.options.getString('command', true);
    const command = client.commands.get(commandName);

    if (!command) {
      await sendLocalizedReply(interaction, commandNotFoundTemplate, {
        interaction: {
          flags: [MessageFlags.Ephemeral],
        },
      });
      return;
    }

    await sendLocalizedReply(interaction, commandHelpTemplates, {
      template: {
        [command.data.name]: true,
        commandName:
          command.data.name_localizations && interaction.locale in command.data.name_localizations
            ? command.data.name_localizations[interaction.locale]
            : command.data.name,
        infoCommand:
          movieInfoCommand.data.name_localizations &&
          interaction.locale in movieInfoCommand.data.name_localizations
            ? movieInfoCommand.data.name_localizations[interaction.locale]
            : movieInfoCommand.data.name,
      },
      interaction: {
        flags: [MessageFlags.Ephemeral],
      },
    });
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    const logger = interactionContextAwareLogger(interaction);
    const focusedOptionValue = interaction.options.getFocused(true);

    logger.info('Getting autocomplete options for commands');
    const commands = Array.from(client.commands.values())
      .map((command) => {
        const displayName =
          command.data.name_localizations && interaction.locale in command.data.name_localizations
            ? command.data.name_localizations[interaction.locale]
            : command.data.name;

        return {
          name: displayName as string,
          value: command.data.name,
        };
      })
      .filter((command) => command.value !== this.data.name);

    if (focusedOptionValue.value.trim().length === 0) {
      logger.debug('No input to filter yet, returning first 25 options');
      await interaction.respond(commands.slice(0, 25));
      return;
    }

    logger.debug('Fuzzy searching command options');
    const fuse = new Fuse(commands, {
      keys: ['name'],
    });
    const matches = fuse.search(focusedOptionValue.value);

    await interaction.respond(matches.slice(0, 25).map((match) => match.item));
  },
};
