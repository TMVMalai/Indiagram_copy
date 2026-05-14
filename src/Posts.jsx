import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

function Posts() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  const [sharePost, setSharePost] = useState(null);
  const [selectedShareUserId, setSelectedShareUserId] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: 1,
    username: "thirumalaivasan",
    profilePic: "https://i.pravatar.cc/150?img=12",
  };

  useEffect(() => {
    fetchPosts();
    fetchUsers();
  }, []);

  const formatPostTime = (dateValue) => {
    if (!dateValue) return "";

    return new Date(dateValue).toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEditedStyle = (editSettings = {}) => {
    return {
      filter: `
        brightness(${editSettings.brightness || 100}%)
        contrast(${editSettings.contrast || 100}%)
        grayscale(${editSettings.grayscale || 0}%)
        sepia(${editSettings.sepia || 0}%)
        blur(${editSettings.blur || 0}px)
      `,
      transform: `rotate(${editSettings.rotate || 0}deg)`,
      objectFit: editSettings.fitStyle || "cover",
      borderRadius: "8px",
    };
  };

  const fetchPosts = () => {
    setLoading(true);
    setError("");

    fetch("http://localhost:3000/posts")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unable to fetch posts");
        }

        return res.json();
      })
      .then((data) => {
        const formattedPosts = data.map((post) => {
          const likedBy = post.likedBy || [];

          return {
            ...post,
            media: post.media || post.image,
            mediaType: post.mediaType || "image",

            likedBy,
            liked: likedBy.includes(Number(currentUser.id)),
            likes: likedBy.length,

            reposted: post.reposted || false,
            comments: post.comments || [],
            editSettings: post.editSettings || {},
            createdAt: post.createdAt || new Date().toISOString(),
          };
        });

        const latestPostsFirst = formattedPosts.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setPosts(latestPostsFirst);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Posts fetch error:", err);
        setError("Posts not loading. Please check server.");
        setLoading(false);
      });
  };

  const fetchUsers = () => {
    fetch("http://localhost:3000/users")
      .then((res) => res.json())
      .then((data) => {
        const otherUsers = data.filter(
          (user) => Number(user.id) !== Number(currentUser.id)
        );

        setUsers(otherUsers);
      })
      .catch((err) => console.log("Users fetch error:", err));
  };

  const updatePostInServer = (postId, updatedData) => {
    return fetch(`http://localhost:3000/posts/${postId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });
  };

  const renderPostMedia = (post, width = "300", height = "") => {
    const source = post.media || post.image;
    const editSettings = post.editSettings || {};

    if ((post.mediaType || "image") === "video") {
      return (
        <video
          src={source}
          width={width}
          height={height}
          controls
          style={{
            ...getEditedStyle(editSettings),
            maxHeight: "500px",
          }}
          onLoadedMetadata={(e) => {
            if (editSettings.trimStart > 0) {
              e.target.currentTime = editSettings.trimStart;
            }
          }}
          onTimeUpdate={(e) => {
            const trimStart = editSettings.trimStart || 0;
            const trimEnd = editSettings.trimEnd || 0;

            if (trimEnd > 0 && e.target.currentTime >= trimEnd) {
              e.target.pause();
              e.target.currentTime = trimStart;
            }
          }}
        />
      );
    }

    return (
      <img
        src={source}
        alt={post.caption}
        width={width}
        height={height}
        style={getEditedStyle(editSettings)}
      />
    );
  };

  const handleLike = (post) => {
    const currentUserId = Number(currentUser.id);
    const likedBy = post.likedBy || [];

    const alreadyLiked = likedBy.includes(currentUserId);

    const updatedLikedBy = alreadyLiked
      ? likedBy.filter((id) => Number(id) !== currentUserId)
      : [...likedBy, currentUserId];

    const updatedPost = {
      ...post,
      likedBy: updatedLikedBy,
      liked: updatedLikedBy.includes(currentUserId),
      likes: updatedLikedBy.length,
    };

    setPosts((prevPosts) =>
      prevPosts.map((item) => (item.id === post.id ? updatedPost : item))
    );

    if (selectedPost?.id === post.id) {
      setSelectedPost(updatedPost);
    }

    updatePostInServer(post.id, {
      likedBy: updatedLikedBy,
      likes: updatedLikedBy.length,
    }).catch((err) => {
      console.log("Like update error:", err);
      toast.error("Unable to update like");
    });
  };

  const handleRepost = (post) => {
    fetch(
      `http://localhost:3000/reposts?userId=${currentUser.id}&originalPostId=${post.id}`
    )
      .then((res) => res.json())
      .then((existingReposts) => {
        if (existingReposts.length > 0) {
          toast.info("You already reposted this post");
          return;
        }

        const repostData = {
          userId: currentUser.id,
          username: currentUser.username,
          originalPostId: post.id,
          originalUsername: post.username,
          originalProfilePic: post.profilePic,

          image: post.media || post.image,
          media: post.media || post.image,
          mediaType: post.mediaType || "image",

          caption: post.caption,
          editSettings: post.editSettings || {},
          repostedAt: new Date().toISOString(),
        };

        fetch("http://localhost:3000/reposts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(repostData),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error("Failed to save repost");
            }

            return res.json();
          })
          .then(() => {
            const updatedPost = {
              ...post,
              reposted: true,
            };

            setPosts((prevPosts) =>
              prevPosts.map((item) =>
                item.id === post.id ? updatedPost : item
              )
            );

            updatePostInServer(post.id, {
              reposted: true,
            });

            toast.success("Post reposted successfully");
          })
          .catch((err) => {
            console.log("Repost save error:", err);
            toast.error("Unable to repost");
          });
      })
      .catch((err) => {
        console.log("Repost check error:", err);
        toast.error("Unable to check repost status");
      });
  };

  const openComments = (post) => {
    setSelectedPost(post);
    setCommentText("");
  };

  const closeComments = () => {
    setSelectedPost(null);
    setCommentText("");
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

    const updatedPost = {
      ...selectedPost,
      comments: updatedComments,
    };

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === selectedPost.id ? updatedPost : post
      )
    );

    setSelectedPost(updatedPost);
    setCommentText("");

    updatePostInServer(selectedPost.id, {
      comments: updatedComments,
    })
      .then(() => {
        toast.success("Comment added");
      })
      .catch((err) => {
        console.log("Comment error:", err);
        toast.error("Unable to add comment");
      });
  };

  const deleteComment = (commentId) => {
    const updatedComments = selectedPost.comments.filter(
      (comment) => Number(comment.id) !== Number(commentId)
    );

    const updatedPost = {
      ...selectedPost,
      comments: updatedComments,
    };

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === selectedPost.id ? updatedPost : post
      )
    );

    setSelectedPost(updatedPost);

    updatePostInServer(selectedPost.id, {
      comments: updatedComments,
    })
      .then(() => {
        toast.success("Comment deleted");
      })
      .catch((err) => {
        console.log("Delete comment error:", err);
        toast.error("Unable to delete comment");
      });
  };

  const openShare = (post) => {
    setSharePost(post);
    setSelectedShareUserId("");
    setShareMessage("");
  };

  const closeShare = () => {
    setSharePost(null);
    setSelectedShareUserId("");
    setShareMessage("");
  };

  const copyShareLink = () => {
    const shareLink = `http://localhost:5173/post/${sharePost.id}`;

    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        toast.success("Post link copied");
      })
      .catch(() => {
        toast.error("Unable to copy link");
      });
  };

  const createPostShareNotification = (receiver, post, messageText) => {
    const notification = {
      type: "post_share",

      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      fromProfilePic: currentUser.profilePic,

      toUserId: receiver.id,
      toUsername: receiver.username,
      toProfilePic: receiver.profilePic,

      postId: post.id,
      postImage: post.media || post.image,
      postMedia: post.media || post.image,
      postMediaType: post.mediaType || "image",
      postCaption: post.caption,
      editSettings: post.editSettings || {},

      messageText: messageText || "Shared a post with you",
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    fetch("http://localhost:3000/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    }).catch((err) => console.log("Post notification error:", err));
  };

  const sendPostToFriend = () => {
    if (!selectedShareUserId) {
      toast.error("Please select a friend");
      return;
    }

    const receiver = users.find(
      (user) => Number(user.id) === Number(selectedShareUserId)
    );

    if (!receiver) {
      toast.error("Selected user not found");
      return;
    }

    const conversationId = [currentUser.id, receiver.id].sort().join("_");

    const newMessage = {
      id: Date.now(),

      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      fromProfilePic: currentUser.profilePic,

      toUserId: receiver.id,
      toUsername: receiver.username,
      toProfilePic: receiver.profilePic,

      messageType: "post_share",

      postId: sharePost.id,
      postImage: sharePost.media || sharePost.image,
      postMedia: sharePost.media || sharePost.image,
      postMediaType: sharePost.mediaType || "image",
      postCaption: sharePost.caption,
      postUsername: sharePost.username,
      postProfilePic: sharePost.profilePic,
      editSettings: sharePost.editSettings || {},

      text: shareMessage.trim() || "Shared a post",
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    fetch(`http://localhost:3000/conversations?conversationId=${conversationId}`)
      .then((res) => res.json())
      .then((existingConversation) => {
        if (existingConversation.length > 0) {
          const conversation = existingConversation[0];

          const updatedMessages = [
            ...(conversation.messages || []),
            newMessage,
          ];

          return fetch(
            `http://localhost:3000/conversations/${conversation.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messages: updatedMessages,
                lastMessage: "Shared a post",
                updatedAt: new Date().toISOString(),
              }),
            }
          );
        }

        const newConversation = {
          conversationId,
          participants: [
            {
              userId: currentUser.id,
              username: currentUser.username,
              profilePic: currentUser.profilePic,
            },
            {
              userId: receiver.id,
              username: receiver.username,
              profilePic: receiver.profilePic,
            },
          ],
          messages: [newMessage],
          lastMessage: "Shared a post",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return fetch("http://localhost:3000/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newConversation),
        });
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unable to send post");
        }

        createPostShareNotification(receiver, sharePost, shareMessage);

        toast.success(`Post sent to ${receiver.username}`);
        closeShare();
      })
      .catch((err) => {
        console.log("Send post error:", err);
        toast.error("Unable to send post");
      });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div>Loading Posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center">
        <div className="text-danger">{error}</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="d-flex justify-content-center">
        <div>No posts available</div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center">
      <div>
        {posts.map((post) => (
          <div key={post.id} className="mb-5">
            <div className="d-flex align-items-center gap-2 mb-2">
              <img
                src={post.profilePic}
                alt={post.username}
                width="40"
                height="40"
                className="rounded-circle"
              />

              <h5 className="mb-0">{post.username}</h5>
            </div>

            {renderPostMedia(post, "300")}

            <div
              className="d-flex justify-content-between mt-2 mb-2"
              style={{ width: "300px" }}
            >
              <div className="d-flex gap-3">
                <i
                  className={
                    post.liked
                      ? "bi bi-heart-fill fs-4 text-danger"
                      : "bi bi-heart fs-4"
                  }
                  style={{ cursor: "pointer" }}
                  onClick={() => handleLike(post)}
                ></i>

                <i
                  className="bi bi-chat fs-4"
                  style={{ cursor: "pointer" }}
                  onClick={() => openComments(post)}
                ></i>

                <i
                  className={
                    post.reposted
                      ? "bi bi-repeat fs-4 text-success"
                      : "bi bi-repeat fs-4"
                  }
                  style={{ cursor: "pointer" }}
                  onClick={() => handleRepost(post)}
                ></i>

                <i
                  className="bi bi-send fs-4"
                  style={{ cursor: "pointer" }}
                  onClick={() => openShare(post)}
                ></i>
              </div>

              <div>
                <i className="bi bi-bookmark fs-4"></i>
              </div>
            </div>

            <p className="mb-1 fw-bold">{post.likes} likes</p>

            <p className="mb-1">
              <strong>{post.username}</strong> {post.caption}
            </p>

            <p
              className="text-muted mb-1"
              style={{ cursor: "pointer" }}
              onClick={() => openComments(post)}
            >
              View all comments ({post.comments.length})
            </p>

            <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
              Uploaded on {formatPostTime(post.createdAt)}
            </p>
          </div>
        ))}
      </div>

      {selectedPost && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
        >
          <div
            className="bg-white p-3 rounded"
            style={{ width: "420px", maxHeight: "550px", overflowY: "auto" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Comments</h5>

              <button className="btn btn-sm btn-dark" onClick={closeComments}>
                X
              </button>
            </div>

            <div className="d-flex align-items-center gap-2 mb-3">
              <img
                src={selectedPost.profilePic}
                alt={selectedPost.username}
                width="35"
                height="35"
                className="rounded-circle"
              />

              <strong>{selectedPost.username}</strong>
            </div>

            <p>
              <strong>{selectedPost.username}</strong> {selectedPost.caption}
            </p>

            <p className="text-muted" style={{ fontSize: "12px" }}>
              Uploaded on {formatPostTime(selectedPost.createdAt)}
            </p>

            <hr />

            {selectedPost.comments.length > 0 ? (
              selectedPost.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="d-flex justify-content-between align-items-center mb-2"
                >
                  <div className="d-flex align-items-center gap-2">
                    <img
                      src={comment.profilePic || currentUser.profilePic}
                      alt={comment.username}
                      width="25"
                      height="25"
                      className="rounded-circle"
                    />

                    <p className="mb-0">
                      <strong>{comment.username}</strong> {comment.text}
                    </p>
                  </div>

                  {Number(comment.userId) === Number(currentUser.id) && (
                    <i
                      className="bi bi-trash"
                      style={{ cursor: "pointer" }}
                      onClick={() => deleteComment(comment.id)}
                    ></i>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted">No comments yet</p>
            )}

            <div className="d-flex gap-2 mt-3">
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
      )}

      {sharePost && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
        >
          <div className="bg-white p-3 rounded" style={{ width: "380px" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Share Post</h5>

              <button className="btn btn-sm btn-dark" onClick={closeShare}>
                X
              </button>
            </div>

            <div className="d-flex align-items-center gap-2 mb-3">
              <img
                src={sharePost.profilePic}
                alt={sharePost.username}
                width="35"
                height="35"
                className="rounded-circle"
              />

              <strong>{sharePost.username}</strong>
            </div>

            {(sharePost.mediaType || "image") === "video" ? (
              <video
                src={sharePost.media || sharePost.image}
                width="100%"
                height="280"
                controls
                style={getEditedStyle(sharePost.editSettings)}
                onLoadedMetadata={(e) => {
                  if (sharePost.editSettings?.trimStart > 0) {
                    e.target.currentTime = sharePost.editSettings.trimStart;
                  }
                }}
                onTimeUpdate={(e) => {
                  const trimStart = sharePost.editSettings?.trimStart || 0;
                  const trimEnd = sharePost.editSettings?.trimEnd || 0;

                  if (trimEnd > 0 && e.target.currentTime >= trimEnd) {
                    e.target.pause();
                    e.target.currentTime = trimStart;
                  }
                }}
              />
            ) : (
              <img
                src={sharePost.media || sharePost.image}
                alt={sharePost.caption}
                width="100%"
                style={getEditedStyle(sharePost.editSettings)}
              />
            )}

            <p className="mt-2 mb-1">{sharePost.caption}</p>

            <p className="text-muted" style={{ fontSize: "12px" }}>
              Uploaded on {formatPostTime(sharePost.createdAt)}
            </p>

            <button
              className="btn btn-outline-primary w-100 mb-3"
              onClick={copyShareLink}
            >
              Copy Link
            </button>

            <select
              className="form-select mb-3"
              value={selectedShareUserId}
              onChange={(e) => setSelectedShareUserId(e.target.value)}
            >
              <option value="">Select friend</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="form-control mb-3"
              placeholder="Write a message..."
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
            />

            <button className="btn btn-primary w-100" onClick={sendPostToFriend}>
              Send Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Posts;