import { Vocabulary } from '../models/Vocabulary.js';
import { ApiError } from '../utils/api-error.js';
import { serializeVocabulary } from '../utils/serializers.js';

export async function listVocabulary(request, response) {
  const vocabulary = await Vocabulary.find({ user: request.user._id }).sort({
    createdAt: -1,
  });

  response.json({ data: vocabulary.map(serializeVocabulary) });
}

export async function findVocabularyByName(request, response) {
  const name = request.query.name?.trim().toLowerCase();

  if (!name) {
    throw new ApiError(400, 'Vocabulary name is required.');
  }

  const vocabulary = await Vocabulary.findOne({
    name,
    user: request.user._id,
  });

  if (!vocabulary) {
    throw new ApiError(404, 'Vocabulary not found!');
  }

  response.json({ data: serializeVocabulary(vocabulary) });
}

export async function createVocabulary(request, response) {
  const vocabulary = await Vocabulary.create({
    name: request.body?.name,
    pronounce: request.body?.pronounce || '...',
    meaning: request.body?.meaning,
    timesReviewed: request.body?.timesReviewed ?? 0,
    reviewDate: request.body?.reviewDate,
    user: request.user._id,
  });

  response.status(201).json({ data: serializeVocabulary(vocabulary) });
}

export async function updateVocabulary(request, response) {
  const { reviewDate, timesReviewed } = request.body || {};

  if (
    typeof reviewDate !== 'string' ||
    !reviewDate.trim() ||
    !Number.isInteger(timesReviewed) ||
    timesReviewed < 0
  ) {
    throw new ApiError(
      400,
      'reviewDate and a non-negative integer timesReviewed are required.'
    );
  }

  const vocabulary = await Vocabulary.findOneAndUpdate(
    { _id: request.params.id, user: request.user._id },
    { reviewDate, timesReviewed },
    { new: true, runValidators: true }
  );

  if (!vocabulary) {
    throw new ApiError(404, 'Vocabulary could not be updated.');
  }

  response.json({ data: serializeVocabulary(vocabulary) });
}

export async function deleteVocabulary(request, response) {
  const vocabulary = await Vocabulary.findOneAndDelete({
    _id: request.params.id,
    user: request.user._id,
  });

  if (!vocabulary) {
    throw new ApiError(404, 'Vocabulary could not be deleted.');
  }

  response.json({ data: { id: vocabulary.id } });
}
