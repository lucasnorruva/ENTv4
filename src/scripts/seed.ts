// This script has been disabled as it requires a live Firebase Admin SDK connection.
// To re-enable, you will need to provide service account credentials.
// For now, it will do nothing.
async function seedDatabase() {
  console.log(
    'Database seeding is disabled. Using in-memory mock data instead.',
  );
  return Promise.resolve();
}

seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Seeding script failed:', error);
    process.exit(1);
  });
