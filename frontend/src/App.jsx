import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './hooks/useAuthContext';

// Pages and Components
import Home from './pages/Home';
import Spending from './pages/Spending';
import Income from './pages/Income';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import LinkAccounts from './pages/LinkAccounts';
import Info from './pages/Info';

function App() {

  const { user } = useAuthContext();

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <div className="pages">
          <Routes>
            <Route 
              exact path="/"
              element={user ? <Home /> : <Navigate to="/login" />}
            />
            <Route
              path="/info"
              element={user ? <Info /> : <Navigate to="/login" />}
            />
            <Route
              path="/linkaccount"
              element={user ? <LinkAccounts /> : <Navigate to="/login" />}
            />
            <Route
              path="/spending"
              element={user ? <Spending /> : <Navigate to="/login" />}
            />
            <Route
              path="/income"
              element={user ? <Income /> : <Navigate to="/login" />}
            />
            <Route
              path="/login"
              element={!user ? <Login /> : <Navigate to="/" />}
            />
            <Route
              path="/register"
              element={!user ? <Register /> : <Navigate to="/" />}
            />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
