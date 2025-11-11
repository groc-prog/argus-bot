import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { heading, inlineCode, Locale, quote } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading("🎉 Woosh — and it's gone!")}
    You will no longer get any mentions for movie updates by the bot. Though you will still be able to view all updates the bot got for you.

    ${quote(`Want to get updates again? Just use the ${inlineCode('/{{mentionMeCommand}}')} command and the bot will mention you in future posts.`)}
  `,
  [Locale.German]: message`
    ${heading('🎉 Woosh — und weg!')}
    Du wirst ab jetzt nicht mehr erwähnt, wenn der Bot neue Filmupdates posted. Du kannst dir trotzdem jederzeit alle Neuigkeiten ansehen.

    ${quote(`Du willst wieder am laufenden bleiben? Du kannst jederzeit den ${inlineCode('/{{mentionMeCommand}}')} Befehl nutzen, um bei Filmupdates wieder erwähnt zu werden.`)}
  `,
};

export default compileFromDefinitions(definitions);
