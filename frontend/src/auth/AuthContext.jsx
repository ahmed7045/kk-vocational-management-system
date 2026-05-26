import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext(null);

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const demoUser = {
  id: 1,
  fullName: "Admin User",
  full_name: "Admin User",
  email: "admin@kkcenter.edu",
  role: "super_admin",
  permissions: ["*"],
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (isDemoMode) return demoUser;

    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("accessToken");

    if (savedUser && savedToken) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }

    return null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem("accessToken", "demo-access-token");
      localStorage.setItem("refreshToken", "demo-refresh-token");
      localStorage.setItem("user", JSON.stringify(demoUser));
      setUser(demoUser);
      setLoading(false);
      return;
    }

    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("accessToken");

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  }, []);

  const login = async (emailOrData, passwordValue, rememberDeviceValue = true) => {
    let email = emailOrData;
    let password = passwordValue;
    let rememberDevice = rememberDeviceValue;

    if (typeof emailOrData === "object") {
      email = emailOrData.email;
      password = emailOrData.password;
      rememberDevice = emailOrData.rememberDevice ?? true;
    }

    if (isDemoMode) {
      localStorage.setItem("accessToken", "demo-access-token");
      localStorage.setItem("refreshToken", "demo-refresh-token");
      localStorage.setItem("user", JSON.stringify(demoUser));
      setUser(demoUser);

      return {
        success: true,
        user: demoUser,
      };
    }

    const response = await axiosInstance.post("/auth/login", {
      email: email?.trim(),
      password,
      rememberDevice,
    });

    const data = response.data.data || response.data;

    const loggedInUser = data.user;
    const accessToken = data.accessToken || data.access_token;
    const refreshToken = data.refreshToken || data.refresh_token;

    if (!loggedInUser || !accessToken) {
      throw new Error("Login response is missing user or access token");
    }

    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    if (loggedInUser.role !== "super_admin") {
      if (loggedInUser.portalAccess === "welfare") {
        localStorage.setItem("selectedPortal", "welfare");
        localStorage.removeItem("selectedBranchId");
        localStorage.removeItem("selectedBranchName");
        localStorage.removeItem("selectedBranchStatus");
      }

      if (loggedInUser.portalAccess === "vocational") {
        localStorage.setItem("selectedPortal", "vocational");

        if (loggedInUser.branchId) {
          localStorage.setItem("selectedBranchId", loggedInUser.branchId);
        }

        if (loggedInUser.branchName) {
          localStorage.setItem("selectedBranchName", loggedInUser.branchName);
        }
      }
    }
    setUser(loggedInUser);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedPortal");
    localStorage.removeItem("selectedBranchId");
    localStorage.removeItem("selectedBranchName");
    localStorage.removeItem("selectedBranchStatus");

    if (isDemoMode) {
      setUser(demoUser);
      window.location.href = "/portal-selection";
      return;
    }

    setUser(null);
    window.location.href = "/login";
  };

  const hasPermission = (permission) => {
    if (isDemoMode) return true;
    if (!user?.permissions) return false;
    if (user.permissions.includes("*")) return true;

    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions = []) => {
    if (isDemoMode) return true;
    if (!permissions.length) return true;

    return permissions.some((permission) => hasPermission(permission));
  };

  const isAuthenticated = Boolean(user && localStorage.getItem("accessToken"));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};