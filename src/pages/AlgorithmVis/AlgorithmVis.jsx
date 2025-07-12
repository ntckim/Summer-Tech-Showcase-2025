import CodeEditor from './CodeEditor';
import CustomPathGraph from './Graph';

// export default function AlgorithmVis() {
//   return (
//     <div style={{ padding: '20px', height: '100vh' }}>
//       <h1>Algorithm Visualization</h1>
      
//       <div style={{ 
//         display: 'flex', 
//         gap: '20px', 
//         height: 'calc(100vh - 100px)',
//         marginTop: '20px'
//       }}>
//         {/* Left side - Code Editor */}
//         <div style={{ 
//           flex: '1', 
//           border: '1px solid #ddd', 
//           borderRadius: '8px', 
//           padding: '20px',
//           backgroundColor: '#fafafa'
//         }}>
//           <CodeEditor />
//         </div>
        
//         {/* Right side - Placeholder for future content */}
//             <CustomPathGraph />
//           </div>
//         </div>
//   );
// }


export default function AlgorithmVis() {

  const containerStyle = {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  };

  const leftSideStyle = {
    flex: 1,
    minWidth: '300px',
    borderRight: '1px solid #ccc',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    overflowY: 'auto',
  };

  const rightSideStyle = {
    flex: 2,
    minWidth: 0,
    padding: '1rem',
    backgroundColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <div style={containerStyle}>
      <div style={leftSideStyle}>
        <CodeEditor />
      </div>
      <div style={rightSideStyle}>
        <CustomPathGraph />
      </div>
    </div>
  );

}