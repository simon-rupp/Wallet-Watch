import { Link } from "react-router-dom";
import { useLogout } from "../hooks/useLogout";
import { useAuthContext } from "../hooks/useAuthContext";

const Navbar = () => {
  const { logout } = useLogout();
  const { user } = useAuthContext();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link to="/" className="brand">
          <span className="brand-mark">WW</span>
          <span className="brand-copy">
            <span className="brand-title">Wallet Watch</span>
            <span className="brand-subtitle">Personal Finance Dashboard</span>
          </span>
        </Link>

        {user && (
          <nav className="nav-links" aria-label="Main navigation">
            <Link to="/" className="nav-pill">
              Dashboard
            </Link>
            <Link to="/spending" className="nav-pill">
              Spending
            </Link>
            <Link to="/income" className="nav-pill">
              Income
            </Link>
            <Link to="/linkaccount" className="nav-pill">
              Connect Bank
            </Link>
            <Link to="/info" className="nav-pill">
              About
            </Link>
          </nav>
        )}

        <div className="nav-actions">
          {!user && (
            <>
              <Link to="/info" className="ghost-button">
                About
              </Link>
              <Link to="/login" className="primary-button compact">
                Login
              </Link>
            </>
          )}

          {user && (
            <>
              <span className="user-chip">{user.username}</span>
              <button className="ghost-button" onClick={handleLogout} type="button">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
