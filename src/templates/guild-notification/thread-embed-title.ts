import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { Locale } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: 'Preview',
  [Locale.German]: 'Vorschau',
};

export default compileFromDefinitions(definitions);
