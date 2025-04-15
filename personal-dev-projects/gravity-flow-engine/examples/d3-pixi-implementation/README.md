# Gravity Flow Engine - D3 + PixiJS Implementation

A high-performance physics-based visualization system for pattern relationships using D3's force simulation and PixiJS rendering.

## 🚀 Overview

The Gravity Flow Engine transforms static pattern relationships into dynamic, interactive systems where patterns and their connections are visualized through physics-based simulations. This implementation combines:

- **D3-force** for realistic physics simulation
- **PixiJS** for high-performance WebGL rendering
- **Modular architecture** for extensibility and performance

## ✨ Features

- **Physics-Based Pattern Relationships**: Patterns interact based on physical properties derived from their characteristics
- **High-Performance Rendering**: Efficiently visualize thousands of nodes and relationships
- **Adaptive Detail Level**: Automatically adjusts rendering detail based on performance
- **Interactive Visualization**: Drag, zoom, select and explore patterns
- **Category Filtering**: Filter patterns by type or category
- **Multi-Layered Architecture**: Clean separation between physics, rendering, and data management

## 🧩 Architecture

The implementation follows a modular architecture:

```
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  Pattern Data │      │  Simulation   │      │   Rendering   │
│     Model     │◄────►│     Layer     │◄────►│     Layer     │
└───────────────┘      └───────────────┘      └───────────────┘
        ▲                      ▲                     ▲
        │                      │                     │
        └──────────────────────┼─────────────────────┘
                              │
                      ┌───────────────┐
                      │ Gravity Flow  │
                      │    Engine     │
                      └───────────────┘
```

- **Pattern Data Model**: Defines data structures for patterns and relationships
- **Simulation Layer**: Handles physics simulation using D3-force
- **Rendering Layer**: Manages visualization using PixiJS
- **Gravity Flow Engine**: Coordinates between components

## 🔧 Getting Started

### Prerequisites

- Node.js 14+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/gravity-flow-engine.git
cd gravity-flow-engine/examples/d3-pixi-implementation
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```

4. Open your browser to `http://localhost:3000`

## 💻 Usage

### Basic Usage

```javascript
// Initialize the Gravity Flow Engine
const gravityFlow = new GravityFlowEngine('container', {
  simulation: {
    chargeStrength: -100,
    linkStrength: 0.3
  },
  rendering: {
    nodeColor: 0x6baed6,
    linkColor: 0x999999
  }
});

// Load data
gravityFlow.loadData({
  patterns: [...],
  relationships: [...]
});

// Start the simulation
gravityFlow.start();
```

### Configuration Options

The engine supports various configuration options:

```javascript
const options = {
  // Simulation options
  simulation: {
    chargeStrength: -100,      // Repulsive force between nodes
    linkStrength: 0.3,         // Strength of connections
    linkDistance: 100,         // Base distance between connected nodes
    collisionRadius: 15,       // Node collision detection radius
    alpha: 0.3,                // Initial simulation activity level
    alphaDecay: 0.02,          // How quickly simulation cools down
    alphaMin: 0.001,           // Minimum alpha before simulation stops
  },
  
  // Rendering options
  rendering: {
    nodeSize: 15,              // Default node size
    linkWidth: 1.5,            // Default link width
    nodeColor: 0x6baed6,       // Default node color
    linkColor: 0x999999,       // Default link color
    backgroundColor: 0xf7f7f7, // Canvas background color
    renderLabels: true,        // Whether to render node labels
    adaptiveDetail: true,      // Adapt detail level to performance
  }
};
```

## 📊 Data Structure

The engine works with a specific data format for patterns and relationships:

```javascript
// Pattern structure
const pattern = {
  id: "pattern-1",              // Unique identifier
  name: "Pattern Name",         // Display name
  description: "Description",   // Detailed description
  category: "structural",       // Category (structural, process, relationship)
  importance: 3,                // Importance factor (affects physical properties)
  physicProperties: {           // Optional custom physics properties
    radius: 15,                 // Visual and collision radius
    mass: 2,                    // Mass (affects forces)
    charge: -100                // Repulsive force
  }
};

// Relationship structure
const relationship = {
  id: "rel-1",                  // Unique identifier
  source: "pattern-1",          // Source pattern ID
  target: "pattern-2",          // Target pattern ID
  type: "strong",               // Relationship type
  weight: 2,                    // Weight/importance of relationship
  physicProperties: {           // Optional custom physics properties
    strength: 0.5,              // Connection strength
    distance: 100               // Preferred distance
  }
};
```

## 🔬 API Reference

### GravityFlowEngine

```javascript
// Core methods
gravityFlow.start();                  // Start simulation
gravityFlow.stop();                   // Stop simulation
gravityFlow.reset();                  // Reset to initial state

// Data management
gravityFlow.loadData(data);           // Load pattern/relationship data
gravityFlow.exportToJSON();           // Export current state to JSON

// Filtering
gravityFlow.filterByCategory(category, enabled);  // Filter by category

// Configuration
gravityFlow.updateSimulationConfig(config);       // Update physics config
gravityFlow.updateRenderingConfig(config);        // Update rendering config

// Interaction
gravityFlow.focusOnNode(nodeId);                  // Focus view on a node
```

## 🧪 Examples

The codebase includes several examples:

1. **Basic Demo**: Simple demonstration with sample patterns
2. **Performance Test**: Stress test with large numbers of patterns
3. **Pattern Explorer**: More advanced UI for exploring pattern relationships

## 📋 Project Status

See the [PROGRESS.md](./PROGRESS.md) file for current development status.

## 🛣️ Roadmap

- Implement pattern clustering algorithms
- Add more sophisticated pattern physics mappings
- Create pattern comparison visualizations
- Add support for hierarchical pattern relationships
- Implement 3D visualization option

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 