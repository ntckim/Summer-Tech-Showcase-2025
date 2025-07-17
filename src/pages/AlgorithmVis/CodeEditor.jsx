import { useEffect, useRef, useState } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { lineNumbers } from '@codemirror/view';
import { bracketMatching } from '@codemirror/language';
import { closeBrackets } from '@codemirror/autocomplete';
import { loadPyodide } from 'pyodide';

export default function CodeEditor({
  graphOrdering,
  setSharedData
}) {
  const editorRef = useRef(null);
  const [output, setOutput] = useState('');
  const [editorView, setEditorView] = useState(null);
  const [pyodide, setPyodide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Pyodide
  useEffect(() => {
    const initPyodide = async () => {
      try {
        setOutput('Loading Python interpreter...');
        const pyodideInstance = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/"
        });
        setPyodide(pyodideInstance);
        setOutput('Python interpreter loaded successfully! Ready to run code.');
        setIsLoading(false);
      } catch (error) {
        setOutput(`Error loading Python interpreter: ${error.message}`);
        setIsLoading(false);
      }
    };

    initPyodide();
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      const state = EditorState.create({
        doc: `# Welcome to the Algorithm Visualization Code Editor!
# Start coding your algorithms here...

def dfs():
  return []
    `,
        extensions: [
          lineNumbers(),
          keymap.of([defaultKeymap, indentWithTab]),
          bracketMatching(),
          closeBrackets(),
          python(),
          oneDark,
          EditorView.lineWrapping,
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
          console.log(result);
          const jsResult = result.toJs ? result.toJs() : result;
          console.log("Converted Result:", jsResult);
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
      <h3>Python Code Editor</h3>
      {isLoading && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '4px', 
          padding: '10px', 
          marginBottom: '10px' 
        }}>
          ⏳ Loading Python interpreter... This may take a moment on first load.
        </div>
      )}
      
      <div 
        ref={editorRef} 
        style={{ 
          border: '1px solid #ccc', 
          borderRadius: '4px',
          flex: '1',
          minHeight: '300px',
          overflow: 'hidden',
          marginBottom: '10px'
        }}
      />
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runCode}
          disabled={isLoading || !pyodide}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: isLoading || !pyodide ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading || !pyodide ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {isLoading ? 'Loading...' : 'Run Code'}
        </button>
        <button 
          onClick={clearOutput}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Clear Output
        </button>
      </div>

      <div style={{ flex: '1', minHeight: '200px' }}>
        <h4>Output:</h4>
        <div 
          style={{
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '15px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            height: '100%',
            overflow: 'auto'
          }}
        >
          {output || 'No output yet. Click "Run Code" to execute your Python code.'}
        </div>
      </div>
    </div>
  );
} 