import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { Locale } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: '[{{date}}] 📢 Movie announcements',
  [Locale.German]: '[{{date}}] 📢 Filmankündigungen',
};

export default compileFromDefinitions(definitions);
