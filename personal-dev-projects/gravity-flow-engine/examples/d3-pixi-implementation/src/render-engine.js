/**
 * Render Engine Module
 * Provides efficient visualization of pattern nodes and relationships using PixiJS.
 */

import * as PIXI from 'pixi.js';

class RenderEngine {
  constructor(containerId, options = {}) {
    // Store container reference
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found.`);
    }
    
    // Configuration options
    this.options = {
      backgroundColor: 0x111111,
      nodeDefaultColor: 0x3498db,
      nodeHoverColor: 0xff7700,
      nodeSelectedColor: 0xffaa00,
      linkDefaultColor: 0x666666,
      linkHighlightColor: 0xaaaaaa,
      textColor: 0xffffff,
      defaultNodeSize: 10,
      defaultLineWidth: 1,
      highlightLineWidth: 2,
      showLabels: true,
      labelSize: 10,
      maxLabels: 100,
      minLabelZoom: 0.5,
      adaptiveDetail: true,
      nodeDetailLevels: [
        { count: 50, edges: true, labels: true, images: true, effects: true },
        { count: 200, edges: true, labels: true, images: true, effects: false },
        { count: 500, edges: true, labels: true, images: false, effects: false },
        { count: 1000, edges: true, labels: false, images: false, effects: false },
        { count: 5000, edges: false, labels: false, images: false, effects: false }
      ],
      ...options
    };
    
    // Initialize state variables
    this.nodes = [];
    this.links = [];
    this.nodeSprites = new Map();
    this.linkSprites = new Map();
    this.labelSprites = new Map();
    this.selectedNode = null;
    this.hoveredNode = null;
    this.width = 0;
    this.height = 0;
    this.currentDetailLevel = 0;
    
    // Viewport state
    this.viewportState = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      dragging: false,
      lastX: 0,
      lastY: 0
    };
    
    // Initialize PIXI renderer and stage
    this.initRenderer();
    
    // Set up event handlers
    this.setupEvents();
  }
  
  /**
   * Initialize the PIXI renderer and stage
   */
  initRenderer() {
    // Get container dimensions
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    // Create renderer
    this.renderer = new PIXI.Renderer({
      width: this.width,
      height: this.height,
      backgroundColor: this.options.backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    // Add canvas to container
    this.container.appendChild(this.renderer.view);
    
    // Create the main stage
    this.stage = new PIXI.Container();
    
    // Create separate containers for links, nodes, and labels
    // This ensures proper rendering order
    this.linkContainer = new PIXI.Container();
    this.nodeContainer = new PIXI.Container();
    this.labelContainer = new PIXI.Container();
    
    // Add containers to stage in correct order
    this.stage.addChild(this.linkContainer);
    this.stage.addChild(this.nodeContainer);
    this.stage.addChild(this.labelContainer);
    
    // Center the view
    this.stage.position.x = this.width / 2;
    this.stage.position.y = this.height / 2;
    
    // Create ticker for animation
    this.ticker = new PIXI.Ticker();
    this.ticker.add(() => this.render());
    this.ticker.start();
  }
  
  /**
   * Set up mouse and touch events for interaction
   */
  setupEvents() {
    // Add event listeners to the renderer view
    this.renderer.view.addEventListener('wheel', this.handleZoom.bind(this));
    this.renderer.view.addEventListener('mousedown', this.handleDragStart.bind(this));
    this.renderer.view.addEventListener('touchstart', this.handleDragStart.bind(this));
    this.renderer.view.addEventListener('mousemove', this.handleDragMove.bind(this));
    this.renderer.view.addEventListener('touchmove', this.handleDragMove.bind(this));
    this.renderer.view.addEventListener('mouseup', this.handleDragEnd.bind(this));
    this.renderer.view.addEventListener('touchend', this.handleDragEnd.bind(this));
    this.renderer.view.addEventListener('mouseleave', this.handleDragEnd.bind(this));
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Event callbacks for nodes
    this.onNodeClick = null;
    this.onNodeHover = null;
    this.onNodeDrag = null;
  }
  
  /**
   * Update the data to be rendered
   */
  updateData(nodes, links) {
    this.nodes = nodes;
    this.links = links;
    
    // Update detail level based on node count
    this.updateDetailLevel();
    
    // Clear previous sprites
    this.clearSprites();
    
    // Create sprites for all links and nodes
    this.createLinkSprites();
    this.createNodeSprites();
    
    // Only create labels if needed for current detail level
    const detailLevel = this.options.nodeDetailLevels[this.currentDetailLevel];
    if (detailLevel.labels && this.options.showLabels) {
      this.createLabelSprites();
    }
    
    return this;
  }
  
  /**
   * Clear all existing sprites
   */
  clearSprites() {
    // Remove all sprites from their containers
    this.nodeContainer.removeChildren();
    this.linkContainer.removeChildren();
    this.labelContainer.removeChildren();
    
    // Clear the maps
    this.nodeSprites.clear();
    this.linkSprites.clear();
    this.labelSprites.clear();
  }
  
  /**
   * Create sprites for all links
   */
  createLinkSprites() {
    const detailLevel = this.options.nodeDetailLevels[this.currentDetailLevel];
    
    // Skip if links shouldn't be shown at this detail level
    if (!detailLevel.edges) return;
    
    this.links.forEach(link => {
      const graphics = new PIXI.Graphics();
      
      // Store the link reference for later updates
      graphics.link = link;
      
      // Add to container and map
      this.linkContainer.addChild(graphics);
      this.linkSprites.set(link.id, graphics);
    });
  }
  
  /**
   * Create sprites for all nodes
   */
  createNodeSprites() {
    this.nodes.forEach(node => {
      // Create node sprite
      const sprite = new PIXI.Graphics();
      const radius = node.radius || this.options.defaultNodeSize;
      
      // Store the node reference for later updates
      sprite.node = node;
      
      // Make the sprite interactive
      sprite.interactive = true;
      sprite.buttonMode = true;
      
      // Set up event handlers
      sprite.on('pointerdown', event => this.handleNodePointerDown(node, event));
      sprite.on('pointerup', event => this.handleNodePointerUp(node, event));
      sprite.on('pointerupoutside', event => this.handleNodePointerUp(node, event));
      sprite.on('pointermove', event => this.handleNodePointerMove(node, event));
      sprite.on('pointerover', () => this.handleNodePointerOver(node));
      sprite.on('pointerout', () => this.handleNodePointerOut(node));
      
      // Store initial position
      sprite.position.x = node.x || 0;
      sprite.position.y = node.y || 0;
      
      // Add to container and map
      this.nodeContainer.addChild(sprite);
      this.nodeSprites.set(node.id, sprite);
    });
  }
  
  /**
   * Create text labels for nodes
   */
  createLabelSprites() {
    const detailLevel = this.options.nodeDetailLevels[this.currentDetailLevel];
    
    // Skip if labels shouldn't be shown at this detail level
    if (!detailLevel.labels) return;
    
    // Limit the number of labels to prevent performance issues
    const nodesToLabel = this.nodes.slice(0, this.options.maxLabels);
    
    nodesToLabel.forEach(node => {
      // Skip nodes without names
      if (!node.name) return;
      
      const style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: this.options.labelSize,
        fill: this.options.textColor,
        align: 'center'
      });
      
      const text = new PIXI.Text(node.name, style);
      text.anchor.set(0.5, -0.8); // Position above the node
      text.position.x = node.x || 0;
      text.position.y = node.y || 0;
      
      // Store the node reference
      text.node = node;
      
      // Add to container and map
      this.labelContainer.addChild(text);
      this.labelSprites.set(node.id, text);
    });
  }
  
  /**
   * Update the rendering detail level based on node count
   */
  updateDetailLevel() {
    if (!this.options.adaptiveDetail) {
      this.currentDetailLevel = 0;
      return;
    }
    
    // Find the appropriate detail level based on node count
    const nodeCount = this.nodes.length;
    let level = 0;
    
    for (let i = 0; i < this.options.nodeDetailLevels.length; i++) {
      if (nodeCount <= this.options.nodeDetailLevels[i].count) {
        level = i;
        break;
      }
      
      // If we've gone through all levels, use the last one
      if (i === this.options.nodeDetailLevels.length - 1) {
        level = i;
      }
    }
    
    this.currentDetailLevel = level;
  }
  
  /**
   * Main render function called on each tick
   */
  render() {
    // Update node sprites positions and styles
    this.updateNodeSprites();
    
    // Update link sprites positions and styles
    this.updateLinkSprites();
    
    // Update label sprites positions
    this.updateLabelSprites();
    
    // Render the stage
    this.renderer.render(this.stage);
  }
  
  /**
   * Update node sprite positions and appearances
   */
  updateNodeSprites() {
    // Update each visible node's sprite
    this.nodeSprites.forEach((sprite, nodeId) => {
      const node = sprite.node;
      
      // Update position
      sprite.position.x = node.x || 0;
      sprite.position.y = node.y || 0;
      
      // Determine the node color based on state
      let color;
      if (this.selectedNode === node) {
        color = this.options.nodeSelectedColor;
      } else if (this.hoveredNode === node) {
        color = this.options.nodeHoverColor;
      } else {
        // Use node's color or the default
        color = node.color || this.getCategoryColor(node) || this.options.nodeDefaultColor;
      }
      
      // Draw the node as a circle
      const radius = node.radius || this.options.defaultNodeSize;
      sprite.clear();
      sprite.beginFill(color);
      sprite.drawCircle(0, 0, radius);
      sprite.endFill();
      
      // Draw a border if selected or hovered
      if (this.selectedNode === node || this.hoveredNode === node) {
        sprite.lineStyle(2, 0xffffff, 0.8);
        sprite.drawCircle(0, 0, radius + 2);
      }
    });
  }
  
  /**
   * Update link sprite positions and appearances
   */
  updateLinkSprites() {
    const detailLevel = this.options.nodeDetailLevels[this.currentDetailLevel];
    
    // Skip if links shouldn't be shown at this detail level
    if (!detailLevel.edges) return;
    
    // Update each visible link's sprite
    this.linkSprites.forEach((sprite, linkId) => {
      const link = sprite.link;
      
      // Get source and target nodes
      const sourceNode = typeof link.source === 'object' ? link.source : this.nodes.find(n => n.id === link.source);
      const targetNode = typeof link.target === 'object' ? link.target : this.nodes.find(n => n.id === link.target);
      
      // Skip if either node is not available
      if (!sourceNode || !targetNode) return;
      
      // Check if link should be highlighted (connected to selected/hovered node)
      const isHighlighted = this.selectedNode && 
                          (this.selectedNode === sourceNode || 
                           this.selectedNode === targetNode);
      
      // Determine color and line width
      const color = isHighlighted ? this.options.linkHighlightColor : link.color || this.options.linkDefaultColor;
      const lineWidth = isHighlighted ? this.options.highlightLineWidth : this.options.defaultLineWidth;
      
      // Draw line from source to target
      sprite.clear();
      sprite.lineStyle(lineWidth, color, 0.8);
      sprite.moveTo(sourceNode.x || 0, sourceNode.y || 0);
      sprite.lineTo(targetNode.x || 0, targetNode.y || 0);
    });
  }
  
  /**
   * Update label sprite positions
   */
  updateLabelSprites() {
    const detailLevel = this.options.nodeDetailLevels[this.currentDetailLevel];
    
    // Skip if labels shouldn't be shown at this detail level
    if (!detailLevel.labels || !this.options.showLabels) return;
    
    // Hide labels if zoom level is too low
    const showLabels = this.viewportState.scale >= this.options.minLabelZoom;
    
    // Update each label's position
    this.labelSprites.forEach((sprite, nodeId) => {
      const node = sprite.node;
      
      // Update position
      sprite.position.x = node.x || 0;
      sprite.position.y = node.y || 0;
      
      // Toggle visibility based on zoom level
      sprite.visible = showLabels;
    });
  }
  
  /**
   * Get a color based on node category
   */
  getCategoryColor(node) {
    if (!node.category) return null;
    
    // Map categories to colors
    switch (node.category.toLowerCase()) {
      case 'structural':
        return 0x3498db; // Blue
      case 'process':
        return 0x2ecc71; // Green
      case 'relationship':
        return 0xe74c3c; // Red
      default:
        return null;
    }
  }
  
  /**
   * Handle zooming via mouse wheel
   */
  handleZoom(event) {
    event.preventDefault();
    
    // Calculate zoom factor
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    
    // Update scale (with min/max limits)
    const newScale = Math.max(0.1, Math.min(5, this.viewportState.scale * zoomFactor));
    
    // Get mouse position relative to stage
    const mouseX = event.clientX - this.renderer.view.getBoundingClientRect().left;
    const mouseY = event.clientY - this.renderer.view.getBoundingClientRect().top;
    
    // Adjust scale and position to zoom toward mouse cursor
    this.stage.scale.set(newScale);
    this.viewportState.scale = newScale;
    
    // Trigger onZoom callback if defined
    if (this.onZoom) {
      this.onZoom(this.viewportState.scale);
    }
  }
  
  /**
   * Handle start of panning via mouse/touch drag
   */
  handleDragStart(event) {
    // Only start stage dragging if not currently dragging a node
    if (!this.draggingNode) {
      this.viewportState.dragging = true;
      this.viewportState.lastX = event.clientX || event.touches[0].clientX;
      this.viewportState.lastY = event.clientY || event.touches[0].clientY;
    }
  }
  
  /**
   * Handle panning via mouse/touch drag
   */
  handleDragMove(event) {
    // Skip if not currently dragging the stage or dragging a node
    if (!this.viewportState.dragging || this.draggingNode) return;
    
    // Get current mouse/touch position
    const currentX = event.clientX || (event.touches ? event.touches[0].clientX : this.viewportState.lastX);
    const currentY = event.clientY || (event.touches ? event.touches[0].clientY : this.viewportState.lastY);
    
    // Calculate the drag delta
    const deltaX = currentX - this.viewportState.lastX;
    const deltaY = currentY - this.viewportState.lastY;
    
    // Update last position
    this.viewportState.lastX = currentX;
    this.viewportState.lastY = currentY;
    
    // Update stage position
    this.stage.position.x += deltaX;
    this.stage.position.y += deltaY;
    
    // Update viewport state
    this.viewportState.offsetX = this.stage.position.x;
    this.viewportState.offsetY = this.stage.position.y;
  }
  
  /**
   * Handle end of panning via mouse/touch drag
   */
  handleDragEnd(event) {
    this.viewportState.dragging = false;
    
    // Trigger onPan callback if defined
    if (this.onPan) {
      this.onPan(this.viewportState.offsetX, this.viewportState.offsetY);
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Update width and height
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    // Resize the renderer
    this.renderer.resize(this.width, this.height);
    
    // Trigger onResize callback if defined
    if (this.onResize) {
      this.onResize(this.width, this.height);
    }
  }
  
  /**
   * Handle node pointer down event for dragging
   */
  handleNodePointerDown(node, event) {
    // Mark as dragging this node
    this.draggingNode = node;
    this.draggingOffset = {
      x: event.data.global.x - node.x,
      y: event.data.global.y - node.y
    };
    
    // Trigger node selection callback
    if (this.onNodeClick) {
      this.onNodeClick(node);
    }
    
    // Update selected node
    this.selectedNode = node;
  }
  
  /**
   * Handle node pointer up event to end dragging
   */
  handleNodePointerUp(node, event) {
    this.draggingNode = null;
    
    // Trigger node drag callback with null to indicate end of drag
    if (this.onNodeDrag) {
      this.onNodeDrag(node, null, null, true);
    }
  }
  
  /**
   * Handle node pointer move event for dragging
   */
  handleNodePointerMove(node, event) {
    // Skip if not dragging or dragging a different node
    if (!this.draggingNode || this.draggingNode !== node) return;
    
    // Calculate new position
    const newX = event.data.global.x - this.draggingOffset.x;
    const newY = event.data.global.y - this.draggingOffset.y;
    
    // Trigger node drag callback
    if (this.onNodeDrag) {
      this.onNodeDrag(node, newX, newY, false);
    }
  }
  
  /**
   * Handle node pointer over event for hover effects
   */
  handleNodePointerOver(node) {
    // Update hovered node
    this.hoveredNode = node;
    
    // Trigger node hover callback
    if (this.onNodeHover) {
      this.onNodeHover(node);
    }
  }
  
  /**
   * Handle node pointer out event to remove hover effects
   */
  handleNodePointerOut(node) {
    // Clear hovered node if it matches
    if (this.hoveredNode === node) {
      this.hoveredNode = null;
      
      // Trigger node hover callback with null
      if (this.onNodeHover) {
        this.onNodeHover(null);
      }
    }
  }
  
  /**
   * Highlight all nodes and links related to a specific node
   */
  highlightRelatedNodes(nodeId) {
    // Clear any existing highlights
    this.clearHighlights();
    
    // Skip if no node ID provided
    if (!nodeId) return;
    
    // Find the node
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Set as selected node
    this.selectedNode = node;
    
    // Render changes
    this.render();
  }
  
  /**
   * Clear all highlights
   */
  clearHighlights() {
    this.selectedNode = null;
    this.hoveredNode = null;
    
    // Render changes
    this.render();
  }
  
  /**
   * Center view on a specific node
   */
  centerOnNode(nodeId) {
    // Find the node
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Calculate new stage position
    const stageX = this.width / 2 - node.x * this.viewportState.scale;
    const stageY = this.height / 2 - node.y * this.viewportState.scale;
    
    // Update stage position
    this.stage.position.x = stageX;
    this.stage.position.y = stageY;
    
    // Update viewport state
    this.viewportState.offsetX = stageX;
    this.viewportState.offsetY = stageY;
    
    // Render changes
    this.render();
  }
  
  /**
   * Register event handlers
   */
  on(event, callback) {
    switch (event) {
      case 'nodeClick':
        this.onNodeClick = callback;
        break;
      case 'nodeHover':
        this.onNodeHover = callback;
        break;
      case 'nodeDrag':
        this.onNodeDrag = callback;
        break;
      case 'zoom':
        this.onZoom = callback;
        break;
      case 'pan':
        this.onPan = callback;
        break;
      case 'resize':
        this.onResize = callback;
        break;
    }
    
    return this;
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Stop the ticker
    this.ticker.stop();
    
    // Remove event listeners
    this.renderer.view.removeEventListener('wheel', this.handleZoom.bind(this));
    this.renderer.view.removeEventListener('mousedown', this.handleDragStart.bind(this));
    this.renderer.view.removeEventListener('touchstart', this.handleDragStart.bind(this));
    this.renderer.view.removeEventListener('mousemove', this.handleDragMove.bind(this));
    this.renderer.view.removeEventListener('touchmove', this.handleDragMove.bind(this));
    this.renderer.view.removeEventListener('mouseup', this.handleDragEnd.bind(this));
    this.renderer.view.removeEventListener('touchend', this.handleDragEnd.bind(this));
    this.renderer.view.removeEventListener('mouseleave', this.handleDragEnd.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Destroy PIXI resources
    this.renderer.destroy(true);
    
    // Remove canvas from container
    if (this.container && this.container.contains(this.renderer.view)) {
      this.container.removeChild(this.renderer.view);
    }
  }
}

export default RenderEngine; 
export default RenderEngine; 