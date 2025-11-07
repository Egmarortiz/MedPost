import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { API_ENDPOINTS } from "../config/api";

const getStorageItem = async (key: string) => {
  if (Platform.OS === "web") {
    return Promise.resolve(window.localStorage.getItem(key));
  } else {
    return AsyncStorage.getItem(key);
  }
};

const setStorageItem = async (key: string, value: string) => {
  if (Platform.OS === "web") {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  } else {
    return AsyncStorage.setItem(key, value);
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadAuth = async () => {
      try {
  const storedToken = await getStorageItem("token");
  const storedUser = await getStorageItem("user");
  if (storedToken) setToken(storedToken);
  if (storedUser) setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error loading auth data:", error);
      }
    };
    loadAuth();
  }, []);

  // login type worker | facility , default: worker
  const login = async (email: string, password: string, loginType: 'worker' | 'facility' = 'worker') => {
    try {
      const endpoint = loginType === 'facility' ? API_ENDPOINTS.FACILITY_LOGIN : API_ENDPOINTS.WORKER_LOGIN;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const newUser = data.user || { email };
        const newToken = data.access_token;
        setUser(newUser);
        setToken(newToken);
        await setStorageItem("token", newToken);
        await setStorageItem("user", JSON.stringify(newUser));
        return true;
      } else {
        throw new Error(data.detail || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
  };

  const saveToken = async (newToken: string) => {
    setToken(newToken);
    await AsyncStorage.setItem("token", newToken);
  };

  const saveUser = async (newUser: any) => {
    setUser(newUser);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
  };

  return {
    user,
    token,
    login,
    logout,
    saveToken,
    saveUser,
    isAuthenticated: !!user && !!token,
  };
};
