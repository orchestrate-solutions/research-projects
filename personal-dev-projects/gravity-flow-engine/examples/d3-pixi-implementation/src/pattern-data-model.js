/**
 * Pattern Data Model
 * Defines the data structure for patterns, relationships, and their physical properties.
 * Provides methods for managing the pattern collection and calculating derived properties.
 */

class PatternDataModel {
  constructor() {
    // Storage for patterns and relationships
    this.patterns = new Map();
    this.relationships = new Map();
    
    // Pattern categories lookup
    this.categories = new Set();
    
    // Calculated metrics
    this.metrics = {
      patternCount: 0,
      relationshipCount: 0,
      categoryDistribution: {},
      maxConnections: 0,
      averageConnections: 0,
      densityFactor: 0
    };
  }
  
  /**
   * Add a pattern to the data model
   * @param {Object} pattern - Pattern object with required fields
   * @returns {PatternDataModel} - Instance for chaining
   */
  addPattern(pattern) {
    // Ensure required fields
    if (!pattern.id) {
      throw new Error('Pattern must have an id');
    }
    
    // Create a default physical properties object if not provided
    if (!pattern.physicProperties) {
      pattern.physicProperties = this.generateDefaultPhysicalProperties(pattern);
    }
    
    // Store pattern
    this.patterns.set(pattern.id, pattern);
    
    // Track category
    if (pattern.category) {
      this.categories.add(pattern.category);
    }
    
    // Update metrics
    this.updateMetrics();
    
    return this;
  }
  
  /**
   * Add multiple patterns
   * @param {Array} patterns - Array of pattern objects
   * @returns {PatternDataModel} - Instance for chaining
   */
  addPatterns(patterns) {
    if (!Array.isArray(patterns)) {
      throw new Error('Expected array of patterns');
    }
    
    patterns.forEach(pattern => this.addPattern(pattern));
    return this;
  }
  
  /**
   * Add a relationship between patterns
   * @param {Object} relationship - Relationship object with source, target, and optional fields
   * @returns {PatternDataModel} - Instance for chaining
   */
  addRelationship(relationship) {
    // Ensure required fields
    if (!relationship.source || !relationship.target) {
      throw new Error('Relationship must have source and target');
    }
    
    // Generate ID if not provided
    if (!relationship.id) {
      const sourceId = typeof relationship.source === 'object' ? relationship.source.id : relationship.source;
      const targetId = typeof relationship.target === 'object' ? relationship.target.id : relationship.target;
      relationship.id = `${sourceId}-${targetId}`;
    }
    
    // Create a default physical properties object if not provided
    if (!relationship.physicProperties) {
      relationship.physicProperties = this.generateDefaultRelationshipPhysicalProperties(relationship);
    }
    
    // Store relationship
    this.relationships.set(relationship.id, relationship);
    
    // Update metrics
    this.updateMetrics();
    
    return this;
  }
  
  /**
   * Add multiple relationships
   * @param {Array} relationships - Array of relationship objects
   * @returns {PatternDataModel} - Instance for chaining
   */
  addRelationships(relationships) {
    if (!Array.isArray(relationships)) {
      throw new Error('Expected array of relationships');
    }
    
    relationships.forEach(relationship => this.addRelationship(relationship));
    return this;
  }
  
  /**
   * Remove a pattern and its relationships
   * @param {string} patternId - ID of pattern to remove
   * @returns {PatternDataModel} - Instance for chaining
   */
  removePattern(patternId) {
    if (this.patterns.has(patternId)) {
      // Remove the pattern
      this.patterns.delete(patternId);
      
      // Find and remove all relationships involving this pattern
      const relationshipsToRemove = [];
      
      this.relationships.forEach((relationship, id) => {
        const sourceId = typeof relationship.source === 'object' ? relationship.source.id : relationship.source;
        const targetId = typeof relationship.target === 'object' ? relationship.target.id : relationship.target;
        
        if (sourceId === patternId || targetId === patternId) {
          relationshipsToRemove.push(id);
        }
      });
      
      relationshipsToRemove.forEach(id => this.relationships.delete(id));
      
      // Update metrics
      this.updateMetrics();
    }
    
    return this;
  }
  
  /**
   * Remove a relationship
   * @param {string} relationshipId - ID of relationship to remove
   * @returns {PatternDataModel} - Instance for chaining
   */
  removeRelationship(relationshipId) {
    if (this.relationships.has(relationshipId)) {
      this.relationships.delete(relationshipId);
      this.updateMetrics();
    }
    
    return this;
  }
  
  /**
   * Generate default physical properties for a pattern
   * based on its category and other metadata
   * @param {Object} pattern - Pattern object
   * @returns {Object} Physical properties
   */
  generateDefaultPhysicalProperties(pattern) {
    // Base physical properties
    const physicProperties = {
      mass: 1,
      charge: -30,
      radius: 10,
      friction: 0.9
    };
    
    // Adjust based on pattern category
    if (pattern.category) {
      switch (pattern.category.toLowerCase()) {
        case 'structural':
          physicProperties.mass = 1.5;
          physicProperties.charge = -50;
          physicProperties.radius = 12;
          break;
        case 'process':
          physicProperties.mass = 1;
          physicProperties.charge = -30;
          physicProperties.radius = 10;
          break;
        case 'relationship':
          physicProperties.mass = 0.8;
          physicProperties.charge = -20;
          physicProperties.radius = 8;
          break;
      }
    }
    
    // Adjust mass by importance if available
    if (pattern.importance !== undefined) {
      physicProperties.mass = physicProperties.mass * (1 + pattern.importance / 5);
      physicProperties.radius = physicProperties.radius * (1 + pattern.importance / 10);
    }
    
    return physicProperties;
  }
  
  /**
   * Generate default physical properties for a relationship
   * @param {Object} relationship - Relationship object
   * @returns {Object} Physical properties
   */
  generateDefaultRelationshipPhysicalProperties(relationship) {
    // Base relationship properties
    const physicProperties = {
      strength: 0.3,
      distance: 100,
      elasticity: 0.7
    };
    
    // Adjust based on relationship type
    if (relationship.type) {
      switch (relationship.type.toLowerCase()) {
        case 'strong':
          physicProperties.strength = 0.7;
          physicProperties.distance = 50;
          break;
        case 'weak':
          physicProperties.strength = 0.1;
          physicProperties.distance = 150;
          break;
        case 'bidirectional':
          physicProperties.strength = 0.5;
          physicProperties.elasticity = 0.9;
          break;
      }
    }
    
    // Adjust strength by weight if available
    if (relationship.weight !== undefined) {
      physicProperties.strength = physicProperties.strength * (relationship.weight / 5);
    }
    
    return physicProperties;
  }
  
  /**
   * Update the metrics of the data model
   * @private
   */
  updateMetrics() {
    // Basic counts
    this.metrics.patternCount = this.patterns.size;
    this.metrics.relationshipCount = this.relationships.size;
    
    // Category distribution
    const categoryDistribution = {};
    this.patterns.forEach(pattern => {
      const category = pattern.category || 'uncategorized';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });
    this.metrics.categoryDistribution = categoryDistribution;
    
    // Connection metrics
    const connectionCounts = new Map();
    
    // Initialize all patterns with 0 connections
    this.patterns.forEach((_, id) => connectionCounts.set(id, 0));
    
    // Count connections for each pattern
    this.relationships.forEach(relationship => {
      const sourceId = typeof relationship.source === 'object' ? relationship.source.id : relationship.source;
      const targetId = typeof relationship.target === 'object' ? relationship.target.id : relationship.target;
      
      connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1);
      connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1);
    });
    
    // Calculate max and average connections
    let maxConnections = 0;
    let totalConnections = 0;
    
    connectionCounts.forEach(count => {
      if (count > maxConnections) {
        maxConnections = count;
      }
      totalConnections += count;
    });
    
    this.metrics.maxConnections = maxConnections;
    this.metrics.averageConnections = totalConnections / (connectionCounts.size || 1);
    
    // Calculate density factor (0-1)
    const maxPossibleRelationships = this.patterns.size * (this.patterns.size - 1) / 2;
    this.metrics.densityFactor = maxPossibleRelationships > 0 ? 
      this.relationships.size / maxPossibleRelationships : 0;
  }
  
  /**
   * Get a pattern by id
   * @param {string} id - Pattern id
   * @returns {Object|null} Pattern or null if not found
   */
  getPattern(id) {
    return this.patterns.get(id) || null;
  }
  
  /**
   * Get a relationship by id
   * @param {string} id - Relationship id
   * @returns {Object|null} Relationship or null if not found
   */
  getRelationship(id) {
    return this.relationships.get(id) || null;
  }
  
  /**
   * Get all patterns
   * @returns {Array} Array of pattern objects
   */
  getAllPatterns() {
    return Array.from(this.patterns.values());
  }
  
  /**
   * Get all relationships
   * @returns {Array} Array of relationship objects
   */
  getAllRelationships() {
    return Array.from(this.relationships.values());
  }
  
  /**
   * Get patterns by category
   * @param {string} category - Category to filter by
   * @returns {Array} Array of pattern objects in the category
   */
  getPatternsByCategory(category) {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.category === category);
  }
  
  /**
   * Get relationships for a pattern
   * @param {string} patternId - Pattern ID
   * @returns {Array} Array of relationship objects
   */
  getRelationshipsForPattern(patternId) {
    return Array.from(this.relationships.values())
      .filter(relationship => {
        const sourceId = typeof relationship.source === 'object' ? relationship.source.id : relationship.source;
        const targetId = typeof relationship.target === 'object' ? relationship.target.id : relationship.target;
        return sourceId === patternId || targetId === patternId;
      });
  }
  
  /**
   * Get patterns connected to a pattern
   * @param {string} patternId - Pattern ID
   * @returns {Array} Array of connected pattern objects
   */
  getConnectedPatterns(patternId) {
    const connectedIds = new Set();
    
    this.relationships.forEach(relationship => {
      const sourceId = typeof relationship.source === 'object' ? relationship.source.id : relationship.source;
      const targetId = typeof relationship.target === 'object' ? relationship.target.id : relationship.target;
      
      if (sourceId === patternId) {
        connectedIds.add(targetId);
      } else if (targetId === patternId) {
        connectedIds.add(sourceId);
      }
    });
    
    return Array.from(connectedIds)
      .map(id => this.patterns.get(id))
      .filter(Boolean);
  }
  
  /**
   * Export data in D3-force compatible format
   * @returns {Object} Object with nodes and links arrays for D3
   */
  exportForD3() {
    const nodes = this.getAllPatterns().map(pattern => ({
      ...pattern,
      // Add calculated values needed for D3 force simulation
      r: pattern.physicProperties?.radius || 10,
      fx: pattern.pinned ? pattern.x : null,
      fy: pattern.pinned ? pattern.y : null
    }));
    
    const links = this.getAllRelationships().map(relationship => {
      const sourceId = typeof relationship.source === 'object' ? relationship.source.id : relationship.source;
      const targetId = typeof relationship.target === 'object' ? relationship.target.id : relationship.target;
      
      return {
        ...relationship,
        source: sourceId,
        target: targetId,
        // Add calculated values needed for D3 force simulation
        value: relationship.physicProperties?.strength || 0.3,
        distance: relationship.physicProperties?.distance || 100
      };
    });
    
    return { nodes, links };
  }
  
  /**
   * Import data from a D3-force compatible format
   * @param {Object} data - Object with nodes and links arrays
   * @returns {PatternDataModel} Instance for chaining
   */
  importFromD3(data) {
    // Clear existing data
    this.patterns.clear();
    this.relationships.clear();
    
    // Import nodes as patterns
    if (Array.isArray(data.nodes)) {
      data.nodes.forEach(node => {
        // Map D3 properties to our pattern model
        const pattern = {
          ...node,
          id: node.id || `pattern-${Math.random().toString(36).substring(2, 9)}`,
          physicProperties: {
            radius: node.r || 10,
            mass: node.mass || 1,
            charge: node.charge || -30,
            friction: node.friction || 0.9
          },
          pinned: Boolean(node.fx || node.fy)
        };
        
        if (node.fx !== undefined && node.fx !== null) {
          pattern.x = node.fx;
        }
        
        if (node.fy !== undefined && node.fy !== null) {
          pattern.y = node.fy;
        }
        
        this.addPattern(pattern);
      });
    }
    
    // Import links as relationships
    if (Array.isArray(data.links)) {
      data.links.forEach(link => {
        // Map D3 properties to our relationship model
        const relationship = {
          ...link,
          id: link.id || `${link.source}-${link.target}`,
          physicProperties: {
            strength: link.value || 0.3,
            distance: link.distance || 100,
            elasticity: link.elasticity || 0.7
          }
        };
        
        this.addRelationship(relationship);
      });
    }
    
    // Update metrics with new data
    this.updateMetrics();
    
    return this;
  }
  
  /**
   * Get current data model metrics
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Clear all data from the model
   * @returns {PatternDataModel} Instance for chaining
   */
  clear() {
    this.patterns.clear();
    this.relationships.clear();
    this.categories.clear();
    this.updateMetrics();
    return this;
  }
  
  /**
   * Create sample data for testing
   * @param {number} patternCount - Number of patterns to create
   * @param {number} relationshipCount - Number of relationships to create
   * @returns {PatternDataModel} Instance for chaining
   */
  createSampleData(patternCount = 20, relationshipCount = 30) {
    this.clear();
    
    const categories = ['structural', 'process', 'relationship'];
    
    // Create sample patterns
    for (let i = 0; i < patternCount; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const importance = Math.random() * 10;
      
      this.addPattern({
        id: `pattern-${i}`,
        name: `Pattern ${i}`,
        category,
        description: `This is a sample ${category} pattern`,
        importance
      });
    }
    
    // Create sample relationships
    const patterns = this.getAllPatterns();
    const relationshipTypes = ['strong', 'weak', 'bidirectional'];
    
    for (let i = 0; i < relationshipCount; i++) {
      const sourceIndex = Math.floor(Math.random() * patterns.length);
      let targetIndex;
      
      do {
        targetIndex = Math.floor(Math.random() * patterns.length);
      } while (targetIndex === sourceIndex);
      
      const type = relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)];
      const weight = Math.random() * 10;
      
      this.addRelationship({
        source: patterns[sourceIndex].id,
        target: patterns[targetIndex].id,
        type,
        weight,
        name: `${type} relationship`,
        description: `This is a sample ${type} relationship`
      });
    }
    
    return this;
  }
}

export default PatternDataModel; 