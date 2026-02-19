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
        <div className="flex flex-col items-center">
          <video
            src={src}
            controls
            playsInline
            preload="metadata"
            className="w-full max-w-[280px] rounded-xl bg-black"
          />
          <p className="video-caption">{caption}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-placeholder">
      <div className="flex flex-col items-center">
        <div className="video-placeholder-box max-w-[280px] aspect-[9/19.5]">
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
