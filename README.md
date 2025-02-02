= spec-1: 3d link-tree website for voxl os
:sectnums:
:toc:

== background

This project is a visually immersive, 3d link-tree website designed to represent the aesthetic foundation of voxl os, a future virtual reality operating system. While it does not function as an os shell, the design aims to embody a conceptual "shell" with interactive, node-based structures in 3d space.

The website's purpose is to create intrigue and reflect the branding of voxl. It acts as a hub for links and key information while being lightweight and performant, with a secondary goal of impressing the user, while being functional.

== requirements

The requirements are prioritized using the moscow:

=== must-have
- interactive 3d interface with wireframe nodes representing clickable links in vr-style space
- dynamic animation of nodes and lines reacting to user interaction
- accessible representation of links (e.g., hover effects, labels, or tooltips)
- performance across modern browsers, with mobile responsiveness
- aesthetic consistency with the voxl os branding (wireframe, minimalism)
- 2d terminal ui elements as a visual callback to os design, grounding the design in "function"
- modular expandable codebase, less hadrcoding

=== should-have
- smooth animations (e.g., node hover effects, structure rotation, dynamic lighting)
- basic accessibility features (keyboard navigation, readable visuals)
- lightweight backend or json configuration for managing link data

=== could-have
- parallax or audio effects to enhance the aesthetic
- hidden easter eggs or interactive elements
- direct feedback feature w/ supportinf backend 

=== won't-have
- functional os-level features
- unnecessary complexity in user interactions

== method

The site is implemented with next.js for the web application framework and three.js for 3d rendering. The following describes the core functionality:

=== core features

**node system**
- dynamically generates 3d nodes with random initial positions and velocities.
- nodes are bounded by a defined area and reverse direction upon collision with boundaries.
- methods:
  - `createRandomNodes`: generates random node positions and velocities.
  - `clampAndBounce`: constrains nodes within boundaries and reverses velocity when needed.

**wireframe visualization**
- each node is rendered as a wireframe cube, aligned with the futuristic design.
- methods:
  - `createEdgeWireframes`: creates edges for cube wireframes using three.js's `edgesgeometry` and `linesegments`.

**connecting lines**
- dynamic connections between nodes are drawn, with opacity based on the distance between nodes. lines disappear when the distance exceeds a threshold.
- methods:
  - `createConnectingLines`: handles line creation and adjusts their visibility/opacity in real time.

**grid overlay**
- a structured 3d grid adds context and enhances the visual composition.
- methods:
  - `createGrid`: creates grid lines based on the bounding box dimensions.

**camera rotation**
- implements smooth camera rotation triggered by scroll events, providing an interactive view.
- methods:
  - `animateScene`: animates camera transitions between angles while maintaining focus on the center of the scene.

**real-time animation**
- continuously updates node positions, wireframes, and connecting lines in an animation loop.
- methods:
  - `animateScene`: updates all moving elements and renders the scene frame by frame.

=== technical stack
- **framework**: next.js for server-side rendering and routing.
- **3d rendering**: three.js for object creation, animation, and rendering.
- **state management**: react's `useState` and `useEffect` for node and interaction management.

=== data structures
- **nodeObject**:
  - `x, y, z`: 3d coordinates.
  - `dx, dy, dz`: velocity in each axis.
- **boundingBox**:
  - `minX, maxX, minY, maxY, minZ, maxZ`: defines movement boundaries.

```asciidoc
[plantuml]
....
@startuml
actor user
node "3d scene" {
  rectangle "node system" as nodes
  rectangle "wireframe" as wireframe
  rectangle "connecting lines" as lines
  rectangle "grid overlay" as grid
  rectangle "camera controls" as camera
}
user -> nodes : scroll/mouse input
nodes -> wireframe : generate 3d cubes
nodes -> lines : draw dynamic lines
nodes -> grid : render grid
nodes -> camera : handle view transitions
@enduml
....

=== extension opportunities
- **hover effects**: highlight nodes on hover and display tooltips.
- **clickable nodes**: trigger events or navigate to links on click.
- **responsive design**: ensure optimal performance and usability on mobile and tablet.
- **webxr support**: add basic vr compatibility for immersive navigation.

== milestones

1. **mvp**:
   - dynamic 3d nodes with animations and connecting lines.
   - grid overlay and camera controls.
2. **interactive release**:
   - hover effects and clickable nodes.
   - tooltips for links.
3. **advanced release**:
   - webxr support and enhanced visuals (e.g., parallax effects, audio).

== success metrics

- **performance**: the website runs smoothly on modern browsers and devices.
- **usability**: intuitive interactions and clear representation of links.
- **design fidelity**: aligns with the visual branding of voxl os.
- **engagement**: positive user feedback on interactivity and aesthetic.