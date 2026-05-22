// import { createContext, useContext, useEffect, useState } from "react";
// import axiosInstance from "../api/axiosInstance";

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(() => {
//     const savedUser = localStorage.getItem("user");
//     return savedUser ? JSON.parse(savedUser) : null;
//   });

//   const [loading, setLoading] = useState(true);

//   const isAuthenticated = Boolean(user && localStorage.getItem("accessToken"));

// const login = async ({ email, password, rememberDevice }) => {
//   const response = await axiosInstance.post("/auth/login", {
//     email: email.trim(),
//     password,
//     rememberDevice,
//   });

//   const { accessToken, user } = response.data.data;

//   localStorage.setItem("accessToken", accessToken);
//   localStorage.setItem("user", JSON.stringify(user));

//   setUser(user);

//   return user;
// };

//   const logout = async () => {
//     try {
//       await axiosInstance.post("/auth/logout");
//     } catch (error) {
//       console.error("Logout error:", error.message);
//     } finally {
//       localStorage.removeItem("accessToken");
//       localStorage.removeItem("user");
//       setUser(null);
//       window.location.href = "/login";
//     }
//   };

//   const hasPermission = (permission) => {
//     if (!user?.permissions) return false;
//     return user.permissions.includes(permission);
//   };

//   const hasAnyPermission = (permissions = []) => {
//     if (!user?.permissions) return false;
//     return permissions.some((permission) => user.permissions.includes(permission));
//   };

//   const fetchMe = async () => {
//     try {
//       const token = localStorage.getItem("accessToken");

//       if (!token) {
//         setLoading(false);
//         return;
//       }

//       const response = await axiosInstance.get("/auth/me");
//       const freshUser = response.data.data.user;

//       localStorage.setItem("user", JSON.stringify(freshUser));
//       setUser(freshUser);
//     } catch (error) {
//       localStorage.removeItem("accessToken");
//       localStorage.removeItem("user");
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchMe();
//   }, []);

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         isAuthenticated,
//         login,
//         logout,
//         hasPermission,
//         hasAnyPermission,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   return useContext(AuthContext);
// };


//DEMO MODE - REMOVE THIS IN PRODUCTION
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
  const [user, setUser] = useState(isDemoMode ? demoUser : null);
  const [loading, setLoading] = useState(false);

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

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const login = async (email, password, rememberDevice = true) => {
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
      email,
      password,
      rememberDevice,
    });

    const data = response.data.data || response.data;

    const loggedInUser = data.user;
    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(loggedInUser));

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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};