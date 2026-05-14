import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loggedInUser, setLoggedInUser] = useState(
    JSON.parse(localStorage.getItem("loggedInUser"))
  );

  const [profileUser, setProfileUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [userReels, setUserReels] = useState([]);

  const [activeTab, setActiveTab] = useState("posts");
  const [showListModal, setShowListModal] = useState(false);
  const [listType, setListType] = useState("");

  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = () => {
    const storedUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!storedUser) return;

    fetch(`/users/${storedUser.id}`)
      .then((res) => res.json())
      .then((freshLoggedUser) => {
        setLoggedInUser(freshLoggedUser);
        localStorage.setItem("loggedInUser", JSON.stringify(freshLoggedUser));
      })
      .catch((err) => console.log("Logged user fetch error:", err));

    fetch(`/users/${userId}`)
      .then((res) => res.json())
      .then((data) => setProfileUser(data))
      .catch((err) => console.log("Profile user fetch error:", err));

    fetch("/users")
      .then((res) => res.json())
      .then((data) => setAllUsers(data))
      .catch((err) => console.log("All users fetch error:", err));

    fetch(`/posts?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const formattedPosts = data.map((post) => ({
          ...post,
          comments: post.comments || [],
          likes: post.likes || 0,
          liked: post.liked || false,
        }));

        setUserPosts(formattedPosts);
      })
      .catch((err) => console.log("User posts fetch error:", err));

    fetch(`/reels?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setUserReels(data))
      .catch((err) => console.log("User reels fetch error:", err));
  };

  const isOwnProfile = () => {
    return Number(loggedInUser?.id) === Number(profileUser?.id);
  };

  const isFollowingProfileUser = () => {
    return (loggedInUser?.followingIds || []).includes(Number(profileUser?.id));
  };

  const getFollowers = () => {
    const ids = profileUser?.followersIds || [];
    return allUsers.filter((user) => ids.includes(user.id));
  };

  const getFollowing = () => {
    const ids = profileUser?.followingIds || [];
    return allUsers.filter((user) => ids.includes(user.id));
  };

  const isFollowingUser = (targetUserId) => {
    return (loggedInUser?.followingIds || []).includes(Number(targetUserId));
  };

  const followUser = (targetUser) => {
    if (Number(targetUser.id) === Number(loggedInUser.id)) return;

    const updatedLoggedFollowingIds = [
      ...new Set([...(loggedInUser.followingIds || []), targetUser.id]),
    ];

    const updatedTargetFollowerIds = [
      ...new Set([...(targetUser.followersIds || []), loggedInUser.id]),
    ];

    const updatedLoggedUser = {
      ...loggedInUser,
      followingIds: updatedLoggedFollowingIds,
      following: updatedLoggedFollowingIds.length,
    };

    const updatedTargetUser = {
      ...targetUser,
      followersIds: updatedTargetFollowerIds,
      followers: updatedTargetFollowerIds.length,
    };

    Promise.all([
      fetch(`/users/${loggedInUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followingIds: updatedLoggedFollowingIds,
          following: updatedLoggedFollowingIds.length,
        }),
      }),
      fetch(`/users/${targetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followersIds: updatedTargetFollowerIds,
          followers: updatedTargetFollowerIds.length,
        }),
      }),
    ])
      .then(() => {
        setLoggedInUser(updatedLoggedUser);
        localStorage.setItem("loggedInUser", JSON.stringify(updatedLoggedUser));

        if (Number(profileUser.id) === Number(targetUser.id)) {
          setProfileUser(updatedTargetUser);
        }

        setAllUsers((prevUsers) =>
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

  const unfollowUser = (targetUser) => {
    const updatedLoggedFollowingIds = (loggedInUser.followingIds || []).filter(
      (id) => Number(id) !== Number(targetUser.id)
    );

    const updatedTargetFollowerIds = (targetUser.followersIds || []).filter(
      (id) => Number(id) !== Number(loggedInUser.id)
    );

    const updatedLoggedUser = {
      ...loggedInUser,
      followingIds: updatedLoggedFollowingIds,
      following: updatedLoggedFollowingIds.length,
    };

    const updatedTargetUser = {
      ...targetUser,
      followersIds: updatedTargetFollowerIds,
      followers: updatedTargetFollowerIds.length,
    };

    Promise.all([
      fetch(`/users/${loggedInUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followingIds: updatedLoggedFollowingIds,
          following: updatedLoggedFollowingIds.length,
        }),
      }),
      fetch(`/users/${targetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followersIds: updatedTargetFollowerIds,
          followers: updatedTargetFollowerIds.length,
        }),
      }),
    ])
      .then(() => {
        setLoggedInUser(updatedLoggedUser);
        localStorage.setItem("loggedInUser", JSON.stringify(updatedLoggedUser));

        if (Number(profileUser.id) === Number(targetUser.id)) {
          setProfileUser(updatedTargetUser);
        }

        setAllUsers((prevUsers) =>
          prevUsers.map((user) =>
            Number(user.id) === Number(targetUser.id) ? updatedTargetUser : user
          )
        );

        toast.success(`You unfollowed ${targetUser.username}`);
      })
      .catch((err) => {
        console.log("Unfollow error:", err);
        toast.error("Unable to unfollow user");
      });
  };

  const openListModal = (type) => {
    setListType(type);
    setShowListModal(true);
  };

  const closeListModal = () => {
    setShowListModal(false);
    setListType("");
  };

  const openUserProfile = (id) => {
    closeListModal();
    navigate(`/user/${id}`);
  };

  const startDirectMessage = () => {
    const conversationId = [loggedInUser.id, profileUser.id].sort().join("_");

    fetch(`/conversations?conversationId=${conversationId}`)
      .then((res) => res.json())
      .then((existingConversation) => {
        if (existingConversation.length > 0) {
          navigate("/messages");
          return;
        }

        const newConversation = {
          conversationId,
          participants: [
            {
              userId: loggedInUser.id,
              username: loggedInUser.username,
              profilePic: loggedInUser.profilePic,
            },
            {
              userId: profileUser.id,
              username: profileUser.username,
              profilePic: profileUser.profilePic,
            },
          ],
          messages: [],
          lastMessage: "No messages yet",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        fetch("/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newConversation),
        })
          .then(() => navigate("/messages"))
          .catch((err) => console.log("Conversation create error:", err));
      });
  };

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

    fetch(`/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        liked: updatedPost.liked,
        likes: updatedPost.likes,
      }),
    })
      .then((res) => res.json())
      .then((serverPost) => {
        setUserPosts((prevPosts) =>
          prevPosts.map((p) => (p.id === post.id ? serverPost : p))
        );

        if (selectedPost?.id === post.id) {
          setSelectedPost(serverPost);
        }
      })
      .catch((err) => {
        console.log("Like error:", err);
        toast.error("Unable to like post");
      });
  };

  const submitComment = () => {
    if (commentText.trim() === "") {
      toast.error("Please enter a comment");
      return;
    }

    const newComment = {
      id: Date.now(),
      userId: loggedInUser.id,
      username: loggedInUser.username,
      profilePic: loggedInUser.profilePic,
      text: commentText,
      commentedAt: new Date().toISOString(),
    };

    const updatedComments = [...(selectedPost.comments || []), newComment];

    fetch(`/posts/${selectedPost.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comments: updatedComments,
      }),
    })
      .then((res) => res.json())
      .then((serverPost) => {
        setUserPosts((prevPosts) =>
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

  if (!loggedInUser || !profileUser) {
    return <div>Loading profile...</div>;
  }

  const listUsers = listType === "followers" ? getFollowers() : getFollowing();

  return (
    <div>
      <button
        className="btn btn-outline-dark mb-3"
        onClick={() => navigate("/search")}
      >
        Back to Search
      </button>

      <div className="d-flex align-items-center gap-4 mb-4">
        <img
          src={profileUser.profilePic}
          alt={profileUser.username}
          width="110"
          height="110"
          className="rounded-circle"
        />

        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <h3 className="mb-0">{profileUser.username}</h3>

            {!isOwnProfile() && (
              <>
                {isFollowingProfileUser() ? (
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => unfollowUser(profileUser)}
                  >
                    Unfollow
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => followUser(profileUser)}
                  >
                    Follow
                  </button>
                )}

                <button
                  className="btn btn-outline-primary"
                  onClick={startDirectMessage}
                >
                  Message
                </button>
              </>
            )}
          </div>

          <p className="mb-1">{profileUser.fullName}</p>
          <p className="mb-2">{profileUser.bio}</p>

          <div className="d-flex gap-4">
            <strong>{userPosts.length + userReels.length} posts</strong>

            <strong
              style={{ cursor: "pointer" }}
              onClick={() => openListModal("followers")}
            >
              {(profileUser.followersIds || []).length} followers
            </strong>

            <strong
              style={{ cursor: "pointer" }}
              onClick={() => openListModal("following")}
            >
              {(profileUser.followingIds || []).length} following
            </strong>
          </div>
        </div>
      </div>

      <hr />

      <div className="d-flex justify-content-center gap-4 mb-4">
        <button
          className={
            activeTab === "posts" ? "btn btn-dark" : "btn btn-outline-dark"
          }
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </button>

        <button
          className={
            activeTab === "reels" ? "btn btn-dark" : "btn btn-outline-dark"
          }
          onClick={() => setActiveTab("reels")}
        >
          Reels
        </button>
      </div>

      {activeTab === "posts" && (
        <div>
          {userPosts.length > 0 ? (
            <div className="d-flex flex-wrap gap-3">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  style={{ width: "220px", cursor: "pointer" }}
                  onClick={() => openPost(post)}
                >
                  <img
                    src={post.image}
                    alt={post.caption}
                    width="220"
                    height="220"
                    style={{ objectFit: "cover", borderRadius: "8px" }}
                  />

                  <p className="mt-2 mb-1">
                    <strong>{post.likes}</strong> likes
                  </p>

                  <p className="text-muted mb-0">
                    {post.comments?.length || 0} comments
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No posts yet</p>
          )}
        </div>
      )}

      {activeTab === "reels" && (
        <div>
          {userReels.length > 0 ? (
            <div className="d-flex flex-wrap gap-3">
              {userReels.map((reel) => (
                <div key={reel.id} style={{ width: "220px" }}>
                  <video
                    src={reel.videoUrl}
                    width="220"
                    height="300"
                    controls
                    muted
                    style={{ objectFit: "cover", borderRadius: "8px" }}
                  />

                  <p className="mt-2 mb-1">
                    <strong>{reel.likes}</strong> likes
                  </p>

                  <p className="text-muted mb-0">
                    {reel.comments?.length || 0} comments
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No reels yet</p>
          )}
        </div>
      )}

      {showListModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999 }}
        >
          <div
            className="bg-white rounded p-3"
            style={{ width: "420px", maxHeight: "550px", overflowY: "auto" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                {listType === "followers" ? "Followers" : "Following"}
              </h5>

              <button className="btn btn-sm btn-dark" onClick={closeListModal}>
                X
              </button>
            </div>

            {listUsers.length > 0 ? (
              listUsers.map((user) => (
                <div
                  key={user.id}
                  className="d-flex justify-content-between align-items-center border-bottom py-2"
                >
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => openUserProfile(user.id)}
                  >
                    <img
                      src={user.profilePic}
                      alt={user.username}
                      width="45"
                      height="45"
                      className="rounded-circle"
                    />

                    <div>
                      <strong>{user.username}</strong>
                      <p className="mb-0 text-muted">{user.fullName}</p>
                    </div>
                  </div>

                  {Number(user.id) !== Number(loggedInUser.id) &&
                    (isFollowingUser(user.id) ? (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => unfollowUser(user)}
                      >
                        Unfollow
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => followUser(user)}
                      >
                        Follow
                      </button>
                    ))}
                </div>
              ))
            ) : (
              <p className="text-muted">No users found</p>
            )}
          </div>
        </div>
      )}

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
                <div className="d-flex align-items-center gap-2">
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
                        src={comment.profilePic || loggedInUser.profilePic}
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
                    if (e.key === "Enter") submitComment();
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

export default UserProfile;