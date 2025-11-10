import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { heading, Locale } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading("⚠️ Oh man, that's not a good start")}
    The role you provided is not suitable for the bot. Make sure the bot has the required permissions to assign/unassign this role to/from users.
  `,
  [Locale.German]: message`
    ${heading('⚠️ Oh Mann, das ist kein guter Start')}
    Die von dir angegebene Rolle ist für den Bot nicht geeignet. Stelle sicher, dass der Bot die erforderlichen Berechtigungen hat, um diese Rolle Benutzern zuzuweisen oder von ihnen zu entfernen.
  `,
};

export default compileFromDefinitions(definitions);
