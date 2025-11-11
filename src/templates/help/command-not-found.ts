import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { heading, Locale } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading("🔍 Weird, looks like the bot can't find that one")}
    Whatever command you need help with, the bot does not know that command either. Make sure that you are asking the correct bot for help with the correct command.
  `,
  [Locale.German]: message`
    ${heading('🔍 Seltsam, scheint so, als könnte der Bot diesen Befehl nicht finden')}
    Egal, bei welchem Befehl du Hilfe brauchst — der Bot kennt diesen Befehl ebenfalls nicht. Stelle sicher, dass du den richtigen Bot mit dem richtigen Befehl um Hilfe bittest.
  `,
};

export default compileFromDefinitions(definitions);
