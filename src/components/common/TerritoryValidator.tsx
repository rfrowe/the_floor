/**
 * TerritoryValidator - Development component to validate territory contiguity
 *
 * This component checks that all contestants have contiguous territories
 * and logs errors if any issues are found.
 *
 * Usage:
 * ```tsx
 * <TerritoryValidator contestants={contestants} />
 * ```
 */

import { useEffect } from 'react';
import type { Contestant } from '@types';
import { validateTerritoryContiguity } from '@utils/gridUtils';
import { createLogger } from '@/utils/logger';

const log = createLogger('TerritoryValidator');

interface TerritoryValidatorProps {
  contestants: Contestant[];
  /** Whether to run validation (default: true in development) */
  enabled?: boolean;
}

/**
 * Validates contestant territories for contiguity issues.
 * Logs errors to console if non-contiguous territories are detected.
 * This component renders nothing - it only performs validation.
 */
export function TerritoryValidator({
  contestants,
  enabled = import.meta.env.DEV,
}: TerritoryValidatorProps) {
  useEffect(() => {
    if (!enabled) return;

    // Run validation
    const isValid = validateTerritoryContiguity(contestants);

    if (!isValid) {
      log.warn('⚠️  Non-contiguous territories detected! Check errors above for details.');
    }
  }, [contestants, enabled]);

  // This component doesn't render anything
  return null;
}
