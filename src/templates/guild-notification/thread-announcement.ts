import { heading, hideLinkEmbed, hyperlink, inlineCode, Locale, quote } from 'discord.js';
import { message } from '../../utils/string';
import { compileFromDefinitions, type MessageDefinitions } from '../../utils/handlebars';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading("📢  ATTENTION PLEASE — Today's movie updates are in!  📢")}
    Just checked the theatre and we've got the latest on what's playing today!
    Scroll through, pick your favorites, and maybe plan a movie night — I've got your back with all the showtimes.

    ${quote(`Not all seat classes may be available anymore. You can check the seating situation yourself ${hyperlink('here', hideLinkEmbed('{{websiteUrl}}'))}.`)}
    ${quote(`Only the first 3 performances are shown here. You can check all of them using the ${inlineCode('/{{performancesCommand}}')} command.`)}
  `,
  [Locale.German]: message`
    ${heading('📢  ACHTUNG — Die heutigen Film-Updates sind da!  📢')}
    Hab gerade im Kino nachgeschaut und wir haben die neuesten Infos, was heute läuft :popcorn:
    Scroll dich durch, such dir deine Favoriten aus und plan vielleicht einen Kinoabend — ich hab die Showtimes für dich im Blick.

    ${quote(`Nicht alle Sitzkategorien sind möglicherweise noch verfügbar. Du kannst die Sitzplatzsituation ${hyperlink('hier', hideLinkEmbed('{{websiteUrl}}'))} selbst checken.`)}
    ${quote(`Es werden hier nur die ersten 3 Vorstellungen angezeigt. Du kannst alle über den Befehl ${inlineCode('/{{performancesCommand}}')} abrufen.`)}
  `,
};

export default compileFromDefinitions(definitions);
