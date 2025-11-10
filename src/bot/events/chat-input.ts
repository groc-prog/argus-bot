/* eslint-disable @typescript-eslint/unbound-method */

import client from '@bot-client';
import fallbackErrorTemplates from '@templates/fallback/error';
import { sendLocalizedReply } from '@utils/discord';
import { interactionContextAwareLogger } from '@utils/logger';
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Events,
  MessageFlags,
  type Interaction,
} from 'discord.js';

export default {
  name: Events.InteractionCreate,

  async execute(interaction: Interaction) {
    const logger = interactionContextAwareLogger(interaction, interaction.client.logger.bindings());

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        logger.info('Responding to chat input command interaction');

        if (!('execute' in command)) throw new Error('Command does not expose `execute` function');

        const executeFn = command.execute as (
          interaction: ChatInputCommandInteraction,
        ) => Promise<void>;

        await executeFn(interaction);
        logger.info('Chat input command interaction finished');
      } catch (err) {
        logger.error(err, 'Error during chat input command interaction');
        await sendLocalizedReply(interaction, fallbackErrorTemplates, {
          interaction: {
            flags: [MessageFlags.Ephemeral],
          },
        });
      }
    }

    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        logger.info('Responding to autocomplete interaction');

        if (!('autocomplete' in command))
          throw new Error('Command does not expose `autocomplete` function');

        const autocompleteFn = command.autocomplete as (
          interaction: AutocompleteInteraction,
        ) => Promise<void>;

        await autocompleteFn(interaction);
        logger.info('Autocomplete interaction finished');
      } catch (err) {
        logger.error(err, 'Error during autocomplete interaction');
        await interaction.respond([]);
      }
    }
  },
};
