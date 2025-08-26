import { useState, useEffect, useRef, useCallback } from "react";
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
  const [conversation, setConversation] = useState([]);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isQuestionDisplayed, setIsQuestionDisplayed] = useState(false);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const conversationEndRef = useRef(null);
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  // Display question — defined BEFORE startInterview to avoid TDZ issues
  const displayQuestion = useCallback(() => {
    if (!currentQuestion) return;
    const questionMessage = {
      type: "interviewer",
      content: `Question ${currentQuestionIndex + 1}: ${
        currentQuestion.question
      }`,
      timestamp: new Date().toLocaleTimeString(),
      company: currentQuestion.company,
    };
    setConversation((prev) => [...prev, questionMessage]);
    setIsQuestionDisplayed(true);
    setIsWaitingForAnswer(true);
  }, [currentQuestion, currentQuestionIndex]);

  const startInterview = useCallback(() => {
    if (!questions?.length) return;
    setIsInterviewStarted(true);
    const greeting = {
      type: "interviewer",
      content: `Hello! Welcome to your mock interview. We'll go through ${
        questions.length
      } questions, focusing on ${improvementAreas.join(", ")}. Let's begin.`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setConversation([greeting]);
    setTimeout(() => {
      if (currentQuestion) displayQuestion();
    }, 600);
  }, [questions, improvementAreas, currentQuestion, displayQuestion]);

  const generateFeedbackFromLLM = async (answer, question, areas) => {
    try {
      return await generateFeedback(
        answer,
        question.question,
        question.company,
        areas
      );
    } catch (error) {
      console.error("Error generating feedback:", error);
      return "Thanks for the answer. Make the structure clearer, include one specific example, and state your result directly. Keep practicing.";
    }
  };

  const handleUserAnswer = useCallback(
    async (answerText) => {
      if (!answerText.trim()) return;

      // Add user's answer to conversation
      const userMessage = {
        type: "user",
        content: answerText,
        timestamp: new Date().toLocaleTimeString(),
      };
      setConversation((prev) => [...prev, userMessage]);

      // Lock UI: waiting for LLM feedback
      setIsWaitingForAnswer(false);
      setIsProcessingAnswer(true);

      try {
        const feedbackResponse = await generateFeedbackFromLLM(
          answerText,
          currentQuestion,
          improvementAreas
        );

        const feedbackMessage = {
          type: "interviewer",
          content: feedbackResponse,
          timestamp: new Date().toLocaleTimeString(),
          isFeedback: true,
        };

        setConversation((prev) => [...prev, feedbackMessage]);
      } catch (e) {
        setConversation((prev) => [
          ...prev,
          {
            type: "interviewer",
            content:
              "I hit an error while analyzing your answer. Let's continue.",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } finally {
        // Unlock UI after feedback arrives
        setIsProcessingAnswer(false);
      }
    },
    [currentQuestion, improvementAreas]
  );

  const nextQuestion = useCallback(() => {
    // Block navigating while feedback is generating
    if (isProcessingAnswer) return;

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setIsQuestionDisplayed(false);
      setIsWaitingForAnswer(false);
      setConversation((prev) => [
        ...prev,
        {
          type: "interviewer",
          content: "Great. Next question.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setTimeout(() => {
        if (questions[currentQuestionIndex + 1]) displayQuestion();
      }, 300);
    } else {
      setConversation((prev) => [
        ...prev,
        {
          type: "interviewer",
          content:
            "That’s all the questions. Nice work!. Review the transcript and refine your answers.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  }, [isProcessingAnswer, currentQuestionIndex, questions, displayQuestion]);

  const endInterview = useCallback(() => {
    onEndInterview?.();
  }, [onEndInterview]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 22px",
          borderBottom: "1px solid #e2e8f0",
          background: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#1e293b",
            }}
          >
            Mock Interview Session
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>
            {isInterviewStarted
              ? `Question ${Math.min(
                  currentQuestionIndex + 1,
                  questions.length
                )} of ${questions.length}`
              : "Ready"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowCamera((s) => !s)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: showCamera ? "#2563eb" : "#fff",
              color: showCamera ? "#fff" : "#111827",
              fontWeight: 600,
            }}
          >
            {showCamera ? "Hide Camera" : "Show Camera"}
          </button>
          <button
            onClick={onReset}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#b91c1c",
              fontWeight: 600,
            }}
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Stream (free-flow lines) */}
      <div style={{ flex: 1, display: "flex", position: "relative" }}>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            background: "#fff",
          }}
        >
          {!isInterviewStarted ? (
            <div
              style={{ display: "grid", placeItems: "center", height: "100%" }}
            >
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
                }}
              >
                Start Interview
              </button>
            </div>
          ) : (
            <>
              {conversation.map((m, i) => (
                <div key={i} style={{ marginBottom: 18, lineHeight: 1.6 }}>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    {m.timestamp}
                    {m.company ? ` · ${m.company}` : ""}
                  </div>
                  <div style={{ fontSize: 16 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: m.type === "interviewer" ? "#1e40af" : "#065f46",
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
              background: "#fff",
              border: "1px solid #e5e7eb",
            }}
          >
            <CameraFeed />
          </div>
        )}
      </div>

      {/* Sticky controls / question + speech + loader */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "rgba(248,250,252,0.9)",
          backdropFilter: "saturate(180%) blur(8px)",
          borderTop: "1px solid #e2e8f0",
          padding: "12px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          {isQuestionDisplayed && currentQuestion ? (
            <>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                Current question
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
                <TypewriterText text={currentQuestion.question} speed={14} />
              </div>
              {currentQuestion.company && (
                <div style={{ marginTop: 6, fontSize: 12, color: "#374151" }}>
                  {currentQuestion.company}
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                fontSize: 14,
                color: "#6b7280",
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
                      border: "2px solid #d1d5db",
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
            onClick={() => setCurrentQuestionIndex((v) => Math.max(0, v - 1))}
            disabled={currentQuestionIndex === 0 || isProcessingAnswer}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#111827",
              fontWeight: 600,
              cursor:
                currentQuestionIndex === 0 || isProcessingAnswer
                  ? "not-allowed"
                  : "pointer",
              opacity: isProcessingAnswer ? 0.6 : 1,
            }}
            title={
              isProcessingAnswer
                ? "Wait for feedback to finish"
                : "Previous question"
            }
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
            {currentQuestionIndex < questions.length - 1
              ? "Next →"
              : "Complete"}
          </button>

          <button
            onClick={endInterview}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#b91c1c",
              fontWeight: 600,
            }}
          >
            End
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
