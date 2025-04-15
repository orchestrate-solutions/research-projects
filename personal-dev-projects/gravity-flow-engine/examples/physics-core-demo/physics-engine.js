/**
 * Gravity Flow Engine - Core Physics Implementation
 * 
 * This file implements the mathematical foundation of the physics engine
 * without any visualization components.
 */

class PhysicsEngine {
  constructor(nodes, links, options = {}) {
    // Deep clone nodes and add required physics properties
    this.nodes = nodes.map(node => ({
      ...node,
      x: node.x || Math.random() * 1000,
      y: node.y || Math.random() * 1000,
      vx: 0,
      vy: 0,
      fx: null,
      fy: null
    }));
    
    // Convert link references to actual node objects
    this.links = links.map(link => ({
      ...link,
      source: typeof link.source === 'string' ? this.findNodeById(link.source) : link.source,
      target: typeof link.target === 'string' ? this.findNodeById(link.target) : link.target
    }));
    
    // Physics parameters
    this.options = {
      alpha: 1.0,              // Current "temperature" of simulation
      alphaMin: 0.001,         // Minimum alpha before simulation stops
      alphaDecay: 0.0228,      // Alpha reduction per tick
      alphaTarget: 0,          // Target alpha value
      velocityDecay: 0.4,      // Node velocity decay factor (drag)
      ...options
    };
    
    this.forces = {};
    this.tickCount = 0;
  }
  
  findNodeById(id) {
    return this.nodes.find(n => n.id === id);
  }
  
  // Register a force function
  addForce(name, forceFn) {
    this.forces[name] = forceFn;
    return this;
  }
  
  // Core physics integration step using Velocity Verlet
  tick() {
    // Skip if simulation has cooled down
    if (this.options.alpha < this.options.alphaMin) return false;
    
    this.tickCount++;
    
    // Apply forces to calculate acceleration
    Object.values(this.forces).forEach(force => {
      force(this.options.alpha);
    });
    
    // Update positions using Velocity Verlet integration
    this.nodes.forEach(node => {
      if (node.fx !== null) {
        node.x = node.fx;
        node.vx = 0;
      } else {
        node.vx *= this.options.velocityDecay;
        node.x += node.vx;
      }
      
      if (node.fy !== null) {
        node.y = node.fy;
        node.vy = 0;
      } else {
        node.vy *= this.options.velocityDecay;
        node.y += node.vy;
      }
    });
    
    // Cool down simulation
    this.options.alpha += (this.options.alphaTarget - this.options.alpha) * this.options.alphaDecay;
    
    return true;
  }
  
  // Standard forces implementation
  
  // Repulsive force between nodes (like charges)
  createManyBodyForce(strength = -30) {
    return (alpha) => {
      for (let i = 0; i < this.nodes.length; i++) {
        const node1 = this.nodes[i];
        
        for (let j = i + 1; j < this.nodes.length; j++) {
          const node2 = this.nodes[j];
          
          // Calculate distance vector
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distanceSquared = dx * dx + dy * dy;
          
          // Skip if nodes are at the same position
          if (distanceSquared === 0) continue;
          
          // Calculate repulsive force (inverse square law)
          const distance = Math.sqrt(distanceSquared);
          const force = strength * node1.physicalProperties.charge * node2.physicalProperties.charge / distanceSquared;
          
          // Apply force to both nodes (Newton's third law)
          const unitX = dx / distance;
          const unitY = dy / distance;
          
          node1.vx -= unitX * force * alpha;
          node1.vy -= unitY * force * alpha;
          node2.vx += unitX * force * alpha;
          node2.vy += unitY * force * alpha;
        }
      }
    };
  }
  
  // Spring force between linked nodes
  createLinkForce() {
    return (alpha) => {
      this.links.forEach(link => {
        const source = link.source;
        const target = link.target;
        
        // Calculate distance vector
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Skip if nodes are at the same position
        if (distance === 0) return;
        
        // Calculate spring force (Hooke's law)
        const naturalLength = link.physicalProperties.length;
        const stiffness = link.physicalProperties.stiffness;
        const displacement = distance - naturalLength;
        const springForce = stiffness * displacement;
        
        // Apply force proportional to displacement
        const unitX = dx / distance;
        const unitY = dy / distance;
        
        const fx = springForce * unitX * alpha;
        const fy = springForce * unitY * alpha;
        
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      });
    };
  }
  
  // Force that pushes nodes toward a center point
  createCenterForce(centerX, centerY, strength = 0.1) {
    return (alpha) => {
      this.nodes.forEach(node => {
        node.vx += (centerX - node.x) * strength * alpha;
        node.vy += (centerY - node.y) * strength * alpha;
      });
    };
  }
  
  // Collision detection force
  createCollisionForce() {
    return (alpha) => {
      for (let i = 0; i < this.nodes.length; i++) {
        const node1 = this.nodes[i];
        const radius1 = node1.physicalProperties.radius;
        
        for (let j = i + 1; j < this.nodes.length; j++) {
          const node2 = this.nodes[j];
          const radius2 = node2.physicalProperties.radius;
          
          // Calculate distance vector
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Skip if nodes are far apart
          const minDistance = radius1 + radius2;
          if (distance >= minDistance) continue;
          
          // Calculate collision response
          const unitX = dx / distance;
          const unitY = dy / distance;
          
          // Move nodes apart
          const separation = minDistance - distance;
          const moveX = unitX * separation * 0.5;
          const moveY = unitY * separation * 0.5;
          
          node1.vx -= moveX * alpha;
          node1.vy -= moveY * alpha;
          node2.vx += moveX * alpha;
          node2.vy += moveY * alpha;
        }
      }
    };
  }
  
  // Initialize the physics engine with standard forces
  initializeStandardForces(width, height) {
    return this
      .addForce("charge", this.createManyBodyForce())
      .addForce("link", this.createLinkForce())
      .addForce("center", this.createCenterForce(width/2, height/2))
      .addForce("collision", this.createCollisionForce());
  }
  
  // Run simulation for a certain number of steps
  runSimulation(steps) {
    let i = 0;
    for (i = 0; i < steps; i++) {
      if (!this.tick()) break;
    }
    return {
      nodes: this.nodes,
      completedSteps: i,
      alpha: this.options.alpha
    };
  }
  
  // Get current state of the simulation
  getState() {
    return {
      nodes: this.nodes.map(n => ({
        id: n.id,
        x: n.x,
        y: n.y,
        vx: n.vx,
        vy: n.vy,
        category: n.category
      })),
      links: this.links.map(l => ({
        source: l.source.id,
        target: l.target.id,
        length: l.physicalProperties.length
      })),
      tickCount: this.tickCount,
      alpha: this.options.alpha
    };
  }
}

module.exports = PhysicsEngine; 