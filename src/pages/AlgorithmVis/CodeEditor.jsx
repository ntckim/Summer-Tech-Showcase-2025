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
        doc: `# DFS Iterative Example (returns edge traversals)
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

def dfs_iterative_edges(graph, start):
    visited = set()
    edge_path = []
    stack = [(start, None)]  # (current_node, parent_node)
    while stack:
        current, parent = stack.pop()
        if current not in visited:
            visited.add(current)
            if parent is not None:
                edge_path.append(f"{parent}{current}")
            # Add all unvisited neighbors to stack
            for neighbor in reversed(graph.get(current, [])):
                if neighbor not in visited:
                    stack.append((neighbor, current))
    return edge_path

# Change the starting node below to see different DFS paths!
dfs_iterative_edges(graph, 0)
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
    try {
      if (!pyodide || !editorView) {
        setOutput('Python interpreter not ready yet. Please wait...');
        return;
      }

      // First, reset the graph state
      setRunGraph(false);

      const code = editorView.state.doc.toString();
      setOutput('Running code...\n');

      // Validate that we have some code to run
      if (!code.trim()) {
        setOutput('No code to execute. Please enter some Python code.');
        return;
      }
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
        // Look for any function that ends with "_edges" pattern
        const functionCallPattern = /(\w+_edges)\s*\(\s*graph\s*,\s*(\d+)\s*\)/;
        const functionMatch = lastLine.match(functionCallPattern);
        
        if (lastLine && !lastLine.startsWith('#') && functionMatch) {
          const functionName = functionMatch[1];
          const startNode = parseInt(functionMatch[2]);
          
          console.log("Executing:", lastLine);
          
          // Check if the function exists in the Python environment
          if (pyodide.globals.has(functionName)) {
            // Execute the last line to get the return value
            const result = pyodide.runPython(lastLine);
            const jsResult = result.toJs ? result.toJs() : result;
            returnValues.dfs = jsResult;
            returnValues.startNode = startNode;
            
            console.log("Algorithm result:", jsResult);
            console.log("Start node:", startNode);
            
            capturedOutput += `\nExecuting: ${lastLine}\n`;
            capturedOutput += `Algorithm traversal result: ${JSON.stringify(jsResult)}\n`;
            capturedOutput += `Starting from node: ${startNode}\n`;
          } else {
            capturedOutput += `\nError: Function '${functionName}' is not defined.\n`;
          }
        } else {
          // Try to find any function that might be defined and callable
          const allGlobals = pyodide.globals.toJs();
          const availableFunctions = Object.keys(allGlobals).filter(key => 
            typeof allGlobals[key] === 'function' && 
            (key.includes('dfs') || key.includes('bfs') || key.includes('_edges'))
          );
          
          if (availableFunctions.length > 0) {
            // Use the first available algorithm function
            const functionName = availableFunctions[0];
            try {
              const result = pyodide.runPython(`${functionName}(graph, 0)`);
              const jsResult = result.toJs ? result.toJs() : result;
              returnValues.dfs = jsResult;
              returnValues.startNode = 0;
              
              capturedOutput += `\nNo function call found in last line, using available function: ${functionName}(graph, 0)\n`;
              capturedOutput += `Algorithm traversal result: ${JSON.stringify(jsResult)}\n`;
            } catch (callError) {
              capturedOutput += `\nError calling ${functionName}: ${callError.message}\n`;
            }
          } else {
            capturedOutput += `\nNo recognizable algorithm function found to execute.\n`;
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
      console.error('Code execution error:', error);
      setOutput(`Error executing code: ${error.message}\n\nPlease check your Python syntax and try again.`);
      
      // Reset any graph state that might be in an inconsistent state
      setSharedData(null);
      setRunGraph(false);
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