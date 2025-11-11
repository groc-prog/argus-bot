import movieInfoCommand from '@commands/movies/info';
import moviePerformancesCommand from '@commands/movies/performances';
import mentionMeCommand from '@commands/notifications/mention-me';
import unmentionMeCommand from '@commands/notifications/unmention-me';
import setupCommand from '@commands/utils/setup';
import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import {
  bold,
  heading,
  HeadingLevel,
  inlineCode,
  italic,
  Locale,
  quote,
  unorderedList,
} from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    {{#if ${setupCommand.data.name}}}
      ${heading(`🧩  The ${inlineCode('/{{commandName}}')} command  🧩`)}
      Available for: ${bold('users with "Manage Server" permission')}

      ${heading('What does it do?', HeadingLevel.Two)}
      This command allows you to define how the bot works and behaves. This includes the following settings:
      ${unorderedList([
        `Whether the bot should post ${italic('movie updates')}`,
        'The channel in which the bot will post updates',
        'The schedule at which updates should be posted',
        'An optional role which can be mentioned for each movie update',
        'Whether trailers for movies should be included in the posts',
        'Whether poster previews for movies should be included in the posts',
        'The timezone which the bot should use for any included movie performances',
      ])}

      ${heading('How do movie updates work?', HeadingLevel.Two)}
      The bot posts any movie updates in regular intervals in the configured channel, if any are available. Each update will contain a summary of one or multiple movies and it's/their performances based on your configuration. Movie updates can either be enabled for a given interval or completely disabled, which will prevent the bot from posting anything at all. The bot can still be interacted with for other stuff, such as looking up movie details with the ${inlineCode('/{{infoCommand}}')} command.
      For this to work as expected, the bot needs a number of permissions.

      ${heading('Needed permissions', HeadingLevel.Three)}
      Since the bot needs to perform a number of actions, the bots needs ${bold('at least')} the following permissions in the server he is installed in:
      ${unorderedList([
        bold('Create Public Threads'),
        bold('Send Messages in Threads'),
        bold('Send Messages'),
        bold('View Channels'),
      ])}

      Depending on your configuration, the bot will also require the following ${bold('additional permissions')}:
      ${unorderedList([
        `${bold('Embed Links')} (used to embed posters)`,
        `${bold('Manage Roles')} (used to assign the mentioned role to users, only needed when you want members to be able to handle mentions themselves)`,
        `${bold('Mention Everyone')} (used to mention the defined role when updates are posted)`,
      ])}

      ${quote('The bot might run into unexpected issues if he is missing the required permissions to perform certain actions.')}
    {{/if}}
    {{#if ${mentionMeCommand.data.name}}}
      ${heading(`🧩  The ${inlineCode('/{{commandName}}')} command  🧩`)}
      Available for: ${bold('everybody')}

      ${quote('🔒 This feature needs to be enabled in the configuration to work.')}

      ${heading('What does it do?', HeadingLevel.Two)}
      This command allows users to subscribe to movie updates from the bot. Running this command will assign you a role which will be mentioned in each update from the bot (if configured). This allows you to stay up-to-date with everything the bot has to report.

      ${heading('Requirements to be able to use this command', HeadingLevel.Two)}
      As mentioned before, this command can only be used if the bot is configured to do so. For this the following configuration options must be set:
      ${unorderedList([
        `A ${bold('channel for updates')} has to be configured`,
        `A ${bold('role the bot can mention')} has to be configured`,
      ])}

      ${heading('Role permissions', HeadingLevel.Three)}
      The role itself does not need any special permissions, since it will only be used to mention users. However, you need to make sure the bot can assign the role to users. For this, the role must have a ${bold('lower role ranking')} than ${bold("the bot's role")} for him to be able to assign it (and of course the bot must have the ${bold('Manage Roles')} permission).
    {{/if}}
    {{#if ${unmentionMeCommand.data.name}}}
      ${heading(`🧩  The ${inlineCode('/{{commandName}}')} command  🧩`)}
      Available for: ${bold('everybody')}

      ${quote('🔒 This feature needs to be enabled in the configuration to work.')}

      ${heading('What does it do?', HeadingLevel.Two)}
      This command allows users to unsubscribe from movie updates from the bot. Running this command will remove the role previously assign to you if you ran the ${inlineCode('/{{mentionMeCommand}}')} command. You will no longer be mentioned in movie updates by the bot after running this command.

      ${heading('Requirements to be able to use this command', HeadingLevel.Two)}
      As mentioned before, this command can only be used if the bot is configured to do so. For this the following configuration options must be set:
      ${unorderedList([
        `A ${bold('channel for updates')} has to be configured`,
        `A ${bold('role the bot can mention')} has to be configured`,
      ])}

      ${heading('Role permissions', HeadingLevel.Three)}
      The role itself does not need any special permissions, since it will only be used to mention users. However, you need to make sure the bot can assign the role to users. For this, the role must have a ${bold('lower role ranking')} than ${bold("the bot's role")} for him to be able to remove it (and of course the bot must have the ${bold('Manage Roles')} permission).
    {{/if}}
    {{#if ${movieInfoCommand.data.name}}}
      ${heading(`🧩  The ${inlineCode('/{{commandName}}')} command  🧩`)}
      Available for: ${bold('everybody')}

      ${heading('What does it do?', HeadingLevel.Two)}
      This command shows detailed information about a given movie. This is basically the same information which the movie updates from the bot also contain, with the exception that this can also be done for movies which currently ${bold('do not have any performances scheduled')}.

      ${quote('The bot is no wizard, and thus does not know all movies ever created. His knowledge is limited to the movies which have been shown since he went online.')}
    {{/if}}
    {{#if ${moviePerformancesCommand.data.name}}}
      ${heading(`🧩  The ${inlineCode('/{{commandName}}')} command  🧩`)}
      Available for: ${bold('everybody')}

      ${heading('What does it do?', HeadingLevel.Two)}
      This command shows any known planned performances for a movie. It's similar to the performances shown in the bot's updates, with the difference being that the ${bold('max. number of shown performances')} shown here is ${bold('limited to 10')}. This is due to the limit on characters in a discord message.

      ${quote('The bot is no wizard, and thus does not know all movies ever created. His knowledge is limited to the movies which have been shown since he went online.')}
    {{/if}}
  `,
  [Locale.German]: message`
    {{#if ${setupCommand.data.name}}}
      ${heading(`🧩  Der ${inlineCode('/{{commandName}}')} Befehl  🧩`)}
      Verfügbar für: ${bold('Benutzer mit "Server Verwalten" Berechtigung')}

      ${heading('Was macht der Befehl?', HeadingLevel.Two)}
      Mit diesem Befehl kannst du festlegen, wie der Bot arbeitet und sich verhält. Dazu gehören folgende Einstellungen:
      ${unorderedList([
        `Ob der Bot ${italic('Film-Updates')} posten soll`,
        'Der Kanal, in dem der Bot Updates posten wird',
        'Der Zeitplan, nach dem Updates gepostet werden sollen',
        'Eine optionale Rolle, die bei jedem Film-Update erwähnt werden kann',
        'Ob Trailer zu den Filmen in den Posts enthalten sein sollen',
        'Ob Poster-Vorschauen zu den Filmen in den Posts enthalten sein sollen',
        'Die Zeitzone, die der Bot für alle enthaltenen Filmvorführungen verwenden soll',
      ])}

      ${heading('Wie funktionieren Film-Updates?', HeadingLevel.Two)}
      Der Bot postet verfügbare Film-Updates in regelmäßigen Abständen im konfigurierten Kanal. Jedes Update enthält eine Zusammenfassung von einem oder mehreren Filmen und deren Vorführungen basierend auf deiner Konfiguration. Film-Updates können entweder für ein bestimmtes Intervall aktiviert oder vollständig deaktiviert werden. Befehl wie ${inlineCode('/{{infoCommand}}')} sind weiterhin verfügbar.
      Damit alles wie erwartet funktioniert, benötigt der Bot eine Reihe von Berechtigungen.

      ${heading('Benötigte Berechtigungen', HeadingLevel.Three)}
      Da der Bot verschiedene Aktionen ausführen muss, benötigt er ${bold('mindestens')} die folgenden Berechtigungen auf dem Server, auf dem er installiert ist:
      ${unorderedList([
        bold('Öffentliche Threads erstellen'),
        bold('Nachrichten in Threads senden'),
        bold('Nachrichten senden'),
        bold('Kanäle anzeigen'),
      ])}

      Je nach Konfiguration benötigt der Bot außerdem die folgenden ${bold('zusätzlichen Berechtigungen')}:
      ${unorderedList([
        `${bold('Embed-Links')} (wird verwendet, um Poster einzubetten)`,
        `${bold('Rollen verwalten')} (wird verwendet, um die definierte Rolle zuzuweisen. Nur nötig, wenn Mitglieder die Erwähnungen selbst steuern können sollen)`,
        `${bold('Alle erwähnen')} (wird verwendet, um die definierte Rolle bei Updates zu erwähnen)`,
      ])}

      ${quote('Der Bot könnte auf unerwartete Probleme stoßen, wenn ihm die erforderlichen Berechtigungen fehlen, um bestimmte Aktionen auszuführen.')}
    {{/if}}
    {{#if ${mentionMeCommand.data.name}}}
      ${heading(`🧩  Der ${inlineCode('/{{commandName}}')} Befehl  🧩`)}
      Verfügbar für: ${bold('alle')}

      ${quote('🔒 Diese Funktion muss in der Konfiguration aktiviert sein, damit sie funktioniert.')}

      ${heading('Was macht der Befehl?', HeadingLevel.Two)}
      Mit diesem Befehl können Benutzer Film-Updates vom Bot abonnieren. Wenn du diesen Befehl ausführst, wird dir eine Rolle zugewiesen, die bei jedem Update des Bots erwähnt wird (sofern konfiguriert). So bleibst du immer auf dem neuesten Stand über alles, was der Bot meldet.

      ${heading('Voraussetzungen, um diesen Befehl verwenden zu können', HeadingLevel.Two)}
      Wie bereits erwähnt, kann dieser Befehl nur verwendet werden, wenn der Bot entsprechend konfiguriert ist.
      Dafür müssen die folgenden Konfigurationsoptionen gesetzt sein:
      ${unorderedList([
        `Ein ${bold('Kanal für Updates')} muss konfiguriert sein`,
        `Eine ${bold('vom Bot erwähnbare Rolle')} muss konfiguriert sein`,
      ])}

      ${heading('Rollenberechtigungen', HeadingLevel.Three)}
      Die Rolle selbst benötigt keine besonderen Berechtigungen, da sie nur dazu dient, Benutzer zu erwähnen. Du musst jedoch sicherstellen, dass der Bot die Rolle den Benutzern zuweisen kann. Dafür muss die Rolle eine ${bold('niedrigere Rollenposition')} als ${bold('die Rolle des Bots')} haben, damit der Bot sie zuweisen kann (und natürlich muss der Bot die Berechtigung ${bold('Rollen verwalten')} besitzen).
    {{/if}}
    {{#if ${unmentionMeCommand.data.name}}}
      ${heading(`🧩  Der ${inlineCode('/{{commandName}}')} Befehl  🧩`)}
      Verfügbar für: ${bold('alle')}

      ${quote('🔒 Diese Funktion muss in der Konfiguration aktiviert sein, damit sie funktioniert.')}

      ${heading('Was macht der Befehl?', HeadingLevel.Two)}
      Dieser Befehl ermöglicht es Benutzern, sich von Film-Updates des Bots abzumelden. Wenn du diesen Befehl ausführst, wird dir die Rolle entfernt, die dir zuvor zugewiesen wurde, wenn du den Befehl ${inlineCode('/{{mentionMeCommand}}')} ausgeführt hast. Nach dem Ausführen dieses Befehls wirst du vom Bot in zukünftigen Film-Updates nicht mehr erwähnt.

      ${heading('Voraussetzungen, um diesen Befehl verwenden zu können', HeadingLevel.Two)}
      Wie bereits erwähnt, kann dieser Befehl nur verwendet werden, wenn der Bot entsprechend konfiguriert ist.
      Dafür müssen die folgenden Konfigurationsoptionen gesetzt sein:
      ${unorderedList([
        `Ein ${bold('Kanal für Updates')} muss konfiguriert sein`,
        `Eine ${bold('vom Bot erwähnbare Rolle')} muss konfiguriert sein`,
      ])}

      ${heading('Rollenberechtigungen', HeadingLevel.Three)}
      Die Rolle selbst benötigt keine besonderen Berechtigungen, da sie nur dazu dient, Benutzer zu erwähnen. Du musst jedoch sicherstellen, dass der Bot die Rolle den Benutzern zuweisen kann. Dafür muss die Rolle eine ${bold('niedrigere Rollenposition')} als ${bold('die Rolle des Bots')} haben, damit der Bot sie entfernen kann (und natürlich muss der Bot die Berechtigung ${bold('Rollen verwalten')} besitzen).
    {{/if}}
    {{#if ${movieInfoCommand.data.name}}}
      ${heading(`🧩  Der ${inlineCode('/{{commandName}}')} Befehl  🧩`)}
      Verfügbar für: ${bold('alle')}

      ${heading('Was macht der Befehl?', HeadingLevel.Two)}
      Mit diesem Befehl können detaillierte Informationen zu einem bestimmten Film angezeigt werden. Dies entspricht im Wesentlichen den Informationen, die auch in den Film-Updates des Bots enthalten sind, mit dem Unterschied, dass dies auch für Filme möglich ist, die derzeit ${bold('keine geplanten Vorführungen')} haben.

      ${quote('Der Bot ist kein Zauberer und kennt daher nicht alle jemals produzierten Filme. Sein Wissen beschränkt sich auf die Filme, die gezeigt wurden, seit er das erste Mal das Licht der Welt erblickt hat.')}
    {{/if}}
    {{#if ${moviePerformancesCommand.data.name}}}
      ${heading(`🧩  Der ${inlineCode('/{{commandName}}')} Befehl  🧩`)}
      Verfügbar für: ${bold('alle')}

      ${heading('Was macht der Befehl?', HeadingLevel.Two)}
      Dieser Befehl zeigt alle bekannten geplanten Vorführungen eines Films an. Dies ähnelt den Vorführungen, die auch in den Updates des Bots angezeigt werden, mit dem Unterschied, dass die hier gezeigte ${bold('maximale Anzahl an Vorführungen')} auf ${bold('dies nächsten 10')} begrenzt ist. Dies liegt an der Beschränkung der Zeichenanzahl in einer Discord-Nachricht.

      ${quote('Der Bot ist kein Zauberer und kennt daher nicht alle jemals produzierten Filme. Sein Wissen beschränkt sich auf die Filme, die gezeigt wurden, seit er das erste Mal das Licht der Welt erblickt hat.')}
    {{/if}}
  `,
};

export default compileFromDefinitions(definitions);
