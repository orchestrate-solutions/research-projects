# Research Projects

This repository contains various research projects organized in a hierarchical structure from generic to specific, similar to taxonomic classification.

## Folder Structure

Research projects should be organized in the following hierarchical structure:

```
research-projects/
├── [Field]/                 # Broad academic field (e.g., Computer Science, Biology, Physics)
│   ├── [Subfield]/          # Specific subfield of study (e.g., Machine Learning, Genetics, Quantum Mechanics)
│       ├── [Project]/       # Individual research project (e.g., Neural Networks, DNA Sequencing, Quantum Entanglement)
│           ├── data/        # Project-specific data
│           ├── notebooks/   # Analysis notebooks
│           ├── src/         # Source code
│           ├── docs/        # Documentation
│           └── README.md    # Project-specific readme
```

### Creating a New Research Project

To create a new research project:

1. Identify the appropriate [Field] and [Subfield] categories for your project
2. If the necessary categories don't exist, create them
3. Create a new folder for your [Project] with a descriptive name
4. Include the standard subfolders (data, notebooks, src, docs)
5. Create a project-specific README.md file describing your research

### Naming Conventions

- Use kebab-case for all folder names (e.g., `machine-learning`, `dna-sequencing`)
- Be descriptive but concise in naming
- Avoid using special characters other than hyphens

## Example Structure

```
research-projects/
├── computer-science/
│   ├── machine-learning/
│   │   ├── neural-networks/
│   │   └── reinforcement-learning/
│   └── cryptography/
│       └── blockchain/
├── biology/
│   └── genetics/
│       └── dna-sequencing/
└── physics/
    └── quantum-mechanics/
        └── quantum-entanglement/
```

## License

This repository is private and all rights are reserved. 