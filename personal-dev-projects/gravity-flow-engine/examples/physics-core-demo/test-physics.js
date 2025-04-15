/**
 * Test script for the Gravity Flow Engine physics core
 * 
 * This script creates a simple pattern network and runs the physics
 * simulation for multiple steps, logging the coordinates at different stages.
 */

const PhysicsEngine = require('./physics-engine');
const fs = require('fs');

// Test pattern data
const patternData = {
  nodes: [
    // Structural patterns
    { id: "fractal-self-similarity", label: "Fractal Self-Similarity", category: "structural", 
      physicalProperties: { mass: 5, charge: -150, friction: 0.2, radius: 15 } },
    { id: "network-structure", label: "Network Structure", category: "structural", 
      physicalProperties: { mass: 8, charge: -150, friction: 0.2, radius: 20 } },
    { id: "hierarchical-organization", label: "Hierarchical Organization", category: "structural", 
      physicalProperties: { mass: 6, charge: -150, friction: 0.2, radius: 18 } },
    
    // Process patterns
    { id: "emergent-behavior", label: "Emergent Behavior", category: "process", 
      physicalProperties: { mass: 4, charge: -120, friction: 0.3, radius: 14 } },
    { id: "feedback-loops", label: "Feedback Loops", category: "process", 
      physicalProperties: { mass: 5, charge: -130, friction: 0.3, radius: 15 } },
    { id: "cyclical-patterns", label: "Cyclical Patterns", category: "process", 
      physicalProperties: { mass: 4, charge: -120, friction: 0.3, radius: 14 } },
    
    // Relationship patterns
    { id: "resource-distribution", label: "Resource Distribution", category: "relationship", 
      physicalProperties: { mass: 3, charge: -100, friction: 0.4, radius: 12 } },
    { id: "symbiosis-mutualism", label: "Symbiosis & Mutualism", category: "relationship", 
      physicalProperties: { mass: 3, charge: -100, friction: 0.4, radius: 12 } }
  ],
  links: [
    // Structural pattern relationships
    { source: "fractal-self-similarity", target: "hierarchical-organization", 
      physicalProperties: { stiffness: 0.3, length: 100, elasticity: 0.5 } },
    { source: "fractal-self-similarity", target: "network-structure", 
      physicalProperties: { stiffness: 0.3, length: 100, elasticity: 0.5 } },
    { source: "network-structure", target: "hierarchical-organization", 
      physicalProperties: { stiffness: 0.3, length: 100, elasticity: 0.5 } },
    
    // Process pattern relationships
    { source: "emergent-behavior", target: "feedback-loops", 
      physicalProperties: { stiffness: 0.4, length: 100, elasticity: 0.5 } },
    { source: "feedback-loops", target: "cyclical-patterns", 
      physicalProperties: { stiffness: 0.5, length: 80, elasticity: 0.5 } },
    
    // Relationship pattern relationships
    { source: "resource-distribution", target: "symbiosis-mutualism", 
      physicalProperties: { stiffness: 0.3, length: 100, elasticity: 0.5 } },
    
    // Cross-category relationships
    { source: "network-structure", target: "resource-distribution", 
      physicalProperties: { stiffness: 0.2, length: 150, elasticity: 0.5 } },
    { source: "hierarchical-organization", target: "emergent-behavior", 
      physicalProperties: { stiffness: 0.2, length: 150, elasticity: 0.5 } },
    { source: "feedback-loops", target: "symbiosis-mutualism", 
      physicalProperties: { stiffness: 0.2, length: 150, elasticity: 0.5 } }
  ]
};

// Canvas size
const width = 1000;
const height = 1000;

// Create physics engine
const engine = new PhysicsEngine(patternData.nodes, patternData.links);
engine.initializeStandardForces(width, height);

// Add a custom force to pull patterns toward their category groups
engine.addForce("categoryGroupForce", (alpha) => {
  // Group nodes by pattern category
  const categoryGroups = {
    structural: { x: width * 0.25, y: height * 0.25 },
    process: { x: width * 0.75, y: height * 0.25 },
    relationship: { x: width * 0.5, y: height * 0.75 }
  };
  
  engine.nodes.forEach(node => {
    const target = categoryGroups[node.category];
    if (target) {
      node.vx += (target.x - node.x) * 0.01 * alpha;
      node.vy += (target.y - node.y) * 0.01 * alpha;
    }
  });
});

// Run simulation and log results
console.log("\n=== Gravity Flow Engine Physics Test ===\n");

// Log initial state
console.log("Initial state:");
const initialState = engine.getState();
logState(initialState, "initial");

// Run simulation for 10 steps
console.log("\nRunning simulation for 10 steps...");
engine.runSimulation(10);
const state10 = engine.getState();
logState(state10, "step10");

// Run simulation for 50 more steps
console.log("\nRunning simulation for 50 more steps...");
engine.runSimulation(50);
const state60 = engine.getState();
logState(state60, "step60");

// Run simulation for 100 more steps
console.log("\nRunning simulation for 100 more steps...");
engine.runSimulation(100);
const state160 = engine.getState();
logState(state160, "step160");

// Run until stabilized
console.log("\nRunning until stabilized...");
const result = engine.runSimulation(1000);
console.log(`Simulation ran for ${result.completedSteps} more steps until alpha = ${result.alpha.toFixed(6)}`);
const finalState = engine.getState();
logState(finalState, "final");

// Save all states to a JSON file for further analysis
const allStates = {
  initial: initialState,
  step10: state10,
  step60: state60,
  step160: state160,
  final: finalState
};

fs.writeFileSync('simulation-results.json', JSON.stringify(allStates, null, 2));
console.log("\nSimulation results saved to simulation-results.json");

// Helper function to log state in a readable format
function logState(state, label) {
  console.log(`State at ${label} (tick ${state.tickCount}, alpha: ${state.alpha.toFixed(6)}):`);
  
  // Log node positions
  console.log("Node positions (x, y):");
  state.nodes.forEach(node => {
    console.log(`  ${node.id.padEnd(25)}: (${node.x.toFixed(2)}, ${node.y.toFixed(2)}) velocity: (${node.vx.toFixed(2)}, ${node.vy.toFixed(2)})`);
  });
}

// Calculate and log some metrics about the simulation
function calculateMetrics(state) {
  // Average distance between nodes
  let totalDistance = 0;
  let count = 0;
  
  for (let i = 0; i < state.nodes.length; i++) {
    for (let j = i + 1; j < state.nodes.length; j++) {
      const node1 = state.nodes[i];
      const node2 = state.nodes[j];
      const dx = node2.x - node1.x;
      const dy = node2.y - node1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      totalDistance += distance;
      count++;
    }
  }
  
  const avgDistance = totalDistance / count;
  console.log(`\nMetrics:`);
  console.log(`  Average distance between nodes: ${avgDistance.toFixed(2)}`);
  
  // Check if categories are clustered
  const categoryPositions = {};
  state.nodes.forEach(node => {
    if (!categoryPositions[node.category]) {
      categoryPositions[node.category] = { nodes: [], x: 0, y: 0 };
    }
    
    categoryPositions[node.category].nodes.push(node);
    categoryPositions[node.category].x += node.x;
    categoryPositions[node.category].y += node.y;
  });
  
  // Calculate centroid for each category
  Object.keys(categoryPositions).forEach(category => {
    const group = categoryPositions[category];
    group.x /= group.nodes.length;
    group.y /= group.nodes.length;
    
    // Calculate average distance from centroid
    let totalDistFromCentroid = 0;
    group.nodes.forEach(node => {
      const dx = node.x - group.x;
      const dy = node.y - group.y;
      totalDistFromCentroid += Math.sqrt(dx * dx + dy * dy);
    });
    
    const avgDistFromCentroid = totalDistFromCentroid / group.nodes.length;
    console.log(`  Category "${category}" centroid: (${group.x.toFixed(2)}, ${group.y.toFixed(2)}), avg distance: ${avgDistFromCentroid.toFixed(2)}`);
  });
}

// Calculate metrics for the final state
calculateMetrics(finalState);

console.log("\n=== Test Complete ==="); 