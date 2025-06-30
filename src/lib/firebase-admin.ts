// This file is a mock to prevent initialization errors during development
// when a service account is not available. It exports empty objects and
// functions to satisfy imports throughout the application without trying
// to connect to a live Firebase backend.

const mockDb = new Proxy(
  {},
  {
    get(target, prop) {
      if (prop === 'collection') {
        return () => ({
          doc: () => ({
            get: () => Promise.resolve({ exists: false, data: () => undefined }),
            set: () => Promise.resolve(),
            update: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          }),
          get: () => Promise.resolve({ empty: true, docs: [] }),
        });
      }
      return () => {};
    },
  },
);

const mockStorage = {
  bucket: () => ({
    file: () => ({
      getSignedUrl: () => Promise.resolve(['#']),
    }),
  }),
};

const mockAdmin = {
  initializeApp: () => {},
  firestore: () => mockDb,
  storage: () => mockStorage,
};

export const adminDb = mockAdmin.firestore();
export const adminStorage = mockAdmin.storage();
export const adminStorageBucket = adminStorage.bucket();
export default mockAdmin;
