import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { heading, inlineCode, Locale } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading('🔒 Oopsie daisy, looks like this feature is not configured yet')}
    This feature has to be configured before you can use it. You can ask someone with the ${inlineCode('ManageGuild')} permission to set it up.
  `,
  [Locale.German]: message`
    ${heading('🔒 Hoppla! Diese Funktion ist noch nicht konfiguriert')}
    Dieses Feature muss erst konfiguriert werden, bevor du es nutzen kannst. Du kannst jemanden mit der ${inlineCode('ManageGuild')}-Berechtigung fragen, es richtig aufzusetzen.
  `,
};

export default compileFromDefinitions(definitions);
