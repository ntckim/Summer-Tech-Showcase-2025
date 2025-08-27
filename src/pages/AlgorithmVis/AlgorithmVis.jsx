import { useState, useRef, useEffect } from "react";
import CodeEditor from "./CodeEditor";
import CustomPathGraph from "./Graph";
import "./AlgorithmVis.css";
import Layout from "../../layouts/Layout";
import { loadPyodide } from "pyodide";
import { getExamplesForAlgorithm } from "./graphExamples";

export default function AlgorithmVis() {
  const [graphOrdering, setSharedData] = useState(null);
  const [runGraph, setRunGraph] = useState(null);
  const [leftWidth, setLeftWidth] = useState(40); // percentage - smaller for larger code editor
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState("lesson"); // 'lesson' or 'code'
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState("dfs");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pyodide, setPyodide] = useState(null);
  const [isPyodideLoading, setIsPyodideLoading] = useState(true);
  const containerRef = useRef(null);
  const [selectedExample, setSelectedExample] = useState("simple");

  const concepts = [
    { id: "bigO", name: "Asymptotic Notation", file: "bigO-notation-concepts.html" },
    { id: "dfs", name: "Depth-First Search (DFS)", file: "dfs-concepts.html" },
    {
      id: "bfs",
      name: "Breadth-First Search (BFS)",
      file: "bfs-concepts.html",
    },
    {
      id: "dijkstra",
      name: "Dijkstra's Algorithm",
      file: "dijkstra-concepts.html",
    },
    {
      id: "bellman-ford",
      name: "Bellman-Ford Algorithm",
      file: "bellman-ford-concepts.html",
    },
    { id: "MST", name: "Minimum Spanning Tree", file: "MST-concepts.html" },
    {
      id: "kruskal",
      name: "Kruskal's Algorithm (MST)",
      file: "kruskal-concepts.html",
    },
    { id: "prim", name: "Prim's Algorithm (MST)", file: "prim-concepts.html" },
    {
      id: "unionFind",
      name: "Union-Find Data Structure",
      file: "UnionFind-Concepts.html",
    },
  ];

  // Initialize Pyodide when the page loads
  useEffect(() => {
    const initPyodide = async () => {
      try {
        console.log("Loading Python interpreter...");
        const pyodideInstance = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/",
        });
        setPyodide(pyodideInstance);
        setIsPyodideLoading(false);
        console.log("Python interpreter loaded successfully!");
      } catch (error) {
        console.error("Error loading Python interpreter:", error);
        setIsPyodideLoading(false);
      }
    };

    initPyodide();
  }, []);

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newLeftWidth =
      ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Constrain the width between 25% and 70%
    const constrainedWidth = Math.max(25, Math.min(70, newLeftWidth));
    setLeftWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleConceptSelect = (conceptId) => {
    setSelectedConcept(conceptId);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const getCurrentConcept = () => {
    return (
      concepts.find((concept) => concept.id === selectedConcept) || concepts[0]
    );
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest(".concept-menu-container")) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Get available examples for current concept
  const currentExamples = getExamplesForAlgorithm(selectedConcept);
  const currentExample =
    currentExamples[selectedExample] || currentExamples.simple;

  useEffect(() => {
    if (currentExample) {
      // setNodes(currentExample.nodes); // These lines were removed from the new_code, so they are removed here.
      // setEdges(currentExample.edges);
      // Reset animation state
      // resetAnimation();
    }
  }, [selectedConcept, selectedExample]);

  return (
    <Layout title="Algorithm Visualizer - Summer Tech Showcase">
      {isPyodideLoading && (
        <div className="pyodide-loading-banner">
          ⏳ Loading Python interpreter... This may take a moment on first load.
        </div>
      )}
      <div
        className="grid-container"
        ref={containerRef}
        style={{ cursor: isResizing ? "col-resize" : "default" }}
      >
        <div className="left-side" style={{ width: `${leftWidth}%` }}>
          <div className="tab-container">
            <div className="tab-buttons">
              <button
                className={`tab-button ${
                  activeTab === "lesson" ? "active" : ""
                }`}
                onClick={() => setActiveTab("lesson")}
              >
                Problem
              </button>
              <button
                className={`tab-button ${activeTab === "code" ? "active" : ""}`}
                onClick={() => setActiveTab("code")}
              >
                Solution
              </button>
            </div>

            <div className="tab-content">
              {activeTab === "lesson" && (
                <div className="concepts-iframe-container">
                  <div className="concept-menu-container">
                    <button
                      className="concept-menu-button"
                      onClick={toggleMenu}
                    >
                      {getCurrentConcept().name}
                      <span
                        className={`menu-arrow ${isMenuOpen ? "open" : ""}`}
                      >
                        ▼
                      </span>
                    </button>
                    {isMenuOpen && (
                      <div className="concept-menu-dropdown">
                        {concepts.map((concept) => (
                          <button
                            key={concept.id}
                            className={`concept-menu-item ${
                              selectedConcept === concept.id ? "active" : ""
                            }`}
                            onClick={() => handleConceptSelect(concept.id)}
                          >
                            {concept.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <iframe
                    src={`/dfs-pages/${getCurrentConcept().file}`}
                    className="concepts-iframe"
                    title={getCurrentConcept().name}
                    key={selectedConcept}
                  />
                </div>
              )}

              {activeTab === "code" && (
                <CodeEditor
                  graphOrdering={graphOrdering}
                  setSharedData={setSharedData}
                  runGraph={runGraph}
                  setRunGraph={setRunGraph}
                  isOutputCollapsed={isOutputCollapsed}
                  setIsOutputCollapsed={setIsOutputCollapsed}
                  pyodide={pyodide}
                  isPyodideLoading={isPyodideLoading}
                />
              )}
            </div>
          </div>
        </div>
        <div className="resize-handle" onMouseDown={handleMouseDown} />
        <div className="right-side" style={{ width: `${100 - leftWidth}%` }}>
          {/* Add example selector */}
          <div className="example-selector">
            <select
              value={selectedExample}
              onChange={(e) => setSelectedExample(e.target.value)}
              className="example-dropdown"
            >
              {Object.keys(currentExamples).map((exampleKey) => (
                <option key={exampleKey} value={exampleKey}>
                  {currentExamples[exampleKey].name}
                </option>
              ))}
            </select>
          </div>

          <CustomPathGraph
            graphOrdering={graphOrdering}
            runGraph={runGraph}
            selectedConcept={selectedConcept}
            selectedExample={selectedExample}
          />
        </div>
      </div>
    </Layout>
  );
}
