import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { bold, heading, hideLinkEmbed, hyperlink, inlineCode, Locale, quote } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading('🍿  {{title}}  🍿')}
    {{#if description}}
      {{description}}
    {{/if}}

    {{#if lengthMinutes}}
      ${bold('Length:')} {{lengthMinutes}} minutes
    {{/if}}
    {{#if fsk}}
      ${bold('FSK Rating:')} {{fsk}}
    {{/if}}
    {{#if genres}}
      ${bold('Genres:')} {{genres}}
    {{/if}}
    {{#if attributes}}
      ${bold('Tags:')} {{attributes}}
    {{/if}}

    {{#if trailerUrl}}
      ${quote(`Watch ${hyperlink('the trailer', hideLinkEmbed('{{trailerUrl}}'))} to get a taste of what the movie is like!`)}
    {{/if}}
    ${quote(`Interested in the movie and when you can watch it? You can check all of the available performances using the ${inlineCode('/{{performancesCommand}}')} command.`)}
    {{#if showGuildNotificationCommand}}
      ${quote(`Want to get regular movie updates? Just use the ${inlineCode('/{{mentionMeCommand}}')} command and the bot will mention you in future posts.`)}
    {{/if}}
  `,
  [Locale.German]: message`
    ${heading('🍿  {{title}}  🍿')}
    {{#if description}}
      {{description}}
    {{/if}}

    {{#if lengthMinutes}}
      ${bold('Länge:')} {{lengthMinutes}} Minuten
    {{/if}}
    {{#if fsk}}
      ${bold('FSK:')} {{fsk}}
    {{/if}}
    {{#if genres}}
      ${bold('Genres:')} {{genres}}
    {{/if}}
    {{#if attributes}}
      ${bold('Tags:')} {{attributes}}
    {{/if}}

    {{#if trailerUrl}}
      ${quote(`Sieh dir ${hyperlink('den Trailer', hideLinkEmbed('{{trailerUrl}}'))} an, um einen Vorgeschmack auf den Film zu bekommen!`)}
    {{/if}}
    ${quote(`Dich interessiert der Film und du willst wissen, wann du ihn dir ansehen kannst? Du kannst alle Vorstellungen über den Befehl ${inlineCode('/{{performancesCommand}}')} abrufen.`)}
    {{#if showGuildNotificationCommand}}
      ${quote(`Du willst am laufenden bleiben? Du kannst jederzeit den ${inlineCode('/{{mentionMeCommand}}')} Befehl nutzen, um bei Filmupdates erwähnt zu werden.`)}
    {{/if}}
  `,
};

export default compileFromDefinitions(definitions);
