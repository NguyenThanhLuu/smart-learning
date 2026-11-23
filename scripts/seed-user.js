import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { env, requireEnvironment } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { hashAccessCode } from '../src/utils/access-code.js';
import { normalizeUserName } from '../src/utils/user-name.js';

async function seedUser() {
  requireEnvironment([
    'MONGODB_URI',
    'CODE_PEPPER',
    'SEED_USER_NAME',
    'SEED_USER_CODE',
  ]);

  if (env.codePepper.length < 32) {
    throw new Error('CODE_PEPPER must be at least 32 characters.');
  }

  await connectDatabase();

  const name = process.env.SEED_USER_NAME.trim();
  const code = process.env.SEED_USER_CODE.trim();
  const role = process.env.SEED_USER_ROLE?.trim() || 'admin';

  if (code.length < 6) {
    throw new Error('SEED_USER_CODE must contain at least 6 characters.');
  }

  if (!['admin', 'user'].includes(role)) {
    throw new Error('SEED_USER_ROLE must be either admin or user.');
  }

  const normalizedName = normalizeUserName(name);
  const codeHash = hashAccessCode(code, env.codePepper);
  const existingUser = await User.findOne({
    $or: [{ normalizedName }, { name }],
  });

  if (existingUser) {
    existingUser.name = name;
    existingUser.normalizedName = normalizedName;
    existingUser.codeHash = codeHash;
    existingUser.role = role;
    await existingUser.save();
    console.log(`Updated ${role} account: ${existingUser.name}`);
    return;
  }

  const user = await User.create({ name, normalizedName, codeHash, role });
  console.log(`Created ${role} account: ${user.name}`);
}

seedUser()
  .catch((error) => {
    console.error('Could not seed user:', error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
