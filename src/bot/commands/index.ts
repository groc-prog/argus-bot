import movieInfoCommand from '@commands/movies/info';
import moviePerformancesCommand from '@commands/movies/performances';
import mentionMeCommand from '@commands/notifications/mention-me';
import unmentionMeCommand from '@commands/notifications/unmention-me';
import helpCommand from '@commands/utils/help';
import setupCommand from '@commands/utils/setup';

export default [
  setupCommand,
  helpCommand,
  mentionMeCommand,
  unmentionMeCommand,
  moviePerformancesCommand,
  movieInfoCommand,
];
