import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription("Check the bot's setup and network status.")
    .setDescriptionLocalization(Locale.German, 'Check den Netzwerk- und Setup-Status des Bots.'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply('OK');
  },
};
