import { useState } from "react";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user || { email });
        return true;
      } else {
        throw new Error(data.detail || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  };

  const logout = () => setUser(null);

  return { user, login, logout, isAuthenticated: !!user };
};
