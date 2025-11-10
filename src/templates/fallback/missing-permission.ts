import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { heading, inlineCode, Locale } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading("⚠️ Wait, that's illegal")}
    This command can only be invoked by someone with the ${inlineCode('ManageGuild')} permission.
  `,
  [Locale.German]: message`
    ${heading('⚠️ Entschuldige, aber das ist höchst illegal')}
    Dieser Befehl kann nur von jemandem ausgeführt werden, der die ${inlineCode('ManageGuild')} Berechtigung hat.
  `,
};

export default compileFromDefinitions(definitions);
