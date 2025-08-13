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
  isPyodideLoading
}) {
  const editorRef = useRef(null);
  const [output, setOutput] = useState('');
  const [editorView, setEditorView] = useState(null);

  setRunGraph(false)

  console.log(runGraph)

  // Remove the Pyodide initialization useEffect since it's now handled by the parent

  // Update output when Pyodide is ready
  useEffect(() => {
    if (pyodide && !isPyodideLoading) {
      setOutput('Python interpreter ready! You can now run your code.');
    } else if (isPyodideLoading) {
      setOutput('Loading Python interpreter... Please wait.');
    }
  }, [pyodide, isPyodideLoading]);

  useEffect(() => {
    if (editorRef.current) {
      const state = EditorState.create({
        doc: `# Depth-First Search (DFS) Implementation
# This code demonstrates both recursive and iterative DFS approaches

# Sample graph representation using adjacency list
# Each node maps to a list of its neighbors
graph = {
    0: [1, 2],
    1: [0, 3, 4],
    2: [0, 5, 6],
    3: [1],
    4: [1, 7],
    5: [2],
    6: [2],
    7: [4]
}

def dfs_recursive(graph, start, visited=None, path=None):
    """
    Recursive implementation of Depth-First Search
    
    Args:
        graph: Dictionary representing the graph (adjacency list)
        start: Starting node
        visited: Set of visited nodes (for recursion)
        path: List to store the traversal path (for recursion)
    
    Returns:
        List representing the DFS traversal order
    """
    if visited is None:
        visited = set()
    if path is None:
        path = []
    
    # Mark current node as visited and add to path
    visited.add(start)
    path.append(start)
    
    print(f"Visiting node {start}")
    
    # Explore all neighbors
    for neighbor in graph.get(start, []):
        if neighbor not in visited:
            dfs_recursive(graph, neighbor, visited, path)
    
    return path

def dfs_iterative(graph, start):
    """
    Iterative implementation of Depth-First Search using a stack
    
    Args:
        graph: Dictionary representing the graph (adjacency list)
        start: Starting node
    
    Returns:
        List representing the DFS traversal order
    """
    visited = set()
    path = []
    stack = [start]
    
    while stack:
        # Pop the top node from stack
        current = stack.pop()
        
        if current not in visited:
            # Mark as visited and add to path
            visited.add(current)
            path.append(current)
            
            print(f"Visiting node {current}")
            
            # Add all unvisited neighbors to stack
            # We reverse the neighbors to maintain the same order as recursive version
            for neighbor in reversed(graph.get(current, [])):
                if neighbor not in visited:
                    stack.append(neighbor)
    
    return path

def dfs():
    """
    Main function to demonstrate DFS on our sample graph
    """
    print("=== Depth-First Search Demo ===\\n")
    
    print("Sample Graph (Adjacency List):")
    for node, neighbors in graph.items():
        print(f"Node {node}: {neighbors}")
    
    print("\\n=== Recursive DFS ===")
    recursive_path = dfs_recursive(graph, 0)
    print(f"Recursive DFS path: {recursive_path}")
    
    print("\\n=== Iterative DFS ===")
    iterative_path = dfs_iterative(graph, 0)
    print(f"Iterative DFS path: {iterative_path}")
    
    print("\\n=== Comparison ===")
    print(f"Both implementations should give the same result: {recursive_path == iterative_path}")
    
    # Return the path for visualization
    return recursive_path

# Run the demo
if __name__ == "__main__":
    dfs()
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

      // Run the Python code
      await pyodide.runPythonAsync(code);
      
      let returnValues = {};

      try {
        if (pyodide.globals.has('dfs')) {
          const result = pyodide.runPython('dfs()');
          //console.log(result);
          const jsResult = result.toJs ? result.toJs() : result;
          //console.log("Converted Result:", jsResult);
          returnValues.dfs = jsResult;
          capturedOutput += `\nReturn value from dfs(): ${JSON.stringify(result)}\n`;
        }
      } catch (funcError) {
        capturedOutput += `\nFunction call error: ${funcError.message}\n`;
      }

      // Restore original print function
      pyodide.globals.set('print', originalStdout);

      setSharedData({
        output: returnValues,
      });

      setRunGraph(true)
      
      setOutput(capturedOutput || 'Code executed successfully! (No output)');
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const clearOutput = () => {
    setOutput('');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="editor-header">
        <h3>Python Code Editor</h3>
        <div className="editor-controls">
          <button 
            onClick={runCode}
            disabled={isPyodideLoading || !pyodide}
            className="run-button"
          >
            {isPyodideLoading ? 'Loading...' : 'Run Code'}
          </button>
          <button 
            onClick={() => setIsOutputCollapsed(!isOutputCollapsed)}
            className="toggle-output-button"
          >
            {isOutputCollapsed ? 'Show Output' : 'Hide Output'}
          </button>
        </div>
      </div>

      {isPyodideLoading && (
        <div className="loading-notice">
          ⏳ Loading Python interpreter... This may take a moment on first load.
        </div>
      )}
      
      <div 
        ref={editorRef} 
        className="code-editor-container"
        style={{ 
          flex: isOutputCollapsed ? '1' : '1',
          minHeight: isOutputCollapsed ? '400px' : '300px',
        }}
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
    </div>
  );
} 