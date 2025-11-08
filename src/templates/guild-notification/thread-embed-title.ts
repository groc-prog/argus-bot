import { Locale } from 'discord.js';
import { compileFromDefinitions, type MessageDefinitions } from '../../utils/handlebars';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: 'Preview',
  [Locale.German]: 'Vorschau',
};

export default compileFromDefinitions(definitions);
