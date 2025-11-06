import mongoose from 'mongoose';

export enum KnownAttributeCategories {
  Genres = 'genres',
  Technical = 'technical',
  Fsk = 'fsk',
  Theatres = 'theatres',
  SeatClasses = 'seatclasses',
}

const movieAttributeSchema = new mongoose.Schema(
  {
    /**
     * The type of category the attribute is part of. This value is normalized to remove
     * whitespace and converted to lowercase as the API does not have a normalized format.
     */
    category: {
      type: mongoose.SchemaTypes.String,
      required: true,
      trim: true,
      enum: Object.values(KnownAttributeCategories),
      set: (value: string) => MovieAttributeModel.normalize(value),
    },
    /**
     * The unique identifier used by the scraped API. This value is normalized to remove
     * whitespace and converted to lowercase as the API does not have a normalized format.
     */
    identifier: {
      type: mongoose.SchemaTypes.String,
      required: true,
      trim: true,
      set: (value: string) => MovieAttributeModel.normalize(value),
    },
    displayName: {
      type: mongoose.SchemaTypes.String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    statics: {
      normalize: (value: unknown) => String(value).toLowerCase().replaceAll(' ', '').trim(),
    },
  },
);

movieAttributeSchema.index({ identifier: 1, category: 1 }, { unique: true });

export type MovieAttribute = mongoose.InferSchemaType<typeof movieAttributeSchema>;
export const MovieAttributeModel = mongoose.model('MovieAttribute', movieAttributeSchema);
