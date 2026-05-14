import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Reels() {
  const navigate = useNavigate();

  const [reels, setReels] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedReel, setSelectedReel] = useState(null);
  const [commentText, setCommentText] = useState("");

  const [shareReelData, setShareReelData] = useState(null);
  const [selectedShareUserId, setSelectedShareUserId] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: 1,
    username: "thirumalaivasan",
    profilePic: "https://i.pravatar.cc/150?img=12",
  };

  useEffect(() => {
    fetchReels();
    fetchUsers();
  }, []);

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
    };
  };

  const fetchReels = () => {
    fetch("http://localhost:3000/reels")
      .then((res) => res.json())
      .then((data) => {
        const formattedReels = data.map((reel) => {
          const likedBy = reel.likedBy || [];

          return {
            ...reel,
            videoUrl: reel.videoUrl || reel.media,
            media: reel.media || reel.videoUrl,
            mediaType: reel.mediaType || "video",
            comments: reel.comments || [],
            likedBy,
            liked: likedBy.includes(Number(currentUser.id)),
            likes: likedBy.length || reel.likes || 0,
            shares: reel.shares || 0,
            editSettings: reel.editSettings || {},
            createdAt: reel.createdAt || new Date().toISOString(),
          };
        });

        const latestReelsFirst = formattedReels.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setReels(latestReelsFirst);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Reels fetch error:", err);
        toast.error("Unable to load reels");
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

  const updateReelInServer = (reelId, updatedData) => {
    return fetch(`http://localhost:3000/reels/${reelId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });
  };

  const handleLike = (reel) => {
    const currentUserId = Number(currentUser.id);
    const likedBy = reel.likedBy || [];

    const alreadyLiked = likedBy.includes(currentUserId);

    const updatedLikedBy = alreadyLiked
      ? likedBy.filter((id) => Number(id) !== currentUserId)
      : [...likedBy, currentUserId];

    const updatedReel = {
      ...reel,
      likedBy: updatedLikedBy,
      liked: updatedLikedBy.includes(currentUserId),
      likes: updatedLikedBy.length,
    };

    setReels((prevReels) =>
      prevReels.map((item) => (item.id === reel.id ? updatedReel : item))
    );

    if (selectedReel?.id === reel.id) {
      setSelectedReel(updatedReel);
    }

    updateReelInServer(reel.id, {
      likedBy: updatedLikedBy,
      likes: updatedLikedBy.length,
    }).catch((err) => {
      console.log("Like reel error:", err);
      toast.error("Unable to update like");
    });
  };

  const openComments = (reel) => {
    setSelectedReel(reel);
    setCommentText("");
  };

  const closeComments = () => {
    setSelectedReel(null);
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

    const updatedComments = [...(selectedReel.comments || []), newComment];

    const updatedReel = {
      ...selectedReel,
      comments: updatedComments,
    };

    setReels((prevReels) =>
      prevReels.map((reel) =>
        reel.id === selectedReel.id ? updatedReel : reel
      )
    );

    setSelectedReel(updatedReel);
    setCommentText("");

    updateReelInServer(selectedReel.id, {
      comments: updatedComments,
    })
      .then((res) => res.json())
      .then((serverReel) => {
        setSelectedReel(serverReel);

        setReels((prevReels) =>
          prevReels.map((reel) =>
            reel.id === selectedReel.id ? serverReel : reel
          )
        );

        toast.success("Comment added");
      })
      .catch((err) => {
        console.log("Comment reel error:", err);
        toast.error("Unable to add comment");
      });
  };

  const deleteComment = (commentId) => {
    const updatedComments = selectedReel.comments.filter(
      (comment) => Number(comment.id) !== Number(commentId)
    );

    const updatedReel = {
      ...selectedReel,
      comments: updatedComments,
    };

    setSelectedReel(updatedReel);

    setReels((prevReels) =>
      prevReels.map((reel) =>
        reel.id === selectedReel.id ? updatedReel : reel
      )
    );

    updateReelInServer(selectedReel.id, {
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

  const openShareReel = (reel) => {
    setShareReelData(reel);
    setSelectedShareUserId("");
    setShareMessage("");
  };

  const closeShareReel = () => {
    setShareReelData(null);
    setSelectedShareUserId("");
    setShareMessage("");
  };

  const createReelShareNotification = (receiver, reel, messageText) => {
    const notification = {
      type: "reel_share",

      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      fromProfilePic: currentUser.profilePic,

      toUserId: receiver.id,
      toUsername: receiver.username,
      toProfilePic: receiver.profilePic,

      reelId: reel.id,
      reelVideo: reel.videoUrl || reel.media,
      reelCaption: reel.caption,
      editSettings: reel.editSettings || {},

      messageText: messageText || "Shared a reel with you",

      isRead: false,
      createdAt: new Date().toISOString(),
    };

    fetch("http://localhost:3000/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    }).catch((err) => console.log("Reel notification error:", err));
  };

  const sendReelToFriend = () => {
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

      messageType: "reel_share",

      reelId: shareReelData.id,
      reelVideo: shareReelData.videoUrl || shareReelData.media,
      reelCaption: shareReelData.caption,
      reelUsername: shareReelData.username,
      reelProfilePic: shareReelData.profilePic,
      editSettings: shareReelData.editSettings || {},

      text: shareMessage.trim() || "Shared a reel",
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
                lastMessage: "Shared a reel",
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
          lastMessage: "Shared a reel",
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
          throw new Error("Unable to send reel");
        }

        createReelShareNotification(receiver, shareReelData, shareMessage);

        const updatedShares = (shareReelData.shares || 0) + 1;

        updateReelInServer(shareReelData.id, {
          shares: updatedShares,
        });

        setReels((prevReels) =>
          prevReels.map((reel) =>
            reel.id === shareReelData.id
              ? { ...reel, shares: updatedShares }
              : reel
          )
        );

        toast.success(`Reel sent to ${receiver.username}`);
        closeShareReel();
      })
      .catch((err) => {
        console.log("Send reel error:", err);
        toast.error("Unable to send reel");
      });
  };

  const renderReelVideo = (reel) => {
    const editSettings = reel.editSettings || {};

    return (
      <video
        src={reel.videoUrl || reel.media}
        width="100%"
        height="100%"
        controls
        loop
        muted
        style={getEditedStyle(editSettings)}
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
  };

  if (loading) {
    return <div>Loading Reels...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Reels</h2>

      <div
        className="d-flex flex-column align-items-center gap-4"
        style={{ paddingBottom: "40px" }}
      >
        {reels.map((reel) => (
          <div
            key={reel.id}
            className="position-relative bg-dark rounded"
            style={{
              width: "380px",
              height: "650px",
              overflow: "hidden",
            }}
          >
            {renderReelVideo(reel)}

            <div
              className="position-absolute bottom-0 start-0 w-100 p-3 text-white"
              style={{
                background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
              }}
            >
              <div
                className="d-flex align-items-center gap-2 mb-2"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/user/${reel.userId}`)}
              >
                <img
                  src={reel.profilePic}
                  alt={reel.username}
                  width="35"
                  height="35"
                  className="rounded-circle"
                />

                <strong>{reel.username}</strong>
              </div>

              <p className="mb-1">{reel.caption}</p>

              <p className="mb-0" style={{ fontSize: "13px" }}>
                {reel.hashtags?.join(" ")}
              </p>
            </div>

            <div
              className="position-absolute end-0 bottom-0 d-flex flex-column align-items-center gap-3 text-white p-3"
              style={{ marginBottom: "90px" }}
            >
              <div className="text-center">
                <i
                  className={
                    reel.liked
                      ? "bi bi-heart-fill fs-3 text-danger"
                      : "bi bi-heart fs-3"
                  }
                  style={{ cursor: "pointer" }}
                  onClick={() => handleLike(reel)}
                ></i>

                <div style={{ fontSize: "12px" }}>{reel.likes}</div>
              </div>

              <div className="text-center">
                <i
                  className="bi bi-chat fs-3"
                  style={{ cursor: "pointer" }}
                  onClick={() => openComments(reel)}
                ></i>

                <div style={{ fontSize: "12px" }}>
                  {reel.comments?.length || 0}
                </div>
              </div>

              <div className="text-center">
                <i
                  className="bi bi-send fs-3"
                  style={{ cursor: "pointer" }}
                  onClick={() => openShareReel(reel)}
                ></i>

                <div style={{ fontSize: "12px" }}>{reel.shares || 0}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedReel && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 9999,
          }}
        >
          <div
            className="bg-white rounded p-3"
            style={{ width: "420px", maxHeight: "600px", overflowY: "auto" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Comments</h5>

              <button className="btn btn-sm btn-dark" onClick={closeComments}>
                X
              </button>
            </div>

            <div className="d-flex align-items-center gap-2 mb-3">
              <img
                src={selectedReel.profilePic}
                alt={selectedReel.username}
                width="35"
                height="35"
                className="rounded-circle"
              />

              <strong>{selectedReel.username}</strong>
            </div>

            <p>{selectedReel.caption}</p>

            <hr />

            {selectedReel.comments?.length > 0 ? (
              selectedReel.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="d-flex justify-content-between align-items-center mb-3"
                >
                  <div className="d-flex align-items-center gap-2">
                    <img
                      src={comment.profilePic}
                      alt={comment.username}
                      width="30"
                      height="30"
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

      {shareReelData && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
        >
          <div className="bg-white p-3 rounded" style={{ width: "380px" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Share Reel</h5>

              <button className="btn btn-sm btn-dark" onClick={closeShareReel}>
                X
              </button>
            </div>

            <video
              src={shareReelData.videoUrl || shareReelData.media}
              width="100%"
              height="280"
              controls
              muted
              style={getEditedStyle(shareReelData.editSettings)}
              onLoadedMetadata={(e) => {
                if (shareReelData.editSettings?.trimStart > 0) {
                  e.target.currentTime = shareReelData.editSettings.trimStart;
                }
              }}
              onTimeUpdate={(e) => {
                const trimStart = shareReelData.editSettings?.trimStart || 0;
                const trimEnd = shareReelData.editSettings?.trimEnd || 0;

                if (trimEnd > 0 && e.target.currentTime >= trimEnd) {
                  e.target.pause();
                  e.target.currentTime = trimStart;
                }
              }}
            />

            <p className="mt-2">{shareReelData.caption}</p>

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

            <button className="btn btn-primary w-100" onClick={sendReelToFriend}>
              Send Reel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reels;