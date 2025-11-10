import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { heading, Locale } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading('💥 Oh dang, looks like something is pretty fucked up')}
    I have no idea why, but I think something is pretty fucked up at the servers right now. Whatever it is, it will be fixed shortly (maybe).
  `,
  [Locale.German]: message`
    ${heading('💥 Oh man, scheint, als ob irgendwas richtig im Arsch ist')}
    Ich weiß nicht warum, aber irgendwas ist gerade richtig schief gelaufen. Was auch immer es ist, das Problem wird bald beseitigt sein (wahrscheinlich).
  `,
};

export default compileFromDefinitions(definitions);
