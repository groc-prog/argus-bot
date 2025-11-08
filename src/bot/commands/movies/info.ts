import { Locale, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('movie-info')
    .setNameLocalization(Locale.German, 'film-info')
    .setDescription('Look at a movie in more detail.')
    .setDescriptionLocalization(Locale.German, 'Mehr Infos über einen Film erfahren.'),

  // async execute(interaction: ChatInputCommandInteraction) {},
};
