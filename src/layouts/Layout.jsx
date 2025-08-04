import { Link } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children, title = "Summer Tech Showcase 2025" }) => {
  return (
    <div className="app-layout">
      <header className="header">
        <nav className="nav">
          <div className="nav-brand">
            <h1>{title}</h1>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/mockinterview" className="nav-link">Mock Interview</Link>
            <Link to="/algorithmvis" className="nav-link">Algorithm Visualizer</Link>
          </div>
        </nav>
      </header>
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <p>© 2025 Summer Tech Showcase</p>
      </footer>
    </div>
  );
};

export default Layout;