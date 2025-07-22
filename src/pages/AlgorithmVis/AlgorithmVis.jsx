import { useState, useRef, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import CustomPathGraph from './Graph';
import './AlgorithmVis.css';

export default function AlgorithmVis() {
  const [graphOrdering, setSharedData] = useState(null);
  const [runGraph, setRunGraph] = useState(null);
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
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
    
    // Constrain the width between 20% and 80%
    const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
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
    <div 
      className="grid-container" 
      ref={containerRef}
      style={{ cursor: isResizing ? 'col-resize' : 'default' }}
    >
      <div 
        className="left-side"
        style={{ width: `${leftWidth}%` }}
      >
        <CodeEditor 
          graphOrdering={graphOrdering}
          setSharedData={setSharedData}
          runGraph={runGraph}
          setRunGraph={setRunGraph}
        />
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
  );
}