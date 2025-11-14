import { useState, useMemo, useCallback, useEffect } from 'react';
import { ContestantCard } from '@components/contestant/ContestantCard';
import { ComponentController } from '@pages/ComponentController';
import { DemoHighlights, DemoDescription } from '@pages/DemoControlsContent';
import { getRandomName, getRandomCategory } from './useSharedBaseballData';
import type { Contestant } from '@types';
import styles from '@pages/ComponentsDemo.module.css';

const initialContestants: Contestant[] = [
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
  {
    id: 'demo-contestant-3',
    name: 'Carol Davis',
    category: { name: 'World History', slides: [] },
    wins: 3,
    eliminated: true,
    gridPosition: { row: 3, col: 1 },
    controlledSquares: ['3-1'],
  },
  {
    id: 'demo-contestant-4',
    name: 'David Lee',
    category: { name: 'Science Facts', slides: [] },
    wins: 2,
    eliminated: false,
    gridPosition: { row: 3, col: 3 },
    controlledSquares: ['3-3'],
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

export default function ContestantCardDemo() {
  const [contestants, setContestants] = useState<Contestant[]>(initialContestants);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [selectedWins, setSelectedWins] = useState(0);

  const maxWins = useMemo(() => Math.max(...contestants.map((c) => c.wins)), [contestants]);

  // Sync selected wins when selection changes (only)
  useEffect(() => {
    if (selectedContestant) {
      const selected = contestants.find((c) => c.name === selectedContestant);
      if (selected && selected.wins !== selectedWins) {
        setSelectedWins(selected.wins);
      }
    }
  }, [selectedContestant]); // Only depend on selection change, not contestants

  // Handler to update wins - updates contestants directly
  const handleWinsChange = useCallback(
    (newWins: number) => {
      setSelectedWins(newWins);
      if (selectedContestant) {
        setContestants((prev) =>
          prev.map((c) => (c.name === selectedContestant ? { ...c, wins: newWins } : c))
        );
      }
    },
    [selectedContestant]
  );

  const handleSelect = useCallback(
    (contestantName: string) => {
      setSelectedContestant((current) => {
        const newSelection = contestantName === current ? null : contestantName;
        // Update wins immediately on selection change
        if (newSelection) {
          const selected = contestants.find((c) => c.name === newSelection);
          if (selected) {
            setSelectedWins(selected.wins);
          }
        }
        return newSelection;
      });
    },
    [contestants]
  );

  const handleEliminateSelected = useCallback(() => {
    if (!selectedContestant) return;
    setContestants((prev) =>
      prev.map((c) => (c.name === selectedContestant ? { ...c, eliminated: true } : c))
    );
  }, [selectedContestant]);

  const handleAddContestant = useCallback(() => {
    const newId = `demo-contestant-${String(Date.now())}`;
    const newContestant: Contestant = {
      id: newId,
      name: getRandomName(),
      category: { name: getRandomCategory(), slides: [] },
      wins: 0,
      eliminated: false,
    };
    setContestants((prev) => [...prev, newContestant]);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedContestant) return;
    setContestants((prev) => prev.filter((c) => c.name !== selectedContestant));
    setSelectedContestant(null);
  }, [selectedContestant]);

  const handle1UPAll = useCallback(() => {
    setContestants((prev) => prev.map((c) => ({ ...c, eliminated: false })));
  }, []);

  const handleReset = useCallback(() => {
    setContestants(initialContestants);
    setSelectedContestant(null);
    setSelectedWins(0);
  }, []);

  const selectedContestantObj = contestants.find((c) => c.name === selectedContestant);
  const isSelectedEliminated = selectedContestantObj?.eliminated ?? false;

  return (
    <section className={styles['section']} id="contestant-card">
      <h2>
        <code>&lt;ContestantCard /&gt;</code>
      </h2>

      <ComponentController
        controls={[
          {
            type: 'slider',
            label: selectedContestant ? `${selectedContestant}'s Wins` : 'Wins (select contestant)',
            value: selectedWins,
            min: 0,
            max: 20,
            step: 1,
            onChange: (val) => {
              handleWinsChange(val as number);
            },
            disabled: !selectedContestant,
          },
          {
            type: 'group',
            label: 'Contestant State',
            controls: [
              {
                type: 'button',
                label: '💀 Eliminate',
                onClick: handleEliminateSelected,
                variant: 'danger',
                disabled: !selectedContestant || isSelectedEliminated,
              },
              {
                type: 'button',
                label: '🍄 1UP All',
                onClick: handle1UPAll,
                variant: 'primary',
              },
            ],
          },
          {
            type: 'group',
            label: 'Manage Contestants',
            controls: [
              {
                type: 'button',
                label: '➕ Add',
                onClick: handleAddContestant,
                variant: 'primary',
              },
              {
                type: 'button',
                label: '🗑️ Delete',
                onClick: handleDeleteSelected,
                variant: 'danger',
                disabled: !selectedContestant,
              },
            ],
          },
        ]}
        onReset={handleReset}
        description={
          <DemoDescription>
            <p>
              Click cards to select a contestant. The wins slider adjusts the selected
              contestant&apos;s score. Buttons are context-aware and enable/disable based on
              selection and contestant state.
            </p>
          </DemoDescription>
        }
        highlights={
          <DemoHighlights title="Interactive Features:">
            - Click cards to select/deselect contestants
            <br />
            - Wins slider affects crown display (highest wins gets crown)
            <br />
            - Eliminate button greys out selected contestant
            <br />
            - 🍄 1UP All revives all eliminated contestants at once
            <br />
            - Add creates random contestants with random names/categories
            <br />- Delete removes selected contestant
          </DemoHighlights>
        }
      />

      <div className={styles['cardGrid']}>
        {contestants.map((contestant) => {
          const hasTopWins = contestant.wins === maxWins && maxWins > 0;
          return (
            <ContestantCard
              key={contestant.id}
              contestant={contestant}
              isSelected={selectedContestant === contestant.name}
              onSelect={() => {
                handleSelect(contestant.name);
              }}
              hasTopWins={hasTopWins}
            />
          );
        })}
      </div>
    </section>
  );
}
