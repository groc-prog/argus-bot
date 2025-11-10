import type { compileFromDefinitions } from '@utils/handlebars';
import { Locale, type ChatInputCommandInteraction, type InteractionReplyOptions } from 'discord.js';

interface Context {
  template?: object;
  interaction?: Omit<InteractionReplyOptions, 'content'>;
}

/**
 * Sends a chat reply which takes the interaction locale into account. Optionally, template context and
 * interaction context can be defined
 * @async
 * @param {ChatInputCommandInteraction} interaction - The current interaction.
 * @param {ReturnType<typeof compileFromDefinitions>} templates - The available to templates to choose from.
 * @param {Context} [context] - Optional context passed to either the interaction or the template.
 */
export async function sendLocalizedReply(
  interaction: ChatInputCommandInteraction,
  templates: ReturnType<typeof compileFromDefinitions>,
  context?: Context,
): Promise<void> {
  const locale = templates.has(interaction.locale) ? interaction.locale : Locale.EnglishUS;
  const templateCtx = context?.template ?? {};
  const interactionCtx = context?.interaction ?? {};

  await interaction.reply({
    content: templates.get(locale)!(templateCtx),
    ...interactionCtx,
  });
}
