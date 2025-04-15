/**
 * Data Model
 * Provides the core data structures for patterns and relationships
 * Handles mapping between pattern characteristics and physics properties
 */

// Pattern & Relationship Types
const PATTERN_TYPES = {
  STRUCTURAL: 'structural',
  PROCESS: 'process',
  RELATIONSHIP: 'relationship',
};

const PATTERN_CATEGORIES = {
  // Structural categories
  CONTAINER: 'container',
  NETWORK: 'network',
  HIERARCHY: 'hierarchy',
  FRACTAL: 'fractal',
  
  // Process categories
  FLOW: 'flow',
  FEEDBACK: 'feedback',
  OSCILLATION: 'oscillation',
  EMERGENCE: 'emergence',
  
  // Relationship categories
  CONNECTION: 'connection',
  TRANSFORMATION: 'transformation',
  BALANCE: 'balance',
  INFLUENCE: 'influence',
};

// Physics Property Templates
const PHYSICS_TEMPLATES = {
  // Structural pattern physics
  [PATTERN_CATEGORIES.CONTAINER]: {
    nodePhysics: {
      mass: 5,
      charge: -300,
      radius: 25,
      friction: 0.2,
      color: 0x4292c6,
    },
    linkPhysics: {
      strength: 0.2,
      distance: 100,
      width: 2,
      color: 0xaaaaaa,
    }
  },
  [PATTERN_CATEGORIES.NETWORK]: {
    nodePhysics: {
      mass: 2,
      charge: -200,
      radius: 12,
      friction: 0.5,
      color: 0x7fbc41,
    },
    linkPhysics: {
      strength: 0.5,
      distance: 50,
      width: 1.5,
      color: 0x999999,
    }
  },
  [PATTERN_CATEGORIES.HIERARCHY]: {
    nodePhysics: {
      mass: 3,
      charge: -400,
      radius: 15,
      friction: 0.3,
      color: 0xde2d26,
    },
    linkPhysics: {
      strength: 0.7,
      distance: 80,
      width: 2,
      color: 0x777777,
    }
  },
  [PATTERN_CATEGORIES.FRACTAL]: {
    nodePhysics: {
      mass: 1.5,
      charge: -150,
      radius: 10,
      friction: 0.4,
      color: 0x756bb1,
    },
    linkPhysics: {
      strength: 0.3,
      distance: 40,
      width: 1,
      color: 0xbbbbbb,
    }
  },
  
  // Process pattern physics
  [PATTERN_CATEGORIES.FLOW]: {
    nodePhysics: {
      mass: 2,
      charge: -250,
      radius: 12,
      friction: 0.1,
      color: 0x41b6c4,
    },
    linkPhysics: {
      strength: 0.6,
      distance: 70,
      width: 2.5,
      color: 0x666666,
      directed: true,
    }
  },
  [PATTERN_CATEGORIES.FEEDBACK]: {
    nodePhysics: {
      mass: 3,
      charge: -200,
      radius: 14,
      friction: 0.3,
      color: 0xfd8d3c,
    },
    linkPhysics: {
      strength: 0.8,
      distance: 60,
      width: 2,
      color: 0x555555,
      directed: true,
      curved: true,
    }
  },
  [PATTERN_CATEGORIES.OSCILLATION]: {
    nodePhysics: {
      mass: 1.5,
      charge: -180,
      radius: 12,
      friction: 0.1,
      color: 0xf768a1,
    },
    linkPhysics: {
      strength: 0.4,
      distance: 50,
      width: 1.5,
      color: 0x999999,
      oscillating: true,
    }
  },
  [PATTERN_CATEGORIES.EMERGENCE]: {
    nodePhysics: {
      mass: 1,
      charge: -150,
      radius: 10,
      friction: 0.2,
      color: 0x807dba,
    },
    linkPhysics: {
      strength: 0.2,
      distance: 40,
      width: 1,
      color: 0xcccccc,
    }
  },
  
  // Relationship pattern physics
  [PATTERN_CATEGORIES.CONNECTION]: {
    nodePhysics: {
      mass: 2,
      charge: -200,
      radius: 12,
      friction: 0.3,
      color: 0x74c476,
    },
    linkPhysics: {
      strength: 0.6,
      distance: 60,
      width: 2,
      color: 0x888888,
    }
  },
  [PATTERN_CATEGORIES.TRANSFORMATION]: {
    nodePhysics: {
      mass: 2.5,
      charge: -220,
      radius: 13,
      friction: 0.4,
      color: 0xfec44f,
    },
    linkPhysics: {
      strength: 0.5,
      distance: 70,
      width: 2,
      color: 0x999999,
      directed: true,
    }
  },
  [PATTERN_CATEGORIES.BALANCE]: {
    nodePhysics: {
      mass: 3,
      charge: -250,
      radius: 15,
      friction: 0.5,
      color: 0xd95f0e,
    },
    linkPhysics: {
      strength: 0.7,
      distance: 80,
      width: 1.5,
      color: 0x777777,
    }
  },
  [PATTERN_CATEGORIES.INFLUENCE]: {
    nodePhysics: {
      mass: 2,
      charge: -180,
      radius: 12,
      friction: 0.3,
      color: 0x9ecae1,
    },
    linkPhysics: {
      strength: 0.4,
      distance: 60,
      width: 1.5,
      color: 0xaaaaaa,
      directed: true,
      weighted: true,
    }
  },
  
  // Default physics (used as fallback)
  default: {
    nodePhysics: {
      mass: 2,
      charge: -200,
      radius: 12,
      friction: 0.3,
      color: 0x999999,
    },
    linkPhysics: {
      strength: 0.5,
      distance: 60,
      width: 1.5,
      color: 0xcccccc,
    }
  }
};

/**
 * Pattern class representing a single pattern node
 */
class Pattern {
  /**
   * Create a new pattern
   * @param {Object} data - Pattern data
   */
  constructor(data = {}) {
    // Required properties
    this.id = data.id || `pattern-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.name = data.name || 'Unnamed Pattern';
    
    // Pattern metadata
    this.type = data.type || PATTERN_TYPES.STRUCTURAL;
    this.category = data.category || PATTERN_CATEGORIES.NETWORK;
    this.description = data.description || '';
    this.tags = data.tags || [];
    
    // Visual & interactive properties
    this.x = data.x !== undefined ? data.x : Math.random() * 500;
    this.y = data.y !== undefined ? data.y : Math.random() * 500;
    this.vx = data.vx || 0;
    this.vy = data.vy || 0;
    this.fixed = data.fixed || false;
    
    // Calculate physics properties based on pattern type/category
    this.physicProperties = this.calculatePhysicsProperties(data.physicProperties);
    
    // Store custom data
    this.data = data.data || {};
  }
  
  /**
   * Calculate physics properties based on pattern type and category
   * @param {Object} customProps - Custom physics properties to override defaults
   * @returns {Object} Combined physics properties
   * @private
   */
  calculatePhysicsProperties(customProps = {}) {
    // Find the template based on category
    const template = PHYSICS_TEMPLATES[this.category] || PHYSICS_TEMPLATES.default;
    
    // Apply node physics from template
    const physics = {
      ...template.nodePhysics,
      // Allow custom overrides
      ...customProps
    };
    
    return physics;
  }
  
  /**
   * Update pattern physics properties
   * @param {Object} props - New physics properties
   */
  updatePhysics(props) {
    this.physicProperties = {
      ...this.physicProperties,
      ...props
    };
  }
  
  /**
   * Export pattern as simple object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      description: this.description,
      tags: [...this.tags],
      x: this.x,
      y: this.y,
      fixed: this.fixed,
      physicProperties: { ...this.physicProperties },
      data: { ...this.data }
    };
  }
}

/**
 * Relationship class representing a link between two patterns
 */
class Relationship {
  /**
   * Create a new relationship
   * @param {Object} data - Relationship data
   */
  constructor(data = {}) {
    // Required properties
    this.id = data.id || `rel-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.source = data.source; // Pattern ID or Pattern object
    this.target = data.target; // Pattern ID or Pattern object
    
    // Relationship metadata
    this.type = data.type || 'connection';
    this.name = data.name || '';
    this.description = data.description || '';
    this.directed = data.directed !== undefined ? data.directed : false;
    this.weight = data.weight !== undefined ? data.weight : 1;
    
    // Calculate physics properties based on relationship type
    this.physicProperties = this.calculatePhysicsProperties(data.physicProperties);
    
    // Store custom data
    this.data = data.data || {};
  }
  
  /**
   * Calculate physics properties based on relationship type
   * @param {Object} customProps - Custom physics properties to override defaults
   * @returns {Object} Combined physics properties
   * @private
   */
  calculatePhysicsProperties(customProps = {}) {
    // Find source and target categories to determine relationship physics
    let sourceCategory, targetCategory;
    
    if (typeof this.source === 'object' && this.source !== null) {
      sourceCategory = this.source.category;
    }
    
    if (typeof this.target === 'object' && this.target !== null) {
      targetCategory = this.target.category;
    }
    
    // Find appropriate template - use source category if available
    let template;
    if (sourceCategory && PHYSICS_TEMPLATES[sourceCategory]) {
      template = PHYSICS_TEMPLATES[sourceCategory];
    } else if (targetCategory && PHYSICS_TEMPLATES[targetCategory]) {
      template = PHYSICS_TEMPLATES[targetCategory];
    } else {
      template = PHYSICS_TEMPLATES.default;
    }
    
    // Apply link physics from template
    const physics = {
      ...template.linkPhysics,
      // Scale strength and distance based on weight if applicable
      strength: template.linkPhysics.strength * this.weight,
      distance: template.linkPhysics.distance * (1 / Math.sqrt(this.weight)),
      // Allow custom overrides
      ...customProps
    };
    
    return physics;
  }
  
  /**
   * Update relationship physics properties
   * @param {Object} props - New physics properties
   */
  updatePhysics(props) {
    this.physicProperties = {
      ...this.physicProperties,
      ...props
    };
  }
  
  /**
   * Export relationship as simple object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      source: typeof this.source === 'object' ? this.source.id : this.source,
      target: typeof this.target === 'object' ? this.target.id : this.target,
      type: this.type,
      name: this.name,
      description: this.description,
      directed: this.directed,
      weight: this.weight,
      physicProperties: { ...this.physicProperties },
      data: { ...this.data }
    };
  }
}

/**
 * DataModel class for managing patterns and relationships
 */
class DataModel {
  constructor() {
    this.patterns = new Map();
    this.relationships = new Map();
    this.listeners = [];
  }
  
  /**
   * Add a pattern to the model
   * @param {Object|Pattern} pattern - Pattern to add
   * @returns {Pattern} Added pattern
   */
  addPattern(pattern) {
    // Convert plain object to Pattern instance if needed
    const patternInstance = pattern instanceof Pattern ? pattern : new Pattern(pattern);
    
    // Add to collection
    this.patterns.set(patternInstance.id, patternInstance);
    
    // Notify listeners
    this.notifyListeners('pattern-added', patternInstance);
    
    return patternInstance;
  }
  
  /**
   * Get a pattern by ID
   * @param {string} id - Pattern ID
   * @returns {Pattern|undefined} Pattern or undefined if not found
   */
  getPattern(id) {
    return this.patterns.get(id);
  }
  
  /**
   * Update a pattern
   * @param {string} id - Pattern ID
   * @param {Object} data - Updated pattern data
   * @returns {Pattern|undefined} Updated pattern or undefined if not found
   */
  updatePattern(id, data) {
    const pattern = this.patterns.get(id);
    if (!pattern) return undefined;
    
    // Update pattern properties
    Object.assign(pattern, data);
    
    // Update physics if provided
    if (data.physicProperties) {
      pattern.updatePhysics(data.physicProperties);
    }
    
    // Notify listeners
    this.notifyListeners('pattern-updated', pattern);
    
    return pattern;
  }
  
  /**
   * Remove a pattern
   * @param {string} id - Pattern ID
   * @returns {boolean} True if removed, false if not found
   */
  removePattern(id) {
    const pattern = this.patterns.get(id);
    if (!pattern) return false;
    
    // Remove associated relationships
    this.getRelationshipsForPattern(id).forEach(rel => {
      this.relationships.delete(rel.id);
    });
    
    // Remove pattern
    const result = this.patterns.delete(id);
    
    // Notify listeners
    if (result) {
      this.notifyListeners('pattern-removed', pattern);
    }
    
    return result;
  }
  
  /**
   * Add a relationship to the model
   * @param {Object|Relationship} relationship - Relationship to add
   * @returns {Relationship} Added relationship
   */
  addRelationship(relationship) {
    // Convert plain object to Relationship instance if needed
    const relationshipInstance = relationship instanceof Relationship 
      ? relationship 
      : new Relationship(relationship);
    
    // Resolve source and target to pattern objects if they're IDs
    if (typeof relationshipInstance.source === 'string') {
      const sourcePattern = this.patterns.get(relationshipInstance.source);
      if (sourcePattern) {
        relationshipInstance.source = sourcePattern;
      }
    }
    
    if (typeof relationshipInstance.target === 'string') {
      const targetPattern = this.patterns.get(relationshipInstance.target);
      if (targetPattern) {
        relationshipInstance.target = targetPattern;
      }
    }
    
    // Recalculate physics based on resolved patterns
    relationshipInstance.physicProperties = relationshipInstance.calculatePhysicsProperties();
    
    // Add to collection
    this.relationships.set(relationshipInstance.id, relationshipInstance);
    
    // Notify listeners
    this.notifyListeners('relationship-added', relationshipInstance);
    
    return relationshipInstance;
  }
  
  /**
   * Get a relationship by ID
   * @param {string} id - Relationship ID
   * @returns {Relationship|undefined} Relationship or undefined if not found
   */
  getRelationship(id) {
    return this.relationships.get(id);
  }
  
  /**
   * Update a relationship
   * @param {string} id - Relationship ID
   * @param {Object} data - Updated relationship data
   * @returns {Relationship|undefined} Updated relationship or undefined if not found
   */
  updateRelationship(id, data) {
    const relationship = this.relationships.get(id);
    if (!relationship) return undefined;
    
    // Update relationship properties
    Object.assign(relationship, data);
    
    // Update physics if provided
    if (data.physicProperties) {
      relationship.updatePhysics(data.physicProperties);
    }
    
    // Notify listeners
    this.notifyListeners('relationship-updated', relationship);
    
    return relationship;
  }
  
  /**
   * Remove a relationship
   * @param {string} id - Relationship ID
   * @returns {boolean} True if removed, false if not found
   */
  removeRelationship(id) {
    const relationship = this.relationships.get(id);
    if (!relationship) return false;
    
    // Remove relationship
    const result = this.relationships.delete(id);
    
    // Notify listeners
    if (result) {
      this.notifyListeners('relationship-removed', relationship);
    }
    
    return result;
  }
  
  /**
   * Get all relationships connected to a pattern
   * @param {string} patternId - Pattern ID
   * @returns {Array} Array of relationships
   */
  getRelationshipsForPattern(patternId) {
    const result = [];
    
    this.relationships.forEach(rel => {
      const sourceId = typeof rel.source === 'object' ? rel.source.id : rel.source;
      const targetId = typeof rel.target === 'object' ? rel.target.id : rel.target;
      
      if (sourceId === patternId || targetId === patternId) {
        result.push(rel);
      }
    });
    
    return result;
  }
  
  /**
   * Convert the data model to a format suitable for D3 force simulation
   * @returns {Object} Object with nodes and links arrays
   */
  toSimulationData() {
    // Convert patterns to nodes
    const nodes = Array.from(this.patterns.values()).map(pattern => ({
      ...pattern.toJSON(),
      id: pattern.id,
      x: pattern.x,
      y: pattern.y,
      fx: pattern.fixed ? pattern.x : undefined,
      fy: pattern.fixed ? pattern.y : undefined
    }));
    
    // Convert relationships to links
    const links = Array.from(this.relationships.values()).map(rel => {
      const source = typeof rel.source === 'object' ? rel.source.id : rel.source;
      const target = typeof rel.target === 'object' ? rel.target.id : rel.target;
      
      return {
        ...rel.toJSON(),
        id: rel.id,
        source,
        target,
      };
    });
    
    return { nodes, links };
  }
  
  /**
   * Import data from JSON
   * @param {Object} data - Data with nodes and links
   */
  fromJSON(data) {
    // Clear existing data
    this.patterns.clear();
    this.relationships.clear();
    
    // Import patterns/nodes
    if (data.nodes) {
      data.nodes.forEach(node => {
        this.addPattern(node);
      });
    }
    
    // Import relationships/links
    if (data.links) {
      data.links.forEach(link => {
        this.addRelationship(link);
      });
    }
    
    // Notify listeners
    this.notifyListeners('data-loaded', { patterns: this.patterns.size, relationships: this.relationships.size });
  }
  
  /**
   * Export data as JSON
   * @returns {Object} Data with nodes and links arrays
   */
  toJSON() {
    const nodes = Array.from(this.patterns.values()).map(pattern => pattern.toJSON());
    const links = Array.from(this.relationships.values()).map(rel => rel.toJSON());
    
    return { nodes, links };
  }
  
  /**
   * Add a listener for data changes
   * @param {Function} listener - Callback function
   */
  addListener(listener) {
    if (typeof listener === 'function' && !this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }
  
  /**
   * Remove a listener
   * @param {Function} listener - Callback function to remove
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Notify all listeners of a change
   * @param {string} event - Event type
   * @param {*} data - Event data
   * @private
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in data model listener:', error);
      }
    });
  }
  
  /**
   * Get statistics about the data model
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      patternCount: this.patterns.size,
      relationshipCount: this.relationships.size,
      patternTypes: this.getPatternTypeCounts(),
      patternCategories: this.getPatternCategoryCounts()
    };
  }
  
  /**
   * Get counts of pattern types
   * @returns {Object} Type counts
   * @private
   */
  getPatternTypeCounts() {
    const typeCounts = {
      [PATTERN_TYPES.STRUCTURAL]: 0,
      [PATTERN_TYPES.PROCESS]: 0,
      [PATTERN_TYPES.RELATIONSHIP]: 0
    };
    
    this.patterns.forEach(pattern => {
      if (typeCounts[pattern.type] !== undefined) {
        typeCounts[pattern.type]++;
      }
    });
    
    return typeCounts;
  }
  
  /**
   * Get counts of pattern categories
   * @returns {Object} Category counts
   * @private
   */
  getPatternCategoryCounts() {
    const categoryCounts = {};
    
    // Initialize all categories to 0
    Object.values(PATTERN_CATEGORIES).forEach(category => {
      categoryCounts[category] = 0;
    });
    
    // Count patterns in each category
    this.patterns.forEach(pattern => {
      if (categoryCounts[pattern.category] !== undefined) {
        categoryCounts[pattern.category]++;
      }
    });
    
    return categoryCounts;
  }
  
  /**
   * Filter patterns by type or category
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered patterns
   */
  filterPatterns(filters = {}) {
    const result = [];
    
    this.patterns.forEach(pattern => {
      let include = true;
      
      if (filters.type && pattern.type !== filters.type) {
        include = false;
      }
      
      if (filters.category && pattern.category !== filters.category) {
        include = false;
      }
      
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => pattern.tags.includes(tag));
        if (!hasTag) {
          include = false;
        }
      }
      
      if (include) {
        result.push(pattern);
      }
    });
    
    return result;
  }
  
  /**
   * Create a complete example dataset
   * @returns {DataModel} This data model instance
   */
  createExampleData() {
    // Clear any existing data
    this.patterns.clear();
    this.relationships.clear();
    
    // Create structural patterns
    const container = this.addPattern({
      name: 'Bounded Context',
      type: PATTERN_TYPES.STRUCTURAL,
      category: PATTERN_CATEGORIES.CONTAINER,
      description: 'A bounded context defines the boundaries within which a particular model is defined and applicable.',
      tags: ['domain', 'boundary', 'context']
    });
    
    const network = this.addPattern({
      name: 'Microservices',
      type: PATTERN_TYPES.STRUCTURAL,
      category: PATTERN_CATEGORIES.NETWORK,
      description: 'Architecture pattern where application components are broken down into small, independent services.',
      tags: ['architecture', 'services', 'distributed']
    });
    
    const hierarchy = this.addPattern({
      name: 'Component Hierarchy',
      type: PATTERN_TYPES.STRUCTURAL,
      category: PATTERN_CATEGORIES.HIERARCHY,
      description: 'Organization of components into parent-child relationships forming a tree structure.',
      tags: ['components', 'structure', 'organization']
    });
    
    const fractal = this.addPattern({
      name: 'Self-Similar Teams',
      type: PATTERN_TYPES.STRUCTURAL,
      category: PATTERN_CATEGORIES.FRACTAL,
      description: 'Team organization pattern where teams have similar structure at different scales.',
      tags: ['teams', 'organization', 'scaling']
    });
    
    // Create process patterns
    const flow = this.addPattern({
      name: 'Continuous Delivery',
      type: PATTERN_TYPES.PROCESS,
      category: PATTERN_CATEGORIES.FLOW,
      description: 'Practice of automating the software delivery process.',
      tags: ['delivery', 'automation', 'pipeline']
    });
    
    const feedback = this.addPattern({
      name: 'Retrospective',
      type: PATTERN_TYPES.PROCESS,
      category: PATTERN_CATEGORIES.FEEDBACK,
      description: 'Regular meeting to reflect on past work and identify improvements.',
      tags: ['improvement', 'learning', 'reflection']
    });
    
    const oscillation = this.addPattern({
      name: 'Exploration-Exploitation',
      type: PATTERN_TYPES.PROCESS,
      category: PATTERN_CATEGORIES.OSCILLATION,
      description: 'Pattern of alternating between exploring new possibilities and exploiting known solutions.',
      tags: ['balance', 'innovation', 'optimization']
    });
    
    const emergence = this.addPattern({
      name: 'Emergent Architecture',
      type: PATTERN_TYPES.PROCESS,
      category: PATTERN_CATEGORIES.EMERGENCE,
      description: 'Architecture that evolves over time rather than being fully designed upfront.',
      tags: ['evolution', 'emergence', 'adaptation']
    });
    
    // Create relationship patterns
    const connection = this.addPattern({
      name: 'API Gateway',
      type: PATTERN_TYPES.RELATIONSHIP,
      category: PATTERN_CATEGORIES.CONNECTION,
      description: 'Single entry point for all clients, routing requests to appropriate services.',
      tags: ['api', 'routing', 'gateway']
    });
    
    const transformation = this.addPattern({
      name: 'Data Transformation',
      type: PATTERN_TYPES.RELATIONSHIP,
      category: PATTERN_CATEGORIES.TRANSFORMATION,
      description: 'Process of converting data from one format or structure to another.',
      tags: ['data', 'conversion', 'mapping']
    });
    
    const balance = this.addPattern({
      name: 'Load Balancer',
      type: PATTERN_TYPES.RELATIONSHIP,
      category: PATTERN_CATEGORIES.BALANCE,
      description: 'Distributes network traffic across multiple servers to ensure reliability and availability.',
      tags: ['distribution', 'reliability', 'availability']
    });
    
    const influence = this.addPattern({
      name: 'Event Sourcing',
      type: PATTERN_TYPES.RELATIONSHIP,
      category: PATTERN_CATEGORIES.INFLUENCE,
      description: 'Capturing changes as a sequence of events rather than just the current state.',
      tags: ['events', 'state', 'history']
    });
    
    // Create relationships between patterns
    this.addRelationship({
      source: container.id,
      target: network.id,
      name: 'Contains',
      description: 'Bounded contexts can contain multiple microservices',
      directed: true,
      weight: 1.5
    });
    
    this.addRelationship({
      source: network.id,
      target: hierarchy.id,
      name: 'Organizes',
      description: 'Microservices can be organized in component hierarchies',
      directed: true,
      weight: 1
    });
    
    this.addRelationship({
      source: hierarchy.id,
      target: fractal.id,
      name: 'Exhibits',
      description: 'Component hierarchies often exhibit fractal self-similarity',
      directed: false,
      weight: 0.7
    });
    
    this.addRelationship({
      source: flow.id,
      target: feedback.id,
      name: 'Incorporates',
      description: 'Continuous delivery incorporates feedback loops',
      directed: true,
      weight: 1.2
    });
    
    this.addRelationship({
      source: feedback.id,
      target: oscillation.id,
      name: 'Drives',
      description: 'Feedback drives oscillation between exploration and exploitation',
      directed: true,
      weight: 0.8
    });
    
    this.addRelationship({
      source: oscillation.id,
      target: emergence.id,
      name: 'Enables',
      description: 'Oscillation enables emergent architecture',
      directed: true,
      weight: 1
    });
    
    this.addRelationship({
      source: connection.id,
      target: network.id,
      name: 'Connects',
      description: 'API gateway connects microservices',
      directed: false,
      weight: 1.3
    });
    
    this.addRelationship({
      source: transformation.id,
      target: flow.id,
      name: 'Supports',
      description: 'Data transformation supports continuous delivery pipeline',
      directed: true,
      weight: 0.9
    });
    
    this.addRelationship({
      source: balance.id,
      target: network.id,
      name: 'Balances',
      description: 'Load balancer distributes traffic among microservices',
      directed: true,
      weight: 1.2
    });
    
    this.addRelationship({
      source: influence.id,
      target: feedback.id,
      name: 'Provides',
      description: 'Event sourcing provides data for feedback loops',
      directed: true,
      weight: 0.8
    });
    
    // Cross-category relationships to show interesting force dynamics
    this.addRelationship({
      source: container.id,
      target: influence.id,
      name: 'Constrains',
      description: 'Bounded contexts constrain event flows',
      directed: true,
      weight: 0.6
    });
    
    this.addRelationship({
      source: emergence.id,
      target: fractal.id,
      name: 'Results in',
      description: 'Emergent architecture often results in fractal structures',
      directed: true,
      weight: 0.7
    });
    
    this.addRelationship({
      source: balance.id,
      target: oscillation.id,
      name: 'Stabilizes',
      description: 'Load balancing stabilizes oscillation patterns',
      directed: true,
      weight: 0.5
    });
    
    // Notify listeners of bulk load
    this.notifyListeners('data-loaded', { patterns: this.patterns.size, relationships: this.relationships.size });
    
    return this;
  }
}

// Export constants and classes
export {
  PATTERN_TYPES,
  PATTERN_CATEGORIES,
  PHYSICS_TEMPLATES,
  Pattern,
  Relationship,
  DataModel
}; 