import React, { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import SideBar from "./SideBar";
import Feed from "./Feed";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Search from "./pages/Search";
import Explore from "./pages/Explore";
import Reels from "./pages/Reels";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Create from "./pages/Create";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Threads from "./pages/Threads";
import More from "./pages/More";

function App() {
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const ProtectedLayout = ({ children }) => {
    if (!loggedInUser) {
      return <Navigate to="/login" replace />;
    }

    return (
      <div>
        <SideBar setLoggedInUser={setLoggedInUser} />

        <div style={{ marginLeft: "250px", padding: "20px" }}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} />

      <Routes>
        <Route
          path="/login"
          element={<Login setLoggedInUser={setLoggedInUser} />}
        />

        <Route
          path="/register"
          element={<Register setLoggedInUser={setLoggedInUser} />}
        />

        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Feed />
            </ProtectedLayout>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedLayout>
              <Search />
            </ProtectedLayout>
          }
        />

        <Route
          path="/explore"
          element={
            <ProtectedLayout>
              <Explore />
            </ProtectedLayout>
          }
        />

        <Route
          path="/reels"
          element={
            <ProtectedLayout>
              <Reels />
            </ProtectedLayout>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedLayout>
              <Messages />
            </ProtectedLayout>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedLayout>
              <Notifications />
            </ProtectedLayout>
          }
        />

        <Route
          path="/create"
          element={
            <ProtectedLayout>
              <Create />
            </ProtectedLayout>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedLayout>
              <Profile />
            </ProtectedLayout>
          }
        />

        <Route
          path="/user/:userId"
          element={
            <ProtectedLayout>
              <UserProfile />
            </ProtectedLayout>
          }
        />

        <Route
          path="/threads"
          element={
            <ProtectedLayout>
              <Threads />
            </ProtectedLayout>
          }
        />

        <Route
          path="/more"
          element={
            <ProtectedLayout>
              <More />
            </ProtectedLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;