import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { getToken, setToken, apiBaseUrl } from "./auth.js";

export default function LoginPanel() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getToken()) {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Login failed.");
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
          Sign In
        </h1>
        <p style={{ fontSize: 13, color: "#a89f8f", margin: "0 0 28px" }}>
          Enter your details to access your account
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="op-heading" style={{ fontSize: 11, color: "#d4a24e", display: "block", marginBottom: 8 }}>
              phone
            </label>
            <div className="op-input-wrap">
              <Phone size={16} color="#8a8478" />
              <input
                type="phone"
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

          <button type="submit" className="op-submit" disabled={submitting}>
            {submitting ? "signing in…" : (<>sign in <ArrowRight size={16} /></>)}
          </button>
        </form>

      </div>
    </div>
  );
}
