/**
 * Integration Module
 * Combines PhysicsEngine and RenderEngine to create a complete visualization system.
 */

import PhysicsEngine from './physics-engine.js';
import RenderEngine from './render-engine.js';

class GravityFlowEngine {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    if (!this.container) {
      throw new Error('Invalid container element');
    }
    
    // Default options
    this.options = {
      // Physics options
      physics: {
        chargeStrength: -30,
        linkStrength: 0.3,
        linkDistance: 100,
        collisionRadius: 10,
        centerForce: 0.1
      },
      // Rendering options
      render: {
        backgroundColor: 0x1a1a1a,
        autoResize: true
      },
      // Data filtering options
      filter: {
        nodeCategories: ['structural', 'process', 'relationship'],
        showAllByDefault: true
      },
      ...options
    };
    
    // Initialize engines
    this.physics = new PhysicsEngine([], [], this.options.physics);
    this.renderer = new RenderEngine(this.container, this.options.render);
    
    // Event callbacks
    this.onNodeSelected = null;
    this.onNodeHovered = null;
    
    // Setup listener connections
    this.setupEventConnections();
    
    // Auto-resize handling
    if (this.options.render.autoResize) {
      window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    // Animation loop
    this.isRunning = false;
    this.renderLoop = this.renderLoop.bind(this);
  }
  
  /**
   * Connect events between physics and rendering engines
   */
  setupEventConnections() {
    // Handle node dragging in physics when dragged in renderer
    this.renderer.onNodeDrag = (node, x, y) => {
      this.physics.setNodePosition(node.id, x, y);
    };
    
    // Handle node release in physics when released in renderer
    this.renderer.onNodeRelease = (node) => {
      this.physics.unlockNode(node.id);
    };
    
    // Handle node selection in renderer
    this.renderer.onNodeClick = (node) => {
      this.renderer.selectNode(node);
      if (this.onNodeSelected) {
        this.onNodeSelected(node);
      }
    };
    
    // Handle node hover in renderer
    this.renderer.onNodeHover = (node) => {
      if (this.onNodeHovered) {
        this.onNodeHovered(node);
      }
    };
    
    // Handle background click to deselect
    this.renderer.onBackgroundClick = () => {
      this.renderer.deselectNode();
      if (this.onNodeSelected) {
        this.onNodeSelected(null);
      }
    };
  }
  
  /**
   * Load pattern data into the engine
   */
  loadData(nodes, links) {
    // Initialize the physics engine with the data
    this.physics.initializeNodes(nodes);
    this.physics.initializeLinks(links);
    
    // Start the physics simulation
    this.physics.startSimulation();
    
    // Start the rendering loop if it's not already running
    if (!this.isRunning) {
      this.start();
    }
    
    return this;
  }
  
  /**
   * Start the visualization
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.physics.startSimulation();
    requestAnimationFrame(this.renderLoop);
    
    return this;
  }
  
  /**
   * Stop the visualization
   */
  stop() {
    this.isRunning = false;
    this.physics.stopSimulation();
    
    return this;
  }
  
  /**
   * Reset the visualization
   */
  reset() {
    this.physics.resetSimulation();
    this.renderer.resetView();
    
    return this;
  }
  
  /**
   * Main render loop
   */
  renderLoop() {
    if (!this.isRunning) return;
    
    // Get current state from physics engine
    const nodes = this.physics.getVisibleNodes();
    const links = this.physics.getVisibleLinks();
    
    // Update the renderer with the current state
    this.renderer.update(nodes, links);
    
    // Continue the animation loop
    requestAnimationFrame(this.renderLoop);
  }
  
  /**
   * Filter nodes by category
   */
  filterByCategory(category, visible) {
    this.physics.setNodeCategoryVisibility(category, visible);
    return this;
  }
  
  /**
   * Show all nodes
   */
  showAllNodes() {
    this.options.filter.nodeCategories.forEach(category => {
      this.physics.setNodeCategoryVisibility(category, true);
    });
    return this;
  }
  
  /**
   * Focus on a specific node
   */
  focusNode(nodeId) {
    const node = this.physics.getNodeById(nodeId);
    if (node) {
      this.renderer.centerOnNode(node);
      this.renderer.selectNode(node);
    }
    return this;
  }
  
  /**
   * Apply a temporary force to a node
   */
  applyForceToNode(nodeId, forceX, forceY, duration = 500) {
    this.physics.applyForceToNode(nodeId, forceX, forceY, duration);
    return this;
  }
  
  /**
   * Get related nodes
   */
  getRelatedNodes(nodeId) {
    return this.physics.getRelatedNodes(nodeId);
  }
  
  /**
   * Update physics simulation parameters
   */
  updatePhysicsSettings(settings) {
    this.physics.updateSimulationSettings(settings);
    return this;
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.container) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.renderer.resize(width, height);
  }
  
  /**
   * Set a callback for node selection
   */
  onSelect(callback) {
    this.onNodeSelected = callback;
    return this;
  }
  
  /**
   * Set a callback for node hover
   */
  onHover(callback) {
    this.onNodeHovered = callback;
    return this;
  }
  
  /**
   * Clean up and destroy the engine
   */
  destroy() {
    this.stop();
    
    if (this.physics) {
      this.physics.stopSimulation();
    }
    
    if (this.renderer) {
      this.renderer.destroy();
    }
    
    if (this.options.render.autoResize) {
      window.removeEventListener('resize', this.handleResize);
    }
    
    // Clear references
    this.physics = null;
    this.renderer = null;
  }
}

export default GravityFlowEngine; 