import mongoose from 'mongoose';

const userVisitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userVisitSchema.index({ user: 1, startedAt: -1 });

export const UserVisit = mongoose.model('UserVisit', userVisitSchema);
