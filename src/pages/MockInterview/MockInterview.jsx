import { useCallback, useState } from "react";
import Layout from "../../layouts/Layout";
import InterviewForm from "./InterviewForm";
import InterviewSession from "./InterviewSession";
import { generateInterviewQuestions } from "./openRouterService";

export default function MockInterview() {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  const handleFormSubmit = useCallback(async (formData) => {
    try {
      setLoading(true);
      setErr("");
      setQuestions([]);
      setCurrentIdx(0);
      setShowAllQuestions(false);

      // Generate questions using GPT
      const generatedQuestions = await generateInterviewQuestions(formData);

      if (
        !Array.isArray(generatedQuestions) ||
        generatedQuestions.length === 0
      ) {
        throw new Error("No questions generated. Please try again.");
      }

      setQuestions(generatedQuestions);
      setFormData(formData);
      setIsInterviewStarted(true);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Failed to generate interview questions.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setQuestions([]);
    setCurrentIdx(0);
    setErr("");
    setShowAllQuestions(false);
    setFormData(null);
    setIsInterviewStarted(false);
  }, []);

  const handleEndInterview = useCallback(() => {
    setIsInterviewStarted(false);
  }, []);

  const hasPlan = questions.length > 0;
  const currentQ = hasPlan ? questions[currentIdx] : null;
  const progress = hasPlan ? ((currentIdx + 1) / questions.length) * 100 : 0;

  return (
    <Layout title="Mock Interview – Summer Tech Showcase">
      {!isInterviewStarted ? (
        // Form + setup card
        <div
          style={{
            maxWidth: "42rem",
            margin: "2.5rem auto",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--muted-bg)", // theme-aware
            padding: "2rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            color: "var(--text)", // ensure readable text
          }}
        >
          <h1
            style={{
              textAlign: "center",
              fontSize: "30px",
              lineHeight: "36px",
              fontWeight: 600,
              marginBottom: "24px",
              color: "var(--text)",
            }}
          >
            Mock Interview
          </h1>

          {!hasPlan && (
            <>
              <InterviewForm onSubmit={handleFormSubmit} />

              {loading && (
                <div style={{ marginTop: "16px", textAlign: "center" }}>
                  <div
                    style={{
                      display: "inline-block",
                      width: "40px",
                      height: "40px",
                      border: "4px solid var(--border)", // base ring
                      borderTop: "4px solid #2563eb", // brand ring
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <p style={{ marginTop: "12px", color: "var(--text)" }}>
                    Generating personalized interview questions with AI…
                  </p>
                  <p
                    style={{
                      marginTop: "8px",
                      color: "var(--muted-text)",
                      fontSize: "14px",
                    }}
                  >
                    This may take a few moments
                  </p>
                </div>
              )}

              {err && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    backgroundColor: "rgba(220,38,38,0.12)", // subtle red tint in both themes
                    border: "1px solid #dc2626",
                    borderRadius: "8px",
                  }}
                >
                  <p style={{ color: "#dc2626", margin: "0 0 8px 0" }}>
                    Error: {err}
                  </p>
                  <p
                    style={{
                      color: "var(--muted-text)",
                      fontSize: "14px",
                      margin: 0,
                    }}
                  >
                    Please check your OpenAI API key configuration and try
                    again.
                  </p>
                </div>
              )}
            </>
          )}

          {hasPlan && (
            <div
              style={{
                marginTop: "12px",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "16px",
                background: "var(--bg)", // nested section contrast
                color: "var(--text)",
              }}
            >
              <h3
                style={{
                  marginBottom: "16px",
                  color: "var(--text)",
                  fontSize: "18px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Thanks for taking the interview!
              </h3>

              <p
                style={{
                  marginBottom: "20px",
                  color: "var(--muted-text)",
                  fontSize: "16px",
                  textAlign: "center",
                }}
              >
                You can download a copy of your interview transcript through the
                button below as well!
              </p>

              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => setIsInterviewStarted(true)}
                  style={{
                    padding: "12px 24px",
                    fontSize: "16px",
                    fontWeight: 600,
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  Start Interview Session
                </button>
              </div>

              {/* Reset Button */}
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--muted-bg)",
                    color: "var(--text)",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Start New Interview
                </button>
              </div>
            </div>
          )}

          {/* CSS for loading spinner */}
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        // Interview session
        <InterviewSession
          questions={questions}
          improvementAreas={formData?.improvementAreas || []}
          onEndInterview={handleEndInterview}
          onReset={handleReset}
        />
      )}
    </Layout>
  );
}
