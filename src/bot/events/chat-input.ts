import client from '@bot-client';
import { interactionContextAwareLogger } from '@utils/logger';
import { Events, type Interaction } from 'discord.js';

export default {
  name: Events.InteractionCreate,

  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const logger = interactionContextAwareLogger(interaction, interaction.client.logger.bindings());
    try {
      logger.info('Responding to interaction');
      await command.execute(interaction);
      logger.info('Interaction finished');
    } catch (err) {
      logger.error(err, 'Error during interaction');
    }
  },
};
