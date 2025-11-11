import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { heading, Locale } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading("🔍 Weird, looks like the bot can't find that one")}
    Whatever the movie you wanted to view, look's like the bot can't help you there. The bot only knows about movies which have been playing or are currently playing. But I can guarantee you that all of the suggested movies will work.
  `,
  [Locale.German]: message`
    ${heading('🔍 Seltsam, scheint so, als könnte der Bot diesen Film nicht finden')}
    Egal, welchen Film du dir ansehen wolltest – der Bot kann dir dabei leider nicht helfen. Er kennt nur Filme, die bereits liefen oder derzeit im Kino sind. Aber ich kann dir garantieren, dass alle vorgeschlagenen Filme funktionieren werden.
  `,
};

export default compileFromDefinitions(definitions);
