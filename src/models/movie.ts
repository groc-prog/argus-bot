import mongoose from 'mongoose';
import { MovieAttributeModel } from './movie-attributes';

const moviePerformanceSchema = new mongoose.Schema({
  attributes: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: MovieAttributeModel.modelName,
    },
  ],
  /**
   * UTC Unix timestamp of when the movie will be shown.
   */
  showtimeUtc: {
    type: mongoose.SchemaTypes.Number,
    required: true,
  },
  theatre: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: MovieAttributeModel.modelName,
  },
  seatClasses: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: MovieAttributeModel.modelName,
    },
  ],
});

const movieSchema = new mongoose.Schema(
  {
    /**
     * External URL to the poster used by the cinema's web page. Since Discord resolves links like
     * these in messages, it can be used as a '_preview_'.
     */
    posterUrl: {
      type: mongoose.SchemaTypes.String,
      trim: true,
    },
    /**
     * External URL to the trailer used by the cinema's web page.
     */
    trailerUrl: {
      type: mongoose.SchemaTypes.String,
      trim: true,
    },
    title: {
      type: mongoose.SchemaTypes.String,
      trim: true,
      required: true,
      unique: true,
    },
    descriptionShort: {
      type: mongoose.SchemaTypes.String,
      trim: true,
    },
    description: {
      type: mongoose.SchemaTypes.String,
      trim: true,
    },
    lengthMinutes: {
      type: mongoose.SchemaTypes.Number,
    },
    fsk: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: MovieAttributeModel.modelName,
    },
    genres: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: MovieAttributeModel.modelName,
      },
    ],
    technologyAttributes: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: MovieAttributeModel.modelName,
      },
    ],
    performances: [moviePerformanceSchema],
  },
  {
    timestamps: true,
  },
);

export type MoviePerformance = mongoose.InferSchemaType<typeof moviePerformanceSchema>;
export type Movie = mongoose.InferSchemaType<typeof movieSchema>;
export const MovieModel = mongoose.model('Movie', movieSchema);
