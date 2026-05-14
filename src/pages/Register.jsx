import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Register({ setLoggedInUser }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const createAccount = () => {
    if (
      !fullName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      toast.error("Please fill all fields");
      return;
    }

    fetch("/users")
      .then((res) => res.json())
      .then((users) => {
        const usernameExists = users.some((user) => user.username === username);
        const emailExists = users.some((user) => user.email === email);

        if (usernameExists) {
          toast.error("Username already exists");
          return;
        }

        if (emailExists) {
          toast.error("Email already exists");
          return;
        }

        const newUser = {
          username,
          email,
          password,
          fullName,
          profilePic: `https://i.pravatar.cc/150?u=${username}`,
          bio: "New to Thirugram",
          followers: 0,
          following: 0,
        };

        fetch("/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newUser),
        })
          .then((res) => res.json())
          .then((createdUser) => {
            localStorage.setItem("loggedInUser", JSON.stringify(createdUser));
            setLoggedInUser(createdUser);

            toast.success("Account created successfully");

            setTimeout(() => {
              navigate("/");
            }, 800);
          })
          .catch((err) => {
            console.log("Register error:", err);
            toast.error("Account creation failed");
          });
      })
      .catch((err) => {
        console.log("Users fetch error:", err);
        toast.error("Check JSON Server");
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="border rounded p-4" style={{ width: "380px" }}>
        <h3 className="text-center mb-4">Create Account</h3>

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          className="form-control mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="form-control mb-3"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn btn-success w-100 mb-3" onClick={createAccount}>
          Create Account
        </button>

        <p className="text-center mb-0">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;