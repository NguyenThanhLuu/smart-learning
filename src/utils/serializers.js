function asObject(document) {
  return typeof document?.toObject === 'function'
    ? document.toObject()
    : document;
}

function asId(value) {
  if (!value) return null;
  return (value._id || value).toString();
}

function asIsoDate(value) {
  return value instanceof Date ? value.toISOString() : value;
}

export function serializeUser(user) {
  const value = asObject(user);

  return {
    id: asId(value),
    name: value.name,
    role: value.role || 'user',
    created_at: asIsoDate(value.createdAt),
  };
}

export function serializeVocabulary(vocabulary) {
  const value = asObject(vocabulary);

  return {
    id: asId(value),
    name: value.name,
    pronounce: value.pronounce,
    meaning: value.meaning,
    timesReviewed: value.timesReviewed,
    reviewDate: value.reviewDate,
    userId: asId(value.user),
    created_at: asIsoDate(value.createdAt),
    updated_at: asIsoDate(value.updatedAt),
  };
}

export function serializeArticle(article) {
  const value = asObject(article);
  const populatedUser = value.user?._id ? value.user : null;

  return {
    id: asId(value),
    title: value.title,
    content: value.content,
    highlightTo: value.highlightTo,
    userId: asId(value.user),
    created_at: asIsoDate(value.createdAt),
    updated_at: asIsoDate(value.updatedAt),
    ...(populatedUser ? { users: serializeUser(populatedUser) } : {}),
  };
}
