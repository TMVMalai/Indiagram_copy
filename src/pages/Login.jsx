import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Login({ setLoggedInUser }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginUser = () => {
    if (!email.trim()) {
      toast.error("Please enter email");
      return;
    }

    if (!password.trim()) {
      toast.error("Please enter password");
      return;
    }

    fetch(`/users?email=${encodeURIComponent(email.trim())}`)
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Unable to connect to server");
        }

        return res.json();
      })
      .then((users) => {
        if (!Array.isArray(users)) {
          toast.error("Invalid server response");
          return;
        }

        if (users.length === 0) {
          toast.error("User not found");
          return;
        }

        const user = users[0];

        if (user.password !== password) {
          toast.error("Invalid password");
          return;
        }

        localStorage.setItem("loggedInUser", JSON.stringify(user));

        if (setLoggedInUser) {
          setLoggedInUser(user);
        }

        toast.success(`Welcome ${user.username}`);
        navigate("/");
      })
      .catch((err) => {
        console.log("Login error:", err);
        toast.error("Unable to login. Please check server/API.");
      });
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="border rounded p-4" style={{ width: "380px" }}>
        <h2 className="text-center mb-4">Indiaagram Login</h2>

        <input
          type="email"
          className="form-control mb-3"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="form-control mb-3"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              loginUser();
            }
          }}
        />

        <button className="btn btn-primary w-100 mb-3" onClick={loginUser}>
          Login
        </button>

        <p className="text-center mb-0">
          Don&apos;t have an account?{" "}
          <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;