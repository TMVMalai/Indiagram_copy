import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function SideBar({ setLoggedInUser }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem("loggedInUser"));

  useEffect(() => {
    fetchUnreadNotifications();

    const interval = setInterval(() => {
      fetchUnreadNotifications();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchUnreadNotifications = () => {
    const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!loggedUser) return;

    fetch(
      `/notifications?toUserId=${loggedUser.id}&isRead=false`
    )
      .then((res) => res.json())
      .then((data) => {
        setUnreadCount(data.length);
      })
      .catch((err) => console.log("Notification count error:", err));
  };

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    setLoggedInUser(null);
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="m-3 position-fixed" style={{ width: "210px", zIndex: 1000 }}>
      <div className="d-flex flex-column gap-3">
        <img
          className="logo-text"
          src="src/assets/ChatGPT Image May 15, 2026, 11_14_10 AM (2).png"
          alt="Instagram"
        />

        <NavLink to="/" className="sidebar-link">
          <i className="bi bi-house me-2"></i>Home
        </NavLink>

        <NavLink to="/search" className="sidebar-link">
          <i className="bi bi-search me-2"></i>Search
        </NavLink>

        <NavLink to="/explore" className="sidebar-link">
          <i className="bi bi-compass me-2"></i>Explore
        </NavLink>

        <NavLink to="/reels" className="sidebar-link">
          <i className="bi bi-play-btn me-2"></i>Reels
        </NavLink>

        <NavLink to="/messages" className="sidebar-link">
          <i className="bi bi-chat me-2"></i>Messages
        </NavLink>

        <NavLink
          to="/notifications"
          className="sidebar-link d-flex align-items-center justify-content-between"
        >
          <span>
            <i className="bi bi-heart me-2"></i>Notifications
          </span>

          {unreadCount > 0 && (
            <span
              className="badge bg-danger rounded-pill"
              style={{ fontSize: "11px" }}
            >
              {unreadCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/create" className="sidebar-link">
          <i className="bi bi-plus-square me-2"></i>Create
        </NavLink>

        <NavLink to="/profile" className="sidebar-link">
          <i className="bi bi-person-circle me-2"></i>Profile
        </NavLink>
      </div>

      <div className="position-fixed bottom-0 d-flex flex-column gap-3 mb-3">
        <NavLink to="/threads" className="sidebar-link">
          <i className="bi bi-threads me-2"></i>Threads
        </NavLink>

        <NavLink to="/more" className="sidebar-link">
          <i className="bi bi-list me-2"></i>More
        </NavLink>

        <button className="btn btn-outline-danger btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default SideBar;