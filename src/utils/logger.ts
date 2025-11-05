import pino from 'pino';
import packageJson from '../../package.json';
import type { Interaction } from 'discord.js';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    bindings: (bindings) => ({
      ...bindings,
      environment: process.env.NODE_ENV ?? 'unknown',
      version: packageJson.version,
      bun: Bun.version,
    }),
    level: (label) => ({
      level: label.toUpperCase(),
    }),
  },
});

/**
 * Creates a new child logger with context from a Discord interaction.
 * @param {Interaction} interaction - The interaction to add context from.
 * @param {pino.Bindings} [context] - Additional context bound to the logger.
 * @returns {pino.Logger} A new logger instance with the bound interaction context.
 */
export function interactionContextAwareLogger(
  interaction: Interaction,
  context?: pino.Bindings,
): pino.Logger {
  const boundContext: pino.Bindings = {
    discord: {
      ...context,
      interactionType: interaction.type,
      userId: interaction.user.id,
      guildId: interaction.guildId ?? undefined,
      locale: interaction.locale,
      type: interaction.type,
      command: interaction.isCommand() ? interaction.commandName : undefined,
    },
  };

  return logger.child(boundContext);
}

export default logger;
