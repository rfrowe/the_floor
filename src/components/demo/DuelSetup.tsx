import { useState, useCallback } from 'react';
import { DuelSetup } from '@components/duel/DuelSetup';
import { ComponentController } from '@pages/ComponentController';
import { DemoHighlights, DemoDescription } from '@pages/DemoControlsContent';
import type { Contestant } from '@types';
import styles from '@pages/ComponentsDemo.module.css';

const mockContestants: Contestant[] = [
  {
    id: 'demo-contestant-1',
    name: 'Alice Johnson',
    category: { name: '80s Movies', slides: [] },
    wins: 8,
    eliminated: false,
    gridPosition: { row: 0, col: 0 },
    controlledSquares: ['0-0'],
  },
  {
    id: 'demo-contestant-2',
    name: 'Bob Smith',
    category: { name: 'State Capitals', slides: [] },
    wins: 3,
    eliminated: false,
    gridPosition: { row: 1, col: 2 },
    controlledSquares: ['1-2'],
  },
];

export default function DuelSetupDemo() {
  const [contestant1, setContestant1] = useState<Contestant | null>(mockContestants[0] ?? null);
  const [contestant2, setContestant2] = useState<Contestant | null>(mockContestants[1] ?? null);
  const [audienceWatching, setAudienceWatching] = useState(false);

  const handleClear = useCallback(() => {
    console.log('Clear selection');
  }, []);

  const handleStartDuel = useCallback(
    (config: {
      contestant1: { name: string };
      contestant2: { name: string };
      selectedCategory: { name: string };
    }) => {
      console.log('Start duel with:', config);
      alert(
        `Starting duel: ${config.contestant1.name} vs ${config.contestant2.name} - ${config.selectedCategory.name}`
      );
    },
    []
  );

  const handleSwapContestants = useCallback(() => {
    setContestant1(contestant2);
    setContestant2(contestant1);
  }, [contestant1, contestant2]);

  const handleReset = useCallback(() => {
    setContestant1(mockContestants[0] ?? null);
    setContestant2(mockContestants[1] ?? null);
    setAudienceWatching(false);
  }, []);

  return (
    <section className={styles['section']} id="duel-setup">
      <h2>
        <code>&lt;DuelSetup /&gt;</code>
      </h2>
      <p>
        Component for configuring and starting a duel between two contestants. Shows contestant
        selection, category selection, and validation.
      </p>

      <ComponentController
        controls={[
          {
            type: 'button',
            label: audienceWatching ? '✅ Audience Watching' : '📺 Toggle Audience',
            onClick: () => {
              setAudienceWatching(!audienceWatching);
            },
            variant: audienceWatching ? 'primary' : 'secondary',
          },
          {
            type: 'button',
            label: '🔄 Swap P1 ↔ P2',
            onClick: handleSwapContestants,
            variant: 'secondary',
          },
        ]}
        onReset={handleReset}
        description={
          <DemoDescription>
            <p>
              Toggle audience connection to see how validation works. Swap button switches Player 1
              and Player 2. Start Duel requires both contestants, a category, and audience watching.
            </p>
          </DemoDescription>
        }
        highlights={
          <DemoHighlights title="Component Features:">
            - Displays selected contestants with categories
            <br />
            - Category selection dropdown (from both contestants&apos; categories)
            <br />
            - Clear and Random Select buttons
            <br />
            - Validation: requires 2 contestants, category, and audience connection
            <br />- <code>isAudienceWatching</code> prop controls Start Duel button availability
          </DemoHighlights>
        }
      />

      <div style={{ border: '1px solid var(--border-default)', padding: '1rem' }}>
        <DuelSetup
          contestant1={contestant1}
          contestant2={contestant2}
          onClear={handleClear}
          onStartDuel={handleStartDuel}
          canRandomSelect={false}
          isAudienceWatching={audienceWatching}
        />
      </div>
    </section>
  );
}
