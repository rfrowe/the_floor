import { useState, useCallback, useMemo } from 'react';
import { FloorGrid } from '@components/floor/FloorGrid';
import { ComponentController } from '@pages/ComponentController';
import { DemoHighlights } from '@pages/DemoControlsContent';
import { canContestantsDuel, getDuelEligibleContestants } from '@utils/duelUtils';
import type { Contestant } from '@types';
import styles from '@pages/ComponentsDemo.module.css';

const DEMO_GRID_CONFIG = { rows: 5, cols: 5 };

const initialContestants: Contestant[] = [
  {
    id: 'demo-contestant-1',
    name: 'Alice Johnson',
    category: { name: '80s Movies', slides: [] },
    wins: 8,
    eliminated: false,
    gridPosition: { row: 0, col: 0 },
    controlledSquares: ['0-0', '0-1', '0-2', '0-3', '0-4', '1-0', '1-1', '1-4', '2-4'],
  },
  {
    id: 'demo-contestant-2',
    name: 'Bob Smith',
    category: { name: 'State Capitals', slides: [] },
    wins: 3,
    eliminated: false,
    gridPosition: { row: 1, col: 2 },
    controlledSquares: ['1-2', '1-3', '2-0', '2-1', '2-2', '2-3'],
  },
  {
    id: 'demo-contestant-3',
    name: 'Carol Davis',
    category: { name: 'World History', slides: [] },
    wins: 3,
    eliminated: false,
    gridPosition: { row: 3, col: 1 },
    controlledSquares: ['3-1', '3-2', '4-0', '4-1'],
  },
  {
    id: 'demo-contestant-4',
    name: 'David Lee',
    category: { name: 'Science Facts', slides: [] },
    wins: 2,
    eliminated: false,
    gridPosition: { row: 3, col: 3 },
    controlledSquares: ['3-3', '3-4', '4-3', '4-4'],
  },
  {
    id: 'demo-contestant-5',
    name: 'Eve Martinez',
    category: { name: 'Geography', slides: [] },
    wins: 0,
    eliminated: false,
    gridPosition: { row: 3, col: 0 },
    controlledSquares: ['3-0'],
  },
];

export default function AudienceViewDemo() {
  const [contestants, setContestants] = useState<Contestant[]>(initialContestants);

  // Check if there are any adjacent pairs that can duel
  const duelPossible = useMemo(() => {
    const eligible = getDuelEligibleContestants(contestants);
    if (eligible.length < 2) {
      return false;
    }

    // Check if any pair is adjacent
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        const c1 = eligible[i];
        const c2 = eligible[j];
        if (c1 && c2 && canContestantsDuel(c1, c2, contestants)) {
          return true;
        }
      }
    }
    return false;
  }, [contestants]);

  const handleSimulateDuel = useCallback(() => {
    setContestants((prev) => {
      // Find duel-eligible contestants using utility
      const eligible = getDuelEligibleContestants(prev);
      if (eligible.length < 2) return prev;

      // Find pairs of contestants that can actually duel (adjacent territories)
      const duelablePairs: [Contestant, Contestant][] = [];
      for (let i = 0; i < eligible.length; i++) {
        for (let j = i + 1; j < eligible.length; j++) {
          const c1 = eligible[i];
          const c2 = eligible[j];
          if (c1 && c2 && canContestantsDuel(c1, c2, prev)) {
            duelablePairs.push([c1, c2]);
          }
        }
      }

      // If no adjacent pairs, can't start a duel
      if (duelablePairs.length === 0) return prev;

      // Pick a random pair
      const randomPair = duelablePairs[Math.floor(Math.random() * duelablePairs.length)];
      if (!randomPair) return prev;

      const [contestant1, contestant2] = randomPair;

      // Pick random winner
      const winner = Math.random() < 0.5 ? contestant1 : contestant2;
      const loser = winner.id === contestant1.id ? contestant2 : contestant1;

      // Winner takes loser's squares
      return prev.map((c) => {
        if (c.id === winner.id) {
          return {
            ...c,
            wins: c.wins + 1,
            controlledSquares: [...(c.controlledSquares ?? []), ...(loser.controlledSquares ?? [])],
          };
        }
        if (c.id === loser.id) {
          return {
            ...c,
            eliminated: true,
            controlledSquares: [],
          };
        }
        return c;
      });
    });
  }, []);

  const handleReset = useCallback(() => {
    setContestants(initialContestants);
  }, []);

  return (
    <section className={styles['section']} id="audience-view">
      <h2>Audience View</h2>
      <p>
        The Audience View displays the game floor as a grid of contestant territories. Each
        contestant controls one or more squares with distinct colors and perimeter borders. This is
        what viewers see when no duel is active.
      </p>

      <ComponentController
        controls={[
          {
            type: 'button',
            label: duelPossible ? '⚔️ Simulate Duel' : '⚔️ Simulate Duel (Need 2+ eligible)',
            onClick: handleSimulateDuel,
            variant: 'primary',
            disabled: !duelPossible,
          },
        ]}
        onReset={handleReset}
        highlights={
          <DemoHighlights title="Key Features:">
            - Each contestant has a unique color generated from their ID
            <br />
            - Territory perimeter is highlighted with white borders
            <br />
            - Contestant names and categories are displayed on their centroid square
            <br />
            - Selected contestants (Alice) show a sword icon for duel preview
            <br />
            - Grid automatically calculates aspect ratio based on configuration
            <br />- Simulate Duel picks 2 random duel-eligible contestants (not eliminated, with
            controlled squares), picks a random winner, and merges territories! Button disabled if
            fewer than 2 eligible contestants.
          </DemoHighlights>
        }
      />

      <div
        style={
          {
            maxWidth: '600px',
            height: '500px',
            margin: '0 auto',
            border: '2px solid var(--border-default)',
            backgroundColor: '#1e3a5f',
            display: 'flex',
            flexDirection: 'column',
            '--grid-text-scale': '0.85',
          } as React.CSSProperties
        }
      >
        <FloorGrid
          contestants={contestants}
          selectedContestantIds={[]}
          defaultConfig={DEMO_GRID_CONFIG}
        />
      </div>
    </section>
  );
}
