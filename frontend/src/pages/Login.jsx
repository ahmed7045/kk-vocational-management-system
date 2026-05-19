import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Card from "../components/common/Card";
import "./login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "admin@kkcenter.edu",
    password: "",
    rememberDevice: true,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    console.log("Submitting login form:", form);

    setError("");
    setLoading(true);

    try {
      await login({
        email: form.email,
        password: form.password,
        rememberDevice: form.rememberDevice,
      });

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
        <Card>
          <div className="login-card-header">
            <h2>Welcome Back</h2>
            <p>Login to access your management dashboard</p>
          </div>

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

            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />

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
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;