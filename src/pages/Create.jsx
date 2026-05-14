import React, { useState } from "react";
import { toast } from "react-toastify";

function Create() {
  const [uploadType, setUploadType] = useState("post"); // post or reel
  const [caption, setCaption] = useState("");

  const [media, setMedia] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [preview, setPreview] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [blur, setBlur] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [fitStyle, setFitStyle] = useState("cover");

  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: 1,
    username: "thirumalaivasan",
    profilePic: "https://i.pravatar.cc/150?img=12",
  };

  const MAX_FILE_SIZE_MB = 20;

  const getFilterStyle = () => {
    return {
      filter: `
        brightness(${brightness}%)
        contrast(${contrast}%)
        grayscale(${grayscale}%)
        sepia(${sepia}%)
        blur(${blur}px)
      `,
      transform: `rotate(${rotate}deg)`,
      objectFit: fitStyle,
      borderRadius: "10px",
    };
  };

  const resetEditor = () => {
    setCaption("");
    setMedia("");
    setMediaType("");
    setPreview("");
    setVideoDuration(0);

    setBrightness(100);
    setContrast(100);
    setGrayscale(0);
    setSepia(0);
    setBlur(0);
    setRotate(0);
    setFitStyle("cover");

    setTrimStart(0);
    setTrimEnd(0);
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const fileSizeInMB = file.size / (1024 * 1024);

    if (fileSizeInMB > MAX_FILE_SIZE_MB) {
      toast.error(`File is too large. Upload below ${MAX_FILE_SIZE_MB} MB`);
      e.target.value = "";
      resetEditor();
      return;
    }

    const type = file.type.startsWith("video") ? "video" : "image";

    if (uploadType === "reel" && type !== "video") {
      toast.error("Reels should be video only");
      e.target.value = "";
      resetEditor();
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setMedia(reader.result);
      setPreview(reader.result);
      setMediaType(type);

      if (type === "video") {
        const video = document.createElement("video");
        video.preload = "metadata";

        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);

          const duration = Math.floor(video.duration);
          setVideoDuration(duration);
          setTrimStart(0);
          setTrimEnd(duration);
        };

        video.src = URL.createObjectURL(file);
      } else {
        setVideoDuration(0);
        setTrimStart(0);
        setTrimEnd(0);
      }
    };

    reader.readAsDataURL(file);
  };

  const validateBeforeUpload = () => {
    if (!media) {
      toast.error("Please upload an image or video");
      return false;
    }

    if (!caption.trim()) {
      toast.error("Please enter a caption");
      return false;
    }

    if (uploadType === "reel" && mediaType !== "video") {
      toast.error("Reels should be video only");
      return false;
    }

    if (mediaType === "video") {
      if (Number(trimStart) < 0 || Number(trimEnd) <= 0) {
        toast.error("Invalid trim value");
        return false;
      }

      if (Number(trimStart) >= Number(trimEnd)) {
        toast.error("Trim start should be less than trim end");
        return false;
      }

      if (Number(trimEnd) > Number(videoDuration)) {
        toast.error("Trim end cannot be greater than video duration");
        return false;
      }
    }

    return true;
  };

  const createPost = () => {
    if (!validateBeforeUpload()) return;

    const editSettings = {
      brightness,
      contrast,
      grayscale,
      sepia,
      blur,
      rotate,
      fitStyle,
      trimStart: mediaType === "video" ? Number(trimStart) : 0,
      trimEnd: mediaType === "video" ? Number(trimEnd) : 0,
      originalDuration: videoDuration,
    };

    const newPost = {
      userId: currentUser.id,
      username: currentUser.username,
      profilePic: currentUser.profilePic,

      media,
      image: media,
      mediaType,

      caption,
      likes: 0,
      likedBy: [],
      reposted: false,
      comments: [],

      editSettings,
      createdAt: new Date().toISOString(),
    };

    fetch("http://localhost:3000/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newPost),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }

        return res.json();
      })
      .then(() => {
        toast.success("Post created successfully");
        resetEditor();
      })
      .catch((err) => {
        console.log("Create post error:", err.message);

        if (err.message.includes("Payload")) {
          toast.error("File is too large for server. Upload a smaller file.");
        } else {
          toast.error("Unable to create post");
        }
      });
  };

  const createReel = () => {
    if (!validateBeforeUpload()) return;

    const editSettings = {
      brightness,
      contrast,
      grayscale,
      sepia,
      blur,
      rotate,
      fitStyle,
      trimStart: Number(trimStart),
      trimEnd: Number(trimEnd),
      originalDuration: videoDuration,
    };

    const newReel = {
      userId: currentUser.id,
      username: currentUser.username,
      profilePic: currentUser.profilePic,

      videoUrl: media,
      media,
      mediaType: "video",

      caption,
      hashtags: ["#reels"],
      likes: 0,
      likedBy: [],
      comments: [],
      shares: 0,

      editSettings,
      createdAt: new Date().toISOString(),
    };

    fetch("http://localhost:3000/reels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newReel),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }

        return res.json();
      })
      .then(() => {
        toast.success("Reel created successfully");
        resetEditor();
      })
      .catch((err) => {
        console.log("Create reel error:", err.message);

        if (err.message.includes("Payload")) {
          toast.error("Video is too large for server. Upload a smaller video.");
        } else {
          toast.error("Unable to create reel");
        }
      });
  };

  const handleUpload = () => {
    if (uploadType === "post") {
      createPost();
    } else {
      createReel();
    }
  };

  return (
    <div>
      <h2 className="mb-4">Create</h2>

      <div className="border rounded p-4" style={{ width: "600px" }}>
        <div className="d-flex gap-2 mb-3">
          <button
            className={
              uploadType === "post" ? "btn btn-dark" : "btn btn-outline-dark"
            }
            onClick={() => {
              setUploadType("post");
              resetEditor();
            }}
          >
            Create Post
          </button>

          <button
            className={
              uploadType === "reel" ? "btn btn-dark" : "btn btn-outline-dark"
            }
            onClick={() => {
              setUploadType("reel");
              resetEditor();
            }}
          >
            Create Reel
          </button>
        </div>

        <input
          type="file"
          accept={uploadType === "reel" ? "video/*" : "image/*,video/*"}
          className="form-control mb-3"
          onChange={handleMediaUpload}
        />

        {preview && mediaType === "image" && (
          <div
            className="d-flex justify-content-center align-items-center bg-light mb-3"
            style={{
              width: "100%",
              height: "380px",
              overflow: "hidden",
              borderRadius: "10px",
            }}
          >
            <img
              src={preview}
              alt="Preview"
              width="100%"
              height="100%"
              style={getFilterStyle()}
            />
          </div>
        )}

        {preview && mediaType === "video" && (
          <div
            className="d-flex justify-content-center align-items-center bg-dark mb-3"
            style={{
              width: "100%",
              height: "420px",
              overflow: "hidden",
              borderRadius: "10px",
            }}
          >
            <video
              src={preview}
              width="100%"
              height="100%"
              controls
              style={getFilterStyle()}
              onLoadedMetadata={(e) => {
                if (trimStart > 0) {
                  e.target.currentTime = trimStart;
                }
              }}
              onTimeUpdate={(e) => {
                if (trimEnd > 0 && e.target.currentTime >= trimEnd) {
                  e.target.pause();
                  e.target.currentTime = trimStart;
                }
              }}
            />
          </div>
        )}

        {preview && (
          <div className="border rounded p-3 mb-3">
            <h5>Edit Media</h5>

            <label className="form-label">Brightness: {brightness}%</label>
            <input
              type="range"
              className="form-range"
              min="50"
              max="150"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
            />

            <label className="form-label">Contrast: {contrast}%</label>
            <input
              type="range"
              className="form-range"
              min="50"
              max="150"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
            />

            <label className="form-label">Grayscale: {grayscale}%</label>
            <input
              type="range"
              className="form-range"
              min="0"
              max="100"
              value={grayscale}
              onChange={(e) => setGrayscale(Number(e.target.value))}
            />

            <label className="form-label">Sepia: {sepia}%</label>
            <input
              type="range"
              className="form-range"
              min="0"
              max="100"
              value={sepia}
              onChange={(e) => setSepia(Number(e.target.value))}
            />

            <label className="form-label">Blur: {blur}px</label>
            <input
              type="range"
              className="form-range"
              min="0"
              max="5"
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
            />

            <label className="form-label">Rotate: {rotate}°</label>
            <input
              type="range"
              className="form-range"
              min="-180"
              max="180"
              value={rotate}
              onChange={(e) => setRotate(Number(e.target.value))}
            />

            <label className="form-label">Fit Style</label>
            <select
              className="form-select mb-3"
              value={fitStyle}
              onChange={(e) => setFitStyle(e.target.value)}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </select>

            {mediaType === "video" && (
              <div className="border rounded p-3 mt-3">
                <h6>Trim Video</h6>

                <p className="text-muted mb-2">
                  Video duration: {videoDuration} seconds
                </p>

                <label className="form-label">Trim Start</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  min="0"
                  max={videoDuration}
                  value={trimStart}
                  onChange={(e) => setTrimStart(Number(e.target.value))}
                />

                <label className="form-label">Trim End</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max={videoDuration}
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(Number(e.target.value))}
                />
              </div>
            )}

            <button className="btn btn-outline-secondary w-100 mt-3" onClick={resetEditor}>
              Reset
            </button>
          </div>
        )}

        <textarea
          className="form-control mb-3"
          placeholder={
            uploadType === "post"
              ? "Write a post caption..."
              : "Write a reel caption..."
          }
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows="4"
        ></textarea>

        <button className="btn btn-primary w-100" onClick={handleUpload}>
          {uploadType === "post" ? "Upload Post" : "Upload Reel"}
        </button>
      </div>
    </div>
  );
}

export default Create;