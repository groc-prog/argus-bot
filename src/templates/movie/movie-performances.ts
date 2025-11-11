import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { bold, heading, inlineCode, Locale, quote } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading('🎬  Upcoming performances')}
    {{#each performances}}
      {{#if theatre}}
        ${bold('Theatre:')} {{theatre}}
      {{/if}}
      ${bold('Showtime:')} {{showtime}}
      {{#if attributes}}
        ${bold('Tags:')} {{attributes}}
      {{/if}}
      {{#if seatClasses}}
        ${bold('Seat Classes:')} {{seatClasses}}
      {{/if}}
      {{#unless @last}}

      {{/unless}}
    {{/each}}

    {{#if showGuildNotificationCommand}}
      ${quote(`Want to get regular movie updates? Just use the ${inlineCode('/{{mentionMeCommand}}')} command and the bot will mention you in future posts.`)}
    {{/if}}
  `,
  [Locale.German]: message`
    ${heading('🎬  Upcoming performances')}
    {{#each performances}}
      {{#if theatre}}
        ${bold('Saal:')} {{theatre}}
      {{/if}}
      ${bold('Vorstellungszeit:')} {{showtime}}
      {{#if attributes}}
        ${bold('Tags:')} {{attributes}}
      {{/if}}
      {{#if seatClasses}}
        ${bold('Sitzkategorien:')} {{seatClasses}}
      {{/if}}
      {{#unless @last}}

      {{/unless}}
    {{/each}}

    {{#if showGuildNotificationCommand}}
      ${quote(`Du willst am laufenden bleiben? Du kannst jederzeit den ${inlineCode('/{{mentionMeCommand}}')} Befehl nutzen, um bei Filmupdates erwähnt zu werden.`)}
    {{/if}}
  `,
};

export default compileFromDefinitions(definitions);
