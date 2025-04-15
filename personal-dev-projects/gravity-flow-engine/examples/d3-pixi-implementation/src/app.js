/**
 * Gravity Flow Engine - D3-PixiJS Integration Demo
 * Main application entry point
 */

import PhysicsEngine from './physics-engine.js';
import RenderEngine from './render-engine.js';
import { PatternData } from './data-model.js';
import './styles.css';

class GravityFlowApplication {
  constructor(container) {
    this.container = container;
    this.initialized = false;
    
    // Pattern data
    this.patternData = new PatternData();
    
    // Engine instances
    this.physicsEngine = null;
    this.renderEngine = null;
    
    // UI elements
    this.controlPanel = null;
    this.infoPanel = null;
    
    // Initialize the application
    this.init();
  }
  
  /**
   * Initialize the application
   */
  async init() {
    try {
      // Load pattern data
      const patterns = await this.patternData.loadPatterns();
      
      // Create the UI
      this.createUI();
      
      // Initialize engines
      this.initPhysicsEngine(patterns);
      this.initRenderEngine();
      
      // Connect physics to rendering
      this.connectEngines();
      
      // Start the simulation
      this.physicsEngine.startSimulation();
      
      this.initialized = true;
      console.log('Gravity Flow application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gravity Flow application:', error);
    }
  }
  
  /**
   * Initialize the physics engine with pattern data
   */
  initPhysicsEngine(patterns) {
    const { nodes, links } = patterns;
    this.physicsEngine = new PhysicsEngine(nodes, links);
  }
  
  /**
   * Initialize the render engine
   */
  initRenderEngine() {
    this.renderEngine = new RenderEngine(this.container, {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    });
    
    // Set up node interactions
    this.renderEngine.setNodeClickCallback(this.handleNodeClick.bind(this));
    this.renderEngine.setNodeHoverCallback(this.handleNodeHover.bind(this));
  }
  
  /**
   * Connect physics engine to render engine
   */
  connectEngines() {
    // Update callback for animation loop
    const updateFrame = () => {
      if (this.physicsEngine && this.renderEngine) {
        // Get current simulation state
        const nodes = this.physicsEngine.getNodes();
        const links = this.physicsEngine.getLinks();
        
        // Update rendering
        this.renderEngine.updateNodes(nodes);
        this.renderEngine.updateLinks(links);
      }
      
      // Request next frame
      requestAnimationFrame(updateFrame);
    };
    
    // Start animation loop
    updateFrame();
  }
  
  /**
   * Create UI elements
   */
  createUI() {
    // Create control panel
    this.controlPanel = document.createElement('div');
    this.controlPanel.className = 'control-panel';
    
    // Create sliders for physics parameters
    this.createPhysicsControls();
    
    // Create filter controls
    this.createFilterControls();
    
    // Create reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Simulation';
    resetButton.addEventListener('click', () => {
      this.physicsEngine.resetSimulation();
    });
    
    this.controlPanel.appendChild(resetButton);
    
    // Create info panel for displaying pattern details
    this.infoPanel = document.createElement('div');
    this.infoPanel.className = 'info-panel';
    this.infoPanel.innerHTML = '<h3>Pattern Details</h3><p>Select a pattern to view details</p>';
    
    // Add UI elements to container
    document.body.appendChild(this.controlPanel);
    document.body.appendChild(this.infoPanel);
  }
  
  /**
   * Create physics parameter controls
   */
  createPhysicsControls() {
    const createControl = (name, min, max, value, step, callback) => {
      const control = document.createElement('div');
      control.className = 'control';
      
      const label = document.createElement('label');
      label.textContent = name;
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = min;
      slider.max = max;
      slider.value = value;
      slider.step = step;
      
      const valueDisplay = document.createElement('span');
      valueDisplay.textContent = value;
      
      slider.addEventListener('input', (event) => {
        const newValue = parseFloat(event.target.value);
        valueDisplay.textContent = newValue;
        callback(newValue);
      });
      
      control.appendChild(label);
      control.appendChild(slider);
      control.appendChild(valueDisplay);
      
      return control;
    };
    
    // Create physics parameter controls
    const chargeControl = createControl('Charge Strength', -100, 0, -30, 1, 
      value => this.physicsEngine.setChargeStrength(value));
    
    const linkStrengthControl = createControl('Link Strength', 0, 1, 0.3, 0.01, 
      value => this.physicsEngine.setLinkStrength(value));
    
    const linkDistanceControl = createControl('Link Distance', 10, 200, 30, 1, 
      value => this.physicsEngine.setLinkDistance(value));
    
    // Add controls to panel
    this.controlPanel.appendChild(chargeControl);
    this.controlPanel.appendChild(linkStrengthControl);
    this.controlPanel.appendChild(linkDistanceControl);
  }
  
  /**
   * Create category filter controls
   */
  createFilterControls() {
    const filterSection = document.createElement('div');
    filterSection.className = 'filter-section';
    
    const filterLabel = document.createElement('h3');
    filterLabel.textContent = 'Filter by Category';
    filterSection.appendChild(filterLabel);
    
    // Create checkboxes for each category
    const categories = ['structural', 'process', 'relationship'];
    
    categories.forEach(category => {
      const filterOption = document.createElement('div');
      filterOption.className = 'filter-option';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `filter-${category}`;
      checkbox.checked = true;
      
      const label = document.createElement('label');
      label.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      label.setAttribute('for', `filter-${category}`);
      
      checkbox.addEventListener('change', () => {
        this.toggleCategory(category, checkbox.checked);
      });
      
      filterOption.appendChild(checkbox);
      filterOption.appendChild(label);
      filterSection.appendChild(filterOption);
    });
    
    this.controlPanel.appendChild(filterSection);
  }
  
  /**
   * Toggle visibility of nodes by category
   */
  toggleCategory(category, visible) {
    this.physicsEngine.filterByCategory(category, visible);
  }
  
  /**
   * Handle node click event
   */
  handleNodeClick(node) {
    if (!node) {
      this.infoPanel.innerHTML = '<h3>Pattern Details</h3><p>Select a pattern to view details</p>';
      return;
    }
    
    // Display node information
    let html = `
      <h3>${node.name || 'Unnamed Pattern'}</h3>
      <p><strong>Category:</strong> ${node.category || 'None'}</p>
    `;
    
    if (node.description) {
      html += `<p><strong>Description:</strong> ${node.description}</p>`;
    }
    
    if (node.physicalProperties) {
      html += `
        <h4>Physical Properties</h4>
        <ul>
          <li>Mass: ${node.physicalProperties.mass}</li>
          <li>Radius: ${node.physicalProperties.radius}</li>
        </ul>
      `;
    }
    
    if (node.relationships && node.relationships.length > 0) {
      html += `
        <h4>Relationships</h4>
        <ul>
          ${node.relationships.map(rel => 
            `<li>${rel.type} with ${rel.targetName || rel.targetId}</li>`
          ).join('')}
        </ul>
      `;
    }
    
    this.infoPanel.innerHTML = html;
  }
  
  /**
   * Handle node hover event
   */
  handleNodeHover(node) {
    // Update cursor or show quick info tooltip
    if (node) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
  }
  
  /**
   * Resize application to fit container
   */
  resize() {
    if (this.renderEngine) {
      this.renderEngine.resize(
        this.container.clientWidth,
        this.container.clientHeight
      );
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.physicsEngine) {
      this.physicsEngine.stopSimulation();
    }
    
    if (this.renderEngine) {
      this.renderEngine.destroy();
    }
    
    if (this.controlPanel && this.controlPanel.parentNode) {
      this.controlPanel.parentNode.removeChild(this.controlPanel);
    }
    
    if (this.infoPanel && this.infoPanel.parentNode) {
      this.infoPanel.parentNode.removeChild(this.infoPanel);
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  if (!container) {
    console.error('Container element #app not found!');
    return;
  }
  
  window.gravityFlowApp = new GravityFlowApplication(container);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    window.gravityFlowApp.resize();
  });
}); 