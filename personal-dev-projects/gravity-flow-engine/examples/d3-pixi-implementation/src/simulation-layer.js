/**
 * Simulation Layer
 * Implements the physics simulation using D3-force
 * Handles force calculations, collisions, and position integration
 */

import * as d3 from 'd3';

/**
 * SimulationLayer class that handles physics simulation
 */
class SimulationLayer {
  /**
   * Create a new simulation layer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Configuration with defaults
    this.config = {
      alpha: options.alpha !== undefined ? options.alpha : 1,
      alphaMin: options.alphaMin !== undefined ? options.alphaMin : 0.001,
      alphaDecay: options.alphaDecay !== undefined ? options.alphaDecay : 0.0228,
      alphaTarget: options.alphaTarget !== undefined ? options.alphaTarget : 0,
      velocityDecay: options.velocityDecay !== undefined ? options.velocityDecay : 0.4,
      chargeStrength: options.chargeStrength !== undefined ? options.chargeStrength : -30,
      linkStrength: options.linkStrength !== undefined ? options.linkStrength : 0.5,
      linkDistance: options.linkDistance !== undefined ? options.linkDistance : 30,
      collisionStrength: options.collisionStrength !== undefined ? options.collisionStrength : 0.7,
      gravityStrength: options.gravityStrength !== undefined ? options.gravityStrength : 0.1,
      centerX: options.centerX !== undefined ? options.centerX : 0,
      centerY: options.centerY !== undefined ? options.centerY : 0,
      width: options.width || 1000,
      height: options.height || 800,
      ...options
    };
    
    // Initialize with empty data
    this.nodes = [];
    this.links = [];
    
    // Event callbacks
    this.listeners = {
      tick: [],
      end: [],
      start: []
    };
    
    // Create the simulation
    this.initSimulation();
  }
  
  /**
   * Initialize the D3 force simulation
   * @private
   */
  initSimulation() {
    // Create the force simulation 
    this.simulation = d3.forceSimulation()
      .alpha(this.config.alpha)
      .alphaMin(this.config.alphaMin)
      .alphaDecay(this.config.alphaDecay)
      .alphaTarget(this.config.alphaTarget)
      .velocityDecay(this.config.velocityDecay)
      .on('tick', () => this.handleTick())
      .on('end', () => this.dispatchEvent('end'))
      .on('start', () => this.dispatchEvent('start'));
    
    // Apply forces
    this.applyForces();
    
    return this;
  }
  
  /**
   * Apply forces to the simulation
   * @private
   */
  applyForces() {
    // Charge force (repulsion between nodes)
    this.forceCharge = d3.forceManyBody()
      .strength(node => this.getChargeStrength(node));
    
    // Link force (attraction between connected nodes)
    this.forceLink = d3.forceLink()
      .id(node => node.id)
      .strength(link => this.getLinkStrength(link))
      .distance(link => this.getLinkDistance(link));
    
    // Center force (pull toward center of visualization)
    this.forceCenter = d3.forceCenter(this.config.centerX, this.config.centerY);
    
    // Collision force (prevent node overlap)
    this.forceCollision = d3.forceCollide()
      .radius(node => this.getCollisionRadius(node))
      .strength(this.config.collisionStrength);
    
    // Add X and Y positioning forces
    this.forceX = d3.forceX(this.config.centerX).strength(this.config.gravityStrength);
    this.forceY = d3.forceY(this.config.centerY).strength(this.config.gravityStrength);
    
    // Apply all forces to simulation
    this.simulation
      .force('charge', this.forceCharge)
      .force('link', this.forceLink)
      .force('center', this.forceCenter)
      .force('collision', this.forceCollision)
      .force('x', this.forceX)
      .force('y', this.forceY);
  }
  
  /**
   * Get charge strength for a node
   * @param {Object} node - Node to get charge for
   * @returns {number} Charge strength
   * @private
   */
  getChargeStrength(node) {
    // Use node-specific charge if available, otherwise use global setting
    if (node.physicProperties && node.physicProperties.charge !== undefined) {
      return node.physicProperties.charge;
    }
    
    return this.config.chargeStrength;
  }
  
  /**
   * Get link strength for a link
   * @param {Object} link - Link to get strength for
   * @returns {number} Link strength
   * @private
   */
  getLinkStrength(link) {
    // Use link-specific strength if available, otherwise use global setting
    if (link.physicProperties && link.physicProperties.strength !== undefined) {
      return link.physicProperties.strength;
    }
    
    return this.config.linkStrength;
  }
  
  /**
   * Get link distance for a link
   * @param {Object} link - Link to get distance for
   * @returns {number} Link distance
   * @private
   */
  getLinkDistance(link) {
    // Use link-specific distance if available, otherwise use global setting
    if (link.physicProperties && link.physicProperties.distance !== undefined) {
      return link.physicProperties.distance;
    }
    
    return this.config.linkDistance;
  }
  
  /**
   * Get collision radius for a node
   * @param {Object} node - Node to get radius for
   * @returns {number} Collision radius
   * @private
   */
  getCollisionRadius(node) {
    // Use node-specific radius if available, otherwise default to 10
    if (node.physicProperties && node.physicProperties.radius !== undefined) {
      return node.physicProperties.radius * 1.2; // Add a bit of padding
    }
    
    return 10;
  }
  
  /**
   * Update data for the simulation
   * @param {Object} data - Data with nodes and links
   * @param {boolean} preservePositions - Whether to preserve existing node positions
   */
  updateData(data, preservePositions = false) {
    const { nodes, links } = data;
    
    // Cache old node positions if preserving
    const positionCache = new Map();
    if (preservePositions && this.nodes) {
      this.nodes.forEach(node => {
        positionCache.set(node.id, { x: node.x, y: node.y, vx: node.vx, vy: node.vy });
      });
    }
    
    // Update nodes and links
    this.nodes = [...nodes];
    this.links = [...links];
    
    // Restore cached positions
    if (preservePositions) {
      this.nodes.forEach(node => {
        const cached = positionCache.get(node.id);
        if (cached) {
          node.x = cached.x;
          node.y = cached.y;
          node.vx = cached.vx;
          node.vy = cached.vy;
        }
      });
    }
    
    // Update simulation data
    this.simulation.nodes(this.nodes);
    this.forceLink.links(this.links);
    
    // Restart simulation
    this.restart();
    
    return this;
  }
  
  /**
   * Handle tick events from the simulation
   * @private
   */
  handleTick() {
    // Apply friction to nodes
    this.nodes.forEach(node => {
      // Skip fixed nodes
      if (node.fx !== undefined || node.fy !== undefined) return;
      
      // Apply custom friction if available
      if (node.physicProperties && node.physicProperties.friction !== undefined) {
        node.vx *= (1 - node.physicProperties.friction);
        node.vy *= (1 - node.physicProperties.friction);
      }
    });
    
    // Apply custom physics constraints if needed
    this.applyCustomPhysics();
    
    // Dispatch the tick event
    this.dispatchEvent('tick');
  }
  
  /**
   * Apply custom physics constraints (e.g., bounded area)
   * @private
   */
  applyCustomPhysics() {
    // Apply boundaries if configured
    if (this.config.constrainToBounds) {
      const padding = 20;
      this.nodes.forEach(node => {
        // Skip fixed nodes
        if (node.fx !== undefined || node.fy !== undefined) return;
        
        const radius = (node.physicProperties && node.physicProperties.radius) || 10;
        
        // Constrain to horizontal bounds
        if (node.x < radius + padding) {
          node.x = radius + padding;
          node.vx = Math.abs(node.vx) * 0.5; // Bounce with energy loss
        } else if (node.x > this.config.width - radius - padding) {
          node.x = this.config.width - radius - padding;
          node.vx = -Math.abs(node.vx) * 0.5; // Bounce with energy loss
        }
        
        // Constrain to vertical bounds
        if (node.y < radius + padding) {
          node.y = radius + padding;
          node.vy = Math.abs(node.vy) * 0.5; // Bounce with energy loss
        } else if (node.y > this.config.height - radius - padding) {
          node.y = this.config.height - radius - padding;
          node.vy = -Math.abs(node.vy) * 0.5; // Bounce with energy loss
        }
      });
    }
    
    // Apply directed forces for patterns with directional behaviors
    this.links.forEach(link => {
      if (link.physicProperties && link.physicProperties.directed && link.physicProperties.directedForce) {
        const sourceNode = this.nodes.find(n => n.id === link.source.id || n.id === link.source);
        const targetNode = this.nodes.find(n => n.id === link.target.id || n.id === link.target);
        
        if (sourceNode && targetNode) {
          // Apply a directional force
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Skip if nodes are at the same position
          if (distance === 0) return;
          
          // Calculate directed force magnitude
          const forceMagnitude = link.physicProperties.directedForce * 0.05;
          
          // Apply force to target node
          targetNode.vx += (dx / distance) * forceMagnitude;
          targetNode.vy += (dy / distance) * forceMagnitude;
        }
      }
    });
  }
  
  /**
   * Restart the simulation
   * @param {number} [alpha] - New alpha value
   */
  restart(alpha) {
    if (alpha !== undefined) {
      this.simulation.alpha(alpha);
    }
    
    this.simulation.restart();
    
    return this;
  }
  
  /**
   * Stop the simulation
   */
  stop() {
    this.simulation.stop();
    return this;
  }
  
  /**
   * Resume the simulation
   */
  resume() {
    this.simulation.restart();
    return this;
  }
  
  /**
   * Fix a node at a specific position
   * @param {string} nodeId - ID of the node to fix
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  fixNode(nodeId, x, y) {
    const node = this.nodes.find(n => n.id === nodeId);
    
    if (node) {
      node.fx = x;
      node.fy = y;
    }
    
    return this;
  }
  
  /**
   * Unfix a node, allowing it to move freely
   * @param {string} nodeId - ID of the node to unfix
   */
  unfixNode(nodeId) {
    const node = this.nodes.find(n => n.id === nodeId);
    
    if (node) {
      node.fx = null;
      node.fy = null;
    }
    
    return this;
  }
  
  /**
   * Add an event listener
   * @param {string} event - Event name ('tick', 'end', or 'start')
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (this.listeners[event] && typeof callback === 'function') {
      this.listeners[event].push(callback);
    }
    
    return this;
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback);
      if (index !== -1) {
        this.listeners[event].splice(index, 1);
      }
    }
    
    return this;
  }
  
  /**
   * Dispatch an event
   * @param {string} event - Event name
   * @private
   */
  dispatchEvent(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(this.nodes, this.links);
        } catch (error) {
          console.error('Error in simulation event listener:', error);
        }
      });
    }
  }
  
  /**
   * Update simulation configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    // Update config
    this.config = {
      ...this.config,
      ...config
    };
    
    // Update simulation properties
    this.simulation
      .alpha(this.config.alpha)
      .alphaMin(this.config.alphaMin)
      .alphaDecay(this.config.alphaDecay)
      .alphaTarget(this.config.alphaTarget)
      .velocityDecay(this.config.velocityDecay);
    
    // Update force center
    this.forceCenter.x(this.config.centerX).y(this.config.centerY);
    
    // Update gravity forces
    this.forceX.x(this.config.centerX).strength(this.config.gravityStrength);
    this.forceY.y(this.config.centerY).strength(this.config.gravityStrength);
    
    // Update collision strength
    this.forceCollision.strength(this.config.collisionStrength);
    
    // Restart simulation
    this.restart();
    
    return this;
  }
  
  /**
   * Apply attraction force between nodes of the same category
   * @param {number} strength - Strength of the attraction
   */
  applyCategoryAttraction(strength = 0.1) {
    // Remove existing category force if present
    this.simulation.force('category', null);
    
    if (strength > 0) {
      // Create a custom force for category attraction
      const categoryForce = alpha => {
        // Group nodes by category
        const categories = {};
        
        this.nodes.forEach(node => {
          if (node.category) {
            if (!categories[node.category]) {
              categories[node.category] = [];
            }
            categories[node.category].push(node);
          }
        });
        
        // Calculate forces for each category
        Object.values(categories).forEach(categoryNodes => {
          // Skip if only one node in category
          if (categoryNodes.length <= 1) return;
          
          // Calculate center of mass for category
          let centerX = 0, centerY = 0;
          categoryNodes.forEach(node => {
            centerX += node.x;
            centerY += node.y;
          });
          centerX /= categoryNodes.length;
          centerY /= categoryNodes.length;
          
          // Apply attraction to center of mass
          categoryNodes.forEach(node => {
            node.vx += (centerX - node.x) * alpha * strength;
            node.vy += (centerY - node.y) * alpha * strength;
          });
        });
      };
      
      // Add the custom force
      this.simulation.force('category', categoryForce);
    }
    
    // Restart simulation
    this.restart();
    
    return this;
  }
  
  /**
   * Apply a clustering force based on node types
   * @param {number} strength - Strength of the clustering force
   */
  applyTypeClustering(strength = 0.2) {
    // Remove existing type force if present
    this.simulation.force('type-cluster', null);
    
    if (strength > 0) {
      // Define position offsets for different types
      const typeOffsets = {
        structural: { x: -this.config.width * 0.25, y: 0 },
        process: { x: 0, y: -this.config.height * 0.25 },
        relationship: { x: this.config.width * 0.25, y: 0 }
      };
      
      // Create a custom force for type clustering
      const typeForce = alpha => {
        this.nodes.forEach(node => {
          // Skip if no type
          if (!node.type || !typeOffsets[node.type]) return;
          
          // Get offset for this type
          const offset = typeOffsets[node.type];
          
          // Apply force toward type center
          node.vx += (this.config.centerX + offset.x - node.x) * alpha * strength;
          node.vy += (this.config.centerY + offset.y - node.y) * alpha * strength;
        });
      };
      
      // Add the custom force
      this.simulation.force('type-cluster', typeForce);
    }
    
    // Restart simulation
    this.restart();
    
    return this;
  }
  
  /**
   * Reset the simulation to its initial state
   */
  reset() {
    // Reset node positions
    this.nodes.forEach(node => {
      node.x = this.config.centerX + (Math.random() - 0.5) * this.config.width * 0.5;
      node.y = this.config.centerY + (Math.random() - 0.5) * this.config.height * 0.5;
      node.vx = 0;
      node.vy = 0;
      node.fx = null;
      node.fy = null;
      
      // Reset fixed status but preserve position for explicitly fixed nodes
      if (node.fixed) {
        node.fx = node.x;
        node.fy = node.y;
      }
    });
    
    // Reset simulation
    this.simulation.alpha(1).restart();
    
    return this;
  }
  
  /**
   * Get the current simulation alpha value
   * @returns {number} Alpha value
   */
  getAlpha() {
    return this.simulation.alpha();
  }
  
  /**
   * Check if the simulation is running
   * @returns {boolean} True if running
   */
  isRunning() {
    return this.simulation.alpha() > this.simulation.alphaMin();
  }
  
  /**
   * Manually trigger a simulation tick
   * @param {number} [steps=1] - Number of steps to simulate
   */
  tick(steps = 1) {
    for (let i = 0; i < steps; i++) {
      this.simulation.tick();
    }
    
    return this;
  }
  
  /**
   * Get node by ID
   * @param {string} nodeId - Node ID
   * @returns {Object|undefined} Node if found
   */
  getNodeById(nodeId) {
    return this.nodes.find(node => node.id === nodeId);
  }
  
  /**
   * Get link by ID
   * @param {string} linkId - Link ID
   * @returns {Object|undefined} Link if found
   */
  getLinkById(linkId) {
    return this.links.find(link => link.id === linkId);
  }
  
  /**
   * Apply a force impulse to a specific node
   * @param {string} nodeId - Node ID
   * @param {number} fx - X force component
   * @param {number} fy - Y force component
   */
  applyImpulse(nodeId, fx, fy) {
    const node = this.getNodeById(nodeId);
    
    if (node && node.fx === undefined && node.fy === undefined) {
      node.vx += fx;
      node.vy += fy;
      
      // Restart simulation if it's stopped
      if (!this.isRunning()) {
        this.restart(0.3);
      }
    }
    
    return this;
  }
  
  /**
   * Apply heat to the simulation (increase energy)
   * @param {number} amount - Amount of heat to add
   */
  applyHeat(amount = 0.3) {
    // Reheat the simulation
    this.simulation.alpha(Math.min(1, this.simulation.alpha() + amount)).restart();
    
    // Add random velocity to nodes
    const velocityJitter = amount * 2;
    this.nodes.forEach(node => {
      if (node.fx === undefined && node.fy === undefined) {
        node.vx += (Math.random() - 0.5) * velocityJitter;
        node.vy += (Math.random() - 0.5) * velocityJitter;
      }
    });
    
    return this;
  }
  
  /**
   * Find nodes near a point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} radius - Search radius
   * @returns {Array} Array of nodes within radius
   */
  findNodesNear(x, y, radius) {
    return this.nodes.filter(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return (dx * dx + dy * dy) <= radius * radius;
    });
  }
  
  /**
   * Cleanup and destroy the simulation
   */
  destroy() {
    // Stop the simulation
    this.simulation.stop();
    
    // Clear event listeners
    this.listeners.tick = [];
    this.listeners.end = [];
    this.listeners.start = [];
    
    // Remove force callbacks
    this.simulation.on('tick', null);
    this.simulation.on('end', null);
    this.simulation.on('start', null);
    
    // Clear references
    this.simulation = null;
    this.nodes = null;
    this.links = null;
  }
}

export default SimulationLayer; 