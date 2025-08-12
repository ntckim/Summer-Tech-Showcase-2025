// Graph examples for different algorithms
export const graphExamples = {
  // DFS Examples
  dfs: {
    simple: {
      name: "Simple DFS Graph",
      description: "Basic graph for DFS demonstration",
      nodes: [
        { data: { id: '0' } },
        { data: { id: '1' } },
        { data: { id: '2' } },
        { data: { id: '3' } },
        { data: { id: '4' } },
        { data: { id: '5' } },
        { data: { id: '6' } },
        { data: { id: '7' } }
      ],
      edges: [
        { data: { id: '01', source: '0', target: '1' } },
        { data: { id: '02', source: '0', target: '2' } },
        { data: { id: '13', source: '1', target: '3' } },
        { data: { id: '14', source: '1', target: '4' } },
        { data: { id: '25', source: '2', target: '5' } },
        { data: { id: '26', source: '2', target: '6' } },
        { data: { id: '47', source: '4', target: '7' } }
      ],
      startNode: '0',
      // Show the actual path taken (edges) instead of complete traversal
      defaultPath: ['01', '13', '14', '47', '02', '25', '26']
    },
    complex: {
      name: "Complex DFS Graph",
      description: "More complex graph with cycles",
      nodes: [
        { data: { id: 'A' } },
        { data: { id: 'B' } },
        { data: { id: 'C' } },
        { data: { id: 'D' } },
        { data: { id: 'E' } },
        { data: { id: 'F' } },
        { data: { id: 'G' } }
      ],
      edges: [
        { data: { id: 'AB', source: 'A', target: 'B' } },
        { data: { id: 'AC', source: 'A', target: 'C' } },
        { data: { id: 'BD', source: 'B', target: 'D' } },
        { data: { id: 'BE', source: 'B', target: 'E' } },
        { data: { id: 'CF', source: 'C', target: 'F' } },
        { data: { id: 'CG', source: 'C', target: 'G' } },
        { data: { id: 'DE', source: 'D', target: 'E' } },
        { data: { id: 'FG', source: 'F', target: 'G' } }
      ],
      startNode: 'A',
      // Show the actual path taken (edges) instead of complete traversal
      defaultPath: ['AB', 'BD', 'BE', 'AC', 'CF', 'FG']
    }
  },

  // BFS Examples
  bfs: {
    simple: {
      name: "Simple BFS Graph",
      description: "Basic graph for BFS demonstration",
      nodes: [
        { data: { id: '0' } },
        { data: { id: '1' } },
        { data: { id: '2' } },
        { data: { id: '3' } },
        { data: { id: '4' } },
        { data: { id: '5' } }
      ],
      edges: [
        { data: { id: '01', source: '0', target: '1' } },
        { data: { id: '02', source: '0', target: '2' } },
        { data: { id: '13', source: '1', target: '3' } },
        { data: { id: '14', source: '1', target: '4' } },
        { data: { id: '25', source: '2', target: '5' } }
      ],
      startNode: '0',
      // Show the actual path taken (edges) instead of complete traversal
      defaultPath: ['01', '02', '13', '14', '25']
    }
  },

  // Dijkstra Examples
  dijkstra: {
    weighted: {
      name: "Weighted Graph for Dijkstra",
      description: "Graph with weighted edges for shortest path",
      nodes: [
        { data: { id: 'A' } },
        { data: { id: 'B' } },
        { data: { id: 'C' } },
        { data: { id: 'D' } },
        { data: { id: 'E' } }
      ],
      edges: [
        { data: { id: 'AB', source: 'A', target: 'B', weight: 4 } },
        { data: { id: 'AC', source: 'A', target: 'C', weight: 2 } },
        { data: { id: 'BC', source: 'B', target: 'C', weight: 1 } },
        { data: { id: 'BD', source: 'B', target: 'D', weight: 5 } },
        { data: { id: 'CD', source: 'C', target: 'D', weight: 8 } },
        { data: { id: 'CE', source: 'C', target: 'E', weight: 10 } },
        { data: { id: 'DE', source: 'D', target: 'E', weight: 2 } }
      ],
      startNode: 'A',
      // Show the shortest path (edges) instead of complete traversal
      defaultPath: ['AC', 'BC', 'BD', 'DE']
    }
  },

  // MST Examples
  mst: {
    undirected: {
      name: "Undirected Graph for MST",
      description: "Undirected graph for Kruskal's and Prim's algorithms",
      nodes: [
        { data: { id: 'A' } },
        { data: { id: 'B' } },
        { data: { id: 'C' } },
        { data: { id: 'D' } },
        { data: { id: 'E' } }
      ],
      edges: [
        { data: { id: 'AB', source: 'A', target: 'B', weight: 4 } },
        { data: { id: 'AC', source: 'A', target: 'C', weight: 2 } },
        { data: { id: 'BC', source: 'B', target: 'C', weight: 1 } },
        { data: { id: 'BD', source: 'B', target: 'D', weight: 5 } },
        { data: { id: 'CD', source: 'C', target: 'D', weight: 8 } },
        { data: { id: 'CE', source: 'C', target: 'E', weight: 10 } },
        { data: { id: 'DE', source: 'D', target: 'E', weight: 2 } }
      ],
      startNode: 'A',
      // Show the MST edges instead of complete traversal
      defaultPath: ['BC', 'AC', 'DE', 'BD']
    }
  },

  // Topological Sort Examples
  topological: {
    dag: {
      name: "Directed Acyclic Graph",
      description: "DAG for topological sorting",
      nodes: [
        { data: { id: 'A' } },
        { data: { id: 'B' } },
        { data: { id: 'C' } },
        { data: { id: 'D' } },
        { data: { id: 'E' } },
        { data: { id: 'F' } }
      ],
      edges: [
        { data: { id: 'AB', source: 'A', target: 'B' } },
        { data: { id: 'AC', source: 'A', target: 'C' } },
        { data: { id: 'BD', source: 'B', target: 'D' } },
        { data: { id: 'CD', source: 'C', target: 'D' } },
        { data: { id: 'DE', source: 'D', target: 'E' } },
        { data: { id: 'DF', source: 'D', target: 'F' } }
      ],
      startNode: 'A',
      // Show the topological order edges instead of complete traversal
      defaultPath: ['AB', 'AC', 'BD', 'CD', 'DE', 'DF']
    }
  }
};

// Helper function to get examples for a specific algorithm
export const getExamplesForAlgorithm = (algorithmId) => {
  return graphExamples[algorithmId] || {};
};

// Helper function to get all available algorithms
export const getAvailableAlgorithms = () => {
  return Object.keys(graphExamples);
};

// Helper function to get default path for a specific example
export const getDefaultPath = (algorithmId, exampleId) => {
  const examples = graphExamples[algorithmId];
  if (examples && examples[exampleId]) {
    return examples[exampleId].defaultPath || [];
  }
  return [];
}; 