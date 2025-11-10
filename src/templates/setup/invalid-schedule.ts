import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { heading, hyperlink, inlineCode, Locale } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading("⚠️ Oh man, that's not a good start")}
    The schedule you provided is invalid or not supported. ${inlineCode('{{schedule}}')} contain a typo or be straight up wrong. You can double-check it with ${hyperlink('this online tool', 'https://crontab.io/validator')} — that should help spot what\'s off.
  `,
  [Locale.German]: message`
    ${heading('⚠️ Oh Mann, das ist kein guter Start')}
    Der angegebene Zeitplan ist ungültig oder wird nicht unterstützt. ${inlineCode('{{schedule}}')} enthält möglicherweise einen Tippfehler oder ist einfach nur falsch. Du kannst ihn mit ${hyperlink('diesem Online-Tool', 'https://crontab.io/validator')} überprüfen — das hilft dir dabei, den Fehler zu finden.
  `,
};

export default compileFromDefinitions(definitions);
