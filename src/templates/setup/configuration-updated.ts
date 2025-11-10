import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { bold, heading, inlineCode, Locale } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    {{#if hasChanges}}
      ${heading('🎉 Done and done!')}
      This bot right here is now ready to get started. Your new configuration was successfully saved.
    {{/if}}
    {{#unless hasChanges}}
    ${heading('🧩 Bot configuration')}
    Here is the currently used configuration. You can change this configuration anytime by defining any of the options for the current command.
    {{/unless}}

    ${bold('Channel:')}  {{#if channel}}${inlineCode('{{channel}}')}{{else}}${inlineCode('NOT CONFIGURED')}{{/if}}
    ${bold('Schedule:')}  {{#if schedule}}${inlineCode('{{schedule}}')}{{else}}${inlineCode('NOT CONFIGURED')}{{/if}}
    ${bold('Mentioned role:')}  {{#if mentionedRole}}${inlineCode('{{mentionedRole}}')}{{else}}${inlineCode('NOT CONFIGURED')}{{/if}}
    ${bold('Updates enabled:')}  {{#if enabled}}${inlineCode('YES')}{{else}}${inlineCode('NO')}{{/if}}
    ${bold('Trailers:')}  {{#if includeTrailers}}${inlineCode('YES')}{{else}}${inlineCode('NO')}{{/if}}
    ${bold('Posters:')}  {{#if includePosters}}${inlineCode('YES')}{{else}}${inlineCode('NO')}{{/if}}
    ${bold('Preferred timezone:')}  ${inlineCode('{{timezone}}')}
  `,
  [Locale.German]: message`
    {{#if hasChanges}}
      ${heading('🎉 Fertig und erledigt!')}
      Dieser Bot ist jetzt bereit, loszulegen. Deine neue Konfiguration wurde erfolgreich übernommen.
    {{/if}}
    {{#unless hasChanges}}
    ${heading('🧩 Bot-Konfiguration')}
    Hier ist die derzeit benutze Konfiguration. Du kannst diese Einstellungen jederzeit ändern, indem du die Optionen dieses Befehls definierst.
    {{/unless}}

    ${bold('Kanal:')}  {{#if channel}}${inlineCode('{{channel}}')}{{else}}${inlineCode('NICHT KONFIGURIERT')}{{/if}}
    ${bold('Zeitplan:')}  {{#if schedule}}${inlineCode('{{schedule}}')}{{else}}${inlineCode('NICHT KONFIGURIERT')}{{/if}}
    ${bold('Erwähnte Rolle:')}  {{#if mentionedRole}}${inlineCode('{{mentionedRole}}')}{{else}}${inlineCode('NICHT KONFIGURIERT')}{{/if}}
    ${bold('Updates aktiviert:')}  {{#if enabled}}${inlineCode('JA')}{{else}}${inlineCode('NEIN')}{{/if}}
    ${bold('Trailer:')}  {{#if includeTrailers}}${inlineCode('JA')}{{else}}${inlineCode('NEIN')}{{/if}}
    ${bold('Poster:')}  {{#if includePosters}}${inlineCode('JA')}{{else}}${inlineCode('NEIN')}{{/if}}
    ${bold('Bevorzugte Zeitzone:')}  ${inlineCode('{{timezone}}')}
  `,
};

export default compileFromDefinitions(definitions);
