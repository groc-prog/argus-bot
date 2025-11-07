import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('status').setDescription('This is a status command'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply('OK');
  },
};
