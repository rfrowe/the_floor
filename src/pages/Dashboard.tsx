import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category, Contestant } from '@types';
import { CategoryImporter } from '@components/CategoryImporter';
import { createContestantFromCategory } from '@utils/jsonImport';
import { useLocalStorage } from '@hooks/useLocalStorage';

function Dashboard() {
  const [showImporter, setShowImporter] = useState(false);
  const [contestants, setContestants] = useLocalStorage<Contestant[]>('contestants', []);

  const handleImport = (contestantName: string, category: Category) => {
    const newContestant = createContestantFromCategory(category, contestantName);
    setContestants((prev) => [...prev, newContestant]);
    setShowImporter(false);
    alert(`Successfully imported contestant "${contestantName}" with ${category.slides.length} slides!`);
  };

  const handleCancel = () => {
    setShowImporter(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard - Game Master Control Center</h1>
      <p>
        This is the game master control center where you can manage contestants, configure game
        settings, and control the overall game flow.
      </p>

      {!showImporter && (
        <>
          <div style={{ marginTop: '2rem' }}>
            <h2>Contestant Management</h2>
            <button
              type="button"
              onClick={() => {
                setShowImporter(true);
              }}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '1rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Import Contestant from JSON
            </button>

            {contestants.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h3>Imported Contestants ({contestants.length})</h3>
                <ul>
                  {contestants.map((contestant, index) => (
                    <li key={index}>
                      <strong>{contestant.name}</strong> - {contestant.category.name} (
                      {contestant.category.slides.length} slides)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <nav style={{ marginTop: '2rem' }}>
            <h2>Navigation</h2>
            <ul>
              <li>
                <Link to="/master">Go to Master View</Link>
              </li>
              <li>
                <Link to="/audience">Go to Audience View</Link>
              </li>
            </ul>
          </nav>

          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0' }}>
            <h3>Planned Features (Future Tasks)</h3>
            <ul>
              <li>Contestant management (add, edit, remove)</li>
              <li>Category selection and configuration</li>
              <li>Game state controls (start, pause, reset)</li>
              <li>Territory grid visualization</li>
            </ul>
          </div>
        </>
      )}

      {showImporter && <CategoryImporter onImport={handleImport} onCancel={handleCancel} />}
    </div>
  );
}

export default Dashboard;
