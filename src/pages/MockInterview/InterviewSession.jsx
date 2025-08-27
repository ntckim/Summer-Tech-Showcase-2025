import { useEffect, useRef, useState, useCallback } from "react";
import TypewriterText from "./TypewriterText";
import SpeechRecognition from "./SpeechRecognition";
import CameraFeed from "./CameraFeed";
import { generateFeedback } from "./feedbackService";

export default function InterviewSession({
  questions,
  improvementAreas,
  onEndInterview,
  onReset,
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestionIndexRef = useRef(0);

  const [conversation, setConversation] = useState([]);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isQuestionDisplayed, setIsQuestionDisplayed] = useState(false);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const conversationEndRef = useRef(null);

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  const getCurrentQuestion = () => questions[currentQuestionIndexRef.current];

  const displayQuestion = useCallback(() => {
    const question = getCurrentQuestion();
    if (!question) return;

    const questionMessage = {
      type: "interviewer",
      content: `Question ${currentQuestionIndexRef.current + 1}: ${question.question}`,
      timestamp: new Date().toLocaleTimeString(),
      company: question.company,
    };
    setConversation((prev) => [...prev, questionMessage]);
    setIsQuestionDisplayed(true);
    setIsWaitingForAnswer(true);
  }, [questions]);

  const startInterview = useCallback(() => {
    if (!questions?.length) return;
    setIsInterviewStarted(true);
    const greeting = {
      type: "interviewer",
      content: `Hello! Welcome to your mock interview. We'll go through ${questions.length} questions, focusing on ${improvementAreas.join(", ")}. Let's begin.`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setConversation([greeting]);
    setTimeout(() => displayQuestion(), 600);
  }, [questions, improvementAreas, displayQuestion]);

  const generateFeedbackFromLLM = async (answer, question, areas) => {
    try {
      return await generateFeedback(answer, question.question, question.company, areas);
    } catch {
      return "Thanks for the answer. Make the structure clearer, include one specific example, and state your result directly. Keep practicing.";
    }
  };

  const handleUserAnswer = useCallback(
    async (answerText) => {
      if (!answerText.trim()) return;
      const question = getCurrentQuestion();
      setConversation((prev) => [
        ...prev,
        { type: "user", content: answerText, timestamp: new Date().toLocaleTimeString() },
      ]);
      setIsWaitingForAnswer(false);
      setIsProcessingAnswer(true);
      try {
        const feedbackResponse = await generateFeedbackFromLLM(answerText, question, improvementAreas);
        setConversation((prev) => [
          ...prev,
          { type: "interviewer", content: feedbackResponse, timestamp: new Date().toLocaleTimeString(), isFeedback: true },
        ]);
      } finally {
        setIsProcessingAnswer(false);
      }
    },
    [improvementAreas, questions]
  );

  const nextQuestion = useCallback(() => {
    if (isProcessingAnswer) return;
    if (currentQuestionIndexRef.current < questions.length - 1) {
      const newIndex = currentQuestionIndexRef.current + 1;
      setCurrentQuestionIndex(newIndex);
      currentQuestionIndexRef.current = newIndex;
      setIsQuestionDisplayed(false);
      setIsWaitingForAnswer(false);
      setConversation((prev) => [
        ...prev,
        { type: "interviewer", content: "Great. Next question.", timestamp: new Date().toLocaleTimeString() },
      ]);
      setTimeout(() => displayQuestion(), 300);
    } else {
      setConversation((prev) => [
        ...prev,
        { type: "interviewer", content: "That’s all the questions. Nice work! Review the transcript and refine your answers.", timestamp: new Date().toLocaleTimeString() },
      ]);
    }
  }, [isProcessingAnswer, questions, displayQuestion]);

  const endInterview = useCallback(() => onEndInterview?.(), [onEndInterview]);

  const currentQuestion = getCurrentQuestion();

  return (
    <div
      // FULL-VIEWPORT between fixed global header/footer (ignores .main-content constraints)
      style={{
        position: "fixed",
        top: "var(--header-h)",
        bottom: "var(--footer-h)",
        left: 0,
        right: 0,
        width: "100vw",
        height: `calc(100vh - var(--header-h) - var(--footer-h))`,
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // prevent double scrollbars
        boxSizing: "border-box",
      }}
    >
      {/* Internal Header */}
      <div
        style={{
          padding: "14px 22px",
          borderBottom: "1px solid var(--border)",
          background: "var(--muted-bg)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flex: "0 0 auto",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
            Mock Interview Session
          </h1>
          <p style={{ margin: "20px 0 0", color: "var(--muted-text)", fontSize: 12 }}>
            {isInterviewStarted
              ? `Question ${Math.min(currentQuestionIndex + 1, questions.length)} of ${questions.length}`
              : "Ready"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowCamera((s) => !s)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: showCamera ? "#2563eb" : "var(--bg)",
              color: showCamera ? "#fff" : "var(--text)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {showCamera ? "Hide Camera" : "Show Camera"}
          </button>
          <button
            onClick={onReset}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "#b91c1c",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Stream (chat) */}
      <div style={{ flex: "1 1 auto", display: "flex", position: "relative", minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            background: "var(--bg)",
          }}
        >
          {!isInterviewStarted ? (
            <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
              <button
                onClick={startInterview}
                style={{
                  padding: "14px 22px",
                  fontSize: 18,
                  fontWeight: 700,
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Start Interview
              </button>
            </div>
          ) : (
            <>
              {conversation.map((m, i) => (
                <div key={i} style={{ marginBottom: 18, lineHeight: 1.6 }}>
                  <div style={{ fontSize: 11, color: "var(--muted-text)" }}>
                    {m.timestamp}
                    {m.company ? ` · ${m.company}` : ""}
                  </div>
                  <div style={{ fontSize: 16 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: m.type === "interviewer" ? "var(--brand-color)" : "#22c55e",
                      }}
                    >
                      {m.type === "interviewer" ? "Interviewer: " : "You: "}
                    </span>
                    <TypewriterText
                      text={m.content}
                      speed={m.type === "interviewer" ? 16 : 18}
                      showCursor={i === conversation.length - 1}
                    />
                  </div>
                </div>
              ))}
              <div ref={conversationEndRef} />
            </>
          )}
        </div>

        {/* PiP Camera */}
        {showCamera && (
          <div
            style={{
              position: "absolute",
              right: 16,
              bottom: 96,
              width: 280,
              boxShadow: "0 10px 20px rgba(0,0,0,.15)",
              borderRadius: 12,
              overflow: "hidden",
              background: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            <CameraFeed />
          </div>
        )}
      </div>

      {/* Sticky controls */}
      <div
  style={{
    flex: "0 0 auto",
    background: "var(--muted-bg)",
    borderTop: "1px solid var(--border)",
    padding: "12px 16px",
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: "16px", // ⬅️ lift the whole bar up a bit
  }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          {isQuestionDisplayed && currentQuestion ? (
            <>
              <div style={{ fontSize: 12, color: "var(--muted-text)", marginBottom: 6 }}>
                Current question
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
                <TypewriterText text={currentQuestion.question} speed={14} />
              </div>
              {currentQuestion.company && (
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--text)" }}>
                  {currentQuestion.company}
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                fontSize: 14,
                color: "var(--muted-text)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
              aria-busy={isProcessingAnswer}
            >
              {isProcessingAnswer ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: "2px solid var(--border)",
                      borderTopColor: "#2563eb",
                      display: "inline-block",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Generating feedback…
                </>
              ) : isInterviewStarted ? (
                "Ready"
              ) : (
                "Click Start Interview"
              )}
            </div>
          )}
        </div>

        <div style={{ flex: 1.2, maxWidth: 720 }}>
          <SpeechRecognition
            onAnswer={handleUserAnswer}
            isListening={isWaitingForAnswer}
            disabled={isProcessingAnswer}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <button
            onClick={() => {
              const newIndex = Math.max(0, currentQuestionIndexRef.current - 1);
              setCurrentQuestionIndex(newIndex);
              currentQuestionIndexRef.current = newIndex;
            }}
            disabled={currentQuestionIndex === 0 || isProcessingAnswer}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontWeight: 600,
              cursor:
                currentQuestionIndex === 0 || isProcessingAnswer
                  ? "not-allowed"
                  : "pointer",
              opacity: isProcessingAnswer ? 0.6 : 1,
            }}
            title={isProcessingAnswer ? "Wait for feedback to finish" : "Previous question"}
          >
            ← Previous
          </button>

          <button
            onClick={nextQuestion}
            disabled={isProcessingAnswer}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: isProcessingAnswer ? "#93c5fd" : "#2563eb",
              color: "#fff",
              fontWeight: 700,
              cursor: isProcessingAnswer ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            title={isProcessingAnswer ? "Generating feedback…" : ""}
          >
            {isProcessingAnswer && (
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,.6)",
                  borderTopColor: "#fff",
                  display: "inline-block",
                  animation: "spin 1s linear infinite",
                }}
              />
            )}
            {currentQuestionIndex < questions.length - 1 ? "Next →" : "Complete"}
          </button>

          <button
            onClick={endInterview}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "#b91c1c",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            End
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

