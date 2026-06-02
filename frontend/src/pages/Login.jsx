// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../auth/AuthContext";
// import Button from "../components/common/Button";
// import Input from "../components/common/Input";
// import Card from "../components/common/Card";
// import "./login.css";

// const Login = () => {
//   const navigate = useNavigate();
//   const { login } = useAuth();

//   const [form, setForm] = useState({
//     email: "admin@kkcenter.edu",
//     password: "",
//     rememberDevice: true,
//   });

//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleChange = (event) => {
//     const { name, value, type, checked } = event.target;

//     setForm((previousForm) => ({
//       ...previousForm,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     console.log("Submitting login form:", form);

//     setError("");
//     setLoading(true);

//     try {
//       await login({
//         email: form.email,
//         password: form.password,
//         rememberDevice: form.rememberDevice,
//       });

//       navigate("/portal-selection");
//     } catch (error) {
//       setError(error.response?.data?.message || "Login failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-page">
//       <div className="login-left">
//         <div className="brand-box">
//           <div className="brand-logo">KK</div>
//           <h1>KK Management Portal</h1>
//           <p>Vocational Training Center & Welfare Management System</p>
//         </div>
//       </div>

//       <div className="login-right">
//         <Card>
//           <div className="login-card-header">
//             <h2>Welcome Back</h2>
//             <p>Login to access your management dashboard</p>
//           </div>

//           {error && <div className="login-error">{error}</div>}

//           <form onSubmit={handleSubmit}>
//             <Input
//               label="Email"
//               name="email"
//               type="email"
//               value={form.email}
//               onChange={handleChange}
//               placeholder="admin@kkcenter.edu"
//               required
//             />

//             <Input
//               label="Password"
//               name="password"
//               type="password"
//               value={form.password}
//               onChange={handleChange}
//               placeholder="Enter your password"
//               required
//             />

//             <div className="login-options">
//               <label>
//                 <input
//                   type="checkbox"
//                   name="rememberDevice"
//                   checked={form.rememberDevice}
//                   onChange={handleChange}
//                 />
//                 Remember this device
//               </label>

//               <span>Forgot Password?</span>
//             </div>

//             <Button type="submit" loading={loading}>
//               Login to Portal
//             </Button>
//           </form>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default Login;


import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Card from "../components/common/Card";
import "./login.css";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "admin@kkcenter.edu",
    password: "Admin@123",
    rememberDevice: true,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const redirectAfterLogin = (loggedInUser) => {
    if (loggedInUser?.role === "super_admin") {
      navigate("/portal-selection");
      return;
    }

    if (loggedInUser?.portalAccess === "welfare") {
      navigate("/app/welfare");
      return;
    }

    if (loggedInUser?.portalAccess === "vocational") {
      navigate("/app/dashboard");
      return;
    }

    navigate("/login");
  };

  const setDemoLoginData = () => {
    localStorage.setItem("accessToken", "demo-access-token");
    localStorage.setItem("refreshToken", "demo-refresh-token");

    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 1,
        fullName: "Demo Super Admin",
        email: "admin@kkcenter.edu",
        role: "super_admin",
        roleName: "super_admin",
        isSuperAdmin: true,
      })
    );

    localStorage.setItem("selectedPortal", "vocational");
    localStorage.setItem("selectedBranchId", "1");
    localStorage.setItem("selectedBranchName", "Branch 1");
    localStorage.setItem("selectedBranchStatus", "active");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (isDemoMode) {
        setDemoLoginData();
        navigate("/portal-selection");
        return;
      }
      const result = await login({
        email: form.email,
        password: form.password,
        rememberDevice: form.rememberDevice,
      });

      const loggedInUser =
        result?.data?.user ||
        result?.user ||
        JSON.parse(localStorage.getItem("user") || "null");

      if (loggedInUser?.role === "super_admin") {
        navigate("/portal-selection");
        return;
      }

      if (loggedInUser?.portalAccess === "vocational") {
        navigate("/app/dashboard");
        return;
      }

      if (loggedInUser?.portalAccess === "welfare") {
        navigate("/app/welfare");
        return;
      }

      navigate("/login");

      navigate("/portal-selection");
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="brand-box">
          <div className="brand-logo">KK</div>
          <h1>KK Management Portal</h1>
          <p>Vocational Training Center & Welfare Management System</p>
        </div>
      </div>

      <div className="login-right">
        <Card className="login-card">
          <div className="login-card-header">
            <h2>Welcome Back</h2>
            <p>Login to access your management dashboard</p>
          </div>

          {isDemoMode && (
            <div className="login-error" style={{ background: "#ecfdf5", color: "#047857" }}>
              Demo Mode: use admin@kkcenter.edu / Admin@123
            </div>
          )}

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@kkcenter.edu"
              required
            />

            <div className="form-group">
              <label htmlFor="password">
                Password <span>*</span>
              </label>

              <div className="login-password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label>
                <input
                  type="checkbox"
                  name="rememberDevice"
                  checked={form.rememberDevice}
                  onChange={handleChange}
                />
                Remember this device
              </label>

              <span>Forgot Password?</span>
            </div>

            <Button type="submit" loading={loading}>
              Login to Portal
            </Button>

            {/* <div className="login-footer">
              <p>© 2026 KK Welfare Association. All rights reserved.</p>
              <p>
                Powered by{" "}
                <a
                  href="https://www.cybrox.info/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Cybrox
                </a>
              </p>
            </div> */}
          </form>
        </Card>
         <div className="login-footer">
              <p>© 2026 KK Welfare Association. All rights reserved.</p>
              <p>
                Powered by{" "}
                <a
                  href="https://www.cybrox.info/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Cybrox
                </a>
              </p>
            </div>
      </div>
    </div>
  );
};

export default Login;