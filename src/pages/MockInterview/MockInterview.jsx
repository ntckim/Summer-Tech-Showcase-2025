import { useCallback, useState } from "react";
import Layout from "../../layouts/Layout";
import InterviewForm from "./InterviewForm";
import { generateInterviewQuestions } from "./openRouterService";

export default function MockInterview() {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const handleFormSubmit = useCallback(async (formData) => {
    try {
      setLoading(true);
      setErr("");
      setQuestions([]);
      setCurrentIdx(0);
      setShowAllQuestions(false);

      // Generate questions using GPT
      const generatedQuestions = await generateInterviewQuestions(formData);
      
      if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
        throw new Error("No questions generated. Please try again.");
      }
      
      setQuestions(generatedQuestions);
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
  }, []);

  const hasPlan = questions.length > 0;
  const currentQ = hasPlan ? questions[currentIdx] : null;
  const progress = hasPlan ? ((currentIdx + 1) / questions.length) * 100 : 0;

  return (
    <Layout title="Mock Interview – Summer Tech Showcase">
      <div
        style={{
          maxWidth: "42rem",
          margin: "2.5rem auto",
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          padding: "2rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "30px",
            lineHeight: "36px",
            fontWeight: 600,
            marginBottom: "24px",
          }}
        >
          Mock Interview
        </h1>

        {!hasPlan && (
          <>
            <InterviewForm onSubmit={handleFormSubmit} />
            {loading && (
              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <div style={{ 
                  display: "inline-block",
                  width: "40px", 
                  height: "40px", 
                  border: "4px solid #e5e7eb",
                  borderTop: "4px solid #2563eb",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></div>
                              <p style={{ marginTop: "12px", color: "#374151" }}>
                  Generating personalized interview questions with AI…
                </p>
                <p style={{ marginTop: "8px", color: "#6b7280", fontSize: "14px" }}>
                  This may take a few moments
              </p>
              </div>
            )}
            {err && (
              <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" }}>
                <p style={{ color: "#dc2626", margin: "0 0 8px 0" }}>Error: {err}</p>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: "0" }}>
                  Please check your OpenAI API key configuration and try again.
                </p>
              </div>
            )}
          </>
        )}

        {hasPlan && (
          <div
            style={{
              marginTop: "12px",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            {/* View Toggle */}
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              marginBottom: "16px",
              gap: "8px"
            }}>
              <button
                type="button"
                onClick={() => setShowAllQuestions(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  background: !showAllQuestions ? "#2563eb" : "#ffffff",
                  color: !showAllQuestions ? "#ffffff" : "#374151",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                One by One
              </button>
              <button
                type="button"
                onClick={() => setShowAllQuestions(true)}
              style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  background: showAllQuestions ? "#2563eb" : "#ffffff",
                  color: showAllQuestions ? "#ffffff" : "#374151",
                fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
              }}
            >
                View All
              </button>
            </div>

            {!showAllQuestions ? (
              // Single Question View
              <>
                {/* Progress Bar */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "8px"
                  }}>
                    <span style={{ color: "#6b7280", fontSize: "14px" }}>
                      Question {currentIdx + 1} of {questions.length}
                    </span>
                    <span style={{ color: "#6b7280", fontSize: "14px" }}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: "100%",
                      backgroundColor: "#2563eb",
                      transition: "width 0.3s ease"
                    }}></div>
                  </div>
                </div>
                
                {/* Company Tag */}
                <div
                  style={{
                    marginBottom: "12px",
                    display: "inline-block",
                    backgroundColor: "#dbeafe",
                    color: "#1e40af",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}
                >
                  {currentQ.company}
                </div>
                
                {/* Question */}
            <div
              style={{
                fontSize: "18px",
                    lineHeight: "28px",
                    marginBottom: "20px",
                    color: "#111827",
                    fontWeight: "500"
                  }}
                >
                  {currentQ.question}
            </div>

                {/* Navigation */}
            <div
              style={{
                display: "flex",
                    gap: "12px",
                justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px"
              }}
            >
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                style={{
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                      padding: "10px 16px",
                  fontSize: "14px",
                      fontWeight: "500",
                  cursor: currentIdx === 0 ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease"
                }}
              >
                    ← Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))
                }
                style={{
                  borderRadius: "10px",
                  border: "none",
                      background: currentIdx === questions.length - 1 ? "#9ca3af" : "#2563eb",
                  color: "#fff",
                      padding: "10px 20px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: currentIdx === questions.length - 1 ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {currentIdx === questions.length - 1 ? "Complete" : "Next →"}
                  </button>
                </div>
              </>
            ) : (
              // All Questions View
              <div>
                <h3 style={{ 
                  marginBottom: "16px", 
                  color: "#111827", 
                  fontSize: "18px",
                  fontWeight: "600"
                }}>
                  All {questions.length} Questions
                </h3>
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "16px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        marginBottom: "12px",
                        backgroundColor: "#f9fafb"
                      }}
                    >
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        marginBottom: "8px"
                      }}>
                        <span style={{ 
                          color: "#6b7280", 
                          fontSize: "14px",
                          fontWeight: "500"
                        }}>
                          Question {idx + 1}
                        </span>
                        <span
                          style={{
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            textTransform: "uppercase"
                          }}
                        >
                          {q.company}
                        </span>
                      </div>
                      <p style={{ 
                        color: "#111827", 
                        fontSize: "16px",
                        lineHeight: "24px",
                        margin: "0"
                      }}>
                        {q.question}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Button */}
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#374151",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
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
    </Layout>
  );
}
