import { merge } from '@utils/object';
import type { Interaction } from 'discord.js';
import fs from 'node:fs/promises';
import path from 'path';
import pino, { type TransportTargetOptions } from 'pino';
import packageJson from '../../package.json';

const transportTargets: TransportTargetOptions[] = [
  {
    target: 'pino/file',
  },
];

if (process.env.NODE_ENV === 'production') {
  const logsDirectory = path.join(process.cwd(), 'logs');
  if (!(await fs.exists(logsDirectory))) await fs.mkdir(logsDirectory, { recursive: true });

  transportTargets.push({
    target: 'pino/file',
    options: { destination: path.join(logsDirectory, 'app.log') },
  });
}

const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      bindings: (bindings) => ({
        ...bindings,
        environment: process.env.NODE_ENV ?? 'unknown',
        version: packageJson.version,
        bun: Bun.version,
      }),
    },
  },
  pino.transport({
    targets: transportTargets,
  }) as pino.DestinationStream,
);

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
  const boundContext = merge(context ?? {}, {
    discord: {
      interactionType: interaction.type,
      user: interaction.user.id,
      guild: interaction.guildId ?? undefined,
      locale: interaction.locale,
      type: interaction.type,
      command: interaction.isCommand() ? interaction.commandName : undefined,
    },
  } as pino.Bindings);

  return logger.child(boundContext);
}

export default logger;
