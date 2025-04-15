/**
 * Gravity Flow Engine
 * D3-force + PixiJS Implementation
 * 
 * Main entry point for the application that coordinates physics simulation and rendering
 */

import SimulationLayer from './simulation-layer.js';
import RenderingLayer from './rendering-layer.js';
import PatternDataModel from './pattern-data-model.js';
import PatternManager from './pattern-manager.js';

class GravityFlowEngine {
  constructor(containerId, options = {}) {
    // Get container element
    this.container = typeof containerId === 'string' 
      ? document.getElementById(containerId) 
      : containerId;
      
    if (!this.container) {
      throw new Error('Container element not found');
    }
    
    // Default options
    this.options = {
      // Simulation options
      simulation: {
        chargeStrength: -100,
        linkStrength: 0.3,
        linkDistance: 100,
        collisionRadius: 15,
        alpha: 0.3,
        alphaDecay: 0.02,
        alphaMin: 0.001,
      },
      
      // Rendering options
      rendering: {
        nodeSize: 15,
        linkWidth: 1.5,
        nodeColor: 0x6baed6,
        linkColor: 0x999999,
        backgroundColor: 0xf7f7f7,
        renderLabels: true,
        adaptiveDetail: true,
      },
      
      // Data management options
      data: {
        defaultPatternCategory: 'structural',
      },
      ...options
    };
    
    // Initialize components
    this.initComponents();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Track state
    this.isRunning = false;
    this.selectedNode = null;
    
    // Start animation loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
    
    console.log('Gravity Flow Engine initialized');
  }
  
  /**
   * Initialize all engine components
   */
  initComponents() {
    // Initialize data model and pattern manager
    this.dataModel = new PatternDataModel();
    this.patternManager = new PatternManager();
    
    // Initialize simulation layer
    this.simulation = new SimulationLayer(this.options.simulation);
    
    // Initialize rendering layer
    this.rendering = new RenderingLayer(this.options.rendering);
    this.rendering.initialize(this.container);
    
    // Load sample data if available
    if (this.options.data?.sampleData) {
      this.loadData(this.options.data.sampleData);
    } else {
      this.loadSampleData();
    }
  }
  
  /**
   * Set up event communication between components
   */
  setupEventListeners() {
    // Connect simulation tick events to rendering
    this.simulation.on('tick', () => {
      const data = this.simulation.getNodesAndLinks();
      this.rendering.updatePositions(data.nodes, data.links);
    });
    
    // Connect rendering interaction events to simulation
    this.rendering.onNodeClick((node) => {
      this.handleNodeClick(node);
    });
    
    this.rendering.onNodeHover((node) => {
      this.handleNodeHover(node);
    });
    
    this.rendering.onNodeHoverEnd((node) => {
      this.handleNodeHoverEnd(node);
    });
    
    // Connect drag events
    this.rendering.onNodeDrag((node, x, y) => {
      this.simulation.fixNode(node.id, x, y);
    });
    
    this.rendering.onNodeDragEnd((node) => {
      if (!node.pinned) {
        this.simulation.unfixNode(node.id);
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Connect pattern manager events
    this.patternManager.addEventListener('filter-change', (data) => {
      this.updateVisiblePatterns();
    });
    
    this.patternManager.addEventListener('selection-change', (data) => {
      if (data.selectedPatternId) {
        this.rendering.highlightNode(data.selectedPatternId);
      } else {
        this.rendering.resetNodeHighlight();
      }
    });
  }
  
  /**
   * Animation loop
   */
  animate() {
    // Continue animation loop
    requestAnimationFrame(this.animate);
    
    // Update adaptive detail level based on performance
    this.rendering.updateAdaptiveDetail();
    
    // Perform any custom animation updates here
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    if (this.container) {
      const rect = this.container.getBoundingClientRect();
      this.rendering.handleResize();
    }
  }
  
  /**
   * Handle node click events
   */
  handleNodeClick(node) {
    if (node) {
      // Toggle node selection
      if (this.selectedNode === node.id) {
        this.selectedNode = null;
        this.rendering.resetNodeHighlight(node.id);
        this.patternManager.selectPattern(null);
      } else {
        this.selectedNode = node.id;
        this.rendering.highlightNode(node.id);
        this.patternManager.selectPattern(node.id);
        
        // Highlight connected nodes
        const connectedPatterns = this.patternManager.getRelatedPatterns(node.id);
        connectedPatterns.forEach(pattern => {
          this.rendering.highlightNode(pattern.id, 0x4488ff);
        });
      }
      
      // Dispatch custom event
      this.container.dispatchEvent(new CustomEvent('node-selected', { 
        detail: { node, selected: this.selectedNode === node.id } 
      }));
    }
  }
  
  /**
   * Handle node hover events
   */
  handleNodeHover(node) {
    if (node) {
      // Show tooltip or hover effect
      this.container.style.cursor = 'pointer';
      
      // Dispatch custom event
      this.container.dispatchEvent(new CustomEvent('node-hover', { 
        detail: { node } 
      }));
    }
  }
  
  /**
   * Handle node hover end events
   */
  handleNodeHoverEnd(node) {
    this.container.style.cursor = 'default';
    
    // Dispatch custom event
    this.container.dispatchEvent(new CustomEvent('node-hover-end', { 
      detail: { node } 
    }));
  }
  
  /**
   * Load pattern and relationship data
   */
  loadData(data) {
    // Process data through pattern manager
    this.patternManager.loadData(data.patterns, data.relationships);
    
    // Get data in simulation format
    const graphData = this.patternManager.getGraphData();
    
    // Update simulation
    this.simulation.updateData(graphData);
    
    // Update rendering
    this.rendering.renderData(graphData);
    
    // Start simulation
    this.start();
    
    return this;
  }
  
  /**
   * Load sample data for testing
   */
  loadSampleData() {
    // Create sample pattern data
    const patterns = [];
    const relationships = [];
    
    // Categories
    const categories = ['structural', 'process', 'relationship'];
    
    // Create patterns
    for (let i = 0; i < 20; i++) {
      const category = categories[i % 3];
      
      patterns.push({
        id: `pattern-${i}`,
        name: `Pattern ${i}`,
        description: `Sample ${category} pattern ${i}`,
        category,
        importance: Math.random() * 5,
        physicProperties: {
          radius: 10 + Math.random() * 10,
          mass: 1 + Math.random() * 2,
          charge: -30 - Math.random() * 70
        }
      });
    }
    
    // Create relationships
    for (let i = 0; i < 30; i++) {
      const source = `pattern-${Math.floor(Math.random() * 20)}`;
      let target;
      
      do {
        target = `pattern-${Math.floor(Math.random() * 20)}`;
      } while (source === target);
      
      relationships.push({
        id: `relationship-${i}`,
        source,
        target,
        type: Math.random() > 0.7 ? 'strong' : 'weak',
        weight: Math.random() * 2,
        physicProperties: {
          strength: 0.1 + Math.random() * 0.4,
          distance: 50 + Math.random() * 100
        }
      });
    }
    
    // Load the data
    this.loadData({ patterns, relationships });
    
    return this;
  }
  
  /**
   * Update which patterns are visible based on filters
   */
  updateVisiblePatterns() {
    const graphData = this.patternManager.getGraphData();
    this.simulation.updateData(graphData, true);
    this.rendering.renderData(graphData);
    
    return this;
  }
  
  /**
   * Start the simulation
   */
  start() {
    if (!this.isRunning) {
      this.simulation.restart();
      this.isRunning = true;
    }
    
    return this;
  }
  
  /**
   * Stop the simulation
   */
  stop() {
    if (this.isRunning) {
      this.simulation.stop();
      this.isRunning = false;
    }
    
    return this;
  }
  
  /**
   * Reset the simulation to initial state
   */
  reset() {
    this.simulation.reset();
    this.rendering.centerView(true);
    this.selectedNode = null;
    this.patternManager.selectPattern(null);
    
    return this;
  }
  
  /**
   * Filter patterns by category
   */
  filterByCategory(category, enabled = true) {
    this.patternManager.filterByCategory(category, enabled);
    return this;
  }
  
  /**
   * Update simulation configuration
   */
  updateSimulationConfig(config) {
    this.simulation.updateConfig(config);
    return this;
  }
  
  /**
   * Update rendering configuration
   */
  updateRenderingConfig(config) {
    this.rendering.updateConfig(config);
    return this;
  }
  
  /**
   * Get current configuration
   */
  getConfig() {
    return {
      simulation: this.simulation.getConfig(),
      rendering: this.rendering.getConfig()
    };
  }
  
  /**
   * Focus the view on a specific node
   */
  focusOnNode(nodeId) {
    const node = this.simulation.getNodeById(nodeId);
    if (node) {
      this.rendering.centerView(node.x, node.y, true);
      this.rendering.highlightNode(nodeId);
      this.patternManager.selectPattern(nodeId);
    }
    return this;
  }
  
  /**
   * Export current state to JSON
   */
  exportToJSON() {
    return {
      patterns: this.patternManager.getAllPatterns(),
      relationships: this.patternManager.getAllRelationships(),
      config: this.getConfig()
    };
  }
  
  /**
   * Clean up resources and remove event listeners
   */
  destroy() {
    // Stop animation and simulation
    this.stop();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    
    // Clean up components
    if (this.rendering) {
      this.rendering.destroy();
    }
    
    if (this.simulation) {
      this.simulation.destroy();
    }
  }
}

// Initialize the engine when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the Gravity Flow Engine
  window.gravityFlow = new GravityFlowEngine('container', {
    simulation: {
      chargeStrength: -100,
      linkStrength: 0.3
    },
    rendering: {
      nodeColor: 0x6baed6,
      linkColor: 0x999999
    }
  });
  
  // Set up UI controls
  setupUIControls();
});

/**
 * Set up UI controls for the engine
 */
function setupUIControls() {
  // Charge strength slider
  const chargeSlider = document.getElementById('charge-strength');
  const chargeValue = document.getElementById('charge-value');
  
  if (chargeSlider && chargeValue) {
    chargeSlider.addEventListener('input', (event) => {
      const value = event.target.value;
      chargeValue.textContent = value;
      window.gravityFlow.updateSimulationConfig({ chargeStrength: parseFloat(value) });
    });
  }
  
  // Link strength slider
  const linkSlider = document.getElementById('link-strength');
  const linkValue = document.getElementById('link-value');
  
  if (linkSlider && linkValue) {
    linkSlider.addEventListener('input', (event) => {
      const value = event.target.value;
      linkValue.textContent = value;
      window.gravityFlow.updateSimulationConfig({ linkStrength: parseFloat(value) });
    });
  }
  
  // Link distance slider
  const distanceSlider = document.getElementById('link-distance');
  const distanceValue = document.getElementById('distance-value');
  
  if (distanceSlider && distanceValue) {
    distanceSlider.addEventListener('input', (event) => {
      const value = event.target.value;
      distanceValue.textContent = value;
      window.gravityFlow.updateSimulationConfig({ linkDistance: parseFloat(value) });
    });
  }
  
  // Pattern category filter
  const categorySelect = document.getElementById('pattern-category');
  
  if (categorySelect) {
    categorySelect.addEventListener('change', (event) => {
      const value = event.target.value;
      
      // Reset filters first
      window.gravityFlow.filterByCategory('structural', false);
      window.gravityFlow.filterByCategory('process', false);
      window.gravityFlow.filterByCategory('relationship', false);
      
      if (value === 'all') {
        window.gravityFlow.filterByCategory('structural', true);
        window.gravityFlow.filterByCategory('process', true);
        window.gravityFlow.filterByCategory('relationship', true);
      } else {
        window.gravityFlow.filterByCategory(value, true);
      }
    });
  }
  
  // Reset button
  const resetButton = document.getElementById('reset-btn');
  
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      window.gravityFlow.reset();
    });
  }
  
  // Info panel handling
  const infoPanel = document.getElementById('info-panel');
  
  if (infoPanel) {
    // Listen for node selection events
    document.getElementById('container').addEventListener('node-selected', (event) => {
      const { node, selected } = event.detail;
      
      if (selected && node) {
        // Show node information
        const nameElement = document.getElementById('pattern-name');
        const descElement = document.getElementById('pattern-description');
        const connectionsElement = document.getElementById('pattern-connections');
        
        if (nameElement) nameElement.textContent = node.name || 'Unknown Pattern';
        if (descElement) descElement.textContent = node.description || 'No description available';
        
        // Get connection count
        const connections = window.gravityFlow.patternManager.getRelationshipsForPattern(node.id);
        if (connectionsElement) {
          connectionsElement.textContent = `Connections: ${connections.length}`;
        }
        
        infoPanel.style.display = 'block';
      } else {
        infoPanel.style.display = 'none';
      }
    });
  }
}

// Export the main class
export default GravityFlowEngine; 