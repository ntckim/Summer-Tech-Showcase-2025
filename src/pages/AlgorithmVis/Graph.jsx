import React, { useEffect, useRef, useState} from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import klay from 'cytoscape-klay'
import cytoscape from 'cytoscape';

cytoscape.use(klay)

export default function CustomPathGraph({
  graphOrdering,
  runGraph,
}) {
  const cyRef = useRef(null);
  const intervalRef = useRef(null);
  const indexRef = useRef(0);
  const pathRef = useRef([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pathNodeIds, setPathNodeIds] = useState(['a', 'b', 'c', 'd', 'e']); // Default path

  const elements = [
    // Nodes
    { data: { id: 'a' } },
    { data: { id: 'b' } },
    { data: { id: 'c' } },
    { data: { id: 'd' } },
    { data: { id: 'e' } },

    // Edges
    { data: { id: 'ae', source: 'a', target: 'e' } },
    { data: { id: 'ab', source: 'a', target: 'b' } },
    { data: { id: 'be', source: 'b', target: 'e' } },
    { data: { id: 'bc', source: 'b', target: 'c' } },
    { data: { id: 'ce', source: 'c', target: 'e' } },
    { data: { id: 'cd', source: 'c', target: 'd' } },
    { data: { id: 'de', source: 'd', target: 'e' } },
  ];

  const style = [
    {
      selector: 'node',
      style: {
        content: 'data(id)',
        'text-valign': 'center',
        'background-color': '#999',
        color: '#fff',
        'text-outline-width': 2,
        'text-outline-color': '#999',
        'font-size': 16,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 4,
        'line-color': '#ddd',
        'target-arrow-color': '#ddd',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
      },
    },
    {
      selector: '.highlighted',
      style: {
        'background-color': '#61bffc',
        'line-color': '#61bffc',
        'target-arrow-color': '#61bffc',
        'transition-property': 'background-color, line-color, target-arrow-color',
        'transition-duration': '0.5s',
      },
    },
  ];
  useEffect(() => {
    if (graphOrdering && graphOrdering.output) {
      console.log(graphOrdering.output.dfs);
      setPathNodeIds(graphOrdering.output.dfs);
    }
  }, [graphOrdering]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    // Define manual path
    //const pathNodeIds = ['a', 'b', 'c', 'd', 'e'];
    console.log("new path", pathNodeIds);
    const elementsToHighlight = [];

    for (let i = 0; i < pathNodeIds.length; i++) {
      elementsToHighlight.push(cy.getElementById(pathNodeIds[i]));

      if (i < pathNodeIds.length - 1) {
        const edge = cy.edges().filter(edge =>
          edge.data('source') === pathNodeIds[i] &&
          edge.data('target') === pathNodeIds[i + 1]
        )[0];
        if (edge) elementsToHighlight.push(edge);
      }
    }

    pathRef.current = elementsToHighlight;
  }, [pathNodeIds]);


  useEffect(() => {
    if (runGraph) {
      startAnimation()
    }

  }, [runGraph])

  const startAnimation = () => {
    if (isRunning || !pathRef.current.length) return;

    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      const path = pathRef.current;
      if (indexRef.current < path.length) {
        path[indexRef.current].addClass('highlighted');
        indexRef.current += 1;
      } else {
        stopAnimation(); // stop when done
      }
    }, 1000);
  };

  const stopAnimation = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
  };

  const resetAnimation = () => {
    stopAnimation();
    indexRef.current = 0;

    if (cyRef.current) {
      cyRef.current.elements().removeClass('highlighted');
    }
  };

  const previousNode = () => {
    console.log(indexRef.current - 1, pathRef.current.length)
    if (isRunning || indexRef.current - 1 < 0) return;
    const path = pathRef.current
    path[indexRef.current - 1].removeClass('highlighted');
    indexRef.current -= 1;
    if ((indexRef.current - 1) % 2 === 1 && indexRef.current - 1 > 0) {
      path[indexRef.current - 1].removeClass('highlighted');
      indexRef.current -= 1;
    }
  }

  const nextNode = () => {
    const path = pathRef.current;
    console.log(indexRef.current, path.length)
    if (isRunning || indexRef.current >= path.length) return;
    path[indexRef.current].addClass('highlighted');
    indexRef.current += 1;
    if (indexRef.current % 2 === 0) {
      path[indexRef.current].addClass('highlighted');
      indexRef.current += 1
    }
  }


  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Cytoscape graph full screen */}
      <CytoscapeComponent
        cy={(cy) => (cyRef.current = cy)}
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        layout={{ name: 'breadthfirst', roots: '#a', directed: true }}
        stylesheet={style}
      />

      {/* Floating toolbar */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      }}>
        <button onClick={previousNode} disabled={isRunning || indexRef.current === 0}>
          &larr; 
        </button>
        <button onClick={startAnimation} disabled={isRunning}>
          ▶️ Start
        </button>
        <button onClick={stopAnimation} disabled={!isRunning}>
          ⏸️ Stop
        </button>
        <button onClick={resetAnimation}>
          🔁 Reset
        </button>
        <button onClick={nextNode} disabled={isRunning || indexRef.current === pathRef.current.length}>
          &rarr;
        </button>
      </div>
    </div>
  );
}
