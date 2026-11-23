import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    content: {
      type: String,
      required: true,
      validate: {
        validator: (value) => value.trim().length > 0,
        message: 'Article content is required.',
      },
    },
    highlightTo: {
      type: String,
      trim: true,
      default: '',
      maxlength: 50,
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

articleSchema.index({ user: 1, createdAt: -1 });
articleSchema.index({ legacyId: 1 }, { unique: true, sparse: true });

export const Article = mongoose.model('Article', articleSchema);
