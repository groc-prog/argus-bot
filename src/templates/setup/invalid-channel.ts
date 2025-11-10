import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { heading, Locale } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading("⚠️ Oh man, that's not a good start")}
    The channel you provided is not suitable for the bot. Make sure the bot has access to the channel with all required permissions and can post in it.
  `,
  [Locale.German]: message`
    ${heading('⚠️ Oh Mann, das ist kein guter Start')}
    Der angegebene Kanal ist für den Bot nicht geeignet. Stelle sicher, dass der Bot Zugriff mit allen erforderlichen Berechtigungen auf den Kanal hat und darin posten kann.
  `,
};

export default compileFromDefinitions(definitions);
