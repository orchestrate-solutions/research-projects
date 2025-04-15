/**
 * Pattern Manager Module
 * Handles data modeling, categorization, and filtering of patterns and their relationships.
 */

class PatternManager {
  constructor() {
    // Initialize pattern collections
    this.patterns = [];
    this.relationships = [];
    
    // Mapping for quick lookup
    this.patternMap = new Map();
    this.relationshipMap = new Map();
    
    // Filter state
    this.visibleCategories = new Set(['structural', 'process', 'relationship']);
    this.visibleTags = new Set();
    this.searchQuery = '';
    
    // Pattern selection state
    this.selectedPatternId = null;
    
    // Event listeners
    this.eventListeners = {
      'filter-change': [],
      'selection-change': [],
      'data-change': []
    };
  }
  
  /**
   * Load patterns and their relationships from data
   */
  loadData(patternsData, relationshipsData) {
    // Reset current data
    this.patterns = [];
    this.relationships = [];
    this.patternMap.clear();
    this.relationshipMap.clear();
    
    // Process patterns
    if (patternsData && Array.isArray(patternsData)) {
      this.patterns = patternsData.map(pattern => {
        // Ensure each pattern has required properties
        const processedPattern = {
          id: pattern.id || `pattern-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: pattern.name || 'Unnamed Pattern',
          description: pattern.description || '',
          category: pattern.category || 'structural',
          tags: pattern.tags || [],
          attributes: pattern.attributes || {},
          physicProperties: this.getDefaultPhysicalProperties(pattern.category),
          ...pattern
        };
        
        // Store in map for quick lookup
        this.patternMap.set(processedPattern.id, processedPattern);
        return processedPattern;
      });
    }
    
    // Process relationships
    if (relationshipsData && Array.isArray(relationshipsData)) {
      this.relationships = relationshipsData.map(relationship => {
        // Ensure each relationship has required properties
        const processedRelationship = {
          id: relationship.id || `relationship-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          source: relationship.source,
          target: relationship.target,
          type: relationship.type || 'related',
          strength: relationship.strength || 1,
          description: relationship.description || '',
          attributes: relationship.attributes || {},
          ...relationship
        };
        
        // Store in map for quick lookup
        this.relationshipMap.set(processedRelationship.id, processedRelationship);
        return processedRelationship;
      });
    }
    
    // Notify listeners of data change
    this.notifyListeners('data-change', {
      patterns: this.patterns,
      relationships: this.relationships
    });
    
    return {
      patterns: this.patterns,
      relationships: this.relationships
    };
  }
  
  /**
   * Get default physical properties based on pattern category
   */
  getDefaultPhysicalProperties(category) {
    const defaults = {
      structural: {
        radius: 15,
        mass: 3,
        charge: -300,
        color: 0x3498db
      },
      process: {
        radius: 12,
        mass: 2,
        charge: -200,
        color: 0x2ecc71
      },
      relationship: {
        radius: 10,
        mass: 1,
        charge: -100,
        color: 0xe74c3c
      }
    };
    
    return defaults[category] || defaults.structural;
  }
  
  /**
   * Get all patterns matching current filters
   */
  getFilteredPatterns() {
    return this.patterns.filter(pattern => {
      // Filter by category
      if (!this.visibleCategories.has(pattern.category)) {
        return false;
      }
      
      // Filter by tags (if tags filter is active)
      if (this.visibleTags.size > 0) {
        const hasMatchingTag = pattern.tags.some(tag => this.visibleTags.has(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      // Filter by search query
      if (this.searchQuery) {
        const searchLower = this.searchQuery.toLowerCase();
        const nameMatch = pattern.name.toLowerCase().includes(searchLower);
        const descMatch = pattern.description.toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Get relationships where both source and target are in filtered patterns
   */
  getFilteredRelationships() {
    const filteredPatterns = this.getFilteredPatterns();
    const filteredPatternIds = new Set(filteredPatterns.map(p => p.id));
    
    return this.relationships.filter(relationship => {
      return filteredPatternIds.has(relationship.source) && 
             filteredPatternIds.has(relationship.target);
    });
  }
  
  /**
   * Get data formatted for D3 force simulation
   */
  getGraphData() {
    const filteredPatterns = this.getFilteredPatterns();
    const filteredRelationships = this.getFilteredRelationships();
    
    // Transform to D3 expected format
    const nodes = filteredPatterns.map(pattern => ({
      ...pattern,
      id: pattern.id,
      radius: pattern.physicProperties?.radius || 10,
      category: pattern.category,
      selected: pattern.id === this.selectedPatternId
    }));
    
    const links = filteredRelationships.map(relationship => ({
      ...relationship,
      id: relationship.id,
      source: relationship.source,
      target: relationship.target,
      value: relationship.strength
    }));
    
    return { nodes, links };
  }
  
  /**
   * Filter patterns by category
   */
  filterByCategory(categories, enabled = true) {
    if (!Array.isArray(categories)) {
      categories = [categories];
    }
    
    categories.forEach(category => {
      if (enabled) {
        this.visibleCategories.add(category);
      } else {
        this.visibleCategories.delete(category);
      }
    });
    
    // Notify listeners of filter change
    this.notifyListeners('filter-change', {
      type: 'category',
      categories: [...this.visibleCategories]
    });
    
    return this;
  }
  
  /**
   * Filter patterns by tags
   */
  filterByTags(tags, enabled = true) {
    if (!Array.isArray(tags)) {
      tags = [tags];
    }
    
    tags.forEach(tag => {
      if (enabled) {
        this.visibleTags.add(tag);
      } else {
        this.visibleTags.delete(tag);
      }
    });
    
    // Notify listeners of filter change
    this.notifyListeners('filter-change', {
      type: 'tags',
      tags: [...this.visibleTags]
    });
    
    return this;
  }
  
  /**
   * Clear all tag filters
   */
  clearTagFilters() {
    this.visibleTags.clear();
    
    // Notify listeners of filter change
    this.notifyListeners('filter-change', {
      type: 'tags',
      tags: []
    });
    
    return this;
  }
  
  /**
   * Set search query filter
   */
  setSearchQuery(query) {
    this.searchQuery = query;
    
    // Notify listeners of filter change
    this.notifyListeners('filter-change', {
      type: 'search',
      query: this.searchQuery
    });
    
    return this;
  }
  
  /**
   * Reset all filters to default state
   */
  resetFilters() {
    this.visibleCategories = new Set(['structural', 'process', 'relationship']);
    this.visibleTags.clear();
    this.searchQuery = '';
    
    // Notify listeners of filter change
    this.notifyListeners('filter-change', {
      type: 'reset'
    });
    
    return this;
  }
  
  /**
   * Get all available tags from patterns
   */
  getAllTags() {
    const tags = new Set();
    this.patterns.forEach(pattern => {
      if (pattern.tags && Array.isArray(pattern.tags)) {
        pattern.tags.forEach(tag => tags.add(tag));
      }
    });
    return [...tags];
  }
  
  /**
   * Get patterns by category
   */
  getPatternsByCategory(category) {
    return this.patterns.filter(pattern => pattern.category === category);
  }
  
  /**
   * Get a single pattern by ID
   */
  getPatternById(id) {
    return this.patternMap.get(id);
  }
  
  /**
   * Get relationships for a specific pattern
   */
  getRelationshipsForPattern(patternId) {
    return this.relationships.filter(rel => 
      rel.source === patternId || rel.target === patternId
    );
  }
  
  /**
   * Get related patterns for a specific pattern
   */
  getRelatedPatterns(patternId) {
    const relationships = this.getRelationshipsForPattern(patternId);
    const relatedIds = new Set();
    
    relationships.forEach(rel => {
      if (rel.source === patternId) {
        relatedIds.add(rel.target);
      } else {
        relatedIds.add(rel.source);
      }
    });
    
    return [...relatedIds].map(id => this.getPatternById(id)).filter(Boolean);
  }
  
  /**
   * Select a pattern by ID
   */
  selectPattern(patternId) {
    this.selectedPatternId = patternId;
    
    // Notify listeners of selection change
    this.notifyListeners('selection-change', {
      selectedPatternId: this.selectedPatternId,
      selectedPattern: this.getPatternById(patternId),
      relatedPatterns: patternId ? this.getRelatedPatterns(patternId) : []
    });
    
    return this;
  }
  
  /**
   * Add a new pattern
   */
  addPattern(pattern) {
    // Ensure pattern has an ID
    if (!pattern.id) {
      pattern.id = `pattern-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    
    // Set default physical properties based on category
    if (!pattern.physicProperties) {
      pattern.physicProperties = this.getDefaultPhysicalProperties(pattern.category || 'structural');
    }
    
    // Add pattern to collection
    this.patterns.push(pattern);
    this.patternMap.set(pattern.id, pattern);
    
    // Notify listeners of data change
    this.notifyListeners('data-change', {
      patterns: this.patterns,
      relationships: this.relationships
    });
    
    return pattern;
  }
  
  /**
   * Update an existing pattern
   */
  updatePattern(patternId, updates) {
    const pattern = this.getPatternById(patternId);
    
    if (!pattern) {
      return null;
    }
    
    // Apply updates
    Object.assign(pattern, updates);
    
    // Notify listeners of data change
    this.notifyListeners('data-change', {
      patterns: this.patterns,
      relationships: this.relationships
    });
    
    return pattern;
  }
  
  /**
   * Delete a pattern
   */
  deletePattern(patternId) {
    // Remove from collection
    this.patterns = this.patterns.filter(p => p.id !== patternId);
    this.patternMap.delete(patternId);
    
    // Remove any relationships involving this pattern
    this.relationships = this.relationships.filter(r => 
      r.source !== patternId && r.target !== patternId
    );
    
    // Update selection if needed
    if (this.selectedPatternId === patternId) {
      this.selectedPatternId = null;
      this.notifyListeners('selection-change', {
        selectedPatternId: null,
        selectedPattern: null,
        relatedPatterns: []
      });
    }
    
    // Notify listeners of data change
    this.notifyListeners('data-change', {
      patterns: this.patterns,
      relationships: this.relationships
    });
    
    return true;
  }
  
  /**
   * Add a new relationship
   */
  addRelationship(relationship) {
    // Ensure relationship has an ID
    if (!relationship.id) {
      relationship.id = `relationship-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    
    // Validate source and target exist
    const sourcePattern = this.getPatternById(relationship.source);
    const targetPattern = this.getPatternById(relationship.target);
    
    if (!sourcePattern || !targetPattern) {
      return null;
    }
    
    // Add relationship to collection
    this.relationships.push(relationship);
    this.relationshipMap.set(relationship.id, relationship);
    
    // Notify listeners of data change
    this.notifyListeners('data-change', {
      patterns: this.patterns,
      relationships: this.relationships
    });
    
    return relationship;
  }
  
  /**
   * Update an existing relationship
   */
  updateRelationship(relationshipId, updates) {
    const relationship = this.relationshipMap.get(relationshipId);
    
    if (!relationship) {
      return null;
    }
    
    // Apply updates
    Object.assign(relationship, updates);
    
    // Notify listeners of data change
    this.notifyListeners('data-change', {
      patterns: this.patterns,
      relationships: this.relationships
    });
    
    return relationship;
  }
  
  /**
   * Delete a relationship
   */
  deleteRelationship(relationshipId) {
    // Remove from collection
    this.relationships = this.relationships.filter(r => r.id !== relationshipId);
    this.relationshipMap.delete(relationshipId);
    
    // Notify listeners of data change
    this.notifyListeners('data-change', {
      patterns: this.patterns,
      relationships: this.relationships
    });
    
    return true;
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

export default PatternManager; 