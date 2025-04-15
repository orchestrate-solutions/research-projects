/**
 * Renderer Module
 * Handles the visual rendering of pattern nodes and relationships using PixiJS.
 * Provides adaptive rendering performance based on node count.
 */

import * as PIXI from 'pixi.js';

class Renderer {
  constructor(container, options = {}) {
    // Default configuration
    this.config = {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
      autoDensity: true,
      nodeTextures: {},
      linkColor: 0xcccccc,
      linkAlpha: 0.6,
      nodeDefaultColor: 0x3498db,
      nodeDefaultRadius: 10,
      nodeHoverScale: 1.2,
      nodeActiveScale: 1.3,
      textColor: 0xffffff,
      showLabels: true,
      hoverHighlight: true,
      performanceMode: 'auto', // 'auto', 'basic', 'high'
      nodeThreshold: 250, // Threshold for switching to basic rendering
      ...options
    };
    
    // Set container reference
    this.container = typeof container === 'string' 
      ? document.getElementById(container) 
      : container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }
    
    // Initialize renderer
    this.initRenderer();
    
    // Data references
    this.nodes = [];
    this.links = [];
    
    // Display objects storage
    this.nodeSprites = new Map();
    this.linkGraphics = new Map();
    this.labelTexts = new Map();
    
    // Interaction tracking
    this.hoveredNode = null;
    this.selectedNode = null;
    this.draggedNode = null;
    
    // Performance tracking
    this.lastRenderTime = 0;
    this.frameTimes = [];
    this.fps = 60;
    
    // Add window resize handler
    window.addEventListener('resize', () => this.handleResize());
    
    // Event listeners
    this.eventListeners = {
      'node-click': [],
      'node-hover': [],
      'node-drag-start': [],
      'node-drag': [],
      'node-drag-end': [],
      'stage-click': []
    };
  }
  
  /**
   * Initialize the PIXI renderer
   */
  initRenderer() {
    // Create PIXI Application
    this.app = new PIXI.Application({
      width: this.config.width,
      height: this.config.height,
      backgroundColor: this.config.backgroundColor,
      resolution: this.config.resolution,
      antialias: this.config.antialias,
      autoDensity: this.config.autoDensity
    });
    
    // Add canvas to container
    this.container.appendChild(this.app.view);
    
    // Create container layers
    this.layers = {
      links: new PIXI.Container(),
      nodes: new PIXI.Container(),
      labels: new PIXI.Container(),
      highlight: new PIXI.Container(),
      debug: new PIXI.Container()
    };
    
    // Add layers to stage
    this.app.stage.addChild(this.layers.links);
    this.app.stage.addChild(this.layers.nodes);
    this.app.stage.addChild(this.layers.labels);
    this.app.stage.addChild(this.layers.highlight);
    this.app.stage.addChild(this.layers.debug);
    
    // Setup interactivity
    this.layers.nodes.interactive = true;
    this.app.stage.interactive = true;
    
    // Handle stage clicks
    this.app.stage.on('pointerdown', (event) => {
      // Only trigger if not clicking on a node
      if (this.hoveredNode === null) {
        this.onStageClick(event);
      }
    });
    
    // Set initial performance mode
    this.setPerformanceMode(this.config.performanceMode);
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Update config dimensions
    this.config.width = window.innerWidth;
    this.config.height = window.innerHeight;
    
    // Resize renderer
    this.app.renderer.resize(this.config.width, this.config.height);
    
    // Update camera/viewport if needed
    this.centerView();
  }
  
  /**
   * Set performance mode based on node count or manual setting
   */
  setPerformanceMode(mode) {
    // Determine appropriate performance mode
    if (mode === 'auto') {
      // Auto-determine based on node count
      this.performanceMode = this.nodes.length > this.config.nodeThreshold ? 'basic' : 'high';
    } else {
      this.performanceMode = mode;
    }
    
    // Apply appropriate settings
    if (this.performanceMode === 'high') {
      // High quality settings
      this.app.ticker.maxFPS = 60;
      this.config.showLabels = true;
      this.config.antialias = true;
      this.layers.labels.visible = this.config.showLabels;
    } else {
      // Basic/performance mode settings
      this.app.ticker.maxFPS = 30;
      this.config.showLabels = false;
      this.config.antialias = false;
      this.layers.labels.visible = false;
    }
    
    // Force redraw if data exists
    if (this.nodes.length > 0) {
      this.updateData({ nodes: this.nodes, links: this.links });
    }
    
    return this.performanceMode;
  }
  
  /**
   * Create texture for node based on pattern type
   */
  createNodeTexture(pattern) {
    const radius = pattern.physicProperties?.radius || this.config.nodeDefaultRadius;
    const color = this.getNodeColor(pattern);
    
    // Create a circle graphic
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color);
    graphics.drawCircle(0, 0, radius);
    graphics.endFill();
    
    // Add a border
    graphics.lineStyle(1, 0xffffff, 0.5);
    graphics.drawCircle(0, 0, radius);
    
    // Create texture from the graphic
    return this.app.renderer.generateTexture(graphics);
  }
  
  /**
   * Get color for a node based on its pattern properties
   */
  getNodeColor(pattern) {
    // Default color if nothing else matches
    let color = this.config.nodeDefaultColor;
    
    // Check for explicit color in pattern properties
    if (pattern.color) {
      // Handle different color formats
      if (typeof pattern.color === 'string') {
        // Convert hex string (#RRGGBB) to number
        if (pattern.color.startsWith('#')) {
          color = parseInt(pattern.color.substring(1), 16);
        }
      } else if (typeof pattern.color === 'number') {
        color = pattern.color;
      }
      return color;
    }
    
    // Determine color by category if no explicit color
    if (pattern.category) {
      switch (pattern.category.toLowerCase()) {
        case 'structural':
          return 0x3498db; // Blue
        case 'process':
          return 0xe74c3c; // Red
        case 'relationship':
          return 0x2ecc71; // Green
        default:
          return this.config.nodeDefaultColor;
      }
    }
    
    return color;
  }
  
  /**
   * Create and configure a node sprite
   */
  createNodeSprite(pattern) {
    // Get or create texture
    const texture = this.config.nodeTextures[pattern.id] || 
                    this.createNodeTexture(pattern);
                    
    // Store texture for reuse
    this.config.nodeTextures[pattern.id] = texture;
    
    // Create sprite
    const sprite = new PIXI.Sprite(texture);
    
    // Configure sprite
    sprite.anchor.set(0.5);
    sprite.alpha = pattern.alpha || 1;
    sprite.interactive = true;
    sprite.buttonMode = true;
    
    // Store reference to pattern data
    sprite.patternData = pattern;
    
    // Set up interaction events
    sprite.on('pointerover', () => this.onNodeHover(pattern));
    sprite.on('pointerout', () => this.onNodeHoverEnd(pattern));
    sprite.on('pointerdown', (event) => this.onNodeDragStart(event, pattern));
    sprite.on('pointermove', (event) => this.onNodeDrag(event, pattern));
    sprite.on('pointerup', (event) => this.onNodeDragEnd(event, pattern));
    sprite.on('pointerupoutside', (event) => this.onNodeDragEnd(event, pattern));
    sprite.on('click', (event) => this.onNodeClick(event, pattern));
    
    return sprite;
  }
  
  /**
   * Create label text for a node
   */
  createLabelText(pattern) {
    // Create text object for label
    const text = new PIXI.Text(pattern.name || pattern.id, {
      fontFamily: 'Arial',
      fontSize: 10,
      fill: this.config.textColor,
      align: 'center'
    });
    
    // Configure text
    text.anchor.set(0.5, -0.8);
    
    return text;
  }
  
  /**
   * Update data and refresh visualization
   */
  updateData(data) {
    const { nodes, links } = data;
    
    // Store local references
    this.nodes = nodes;
    this.links = links;
    
    // Check if we need to adjust performance mode
    if (this.config.performanceMode === 'auto') {
      this.setPerformanceMode('auto');
    }
    
    // Clear existing graphics
    this.clearStage();
    
    // Create all links
    this.renderLinks();
    
    // Create all nodes
    this.renderNodes();
    
    return this;
  }
  
  /**
   * Clear all display objects
   */
  clearStage() {
    // Clear containers
    this.layers.links.removeChildren();
    this.layers.nodes.removeChildren();
    this.layers.labels.removeChildren();
    this.layers.highlight.removeChildren();
    
    // Clear cached objects
    this.nodeSprites.clear();
    this.linkGraphics.clear();
    this.labelTexts.clear();
  }
  
  /**
   * Render all nodes
   */
  renderNodes() {
    this.nodes.forEach(node => {
      // Create node sprite
      const sprite = this.createNodeSprite(node);
      this.nodeSprites.set(node.id, sprite);
      
      // Add to nodes layer
      this.layers.nodes.addChild(sprite);
      
      // Create label if enabled and in high quality mode
      if (this.config.showLabels) {
        const text = this.createLabelText(node);
        this.labelTexts.set(node.id, text);
        this.layers.labels.addChild(text);
      }
    });
  }
  
  /**
   * Render all links
   */
  renderLinks() {
    // Create a single graphics object for all links in basic mode
    let basicGraphics = null;
    if (this.performanceMode === 'basic') {
      basicGraphics = new PIXI.Graphics();
      this.layers.links.addChild(basicGraphics);
    }
    
    // Render each link
    this.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const linkId = `${sourceId}-${targetId}`;
      
      if (this.performanceMode === 'high') {
        // In high quality mode, each link is a separate graphics object
        const graphics = new PIXI.Graphics();
        
        // Configure link appearance
        const color = link.color || this.config.linkColor;
        const alpha = link.alpha || this.config.linkAlpha;
        const width = link.width || 1;
        
        graphics.lineStyle(width, color, alpha);
        graphics.lineTo(0, 0); // Initial empty line
        
        this.linkGraphics.set(linkId, graphics);
        this.layers.links.addChild(graphics);
      } else {
        // In basic mode, we just track the link IDs, drawing happens in update
        this.linkGraphics.set(linkId, { sourceId, targetId });
      }
    });
    
    // Store basic graphics reference if we're in basic mode
    if (basicGraphics) {
      this.basicLinksGraphics = basicGraphics;
    }
  }
  
  /**
   * Update positions of all visual elements based on simulation
   */
  update() {
    // Record start time for performance tracking
    const startTime = performance.now();
    
    // Different update approaches based on performance mode
    if (this.performanceMode === 'high') {
      this.updateHighQuality();
    } else {
      this.updateBasicMode();
    }
    
    // Calculate and update FPS
    const endTime = performance.now();
    const frameTime = endTime - startTime;
    this.frameTimes.push(frameTime);
    
    // Keep only last 60 frames for averaging
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }
    
    // Calculate average frame time and FPS
    const averageFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
    this.fps = Math.round(1000 / averageFrameTime);
    
    this.lastRenderTime = endTime;
  }
  
  /**
   * High quality rendering update
   */
  updateHighQuality() {
    // Update node positions
    this.nodes.forEach(node => {
      const sprite = this.nodeSprites.get(node.id);
      if (sprite && node.x !== undefined && node.y !== undefined) {
        sprite.position.set(node.x, node.y);
        
        // Update label position if exists
        const text = this.labelTexts.get(node.id);
        if (text) {
          text.position.set(node.x, node.y);
        }
      }
    });
    
    // Update link positions
    this.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const linkId = `${sourceId}-${targetId}`;
      
      const source = this.nodes.find(n => n.id === sourceId);
      const target = this.nodes.find(n => n.id === targetId);
      const graphics = this.linkGraphics.get(linkId);
      
      if (graphics && source && target) {
        graphics.clear();
        
        // Configure link appearance
        const color = link.color || this.config.linkColor;
        const alpha = link.alpha || this.config.linkAlpha;
        const width = link.width || 1;
        
        graphics.lineStyle(width, color, alpha);
        graphics.moveTo(source.x, source.y);
        graphics.lineTo(target.x, target.y);
      }
    });
  }
  
  /**
   * Basic mode rendering update (optimized for performance)
   */
  updateBasicMode() {
    // Update node positions
    this.nodes.forEach(node => {
      const sprite = this.nodeSprites.get(node.id);
      if (sprite && node.x !== undefined && node.y !== undefined) {
        sprite.position.set(node.x, node.y);
      }
    });
    
    // Update all links using a single graphics object
    if (this.basicLinksGraphics) {
      this.basicLinksGraphics.clear();
      this.basicLinksGraphics.lineStyle(1, this.config.linkColor, this.config.linkAlpha);
      
      this.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        const source = this.nodes.find(n => n.id === sourceId);
        const target = this.nodes.find(n => n.id === targetId);
        
        if (source && target) {
          this.basicLinksGraphics.moveTo(source.x, source.y);
          this.basicLinksGraphics.lineTo(target.x, target.y);
        }
      });
    }
  }
  
  /**
   * Center the view on the graph
   */
  centerView() {
    // Calculate bounding box of all nodes
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    this.nodes.forEach(node => {
      if (node.x < minX) minX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.x > maxX) maxX = node.x;
      if (node.y > maxY) maxY = node.y;
    });
    
    // If we have nodes, center the view on them
    if (this.nodes.length > 0 && minX !== Infinity) {
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Center the stage
      this.app.stage.position.set(
        this.config.width / 2 - centerX,
        this.config.height / 2 - centerY
      );
    } else {
      // Reset to center if no nodes
      this.app.stage.position.set(
        this.config.width / 2,
        this.config.height / 2
      );
    }
  }
  
  /**
   * Highlight a specific node
   */
  highlightNode(nodeId) {
    const sprite = this.nodeSprites.get(nodeId);
    if (sprite) {
      sprite.scale.set(this.config.nodeActiveScale);
      
      // Add glow effect
      const glowFilter = new PIXI.filters.GlowFilter({
        distance: 15,
        outerStrength: 1,
        innerStrength: 1,
        color: 0xffffff,
        quality: 0.5
      });
      
      sprite.filters = [glowFilter];
    }
    
    // Highlight connected links
    this.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (sourceId === nodeId || targetId === nodeId) {
        const linkId = `${sourceId}-${targetId}`;
        const graphics = this.linkGraphics.get(linkId);
        
        if (graphics && this.performanceMode === 'high') {
          // For high quality mode, update the individual link graphic
          graphics.clear();
          graphics.lineStyle(2, 0xffffff, 0.8);
          
          const source = this.nodes.find(n => n.id === sourceId);
          const target = this.nodes.find(n => n.id === targetId);
          
          if (source && target) {
            graphics.moveTo(source.x, source.y);
            graphics.lineTo(target.x, target.y);
          }
        }
      }
    });
    
    return this;
  }
  
  /**
   * Remove highlight from a node
   */
  unhighlightNode(nodeId) {
    const sprite = this.nodeSprites.get(nodeId);
    if (sprite) {
      sprite.scale.set(1.0);
      sprite.filters = null;
    }
    
    // Reset connected links
    this.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (sourceId === nodeId || targetId === nodeId) {
        const linkId = `${sourceId}-${targetId}`;
        const graphics = this.linkGraphics.get(linkId);
        
        if (graphics && this.performanceMode === 'high') {
          // Reset link appearance
          graphics.clear();
          const color = link.color || this.config.linkColor;
          const alpha = link.alpha || this.config.linkAlpha;
          const width = link.width || 1;
          
          graphics.lineStyle(width, color, alpha);
          
          const source = this.nodes.find(n => n.id === sourceId);
          const target = this.nodes.find(n => n.id === targetId);
          
          if (source && target) {
            graphics.moveTo(source.x, source.y);
            graphics.lineTo(target.x, target.y);
          }
        }
      }
    });
    
    return this;
  }
  
  /**
   * Select a node
   */
  selectNode(nodeId) {
    // Deselect previous selection if any
    if (this.selectedNode && this.selectedNode !== nodeId) {
      this.deselectNode(this.selectedNode);
    }
    
    this.selectedNode = nodeId;
    this.highlightNode(nodeId);
    
    return this;
  }
  
  /**
   * Deselect a node
   */
  deselectNode(nodeId) {
    if (this.selectedNode === nodeId) {
      this.selectedNode = null;
    }
    
    this.unhighlightNode(nodeId);
    
    return this;
  }
  
  /**
   * Node hover handler
   */
  onNodeHover(pattern) {
    this.hoveredNode = pattern.id;
    
    if (this.config.hoverHighlight && pattern.id !== this.selectedNode) {
      const sprite = this.nodeSprites.get(pattern.id);
      if (sprite) {
        sprite.scale.set(this.config.nodeHoverScale);
      }
    }
    
    // Notify event listeners
    this.notifyListeners('node-hover', { pattern });
  }
  
  /**
   * Node hover end handler
   */
  onNodeHoverEnd(pattern) {
    this.hoveredNode = null;
    
    if (pattern.id !== this.selectedNode) {
      const sprite = this.nodeSprites.get(pattern.id);
      if (sprite) {
        sprite.scale.set(1.0);
      }
    }
  }
  
  /**
   * Node drag start handler
   */
  onNodeDragStart(event, pattern) {
    this.draggedNode = {
      id: pattern.id,
      initialX: pattern.x,
      initialY: pattern.y,
      startX: event.data.global.x,
      startY: event.data.global.y
    };
    
    // Notify event listeners
    this.notifyListeners('node-drag-start', { pattern, event });
  }
  
  /**
   * Node drag handler
   */
  onNodeDrag(event, pattern) {
    if (!this.draggedNode || this.draggedNode.id !== pattern.id) return;
    
    // Calculate new position
    const dx = event.data.global.x - this.draggedNode.startX;
    const dy = event.data.global.y - this.draggedNode.startY;
    
    // Update pattern position
    pattern.x = this.draggedNode.initialX + dx;
    pattern.y = this.draggedNode.initialY + dy;
    
    // Update position for physics simulation
    pattern.fx = pattern.x;
    pattern.fy = pattern.y;
    
    // Notify event listeners
    this.notifyListeners('node-drag', { pattern, event, dx, dy });
  }
  
  /**
   * Node drag end handler
   */
  onNodeDragEnd(event, pattern) {
    if (!this.draggedNode || this.draggedNode.id !== pattern.id) return;
    
    // If the node is not pinned, release it
    if (!pattern.pinned) {
      pattern.fx = null;
      pattern.fy = null;
    }
    
    // Notify event listeners
    this.notifyListeners('node-drag-end', { pattern, event });
    
    this.draggedNode = null;
  }
  
  /**
   * Node click handler
   */
  onNodeClick(event, pattern) {
    // Toggle node selection
    if (this.selectedNode === pattern.id) {
      this.deselectNode(pattern.id);
    } else {
      this.selectNode(pattern.id);
    }
    
    // Notify event listeners
    this.notifyListeners('node-click', { pattern, event });
  }
  
  /**
   * Stage click handler (background)
   */
  onStageClick(event) {
    // Deselect current node if any
    if (this.selectedNode) {
      this.deselectNode(this.selectedNode);
    }
    
    // Notify event listeners
    this.notifyListeners('stage-click', { event });
  }
  
  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
    return this;
  }
  
  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event]
        .filter(cb => cb !== callback);
    }
    return this;
  }
  
  /**
   * Notify all event listeners
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
  
  /**
   * Get current performance stats
   */
  getPerformanceStats() {
    return {
      fps: this.fps,
      nodeCount: this.nodes.length,
      linkCount: this.links.length,
      performanceMode: this.performanceMode,
      renderTime: this.frameTimes.length > 0 ? 
        this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length : 0
    };
  }
  
  /**
   * Destroy the renderer and clean up resources
   */
  destroy() {
    // Stop animation
    this.app.ticker.stop();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    
    // Destroy PIXI application
    this.app.destroy(true, {
      children: true,
      texture: true,
      baseTexture: true
    });
    
    // Clear references
    this.nodeSprites.clear();
    this.linkGraphics.clear();
    this.labelTexts.clear();
    
    // Remove canvas from DOM
    if (this.container && this.container.contains(this.app.view)) {
      this.container.removeChild(this.app.view);
    }
  }
}

export default Renderer; 