import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(user && localStorage.getItem("accessToken"));

const login = async ({ email, password, rememberDevice }) => {
  const response = await axiosInstance.post("/auth/login", {
    email: email.trim(),
    password,
    rememberDevice,
  });

  const { accessToken, user } = response.data.data;

  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("user", JSON.stringify(user));

  setUser(user);

  return user;
};

  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error.message);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
      window.location.href = "/login";
    }
  };

  const hasPermission = (permission) => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions = []) => {
    if (!user?.permissions) return false;
    return permissions.some((permission) => user.permissions.includes(permission));
  };

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axiosInstance.get("/auth/me");
      const freshUser = response.data.data.user;

      localStorage.setItem("user", JSON.stringify(freshUser));
      setUser(freshUser);
    } catch (error) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};