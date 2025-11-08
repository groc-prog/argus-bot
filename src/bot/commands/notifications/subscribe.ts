import { InteractionContextType, Locale, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('subscribe')
    .setNameLocalization(Locale.German, 'abonnieren')
    .setDescription('Get a ping for any future movie notifications in this guild.')
    .setDescriptionLocalization(Locale.German, 'Werde bei allen zukünftigen Filmupdates gepingt.')
    .setContexts(InteractionContextType.Guild),

  // async execute(interaction: ChatInputCommandInteraction) {},
};
