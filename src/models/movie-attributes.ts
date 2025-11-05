import mongoose from 'mongoose';

const movieAttributeSchema = new mongoose.Schema(
  {
    /**
     * The type of category the attribute is part of. Examples for categories are:
     * - genres
     * - fsk
     * - seat classes
     * - ...
     */
    category: {
      type: mongoose.SchemaTypes.String,
      required: true,
      trim: true,
    },
    /**
     * The unique identifier used by the scraped API. This value is normalized to remove
     * whitespace and converted to lowercase as the API does not have a normalized format.
     */
    identifier: {
      type: mongoose.SchemaTypes.String,
      required: true,
      trim: true,
      set: (value: string) => value.toLowerCase().replace(' ', ''),
    },
    displayName: {
      type: mongoose.SchemaTypes.String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export type MovieAttribute = mongoose.InferSchemaType<typeof movieAttributeSchema>;
export const MovieAttributeModel = mongoose.model('MovieAttribute', movieAttributeSchema);
