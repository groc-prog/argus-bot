import { cooldownSchema } from '@models/cooldown';
import { UserConfigurationModel } from '@models/user-configuration';
import mongoose from 'mongoose';

export enum SearchTermType {
  Title,
  Feature,
}

const searchTermsSchema = new mongoose.Schema({
  /**
   * The property the search will be performed on.
   */
  type: {
    type: mongoose.SchemaTypes.Number,
    enum: Object.values(SearchTermType),
    required: true,
  },
  /**
   * The value used to search the given property type.
   */
  value: {
    type: mongoose.SchemaTypes.String,
    required: true,
    trim: true,
  },
});

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: UserConfigurationModel.modelName,
    },
    name: {
      type: mongoose.SchemaTypes.String,
      required: true,
      trim: true,
    },
    searchTerms: [
      {
        type: searchTermsSchema,
        validate: {
          validator: (value: unknown) => {
            if (!Array.isArray(value)) return false;
            return value.length > 0;
          },
          message: (props: mongoose.ValidatorProps) =>
            `${props.path} must contain at least 1 element`,
        },
      },
    ],
    /**
     * Settings for temporarily muting this notification.
     */
    muteNotifications: cooldownSchema,
    /**
     * Max. number of times this notification can be triggered before being removed or marked as
     * deactivated.
     */
    max: {
      type: mongoose.SchemaTypes.Number,
      min: 1,
      default: 1,
    },
    /**
     * Counter of sent notifications.
     */
    sent: {
      type: mongoose.SchemaTypes.Number,
      min: 0,
      default: 0,
    },
    /**
     * Whether to keep the notification after it expires, regardless of what triggered the
     * expiration, instead of deleting it.
     */
    deactivate: {
      type: mongoose.SchemaTypes.Boolean,
      default: false,
    },
    /**
     * UTC timestamp when the last notification was sent.
     */
    lastSentAt: mongoose.SchemaTypes.Date,
    /**
     * UTC timestamp when the notification will be automatically removed. If `softDelete`
     * is set to `true`, the notification will be marked as deactivated instead of being removed.
     */
    expiresAt: mongoose.SchemaTypes.Date,
    /**
     * UTC timestamp when the notification was deactivated. Will only be set if the notification
     * has `softDelete` set to `true` and the notification would have been removed by any trigger.
     */
    deactivatedAt: mongoose.SchemaTypes.Date,
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ name: 1, userId: 1 }, { unique: true });

export type Notification = mongoose.InferSchemaType<typeof notificationSchema>;
export const NotificationModel = mongoose.model('Notification', notificationSchema);
