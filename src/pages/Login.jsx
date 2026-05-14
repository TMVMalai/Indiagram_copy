import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Login({ setLoggedInUser }) {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = () => {
    if (!emailOrUsername.trim() || !password.trim()) {
      toast.error("Please enter username/email and password");
      return;
    }

    fetch("http://localhost:3000/users")
      .then((res) => res.json())
      .then((users) => {
        const loggedUser = users.find(
          (user) =>
            (user.email === emailOrUsername ||
              user.username === emailOrUsername) &&
            user.password === password
        );

        if (!loggedUser) {
          toast.error("Invalid username/email or password");
          return;
        }

        localStorage.setItem("loggedInUser", JSON.stringify(loggedUser));
        setLoggedInUser(loggedUser);

        toast.success(`Welcome ${loggedUser.username}`);

        setTimeout(() => {
          navigate("/");
        }, 800);
      })
      .catch((err) => {
        console.log("Login error:", err);
        toast.error("Login failed. Check JSON Server.");
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="border rounded p-4" style={{ width: "350px" }}>
        <h3 className="text-center mb-4">Login</h3>

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Username or Email"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
        />

        <input
          type="password"
          className="form-control mb-3"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn btn-primary w-100 mb-3" onClick={handleLogin}>
          Login
        </button>

        <p className="text-center mb-0">
          Don't have an account? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;