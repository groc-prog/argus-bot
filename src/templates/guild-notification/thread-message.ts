import { bold, heading, HeadingLevel, hideLinkEmbed, hyperlink, Locale, quote } from 'discord.js';
import { message } from '../../utils/string';
import { compileFromDefinitions, type MessageDefinitions } from '../../utils/handlebars';

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

    {{#if trailerUrl}}
      ${quote(`Watch the trailer ${hyperlink('here', hideLinkEmbed('{{trailerUrl}}'))} to get a taste of what the movie is like!`)}
    {{/if}}

    ${heading('🎬  Upcoming performances', HeadingLevel.Two)}
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

    {{#if trailerUrl}}
      ${quote(`Sieh dir den Trailer ${hyperlink('hier', hideLinkEmbed('{{trailerUrl}}'))} an, um einen Vorgeschmack auf den Film zu bekommen!`)}
    {{/if}}

    ${heading('🎬  Upcoming performances', HeadingLevel.Two)}
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
  `,
};

export default compileFromDefinitions(definitions);
