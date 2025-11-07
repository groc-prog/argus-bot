import mongoose from 'mongoose';

export enum CooldownUnit {
  Minute = 'm',
  Hour = 'h',
  Day = 'd',
  Week = 'w',
  Month = 'M',
}

export const cooldownSchema = new mongoose.Schema({
  /**
   * Reference date when the cooldown was started.
   */
  enabledAt: {
    type: mongoose.SchemaTypes.Date,
    required: true,
  },
  /**
   * The numeric cooldown of the mute.
   */
  cooldown: {
    type: mongoose.SchemaTypes.Number,
    required: true,
  },
  /**
   * The unit used for the cooldown. Supports a subset of the options `dayjs` provides.
   */
  unit: {
    type: mongoose.SchemaTypes.String,
    enum: Object.values(CooldownUnit),
    required: true,
  },
});
