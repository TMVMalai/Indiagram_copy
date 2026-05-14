import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

function Stories() {
  const MAX_STORY_DURATION = 50;
  const MAX_FILE_SIZE_MB = 10;

  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyComment, setStoryComment] = useState("");

  const [newStoryMedia, setNewStoryMedia] = useState("");
  const [newStoryPreview, setNewStoryPreview] = useState("");
  const [newStoryType, setNewStoryType] = useState("");
  const [newStoryDuration, setNewStoryDuration] = useState(0);

  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: 1,
    username: "thirumalaivasan",
    profilePic: "https://i.pravatar.cc/150?img=12",
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = () => {
    fetch("http://localhost:3000/stories")
      .then((res) => res.json())
      .then((data) => {
        setStories(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Stories fetch error:", err);
        toast.error("Unable to load stories");
        setLoading(false);
      });
  };

  const handleStoryMediaUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const fileSizeInMB = file.size / (1024 * 1024);

    if (fileSizeInMB > MAX_FILE_SIZE_MB) {
      toast.error(`File is too large. Upload below ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = "";
      setNewStoryMedia("");
      setNewStoryPreview("");
      setNewStoryType("");
      setNewStoryDuration(0);
      return;
    }

    const fileType = file.type.startsWith("video") ? "video" : "image";
    const reader = new FileReader();

    reader.onloadend = () => {
      if (fileType === "video") {
        const video = document.createElement("video");
        video.preload = "metadata";

        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);

          const actualDuration = Math.floor(video.duration);
          const finalDuration =
            actualDuration > MAX_STORY_DURATION
              ? MAX_STORY_DURATION
              : actualDuration;

          setNewStoryMedia(reader.result);
          setNewStoryPreview(reader.result);
          setNewStoryType(fileType);
          setNewStoryDuration(finalDuration);

          if (actualDuration > MAX_STORY_DURATION) {
            toast.info(
              `Video is ${actualDuration} seconds. Only first 50 seconds will be used.`
            );
          }
        };

        video.src = URL.createObjectURL(file);
      } else {
        setNewStoryMedia(reader.result);
        setNewStoryPreview(reader.result);
        setNewStoryType(fileType);
        setNewStoryDuration(5);
      }
    };

    reader.readAsDataURL(file);
  };

  const createStory = () => {
    if (!newStoryMedia) {
      toast.error("Please select an image or video");
      return;
    }

    const newStory = {
      userId: currentUser.id,
      username: currentUser.username,
      profilePic: currentUser.profilePic,
      storyMedia: newStoryMedia,
      storyImage: newStoryMedia,
      mediaType: newStoryType,
      storyDuration: newStoryType === "video" ? newStoryDuration : 5,
      maxDuration: MAX_STORY_DURATION,
      isViewed: false,
      viewers: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    fetch("http://localhost:3000/stories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newStory),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }

        return res.json();
      })
      .then((createdStory) => {
        setStories([createdStory, ...stories]);
        setNewStoryMedia("");
        setNewStoryPreview("");
        setNewStoryType("");
        setNewStoryDuration(0);
        setShowCreateStory(false);

        toast.success("Story added successfully");
      })
      .catch((err) => {
        console.log("Create story error:", err.message);

        if (err.message.includes("Payload")) {
          toast.error("File is too large for JSON Server. Upload a smaller file.");
        } else {
          toast.error("Story upload failed. Check JSON Server.");
        }
      });
  };

  const openStory = (story) => {
    setShowViewers(false);
    setStoryComment("");

    const viewers = story.viewers || [];
    const comments = story.comments || [];

    const alreadyViewed = viewers.some(
      (viewer) => viewer.userId === currentUser.id
    );

    const updatedViewers = alreadyViewed
      ? viewers
      : [
          ...viewers,
          {
            userId: currentUser.id,
            username: currentUser.username,
            profilePic: currentUser.profilePic,
            viewedAt: new Date().toISOString(),
          },
        ];

    const updatedStory = {
      ...story,
      isViewed: true,
      viewers: updatedViewers,
      comments,
    };

    setSelectedStory(updatedStory);

    if (!alreadyViewed) {
      fetch(`http://localhost:3000/stories/${story.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isViewed: true,
          viewers: updatedViewers,
          comments,
        }),
      })
        .then((res) => res.json())
        .then((serverStory) => {
          setStories((prevStories) =>
            prevStories.map((item) =>
              item.id === story.id ? serverStory : item
            )
          );

          setSelectedStory(serverStory);
        })
        .catch((err) => {
          console.log("Story view update error:", err);
          toast.error("Unable to update story view");
        });
    }
  };

  const closeStory = () => {
    setSelectedStory(null);
    setStoryComment("");
    setShowViewers(false);
  };

  const submitStoryComment = () => {
    if (storyComment.trim() === "") {
      toast.error("Please enter a message");
      return;
    }

    const newComment = {
      id: Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      profilePic: currentUser.profilePic,
      text: storyComment,
      commentedAt: new Date().toISOString(),
    };

    const updatedComments = [...(selectedStory.comments || []), newComment];

    fetch(`http://localhost:3000/stories/${selectedStory.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comments: updatedComments,
      }),
    })
      .then((res) => res.json())
      .then((serverStory) => {
        setStories((prevStories) =>
          prevStories.map((story) =>
            story.id === selectedStory.id ? serverStory : story
          )
        );

        setSelectedStory(serverStory);
        setStoryComment("");

        saveCommentToConversation(newComment, selectedStory);

        toast.success("Reply sent");
      })
      .catch((err) => {
        console.log("Story comment error:", err);
        toast.error("Unable to send reply");
      });
  };

  const saveCommentToConversation = (comment, story) => {
    const conversationId = [currentUser.id, story.userId].sort().join("_");

    const newMessage = {
      id: Date.now(),
      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      fromProfilePic: currentUser.profilePic,

      toUserId: story.userId,
      toUsername: story.username,
      toProfilePic: story.profilePic,

      messageType: "story_reply",
      storyId: story.id,
      storyMedia: story.storyMedia || story.storyImage,
      mediaType: story.mediaType || "image",
      text: comment.text,
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

          fetch(`http://localhost:3000/conversations/${conversation.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: updatedMessages,
              lastMessage: comment.text,
              updatedAt: new Date().toISOString(),
            }),
          }).catch((err) =>
            console.log("Conversation update error:", err)
          );
        } else {
          const newConversation = {
            conversationId,
            participants: [
              {
                userId: currentUser.id,
                username: currentUser.username,
                profilePic: currentUser.profilePic,
              },
              {
                userId: story.userId,
                username: story.username,
                profilePic: story.profilePic,
              },
            ],
            messages: [newMessage],
            lastMessage: comment.text,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          fetch("http://localhost:3000/conversations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newConversation),
          }).catch((err) =>
            console.log("Conversation create error:", err)
          );
        }
      })
      .catch((err) => console.log("Conversation check error:", err));
  };

  const deleteStory = () => {
  if (!selectedStory) return;

  if (selectedStory.userId !== currentUser.id) {
    toast.error("You can delete only your own story");
    return;
  }

  fetch(`http://localhost:3000/stories/${selectedStory.id}`, {
    method: "DELETE",
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to delete story");
      }

      setStories((prevStories) =>
        prevStories.filter((story) => story.id !== selectedStory.id)
      );

      setSelectedStory(null);
      setShowViewers(false);
      setStoryComment("");

      toast.success("Story deleted successfully");
    })
    .catch((err) => {
      console.log("Delete story error:", err);
      toast.error("Unable to delete story");
    });
};

  const handleSwipeUp = () => {
    if (selectedStory && selectedStory.userId === currentUser.id) {
      setShowViewers(true);
    }
  };

  const handleSwipeDown = () => {
    setShowViewers(false);
  };

  if (loading) {
    return <div className="text-center">Loading Stories...</div>;
  }

  return (
    <div className="mb-4">
      <div
        className="d-flex gap-3 overflow-auto"
        style={{ width: "500px", padding: "10px" }}
      >
        <div
          className="text-center"
          style={{ cursor: "pointer" }}
          onClick={() => setShowCreateStory(true)}
        >
          <div
            className="rounded-circle d-flex justify-content-center align-items-center"
            style={{
              width: "65px",
              height: "65px",
              border: "3px solid #ddd",
              fontSize: "30px",
            }}
          >
            +
          </div>

          <p className="mt-1 mb-0" style={{ fontSize: "12px" }}>
            Your story
          </p>
        </div>

        {stories.map((story) => (
          <div
            key={story.id}
            className="text-center"
            style={{ cursor: "pointer" }}
            onClick={() => openStory(story)}
          >
            <img
              src={story.profilePic}
              alt={story.username}
              width="65"
              height="65"
              className="rounded-circle"
              style={{
                objectFit: "cover",
                padding: "3px",
                border: story.isViewed
                  ? "3px solid gray"
                  : "3px solid #e1306c",
              }}
            />

            <p
              className="mt-1 mb-0"
              style={{
                fontSize: "12px",
                width: "70px",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {story.username}
            </p>
          </div>
        ))}
      </div>

      {showCreateStory && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999 }}
        >
          <div className="bg-white p-3 rounded" style={{ width: "400px" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Add Story</h5>
              <button
                className="btn btn-sm btn-dark"
                onClick={() => setShowCreateStory(false)}
              >
                X
              </button>
            </div>

            <input
              type="file"
              accept="image/*,video/*"
              className="form-control mb-3"
              onChange={handleStoryMediaUpload}
            />

            <p className="text-muted" style={{ fontSize: "13px" }}>
              Maximum file size: {MAX_FILE_SIZE_MB} MB. Video story plays only
              first {MAX_STORY_DURATION} seconds.
            </p>

            {newStoryPreview && newStoryType === "image" && (
              <img
                src={newStoryPreview}
                alt="Story Preview"
                width="100%"
                height="400"
                style={{ objectFit: "cover", borderRadius: "10px" }}
              />
            )}

            {newStoryPreview && newStoryType === "video" && (
              <>
                <video
                  src={newStoryPreview}
                  width="100%"
                  height="400"
                  controls
                  style={{ objectFit: "cover", borderRadius: "10px" }}
                />

                <p className="text-muted mt-2" style={{ fontSize: "13px" }}>
                  Only first {MAX_STORY_DURATION} seconds will be used.
                </p>
              </>
            )}

            <button className="btn btn-primary w-100 mt-3" onClick={createStory}>
              Add Story
            </button>
          </div>
        </div>
      )}

      {selectedStory && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9999 }}
        >
          <div
            className="position-relative bg-dark rounded"
            style={{ width: "380px", height: "650px", overflow: "hidden" }}
          >
            <div
  className="position-absolute top-0 end-0 m-2 d-flex gap-2"
  style={{ zIndex: 10000 }}
>
  {selectedStory.userId === currentUser.id && (
    <button className="btn btn-danger btn-sm" onClick={deleteStory}>
      Delete
    </button>
  )}

  <button className="btn btn-light btn-sm" onClick={closeStory}>
    X
  </button>
</div>
            <div
              className="position-absolute top-0 start-0 d-flex align-items-center gap-2 m-3 text-white"
              style={{ zIndex: 10000 }}
            >
              <img
                src={selectedStory.profilePic}
                alt={selectedStory.username}
                width="35"
                height="35"
                className="rounded-circle"
              />
              <strong>{selectedStory.username}</strong>
            </div>

            <div
              onWheel={(e) => {
                if (e.deltaY > 0) {
                  handleSwipeUp();
                } else {
                  handleSwipeDown();
                }
              }}
              onTouchStart={(e) => {
                e.currentTarget.startY = e.touches[0].clientY;
              }}
              onTouchEnd={(e) => {
                const startY = e.currentTarget.startY;
                const endY = e.changedTouches[0].clientY;

                if (startY - endY > 50) {
                  handleSwipeUp();
                }

                if (endY - startY > 50) {
                  handleSwipeDown();
                }
              }}
              style={{ height: "100%" }}
            >
              {(selectedStory.mediaType || "image") === "video" ? (
                <video
                  src={selectedStory.storyMedia || selectedStory.storyImage}
                  width="100%"
                  height="100%"
                  controls
                  autoPlay
                  onTimeUpdate={(e) => {
                    const allowedDuration =
                      selectedStory.storyDuration || MAX_STORY_DURATION;

                    if (e.target.currentTime >= allowedDuration) {
                      e.target.pause();
                      e.target.currentTime = allowedDuration;
                    }
                  }}
                  style={{
                    objectFit: "cover",
                    borderRadius: "10px",
                  }}
                />
              ) : (
                <img
                  src={selectedStory.storyMedia || selectedStory.storyImage}
                  alt={selectedStory.username}
                  width="100%"
                  height="100%"
                  style={{
                    objectFit: "cover",
                    borderRadius: "10px",
                  }}
                />
              )}
            </div>

            {!showViewers && (
              <div
                className="position-absolute bottom-0 start-0 w-100 p-3"
                style={{
                  background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                  zIndex: 10000,
                }}
              >
                {selectedStory.userId === currentUser.id && (
                  <div
                    className="text-white text-center mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={handleSwipeUp}
                  >
                    <i className="bi bi-chevron-up"></i>
                    <div style={{ fontSize: "13px" }}>
                      {selectedStory.viewers?.length || 0} views
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control rounded-pill"
                    placeholder={`Reply to ${selectedStory.username}...`}
                    value={storyComment}
                    onChange={(e) => setStoryComment(e.target.value)}
                  />

                  <button
                    className="btn btn-light rounded-pill"
                    onClick={submitStoryComment}
                  >
                    Send
                  </button>
                </div>

                <p
                  className="text-white text-center mt-2 mb-0"
                  style={{ fontSize: "12px" }}
                >
                  Your reply will be sent to {selectedStory.username}'s DM
                </p>
              </div>
            )}

            {showViewers && selectedStory.userId === currentUser.id && (
              <div
                className="position-absolute bottom-0 start-0 w-100 bg-white p-3"
                style={{
                  height: "320px",
                  borderTopLeftRadius: "20px",
                  borderTopRightRadius: "20px",
                  zIndex: 10001,
                  overflowY: "auto",
                }}
              >
                <div
                  className="text-center mb-2"
                  style={{ cursor: "pointer" }}
                  onClick={handleSwipeDown}
                >
                  <i className="bi bi-chevron-down"></i>
                </div>

                <h6 className="mb-3">
                  {selectedStory.viewers?.length || 0} people viewed your story
                </h6>

                {selectedStory.viewers?.length > 0 ? (
                  selectedStory.viewers.map((viewer) => (
                    <div
                      key={viewer.userId}
                      className="d-flex align-items-center gap-2 mb-3"
                    >
                      <img
                        src={viewer.profilePic}
                        alt={viewer.username}
                        width="35"
                        height="35"
                        className="rounded-circle"
                      />
                      <span>{viewer.username}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No views yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Stories;