import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Search() {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetch("/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.log("Users fetch error:", err));
  }, []);

  const filteredUsers = users.filter((user) => {
    const text = searchText.toLowerCase();

    return (
      user.username.toLowerCase().includes(text) ||
      user.fullName.toLowerCase().includes(text)
    );
  });

  const openUserProfile = (userId) => {
    navigate(`/user/${userId}`);
  };

  return (
    <div>
      <h2>Search</h2>

      <input
        type="text"
        className="form-control mb-4"
        style={{ width: "450px" }}
        placeholder="Search users..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <div style={{ width: "500px" }}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="d-flex align-items-center gap-3 border-bottom py-3"
              style={{ cursor: "pointer" }}
              onClick={() => openUserProfile(user.id)}
            >
              <img
                src={user.profilePic}
                alt={user.username}
                width="55"
                height="55"
                className="rounded-circle"
              />

              <div>
                <h6 className="mb-0">{user.username}</h6>
                <p className="mb-0 text-muted">{user.fullName}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted">No users found</p>
        )}
      </div>
    </div>
  );
}

export default Search;