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
        doc: `# DFS Iterative Example (returns edge traversals)
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

def dfs_iterative_edges(graph, start):
    visited = set()
    edge_path = []
    stack = [(start, None)]  # (current_node, parent_node)
    while stack:
        current, parent = stack.pop()
        if current not in visited:
            visited.add(current)
            if parent is not None:
                edge_path.append(f"\${parent}\${current}")
            # Add all unvisited neighbors to stack
            for neighbor in reversed(graph.get(current, [])):
                if neighbor not in visited:
                    stack.append((neighbor, current))
    return edge_path

# Run DFS from node 0
print(dfs_iterative_edges(graph, 0))
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
        if (pyodide.globals.has('dfs_iterative_edges')) {
          const result = pyodide.runPython('dfs_iterative_edges(graph, 1)');
          const jsResult = result.toJs ? result.toJs() : result;
          returnValues.dfs = jsResult;
          capturedOutput += `\nReturn value from dfs_iterative_edges(): ${JSON.stringify(result)}\n`;
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
    </div>
  );
}