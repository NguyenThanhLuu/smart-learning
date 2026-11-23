import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { env, requireEnvironment } from '../src/config/env.js';
import { Article } from '../src/models/Article.js';
import { User } from '../src/models/User.js';
import { Vocabulary } from '../src/models/Vocabulary.js';
import { hashAccessCode } from '../src/utils/access-code.js';

function argumentValue(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv
    .slice(2)
    .find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
}

async function readRows(filePath, { required = false } = {}) {
  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'));
    const rows = Array.isArray(parsed) ? parsed : parsed.data;

    if (!Array.isArray(rows)) {
      throw new Error(
        'The JSON root must be an array or an object with a data array.'
      );
    }

    return rows;
  } catch (error) {
    if (!required && error.code === 'ENOENT') return [];
    throw new Error(`Could not read ${filePath}: ${error.message}`);
  }
}

function legacyIdOf(row) {
  const value = row.id ?? row.legacyId ?? row.legacy_id;
  return value === undefined || value === null ? '' : String(value);
}

function ownerLegacyIdOf(row) {
  const value = row.userId ?? row.user_id ?? row.user?.id;
  return value === undefined || value === null ? '' : String(value);
}

function dateOrNow(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function importUsers(rows) {
  const userIdsByLegacyId = new Map();

  for (const row of rows) {
    const legacyId = legacyIdOf(row);
    const name = String(row.name || '').trim();
    const code = String(row.code || '').trim();
    const role = row.role === 'admin' ? 'admin' : 'user';

    if (!legacyId || !name || !code) {
      throw new Error('Every user needs id, name, and code fields.');
    }

    const codeHash = hashAccessCode(code, env.codePepper);
    let user = await User.findOne({ legacyId });

    if (!user) {
      user = new User({ legacyId });
    }

    user.name = name;
    user.codeHash = codeHash;
    user.role = role;
    user.createdAt = dateOrNow(row.created_at ?? row.createdAt);
    user.updatedAt = dateOrNow(
      row.updated_at ?? row.updatedAt ?? row.created_at
    );
    await user.save({ timestamps: false });
    userIdsByLegacyId.set(legacyId, user._id);
  }

  return userIdsByLegacyId;
}

async function resolveOwner(row, userIdsByLegacyId) {
  const ownerLegacyId = ownerLegacyIdOf(row);

  if (!ownerLegacyId) {
    throw new Error(
      `Record ${legacyIdOf(row) || '(without id)'} has no userId.`
    );
  }

  const mappedId = userIdsByLegacyId.get(ownerLegacyId);
  if (mappedId) return mappedId;

  const user = await User.findOne({ legacyId: ownerLegacyId });
  if (user) return user._id;

  throw new Error(
    `No imported user matches userId ${ownerLegacyId} for record ${legacyIdOf(
      row
    )}.`
  );
}

async function importArticles(rows, userIdsByLegacyId) {
  for (const row of rows) {
    const legacyId = legacyIdOf(row);
    const user = await resolveOwner(row, userIdsByLegacyId);
    const title = String(row.title || '').trim();
    const content = String(row.content || '');

    if (!title || !content) {
      throw new Error(
        `Article ${legacyId || '(without id)'} needs title and content.`
      );
    }

    const filter = legacyId ? { legacyId } : { user, title, content };
    await Article.findOneAndUpdate(
      filter,
      {
        title,
        content,
        highlightTo: String(row.highlightTo ?? row.highlight_to ?? ''),
        user,
        ...(legacyId ? { legacyId } : {}),
        createdAt: dateOrNow(row.created_at ?? row.createdAt),
        updatedAt: dateOrNow(row.updated_at ?? row.updatedAt ?? row.created_at),
      },
      { upsert: true, runValidators: true, timestamps: false }
    );
  }
}

async function importVocabulary(rows, userIdsByLegacyId) {
  for (const row of rows) {
    const legacyId = legacyIdOf(row);
    const user = await resolveOwner(row, userIdsByLegacyId);
    const name = String(row.name || '')
      .trim()
      .toLowerCase();
    const meaning = String(row.meaning || '').trim();
    const reviewDate = String(row.reviewDate ?? row.review_date ?? '').trim();

    if (!name || !meaning || !reviewDate) {
      throw new Error(
        `Vocabulary ${
          legacyId || '(without id)'
        } needs name, meaning, and reviewDate.`
      );
    }

    const filter = legacyId ? { legacyId } : { user, name };
    await Vocabulary.findOneAndUpdate(
      filter,
      {
        name,
        pronounce: String(row.pronounce || '...').trim(),
        meaning,
        timesReviewed: Number(row.timesReviewed ?? row.times_reviewed ?? 0),
        reviewDate,
        user,
        ...(legacyId ? { legacyId } : {}),
        createdAt: dateOrNow(row.created_at ?? row.createdAt),
        updatedAt: dateOrNow(row.updated_at ?? row.updatedAt ?? row.created_at),
      },
      { upsert: true, runValidators: true, timestamps: false }
    );
  }
}

async function run() {
  requireEnvironment(['MONGODB_URI', 'CODE_PEPPER']);

  if (env.codePepper.length < 32) {
    throw new Error('CODE_PEPPER must be at least 32 characters.');
  }

  const importDirectory = path.resolve(
    argumentValue('dir', path.join('data', 'import'))
  );
  const [users, articles, vocabulary] = await Promise.all([
    readRows(path.join(importDirectory, 'users.json'), { required: true }),
    readRows(path.join(importDirectory, 'articles.json')),
    readRows(path.join(importDirectory, 'vocabulary.json')),
  ]);

  await connectDatabase();
  const userIdsByLegacyId = await importUsers(users);
  await importArticles(articles, userIdsByLegacyId);
  await importVocabulary(vocabulary, userIdsByLegacyId);

  console.log(
    `Imported ${users.length} user(s), ${articles.length} article(s), and ${vocabulary.length} vocabulary item(s).`
  );
}

run()
  .catch((error) => {
    console.error('Import failed:', error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
