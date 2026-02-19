import { Play } from "lucide-react";

interface VideoPlaceholderProps {
  /** Short caption describing what the video shows */
  caption: string;
  /** Optional video source URL — when provided, renders a real <video> */
  src?: string;
}

/**
 * Placeholder for screen recording videos in tutorials.
 * Portrait phone shape (9:19.5 aspect ratio).
 * When `src` is provided, renders an actual video player instead.
 */
function VideoPlaceholder({ caption, src }: VideoPlaceholderProps) {
  if (src) {
    return (
      <div className="video-placeholder">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <video
            src={src}
            controls
            playsInline
            preload="metadata"
            style={{
              width: "100%",
              maxWidth: "280px",
              borderRadius: "1.5rem",
              backgroundColor: "#000",
            }}
          />
          <p className="video-caption">{caption}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-placeholder">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          className="video-placeholder-box"
          style={{
            maxWidth: "280px",
            aspectRatio: "9 / 19.5",
            borderRadius: "1.5rem",
          }}
        >
          <div className="video-placeholder-icon">
            <Play size={32} />
          </div>
          <p className="video-placeholder-text">Screen recording</p>
        </div>
        <p className="video-caption">{caption}</p>
      </div>
    </div>
  );
}

export default VideoPlaceholder;
