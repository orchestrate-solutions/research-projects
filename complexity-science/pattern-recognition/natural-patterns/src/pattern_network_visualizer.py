#!/usr/bin/env python3

"""
Pattern Network Visualizer

This script visualizes relationships between patterns as a network graph.
As we collect more patterns, update the pattern_relationships dictionary.
"""

import networkx as nx
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import json
import os
from pathlib import Path

# Define pattern categories and their colors
CATEGORIES = {
    "Structural": "blue",
    "Process": "green",
    "Relationship": "red",
    "Resilience": "purple"
}

# Define pattern relationships (will grow as we collect more patterns)
# Format: pattern_name -> list of related pattern names
PATTERN_RELATIONSHIPS = {
    "Fractal Self-Similarity": ["Emergent Behavior", "Hierarchical Organization"],
    "Emergent Behavior": ["Fractal Self-Similarity", "Feedback Loops", "Self-Organization"],
    "Feedback Loops": ["Emergent Behavior", "Cyclical Patterns", "Adaptive Capacity"],
    "Network Structure": ["Fractal Self-Similarity", "Resource Distribution"],
    "Hierarchical Organization": ["Fractal Self-Similarity", "Network Structure"],
    "Cyclical Patterns": ["Feedback Loops", "Adaptation and Evolution"],
    "Resource Distribution": ["Network Structure", "Symbiosis and Mutualism"],
    "Adaptation and Evolution": ["Cyclical Patterns", "Feedback Loops"],
    "Symbiosis and Mutualism": ["Resource Distribution", "Adaptation and Evolution"],
    "Boundaries and Interfaces": ["Symbiosis and Mutualism", "Hierarchical Organization"]
}

# Assign pattern categories (will grow as we collect more patterns)
PATTERN_CATEGORIES = {
    "Fractal Self-Similarity": "Structural",
    "Emergent Behavior": "Process",
    "Feedback Loops": "Process",
    "Network Structure": "Structural",
    "Hierarchical Organization": "Structural",
    "Cyclical Patterns": "Process",
    "Resource Distribution": "Relationship",
    "Adaptation and Evolution": "Process",
    "Symbiosis and Mutualism": "Relationship",
    "Boundaries and Interfaces": "Resilience"
}

def create_pattern_network():
    """Create a network graph from pattern relationships."""
    G = nx.Graph()
    
    # Add nodes with category attributes
    for pattern, category in PATTERN_CATEGORIES.items():
        G.add_node(pattern, category=category)
    
    # Add edges from relationship dictionary
    for pattern, related_patterns in PATTERN_RELATIONSHIPS.items():
        if pattern in PATTERN_CATEGORIES:  # Only add if we have the pattern categorized
            for related in related_patterns:
                if related in PATTERN_CATEGORIES:  # Only add if we have the related pattern categorized
                    G.add_edge(pattern, related)
    
    return G

def visualize_pattern_network(G, output_file=None):
    """Visualize the pattern network with nodes colored by category."""
    plt.figure(figsize=(16, 12))
    
    # Get positions for nodes
    pos = nx.spring_layout(G, seed=42, k=0.3)
    
    # Draw nodes, colored by category
    for category, color in CATEGORIES.items():
        node_list = [node for node, data in G.nodes(data=True) if data.get("category") == category]
        nx.draw_networkx_nodes(G, pos, nodelist=node_list, node_color=color, 
                              node_size=2000, alpha=0.8, label=category)
    
    # Draw edges
    nx.draw_networkx_edges(G, pos, width=1.5, alpha=0.7)
    
    # Draw labels
    nx.draw_networkx_labels(G, pos, font_size=10, font_family="sans-serif")
    
    # Add legend and title
    plt.title("Pattern Relationship Network", fontsize=20)
    plt.legend(fontsize=12)
    plt.axis("off")
    
    # Save or show
    if output_file:
        plt.savefig(output_file, dpi=300, bbox_inches="tight")
        print(f"Network visualization saved to {output_file}")
    else:
        plt.show()

def save_network_data(G, output_file):
    """Save network data as JSON for potential web visualization."""
    data = {
        "nodes": [],
        "links": []
    }
    
    # Add nodes
    for node, attrs in G.nodes(data=True):
        data["nodes"].append({
            "id": node,
            "category": attrs.get("category", "Unknown")
        })
    
    # Add links
    for source, target in G.edges():
        data["links"].append({
            "source": source,
            "target": target
        })
    
    # Save to file
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Network data saved to {output_file}")

def main():
    """Main function to generate and save visualizations."""
    # Create output directories if they don't exist
    output_dir = Path(__file__).parent.parent / "docs" / "visualizations"
    output_dir.mkdir(exist_ok=True, parents=True)
    
    # Create network
    G = create_pattern_network()
    
    # Generate and save visualization
    visualize_pattern_network(G, output_file=output_dir / "pattern_network.png")
    
    # Save network data for web visualization
    save_network_data(G, output_dir / "pattern_network.json")
    
    print(f"Network has {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")
    print(f"Visualizations saved to {output_dir}")

if __name__ == "__main__":
    main() 