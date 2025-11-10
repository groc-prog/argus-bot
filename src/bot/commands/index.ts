import movieInfoCommand from '@commands/movies/info';
import moviePerformancesCommand from '@commands/movies/performances';
import mentionMeCommand from '@commands/notifications/mention-me';
import unmentionMeCommand from '@commands/notifications/unmention-me';
import setupCommand from '@commands/utils/setup';
import statusCommand from '@commands/utils/status';

export default [
  setupCommand,
  statusCommand,
  mentionMeCommand,
  unmentionMeCommand,
  moviePerformancesCommand,
  movieInfoCommand,
];
