import { Locale } from 'discord.js';
import { compileFromDefinitions, type MessageDefinitions } from '../../utils/handlebars';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: 'A little sneak peak on what is waiting for you.',
  [Locale.German]: 'Ein kleiner Vorgeschmack darauf, was dich erwartet.',
};

export default compileFromDefinitions(definitions);
