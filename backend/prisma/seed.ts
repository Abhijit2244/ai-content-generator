import { seedDatabase } from '../src/database/seed.js';

seedDatabase().catch((err) => {
  console.error('[Database] Seeding error:', err);
  process.exit(1);
});
