import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { heading, inlineCode, Locale, quote } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading('🎉 We are all set!')}
    From now on, you will get mentioned each time the bot posts new movie updates. I hope you are ready for what's coming!

    ${quote(`Want the bot to stop? Just use the ${inlineCode('/{{unmentionMeCommand}}')} command and the bot will no longer mention you.`)}
  `,
  [Locale.German]: message`
    ${heading('🎉 Wir sind startbereit!')}
    Du wirst ab jetzt jedes mal erwähnt, wenn der Bot Filmupdates postet. Ich hoffe, du bist für die Welle an Filmen bereit.

    ${quote(`Du hast keinen Bock mehr, vom Bot erwähnt zu werden? Du kannst jederzeit den ${inlineCode('/{{unmentionMeCommand}}')} Befehl nutzen, um nicht mehr erwähnt zu werden.`)}
  `,
};

export default compileFromDefinitions(definitions);
