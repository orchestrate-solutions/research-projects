use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Core types for the physics engine
type NodeId = String;
type ForceFunction = fn(&mut PhysicsEngine, f64);

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PhysicalProperties {
    pub mass: f64,
    pub charge: f64,
    pub friction: f64,
    pub radius: f64,
    pub fixed: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LinkPhysicalProperties {
    pub stiffness: f64,
    pub length: f64,
    pub elasticity: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Node {
    pub id: NodeId,
    pub label: String,
    pub category: String,
    pub physical_properties: PhysicalProperties,
    // Physics state
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub fx: Option<f64>,
    pub fy: Option<f64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Link {
    pub source: NodeId,
    pub target: NodeId,
    pub physical_properties: LinkPhysicalProperties,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NodeState {
    pub id: NodeId,
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub category: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LinkState {
    pub source: NodeId,
    pub target: NodeId,
    pub length: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SimulationState {
    pub nodes: Vec<NodeState>,
    pub links: Vec<LinkState>,
    pub tick_count: usize,
    pub alpha: f64,
}

pub struct PhysicsEngine {
    pub nodes: Vec<Node>,
    pub links: Vec<Link>,
    pub options: PhysicsOptions,
    pub forces: HashMap<String, ForceFunction>,
    pub tick_count: usize,
}

#[derive(Clone, Debug)]
pub struct PhysicsOptions {
    pub alpha: f64,
    pub alpha_min: f64,
    pub alpha_decay: f64,
    pub alpha_target: f64,
    pub velocity_decay: f64,
    pub width: f64,
    pub height: f64,
}

impl Default for PhysicsOptions {
    fn default() -> Self {
        PhysicsOptions {
            alpha: 1.0,
            alpha_min: 0.001,
            alpha_decay: 0.0228,
            alpha_target: 0.0,
            velocity_decay: 0.4,
            width: 1000.0,
            height: 1000.0,
        }
    }
}

impl PhysicsEngine {
    pub fn new(nodes: Vec<Node>, links: Vec<Link>, options: Option<PhysicsOptions>) -> Self {
        let mut rng = rand::thread_rng();
        let options = options.unwrap_or_default();
        
        // Initialize random positions if not set
        let nodes = nodes
            .into_iter()
            .map(|mut node| {
                if node.x == 0.0 {
                    node.x = rng.gen::<f64>() * options.width;
                }
                if node.y == 0.0 {
                    node.y = rng.gen::<f64>() * options.height;
                }
                
                node.vx = 0.0;
                node.vy = 0.0;
                
                node
            })
            .collect();

        PhysicsEngine {
            nodes,
            links,
            options,
            forces: HashMap::new(),
            tick_count: 0,
        }
    }
    
    pub fn find_node_index(&self, id: &str) -> Option<usize> {
        self.nodes.iter().position(|node| node.id == id)
    }
    
    pub fn add_force(&mut self, name: &str, force_fn: ForceFunction) {
        self.forces.insert(name.to_string(), force_fn);
    }
    
    pub fn tick(&mut self) -> bool {
        // Skip if simulation has cooled down
        if self.options.alpha < self.options.alpha_min {
            return false;
        }
        
        self.tick_count += 1;
        
        // Apply forces to calculate acceleration
        let alpha = self.options.alpha;
        
        // Collect force functions to avoid borrowing conflict
        let force_fns: Vec<ForceFunction> = self.forces.values().copied().collect();
        
        // Apply each force
        for force_fn in force_fns {
            force_fn(self, alpha);
        }
        
        // Update positions using Velocity Verlet integration
        for node in &mut self.nodes {
            if let Some(fx) = node.fx {
                node.x = fx;
                node.vx = 0.0;
            } else {
                node.vx *= self.options.velocity_decay;
                node.x += node.vx;
            }
            
            if let Some(fy) = node.fy {
                node.y = fy;
                node.vy = 0.0;
            } else {
                node.vy *= self.options.velocity_decay;
                node.y += node.vy;
            }
        }
        
        // Cool down simulation
        self.options.alpha += (self.options.alpha_target - self.options.alpha) * self.options.alpha_decay;
        
        true
    }
    
    pub fn initialize_standard_forces(&mut self) {
        self.add_force("charge", Self::many_body_force);
        self.add_force("link", Self::link_force);
        self.add_force("center", Self::center_force);
        self.add_force("collision", Self::collision_force);
    }
    
    pub fn many_body_force(engine: &mut PhysicsEngine, alpha: f64) {
        let strength = -30.0;
        let node_count = engine.nodes.len();
        
        for i in 0..node_count {
            let (charge_i, x_i, y_i) = {
                let node = &engine.nodes[i];
                (node.physical_properties.charge, node.x, node.y)
            };
            
            for j in (i+1)..node_count {
                let (charge_j, x_j, y_j) = {
                    let node = &engine.nodes[j];
                    (node.physical_properties.charge, node.x, node.y)
                };
                
                // Calculate distance vector
                let dx = x_j - x_i;
                let dy = y_j - y_i;
                let distance_squared = dx * dx + dy * dy;
                
                // Skip if nodes are at the same position
                if distance_squared == 0.0 {
                    continue;
                }
                
                // Calculate repulsive force (inverse square law)
                let distance = distance_squared.sqrt();
                let force = strength * charge_i * charge_j / distance_squared;
                
                // Apply force to both nodes (Newton's third law)
                let unit_x = dx / distance;
                let unit_y = dy / distance;
                
                // Apply forces
                let force_x = unit_x * force * alpha;
                let force_y = unit_y * force * alpha;
                
                // Update velocities for both nodes
                engine.nodes[i].vx -= force_x;
                engine.nodes[i].vy -= force_y;
                engine.nodes[j].vx += force_x;
                engine.nodes[j].vy += force_y;
            }
        }
    }
    
    pub fn link_force(engine: &mut PhysicsEngine, alpha: f64) {
        for link in &engine.links.clone() {
            if let (Some(source_idx), Some(target_idx)) = (
                engine.find_node_index(&link.source),
                engine.find_node_index(&link.target),
            ) {
                let (x1, y1, x2, y2) = {
                    let source = &engine.nodes[source_idx];
                    let target = &engine.nodes[target_idx];
                    (source.x, source.y, target.x, target.y)
                };
                
                // Calculate distance vector
                let dx = x2 - x1;
                let dy = y2 - y1;
                let distance = (dx * dx + dy * dy).sqrt();
                
                // Skip if nodes are at the same position
                if distance == 0.0 {
                    continue;
                }
                
                // Calculate spring force (Hooke's law)
                let natural_length = link.physical_properties.length;
                let stiffness = link.physical_properties.stiffness;
                let displacement = distance - natural_length;
                let spring_force = stiffness * displacement;
                
                // Apply force proportional to displacement
                let unit_x = dx / distance;
                let unit_y = dy / distance;
                
                let fx = spring_force * unit_x * alpha;
                let fy = spring_force * unit_y * alpha;
                
                // Apply forces to source and target
                engine.nodes[source_idx].vx += fx;
                engine.nodes[source_idx].vy += fy;
                engine.nodes[target_idx].vx -= fx;
                engine.nodes[target_idx].vy -= fy;
            }
        }
    }
    
    pub fn center_force(engine: &mut PhysicsEngine, alpha: f64) {
        let center_x = engine.options.width / 2.0;
        let center_y = engine.options.height / 2.0;
        let strength = 0.1;
        
        for node in &mut engine.nodes {
            node.vx += (center_x - node.x) * strength * alpha;
            node.vy += (center_y - node.y) * strength * alpha;
        }
    }
    
    pub fn collision_force(engine: &mut PhysicsEngine, alpha: f64) {
        let node_count = engine.nodes.len();
        
        for i in 0..node_count {
            let (radius_i, x_i, y_i) = {
                let node = &engine.nodes[i];
                (node.physical_properties.radius, node.x, node.y)
            };
            
            for j in (i+1)..node_count {
                let (radius_j, x_j, y_j) = {
                    let node = &engine.nodes[j];
                    (node.physical_properties.radius, node.x, node.y)
                };
                
                // Calculate distance vector
                let dx = x_j - x_i;
                let dy = y_j - y_i;
                let distance = (dx * dx + dy * dy).sqrt();
                
                // Skip if nodes are far apart
                let min_distance = radius_i + radius_j;
                if distance >= min_distance {
                    continue;
                }
                
                // Calculate collision response
                let unit_x = dx / distance;
                let unit_y = dy / distance;
                
                // Move nodes apart
                let separation = min_distance - distance;
                let move_x = unit_x * separation * 0.5;
                let move_y = unit_y * separation * 0.5;
                
                // Apply collision forces
                engine.nodes[i].vx -= move_x * alpha;
                engine.nodes[i].vy -= move_y * alpha;
                engine.nodes[j].vx += move_x * alpha;
                engine.nodes[j].vy += move_y * alpha;
            }
        }
    }
    
    pub fn add_category_group_force(&mut self) {
        self.add_force("category_group", Self::category_group_force);
    }
    
    pub fn category_group_force(engine: &mut PhysicsEngine, alpha: f64) {
        // Group nodes by pattern category
        let width = engine.options.width;
        let height = engine.options.height;
        
        let category_groups = HashMap::from([
            ("structural".to_string(), (width * 0.25, height * 0.25)),
            ("process".to_string(), (width * 0.75, height * 0.25)),
            ("relationship".to_string(), (width * 0.5, height * 0.75)),
        ]);
        
        for node in &mut engine.nodes {
            if let Some(&(target_x, target_y)) = category_groups.get(&node.category) {
                node.vx += (target_x - node.x) * 0.01 * alpha;
                node.vy += (target_y - node.y) * 0.01 * alpha;
            }
        }
    }
    
    pub fn run_simulation(&mut self, steps: usize) -> (usize, f64) {
        let mut completed_steps = 0;
        
        for _ in 0..steps {
            if !self.tick() {
                break;
            }
            completed_steps += 1;
        }
        
        (completed_steps, self.options.alpha)
    }
    
    pub fn get_state(&self) -> SimulationState {
        let nodes = self.nodes
            .iter()
            .map(|node| NodeState {
                id: node.id.clone(),
                x: node.x,
                y: node.y,
                vx: node.vx,
                vy: node.vy,
                category: node.category.clone(),
            })
            .collect();
        
        let links = self.links
            .iter()
            .map(|link| LinkState {
                source: link.source.clone(),
                target: link.target.clone(),
                length: link.physical_properties.length,
            })
            .collect();
        
        SimulationState {
            nodes,
            links,
            tick_count: self.tick_count,
            alpha: self.options.alpha,
        }
    }
}