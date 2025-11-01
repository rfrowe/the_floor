import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist.</p>

      <nav style={{ marginTop: '2rem' }}>
        <Link to="/" style={{ fontSize: '1.2rem', color: '#007bff' }}>
          Go back to Dashboard
        </Link>
      </nav>
    </div>
  );
}

export default NotFound;
