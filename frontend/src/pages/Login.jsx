import { useState } from "react";
import { Link } from "react-router-dom";
import { useLogin } from "../hooks/useLogin";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { error, loading, login } = useLogin();

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login(username, password);
  };

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <p className="eyebrow">Welcome Back</p>
        <h1>Stay in control of your cash flow.</h1>
        <p>
          Log in to sync connected accounts, review transaction trends, and keep
          your personal ledger current.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="auth-card">
        <h2>Login</h2>

        <label className="field">
          <span>Username</span>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button className="primary-button auth-submit" disabled={loading} type="submit">
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && <p className="status-message status-error">{error}</p>}

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
