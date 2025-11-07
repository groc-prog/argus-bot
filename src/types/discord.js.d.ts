import 'discord.js';
import type { Logger } from 'pino';

declare module 'discord.js' {
  interface Client {
    /**
     * Initializes the client by registering events and commands. Has to be called before other
     * logic can interact with the client.
     * @async
     */
    initialize(): Promise<void>;
    /**
     * Logger with pre-configured context.
     */
    logger: Logger;
    commands: Map<string, (typeof import('../bot/commands/index').default)[0]>;
  }
}
