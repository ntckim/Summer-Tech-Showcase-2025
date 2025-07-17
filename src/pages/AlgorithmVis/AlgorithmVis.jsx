import { useState } from 'react';
import CodeEditor from './CodeEditor';
import CustomPathGraph from './Graph';
import './AlgorithmVis.css';

export default function AlgorithmVis() {
  const [graphOrdering, setSharedData] = useState(null);
  return (
    <div className="grid-container">
      <div className="left-side">
        <CodeEditor 
          graphOrdering={graphOrdering}
          setSharedData={setSharedData}
        />
      </div>
      <div className="right-side">
        <CustomPathGraph 
          graphOrdering={graphOrdering} 
        />
      </div>
    </div>
  );

}