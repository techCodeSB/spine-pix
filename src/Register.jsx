import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { setToken, apiBaseUrl } from "./auth.js";

export default function RegisterPanel() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Registration failed.");
        setSubmitting(false);
        return;
      }

      setToken(data.token);
      navigate("/app", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif", background: "#1b1815", minHeight: "100vh",
      color: "#e9e4d8", display: "flex", alignItems: "center", justifyContent: "center", padding: 24
    }}>
      <div style={{
        width: "100%", maxWidth: 380, background: "#211d17", border: "1px solid #3a352c",
        borderRadius: 8, padding: "20px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
      }}>
        <h1 style={{ textAlign: "center", marginBlock: '20px' }}>SpinePix</h1>
        <h1 className="op-heading" style={{ fontSize: 24, margin: "6px 0 4px", color: "#f7f3ea" }}>
          Create Account
        </h1>
        <p style={{ fontSize: 13, color: "#a89f8f", margin: "0 0 28px" }}>
          Register and start creating passport photos.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="op-heading" style={{ fontSize: 11, color: "#d4a24e", display: "block", marginBottom: 8 }}>
              phone
            </label>
            <div className="op-input-wrap">
              <Phone size={16} color="#8a8478" />
              <input
                type="tel"
                placeholder="709******"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="op-heading" style={{ fontSize: 11, color: "#d4a24e", display: "block", marginBottom: 8 }}>
              Password
            </label>
            <div className="op-input-wrap">
              <Lock size={16} color="#8a8478" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="op-eye-btn" onClick={() => setShowPassword((s) => !s)} aria-label="toggle password visibility">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="op-heading" style={{ fontSize: 11, color: "#d4a24e", display: "block", marginBottom: 8 }}>
              Confirm Password
            </label>
            <div className="op-input-wrap">
              <Lock size={16} color="#8a8478" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div style={{ color: "#f18c8e", fontSize: 13, textAlign: "center" }}>{error}</div>
          )}

          <button type="submit" className="op-submit" disabled={submitting}>
            {submitting ? "registering…" : (<>create account <ArrowRight size={16} /></>)}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: "center", color: "#a89f8f", fontSize: 13 }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              border: "none",
              background: "transparent",
              color: "#d4a24e",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
              font: "inherit"
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
