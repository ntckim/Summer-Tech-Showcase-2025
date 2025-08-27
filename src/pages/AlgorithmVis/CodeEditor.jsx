import { useEffect, useRef, useState } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { lineNumbers } from '@codemirror/view';
import { bracketMatching } from '@codemirror/language';
import { closeBrackets } from '@codemirror/autocomplete';

export default function CodeEditor({
  graphOrdering,
  setSharedData,
  runGraph,
  setRunGraph,
  isOutputCollapsed,
  setIsOutputCollapsed,
  pyodide,
  isPyodideLoading,
  pyodideError
}) {
  const editorRef = useRef(null);
  const [output, setOutput] = useState('');
  const [editorView, setEditorView] = useState(null);

  useEffect(() => {
    setRunGraph(false);
  }, [setRunGraph]);

  // Update output when Pyodide is ready
  useEffect(() => {
    console.log('Pyodide status:', { pyodide: !!pyodide, isPyodideLoading, pyodideError });
    if (pyodide && !isPyodideLoading) {
      setOutput('Python interpreter ready! You can now run your code.');
    } else if (isPyodideLoading) {
      setOutput('Loading Python interpreter... Please wait.');
    } else if (pyodideError) {
      setOutput(`Failed to load Python interpreter: ${pyodideError}\n\nPlease refresh the page to try again.`);
    }
  }, [pyodide, isPyodideLoading, pyodideError]);

  useEffect(() => {
    if (editorRef.current) {
      const state = EditorState.create({
        doc: `# Algorithm Visualizer - DFS and BFS with step-by-step execution tracking
from collections import deque

graph = {
    0: [1, 2],
    1: [3, 4],
    2: [5, 6],
    3: [],
    4: [7],
    5: [],
    6: [],
    7: []
}

def dfs_iterative_steps(graph, start):
    visited = set()
    edge_path = []
    execution_steps = []
    stack = [(start, None)]  # (current_node, parent_node)
    step = 0
    
    while stack:
        step += 1
        current, parent = stack.pop()
        
        # Record the step before processing
        step_info = {
            'step': step,
            'action': 'pop',
            'current_node': current,
            'parent_node': parent,
            'stack_before': list(stack),  # Stack state before processing
            'visited_before': list(visited),
            'is_visited': current in visited,
            'algorithm': 'DFS'
        }
        
        if current not in visited:
            visited.add(current)
            if parent is not None:
                edge_path.append(f"{parent}{current}")
            
            # Add neighbors to stack (in reverse order for correct DFS)
            neighbors_added = []
            for neighbor in reversed(graph.get(current, [])):
                if neighbor not in visited:
                    stack.append((neighbor, current))
                    neighbors_added.append(neighbor)
            
            step_info.update({
                'action': 'visit',
                'neighbors_added': neighbors_added,
                'stack_after': list(stack),
                'visited_after': list(visited),
                'edge_added': f"{parent}{current}" if parent is not None else None
            })
        else:
            step_info.update({
                'action': 'skip_visited',
                'stack_after': list(stack),
                'visited_after': list(visited)
            })
        
        execution_steps.append(step_info)
    
    return {
        'edge_path': edge_path,
        'execution_steps': execution_steps,
        'final_visited': list(visited)
    }

def bfs_iterative_steps(graph, start):
    visited = set()
    edge_path = []
    execution_steps = []
    queue = deque([(start, None)])  # (current_node, parent_node)
    step = 0
    
    while queue:
        step += 1
        current, parent = queue.popleft()
        
        # Record the step before processing
        step_info = {
            'step': step,
            'action': 'dequeue',
            'current_node': current,
            'parent_node': parent,
            'queue_before': list(queue),  # Queue state before processing
            'visited_before': list(visited),
            'is_visited': current in visited,
            'algorithm': 'BFS'
        }
        
        if current not in visited:
            visited.add(current)
            if parent is not None:
                edge_path.append(f"{parent}{current}")
            
            # Add neighbors to queue (in order for correct BFS)
            neighbors_added = []
            for neighbor in graph.get(current, []):
                if neighbor not in visited:
                    queue.append((neighbor, current))
                    neighbors_added.append(neighbor)
            
            step_info.update({
                'action': 'visit',
                'neighbors_added': neighbors_added,
                'queue_after': list(queue),
                'visited_after': list(visited),
                'edge_added': f"{parent}{current}" if parent is not None else None
            })
        else:
            step_info.update({
                'action': 'skip_visited',
                'queue_after': list(queue),
                'visited_after': list(visited)
            })
        
        execution_steps.append(step_info)
    
    return {
        'edge_path': edge_path,
        'execution_steps': execution_steps,
        'final_visited': list(visited)
    }

# Try either algorithm! Change the starting node to see different paths:
# dfs_iterative_steps(graph, 0)
bfs_iterative_steps(graph, 0)
`,
        extensions: [
          lineNumbers(),
          keymap.of([defaultKeymap, indentWithTab]),
          bracketMatching(),
          closeBrackets(),
          python(),
          oneDark,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            // Ensure proper scrolling behavior
            if (update.docChanged) {
              // Auto-scroll to keep cursor visible if needed
              const view = update.view;
              const cursorPos = view.state.selection.main.head;
              const coords = view.coordsAtPos(cursorPos);
              if (coords) {
                const editorRect = view.dom.getBoundingClientRect();
                if (coords.top < editorRect.top || coords.bottom > editorRect.bottom) {
                  view.requestMeasure();
                }
              }
            }
          }),
        ],
      });

      const view = new EditorView({
        state,
        parent: editorRef.current,
      });

      setEditorView(view);

      return () => {
        view.destroy();
      };
    }
  }, []);

  const runCode = async () => {
    if (!pyodide || !editorView) {
      setOutput('Python interpreter not ready yet. Please wait...');
      return;
    }

    // First, reset the graph state
    setRunGraph(false);

    const code = editorView.state.doc.toString();
    setOutput('Running code...\n');

    try {
      // Capture stdout
      let capturedOutput = '';
      const originalStdout = pyodide.globals.get('print');
      
      // Override print function to capture output
      pyodide.globals.set('print', (...args) => {
        capturedOutput += args.join(' ') + '\n';
      });

      // Run the Python code (this defines the function and variables)
      await pyodide.runPythonAsync(code);
      
      let returnValues = {};

      try {
        // Parse the last line to get the function call dynamically
        const lines = code.trim().split('\n');
        const lastLine = lines[lines.length - 1].trim();
        
        // Check if the last line is a function call we can execute
        if (lastLine && !lastLine.startsWith('#') && (lastLine.includes('dfs_iterative_steps') || lastLine.includes('bfs_iterative_steps'))) {
          console.log("Executing:", lastLine);
          
          // Execute the last line to get the return value
          const result = pyodide.runPython(lastLine);
          const jsResult = result.toJs ? result.toJs() : result;
          
          // Convert the result to a proper JavaScript object
          let algorithmResult;
          if (jsResult && typeof jsResult === 'object') {
            // Convert Python dict to JS object if needed
            if (jsResult.get) {
              algorithmResult = {
                edge_path: jsResult.get('edge_path'),
                execution_steps: jsResult.get('execution_steps'),
                final_visited: jsResult.get('final_visited')
              };
            } else {
              algorithmResult = jsResult;
            }
          } else {
            algorithmResult = jsResult;
          }
          
          returnValues.dfs = algorithmResult; // Keep this key for compatibility
          
          // Extract the starting node and algorithm type
          let startNodeMatch = lastLine.match(/(dfs|bfs)_iterative_steps\s*\(\s*graph\s*,\s*(\d+)\s*\)/);
          if (startNodeMatch) {
            returnValues.startNode = parseInt(startNodeMatch[2]);
            returnValues.algorithmType = startNodeMatch[1].toUpperCase();
          }
          
          console.log("Algorithm result:", algorithmResult);
          console.log("Start node:", returnValues.startNode);
          console.log("Algorithm type:", returnValues.algorithmType);
          
          capturedOutput += `\nExecuting: ${lastLine}\n`;
          if (algorithmResult && algorithmResult.execution_steps) {
            const algoType = returnValues.algorithmType || 'Algorithm';
            capturedOutput += `${algoType} execution completed: ${algorithmResult.execution_steps.length} steps\n`;
            capturedOutput += `Edge path: ${JSON.stringify(algorithmResult.edge_path)}\n`;
            capturedOutput += `Final visited nodes: ${JSON.stringify(algorithmResult.final_visited)}\n`;
          } else {
            capturedOutput += `Algorithm traversal result: ${JSON.stringify(algorithmResult)}\n`;
          }
          if (returnValues.startNode !== undefined) {
            capturedOutput += `Starting from node: ${returnValues.startNode}\n`;
          }
        } else {
          // Fallback to default call if no valid function call found
          let fallbackResult = null;
          let functionName = '';
          
          if (pyodide.globals.has('bfs_iterative_steps')) {
            functionName = 'bfs_iterative_steps';
            fallbackResult = pyodide.runPython('bfs_iterative_steps(graph, 0)');
          } else if (pyodide.globals.has('dfs_iterative_steps')) {
            functionName = 'dfs_iterative_steps';
            fallbackResult = pyodide.runPython('dfs_iterative_steps(graph, 0)');
          }
          
          if (fallbackResult) {
            const jsResult = fallbackResult.toJs ? fallbackResult.toJs() : fallbackResult;
            
            // Convert the result to a proper JavaScript object
            let algorithmResult;
            if (jsResult && typeof jsResult === 'object') {
              // Convert Python dict to JS object if needed
              if (jsResult.get) {
                algorithmResult = {
                  edge_path: jsResult.get('edge_path'),
                  execution_steps: jsResult.get('execution_steps'),
                  final_visited: jsResult.get('final_visited')
                };
              } else {
                algorithmResult = jsResult;
              }
            } else {
              algorithmResult = jsResult;
            }
            
            returnValues.dfs = algorithmResult;
            returnValues.startNode = 0;
            returnValues.algorithmType = functionName.includes('bfs') ? 'BFS' : 'DFS';
            
            capturedOutput += `\nNo function call found in last line, using default: ${functionName}(graph, 0)\n`;
            if (algorithmResult && algorithmResult.execution_steps) {
              capturedOutput += `${returnValues.algorithmType} execution completed: ${algorithmResult.execution_steps.length} steps\n`;
              capturedOutput += `Edge path: ${JSON.stringify(algorithmResult.edge_path)}\n`;
            } else {
              capturedOutput += `${returnValues.algorithmType} traversal result: ${JSON.stringify(algorithmResult)}\n`;
            }
          }
        }
      } catch (funcError) {
        capturedOutput += `\nFunction call error: ${funcError.message}\n`;
      }

      // Restore original print function
      pyodide.globals.set('print', originalStdout);

      // Send the results to the graph component
      setSharedData({
        output: returnValues,
        resetAnimation: true, // Flag to reset the graph animation
        timestamp: Date.now(), // Add timestamp to force updates
      });

      // Use a small delay to ensure state updates properly, then trigger the graph to run
      setTimeout(() => {
        setRunGraph(Date.now()); // Use timestamp instead of boolean
      }, 100);
      
      setOutput(capturedOutput || 'Code executed successfully! (No output)');
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const clearOutput = () => {
    setOutput('');
  };

  // Make the editor and output scrollable together
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>

      {isPyodideLoading && (
        <div className="loading-notice">
          ⏳ Loading Python interpreter... This may take a moment on first load.
        </div>
      )}
      
      <div 
        ref={editorRef} 
        className="code-editor-container"
        style={{ minHeight: '300px' }}
      />
      
      {!isOutputCollapsed && (
        <div className="output-panel">
          <div className="output-header">
            <h4>Output</h4>
            <button 
              onClick={clearOutput}
              className="clear-output-button"
            >
              Clear
            </button>
          </div>
          <div className="output-content">
            {output || 'No output yet. Click "Run Code" to execute your Python code.'}
          </div>
        </div>
      )}
      <div className="editor-header">
        <div className="editor-controls">
          <button 
            onClick={runCode}
            disabled={isPyodideLoading || !pyodide}
            className="run-button"
            title={`Pyodide: ${!!pyodide}, Loading: ${isPyodideLoading}`}
          >
            {isPyodideLoading ? 'Loading...' : 'Run Code'}
          </button>
          {pyodideError && (
            <button 
              onClick={() => window.location.reload()}
              className="retry-button"
              style={{ marginLeft: '8px', fontSize: '12px', padding: '4px 8px' }}
            >
              Retry (Refresh)
            </button>
          )}
          <button 
            onClick={() => setIsOutputCollapsed(!isOutputCollapsed)}
            className="toggle-output-button"
          >
            {isOutputCollapsed ? 'Show Output' : 'Hide Output'}
          </button>
          <button 
            onClick={() => {
              console.log('Debug info:', { 
                pyodide: !!pyodide, 
                isPyodideLoading,
                pyodideType: typeof pyodide,
                pyodideObject: pyodide 
              });
              setOutput(`Debug: Pyodide=${!!pyodide}, Loading=${isPyodideLoading}, Type=${typeof pyodide}`);
            }}
            className="debug-button"
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            Debug
          </button>
        </div>
      </div>
    </div>
  );
}