import chatInputEvent from '@events/chat-input';
import guildCreateEvent from '@events/guild-create';
import guildDeleteEvent from '@events/guild-delete';
import readyEvent from '@events/ready';

export default [readyEvent, chatInputEvent, guildCreateEvent, guildDeleteEvent];
