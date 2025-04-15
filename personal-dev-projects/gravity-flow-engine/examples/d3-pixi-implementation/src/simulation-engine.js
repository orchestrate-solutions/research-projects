/**
 * Simulation Engine
 * Manages physics simulation using D3-force, handles node positions, 
 * forces, and integration of physical properties.
 */

import * as d3 from 'd3-force';

class SimulationEngine {
  constructor(options = {}) {
    // Default configuration
    this.config = {
      alpha: 0.3,           // Initial alpha (simulation activity level)
      alphaDecay: 0.02,     // How quickly the simulation cools down
      alphaMin: 0.001,      // Minimum alpha before simulation stops
      velocityDecay: 0.4,   // Velocity decay (friction)
      centerForce: 0.1,     // Center gravity force strength
      boundaryPadding: 50,  // Padding from container boundaries
      ...options
    };
    
    // Simulation state
    this.isRunning = false;
    this.isPaused = false;
    this.tickCount = 0;
    
    // Container dimensions for boundary forces
    this.width = 800;
    this.height = 600;
    
    // Simulation stats for performance monitoring
    this.stats = {
      fps: 0,
      lastTickTime: 0,
      tickTimes: [],
      averageTickTime: 0,
      nodeCount: 0,
      linkCount: 0
    };
    
    // Initialize the simulation
    this.initializeSimulation();
    
    // Event handlers
    this.onTickHandlers = [];
    this.onStabilizedHandlers = [];
    this.onNodeDragHandlers = [];
  }
  
  /**
   * Initialize the D3 force simulation
   * @private
   */
  initializeSimulation() {
    // Create the force simulation
    this.simulation = d3.forceSimulation()
      .alpha(this.config.alpha)
      .alphaDecay(this.config.alphaDecay)
      .alphaMin(this.config.alphaMin)
      .velocityDecay(this.config.velocityDecay)
      .on('tick', () => this.handleTick());
    
    // Configure forces
    this.setupForces();
  }
  
  /**
   * Setup the default forces
   * @private
   */
  setupForces() {
    // Center force to keep the graph centered in the container
    this.centerForce = d3.forceCenter(this.width / 2, this.height / 2)
      .strength(this.config.centerForce);
    
    // Many-body force (charge/repulsion between nodes)
    this.chargeForce = d3.forceManyBody()
      .strength(node => node.physicProperties?.charge || -30);
    
    // Link force (connects nodes with springs)
    this.linkForce = d3.forceLink()
      .id(node => node.id)
      .distance(link => link.physicProperties?.distance || 100)
      .strength(link => link.physicProperties?.strength || 0.3);
    
    // Collision force (prevents nodes from overlapping)
    this.collisionForce = d3.forceCollide()
      .radius(node => node.physicProperties?.radius || 10)
      .strength(0.7);
    
    // Apply forces to simulation
    this.simulation
      .force('center', this.centerForce)
      .force('charge', this.chargeForce)
      .force('link', this.linkForce)
      .force('collision', this.collisionForce);
      
    // Optional: add boundary force to keep nodes within container
    this.addBoundaryForce();
  }
  
  /**
   * Add a custom force to keep nodes within the container boundaries
   * @private
   */
  addBoundaryForce() {
    // Custom force to keep nodes within boundaries
    const boundaryForce = alpha => {
      const padding = this.config.boundaryPadding;
      
      // For each node, apply boundary force
      for (const node of this.simulation.nodes()) {
        const r = node.physicProperties?.radius || 10;
        
        // X-axis boundaries
        if (node.x < padding + r) {
          node.vx += (padding + r - node.x) * alpha;
        } else if (node.x > this.width - padding - r) {
          node.vx -= (node.x - (this.width - padding - r)) * alpha;
        }
        
        // Y-axis boundaries
        if (node.y < padding + r) {
          node.vy += (padding + r - node.y) * alpha;
        } else if (node.y > this.height - padding - r) {
          node.vy -= (node.y - (this.height - padding - r)) * alpha;
        }
      }
    };
    
    // Add the custom force to the simulation
    this.simulation.force('boundary', boundaryForce);
  }
  
  /**
   * Handle simulation tick event
   * @private
   */
  handleTick() {
    // Calculate FPS and track stats
    this.updateStats();
    
    // Increment tick counter
    this.tickCount++;
    
    // Notify listeners
    this.onTickHandlers.forEach(handler => handler(this.simulation.nodes()));
    
    // Check if simulation has stabilized (alpha reached minimum)
    if (this.simulation.alpha() <= this.config.alphaMin && this.isRunning) {
      this.onStabilize();
    }
  }
  
  /**
   * Update simulation stats
   * @private
   */
  updateStats() {
    const now = performance.now();
    const elapsed = now - this.stats.lastTickTime;
    
    if (this.stats.lastTickTime) {
      // Calculate instantaneous FPS
      this.stats.fps = 1000 / elapsed;
      
      // Keep track of recent tick times for averaging
      this.stats.tickTimes.push(elapsed);
      if (this.stats.tickTimes.length > 60) {
        this.stats.tickTimes.shift();
      }
      
      // Calculate average tick time
      this.stats.averageTickTime = this.stats.tickTimes.reduce((a, b) => a + b, 0) / 
        this.stats.tickTimes.length;
    }
    
    this.stats.lastTickTime = now;
    this.stats.nodeCount = this.simulation.nodes().length;
    this.stats.linkCount = this.simulation.force('link').links().length;
  }
  
  /**
   * Handle simulation stabilized event
   * @private
   */
  onStabilize() {
    this.isRunning = false;
    this.onStabilizedHandlers.forEach(handler => handler());
  }
  
  /**
   * Set the container dimensions for the simulation
   * @param {number} width - Container width
   * @param {number} height - Container height
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
    
    // Update center force
    this.centerForce.x(width / 2).y(height / 2);
    
    // Reheat the simulation when size changes
    this.reheat();
  }
  
  /**
   * Set the simulation data (nodes and links)
   * @param {Object} data - Object with nodes and links arrays
   */
  setData(data) {
    const { nodes, links } = data;
    
    // Set nodes and links
    this.simulation.nodes(nodes);
    this.linkForce.links(links);
    
    // Reset stats
    this.stats.nodeCount = nodes.length;
    this.stats.linkCount = links.length;
    
    // Reheat the simulation with new data
    this.reheat();
  }
  
  /**
   * Reheat the simulation (reset alpha to start value)
   */
  reheat() {
    this.simulation.alpha(this.config.alpha).restart();
    this.isRunning = true;
    this.isPaused = false;
  }
  
  /**
   * Start the simulation
   */
  start() {
    if (!this.isRunning) {
      this.reheat();
    } else if (this.isPaused) {
      this.resume();
    }
  }
  
  /**
   * Stop the simulation completely
   */
  stop() {
    this.simulation.stop();
    this.isRunning = false;
    this.isPaused = false;
  }
  
  /**
   * Pause the simulation (can be resumed)
   */
  pause() {
    if (this.isRunning && !this.isPaused) {
      this.simulation.stop();
      this.isPaused = true;
    }
  }
  
  /**
   * Resume a paused simulation
   */
  resume() {
    if (this.isPaused) {
      this.simulation.restart();
      this.isPaused = false;
    }
  }
  
  /**
   * Run the simulation for a fixed number of ticks
   * @param {number} numTicks - Number of ticks to run
   * @returns {Promise} Promise that resolves when ticks are complete
   */
  async runNTicks(numTicks) {
    return new Promise(resolve => {
      const startTick = this.tickCount;
      const checkTick = () => {
        if (this.tickCount >= startTick + numTicks) {
          this.simulation.stop();
          resolve();
        } else {
          this.simulation.tick();
          requestAnimationFrame(checkTick);
        }
      };
      
      checkTick();
    });
  }
  
  /**
   * Get current node positions
   * @returns {Array} Array of node objects with positions
   */
  getNodePositions() {
    return this.simulation.nodes().map(node => ({
      id: node.id,
      x: node.x,
      y: node.y,
      vx: node.vx,
      vy: node.vy
    }));
  }
  
  /**
   * Update a specific node's properties
   * @param {string} nodeId - ID of the node to update
   * @param {Object} properties - Properties to update
   */
  updateNode(nodeId, properties) {
    const nodes = this.simulation.nodes();
    const nodeIndex = nodes.findIndex(n => n.id === nodeId);
    
    if (nodeIndex !== -1) {
      const node = nodes[nodeIndex];
      
      // Update node properties
      Object.assign(node, properties);
      
      // If updating physical properties, reheat the simulation
      if (properties.physicProperties) {
        this.reheat();
      }
    }
  }
  
  /**
   * Update a specific link's properties
   * @param {string} linkId - ID of the link to update
   * @param {Object} properties - Properties to update
   */
  updateLink(linkId, properties) {
    const links = this.linkForce.links();
    const linkIndex = links.findIndex(l => l.id === linkId);
    
    if (linkIndex !== -1) {
      const link = links[linkIndex];
      
      // Update link properties
      Object.assign(link, properties);
      
      // If updating physical properties, reheat the simulation
      if (properties.physicProperties) {
        this.reheat();
      }
    }
  }
  
  /**
   * Handle node dragging
   * @param {Object} node - Node being dragged
   * @param {number} x - New x position
   * @param {number} y - New y position
   */
  handleNodeDrag(nodeId, x, y) {
    const nodes = this.simulation.nodes();
    const node = nodes.find(n => n.id === nodeId);
    
    if (node) {
      node.fx = x;
      node.fy = y;
      
      // Notify drag listeners
      this.onNodeDragHandlers.forEach(handler => handler(node, x, y));
      
      // Reheat simulation slightly
      if (!this.isRunning) {
        this.simulation.alpha(0.1).restart();
        this.isRunning = true;
      }
    }
  }
  
  /**
   * Release a node from being fixed
   * @param {string} nodeId - ID of node to release
   */
  releaseNode(nodeId) {
    const nodes = this.simulation.nodes();
    const node = nodes.find(n => n.id === nodeId);
    
    if (node) {
      node.fx = null;
      node.fy = null;
    }
  }
  
  /**
   * Pin a node at a specific position
   * @param {string} nodeId - ID of node to pin
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  pinNode(nodeId, x, y) {
    const nodes = this.simulation.nodes();
    const node = nodes.find(n => n.id === nodeId);
    
    if (node) {
      node.fx = x;
      node.fy = y;
    }
  }
  
  /**
   * Get the current configuration
   * @returns {Object} Current configuration settings
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * Update configuration settings
   * @param {Object} newConfig - New configuration settings
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
    
    // Apply changes to the simulation
    this.simulation
      .alpha(this.config.alpha)
      .alphaDecay(this.config.alphaDecay)
      .alphaMin(this.config.alphaMin)
      .velocityDecay(this.config.velocityDecay);
      
    // Update forces
    this.centerForce.strength(this.config.centerForce);
    
    // Restart the simulation
    this.reheat();
  }
  
  /**
   * Add custom force to the simulation
   * @param {string} name - Name of the force
   * @param {Function} force - Force function
   */
  addForce(name, force) {
    this.simulation.force(name, force);
    this.reheat();
  }
  
  /**
   * Remove a force from the simulation
   * @param {string} name - Name of force to remove
   */
  removeForce(name) {
    this.simulation.force(name, null);
    this.reheat();
  }
  
  /**
   * Register tick handler
   * @param {Function} handler - Function to call on each tick
   */
  onTick(handler) {
    this.onTickHandlers.push(handler);
    return this; // For chaining
  }
  
  /**
   * Register stabilized handler
   * @param {Function} handler - Function to call when simulation stabilizes
   */
  onStabilized(handler) {
    this.onStabilizedHandlers.push(handler);
    return this; // For chaining
  }
  
  /**
   * Register node drag handler
   * @param {Function} handler - Function to call when node is dragged
   */
  onNodeDrag(handler) {
    this.onNodeDragHandlers.push(handler);
    return this; // For chaining
  }
  
  /**
   * Get current simulation performance stats
   * @returns {Object} Stats object with performance metrics
   */
  getStats() {
    return { ...this.stats };
  }
  
  /**
   * Check if simulation is currently active
   * @returns {boolean} True if running
   */
  isActive() {
    return this.isRunning && !this.isPaused;
  }
  
  /**
   * Get d3 simulation instance (for advanced usage)
   * @returns {Object} d3 force simulation instance
   */
  getSimulation() {
    return this.simulation;
  }
}

export default SimulationEngine; 