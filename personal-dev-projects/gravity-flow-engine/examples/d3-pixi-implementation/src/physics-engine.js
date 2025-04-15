/**
 * Physics Engine Module
 * Manages the physical simulation of pattern nodes and their relationships using D3-force.
 */

import * as d3 from 'd3';

class PhysicsEngine {
  constructor(options = {}) {
    // Default configuration
    this.config = {
      // Force simulation parameters
      chargeStrength: -150,
      linkStrength: 0.3,
      linkDistance: 100,
      collisionStrength: 0.7,
      centerStrength: 0.1,
      
      // Physical properties
      gravity: 0,
      friction: 0.6,
      velocityDecay: 0.4,
      alpha: 1,
      alphaDecay: 0.02,
      alphaMin: 0.001,
      alphaTarget: 0,
      
      // Performance settings
      velocityVerlet: true,
      
      // Callbacks
      onTick: null,
      onEnd: null,
      ...options
    };
    
    // Initialize simulation
    this.initSimulation();
    
    // State tracking
    this.isRunning = false;
    this.isPaused = false;
    this.nodes = [];
    this.links = [];
    
    // Event listeners
    this.eventListeners = {
      'tick': [],
      'end': [],
      'start': [],
      'pause': [],
      'resume': [],
      'node-drag-start': [],
      'node-drag': [],
      'node-drag-end': []
    };
  }
  
  /**
   * Initialize the D3 force simulation
   */
  initSimulation() {
    // Create the simulation with default forces
    this.simulation = d3.forceSimulation()
      .velocityDecay(this.config.velocityDecay)
      .alphaDecay(this.config.alphaDecay)
      .alphaMin(this.config.alphaMin)
      .alphaTarget(this.config.alphaTarget)
      .alpha(this.config.alpha);
    
    // Add core forces
    this.simulation
      .force('charge', d3.forceManyBody()
        .strength(d => d.physicProperties?.charge || this.config.chargeStrength))
      .force('center', d3.forceCenter()
        .strength(this.config.centerStrength))
      .force('collision', d3.forceCollide()
        .radius(d => d.physicProperties?.radius || 10)
        .strength(this.config.collisionStrength))
      .force('link', d3.forceLink()
        .id(d => d.id)
        .distance(d => d.distance || this.config.linkDistance)
        .strength(d => d.strength || this.config.linkStrength));

    // Register tick handler
    this.simulation.on('tick', () => this.handleTick());
    this.simulation.on('end', () => this.handleEnd());
  }
  
  /**
   * Handle simulation tick event
   */
  handleTick() {
    // Notify tick event listeners
    this.notifyListeners('tick', {
      nodes: this.nodes,
      links: this.links,
      alpha: this.simulation.alpha()
    });
    
    // Call external tick handler if provided
    if (typeof this.config.onTick === 'function') {
      this.config.onTick(this.nodes, this.links, this.simulation.alpha());
    }
  }
  
  /**
   * Handle simulation end event
   */
  handleEnd() {
    this.isRunning = false;
    
    // Notify end event listeners
    this.notifyListeners('end', {
      nodes: this.nodes,
      links: this.links
    });
    
    // Call external end handler if provided
    if (typeof this.config.onEnd === 'function') {
      this.config.onEnd(this.nodes, this.links);
    }
  }
  
  /**
   * Update simulation with new data
   */
  updateData(data) {
    const { nodes, links } = data;
    
    // Store references to current data
    this.nodes = nodes;
    this.links = links;
    
    // Preserve fixed positions for existing nodes
    if (this.simulation.nodes().length > 0) {
      const oldNodesById = new Map(this.simulation.nodes().map(node => [node.id, node]));
      
      nodes.forEach(node => {
        const oldNode = oldNodesById.get(node.id);
        if (oldNode) {
          // Preserve position and velocity
          node.x = oldNode.x;
          node.y = oldNode.y;
          node.vx = oldNode.vx;
          node.vy = oldNode.vy;
          if (oldNode.fx !== undefined) node.fx = oldNode.fx;
          if (oldNode.fy !== undefined) node.fy = oldNode.fy;
        }
      });
    }
    
    // Update simulation with new data
    this.simulation.nodes(nodes);
    this.simulation.force('link').links(links);
    
    // Adjust collision force based on node radii
    this.simulation.force('collision').radius(d => d.physicProperties?.radius || 10);
    
    // Adjust charge force based on node mass/charge
    this.simulation.force('charge').strength(d => d.physicProperties?.charge || this.config.chargeStrength);
    
    // Center the graph
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.simulation.force('center').x(width / 2).y(height / 2);
    
    return this;
  }
  
  /**
   * Start or restart the simulation
   */
  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.simulation.alpha(this.config.alpha).restart();
    
    // Notify listeners
    this.notifyListeners('start', {
      nodes: this.nodes,
      links: this.links
    });
    
    return this;
  }
  
  /**
   * Pause the simulation by stopping the timer
   */
  pause() {
    if (this.isRunning && !this.isPaused) {
      this.simulation.stop();
      this.isPaused = true;
      
      // Notify listeners
      this.notifyListeners('pause', {
        nodes: this.nodes,
        links: this.links
      });
    }
    
    return this;
  }
  
  /**
   * Resume a paused simulation
   */
  resume() {
    if (this.isPaused) {
      this.simulation.restart();
      this.isPaused = false;
      
      // Notify listeners
      this.notifyListeners('resume', {
        nodes: this.nodes,
        links: this.links
      });
    }
    
    return this;
  }
  
  /**
   * Manually step the simulation forward
   */
  step(steps = 1) {
    for (let i = 0; i < steps; i++) {
      this.simulation.tick();
    }
    
    // Notify tick listeners
    this.handleTick();
    
    return this;
  }
  
  /**
   * Update simulation configuration
   */
  updateConfig(newConfig) {
    // Update configuration
    Object.assign(this.config, newConfig);
    
    // Apply changes to the simulation
    this.simulation
      .velocityDecay(this.config.velocityDecay)
      .alphaDecay(this.config.alphaDecay)
      .alphaMin(this.config.alphaMin)
      .alphaTarget(this.config.alphaTarget);
      
    // Update forces
    this.simulation.force('charge')
      .strength(d => d.physicProperties?.charge || this.config.chargeStrength);
      
    this.simulation.force('collision')
      .radius(d => d.physicProperties?.radius || 10)
      .strength(this.config.collisionStrength);
      
    this.simulation.force('link')
      .distance(d => d.distance || this.config.linkDistance)
      .strength(d => d.strength || this.config.linkStrength);
      
    this.simulation.force('center')
      .strength(this.config.centerStrength);
    
    // Restart simulation if running
    if (this.isRunning && !this.isPaused) {
      this.simulation.alpha(this.config.alpha).restart();
    }
    
    return this;
  }
  
  /**
   * Create D3 drag behavior for nodes
   */
  createDragBehavior() {
    return d3.drag()
      .on('start', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        
        // Notify listeners
        this.notifyListeners('node-drag-start', { node: d, event });
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
        
        // Notify listeners
        this.notifyListeners('node-drag', { node: d, event });
      })
      .on('end', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(this.config.alphaTarget);
        
        // Release fixed position if not pinned
        if (!d.pinned) {
          d.fx = null;
          d.fy = null;
        }
        
        // Notify listeners
        this.notifyListeners('node-drag-end', { node: d, event });
      });
  }
  
  /**
   * Pin a node at its current position
   */
  pinNode(nodeId, isPinned = true) {
    const node = this.nodes.find(n => n.id === nodeId);
    
    if (node) {
      if (isPinned) {
        // Pin the node at its current position
        node.fx = node.x;
        node.fy = node.y;
        node.pinned = true;
      } else {
        // Unpin the node
        node.fx = null;
        node.fy = null;
        node.pinned = false;
      }
      
      // Restart simulation if running
      if (this.isRunning && !this.isPaused) {
        this.simulation.alpha(0.1).restart();
      }
    }
    
    return this;
  }
  
  /**
   * Pin a node at a specific position
   */
  pinNodeAt(nodeId, x, y) {
    const node = this.nodes.find(n => n.id === nodeId);
    
    if (node) {
      node.fx = x;
      node.fy = y;
      node.pinned = true;
      
      // Restart simulation if running
      if (this.isRunning && !this.isPaused) {
        this.simulation.alpha(0.1).restart();
      }
    }
    
    return this;
  }
  
  /**
   * Apply force to a specific node
   */
  applyForceToNode(nodeId, forceX, forceY, duration = 100) {
    const node = this.nodes.find(n => n.id === nodeId);
    
    if (node) {
      // Apply force (velocity)
      node.vx = (node.vx || 0) + forceX;
      node.vy = (node.vy || 0) + forceY;
      
      // Restart simulation if running
      if (this.isRunning && !this.isPaused) {
        this.simulation.alpha(0.3).restart();
      }
      
      // Optionally reset after duration
      if (duration > 0) {
        setTimeout(() => {
          if (node.vx === forceX) node.vx = 0;
          if (node.vy === forceY) node.vy = 0;
        }, duration);
      }
    }
    
    return this;
  }
  
  /**
   * Add a temporary attraction force between two nodes
   */
  attractNodes(sourceId, targetId, strength = 0.5, duration = 1000) {
    const source = this.nodes.find(n => n.id === sourceId);
    const target = this.nodes.find(n => n.id === targetId);
    
    if (source && target) {
      // Create a temporary force
      const forceName = `attract-${sourceId}-${targetId}`;
      
      this.simulation.force(forceName, d3.forceLink()
        .id(d => d.id)
        .links([{ source: sourceId, target: targetId, strength }])
        .strength(strength));
      
      // Restart simulation if running
      if (this.isRunning && !this.isPaused) {
        this.simulation.alpha(0.3).restart();
      }
      
      // Remove the force after duration
      if (duration > 0) {
        setTimeout(() => {
          this.simulation.force(forceName, null);
          
          // Restart to apply the change
          if (this.isRunning && !this.isPaused) {
            this.simulation.alpha(0.1).restart();
          }
        }, duration);
      }
    }
    
    return this;
  }
  
  /**
   * Add a custom force to the simulation
   */
  addCustomForce(name, forceFunction) {
    this.simulation.force(name, forceFunction);
    
    // Restart simulation if running
    if (this.isRunning && !this.isPaused) {
      this.simulation.alpha(0.3).restart();
    }
    
    return this;
  }
  
  /**
   * Remove a custom force from the simulation
   */
  removeCustomForce(name) {
    this.simulation.force(name, null);
    
    // Restart simulation if running
    if (this.isRunning && !this.isPaused) {
      this.simulation.alpha(0.1).restart();
    }
    
    return this;
  }
  
  /**
   * Get current simulation statistics
   */
  getStats() {
    return {
      nodes: this.nodes.length,
      links: this.links.length,
      alpha: this.simulation.alpha(),
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      config: { ...this.config }
    };
  }
  
  /**
   * Register an event listener
   */
  addEventListener(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
    return this;
  }
  
  /**
   * Remove an event listener
   */
  removeEventListener(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event]
        .filter(cb => cb !== callback);
    }
    return this;
  }
  
  /**
   * Notify all listeners of an event
   */
  notifyListeners(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }
}

export default PhysicsEngine; 