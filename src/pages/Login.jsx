import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const AUTH_URL = "http://localhost:4000/api/auth";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);

      const response = await fetch(`${AUTH_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Login failed.");
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to the backend. Check whether your server is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app auth-page">
      <section className="auth-card">
        <header className="auth-header">
          <h1>Welcome Back</h1>
          <p>Login to access your Task Manager.</p>
        </header>

        {error && <p className="notice error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email Address</label>

          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={254}
            disabled={loading}
          />

          <label htmlFor="login-password">Password</label>

          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;