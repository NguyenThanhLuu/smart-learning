import mongoose from 'mongoose';

import { normalizeUserName } from '../utils/user-name.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    codeHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
    },
    legacyId: {
      type: String,
      trim: true,
    },
    lastSeenAt: Date,
  },
  { timestamps: true }
);

userSchema.pre('validate', function normalizeNameBeforeValidation() {
  this.normalizedName = normalizeUserName(this.name);
});

userSchema.index({ legacyId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, createdAt: -1 });

export const User = mongoose.model('User', userSchema);
