/**
 * Rendering Layer
 * Handles visualization of patterns and relationships using PixiJS
 * Provides high-performance rendering for large datasets
 */

import * as PIXI from 'pixi.js';

class RenderingLayer {
  constructor(options = {}) {
    // Default configuration
    this.config = {
      nodeSize: 15,                // Default node radius
      nodeColor: 0x6baed6,         // Default node color (blue)
      selectedNodeColor: 0xff9900, // Selected node color (orange)
      hoverNodeColor: 0xffdd00,    // Hover node color (yellow)
      linkColor: 0x999999,         // Default link color (gray)
      linkWidth: 1,                // Default link width
      backgroundColor: 0xf7f7f7,   // Background color (light gray)
      textColor: 0x333333,         // Text color (dark gray)
      renderLabels: true,          // Whether to render node labels
      labelSize: 10,               // Label font size
      adaptiveDetail: true,        // Reduce detail when zoomed out
      performanceMode: false,      // Simplified rendering for large graphs
      ...options
    };
    
    // Renderer state
    this.width = 800;
    this.height = 600;
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.selectedNode = null;
    this.hoveredNode = null;
    this.isInitialized = false;
    
    // Performance optimization
    this.renderRequestId = null;
    this.needsUpdate = true;
    this.lastRenderTime = 0;
    this.frameRate = 60;
    this.renderCount = 0;
    this.nodeSprites = new Map();
    this.linkSprites = new Map();
    this.labelSprites = new Map();
    
    // Initialize container elements
    this.pixiApp = null;
    this.viewport = null;
    this.linkLayer = null;
    this.nodeLayer = null;
    this.labelLayer = null;
    this.uiLayer = null;
  }
  
  /**
   * Initialize the rendering layer with a container element
   * @param {HTMLElement} container - DOM element to render in
   */
  initialize(container) {
    if (this.isInitialized) {
      return;
    }
    
    // Get container dimensions
    this.width = container.offsetWidth || 800;
    this.height = container.offsetHeight || 600;
    
    // Create PixiJS application
    this.pixiApp = new PIXI.Application({
      width: this.width,
      height: this.height,
      backgroundColor: this.config.backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    // Add the canvas to the container
    container.appendChild(this.pixiApp.view);
    
    // Create layers (order matters for rendering)
    this.createLayers();
    
    // Set up viewport for pan and zoom
    this.setupViewport();
    
    // Set up event handling
    this.setupEvents();
    
    // Mark as initialized
    this.isInitialized = true;
    
    // Start render loop
    this.startRenderLoop();
  }
  
  /**
   * Create the rendering layers/containers
   * @private
   */
  createLayers() {
    // Create main container for transformation
    this.viewport = new PIXI.Container();
    this.pixiApp.stage.addChild(this.viewport);
    
    // Create link layer (bottom)
    this.linkLayer = new PIXI.Container();
    this.viewport.addChild(this.linkLayer);
    
    // Create node layer (middle)
    this.nodeLayer = new PIXI.Container();
    this.viewport.addChild(this.nodeLayer);
    
    // Create label layer (top)
    this.labelLayer = new PIXI.Container();
    this.viewport.addChild(this.labelLayer);
    
    // Create UI layer (fixed, not affected by pan/zoom)
    this.uiLayer = new PIXI.Container();
    this.pixiApp.stage.addChild(this.uiLayer);
  }
  
  /**
   * Set up the viewport for pan and zoom functionality
   * @private
   */
  setupViewport() {
    // Initialize transform
    this.viewport.position.set(this.width / 2, this.height / 2);
    this.viewport.pivot.set(0, 0);
    
    // Center the viewport initially
    this.centerView();
  }
  
  /**
   * Set up event handling
   * @private
   */
  setupEvents() {
    // Resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Create interaction manager
    this.interaction = this.pixiApp.renderer.plugins.interaction;
  }
  
  /**
   * Handle window resize
   * @private
   */
  handleResize() {
    // Get new container dimensions
    const container = this.pixiApp.view.parentElement;
    if (!container) return;
    
    this.width = container.offsetWidth;
    this.height = container.offsetHeight;
    
    // Resize the renderer
    this.pixiApp.renderer.resize(this.width, this.height);
    
    // Update viewport position
    this.viewport.position.set(this.width / 2 + this.pan.x, this.height / 2 + this.pan.y);
    
    // Flag for render update
    this.needsUpdate = true;
  }
  
  /**
   * Start the render loop
   * @private
   */
  startRenderLoop() {
    // Use PixiJS ticker for rendering
    this.pixiApp.ticker.add(this.render.bind(this));
  }
  
  /**
   * Render function called on each animation frame
   * @private
   */
  render(delta) {
    // Skip if nothing has changed and we're not in continuous render mode
    if (!this.needsUpdate && !this.config.continuousRender) {
      return;
    }
    
    // Calculate FPS
    const now = performance.now();
    const elapsed = now - this.lastRenderTime;
    this.frameRate = 1000 / (elapsed || 16.67); // Default to 60fps if first frame
    this.lastRenderTime = now;
    
    // Update adaptive details based on zoom level if enabled
    if (this.config.adaptiveDetail) {
      this.updateAdaptiveDetail();
    }
    
    // Reset needs update flag
    this.needsUpdate = false;
    this.renderCount++;
  }
  
  /**
   * Update the adaptive detail level based on zoom
   * @private
   */
  updateAdaptiveDetail() {
    // Show/hide labels based on zoom level
    this.labelLayer.visible = (this.zoom > 0.6 || this.hoveredNode || this.selectedNode);
    
    // Adjust link alpha based on zoom
    if (this.zoom < 0.4 && !this.config.performanceMode) {
      this.linkLayer.alpha = this.zoom;
    } else {
      this.linkLayer.alpha = 1;
    }
    
    // In extreme performance mode, hide links when very zoomed out
    if (this.config.performanceMode && this.zoom < 0.2) {
      this.linkLayer.visible = false;
    } else {
      this.linkLayer.visible = true;
    }
  }
  
  /**
   * Update node and link positions from simulation data
   * @param {Array} nodes - Array of node objects with positions
   * @param {Array} links - Array of link objects
   */
  updatePositions(nodes, links) {
    if (!this.isInitialized) return;
    
    // Update nodes
    nodes.forEach(node => {
      const sprite = this.nodeSprites.get(node.id);
      if (sprite) {
        sprite.position.set(node.x, node.y);
        
        // Update label position if it exists
        const label = this.labelSprites.get(node.id);
        if (label) {
          label.position.set(node.x, node.y + (node.physicProperties?.radius || this.config.nodeSize) + 5);
        }
      }
    });
    
    // Update links
    links.forEach(link => {
      const graphics = this.linkSprites.get(link.id);
      if (graphics) {
        const sourceNode = nodes.find(n => n.id === link.source.id || n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target.id || n.id === link.target);
        
        if (sourceNode && targetNode) {
          graphics.clear();
          
          // Get link appearance properties
          const width = link.physicProperties?.width || this.config.linkWidth;
          const color = link.physicProperties?.color || this.config.linkColor;
          const alpha = link.physicProperties?.alpha || 1;
          
          // Draw the link
          graphics.lineStyle(width, color, alpha);
          graphics.moveTo(sourceNode.x, sourceNode.y);
          graphics.lineTo(targetNode.x, targetNode.y);
        }
      }
    });
    
    // Flag for render update
    this.needsUpdate = true;
  }
  
  /**
   * Render data from the physics simulation
   * @param {Object} data - Object with nodes and links arrays
   */
  renderData(data) {
    if (!this.isInitialized) return;
    
    const { nodes, links } = data;
    
    // Clear existing elements
    this.clear();
    
    // Create links first (will be drawn in the background)
    this.createLinks(links);
    
    // Create nodes
    this.createNodes(nodes);
    
    // Create labels if enabled
    if (this.config.renderLabels) {
      this.createLabels(nodes);
    }
    
    // Flag for render update
    this.needsUpdate = true;
  }
  
  /**
   * Create node sprites
   * @param {Array} nodes - Array of node objects
   * @private
   */
  createNodes(nodes) {
    nodes.forEach(node => {
      // Skip if already exists
      if (this.nodeSprites.has(node.id)) return;
      
      // Get node appearance properties
      const radius = node.physicProperties?.radius || this.config.nodeSize;
      const color = node.physicProperties?.color || this.config.nodeColor;
      const alpha = node.physicProperties?.alpha || 1;
      
      // Create graphics object for the node
      const graphics = new PIXI.Graphics();
      
      // Draw the node
      graphics.beginFill(color, alpha);
      graphics.drawCircle(0, 0, radius);
      graphics.endFill();
      
      // Set position
      graphics.position.set(node.x || 0, node.y || 0);
      
      // Enable interaction
      graphics.interactive = true;
      graphics.buttonMode = true;
      
      // Add hover events
      graphics.on('mouseover', () => this.handleNodeHover(node));
      graphics.on('mouseout', () => this.handleNodeHoverEnd(node));
      graphics.on('click', () => this.handleNodeClick(node));
      
      // Store reference to node data
      graphics.nodeData = node;
      
      // Add to node layer
      this.nodeLayer.addChild(graphics);
      
      // Store in lookup map
      this.nodeSprites.set(node.id, graphics);
    });
  }
  
  /**
   * Create link graphics
   * @param {Array} links - Array of link objects
   * @private
   */
  createLinks(links) {
    links.forEach(link => {
      // Skip if already exists
      if (this.linkSprites.has(link.id)) return;
      
      // Create graphics object for the link
      const graphics = new PIXI.Graphics();
      
      // Get link appearance properties
      const width = link.physicProperties?.width || this.config.linkWidth;
      const color = link.physicProperties?.color || this.config.linkColor;
      const alpha = link.physicProperties?.alpha || 1;
      
      // Get source and target positions
      const sourceNode = link.source.id ? link.source : { x: 0, y: 0 };
      const targetNode = link.target.id ? link.target : { x: 0, y: 0 };
      
      // Draw the link
      graphics.lineStyle(width, color, alpha);
      graphics.moveTo(sourceNode.x || 0, sourceNode.y || 0);
      graphics.lineTo(targetNode.x || 0, targetNode.y || 0);
      
      // Store reference to link data
      graphics.linkData = link;
      
      // Add to link layer
      this.linkLayer.addChild(graphics);
      
      // Store in lookup map
      this.linkSprites.set(link.id, graphics);
    });
  }
  
  /**
   * Create text labels for nodes
   * @param {Array} nodes - Array of node objects
   * @private
   */
  createLabels(nodes) {
    nodes.forEach(node => {
      // Skip if already exists
      if (this.labelSprites.has(node.id)) return;
      
      // Skip if node has no name
      if (!node.name && !node.label) return;
      
      // Create text sprite
      const label = new PIXI.Text(node.name || node.label || node.id, {
        fontFamily: 'Arial',
        fontSize: this.config.labelSize,
        fill: this.config.textColor,
        align: 'center'
      });
      
      // Center text
      label.anchor.set(0.5, 0);
      
      // Position below node
      const radius = node.physicProperties?.radius || this.config.nodeSize;
      label.position.set(node.x || 0, (node.y || 0) + radius + 5);
      
      // Add to label layer
      this.labelLayer.addChild(label);
      
      // Store in lookup map
      this.labelSprites.set(node.id, label);
    });
  }
  
  /**
   * Clear all rendered elements
   */
  clear() {
    // Clear nodes
    this.nodeLayer.removeChildren();
    this.nodeSprites.clear();
    
    // Clear links
    this.linkLayer.removeChildren();
    this.linkSprites.clear();
    
    // Clear labels
    this.labelLayer.removeChildren();
    this.labelSprites.clear();
    
    // Reset state
    this.selectedNode = null;
    this.hoveredNode = null;
    
    // Flag for render update
    this.needsUpdate = true;
  }
  
  /**
   * Handle node hover
   * @param {Object} node - Node being hovered
   * @private
   */
  handleNodeHover(node) {
    if (!node) return;
    
    // Set hovered node
    this.hoveredNode = node;
    
    // Get node sprite
    const sprite = this.nodeSprites.get(node.id);
    if (!sprite) return;
    
    // Store original color for reset
    if (!sprite._originalColor) {
      sprite._originalColor = node.physicProperties?.color || this.config.nodeColor;
    }
    
    // Highlight the node (unless it's already selected)
    if (this.selectedNode !== node) {
      sprite.clear();
      sprite.beginFill(this.config.hoverNodeColor);
      sprite.drawCircle(0, 0, node.physicProperties?.radius || this.config.nodeSize);
      sprite.endFill();
    }
    
    // Always bring label to front if it exists
    const label = this.labelSprites.get(node.id);
    if (label) {
      label.visible = true;
      this.labelLayer.removeChild(label);
      this.labelLayer.addChild(label);
    }
    
    // Flag for render update
    this.needsUpdate = true;
    
    // Trigger hover callback if set
    if (this.onNodeHover) {
      this.onNodeHover(node);
    }
  }
  
  /**
   * Handle end of node hover
   * @param {Object} node - Node that was being hovered
   * @private
   */
  handleNodeHoverEnd(node) {
    if (!node) return;
    
    // Clear hovered node if it matches
    if (this.hoveredNode === node) {
      this.hoveredNode = null;
    }
    
    // Get node sprite
    const sprite = this.nodeSprites.get(node.id);
    if (!sprite) return;
    
    // Reset color if not selected
    if (this.selectedNode !== node) {
      sprite.clear();
      sprite.beginFill(sprite._originalColor || this.config.nodeColor);
      sprite.drawCircle(0, 0, node.physicProperties?.radius || this.config.nodeSize);
      sprite.endFill();
    }
    
    // Flag for render update
    this.needsUpdate = true;
    
    // Trigger hover end callback if set
    if (this.onNodeHoverEnd) {
      this.onNodeHoverEnd(node);
    }
  }
  
  /**
   * Handle node click
   * @param {Object} node - Node being clicked
   * @private
   */
  handleNodeClick(node) {
    if (!node) return;
    
    const wasSelected = this.selectedNode === node;
    
    // Reset previously selected node if different
    if (this.selectedNode && this.selectedNode !== node) {
      const prevSprite = this.nodeSprites.get(this.selectedNode.id);
      if (prevSprite) {
        prevSprite.clear();
        prevSprite.beginFill(prevSprite._originalColor || this.config.nodeColor);
        prevSprite.drawCircle(0, 0, this.selectedNode.physicProperties?.radius || this.config.nodeSize);
        prevSprite.endFill();
      }
    }
    
    // Toggle selection
    if (wasSelected) {
      this.selectedNode = null;
      
      // Reset color
      const sprite = this.nodeSprites.get(node.id);
      if (sprite) {
        sprite.clear();
        sprite.beginFill(sprite._originalColor || this.config.nodeColor);
        sprite.drawCircle(0, 0, node.physicProperties?.radius || this.config.nodeSize);
        sprite.endFill();
      }
    } else {
      this.selectedNode = node;
      
      // Highlight with selection color
      const sprite = this.nodeSprites.get(node.id);
      if (sprite) {
        sprite.clear();
        sprite.beginFill(this.config.selectedNodeColor);
        sprite.drawCircle(0, 0, node.physicProperties?.radius || this.config.nodeSize);
        sprite.endFill();
      }
    }
    
    // Flag for render update
    this.needsUpdate = true;
    
    // Trigger click callback if set
    if (this.onNodeClick) {
      this.onNodeClick(node, !wasSelected);
    }
  }
  
  /**
   * Pan the viewport
   * @param {number} dx - X distance to pan
   * @param {number} dy - Y distance to pan
   */
  pan(dx, dy) {
    this.pan.x += dx;
    this.pan.y += dy;
    
    // Apply pan
    this.viewport.position.set(this.width / 2 + this.pan.x, this.height / 2 + this.pan.y);
    
    // Flag for render update
    this.needsUpdate = true;
  }
  
  /**
   * Zoom the viewport
   * @param {number} scale - Zoom scale factor
   * @param {number} x - X coordinate to zoom around
   * @param {number} y - Y coordinate to zoom around
   */
  zoom(scale, x, y) {
    // Calculate new zoom level
    const prevZoom = this.zoom;
    this.zoom = Math.max(0.1, Math.min(3, this.zoom * scale));
    
    // Calculate zoom pivot point relative to viewport center
    const pivotX = (x - this.width / 2 - this.pan.x) / prevZoom;
    const pivotY = (y - this.height / 2 - this.pan.y) / prevZoom;
    
    // Adjust pan to keep pivot point in same screen position
    this.pan.x -= pivotX * (this.zoom - prevZoom);
    this.pan.y -= pivotY * (this.zoom - prevZoom);
    
    // Apply transforms
    this.viewport.scale.set(this.zoom);
    this.viewport.position.set(this.width / 2 + this.pan.x, this.height / 2 + this.pan.y);
    
    // Flag for render update
    this.needsUpdate = true;
  }
  
  /**
   * Reset zoom and pan to center view
   * @param {boolean} animate - Whether to animate the transition
   */
  centerView(animate = false) {
    if (animate) {
      // Animated transition
      const targetPan = { x: 0, y: 0 };
      const targetZoom = 1;
      
      const startPan = { ...this.pan };
      const startZoom = this.zoom;
      
      const duration = 500; // ms
      const startTime = performance.now();
      
      const animateFrame = (timestamp) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2; // Sinusoidal easing
        
        // Interpolate values
        this.pan.x = startPan.x + (targetPan.x - startPan.x) * easeProgress;
        this.pan.y = startPan.y + (targetPan.y - startPan.y) * easeProgress;
        this.zoom = startZoom + (targetZoom - startZoom) * easeProgress;
        
        // Apply transforms
        this.viewport.scale.set(this.zoom);
        this.viewport.position.set(this.width / 2 + this.pan.x, this.height / 2 + this.pan.y);
        
        // Flag for render update
        this.needsUpdate = true;
        
        // Continue animation if not finished
        if (progress < 1) {
          requestAnimationFrame(animateFrame);
        }
      };
      
      requestAnimationFrame(animateFrame);
    } else {
      // Immediate transition
      this.pan = { x: 0, y: 0 };
      this.zoom = 1;
      
      // Apply transforms
      this.viewport.scale.set(this.zoom);
      this.viewport.position.set(this.width / 2, this.height / 2);
      
      // Flag for render update
      this.needsUpdate = true;
    }
  }
  
  /**
   * Set node visibility
   * @param {string} nodeId - ID of node to show/hide
   * @param {boolean} visible - Whether node should be visible
   */
  setNodeVisibility(nodeId, visible) {
    const sprite = this.nodeSprites.get(nodeId);
    if (sprite) {
      sprite.visible = visible;
      
      // Also set label visibility
      const label = this.labelSprites.get(nodeId);
      if (label) {
        label.visible = visible;
      }
      
      // Flag for render update
      this.needsUpdate = true;
    }
  }
  
  /**
   * Set link visibility
   * @param {string} linkId - ID of link to show/hide
   * @param {boolean} visible - Whether link should be visible
   */
  setLinkVisibility(linkId, visible) {
    const graphics = this.linkSprites.get(linkId);
    if (graphics) {
      graphics.visible = visible;
      
      // Flag for render update
      this.needsUpdate = true;
    }
  }
  
  /**
   * Highlight a specific node
   * @param {string} nodeId - ID of node to highlight
   * @param {number} color - Color to use for highlight
   */
  highlightNode(nodeId, color = null) {
    const sprite = this.nodeSprites.get(nodeId);
    if (sprite) {
      const node = sprite.nodeData;
      
      // Store original color if not already stored
      if (!sprite._originalColor) {
        sprite._originalColor = node.physicProperties?.color || this.config.nodeColor;
      }
      
      // Highlight with specified or default highlight color
      sprite.clear();
      sprite.beginFill(color || this.config.selectedNodeColor);
      sprite.drawCircle(0, 0, node.physicProperties?.radius || this.config.nodeSize);
      sprite.endFill();
      
      // Flag for render update
      this.needsUpdate = true;
    }
  }
  
  /**
   * Reset highlight on a specific node
   * @param {string} nodeId - ID of node to reset
   */
  resetNodeHighlight(nodeId) {
    const sprite = this.nodeSprites.get(nodeId);
    if (sprite) {
      const node = sprite.nodeData;
      
      // Skip if this is the selected node
      if (this.selectedNode && this.selectedNode.id === nodeId) {
        return;
      }
      
      // Skip if this is the hovered node
      if (this.hoveredNode && this.hoveredNode.id === nodeId) {
        return;
      }
      
      // Reset to original color
      sprite.clear();
      sprite.beginFill(sprite._originalColor || this.config.nodeColor);
      sprite.drawCircle(0, 0, node.physicProperties?.radius || this.config.nodeSize);
      sprite.endFill();
      
      // Flag for render update
      this.needsUpdate = true;
    }
  }
  
  /**
   * Update the style of a node
   * @param {string} nodeId - ID of node to update
   * @param {Object} style - Style properties to update
   */
  updateNodeStyle(nodeId, style) {
    const sprite = this.nodeSprites.get(nodeId);
    if (sprite) {
      const node = sprite.nodeData;
      
      // Update node properties
      if (style.radius !== undefined || style.color !== undefined) {
        sprite.clear();
        sprite.beginFill(style.color !== undefined ? style.color : (sprite._originalColor || this.config.nodeColor));
        sprite.drawCircle(0, 0, style.radius !== undefined ? style.radius : (node.physicProperties?.radius || this.config.nodeSize));
        sprite.endFill();
        
        // Update original color if specified
        if (style.color !== undefined) {
          sprite._originalColor = style.color;
        }
      }
      
      // Flag for render update
      this.needsUpdate = true;
    }
  }
  
  /**
   * Update the style of a link
   * @param {string} linkId - ID of link to update
   * @param {Object} style - Style properties to update
   */
  updateLinkStyle(linkId, style) {
    const graphics = this.linkSprites.get(linkId);
    if (graphics) {
      const link = graphics.linkData;
      
      // Get source and target positions
      const sourceNode = link.source.id ? link.source : { x: 0, y: 0 };
      const targetNode = link.target.id ? link.target : { x: 0, y: 0 };
      
      // Update link properties
      graphics.clear();
      graphics.lineStyle(
        style.width !== undefined ? style.width : (link.physicProperties?.width || this.config.linkWidth),
        style.color !== undefined ? style.color : (link.physicProperties?.color || this.config.linkColor),
        style.alpha !== undefined ? style.alpha : (link.physicProperties?.alpha || 1)
      );
      graphics.moveTo(sourceNode.x || 0, sourceNode.y || 0);
      graphics.lineTo(targetNode.x || 0, targetNode.y || 0);
      
      // Flag for render update
      this.needsUpdate = true;
    }
  }
  
  /**
   * Get current configuration
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
    
    // Apply config changes that require immediate updates
    if (newConfig.backgroundColor !== undefined && this.pixiApp) {
      this.pixiApp.renderer.backgroundColor = this.config.backgroundColor;
    }
    
    // Flag for render update
    this.needsUpdate = true;
  }
  
  /**
   * Register node hover handler
   * @param {Function} handler - Function to call when node is hovered
   */
  onNodeHover(handler) {
    this.onNodeHoverHandler = handler;
    return this; // For chaining
  }
  
  /**
   * Register node hover end handler
   * @param {Function} handler - Function to call when node hover ends
   */
  onNodeHoverEnd(handler) {
    this.onNodeHoverEndHandler = handler;
    return this; // For chaining
  }
  
  /**
   * Register node click handler
   * @param {Function} handler - Function to call when node is clicked
   */
  onNodeClick(handler) {
    this.onNodeClickHandler = handler;
    return this; // For chaining
  }
  
  /**
   * Add a custom graphic to the UI layer
   * @param {PIXI.DisplayObject} graphic - PIXI display object to add
   */
  addUIElement(graphic) {
    this.uiLayer.addChild(graphic);
    this.needsUpdate = true;
    return graphic; // For chaining
  }
  
  /**
   * Remove a custom graphic from the UI layer
   * @param {PIXI.DisplayObject} graphic - PIXI display object to remove
   */
  removeUIElement(graphic) {
    this.uiLayer.removeChild(graphic);
    this.needsUpdate = true;
  }
  
  /**
   * Create a tooltip
   * @param {string} text - Text to display in tooltip
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {PIXI.Container} Tooltip container
   */
  createTooltip(text, x, y) {
    // Create container
    const container = new PIXI.Container();
    
    // Create background
    const background = new PIXI.Graphics();
    background.beginFill(0xffffff, 0.9);
    background.lineStyle(1, 0xcccccc);
    background.drawRoundedRect(0, 0, 200, 30, 5);
    background.endFill();
    
    // Create text
    const textSprite = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0x333333,
      align: 'left',
      wordWrap: true,
      wordWrapWidth: 190
    });
    textSprite.position.set(10, 8);
    
    // Add to container
    container.addChild(background);
    container.addChild(textSprite);
    
    // Resize background to fit text
    const textHeight = Math.max(30, textSprite.height + 16);
    background.clear();
    background.beginFill(0xffffff, 0.9);
    background.lineStyle(1, 0xcccccc);
    background.drawRoundedRect(0, 0, 200, textHeight, 5);
    background.endFill();
    
    // Set position
    container.position.set(x, y);
    
    // Add to UI layer
    this.addUIElement(container);
    
    return container;
  }
  
  /**
   * Check if renderer is initialized
   * @returns {boolean} True if initialized
   */
  isReady() {
    return this.isInitialized;
  }
  
  /**
   * Get rendering stats
   * @returns {Object} Rendering statistics
   */
  getStats() {
    return {
      fps: this.frameRate,
      renderCount: this.renderCount,
      nodeCount: this.nodeSprites.size,
      linkCount: this.linkSprites.size,
      labelCount: this.labelSprites.size,
      zoom: this.zoom,
      pan: { ...this.pan }
    };
  }
  
  /**
   * Clean up resources when no longer needed
   */
  destroy() {
    // Stop render loop
    if (this.pixiApp) {
      this.pixiApp.ticker.remove(this.render);
      this.pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    
    // Clear references
    this.nodeSprites.clear();
    this.linkSprites.clear();
    this.labelSprites.clear();
    
    // Mark as not initialized
    this.isInitialized = false;
  }
}

export default RenderingLayer; 