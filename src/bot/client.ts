import commands from '@commands/index';
import events from '@events/index';
import baseLogger from '@utils/logger';
import { Client, GatewayIntentBits, REST, Routes, type ClientEvents } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.logger = baseLogger.child({ component: 'bot' });
client.commands = new Map();
client.initialize = async function () {
  try {
    this.logger.info('Initializing Discord bot');
    const token = process.env.DISCORD_BOT_TOKEN;
    const applicationId = process.env.DISCORD_APP_ID;
    if (!token) throw new Error('No bot token defined');
    if (!applicationId) throw new Error('No application ID defined');

    this.logger.info(`Registering ${events.length} events`);
    for (const event of events) {
      this.logger.debug({ event: event.name }, 'Registering event with client');
      const eventName = event.name as keyof ClientEvents;
      const executeFn = event.execute as (...args: unknown[]) => unknown;

      if ('once' in event && event.once) this.once(eventName, executeFn);
      else this.on(eventName, executeFn);
    }

    this.logger.debug(`Adding ${commands.length} commands to client`);
    for (const command of commands) {
      this.logger.info({ command: command.data.name }, 'Adding command to client');
      this.commands.set(command.data.name, command);
    }

    this.logger.debug('Initializing Discord REST client');
    const rest = new REST().setToken(token);

    const body = [...this.commands.values()].map((command) => command.data.toJSON());
    if (process.env.NODE_ENV !== 'production') {
      const testGuildId = process.env.DISCORD_TEST_GUILD_ID;
      if (!testGuildId)
        throw new Error('Running in non-production environment, but no test guild ID defined');

      this.logger.warn(
        { guildId: testGuildId },
        'Running in non-production environment, commands will only be registered for test guild',
      );
      this.logger.info(
        { guildId: testGuildId },
        `Refreshing ${this.commands.size} (/) commands in test guild`,
      );
      await rest.put(Routes.applicationGuildCommands(applicationId, testGuildId), {
        body,
      });
    } else {
      this.logger.info(`Refreshing ${this.commands.size} (/) commands in test guild`);
      await rest.put(Routes.applicationCommands(applicationId), {
        body,
      });
    }

    this.logger.info(`Refreshed ${this.commands.size} (/) commands`);
    this.logger.info('Logging in using token');
    await this.login(token);
  } catch (err) {
    this.logger.error(err, 'Failed to initialize discord bot');
    throw err;
  }
};

export default client;
