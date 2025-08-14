import { useState, useEffect, useRef, useCallback } from "react";

export default function CameraFeed() {
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [stream, setStream] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const enableCamera = useCallback(async () => {
    if (isCameraEnabled) return;
    setIsLoading(true);
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "This browser doesn’t support camera APIs. Try Chrome, Edge, or Safari."
      );
      setIsLoading(false);
      return;
    }

    if (window.isSecureContext === false) {
      setError(
        "Camera requires HTTPS or localhost. Open the app on https:// or http://localhost."
      );
      setIsLoading(false);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      streamRef.current = mediaStream;
      setIsCameraEnabled(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      const map = {
        NotAllowedError:
          "Camera access was denied. Allow camera permissions and try again.",
        NotFoundError: "No camera found on your device.",
        NotReadableError: "Camera is in use by another app.",
        OverconstrainedError:
          "Requested camera constraints can’t be satisfied.",
      };
      setError(map[err.name] || `Failed to access camera: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isCameraEnabled]);

  const disableCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsCameraEnabled(false);
    setError("");
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      const play = async () => {
        try {
          await video.play();
        } catch {
          /* ignore autoplay block */
        }
      };
      play();
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3
          style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1e293b" }}
        >
          Camera
        </h3>
        {!isCameraEnabled ? (
          <button
            onClick={enableCamera}
            disabled={isLoading}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: isLoading ? "#9ca3af" : "#10b981",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            {isLoading ? "Enabling…" : "Enable"}
          </button>
        ) : (
          <button
            onClick={disableCamera}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#ef4444",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Disable
          </button>
        )}
      </div>

      <div
        style={{
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          background: "#000",
          border: "1px solid #e5e7eb",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            aspectRatio: "4 / 3",
            objectFit: "cover",
          }}
        />
        {!isCameraEnabled && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "#9ca3af",
              fontSize: 14,
            }}
          >
            Camera is off
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            borderRadius: 8,
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
