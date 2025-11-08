import { Locale, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('movie-performances')
    .setNameLocalization(Locale.German, 'film-vorstellungen')
    .setDescription('Look at all known performances for a movie.')
    .setDescriptionLocalization(
      Locale.German,
      'Schau dir alle bekannten Vorstellungen für einen Film an.',
    ),

  // async execute(interaction: ChatInputCommandInteraction) {},
};
