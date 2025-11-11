/**
 * IndexedDB abstraction layer for storing large data like contestant images and categories
 * Provides a clean API over browser's IndexedDB with error handling and type safety
 *
 * IndexedDB supports much larger storage limits than localStorage (typically 50MB-1GB+)
 *
 * Schema Version History:
 * - v1: Initial schema with contestants store (embedded categories)
 * - v2: Added categories store, contestants now reference categories by ID
 */

const DB_NAME = 'the-floor';
const DB_VERSION = 2;
const CONTESTANT_STORE = 'contestants';
const CATEGORY_STORE = 'categories';

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
      const oldVersion = event.oldVersion;

      // Version 1: Create contestants store
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(CONTESTANT_STORE)) {
          // Use contestant ID as the key
          const store = db.createObjectStore(CONTESTANT_STORE, { keyPath: 'id' });
          // Create index on name for quick lookups
          store.createIndex('name', 'name', { unique: false });
        }
      }

      // Version 2: Add categories store
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(CATEGORY_STORE)) {
          // Use category ID as the key
          const store = db.createObjectStore(CATEGORY_STORE, { keyPath: 'id' });
          // Create index on name for quick lookups and duplicate detection
          store.createIndex('name', 'name', { unique: false });
          // Create index on creation date for sorting
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
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
 * Get a single contestant by ID from IndexedDB
 */
export async function getContestantById<T>(id: string): Promise<T | null> {
  try {
    const db = await initDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([CONTESTANT_STORE], 'readonly');
      const store = transaction.objectStore(CONTESTANT_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve((request.result as T) || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get contestant from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error getting contestant from IndexedDB:', error);
    return null;
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

// ============================================================================
// Category Storage Functions
// ============================================================================

/**
 * Get all categories from IndexedDB
 */
export async function getAllCategories<T>(): Promise<T[]> {
  try {
    const db = await initDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([CATEGORY_STORE], 'readonly');
      const store = transaction.objectStore(CATEGORY_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        reject(new Error('Failed to get categories from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error getting categories from IndexedDB:', error);
    return [];
  }
}

/**
 * Get lightweight category metadata without loading full slide data
 * Much faster for displaying category lists
 */
export async function getAllCategoryMetadata(): Promise<
  Array<{
    id: string;
    name: string;
    slideCount: number;
    thumbnailUrl: string;
    createdAt: string;
  }>
> {
  try {
    const db = await initDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([CATEGORY_STORE], 'readonly');
      const store = transaction.objectStore(CATEGORY_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const categories = request.result as Array<{
          id: string;
          name: string;
          slides: unknown[];
          thumbnailUrl: string;
          createdAt: string;
        }>;

        // Map to lightweight metadata (exclude slide data)
        const metadata = categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slideCount: cat.slides.length,
          thumbnailUrl: cat.thumbnailUrl,
          createdAt: cat.createdAt,
        }));

        resolve(metadata);
      };

      request.onerror = () => {
        reject(new Error('Failed to get category metadata from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error getting category metadata from IndexedDB:', error);
    return [];
  }
}

/**
 * Get a single category by ID from IndexedDB
 */
export async function getCategoryById<T>(id: string): Promise<T | null> {
  try {
    const db = await initDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([CATEGORY_STORE], 'readonly');
      const store = transaction.objectStore(CATEGORY_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve((request.result as T) || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get category from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error getting category from IndexedDB:', error);
    return null;
  }
}

/**
 * Get categories by name (for duplicate detection)
 */
export async function getCategoriesByName<T>(name: string): Promise<T[]> {
  try {
    const db = await initDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([CATEGORY_STORE], 'readonly');
      const store = transaction.objectStore(CATEGORY_STORE);
      const index = store.index('name');
      const request = index.getAll(name);

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        reject(new Error('Failed to get categories by name from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error getting categories by name from IndexedDB:', error);
    return [];
  }
}

/**
 * Add a new category to IndexedDB
 */
export async function addCategory<T extends { id: string }>(category: T): Promise<void> {
  try {
    const db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([CATEGORY_STORE], 'readwrite');
      const store = transaction.objectStore(CATEGORY_STORE);
      const request = store.add(category);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to add category to IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error adding category to IndexedDB:', error);
    throw error;
  }
}

/**
 * Update an existing category in IndexedDB
 */
export async function updateCategory<T extends { id: string }>(category: T): Promise<void> {
  try {
    const db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([CATEGORY_STORE], 'readwrite');
      const store = transaction.objectStore(CATEGORY_STORE);
      const request = store.put(category);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to update category in IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error updating category in IndexedDB:', error);
    throw error;
  }
}

/**
 * Delete a category from IndexedDB
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    const db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([CATEGORY_STORE], 'readwrite');
      const store = transaction.objectStore(CATEGORY_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete category from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error deleting category from IndexedDB:', error);
    throw error;
  }
}

/**
 * Clear all categories from IndexedDB
 */
export async function clearAllCategories(): Promise<void> {
  try {
    const db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([CATEGORY_STORE], 'readwrite');
      const store = transaction.objectStore(CATEGORY_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear categories from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error clearing categories from IndexedDB:', error);
    throw error;
  }
}
