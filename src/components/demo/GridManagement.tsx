import { useState, useCallback } from 'react';
import { GridInitializer } from '@components/dashboard/GridInitializer';
import { GridConfigurator } from '@components/dashboard/GridConfigurator';
import { FloorGrid } from '@components/floor/FloorGrid';
import { ComponentController } from '@pages/ComponentController';
import { getRandomName, getRandomCategory } from './useSharedBaseballData';
import type { Contestant } from '@types';
import type { GridConfig } from '@/storage/gridConfig';
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
    eliminated: false,
  },
  {
    id: 'demo-contestant-4',
    name: 'David Lee',
    category: { name: 'Science Facts', slides: [] },
    wins: 2,
    eliminated: false,
  },
];

export default function GridManagementDemo() {
  const [contestants, setContestants] = useState<Contestant[]>(initialContestants);
  const [gridConfig, setGridConfig] = useState<GridConfig>({ rows: 5, cols: 5 });
  const gridRows = gridConfig.rows;
  const gridCols = gridConfig.cols;

  const handleUpdate = useCallback(async (updated: Contestant[]) => {
    console.log('Updated contestants:', updated);
    setContestants(updated);
    return Promise.resolve();
  }, []);

  const handleSetRows = useCallback(
    (rows: number) => {
      setGridConfig({ rows, cols: gridConfig.cols });
    },
    [gridConfig.cols, setGridConfig]
  );

  const handleSetCols = useCallback(
    (cols: number) => {
      setGridConfig({ rows: gridConfig.rows, cols });
    },
    [gridConfig.rows, setGridConfig]
  );

  const handleRandomizePositions = useCallback(() => {
    setContestants((prev) =>
      prev.map((c) => {
        const row = Math.floor(Math.random() * gridRows);
        const col = Math.floor(Math.random() * gridCols);
        return {
          ...c,
          gridPosition: { row, col },
          controlledSquares: [`${String(row)}-${String(col)}`],
        };
      })
    );
  }, [gridRows, gridCols]);

  const handleAddContestant = useCallback(() => {
    const newId = `grid-contestant-${String(Date.now())}`;
    const newContestant: Contestant = {
      id: newId,
      name: getRandomName(),
      category: { name: getRandomCategory(), slides: [] },
      wins: Math.floor(Math.random() * 5),
      eliminated: false,
    };
    setContestants((prev) => [...prev, newContestant]);
  }, []);

  const handleRemoveContestant = useCallback(() => {
    setContestants((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const handleClearGrid = useCallback(() => {
    setContestants((prev) =>
      prev.map((c) => {
        const { gridPosition: _gridPosition, ...rest } = c;
        return {
          ...rest,
          controlledSquares: [],
        };
      })
    );
  }, []);

  const handleReset = useCallback(() => {
    setContestants(initialContestants);
    setGridConfig({ rows: 5, cols: 5 });
  }, [setGridConfig]);

  return (
    <section className={styles['section']} id="grid-management">
      <h2>Grid Management</h2>
      <p>
        These dashboard components help the game master manage contestant positions on the grid.
        <strong>GridInitializer</strong> provides a quick auto-positioning feature, while{' '}
        <strong>GridConfigurator</strong> offers full drag-and-drop control and grid dimension
        editing.
      </p>

      <ComponentController
        controls={[
          {
            type: 'group',
            label: 'Grid Dimensions',
            controls: [
              {
                type: 'slider',
                label: 'Grid Rows',
                value: gridRows,
                min: 3,
                max: 10,
                step: 1,
                onChange: (val) => {
                  handleSetRows(val as number);
                },
              },
              {
                type: 'slider',
                label: 'Grid Columns',
                value: gridCols,
                min: 3,
                max: 10,
                step: 1,
                onChange: (val) => {
                  handleSetCols(val as number);
                },
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
                label: '🗑️ Remove',
                onClick: handleRemoveContestant,
                variant: 'danger',
                disabled: contestants.length <= 1,
              },
              {
                type: 'button',
                label: '🎲 Randomize',
                onClick: handleRandomizePositions,
                variant: 'secondary',
              },
              {
                type: 'button',
                label: '🧹 Clear Grid',
                onClick: handleClearGrid,
                variant: 'secondary',
              },
            ],
          },
        ]}
        onReset={handleReset}
        description={
          <>
            <p>
              Adjust grid dimensions and manage contestants. Add contestants to test with more
              players, randomize to auto-position unpositioned contestants.
            </p>
            <p style={{ marginTop: '0.75rem' }}>
              <strong>Try it out:</strong> Alice and Bob are already positioned. Carol and David are
              unpositioned. Use the GridInitializer to auto-position everyone, or use the
              GridConfigurator below to drag and drop contestants manually!
            </p>
          </>
        }
      />

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>
        <code>&lt;GridInitializer /&gt;</code>
      </h3>
      <p>Quick status overview and auto-positioning button:</p>
      <GridInitializer contestants={contestants} onUpdate={handleUpdate} gridConfig={gridConfig} />

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>
        <code>&lt;GridConfigurator /&gt;</code>
      </h3>
      <p>
        Full drag-and-drop interface with grid dimension controls. Drag contestants from the
        unpositioned list onto the grid, or drag positioned contestants to new squares:
      </p>
      <GridConfigurator
        contestants={contestants}
        onUpdateContestants={handleUpdate}
        gridConfigState={[gridConfig, setGridConfig]}
      />

      <p style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: '500' }}>
        Grid Preview (Audience View):
      </p>
      <div
        style={
          {
            maxWidth: '600px',
            height: '400px',
            margin: '1rem auto 0',
            border: '2px solid var(--border-default)',
            backgroundColor: '#1e3a5f',
            display: 'flex',
            flexDirection: 'column',
            '--grid-text-scale': '0.75',
          } as React.CSSProperties
        }
      >
        <FloorGrid
          contestants={contestants}
          selectedContestantIds={[]}
          defaultConfig={gridConfig}
        />
      </div>
    </section>
  );
}
