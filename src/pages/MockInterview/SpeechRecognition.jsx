import { useState, useEffect, useRef, useCallback } from "react";

export default function SpeechRecognition({ onAnswer, isListening, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const shouldRestartRef = useRef(false);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setIsSupported(true);
      recognitionRef.current = new SR();
      setupRecognition();
    } else {
      setIsSupported(false);
      setError(
        "Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari."
      );
    }
  }, []);

  const setupRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    const r = recognitionRef.current;

    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";

    r.onstart = () => {
      setIsRecording(true);
      setError("");
    };

    r.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current +=
            (finalTranscriptRef.current ? " " : "") + chunk.trim();
        } else {
          interim += chunk;
        }
      }
      setTranscript((finalTranscriptRef.current + " " + interim).trim());
    };

    r.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      if (
        e.error !== "no-speech" &&
        e.error !== "aborted" &&
        e.error !== "network"
      ) {
        setError(`Speech recognition error: ${e.error}`);
      }
      setIsRecording(false);
    };

    r.onend = () => {
      setIsRecording(false);
      if (shouldRestartRef.current && !disabled) {
        try {
          r.start();
        } catch {}
      }
    };
  }, [disabled]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current || disabled) return;
    try {
      setTranscript("");
      finalTranscriptRef.current = "";
      shouldRestartRef.current = true;
      recognitionRef.current.start();
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setError("Failed to start speech recognition. Please try again.");
    }
  }, [disabled]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      shouldRestartRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  }, []);

  const submitAnswer = useCallback(() => {
    const finalText = (finalTranscriptRef.current || transcript).trim();
    if (finalText) {
      onAnswer(finalText);
      setTranscript("");
      finalTranscriptRef.current = "";
    }
  }, [transcript, onAnswer]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    finalTranscriptRef.current = "";
  }, []);

  useEffect(() => {
    if (isListening && !isRecording && isSupported && !disabled) {
      startRecording();
    }
    if (!isListening && isRecording) {
      stopRecording();
    }
  }, [
    isListening,
    isRecording,
    isSupported,
    disabled,
    startRecording,
    stopRecording,
  ]);

  if (!isSupported) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <textarea
          placeholder="Type your answer here…"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          style={{
            width: "100%",
            minHeight: 100,
            padding: 12,
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={submitAnswer}
            disabled={!transcript.trim()}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: transcript.trim() ? "#2563eb" : "#9ca3af",
              color: "#fff",
              border: "none",
              fontWeight: 600,
            }}
          >
            Submit
          </button>
          <button
            onClick={clearTranscript}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "#6b7280",
              color: "#fff",
              border: "none",
              fontWeight: 600,
            }}
          >
            Clear
          </button>
        </div>
        {error && <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: isRecording ? "#ef4444" : "#9ca3af",
            animation: isRecording ? "pulse 1.5s infinite" : "none",
          }}
        />
        <span
          style={{ fontSize: 12, color: isRecording ? "#b91c1c" : "#6b7280" }}
        >
          {isRecording ? "Listening…" : "Ready"}
        </span>

        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            style={{
              marginLeft: 8,
              padding: "8px 12px",
              background: disabled ? "#9ca3af" : "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Start
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            style={{
              marginLeft: 8,
              padding: "8px 12px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Stop
          </button>
        )}

        <button
          type="button"
          onClick={clearTranscript}
          style={{
            marginLeft: 8,
            padding: "8px 12px",
            background: "#6b7280",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Clear
        </button>

        <button
          type="button"
          onClick={submitAnswer}
          style={{
            marginLeft: 8,
            padding: "8px 12px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
          }}
        >
          Submit
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 12,
          minHeight: 90,
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {transcript ? (
          transcript
        ) : (
          <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
            {isRecording ? "Speak now…" : "Click Start to begin speaking"}
          </span>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  );
}
