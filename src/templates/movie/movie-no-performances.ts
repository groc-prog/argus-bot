import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { heading, Locale } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading("🔍 Oh man, I'm sorry")}
    Unlucky, look's like the cinema is not showing this one any longer. It might have been shown in the past or is not being shown yet. Check back at another time to see if it becomes available.
  `,
  [Locale.German]: message`
    ${heading('🔍 Oh Mann, das tut mir leid')}
    Sieht so aus, als ob dieser Film gerade nicht im Kino ist. Er wurde vielleicht in der Vergangenheit gezeigt oder wird kommt demnächst erst ins Kino. Komm später nochmal wieder, um zu sehen, ob sich was geändert hat.
  `,
};

export default compileFromDefinitions(definitions);
