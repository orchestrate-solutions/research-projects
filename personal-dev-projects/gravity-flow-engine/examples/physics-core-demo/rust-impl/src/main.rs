mod physics_engine;

use physics_engine::*;
use std::collections::HashMap;
use std::fs;

fn main() {
    println!("\n=== Gravity Flow Engine Physics Test (Rust) ===\n");
    
    // Create the test pattern data
    let pattern_data = create_test_pattern_data();
    
    // Create physics engine with default options
    let mut engine = PhysicsEngine::new(
        pattern_data.0,
        pattern_data.1,
        None
    );
    
    // Initialize standard forces
    engine.initialize_standard_forces();
    
    // Add the custom category grouping force
    engine.add_category_group_force();
    
    // Log initial state
    println!("Initial state:");
    let initial_state = engine.get_state();
    log_state(&initial_state, "initial");
    
    // Run simulation for 10 steps
    println!("\nRunning simulation for 10 steps...");
    engine.run_simulation(10);
    let state10 = engine.get_state();
    log_state(&state10, "step10");
    
    // Run simulation for 50 more steps
    println!("\nRunning simulation for 50 more steps...");
    engine.run_simulation(50);
    let state60 = engine.get_state();
    log_state(&state60, "step60");
    
    // Run simulation for 100 more steps
    println!("\nRunning simulation for 100 more steps...");
    engine.run_simulation(100);
    let state160 = engine.get_state();
    log_state(&state160, "step160");
    
    // Run until stabilized
    println!("\nRunning until stabilized...");
    let (completed_steps, alpha) = engine.run_simulation(1000);
    println!("Simulation ran for {} more steps until alpha = {:.6}", completed_steps, alpha);
    let final_state = engine.get_state();
    log_state(&final_state, "final");
    
    // Save all states to a JSON file for further analysis
    let all_states = HashMap::from([
        ("initial".to_string(), initial_state),
        ("step10".to_string(), state10),
        ("step60".to_string(), state60),
        ("step160".to_string(), state160),
        ("final".to_string(), final_state.clone()),
    ]);
    
    let json = serde_json::to_string_pretty(&all_states).unwrap();
    fs::write("simulation-results-rust.json", json).expect("Unable to write file");
    println!("\nSimulation results saved to simulation-results-rust.json");
    
    // Calculate metrics for the final state
    calculate_metrics(&final_state);
    
    println!("\n=== Test Complete ===");
}

// Helper function to log state in a readable format
fn log_state(state: &SimulationState, label: &str) {
    println!("State at {} (tick {}, alpha: {:.6}):", label, state.tick_count, state.alpha);
    
    // Log node positions
    println!("Node positions (x, y):");
    for node in &state.nodes {
        println!("  {:<25}: ({:.2}, {:.2}) velocity: ({:.2}, {:.2})",
            node.id, node.x, node.y, node.vx, node.vy);
    }
}

// Calculate and log metrics about the simulation
fn calculate_metrics(state: &SimulationState) {
    // Average distance between nodes
    let mut total_distance = 0.0;
    let mut count = 0;
    
    for i in 0..state.nodes.len() {
        for j in (i+1)..state.nodes.len() {
            let node1 = &state.nodes[i];
            let node2 = &state.nodes[j];
            let dx = node2.x - node1.x;
            let dy = node2.y - node1.y;
            let distance = (dx * dx + dy * dy).sqrt();
            
            total_distance += distance;
            count += 1;
        }
    }
    
    let avg_distance = total_distance / count as f64;
    println!("\nMetrics:");
    println!("  Average distance between nodes: {:.2}", avg_distance);
    
    // Check if categories are clustered
    let mut category_positions: HashMap<String, (Vec<&NodeState>, f64, f64)> = HashMap::new();
    
    for node in &state.nodes {
        category_positions
            .entry(node.category.clone())
            .and_modify(|(nodes, x, y)| {
                nodes.push(node);
                *x += node.x;
                *y += node.y;
            })
            .or_insert((vec![node], node.x, node.y));
    }
    
    // Calculate centroid for each category
    for (category, (nodes, x, y)) in &mut category_positions {
        let node_count = nodes.len() as f64;
        *x /= node_count;
        *y /= node_count;
        
        // Calculate average distance from centroid
        let mut total_dist_from_centroid = 0.0;
        for node in nodes {
            let dx = node.x - *x;
            let dy = node.y - *y;
            total_dist_from_centroid += (dx * dx + dy * dy).sqrt();
        }
        
        let avg_dist_from_centroid = total_dist_from_centroid / node_count;
        println!("  Category \"{}\" centroid: ({:.2}, {:.2}), avg distance: {:.2}",
            category, x, y, avg_dist_from_centroid);
    }
}

// Create test pattern data
fn create_test_pattern_data() -> (Vec<Node>, Vec<Link>) {
    // Create nodes
    let nodes = vec![
        // Structural patterns
        Node {
            id: "fractal-self-similarity".to_string(),
            label: "Fractal Self-Similarity".to_string(),
            category: "structural".to_string(),
            physical_properties: PhysicalProperties {
                mass: 5.0,
                charge: -150.0,
                friction: 0.2,
                radius: 15.0,
                fixed: false,
            },
            x: 0.0, y: 0.0, vx: 0.0, vy: 0.0, fx: None, fy: None
        },
        Node {
            id: "network-structure".to_string(),
            label: "Network Structure".to_string(),
            category: "structural".to_string(),
            physical_properties: PhysicalProperties {
                mass: 8.0,
                charge: -150.0,
                friction: 0.2,
                radius: 20.0,
                fixed: false,
            },
            x: 0.0, y: 0.0, vx: 0.0, vy: 0.0, fx: None, fy: None
        },
        Node {
            id: "hierarchical-organization".to_string(),
            label: "Hierarchical Organization".to_string(),
            category: "structural".to_string(),
            physical_properties: PhysicalProperties {
                mass: 6.0,
                charge: -150.0,
                friction: 0.2,
                radius: 18.0,
                fixed: false,
            },
            x: 0.0, y: 0.0, vx: 0.0, vy: 0.0, fx: None, fy: None
        },
        
        // Process patterns
        Node {
            id: "emergent-behavior".to_string(),
            label: "Emergent Behavior".to_string(),
            category: "process".to_string(),
            physical_properties: PhysicalProperties {
                mass: 4.0,
                charge: -120.0,
                friction: 0.3,
                radius: 14.0,
                fixed: false,
            },
            x: 0.0, y: 0.0, vx: 0.0, vy: 0.0, fx: None, fy: None
        },
        Node {
            id: "feedback-loops".to_string(),
            label: "Feedback Loops".to_string(),
            category: "process".to_string(),
            physical_properties: PhysicalProperties {
                mass: 5.0,
                charge: -130.0,
                friction: 0.3,
                radius: 15.0,
                fixed: false,
            },
            x: 0.0, y: 0.0, vx: 0.0, vy: 0.0, fx: None, fy: None
        },
        Node {
            id: "cyclical-patterns".to_string(),
            label: "Cyclical Patterns".to_string(),
            category: "process".to_string(),
            physical_properties: PhysicalProperties {
                mass: 4.0,
                charge: -120.0,
                friction: 0.3,
                radius: 14.0,
                fixed: false,
            },
            x: 0.0, y: 0.0, vx: 0.0, vy: 0.0, fx: None, fy: None
        },
        
        // Relationship patterns
        Node {
            id: "resource-distribution".to_string(),
            label: "Resource Distribution".to_string(),
            category: "relationship".to_string(),
            physical_properties: PhysicalProperties {
                mass: 3.0,
                charge: -100.0,
                friction: 0.4,
                radius: 12.0,
                fixed: false,
            },
            x: 0.0, y: 0.0, vx: 0.0, vy: 0.0, fx: None, fy: None
        },
        Node {
            id: "symbiosis-mutualism".to_string(),
            label: "Symbiosis & Mutualism".to_string(),
            category: "relationship".to_string(),
            physical_properties: PhysicalProperties {
                mass: 3.0,
                charge: -100.0,
                friction: 0.4,
                radius: 12.0,
                fixed: false,
            },
            x: 0.0, y: 0.0, vx: 0.0, vy: 0.0, fx: None, fy: None
        },
    ];
    
    // Create links
    let links = vec![
        // Structural pattern relationships
        Link {
            source: "fractal-self-similarity".to_string(),
            target: "hierarchical-organization".to_string(),
            physical_properties: LinkPhysicalProperties {
                stiffness: 0.3,
                length: 100.0,
                elasticity: 0.5,
            },
        },
        Link {
            source: "fractal-self-similarity".to_string(),
            target: "network-structure".to_string(),
            physical_properties: LinkPhysicalProperties {
                stiffness: 0.3,
                length: 100.0,
                elasticity: 0.5,
            },
        },
        Link {
            source: "network-structure".to_string(),
            target: "hierarchical-organization".to_string(),
            physical_properties: LinkPhysicalProperties {
                stiffness: 0.3,
                length: 100.0,
                elasticity: 0.5,
            },
        },
        
        // Process pattern relationships
        Link {
            source: "emergent-behavior".to_string(),
            target: "feedback-loops".to_string(),
            physical_properties: LinkPhysicalProperties {
                stiffness: 0.4,
                length: 100.0,
                elasticity: 0.5,
            },
        },
        Link {
            source: "feedback-loops".to_string(),
            target: "cyclical-patterns".to_string(),
            physical_properties: LinkPhysicalProperties {
                stiffness: 0.5,
                length: 80.0,
                elasticity: 0.5,
            },
        },
        
        // Relationship pattern relationships
        Link {
            source: "resource-distribution".to_string(),
            target: "symbiosis-mutualism".to_string(),
            physical_properties: LinkPhysicalProperties {
                stiffness: 0.3,
                length: 100.0,
                elasticity: 0.5,
            },
        },
        
        // Cross-category relationships
        Link {
            source: "network-structure".to_string(),
            target: "resource-distribution".to_string(),
            physical_properties: LinkPhysicalProperties {
                stiffness: 0.2,
                length: 150.0,
                elasticity: 0.5,
            },
        },
        Link {
            source: "hierarchical-organization".to_string(),
            target: "emergent-behavior".to_string(),
            physical_properties: LinkPhysicalProperties {
                stiffness: 0.2,
                length: 150.0,
                elasticity: 0.5,
            },
        },
        Link {
            source: "feedback-loops".to_string(),
            target: "symbiosis-mutualism".to_string(),
            physical_properties: LinkPhysicalProperties {
                stiffness: 0.2,
                length: 150.0,
                elasticity: 0.5,
            },
        },
    ];
    
    (nodes, links)
} 