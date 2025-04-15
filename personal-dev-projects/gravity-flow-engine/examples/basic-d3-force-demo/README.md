# Basic D3-Force Demo for Gravity Flow Engine

This is a simple demonstration of the Gravity Flow Engine concept using D3's force simulation. It visualizes pattern relationships as a dynamic, physics-based network.

## Features

- **Physics-Based Pattern Relationships**: Patterns are represented as nodes with different physical properties based on their category and characteristics.
- **Interactive Visualization**: Drag nodes, hover for details, and use controls to adjust physics parameters.
- **Category Filtering**: Toggle between different pattern categories to explore relationships.
- **Responsive Design**: Adapts to window size changes.

## How to Use

1. Open `index.html` in a modern web browser
2. Interact with the visualization:
   - Drag nodes to reposition them
   - Hover over nodes to see pattern details
   - Use the control panel to adjust physics parameters
   - Filter patterns by category using the dropdown

## Physics Controls

- **Charge Strength**: Controls repulsion between nodes (more negative = stronger repulsion)
- **Link Strength**: Controls the rigidity of connections between nodes
- **Link Distance**: Sets the natural length of links between nodes

## Pattern Types

The demo includes examples of three pattern categories:

1. **Structural Patterns** (Blue): Patterns of physical organization and forms
   - Fractal Self-Similarity
   - Network Structure
   - Hierarchical Organization

2. **Process Patterns** (Green): Patterns of how things change over time
   - Emergent Behavior
   - Feedback Loops
   - Cyclical Patterns

3. **Relationship Patterns** (Red): Patterns of how elements interact
   - Resource Distribution
   - Symbiosis & Mutualism

## Next Steps

This demo is a simplified proof-of-concept. The full Gravity Flow Engine will include:

- More sophisticated physics mappings
- Custom forces for specific pattern types
- Enhanced visualization techniques (WebGL for larger networks)
- Data import from the Pattern Collection Framework
- Analytics and emergent property detection

## Technical Implementation

Built using:
- D3.js v7
- Force directed graph physics
- HTML5/CSS3/JavaScript 