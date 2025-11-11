import mentionMeCommand from '@commands/notifications/mention-me';
import { GuildConfigurationModel } from '@models/guild-configuration';
import { MovieModel, type Movie, type MoviePerformance } from '@models/movie';
import type { MovieAttribute } from '@models/movie-attribute';
import { UserConfigurationModel } from '@models/user-configuration';
import movieNoPerformancesTemplates from '@templates/movie/movie-no-performances';
import movieNotFoundTemplates from '@templates/movie/movie-not-found';
import moviePerformancesTemplates from '@templates/movie/movie-performances';
import { sendLocalizedReply } from '@utils/discord';
import { interactionContextAwareLogger } from '@utils/logger';
import type { WithId } from '@utils/mongoose';
import dayjs from 'dayjs';
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Locale,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import Fuse from 'fuse.js';
import { isValidObjectId } from 'mongoose';

type PopulatedMovie = WithId<
  Pick<Movie, 'title'> & {
    technologyAttributes: WithId<MovieAttribute>[];
    performances: (Pick<MoviePerformance, 'showtimeUtc'> & {
      attributes: WithId<MovieAttribute>[];
      theatre: WithId<MovieAttribute>;
      seatClasses: WithId<MovieAttribute>[];
    })[];
  }
>;

export default {
  data: new SlashCommandBuilder()
    .setName('movie-performances')
    .setNameLocalization(Locale.German, 'film-vorstellungen')
    .setDescription('Look at all known performances for a movie.')
    .setDescriptionLocalization(
      Locale.German,
      'Schau dir alle bekannten Vorstellungen für einen Film an.',
    )
    .addStringOption((option) =>
      option
        .setName('movie')
        .setNameLocalization(Locale.German, 'film')
        .setDescription('The movie you want to see more details for.')
        .setDescriptionLocalization(Locale.German, 'Der Film, für den du mehr Infos sehen willst.')
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const movieIdOrTitle = interaction.options.getString('movie', true);
    const logger = interactionContextAwareLogger(interaction, { movie: movieIdOrTitle });

    logger.info('Fetching movie data from database');
    const movie = (await MovieModel.findOne({
      $or: [
        { _id: isValidObjectId(movieIdOrTitle) ? movieIdOrTitle : null },
        { title: movieIdOrTitle },
      ],
    })
      .populate<{ technologyAttributes: MovieAttribute[] }>({
        path: 'technologyAttributes',
        select: 'displayName',
      })
      .populate<{ performances: { attributes: MovieAttribute[] }[] }>({
        path: 'performances.attributes',
        select: 'displayName',
      })
      .populate<{ performances: { seatClasses: MovieAttribute[] }[] }>({
        path: 'performances.seatClasses',
        select: 'displayName',
      })
      .populate<{ performances: { theatre: MovieAttribute }[] }>({
        path: 'performances.theatre',
        select: 'displayName',
      })
      .select({
        title: 1,
        technologyAttributes: 1,
        performances: { $slice: 10 },
      })
      .lean()) as unknown as PopulatedMovie | null;

    if (!movie) {
      logger.info('Movie not found');
      await sendLocalizedReply(interaction, movieNotFoundTemplates, {
        interaction: {
          flags: [MessageFlags.Ephemeral],
        },
      });
      return;
    }

    if (movie.performances.length === 0) {
      logger.info('Movie does not have any performances scheduled');
      await sendLocalizedReply(interaction, movieNoPerformancesTemplates, {
        interaction: {
          flags: [MessageFlags.Ephemeral],
        },
      });
      return;
    }

    logger.info('Fetching user configuration for timezone conversion');
    const userConfiguration = await UserConfigurationModel.findOne({
      discordId: interaction.user.id,
    })
      .select({ preferredTimezone: 1 })
      .lean();

    logger.info('Fetching guild configuration for command hint');
    const guildConfiguration = await GuildConfigurationModel.findOne({
      guildId: interaction.guildId,
    })
      .select({ notificationsEnabled: 1 })
      .lean();

    const mentionMeCommandName =
      mentionMeCommand.data.name_localizations &&
      interaction.locale in mentionMeCommand.data.name_localizations
        ? mentionMeCommand.data.name_localizations[interaction.locale]
        : mentionMeCommand.data.name;

    await sendLocalizedReply(interaction, moviePerformancesTemplates, {
      template: {
        title: movie.title,
        showGuildNotificationCommand: guildConfiguration?.notificationsEnabled,
        mentionMeCommand: mentionMeCommandName,
        performances: movie.performances.map((performance) => ({
          // Merge performance attributes and movie attributes
          attributes: [...performance.attributes, ...movie.technologyAttributes]
            .map((attribute) => attribute.displayName)
            .join(', '),
          theatre: performance.theatre.displayName,
          seatClasses: performance.seatClasses.map((seatClass) => seatClass.displayName).join(', '),
          showtime: dayjs
            .utc(performance.showtimeUtc)
            .tz(userConfiguration?.preferredTimezone ?? 'Europe/Vienna')
            .format('YYYY-MM-DD HH:mm'),
        })),
      },
      interaction: {
        flags: [MessageFlags.Ephemeral],
      },
    });
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    const logger = interactionContextAwareLogger(interaction);
    const focusedOptionValue = interaction.options.getFocused(true);

    logger.info('Getting autocomplete options for movies');
    const movieObjects = await MovieModel.find({})
      .select({
        title: 1,
      })
      .lean();

    const movies = movieObjects.map((movie) => ({
      name: movie.title,
      value: movie._id.toString(),
    }));

    if (focusedOptionValue.value.trim().length === 0) {
      logger.debug('No input to filter yet, returning first 25 options');
      await interaction.respond(movies.slice(0, 25));
      return;
    }

    logger.debug('Fuzzy searching movie options');
    const fuse = new Fuse(movies, {
      keys: ['name'],
    });
    const matches = fuse.search(focusedOptionValue.value);

    await interaction.respond(matches.slice(0, 25).map((match) => match.item));
  },
};
