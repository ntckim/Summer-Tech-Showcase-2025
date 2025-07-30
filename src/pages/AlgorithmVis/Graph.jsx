import React, { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import klay from 'cytoscape-klay';
import cytoscape from 'cytoscape';

cytoscape.use(klay);

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

  // --- NEW: Graph state ---
  const [nodes, setNodes] = useState([
    { data: { id: 'a' } },
    { data: { id: 'b' } },
    { data: { id: 'c' } },
    { data: { id: 'd' } },
    { data: { id: 'e' } },
  ]);
  const [edges, setEdges] = useState([
    { data: { id: 'ae', source: 'a', target: 'e' } },
    { data: { id: 'ab', source: 'a', target: 'b' } },
    { data: { id: 'be', source: 'b', target: 'e' } },
    { data: { id: 'bc', source: 'b', target: 'c' } },
    { data: { id: 'ce', source: 'c', target: 'e' } },
    { data: { id: 'cd', source: 'c', target: 'd' } },
    { data: { id: 'de', source: 'd', target: 'e' } },
  ]);
  const [selected, setSelected] = useState(null); // { type: 'node'|'edge', id: string }
  const [edgeCreation, setEdgeCreation] = useState([]); // [sourceId, targetId]

  const elements = [...nodes, ...edges];

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
    {
      selector: '.selected',
      style: {
        'background-color': '#ff9800',
        'line-color': '#ff9800',
        'target-arrow-color': '#ff9800',
        'border-width': 4,
        'border-color': '#ff9800',
      },
    },
  ];

  // --- Node/edge selection logic ---
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.off('tap');
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelected({ type: 'node', id: node.id() });
      if (edgeCreation.length === 1) {
        // Create edge from edgeCreation[0] to this node
        if (edgeCreation[0] !== node.id()) {
          handleAddEdge(edgeCreation[0], node.id());
        }
        setEdgeCreation([]);
      }
    });
    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      setSelected({ type: 'edge', id: edge.id() });
    });
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelected(null);
        setEdgeCreation([]);
      }
    });
  }, [cyRef, edgeCreation, nodes, edges]);

  // --- Highlight selected node/edge ---
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass('selected');
    if (selected) {
      cy.getElementById(selected.id).addClass('selected');
    }
  }, [selected, nodes, edges]);

  // --- Add/Remove/Move Node/Edge Handlers ---
  const handleAddNode = () => {
    // Generate a unique id
    let newId = '';
    let i = 0;
    do {
      newId = String.fromCharCode(97 + nodes.length + i); // a, b, c, ...
      i++;
    } while (nodes.some(n => n.data.id === newId));
    setNodes([...nodes, { data: { id: newId } }]);
  };

  const handleRemoveNode = () => {
    if (!selected || selected.type !== 'node') return;
    setNodes(nodes.filter(n => n.data.id !== selected.id));
    setEdges(edges.filter(e => e.data.source !== selected.id && e.data.target !== selected.id));
    setSelected(null);
  };

  const handleAddEdge = (source, target) => {
    // Generate a unique edge id
    const edgeId = source + target;
    if (edges.some(e => e.data.id === edgeId)) return;
    setEdges([...edges, { data: { id: edgeId, source, target } }]);
  };

  const handleRemoveEdge = () => {
    if (!selected || selected.type !== 'edge') return;
    setEdges(edges.filter(e => e.data.id !== selected.id));
    setSelected(null);
  };

  const handleStartEdge = () => {
    if (!selected || selected.type !== 'node') return;
    setEdgeCreation([selected.id]);
  };

  const handleResetLayout = () => {
    const cy = cyRef.current;
    if (cy) {
      cy.layout({ name: 'breadthfirst', roots: '#a', directed: true }).run();
    }
  };

  const handleSaveGraph = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Animation logic (unchanged) ---
  useEffect(() => {
    if (graphOrdering && graphOrdering.output) {
      setPathNodeIds(graphOrdering.output.dfs);
    }
  }, [graphOrdering]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
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
  }, [pathNodeIds, nodes, edges]);

  useEffect(() => {
    if (runGraph) {
      startAnimation();
    }
  }, [runGraph]);

  const startAnimation = () => {
    if (isRunning || !pathRef.current.length) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      const path = pathRef.current;
      if (indexRef.current < path.length) {
        path[indexRef.current].addClass('highlighted');
        indexRef.current += 1;
      } else {
        stopAnimation();
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
    if (isRunning || indexRef.current - 1 < 0) return;
    const path = pathRef.current;
    path[indexRef.current - 1].removeClass('highlighted');
    indexRef.current -= 1;
    if ((indexRef.current - 1) % 2 === 1 && indexRef.current - 1 > 0) {
      path[indexRef.current - 1].removeClass('highlighted');
      indexRef.current -= 1;
    }
  };

  const nextNode = () => {
    const path = pathRef.current;
    if (isRunning || indexRef.current >= path.length) return;
    path[indexRef.current].addClass('highlighted');
    indexRef.current += 1;
    if (indexRef.current % 2 === 0) {
      path[indexRef.current].addClass('highlighted');
      indexRef.current += 1;
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <CytoscapeComponent
        cy={(cy) => (cyRef.current = cy)}
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        layout={{ name: 'breadthfirst', roots: '#a', directed: true }}
        stylesheet={style}
        userPanningEnabled={true}
        userZoomingEnabled={true}
        boxSelectionEnabled={true}
        autoungrabify={false} // allow drag
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
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: '120px',
      }}>
        <button onClick={handleAddNode}>Add Node</button>
        <button onClick={handleRemoveNode} disabled={!selected || selected.type !== 'node'}>Remove Node</button>
        <button onClick={handleStartEdge} disabled={!selected || selected.type !== 'node'}>
          {edgeCreation.length === 1 ? 'Select Target' : 'Add Edge'}
        </button>
        <button onClick={handleRemoveEdge} disabled={!selected || selected.type !== 'edge'}>Remove Edge</button>
        <button onClick={handleResetLayout}>Reset Layout</button>
        <button onClick={handleSaveGraph}>Save Graph</button>
        <hr />
        <button onClick={previousNode} disabled={isRunning || indexRef.current === 0}>&larr;</button>
        <button onClick={startAnimation} disabled={isRunning}>▶️ Start</button>
        <button onClick={stopAnimation} disabled={!isRunning}>⏸️ Stop</button>
        <button onClick={resetAnimation}>🔁 Reset</button>
        <button onClick={nextNode} disabled={isRunning || indexRef.current === pathRef.current.length}>&rarr;</button>
      </div>
    </div>
  );
}
