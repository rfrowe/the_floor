import { Link } from 'react-router-dom';

function AudienceView() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Audience View - Display Screen</h1>
      <p>
        This is the audience-facing display view designed for projector/screen output. It shows the
        current game state, active duels, and results in a visually engaging format.
      </p>

      <nav style={{ marginTop: '2rem' }}>
        <h2>Navigation</h2>
        <ul>
          <li>
            <Link to="/">Back to Dashboard</Link>
          </li>
          <li>
            <Link to="/master">Go to Master View</Link>
          </li>
        </ul>
      </nav>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0' }}>
        <h3>Planned Features (Future Tasks)</h3>
        <ul>
          <li>Full-screen territory grid visualization</li>
          <li>Animated category reveals</li>
          <li>Live duel display with timer</li>
          <li>Answer reveals and scoring animations</li>
          <li>Winner celebrations</li>
        </ul>
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', border: '2px solid #ff9800' }}>
        <strong>Note:</strong> In production, this view should be opened in full-screen mode on a
        separate display/projector.
      </div>
    </div>
  );
}

export default AudienceView;
