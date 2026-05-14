import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: 1,
    username: "thirumalaivasan",
    profilePic: "https://i.pravatar.cc/150?img=12",
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = () => {
    fetch(`http://localhost:3000/notifications?toUserId=${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        const sortedNotifications = data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setNotifications(sortedNotifications);
      })
      .catch((err) => {
        console.log("Notifications fetch error:", err);
        toast.error("Unable to load notifications");
      });
  };

  const markAsRead = (notification) => {
    fetch(`http://localhost:3000/notifications/${notification.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isRead: true,
      }),
    })
      .then((res) => res.json())
      .then((updatedNotification) => {
        setNotifications((prevNotifications) =>
          prevNotifications.map((item) =>
            item.id === notification.id ? updatedNotification : item
          )
        );

        toast.success("Notification marked as read");
      })
      .catch((err) => {
        console.log("Mark read error:", err);
        toast.error("Unable to mark notification as read");
      });
  };

  const markAllAsRead = () => {
    const unreadNotifications = notifications.filter(
      (notification) => notification.isRead === false
    );

    if (unreadNotifications.length === 0) {
      toast.info("No unread notifications");
      return;
    }

    Promise.all(
      unreadNotifications.map((notification) =>
        fetch(`http://localhost:3000/notifications/${notification.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isRead: true,
          }),
        })
      )
    )
      .then(() => {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({
            ...notification,
            isRead: true,
          }))
        );

        toast.success("All notifications marked as read");
      })
      .catch((err) => {
        console.log("Mark all read error:", err);
        toast.error("Unable to mark all as read");
      });
  };

  const deleteNotification = (notificationId) => {
    fetch(`http://localhost:3000/notifications/${notificationId}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Delete failed");
        }

        setNotifications((prevNotifications) =>
          prevNotifications.filter(
            (notification) => notification.id !== notificationId
          )
        );

        toast.success("Notification deleted");
      })
      .catch((err) => {
        console.log("Delete notification error:", err);
        toast.error("Unable to delete notification");
      });
  };

  const getNotificationTitle = (notification) => {
    if (notification.type === "message") {
      return `${notification.fromUsername} sent you a message`;
    }

    if (notification.type === "post_share") {
      return `${notification.fromUsername} shared a post with you`;
    }

    if (notification.type === "reel_share") {
      return `${notification.fromUsername} shared a reel with you`;
    }

    if (notification.type === "story_reply") {
      return `${notification.fromUsername} replied to your story`;
    }

    return `${notification.fromUsername} sent you a notification`;
  };

  const unreadCount = notifications.filter(
    (notification) => notification.isRead === false
  ).length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Notifications</h2>

        {unreadCount > 0 && (
          <button className="btn btn-sm btn-primary" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div style={{ width: "650px" }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="border rounded p-3 mb-3"
              style={{
                backgroundColor: notification.isRead ? "#fafafa" : "#eef5ff",
              }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="d-flex gap-3">
                  <img
                    src={notification.fromProfilePic}
                    alt={notification.fromUsername}
                    width="45"
                    height="45"
                    className="rounded-circle"
                  />

                  <div>
                    <p className="mb-1">
                      <strong>{getNotificationTitle(notification)}</strong>
                    </p>

                    {notification.messageText && (
                      <p className="mb-2 text-muted">
                        "{notification.messageText}"
                      </p>
                    )}

                    {notification.postImage && (
                      <div className="mb-2">
                        <img
                          src={notification.postImage}
                          alt="Shared post"
                          width="100"
                          height="100"
                          style={{
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />

                        {notification.postCaption && (
                          <p className="mb-0 mt-1" style={{ fontSize: "13px" }}>
                            {notification.postCaption}
                          </p>
                        )}
                      </div>
                    )}

                    {notification.reelVideo && (
                      <div className="mb-2">
                        <video
                          src={notification.reelVideo}
                          width="100"
                          height="150"
                          controls
                          muted
                          style={{
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />

                        {notification.reelCaption && (
                          <p className="mb-0 mt-1" style={{ fontSize: "13px" }}>
                            {notification.reelCaption}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                      {notification.createdAt
                        ? new Date(notification.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  {!notification.isRead && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => markAsRead(notification)}
                    >
                      Mark read
                    </button>
                  )}

                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted">No notifications yet</p>
      )}
    </div>
  );
}

export default Notifications;