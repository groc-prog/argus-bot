import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import {
  heading,
  hideLinkEmbed,
  hyperlink,
  inlineCode,
  Locale,
  quote,
  roleMention,
} from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading("📢  ATTENTION PLEASE — Today's movie updates are in!  📢")}
    {{#if mentionedRoleId}}${roleMention('{{mentionedRoleId}}')} {{/if}}Just checked the theatre and we've got the latest on what's playing today!
    Scroll through, pick your favorites, and maybe plan a movie night — I've got your back with all the showtimes.

    ${quote(`Like what you see and want to know more? You can check all info for a single movie using ${inlineCode('/{{infoCommand}}')}{{#if mentionedRoleId}} or get notified for all future updates like this by using the ${inlineCode('/{{subscribeCommand}}')} command.{{else}}.{{/if}}`)}
    ${quote(`Not all seat classes may be available anymore. You can check the ${hyperlink('seating situation', hideLinkEmbed('{{websiteUrl}}'))} yourself.`)}
    {{#if performancesTruncated}}
      ${quote(`Only the first 3 performances are shown for each movie. You can check all of them using the ${inlineCode('/{{performancesCommand}}')} command.`)}
    {{/if}}
    `,
  [Locale.German]: message`
    ${heading('📢  ACHTUNG — Die heutigen Film-Updates sind da!  📢')}
    {{#if mentionedRoleId}}${roleMention('{{mentionedRoleId}}')} {{/if}}Hab gerade im Kino nachgeschaut und wir haben die neuesten Infos, was heute läuft :popcorn:
    Scroll dich durch, such dir deine Favoriten aus und plan vielleicht einen Kinoabend — ich hab die Showtimes für dich im Blick.

    ${quote(`Dir gefällt was du siehst und du willst mehr wissen?. Du kannst alle Info's über einen Film mit ${inlineCode('/{{infoCommand}}')} abrufen{{#if mentionedRoleId}} oder alle zukünftigen Filmupdates mit ${inlineCode('/{{subscribeCommand}}')} abonnieren.{{else}}.{{/if}}`)}
    ${quote(`Nicht alle Sitzkategorien sind möglicherweise noch verfügbar. Du kannst ${hyperlink('die Sitzplatzsituation', hideLinkEmbed('{{websiteUrl}}'))} selbst checken.`)}
    {{#if performancesTruncated}}
      ${quote(`Es werden hier nur die ersten 3 Vorstellungen für jeden Film angezeigt. Du kannst alle über den Befehl ${inlineCode('/{{performancesCommand}}')} abrufen.`)}
    {{/if}}
  `,
};

export default compileFromDefinitions(definitions);
