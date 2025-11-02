/**
 * IndexedDB abstraction layer for storing large data like contestant images
 * Provides a clean API over browser's IndexedDB with error handling and type safety
 *
 * IndexedDB supports much larger storage limits than localStorage (typically 50MB-1GB+)
 */

const DB_NAME = 'the-floor';
const DB_VERSION = 1;
const CONTESTANT_STORE = 'contestants';

/**
 * Initialize the IndexedDB database
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store for contestants if it doesn't exist
      if (!db.objectStoreNames.contains(CONTESTANT_STORE)) {
        // Use contestant ID as the key
        const store = db.createObjectStore(CONTESTANT_STORE, { keyPath: 'id' });
        // Create index on name for quick lookups
        store.createIndex('name', 'name', { unique: false });
      }
    };
  });
}

/**
 * Get all contestants from IndexedDB
 */
export async function getAllContestants<T>(): Promise<T[]> {
  try {
    const db = await initDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([CONTESTANT_STORE], 'readonly');
      const store = transaction.objectStore(CONTESTANT_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        reject(new Error('Failed to get contestants from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error getting contestants from IndexedDB:', error);
    return [];
  }
}

/**
 * Add a new contestant to IndexedDB
 */
export async function addContestant<T extends { id: string }>(contestant: T): Promise<void> {
  try {
    const db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([CONTESTANT_STORE], 'readwrite');
      const store = transaction.objectStore(CONTESTANT_STORE);
      const request = store.add(contestant);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to add contestant to IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error adding contestant to IndexedDB:', error);
    throw error;
  }
}

/**
 * Update an existing contestant in IndexedDB
 */
export async function updateContestant<T extends { id: string }>(contestant: T): Promise<void> {
  try {
    const db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([CONTESTANT_STORE], 'readwrite');
      const store = transaction.objectStore(CONTESTANT_STORE);
      const request = store.put(contestant);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to update contestant in IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error updating contestant in IndexedDB:', error);
    throw error;
  }
}

/**
 * Delete a contestant from IndexedDB
 */
export async function deleteContestant(id: string): Promise<void> {
  try {
    const db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([CONTESTANT_STORE], 'readwrite');
      const store = transaction.objectStore(CONTESTANT_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete contestant from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error deleting contestant from IndexedDB:', error);
    throw error;
  }
}

/**
 * Clear all contestants from IndexedDB
 */
export async function clearAllContestants(): Promise<void> {
  try {
    const db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([CONTESTANT_STORE], 'readwrite');
      const store = transaction.objectStore(CONTESTANT_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear contestants from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error clearing contestants from IndexedDB:', error);
    throw error;
  }
}
