import mongoose from 'mongoose';

const vocabularySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    pronounce: {
      type: String,
      trim: true,
      default: '...',
      maxlength: 500,
    },
    meaning: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    timesReviewed: {
      type: Number,
      min: 0,
      default: 0,
    },
    reviewDate: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    legacyId: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

vocabularySchema.index({ user: 1, name: 1 }, { unique: true });
vocabularySchema.index({ legacyId: 1 }, { unique: true, sparse: true });

export const Vocabulary = mongoose.model('Vocabulary', vocabularySchema);
