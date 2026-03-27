import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

function NgehnoomLogoFull() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "linear-gradient(135deg, #FFAB00, #FF9500, #FF2D55)",
        padding: 3, flexShrink: 0,
      }}>
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width={30} height={26} viewBox="0 0 22 18" fill="none">
            <path d="M2 16V6C2 6 2 2 6.5 2C11 2 11 6 11 6V16" stroke="#FF9500" strokeWidth="3" strokeLinecap="round" />
            <path d="M11 16V6C11 6 11 2 15.5 2C20 2 20 6 20 6V16" stroke="#FF9500" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1 }}>ngehnoom</p>
        <p style={{ fontSize: 13, color: "#6E6E73", marginTop: 4 }}>Admin Dashboard</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "kasir") navigate("/kasir");
      else if (user.role === "dapur") navigate("/kasir/kitchen");
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login(username, password);
    } catch (err: any) {
      const msg = err?.message || "Username atau password salah.";
      setError(msg);
      toast({ title: "Login gagal", description: msg, variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #FFF8F0 0%, #FFFFFF 50%, #FFF0F4 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: "fixed", top: -100, left: -100, width: 300, height: 300,
        borderRadius: "50%", background: "rgba(255,149,0,0.08)", pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: -80, right: -80, width: 250, height: 250,
        borderRadius: "50%", background: "rgba(255,45,85,0.07)", pointerEvents: "none",
      }} />

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 400,
        background: "#fff", borderRadius: 28,
        padding: "40px 32px 32px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
        position: "relative",
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <NgehnoomLogoFull />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", display: "block", marginBottom: 6 }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              disabled={isLoading}
              autoComplete="username"
              data-testid="input-username"
              style={{
                width: "100%", height: 48, padding: "0 16px",
                background: "#F5F5F7", border: "2px solid transparent",
                borderRadius: 14, fontSize: 15, outline: "none",
                boxSizing: "border-box", transition: "border-color 0.2s",
              }}
              onFocus={e => (e.target.style.borderColor = "#FF9500")}
              onBlur={e => (e.target.style.borderColor = "transparent")}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              disabled={isLoading}
              data-testid="input-password"
              autoComplete="current-password"
              style={{
                width: "100%", height: 48, padding: "0 16px",
                background: "#F5F5F7", border: "2px solid transparent",
                borderRadius: 14, fontSize: 15, outline: "none",
                boxSizing: "border-box", transition: "border-color 0.2s",
              }}
              onFocus={e => (e.target.style.borderColor = "#FF9500")}
              onBlur={e => (e.target.style.borderColor = "transparent")}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(255,59,48,0.08)", borderRadius: 12, padding: "10px 14px",
              marginBottom: 16, fontSize: 13, color: "#FF3B30", fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            data-testid="button-login"
            style={{
              width: "100%", height: 52, borderRadius: 16, border: "none",
              background: isLoading ? "#FFCC85" : "linear-gradient(135deg, #FF9500, #FF6B00)",
              color: "#fff", fontWeight: 700, fontSize: 16,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(255,149,0,0.35)",
              transition: "opacity 0.2s",
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: "2.5px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  animation: "spin 0.8s linear infinite",
                }} />
                Memproses...
              </>
            ) : (
              "Masuk ke Dashboard"
            )}
          </button>
        </form>

        {/* Back to home */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => navigate("/")}
            data-testid="button-back-home"
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "#6E6E73", fontWeight: 500,
            }}
          >
            ← Kembali ke Halaman Pelanggan
          </button>
        </div>
      </div>

      {/* Tagline */}
      <p style={{ marginTop: 20, fontSize: 12, color: "#AEAEB2" }}>
        #YangNyamanJadiSayang
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
