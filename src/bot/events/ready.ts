import { Client, Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,

  execute(client: Client<true>) {
    client.logger.info(`Bot ${client.user.tag} ready`);
  },
};
