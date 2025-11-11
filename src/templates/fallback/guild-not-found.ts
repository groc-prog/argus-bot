import { compileFromDefinitions, type MessageDefinitions } from '@utils/handlebars';
import { message } from '@utils/string';
import { heading, inlineCode, Locale, quote } from 'discord.js';

const definitions: MessageDefinitions = {
  [Locale.EnglishUS]: message`
    ${heading('💥 Oh dang, looks like you made the impossible happen')}
    I don't know how you did it, but it looks like the bot should not even be here!?!? Eh, might have just been a network issue. Who even cares, the point is the bot fucked up, meaning you should probably try again.

    ${quote(`If this keeps failing, you can check the bot's current network and setup status using ${inlineCode('/{{setupCommand}}')}.`)}
  `,
  [Locale.German]: message`
    ${heading('💥 Oh man, scheint, als ob du das Unmögliche möglich gemacht hast')}
    Ich weiß nicht, wie du es geschafft hast, aber von hier aus sieht es so aus, als ob der Bot nicht einmal auf diesem Server sein sollte!?!? Eh, vielleicht war es ja nur ein Netzwerkproblem. Wen interessiert's überhaupt. Fakt ist, dass du es wahrscheinlich einfach nochmal versuchen solltest.

    ${quote(`Wenn das Problem weiter besteht, kannst du den Netzwerk- und Setup-Status des Bots mit ${inlineCode('/{{setupCommand}}')} checken.`)}
  `,
};

export default compileFromDefinitions(definitions);
