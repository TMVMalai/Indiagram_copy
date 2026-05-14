import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Profile() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("loggedInUser"))
  );

  const [allUsers, setAllUsers] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [myReels, setMyReels] = useState([]);
  const [myReposts, setMyReposts] = useState([]);

  const [activeTab, setActiveTab] = useState("posts");
  const [showListModal, setShowListModal] = useState(false);
  const [listType, setListType] = useState("");

  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (currentUser) {
      fetchProfileData();
    }
  }, []);

  const fetchProfileData = () => {
    fetch(`http://localhost:3000/users/${currentUser.id}`)
      .then((res) => res.json())
      .then((freshUser) => {
        setCurrentUser(freshUser);
        localStorage.setItem("loggedInUser", JSON.stringify(freshUser));
      })
      .catch((err) => console.log("Current user fetch error:", err));

    fetch("http://localhost:3000/users")
      .then((res) => res.json())
      .then((data) => setAllUsers(data))
      .catch((err) => console.log("All users fetch error:", err));

    fetch(`http://localhost:3000/posts?userId=${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        const formattedPosts = data.map((post) => ({
          ...post,
          comments: post.comments || [],
          likes: post.likes || 0,
          liked: post.liked || false,
        }));

        setMyPosts(formattedPosts);
      })
      .catch((err) => console.log("Posts fetch error:", err));

    fetch(`http://localhost:3000/reels?userId=${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => setMyReels(data))
      .catch((err) => console.log("Reels fetch error:", err));

    fetch(`http://localhost:3000/reposts?userId=${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => setMyReposts(data))
      .catch((err) => console.log("Reposts fetch error:", err));
  };

  const getFollowers = () => {
    const ids = currentUser.followersIds || [];
    return allUsers.filter((user) => ids.includes(user.id));
  };

  const getFollowing = () => {
    const ids = currentUser.followingIds || [];
    return allUsers.filter((user) => ids.includes(user.id));
  };

  const isFollowingUser = (targetUserId) => {
    return (currentUser.followingIds || []).includes(Number(targetUserId));
  };

  const followUser = (targetUser) => {
    if (Number(targetUser.id) === Number(currentUser.id)) return;

    const updatedCurrentFollowingIds = [
      ...new Set([...(currentUser.followingIds || []), targetUser.id]),
    ];

    const updatedTargetFollowerIds = [
      ...new Set([...(targetUser.followersIds || []), currentUser.id]),
    ];

    const updatedCurrentUser = {
      ...currentUser,
      followingIds: updatedCurrentFollowingIds,
      following: updatedCurrentFollowingIds.length,
    };

    const updatedTargetUser = {
      ...targetUser,
      followersIds: updatedTargetFollowerIds,
      followers: updatedTargetFollowerIds.length,
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
          followersIds: updatedTargetFollowerIds,
          followers: updatedTargetFollowerIds.length,
        }),
      }),
    ])
      .then(() => {
        setCurrentUser(updatedCurrentUser);
        localStorage.setItem("loggedInUser", JSON.stringify(updatedCurrentUser));

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
    const updatedCurrentFollowingIds = (currentUser.followingIds || []).filter(
      (id) => Number(id) !== Number(targetUser.id)
    );

    const updatedTargetFollowerIds = (targetUser.followersIds || []).filter(
      (id) => Number(id) !== Number(currentUser.id)
    );

    const updatedCurrentUser = {
      ...currentUser,
      followingIds: updatedCurrentFollowingIds,
      following: updatedCurrentFollowingIds.length,
    };

    const updatedTargetUser = {
      ...targetUser,
      followersIds: updatedTargetFollowerIds,
      followers: updatedTargetFollowerIds.length,
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
          followersIds: updatedTargetFollowerIds,
          followers: updatedTargetFollowerIds.length,
        }),
      }),
    ])
      .then(() => {
        setCurrentUser(updatedCurrentUser);
        localStorage.setItem("loggedInUser", JSON.stringify(updatedCurrentUser));

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

  const openUserProfile = (userId) => {
    closeListModal();
    navigate(`/user/${userId}`);
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
        setMyPosts((prevPosts) =>
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
        setMyPosts((prevPosts) =>
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

  if (!currentUser) {
    return <div>Please login first</div>;
  }

  const listUsers = listType === "followers" ? getFollowers() : getFollowing();

  return (
    <div>
      <div className="d-flex align-items-center gap-4 mb-4">
        <img
          src={currentUser.profilePic}
          alt={currentUser.username}
          width="110"
          height="110"
          className="rounded-circle"
        />

        <div>
          <h3>{currentUser.username}</h3>
          <p className="mb-1">{currentUser.fullName}</p>
          <p className="mb-2">{currentUser.bio}</p>

          <div className="d-flex gap-4">
            <strong>{myPosts.length + myReels.length} posts</strong>

            <strong
              style={{ cursor: "pointer" }}
              onClick={() => openListModal("followers")}
            >
              {(currentUser.followersIds || []).length} followers
            </strong>

            <strong
              style={{ cursor: "pointer" }}
              onClick={() => openListModal("following")}
            >
              {(currentUser.followingIds || []).length} following
            </strong>

            <strong>{myReposts.length} reposts</strong>
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

        <button
          className={
            activeTab === "reposts" ? "btn btn-dark" : "btn btn-outline-dark"
          }
          onClick={() => setActiveTab("reposts")}
        >
          Reposts
        </button>
      </div>

      {activeTab === "posts" && (
        <div>
          {myPosts.length > 0 ? (
            <div className="d-flex flex-wrap gap-3">
              {myPosts.map((post) => (
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
            <p className="text-muted text-center">No posts yet</p>
          )}
        </div>
      )}

      {activeTab === "reels" && (
        <div>
          {myReels.length > 0 ? (
            <div className="d-flex flex-wrap gap-3">
              {myReels.map((reel) => (
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
            <p className="text-muted text-center">No reels yet</p>
          )}
        </div>
      )}

      {activeTab === "reposts" && (
        <div>
          {myReposts.length > 0 ? (
            <div className="d-flex flex-wrap gap-3">
              {myReposts.map((repost) => (
                <div key={repost.id} style={{ width: "220px" }}>
                  <img
                    src={repost.image}
                    alt={repost.caption}
                    width="220"
                    height="220"
                    style={{ objectFit: "cover", borderRadius: "8px" }}
                  />

                  <p className="mt-2 mb-1">
                    Reposted from <strong>{repost.originalUsername}</strong>
                  </p>

                  <p>{repost.caption}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center">No reposts yet</p>
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

                  {Number(user.id) !== Number(currentUser.id) &&
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

export default Profile;