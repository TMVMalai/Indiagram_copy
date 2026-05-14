import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: 1,
    username: "thirumalaivasan",
    profilePic: "https://i.pravatar.cc/150?img=12",
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = () => {
    fetch("/conversations")
      .then((res) => res.json())
      .then((data) => {
        const myConversations = data.filter((conversation) =>
          conversation.participants?.some(
            (participant) =>
              Number(participant.userId) === Number(currentUser.id)
          )
        );

        myConversations.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        setConversations(myConversations);
      })
      .catch((err) => {
        console.log("Conversation fetch error:", err);
        toast.error("Unable to load messages");
      });
  };

  const getOtherUser = (conversation) => {
    const otherUser = conversation.participants?.find(
      (participant) => Number(participant.userId) !== Number(currentUser.id)
    );

    return (
      otherUser || {
        userId: currentUser.id,
        username: currentUser.username,
        profilePic: currentUser.profilePic,
      }
    );
  };

  const openConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const closeConversation = () => {
    setSelectedConversation(null);
    setReplyText("");
    fetchConversations();
  };

  const createNotificationForMessage = (message) => {
    if (Number(message.toUserId) === Number(currentUser.id)) {
      return;
    }

    const notification = {
      type: "message",

      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      fromProfilePic: currentUser.profilePic,

      toUserId: message.toUserId,
      toUsername: message.toUsername,
      toProfilePic: message.toProfilePic,

      messageText: message.text,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    fetch("/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    }).catch((err) => console.log("Notification create error:", err));
  };

  const sendReply = () => {
    if (replyText.trim() === "") {
      toast.error("Please enter a message");
      return;
    }

    const otherUser = getOtherUser(selectedConversation);

    const newMessage = {
      id: Date.now(),

      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      fromProfilePic: currentUser.profilePic,

      toUserId: otherUser.userId,
      toUsername: otherUser.username,
      toProfilePic: otherUser.profilePic,

      messageType: "text",
      text: replyText,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    const updatedMessages = [
      ...(selectedConversation.messages || []),
      newMessage,
    ];

    const updatedConversation = {
      ...selectedConversation,
      messages: updatedMessages,
      lastMessage: replyText,
      updatedAt: new Date().toISOString(),
    };

    fetch(`/conversations/${selectedConversation.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: updatedMessages,
        lastMessage: replyText,
        updatedAt: new Date().toISOString(),
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unable to send message");
        }

        return res.json();
      })
      .then(() => {
        setSelectedConversation(updatedConversation);

        setConversations((prevConversations) =>
          prevConversations.map((conversation) =>
            conversation.id === selectedConversation.id
              ? updatedConversation
              : conversation
          )
        );

        createNotificationForMessage(newMessage);

        setReplyText("");
        toast.success("Message sent");
      })
      .catch((err) => {
        console.log("Reply send error:", err);
        toast.error("Unable to send message");
      });
  };

  const deleteConversation = (conversationId) => {
    fetch(`/conversations/${conversationId}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unable to delete conversation");
        }

        setConversations((prevConversations) =>
          prevConversations.filter(
            (conversation) => conversation.id !== conversationId
          )
        );

        setSelectedConversation(null);
        toast.success("Conversation deleted");
      })
      .catch((err) => {
        console.log("Delete conversation error:", err);
        toast.error("Unable to delete conversation");
      });
  };

  const deleteMessage = (messageId) => {
    const updatedMessages = selectedConversation.messages.filter(
      (message) => message.id !== messageId
    );

    const lastMessage =
      updatedMessages.length > 0
        ? updatedMessages[updatedMessages.length - 1].text
        : "No messages yet";

    const updatedConversation = {
      ...selectedConversation,
      messages: updatedMessages,
      lastMessage,
      updatedAt: new Date().toISOString(),
    };

    fetch(`/conversations/${selectedConversation.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: updatedMessages,
        lastMessage,
        updatedAt: new Date().toISOString(),
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setSelectedConversation(updatedConversation);

        setConversations((prevConversations) =>
          prevConversations.map((conversation) =>
            conversation.id === selectedConversation.id
              ? updatedConversation
              : conversation
          )
        );

        toast.success("Message deleted");
      })
      .catch((err) => {
        console.log("Delete message error:", err);
        toast.error("Unable to delete message");
      });
  };

  const renderPostShareMedia = (message) => {
    if ((message.postMediaType || "image") === "video") {
      return (
        <video
          src={message.postMedia || message.postImage}
          width="150"
          height="220"
          controls
          muted
          style={{
            objectFit: "cover",
            borderRadius: "8px",
          }}
        />
      );
    }

    return (
      <img
        src={message.postMedia || message.postImage}
        alt={message.postCaption}
        width="150"
        height="150"
        style={{
          objectFit: "cover",
          borderRadius: "8px",
        }}
      />
    );
  };

  return (
    <div>
      <h2>Messages</h2>

      {!selectedConversation && (
        <>
          {conversations.length > 0 ? (
            <div style={{ width: "550px" }}>
              {conversations.map((conversation) => {
                const otherUser = getOtherUser(conversation);

                return (
                  <div
                    key={conversation.id}
                    className="border rounded p-3 mb-3"
                    style={{
                      backgroundColor: "#fafafa",
                      cursor: "pointer",
                    }}
                    onClick={() => openConversation(conversation)}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={otherUser.profilePic}
                          alt={otherUser.username}
                          width="45"
                          height="45"
                          className="rounded-circle"
                        />

                        <div>
                          <strong>{otherUser.username}</strong>
                          <p className="mb-0 text-muted">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                        </div>
                      </div>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted">No conversations yet</p>
          )}
        </>
      )}

      {selectedConversation && (
        <div style={{ width: "650px" }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <button
              className="btn btn-sm btn-outline-dark"
              onClick={closeConversation}
            >
              Back
            </button>

            <img
              src={getOtherUser(selectedConversation).profilePic}
              alt={getOtherUser(selectedConversation).username}
              width="40"
              height="40"
              className="rounded-circle"
            />

            <h5 className="mb-0">
              {getOtherUser(selectedConversation).username}
            </h5>
          </div>

          <div
            className="border rounded p-3 mb-3"
            style={{
              height: "500px",
              overflowY: "auto",
              backgroundColor: "#fafafa",
            }}
          >
            {selectedConversation.messages?.length > 0 ? (
              selectedConversation.messages.map((message) => {
                const isMine =
                  Number(message.fromUserId) === Number(currentUser.id);

                return (
                  <div
                    key={message.id}
                    className={`d-flex mb-3 ${
                      isMine ? "justify-content-end" : "justify-content-start"
                    }`}
                  >
                    <div
                      className="p-2 rounded"
                      style={{
                        maxWidth: "75%",
                        backgroundColor: isMine ? "#d1e7ff" : "white",
                        border: "1px solid #ddd",
                      }}
                    >
                      {isMine && (
                        <button
                          className="btn btn-sm btn-link text-danger p-0 mb-1"
                          onClick={() => deleteMessage(message.id)}
                          style={{ fontSize: "12px" }}
                        >
                          Delete
                        </button>
                      )}

                      {message.messageType === "story_reply" && (
                        <div className="mb-2">
                          <p
                            className="mb-2 text-muted"
                            style={{ fontSize: "12px" }}
                          >
                            replied to story
                          </p>

                          {(message.mediaType || "image") === "video" ? (
                            <video
                              src={message.storyMedia}
                              width="120"
                              height="180"
                              controls
                              style={{
                                objectFit: "cover",
                                borderRadius: "10px",
                              }}
                            />
                          ) : (
                            <img
                              src={message.storyMedia}
                              alt="story"
                              width="120"
                              height="180"
                              style={{
                                objectFit: "cover",
                                borderRadius: "10px",
                              }}
                            />
                          )}
                        </div>
                      )}

                      {message.messageType === "post_share" && (
                        <div className="mb-2">
                          <p
                            className="mb-2 text-muted"
                            style={{ fontSize: "12px" }}
                          >
                            shared a post
                          </p>

                          <div className="border rounded p-2 bg-white">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <img
                                src={message.postProfilePic}
                                alt={message.postUsername}
                                width="25"
                                height="25"
                                className="rounded-circle"
                              />

                              <strong>{message.postUsername}</strong>
                            </div>

                            {renderPostShareMedia(message)}

                            <p className="mb-0 mt-2">
                              {message.postCaption}
                            </p>
                          </div>
                        </div>
                      )}

                      {message.messageType === "reel_share" && (
                        <div className="mb-2">
                          <p
                            className="mb-2 text-muted"
                            style={{ fontSize: "12px" }}
                          >
                            shared a reel
                          </p>

                          <div className="border rounded p-2 bg-white">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <img
                                src={message.reelProfilePic}
                                alt={message.reelUsername}
                                width="25"
                                height="25"
                                className="rounded-circle"
                              />

                              <strong>{message.reelUsername}</strong>
                            </div>

                            <video
                              src={message.reelVideo}
                              width="150"
                              height="220"
                              controls
                              muted
                              style={{
                                objectFit: "cover",
                                borderRadius: "8px",
                              }}
                            />

                            <p className="mb-0 mt-2">
                              {message.reelCaption}
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="mb-0">{message.text}</p>

                      <p
                        className="mb-0 text-muted text-end mt-1"
                        style={{ fontSize: "10px" }}
                      >
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted">No messages in this conversation</p>
            )}
          </div>

          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Message..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendReply();
                }
              }}
            />

            <button className="btn btn-primary" onClick={sendReply}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;