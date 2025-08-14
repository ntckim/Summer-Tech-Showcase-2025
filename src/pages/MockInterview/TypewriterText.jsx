import { useState, useEffect, useRef } from "react";

export default function TypewriterText({
  text,
  speed = 30,
  onComplete,
  className = "",
  style = {},
  showCursor = true,
  cursorBlink = true,
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!text || currentIndex >= text.length) {
      if (!isComplete) {
        setIsComplete(true);
        onComplete?.();
      }
      return;
    }
    timeoutRef.current = setTimeout(() => {
      setDisplayedText((prev) => prev + text[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }, speed);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, currentIndex, speed, isComplete, onComplete]);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return (
    <span className={className} style={style}>
      {displayedText}
      {showCursor && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1.2em",
            backgroundColor: "#2563eb",
            marginLeft: 2,
            animation: cursorBlink ? "blink 1s infinite" : "none",
            verticalAlign: "text-bottom",
          }}
        />
      )}
      <style>{`@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}`}</style>
    </span>
  );
}
