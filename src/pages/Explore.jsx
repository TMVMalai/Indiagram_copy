import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Explore() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: 1,
    username: "thirumalaivasan",
    profilePic: "https://i.pravatar.cc/150?img=12",
  };

  const trendingTags = [
    "travel",
    "food",
    "fitness",
    "coding",
    "fashion",
    "nature",
    "dance",
    "music",
  ];

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = () => {
    setLoading(true);

    Promise.all([
      fetch("http://localhost:3000/posts").then((res) => res.json()),
      fetch("http://localhost:3000/users").then((res) => res.json()),
    ])
      .then(([postsData, usersData]) => {
        const formattedPosts = postsData.map((post) => ({
          ...post,
          comments: post.comments || [],
          likes: post.likes || 0,
          liked: post.liked || false,
        }));

        setPosts(formattedPosts);
        setUsers(usersData);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Explore fetch error:", err);
        toast.error("Unable to load explore data");
        setLoading(false);
      });
  };

  const filteredPosts = posts.filter((post) => {
    const text = searchText.toLowerCase();
    const tag = selectedTag.toLowerCase();

    const matchesSearch =
      post.username.toLowerCase().includes(text) ||
      post.caption.toLowerCase().includes(text);

    const matchesTag =
      selectedTag === "" ||
      post.caption.toLowerCase().includes(tag) ||
      post.username.toLowerCase().includes(tag);

    return matchesSearch && matchesTag;
  });

  const suggestedUsers = users.filter((user) => {
    if (Number(user.id) === Number(currentUser.id)) return false;

    const followingIds = currentUser.followingIds || [];
    return !followingIds.includes(user.id);
  });

  const openPost = (post) => {
    setSelectedPost(post);
    setCommentText("");
  };

  const closePost = () => {
    setSelectedPost(null);
    setCommentText("");
  };

  const handleLike = (post) => {
    const updatedPost = {
      ...post,
      liked: !post.liked,
      likes: post.liked ? post.likes - 1 : post.likes + 1,
    };

    fetch(`http://localhost:3000/posts/${post.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        liked: updatedPost.liked,
        likes: updatedPost.likes,
      }),
    })
      .then((res) => res.json())
      .then((serverPost) => {
        setPosts((prevPosts) =>
          prevPosts.map((p) => (p.id === post.id ? serverPost : p))
        );

        if (selectedPost?.id === post.id) {
          setSelectedPost(serverPost);
        }

        toast.success(updatedPost.liked ? "Post liked" : "Post unliked");
      })
      .catch((err) => {
        console.log("Like error:", err);
        toast.error("Unable to update like");
      });
  };

  const submitComment = () => {
    if (commentText.trim() === "") {
      toast.error("Please enter a comment");
      return;
    }

    const newComment = {
      id: Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      profilePic: currentUser.profilePic,
      text: commentText,
      commentedAt: new Date().toISOString(),
    };

    const updatedComments = [...(selectedPost.comments || []), newComment];

    fetch(`http://localhost:3000/posts/${selectedPost.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comments: updatedComments,
      }),
    })
      .then((res) => res.json())
      .then((serverPost) => {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === selectedPost.id ? serverPost : post
          )
        );

        setSelectedPost(serverPost);
        setCommentText("");
        toast.success("Comment added");
      })
      .catch((err) => {
        console.log("Comment error:", err);
        toast.error("Unable to add comment");
      });
  };

  const followUser = (targetUser) => {
    const followingIds = currentUser.followingIds || [];
    const targetFollowersIds = targetUser.followersIds || [];

    if (followingIds.includes(targetUser.id)) {
      toast.info(`Already following ${targetUser.username}`);
      return;
    }

    const updatedCurrentFollowingIds = [...followingIds, targetUser.id];
    const updatedTargetFollowersIds = [...targetFollowersIds, currentUser.id];

    const updatedCurrentUser = {
      ...currentUser,
      followingIds: updatedCurrentFollowingIds,
      following: updatedCurrentFollowingIds.length,
    };

    const updatedTargetUser = {
      ...targetUser,
      followersIds: updatedTargetFollowersIds,
      followers: updatedTargetFollowersIds.length,
    };

    Promise.all([
      fetch(`http://localhost:3000/users/${currentUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          followingIds: updatedCurrentFollowingIds,
          following: updatedCurrentFollowingIds.length,
        }),
      }),
      fetch(`http://localhost:3000/users/${targetUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          followersIds: updatedTargetFollowersIds,
          followers: updatedTargetFollowersIds.length,
        }),
      }),
    ])
      .then(() => {
        localStorage.setItem("loggedInUser", JSON.stringify(updatedCurrentUser));

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            Number(user.id) === Number(targetUser.id) ? updatedTargetUser : user
          )
        );

        toast.success(`You followed ${targetUser.username}`);
      })
      .catch((err) => {
        console.log("Follow error:", err);
        toast.error("Unable to follow user");
      });
  };

  const clearFilters = () => {
    setSearchText("");
    setSelectedTag("");
  };

  if (loading) {
    return <div>Loading Explore...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Explore</h2>

      <div className="d-flex gap-4 align-items-start">
        <div style={{ width: "700px" }}>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Search posts by username or caption..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <div className="d-flex flex-wrap gap-2 mb-4">
            {trendingTags.map((tag) => (
              <button
                key={tag}
                className={
                  selectedTag === tag
                    ? "btn btn-dark btn-sm"
                    : "btn btn-outline-dark btn-sm"
                }
                onClick={() => setSelectedTag(tag)}
              >
                #{tag}
              </button>
            ))}

            {(searchText || selectedTag) && (
              <button className="btn btn-outline-danger btn-sm" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>

          {filteredPosts.length > 0 ? (
            <div className="d-flex flex-wrap gap-3">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  style={{ width: "210px", cursor: "pointer" }}
                  onClick={() => openPost(post)}
                >
                  <img
                    src={post.image}
                    alt={post.caption}
                    width="210"
                    height="210"
                    style={{
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />

                  <div className="d-flex justify-content-between mt-2">
                    <span>
                      <i className="bi bi-heart"></i> {post.likes}
                    </span>
                    <span>
                      <i className="bi bi-chat"></i>{" "}
                      {post.comments?.length || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No posts found</p>
          )}
        </div>

        <div style={{ width: "300px" }}>
          <h5>Suggested Accounts</h5>

          {suggestedUsers.length > 0 ? (
            suggestedUsers.slice(0, 8).map((user) => (
              <div
                key={user.id}
                className="d-flex justify-content-between align-items-center border-bottom py-2"
              >
                <div
                  className="d-flex align-items-center gap-2"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/user/${user.id}`)}
                >
                  <img
                    src={user.profilePic}
                    alt={user.username}
                    width="40"
                    height="40"
                    className="rounded-circle"
                  />

                  <div>
                    <strong>{user.username}</strong>
                    <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                      {user.fullName}
                    </p>
                  </div>
                </div>

                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => followUser(user)}
                >
                  Follow
                </button>
              </div>
            ))
          ) : (
            <p className="text-muted">No suggestions</p>
          )}
        </div>
      </div>

      {selectedPost && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 9999 }}
        >
          <div
            className="bg-white rounded d-flex"
            style={{ width: "850px", height: "600px", overflow: "hidden" }}
          >
            <div style={{ width: "50%", backgroundColor: "black" }}>
              <img
                src={selectedPost.image}
                alt={selectedPost.caption}
                width="100%"
                height="100%"
                style={{ objectFit: "contain" }}
              />
            </div>

            <div
              className="p-3 d-flex flex-column"
              style={{ width: "50%", height: "100%" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div
                  className="d-flex align-items-center gap-2"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/user/${selectedPost.userId}`)}
                >
                  <img
                    src={selectedPost.profilePic}
                    alt={selectedPost.username}
                    width="35"
                    height="35"
                    className="rounded-circle"
                  />

                  <strong>{selectedPost.username}</strong>
                </div>

                <button className="btn btn-sm btn-dark" onClick={closePost}>
                  X
                </button>
              </div>

              <p>
                <strong>{selectedPost.username}</strong>{" "}
                {selectedPost.caption}
              </p>

              <hr />

              <div style={{ flex: 1, overflowY: "auto" }}>
                {selectedPost.comments?.length > 0 ? (
                  selectedPost.comments.map((comment) => (
                    <div key={comment.id} className="d-flex gap-2 mb-3">
                      <img
                        src={comment.profilePic || currentUser.profilePic}
                        alt={comment.username}
                        width="30"
                        height="30"
                        className="rounded-circle"
                      />

                      <p className="mb-0">
                        <strong>{comment.username}</strong> {comment.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No comments yet</p>
                )}
              </div>

              <hr />

              <div className="d-flex gap-3 mb-2">
                <i
                  className={
                    selectedPost.liked
                      ? "bi bi-heart-fill fs-4 text-danger"
                      : "bi bi-heart fs-4"
                  }
                  style={{ cursor: "pointer" }}
                  onClick={() => handleLike(selectedPost)}
                ></i>

                <i className="bi bi-chat fs-4"></i>
                <i className="bi bi-send fs-4"></i>
              </div>

              <p className="fw-bold mb-2">{selectedPost.likes} likes</p>

              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      submitComment();
                    }
                  }}
                />

                <button className="btn btn-primary" onClick={submitComment}>
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Explore;