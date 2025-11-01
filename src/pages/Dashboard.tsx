import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard - Game Master Control Center</h1>
      <p>
        This is the game master control center where you can manage contestants, configure game
        settings, and control the overall game flow.
      </p>

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
    </div>
  );
}

export default Dashboard;
