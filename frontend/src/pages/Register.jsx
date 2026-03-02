import { useState } from "react";
import { Link } from "react-router-dom";
import { useRegister } from "../hooks/useRegister";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { error, loading, register } = useRegister();

  const handleSubmit = async (event) => {
    event.preventDefault();
    await register(username, password, confirmPassword);
  };

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <p className="eyebrow">Get Started</p>
        <h1>Build a cleaner money dashboard in minutes.</h1>
        <p>
          Create your account to connect institutions through Plaid and track
          spending, income, and net cash flow in one place.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="auth-card">
        <h2>Create Account</h2>

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

        <label className="field">
          <span>Confirm Password</span>
          <input
            type="password"
            placeholder="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>

        <button className="primary-button auth-submit" disabled={loading} type="submit">
          {loading ? "Creating account..." : "Register"}
        </button>

        {error && <p className="status-message status-error">{error}</p>}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
