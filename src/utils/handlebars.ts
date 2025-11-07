import type { Locale } from 'discord.js';
import Handlebars from 'handlebars';

export interface MessageDefinitions {
  [Locale.EnglishUS]: string;
  [Locale.German]: string;
}

/**
 * Compiles all definitions into ready-to-use Handlebar templates.
 * @param {MessageDefinitions} definitions - The template definitions.
 * @returns {Map<string, HandlebarsTemplateDelegate>} A map containing all pre-compiled handlebar
 * templates by locale.
 */
export function compileFromDefinitions(
  definitions: MessageDefinitions,
): Map<string, HandlebarsTemplateDelegate> {
  const templates = new Map<string, HandlebarsTemplateDelegate>();

  for (const locale in definitions) {
    templates.set(
      locale,
      Handlebars.compile(definitions[locale as keyof MessageDefinitions], { noEscape: true }),
    );
  }

  return templates;
}
