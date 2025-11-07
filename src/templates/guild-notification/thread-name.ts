import { Locale } from 'discord.js';
import { compileFromDefinitions, type MessageDefinitions } from '../../utils/handlebars';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: '[{{date}}] 📢 Movie announcements',
  [Locale.German]: '[{{date}}] 📢 Filmankündigungen',
};

export default compileFromDefinitions(definitions);
