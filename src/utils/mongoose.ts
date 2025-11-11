import type mongoose from 'mongoose';

export type WithId<T> = T & { _id: mongoose.Types.ObjectId };
