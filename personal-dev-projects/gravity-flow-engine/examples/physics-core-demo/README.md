# Gravity Flow Engine - Physics Core Demo

This demo implements the core physics calculations for the Gravity Flow Engine without any visualization components. It's designed to test the mathematical foundation of the engine independently from rendering.

## What Does This Demo Do?

The demo:

1. Creates a network of pattern nodes with various physical properties (mass, charge, radius)
2. Sets up physical relationships between patterns (spring forces with stiffness and length)
3. Runs a force-directed physics simulation using mathematical calculations
4. Records the positions of nodes at different stages of the simulation
5. Calculates metrics about the simulation (clustering, distances)

## Implementations

This demo provides two implementations of the physics engine:

### JavaScript

- Located in the root directory
- Simple to run with Node.js
- Good for rapid prototyping and testing

### Rust

- Located in the `rust-impl` directory
- More performant for complex calculations
- Type-safe and memory-efficient
- Requires Rust toolchain to build and run

## Running the JavaScript Version

```bash
node test-physics.js
```

This will run the simulation and print the results to the console, as well as save detailed data to `simulation-results.json`.

## Running the Rust Version

```bash
cd rust-impl
cargo run --release
```

This will compile and run the Rust implementation, printing results to the console and saving data to `simulation-results-rust.json`.

## Core Physics Concepts

Both implementations feature the same physics forces:

1. **Many-body force**: Repulsion/attraction between nodes based on charge (inverse square law)
2. **Link force**: Spring forces between connected nodes (Hooke's law)
3. **Center force**: Force pulling nodes toward the center of the space
4. **Collision force**: Prevents nodes from overlapping
5. **Custom category grouping force**: Pulls nodes toward their category centroid

## Comparing Results

After running both implementations, you can compare the simulation results to verify that the underlying physics calculations produce similar outcomes despite the different programming languages.

## Next Steps

After validating the mathematical correctness of the physics engines, the next step is to connect them to a visualization layer. The calculations from this demo will provide the foundation for the visual implementation. 