/**
 * Migration utility to create category references for existing contestants
 * Populates the categories store with categories from existing contestants
 */

import {
  getAllContestants,
  updateContestant,
  addCategory,
  getAllCategories,
} from '@storage/indexedDB';
import type { Contestant, StoredCategory } from '@types';
import { nanoid } from 'nanoid';

/**
 * Result of migration operation
 */
export interface MigrationResult {
  success: boolean;
  categoriesCreated: number;
  contestantsUpdated: number;
  errors: string[];
}

/**
 * Populate the categories store from existing contestants
 * Creates StoredCategory entries and adds categoryId references to contestants
 * Contestants keep their embedded categories for backward compatibility
 */
export async function populateCategoriesStore(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    categoriesCreated: 0,
    contestantsUpdated: 0,
    errors: [],
  };

  try {
    // Get all contestants
    const allContestants = await getAllContestants<Contestant>();

    // Filter to contestants without categoryId
    const contestantsNeedingMigration = allContestants.filter((c) => !c.categoryId);

    if (contestantsNeedingMigration.length === 0) {
      // No migration needed
      return result;
    }

    // Check if categories already exist (migration might have been partially done)
    const existingCategories = await getAllCategories<StoredCategory>();
    const categoryMap = new Map<string, string>(); // name -> id

    // Map existing categories by name
    for (const cat of existingCategories) {
      categoryMap.set(cat.name, cat.id);
    }

    // Extract unique categories from contestants
    const categoriesToCreate: StoredCategory[] = [];

    for (const contestant of contestantsNeedingMigration) {
      const categoryName = contestant.category.name;

      // Skip if category already exists
      if (categoryMap.has(categoryName)) {
        continue;
      }

      // Create new stored category
      const categoryId = nanoid();
      const firstSlide = contestant.category.slides[0];
      const thumbnailUrl = firstSlide?.imageUrl ?? '';

      const storedCategory: StoredCategory = {
        id: categoryId,
        name: categoryName,
        slides: contestant.category.slides,
        createdAt: new Date().toISOString(),
        thumbnailUrl,
      };

      categoriesToCreate.push(storedCategory);
      categoryMap.set(categoryName, categoryId);
    }

    // Store new categories in IndexedDB
    for (const category of categoriesToCreate) {
      try {
        await addCategory(category);
        result.categoriesCreated++;
      } catch (error) {
        const errorMsg = `Failed to add category "${category.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
        result.success = false;
      }
    }

    // Update contestants to add categoryId reference (keep embedded category)
    for (const contestant of contestantsNeedingMigration) {
      try {
        const categoryId = categoryMap.get(contestant.category.name);

        if (!categoryId) {
          const errorMsg = `Could not find category ID for contestant "${contestant.name}"`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
          result.success = false;
          continue;
        }

        // Update contestant with categoryId reference
        const updatedContestant: Contestant = {
          ...contestant,
          categoryId,
        };

        await updateContestant(updatedContestant);
        result.contestantsUpdated++;
      } catch (error) {
        const errorMsg = `Failed to update contestant "${contestant.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
        result.success = false;
      }
    }

    return result;
  } catch (error) {
    const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
    result.success = false;
    return result;
  }
}

/**
 * Check if migration is needed (i.e., are there contestants without categoryId?)
 */
export async function checkMigrationNeeded(): Promise<boolean> {
  try {
    const allContestants = await getAllContestants<Contestant>();
    return allContestants.some((c) => !c.categoryId);
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}
