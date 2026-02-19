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
 * Uses inline styles to avoid prose/typography class interference.
 * When `src` is provided, renders an actual video player instead.
 */
function VideoPlaceholder({ caption, src }: VideoPlaceholderProps) {
  if (src) {
    return (
      <div
        style={{
          margin: "1.5rem 0",
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
        <p
          style={{
            textAlign: "center",
            fontSize: "0.8125rem",
            color: "#6b6560",
            marginTop: "0.5rem",
            fontStyle: "italic",
          }}
        >
          {caption}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: "1.5rem 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          width: "100%",
          maxWidth: "280px",
          aspectRatio: "9 / 19.5",
          border: "2px dashed rgba(45, 42, 38, 0.2)",
          borderRadius: "1.5rem",
          backgroundColor: "rgba(45, 42, 38, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "rgba(45, 42, 38, 0.08)",
            color: "#6b6560",
          }}
        >
          <Play size={32} />
        </div>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "#6b6560",
            margin: 0,
          }}
        >
          Screen recording
        </p>
      </div>
      <p
        style={{
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "#6b6560",
          marginTop: "0.5rem",
          fontStyle: "italic",
        }}
      >
        {caption}
      </p>
    </div>
  );
}

export default VideoPlaceholder;
