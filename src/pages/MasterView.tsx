import { Link } from 'react-router-dom';

function MasterView() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Master View - Duel Control Interface</h1>
      <p>
        This is the duel control interface where the game master manages individual duels, tracks
        answers, and controls the flow of each round.
      </p>

      <nav style={{ marginTop: '2rem' }}>
        <h2>Navigation</h2>
        <ul>
          <li>
            <Link to="/">Back to Dashboard</Link>
          </li>
          <li>
            <Link to="/audience">Go to Audience View</Link>
          </li>
        </ul>
      </nav>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0' }}>
        <h3>Planned Features (Future Tasks)</h3>
        <ul>
          <li>Active duel display</li>
          <li>Timer controls</li>
          <li>Answer validation interface</li>
          <li>Score tracking</li>
          <li>Winner declaration</li>
        </ul>
      </div>
    </div>
  );
}

export default MasterView;
