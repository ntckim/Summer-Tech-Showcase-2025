import React, { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import klay from 'cytoscape-klay';
import cytoscape from 'cytoscape';
import { getExamplesForAlgorithm, getDefaultPath } from './graphExamples';

cytoscape.use(klay);

export default function CustomPathGraph({
  graphOrdering,
  runGraph,
  selectedConcept, // Add this prop
  selectedExample = 'simple' // Add this prop with default
}) {
  const cyRef = useRef(null);
  const indexRef = useRef(0);
  const pathRef = useRef([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pathNodeIds, setPathNodeIds] = useState([]); // Start with empty path
  const [isUsingDefaultPath, setIsUsingDefaultPath] = useState(true); // Track if using default path
  const [isToolbarVisible, setIsToolbarVisible] = useState(true); // Track toolbar visibility
  const [currentSpeed, setCurrentSpeed] = useState(5000); // Track current animation speed

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
        width: 40,
        height: 40,
        'shape': 'ellipse',
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

  // Get the current graph example
  const currentExamples = getExamplesForAlgorithm(selectedConcept);
  const currentExample = currentExamples[selectedExample] || currentExamples.simple;
  
  // Initialize with the current example
  useEffect(() => {
    if (currentExample) {
      setNodes(currentExample.nodes);
      setEdges(currentExample.edges);
      // Reset animation state
      resetAnimation();
      
      // Load default path for this example
      const defaultPath = getDefaultPath(selectedConcept, selectedExample);
      if (defaultPath.length > 0) {
        setPathNodeIds(defaultPath);
        setIsUsingDefaultPath(true);
        console.log('Loaded default path:', defaultPath);
      }
      
      // Apply proper layout after a short delay to ensure DOM is ready
      setTimeout(() => {
        const bestLayout = detectBestLayout();
        applyLayout(bestLayout);
      }, 100);
    }
  }, [selectedConcept, selectedExample]);

  // Handle initial mount and ensure proper fit
  useEffect(() => {
    if (cyRef.current && currentExample) {
      // Wait for the next tick to ensure elements are rendered
      setTimeout(() => {
        fitToView();
      }, 100);
    }
  }, [cyRef.current]);

  // Handle window resize to maintain proper fit
  useEffect(() => {
    const handleResize = () => {
      if (cyRef.current) {
        setTimeout(() => {
          fitToView();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Enhanced initialization with better timing
  useEffect(() => {
    if (cyRef.current && nodes.length > 0 && edges.length > 0) {
      // Wait for Cytoscape to be fully initialized
      const checkReady = () => {
        if (cyRef.current && cyRef.current.elements().length > 0) {
          // Apply initial layout and fit
          const bestLayout = detectBestLayout();
          applyLayout(bestLayout);
        } else {
          setTimeout(checkReady, 100);
        }
      };
      
      checkReady();
    }
  }, [cyRef.current, nodes, edges]);

  // Function to apply different layout algorithms
  const applyLayout = (layoutName) => {
    const cy = cyRef.current;
    if (!cy) return;

    // Override layout options for tighter node spacing and shorter edges
    const layoutOptions = {
      cose: {
        name: 'cose',
        animate: true,
        animationDuration: 1000,
        nodeDimensionsIncludeLabels: true,
        fit: true,
        padding: 50,
        randomize: false,
        componentSpacing: 30, // much closer
        nodeRepulsion: 10000, // much less repulsion
        nodeOverlap: 10,
        idealEdgeLength: 40, // shorter edges
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      },
      breadthfirst: {
        name: 'breadthfirst',
        animate: true,
        animationDuration: 1000,
        directed: true,
        roots: currentExample?.startNode ? `#${currentExample.startNode}` : undefined,
        padding: 50,
        spacingFactor: 0.7, // much closer
        nodeDimensionsIncludeLabels: true,
        fit: true
      },
      circle: {
        name: 'circle',
        animate: true,
        animationDuration: 1000,
        padding: 50,
        radius: 80, // smaller radius
        startAngle: 3/2 * Math.PI,
        sweep: undefined,
        clockwise: true,
        fit: true,
        nodeDimensionsIncludeLabels: true
      },
      grid: {
        name: 'grid',
        animate: true,
        animationDuration: 1000,
        padding: 50,
        fit: true,
        nodeDimensionsIncludeLabels: true,
        rows: undefined,
        cols: undefined,
        spacingFactor: 0.7 // much closer
      },
      random: {
        name: 'random',
        animate: true,
        animationDuration: 1000,
        fit: true,
        padding: 50
      }
    };

    const layout = layoutOptions[layoutName];
    if (layout) {
      const layoutInstance = cy.layout(layout);

      // Listen for layout completion
      layoutInstance.on('layoutstop', () => {
        console.log('Layout completed, fitting to view...');
        // Single fitting call after layout completes
        fitToView();
      });

      layoutInstance.run();
    }
  };

  // Function to fit the graph to the container with proper zoom
  const fitToView = () => {
    const cy = cyRef.current;
    if (!cy) return;

    try {
      const elements = cy.elements();
      if (elements.length === 0) return;

      // Get container dimensions
      let containerWidth, containerHeight;
      const containerElement = cy.container();
      if (containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        containerWidth = containerRect.width;
        containerHeight = containerRect.height;
      } else {
        containerWidth = window.innerWidth * 0.6;
        containerHeight = window.innerHeight * 0.8;
      }

      // Get bounding box of all elements
      const bbox = elements.boundingBox();
      const graphWidth = bbox.w;
      const graphHeight = bbox.h;

      // Calculate zoom to fit all elements with padding
      const padding = 100;
      const zoomX = (containerWidth - padding * 2) / graphWidth;
      const zoomY = (containerHeight - padding * 2) / graphHeight;
      const optimalZoom = Math.min(zoomX, zoomY, 1.5);

      // Center coordinates for graph and container
      const graphCenter = {
        x: bbox.x1 + graphWidth / 2,
        y: bbox.y1 + graphHeight / 2
      };
      const containerCenter = {
        x: containerWidth / 2,
        y: containerHeight / 2
      };

      // Set zoom and pan so graph center aligns with container center
      if (optimalZoom > 0.1 && optimalZoom < 3) {
        cy.zoom(optimalZoom);
        cy.pan({
          x: containerCenter.x - graphCenter.x * optimalZoom,
          y: containerCenter.y - graphCenter.y * optimalZoom
        });
      } else {
        cy.fit(elements, padding);
      }
    } catch (error) {
      cy.fit(cy.elements(), 50);
    }
  };

  // Function to automatically detect the best layout for the current graph
  const detectBestLayout = () => {
    if (!currentExample) return 'cose';
    
    const nodeCount = currentExample.nodes.length;
    const edgeCount = currentExample.edges.length;
    const hasCycles = edgeCount >= nodeCount; // Simple heuristic for cycles
    
    // For small graphs, use circle layout
    if (nodeCount <= 6) {
      return 'circle';
    }
    
    // For tree-like structures, use breadthfirst
    if (edgeCount === nodeCount - 1 && !hasCycles) {
      return 'breadthfirst';
    }
    
    // For dense graphs with cycles, use cose (force-directed)
    if (hasCycles) {
      return 'cose';
    }
    
    // Default to grid for regular structures
    return 'grid';
  };

  // Enhanced reset layout function
  const handleResetLayout = () => {
    const cy = cyRef.current;
    if (cy) {
      // Use cose layout for better general-purpose graph visualization
      applyLayout('cose');
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
    console.log("Graph ordering changed:", graphOrdering);
    if (graphOrdering && graphOrdering.output) {
      console.log("Setting new path from code:", graphOrdering.output.dfs);
      setPathNodeIds(graphOrdering.output.dfs);
      setIsUsingDefaultPath(false); // Set to false when a custom path is provided
    } else {
      // If no custom path, ensure default path is loaded
      if (pathNodeIds.length === 0) {
        const defaultPath = getDefaultPath(selectedConcept, selectedExample);
        if (defaultPath.length > 0) {
          setPathNodeIds(defaultPath);
          setIsUsingDefaultPath(true);
        }
      }
    }
  }, [graphOrdering, selectedConcept, selectedExample]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    
    // Use useMemo-like optimization to avoid rebuilding path unnecessarily
    const buildPathElements = () => {
      const elementsToHighlight = [];
      
      // Check if we have an edge-based path (much cleaner and faster)
      if (pathNodeIds.length > 0 && typeof pathNodeIds[0] === 'string' && pathNodeIds[0].length === 2) {
        // This looks like an edge-based path (e.g., ['01', '13', '14'])
        console.log('Using edge-based path for cleaner animation');
        
        // Build a complete path: source node → edge → target node for each edge
        const completePath = [];
        const highlightedNodes = new Set(); // Track already highlighted nodes
        
        pathNodeIds.forEach(edgeId => {
          const edge = cy.getElementById(edgeId);
          if (edge.length > 0) {
            const sourceId = edge.data('source');
            const targetId = edge.data('target');
            
            // Add source node if not already highlighted
            if (!highlightedNodes.has(sourceId)) {
              const sourceNode = cy.getElementById(sourceId);
              if (sourceNode.length > 0) {
                completePath.push(sourceNode);
                highlightedNodes.add(sourceId);
              }
            }
            
            // Add the edge
            completePath.push(edge);
            
            // Add target node if not already highlighted
            if (!highlightedNodes.has(targetId)) {
              const targetNode = cy.getElementById(targetId);
              if (targetNode.length > 0) {
                completePath.push(targetNode);
                highlightedNodes.add(targetId);
              }
            }
          }
        });
        
        elementsToHighlight.push(...completePath);
        console.log(`Built complete path: ${completePath.length} elements (nodes + edges)`);
      } else if (isUsingDefaultPath && pathNodeIds.length > 0) {
        // For default path, create a sequence of nodes and edges
        for (let i = 0; i < pathNodeIds.length; i++) {
          const node = cy.getElementById(pathNodeIds[i]);
          if (node.length > 0) {
            elementsToHighlight.push(node);
          }
          
          // Add edge to next node if it exists
          if (i < pathNodeIds.length - 1) {
            const edge = cy.edges().filter(edge =>
              (edge.data('source') === pathNodeIds[i] && edge.data('target') === pathNodeIds[i + 1]) ||
              (edge.data('source') === pathNodeIds[i + 1] && edge.data('target') === pathNodeIds[i])
            )[0];
            if (edge) {
              elementsToHighlight.push(edge);
            }
          }
        }
      } else if (pathNodeIds.length > 0) {
        // For custom path, create a sequence of nodes and edges
        for (let i = 0; i < pathNodeIds.length; i++) {
          const node = cy.getElementById(pathNodeIds[i]);
          if (node.length > 0) {
            elementsToHighlight.push(node);
          }
          
          // Add edge to next node if it exists
          if (i < pathNodeIds.length - 1) {
            const edge = cy.edges().filter(edge =>
              edge.data('source') === pathNodeIds[i] &&
              edge.data('target') === pathNodeIds[i + 1]
            )[0];
            if (edge) {
              elementsToHighlight.push(edge);
            }
          }
        }
      }
      
      return elementsToHighlight;
    };
    
    const newPathElements = buildPathElements();
    console.log('Path elements to highlight:', newPathElements.length, 'elements');
    
    // Only update if the path actually changed
    if (JSON.stringify(newPathElements.map(el => el.id())) !== JSON.stringify(pathRef.current.map(el => el.id()))) {
      pathRef.current = newPathElements;
    }
  }, [pathNodeIds, nodes, edges, isUsingDefaultPath, selectedConcept, selectedExample]);

  useEffect(() => {
    if (runGraph) {
      console.log("Starting animation triggered by runGraph:", runGraph);
      startAnimation();
    }
  }, [runGraph]);

  // Smart animation system that understands algorithm backtracking
  const startAnimationWithSpeed = (totalTime = 5000) => {
    if (isRunning || !pathRef.current.length) return;
    setIsRunning(true);
    
    // Check if we're using an edge-based path (much simpler)
    const isEdgeBasedPath = pathNodeIds.length > 0 && typeof pathNodeIds[0] === 'string' && pathNodeIds[0].length === 2;
    
    if (isEdgeBasedPath) {
      console.log(`Starting edge-based animation with ${totalTime}ms total time, ${pathRef.current.length} edges`);
      
      // Edge-based paths are much simpler - no backtracking complexity
      const elementDuration = totalTime / pathRef.current.length;
      console.log(`Each edge will be highlighted for ${elementDuration.toFixed(0)}ms`);
      
      // Clear any existing highlighting
      if (cyRef.current) {
        cyRef.current.elements().removeClass('highlighted');
      }
      
      // Reset index
      indexRef.current = 0;
      
      // Smart edge animation: highlight source → edge → target, skip already highlighted
      const animateEdge = () => {
        if (indexRef.current < pathRef.current.length) {
          const currentElement = pathRef.current[indexRef.current];
          
          // Highlight the current element (node or edge)
          currentElement.addClass('highlighted');
          
          // Log what we're highlighting
          if (currentElement.isNode()) {
            console.log(`Highlighted node: ${currentElement.id()}`);
          } else {
            console.log(`Highlighted edge ${indexRef.current + 1}/${pathRef.current.length}: ${currentElement.id()}`);
          }
          
          indexRef.current += 1;
          
          // Schedule next element
          setTimeout(animateEdge, elementDuration);
        } else {
          console.log('Edge animation completed');
          setIsRunning(false);
        }
      };
      
      // Start the animation
      animateEdge();
    } else {
      // Fallback to the old complex animation for node-based paths
      console.log(`Starting complex node-based animation with ${totalTime}ms total time, ${pathRef.current.length} elements`);
      
      // Analyze the path structure to understand backtracking points
      const pathAnalysis = analyzePathStructure(pathRef.current);
      console.log('Path analysis:', pathAnalysis);
      
      // Clear any existing highlighting
      if (cyRef.current) {
        cyRef.current.elements().removeClass('highlighted');
      }
      
      // Reset index
      indexRef.current = 0;
      
      // Calculate timing based on path complexity and backtracking
      const pathLength = pathRef.current.length;
      const backtrackingCount = pathAnalysis.backtrackingPoints.length;
      
      // Adjust timing for backtracking - give more time for complex transitions
      let elementDuration;
      if (backtrackingCount > 0) {
        // Add extra time for backtracking transitions
        const extraTime = backtrackingCount * 200; // 200ms extra per backtracking point
        elementDuration = (totalTime + extraTime) / pathLength;
      } else {
        elementDuration = totalTime / pathLength;
      }
      
      console.log(`Path has ${backtrackingCount} backtracking points, element duration: ${elementDuration.toFixed(0)}ms`);
      
      // Smart animation with backtracking awareness
      const animateElement = () => {
        if (indexRef.current < pathRef.current.length) {
          const currentElement = pathRef.current[indexRef.current];
          
          // Add highlighting
          currentElement.addClass('highlighted');
          
          // Check if this is a backtracking moment
          const isBacktracking = pathAnalysis.backtrackingPoints.some(point => point.index === indexRef.current);
          
          if (isBacktracking) {
            console.log(`🔄 Backtracking to ${currentElement.isNode() ? 'Node' : 'Edge'} ${currentElement.id()}`);
            // Add special visual feedback for backtracking
            currentElement.addClass('backtracking');
            // Remove backtracking class after a short delay
            setTimeout(() => {
              currentElement.removeClass('backtracking');
            }, elementDuration * 0.5);
            
            // Add a small pause for backtracking transitions to make them smoother
            setTimeout(() => {
              indexRef.current += 1;
              animateElement();
            }, 100); // Small pause for backtracking
          } else {
            // Normal progression
            indexRef.current += 1;
            setTimeout(animateElement, elementDuration);
          }
          
          console.log(`Highlighted element ${indexRef.current}/${pathRef.current.length}:`, 
            currentElement.isNode() ? `Node: ${currentElement.id()}` : `Edge: ${currentElement.id()}`,
            isBacktracking ? '(Backtracking)' : '');
        } else {
          console.log('Animation completed');
          setIsRunning(false);
          // Remove any remaining backtracking classes
          if (cyRef.current) {
            cyRef.current.elements().removeClass('backtracking');
          }
        }
      };
      
      // Start the animation
      animateElement();
    }
  };

  // Function to detect backtracking in the path
  const checkIfBacktracking = (currentIndex, path) => {
    if (currentIndex === 0) return false; // First element can't be backtracking
    
    const currentElement = path[currentIndex];
    if (!currentElement.isNode()) return false; // Only nodes can be backtracking
    
    const currentNodeId = currentElement.id();
    
    // Check if we've seen this node before in the path
    for (let i = 0; i < currentIndex; i++) {
      const previousElement = path[i];
      if (previousElement.isNode() && previousElement.id() === currentNodeId) {
        // This is a backtracking moment - we're revisiting a node
        return true;
      }
    }
    
    return false;
  };

  // Enhanced function to detect path transitions and backtracking
  const analyzePathStructure = (path) => {
    const analysis = {
      backtrackingPoints: [],
      pathSegments: [],
      currentNode: null,
      currentSegment: []
    };
    
    path.forEach((element, index) => {
      if (element.isNode()) {
        const nodeId = element.id();
        
        // Check if this is a backtracking point
        if (analysis.currentNode && analysis.currentNode !== nodeId) {
          // We're moving to a different node - might be backtracking
          const isBacktracking = path.slice(0, index).some(prevElement => 
            prevElement.isNode() && prevElement.id() === nodeId
          );
          
          if (isBacktracking) {
            analysis.backtrackingPoints.push({
              index: index,
              nodeId: nodeId,
              type: 'backtrack'
            });
          }
        }
        
        analysis.currentNode = nodeId;
        analysis.currentSegment.push(element);
      } else {
        // Edge element
        analysis.currentSegment.push(element);
      }
    });
    
    return analysis;
  };

  // New function to handle edge-based paths
  const buildEdgePath = (edgeIds) => {
    const cy = cyRef.current;
    if (!cy) return [];
    
    const edgeElements = [];
    edgeIds.forEach(edgeId => {
      const edge = cy.getElementById(edgeId);
      if (edge.length > 0) {
        edgeElements.push(edge);
      }
    });
    
    return edgeElements;
  };

  const startAnimation = () => {
    startAnimationWithSpeed(currentSpeed); // Use current speed setting
  };

  const stopAnimation = () => {
    setIsRunning(false);
    // No need to clear interval since we're using setTimeout now
  };

  const resetAnimation = () => {
    stopAnimation();
    indexRef.current = 0;
    if (cyRef.current) {
      cyRef.current.elements().removeClass('highlighted');
    }
  };

  // Smooth path transition function to reduce lag
  const smoothPathTransition = (newPathNodeIds) => {
    const cy = cyRef.current;
    if (!cy) return;
    
    // Clear current highlighting smoothly
    cy.elements().removeClass('highlighted');
    
    // Update path and start animation immediately
    setPathNodeIds(newPathNodeIds);
    
    // Small delay to ensure state update, then start animation
    setTimeout(() => {
      if (!isRunning) {
        startAnimation();
      }
    }, 50);
  };

  const nextNode = () => {
    const path = pathRef.current;
    if (isRunning || indexRef.current >= path.length) return;
    
    // Highlight the current element (node or edge)
    path[indexRef.current].addClass('highlighted');
    indexRef.current += 1;
  };

  const previousNode = () => {
    if (isRunning || indexRef.current - 1 < 0) return;
    const path = pathRef.current;
    
    // Remove highlight from the previous element
    path[indexRef.current - 1].removeClass('highlighted');
    indexRef.current -= 1;
  };

  return (
    <div style={{ position: 'relative', width: '150%', height: '100%', transform: 'scale(0.67)', transformOrigin: 'top left' }}>
      <CytoscapeComponent
        cy={(cy) => (cyRef.current = cy)}
        elements={elements}
        style={{ width: '150%', height: '150%' }} // expand canvas to compensate for scale
        layout={{
          name: 'cose',
          animate: false,
          fit: true,
          padding: 50,
          componentSpacing: 100, // more space for initial render
          nodeRepulsion: 400000,
          idealEdgeLength: 120, // longer edges for initial render
        }}
        stylesheet={style}
        userPanningEnabled={true}
        userZoomingEnabled={true}
        boxSelectionEnabled={true}
        autoungrabify={false} // allow drag
        minZoom={0.1}
        maxZoom={3}
        wheelSensitivity={0.1}
      />
      {/* Floating toolbar */}
      {isToolbarVisible && (
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
          minWidth: '90px', // reduced min width
          maxWidth: '140px', // set max width
          maxHeight: '70vh', // limit height for scroll
          overflowY: 'auto', // enable vertical scroll
        }}>
          {/* <button onClick={handleAddNode}>Add Node</button> */}
          {/* <button onClick={handleRemoveNode} disabled={!selected || selected.type !== 'node'}>Remove Node</button>
          <button onClick={handleStartEdge} disabled={!selected || selected.type !== 'node'}>
            {edgeCreation.length === 1 ? 'Select Target' : 'Add Edge'}
          </button>
          <button onClick={handleRemoveEdge} disabled={!selected || selected.type !== 'edge'}>Remove Edge</button> */}
          <hr />
          <div className="layout-section">
            <div className="layout-section-title">Layouts:</div>
            <button className="layout-button" onClick={() => applyLayout('cose')}>Force-Directed</button>
            <button className="layout-button" onClick={() => applyLayout('breadthfirst')}>Tree</button>
            <button className="layout-button" onClick={() => applyLayout('circle')}>Circle</button>
            <button className="layout-button" onClick={() => applyLayout('grid')}>Grid</button>
            <button className="layout-button" onClick={() => applyLayout('random')}>Random</button>
          </div>
          <hr />
          <button onClick={handleResetLayout}>Reset Layout</button>
          <button onClick={fitToView}>Fit to View</button>
          <button onClick={handleSaveGraph}>Save Graph</button>
          <hr />
          <div className={`path-indicator ${isUsingDefaultPath ? 'default' : 'custom'}`}>
            {isUsingDefaultPath ? '📖 Default Path' : '⚡ Custom Path'}
            <br />
            <small>
              {pathNodeIds.length > 0 && typeof pathNodeIds[0] === 'string' && pathNodeIds[0].length === 2 
                ? `${pathRef.current.length} elements (nodes + edges)` 
                : `${pathNodeIds.length} nodes`}
            </small>
          </div>
          <button onClick={() => {
            if (isUsingDefaultPath) {
              // Hide default path
              setPathNodeIds([]);
              setIsUsingDefaultPath(false);
              resetAnimation();
            } else {
              // Show default path with smooth transition
              const defaultPath = getDefaultPath(selectedConcept, selectedExample);
              if (defaultPath.length > 0) {
                setIsUsingDefaultPath(true);
                smoothPathTransition(defaultPath);
              }
            }
          }}>
            {isUsingDefaultPath ? 'Hide Path' : 'Show Default Path'}
          </button>
          <hr />
          <button onClick={previousNode} disabled={isRunning || indexRef.current === 0}>&larr;</button>
          <button onClick={startAnimation} disabled={isRunning}>▶️ Start</button>
          <button onClick={stopAnimation} disabled={!isRunning}>⏸️ Stop</button>
          <button onClick={resetAnimation}>🔁 Reset</button>
          <button onClick={nextNode} disabled={isRunning || indexRef.current === pathRef.current.length}>&rarr;</button>
          <hr />
          <div style={{ fontSize: '11px', textAlign: 'center', marginBottom: '4px' }}>
            Animation Speed
          </div>
          <div style={{ fontSize: '10px', textAlign: 'center', marginBottom: '6px', padding: '4px', background: '#e9ecef', borderRadius: '3px' }}>
            Current: {currentSpeed / 1000}s
          </div>
          <button onClick={() => {
            if (isRunning) {
              // Stop current animation and restart with faster speed
              setIsRunning(false);
              setTimeout(() => {
                setCurrentSpeed(3000);
                startAnimationWithSpeed(3000); // 3 seconds total
              }, 100);
            } else {
              setCurrentSpeed(3000);
            }
          }} style={{ fontSize: '10px', padding: '3px 6px' }}>
            Fast (3s)
          </button>
          <button onClick={() => {
            if (isRunning) {
              // Stop current animation and restart with normal speed
              setIsRunning(false);
              setTimeout(() => {
                setCurrentSpeed(5000);
                startAnimationWithSpeed(5000); // 5 seconds total
              }, 100);
            } else {
              setCurrentSpeed(5000);
            }
          }} style={{ fontSize: '10px', padding: '3px 6px' }}>
            Normal (5s)
          </button>
          <button onClick={() => {
            if (isRunning) {
              // Stop current animation and restart with slower speed
              setIsRunning(false);
              setTimeout(() => {
                setCurrentSpeed(8000);
                startAnimationWithSpeed(8000); // 8 seconds total
              }, 100);
            } else {
              setCurrentSpeed(8000);
            }
          }} style={{ fontSize: '10px', padding: '3px 6px' }}>
            Slow (8s)
          </button>
        </div>
      )}
      
      {/* Toolbar Toggle Button */}
      <button 
        onClick={() => setIsToolbarVisible(!isToolbarVisible)}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #ccc',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        title={isToolbarVisible ? 'Hide Toolbar' : 'Show Toolbar'}
      >
        {isToolbarVisible ? '👁️' : '👁️‍🗨️'}
      </button>
    </div>
  );
}