import { useState, useRef, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import CustomPathGraph from './Graph';
import './AlgorithmVis.css';
import Layout from '../../layouts/Layout';

export default function AlgorithmVis() {
  const [graphOrdering, setSharedData] = useState(null);
  const [runGraph, setRunGraph] = useState(null);
  const [leftWidth, setLeftWidth] = useState(40); // percentage - smaller for larger code editor
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState('lesson'); // 'lesson' or 'code'
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain the width between 25% and 70%
    const constrainedWidth = Math.max(25, Math.min(70, newLeftWidth));
    setLeftWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  return (
    <Layout title="Algorithm Visualizer - Summer Tech Showcase">
      <div 
        className="grid-container" 
        ref={containerRef}
        style={{ cursor: isResizing ? 'col-resize' : 'default' }}
      >
        <div 
          className="left-side"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="tab-container">
            <div className="tab-buttons">
              <button 
                className={`tab-button ${activeTab === 'lesson' ? 'active' : ''}`}
                onClick={() => setActiveTab('lesson')}
              >
                Problem
              </button>
              <button 
                className={`tab-button ${activeTab === 'code' ? 'active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                Solution
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'lesson' && (
                <div className="lesson-content">
                  <h1>Depth-First Search (DFS)</h1>
                  
                  <h2>Problem Description</h2>
                  <p>
                    Implement a Depth-First Search algorithm to traverse a graph. DFS explores as far as possible 
                    along each branch before backtracking, making it useful for exploring all possible paths in a graph.
                  </p>

                  <h2>How DFS Works</h2>
                  <p>
                    Depth-First Search works by starting at a chosen node and exploring as far as possible along each branch 
                    before backtracking. Think of it like exploring a maze - you take one path as far as it goes, then 
                    backtrack to try another path when you hit a dead end.
                  </p>

                  <h3>Algorithm Steps:</h3>
                  <ol>
                    <li>Start at a chosen node (root)</li>
                    <li>Mark the current node as visited</li>
                    <li>Explore an unvisited neighbor of the current node</li>
                    <li>Recursively apply the same process to the neighbor</li>
                    <li>When you reach a dead end, backtrack to the previous node</li>
                    <li>Continue until all reachable nodes are visited</li>
                  </ol>

                  <h2>Key Characteristics</h2>
                  <ul>
                    <li><strong>Uses a stack:</strong> Either explicitly (iterative) or implicitly (recursive)</li>
                    <li><strong>Memory efficient:</strong> Only stores the current path in memory</li>
                    <li><strong>Complete traversal:</strong> Visits all reachable nodes from the starting point</li>
                    <li><strong>Order matters:</strong> The order of visiting neighbors affects the traversal path</li>
                  </ul>

                  <h2>Common Applications</h2>
                  <ul>
                    <li>Maze solving and pathfinding</li>
                    <li>Topological sorting of directed acyclic graphs</li>
                    <li>Cycle detection in directed graphs</li>
                    <li>Finding connected components</li>
                    <li>Game tree exploration and analysis</li>
                  </ul>

                  <h2>Time & Space Complexity</h2>
                  <ul>
                    <li><strong>Time Complexity:</strong> O(V + E) where V = vertices, E = edges</li>
                    <li><strong>Space Complexity:</strong> O(V) in worst case (when graph is a straight line)</li>
                  </ul>

                  <h2>Example</h2>
                  <p>
                    Given the graph below, a DFS starting from node 0 would visit nodes in this order: 0 → 1 → 3 → 4 → 7 → 2 → 5 → 6
                  </p>
                  <pre className="graph-example">
{`Graph (Adjacency List):
0: [1, 2]
1: [0, 3, 4]
2: [0, 5, 6]
3: [1]
4: [1, 7]
5: [2]
6: [2]
7: [4]`}
                  </pre>
                </div>
              )}
              
              {activeTab === 'code' && (
                <CodeEditor 
                  graphOrdering={graphOrdering}
                  setSharedData={setSharedData}
                  runGraph={runGraph}
                  setRunGraph={setRunGraph}
                  isOutputCollapsed={isOutputCollapsed}
                  setIsOutputCollapsed={setIsOutputCollapsed}
                />
              )}
            </div>
          </div>
        </div>
        <div 
          className="resize-handle"
          onMouseDown={handleMouseDown}
        />
        <div 
          className="right-side"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <CustomPathGraph 
            graphOrdering={graphOrdering} 
            runGraph={runGraph}
          />
        </div>
      </div>
    </Layout>
  );
}