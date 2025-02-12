= spec-1: 3d link-tree website for voxl os
:sectnums:
:toc:

== background

this project is a visually immersive, 3d link-tree website designed to represent the aesthetic foundation of voxl os, a future virtual reality operating system. while it does not function as an os shell, the design aims to embody a conceptual "shell" with interactive, node-based structures in 3d space.

the website's purpose is to create intrigue and reflect the branding of voxl os. it acts as a hub for links and key information while being lightweight and performant, with a secondary goal of impressing the user, while remaining functional.

== requirements

the requirements are prioritized using the MoSCoW method:

=== must-have
- interactive 3d interface with wireframe nodes representing clickable links in vr-style space
- dynamic animation of nodes and lines reacting to user interaction
- accessible representation of links (e.g., hover effects, labels, or tooltips)
- performance across modern browsers, with mobile responsiveness
- aesthetic consistency with the voxl os branding (wireframe, minimalism)
- 2d terminal ui elements as a visual callback to os design, grounding the design in "function"
- modular, expandable codebase with minimal hardcoding

=== should-have
- smooth animations (e.g., node hover effects, structure rotation, dynamic lighting)
- basic accessibility features (keyboard navigation, readable visuals)
- lightweight backend or json configuration for managing link data

=== won't-have
- functional os-level features
- unnecessary complexity in user interactions

== method

the site is implemented with Next.js for the web application framework and Three.js for 3d rendering. the following describes the core functionality.

=== core features

**node system**  
- dynamically generates 3d nodes with random initial positions and velocities  
- nodes are bounded by a defined area and reverse direction upon collision with boundaries  
- _methods_:
  - `createRandomNodes(count)`: generates random node positions and velocities
  - `clampAndBounce(node, boundingBox)`: constrains node movement within boundaries, reversing velocity as needed

**axes node system**  
- a secondary system of “axes nodes,” each visually represented by a small 3d cross  
- they bounce within the same bounding box but also use a sine-wave function to modulate their opacity over time  
- _methods_:
  - `createAxesNodes(count)`: spawns a specified number of axes nodes at random positions with random velocities

**wireframe visualization**  
- each regular node is rendered as a wireframe cube  
- _methods_:
  - `createEdgeWireframes(scene, nodes)`: creates edges for cube wireframes using Three.js's `EdgesGeometry` and `LineSegments`

**connecting lines**  
- dynamic connections between nodes are drawn, with opacity based on the distance between nodes. lines disappear when the distance exceeds a threshold  
- additional lines connect regular nodes to axes nodes, factoring in both node distance and the axes node's sine-wave fade  
- _methods_:
  - `createConnectingLines(scene, nodes)`: handles line creation and adjusts visibility/opacity for node-to-node connections
  - `createNodeAxesLines(scene, nodes, newAxesNodes)`: creates lines between each regular node and each axes node

**grid overlay**  
- a structured 3d grid adds context and enhances the visual composition  
- _methods_:
  - `createGrid(scene)`: creates grid lines based on the bounding box dimensions

**camera rotation**  
- implements smooth camera rotation triggered by scroll events, providing an interactive view from multiple angles  
- _methods_:
  - `animateScene(...)`: updates all moving elements and handles camera transitions between angles

**boxy model loading**  
- conditionally loads a 3d “boxy” model (GLTF/DRACO) into the scene, supporting animation mixing and dynamic wireframe edges  
- _methods_:
  - `loadBoxyModel(url, boundingBox)`: loads the GLTF model, sets initial position/scale, sets up edges, and initializes `AnimationMixer`
  - `getDeformedGeometry(mesh)`: for `SkinnedMesh` objects, calculates a deformed geometry in world space so the wireframe edges can dynamically follow skeletal animation

**post-processing**  
- applies a customizable shader pass to create blur or other visual effects on the final rendered scene  
- _methods_:
  - uses an `EffectComposer` with at least one Pass (`ShaderPass`, `RenderPass`, etc.)
  - `blurOverlayPass` is a pass for adding a subtle blur overlay using GLSL

**animation switching**  
- allows quick switching among multiple animation clips via debug keyboard shortcuts while boxy is active
- _methods_:
  - `updateAnimation(boxyObject)`: cross-fades from the current action to a newly desired animation clip

**real-time animation**  
- continuously updates node positions, wireframes, axes nodes, connecting lines, boxy model edges, and camera transitions in a loop  
- _methods_:
  - `animateScene(...)`: houses the primary render loop, updating movement, fading, connectivity, camera angle, and more on every frame

**label assignment**  
- dynamically assigns textual labels (which can be links or interface triggers) to nodes based on screen position and priority, ensuring minimal overlap  
- _methods_:
  - `assignLabelsToNodes(nodes, labels, camera)`: uses the node’s projected screen space to place or skip labels without collisions

**animated ascii voxl os logo**  
- renders an ascii-art version of the voxl os logo, scaled dynamically based on viewport or settings  
- applies a custom “ordered dithering” algorithm to emulate different brightness levels in ascii characters  
- _methods_:
  - `renderAsciiLogo(textCanvas, scale)`: draws or updates the ascii logo, recalculating characters according to size/dithering parameters

**node information readout**  
- a textual listing of node coordinates and assigned labels, displayed in a ui panel or overlay  
- each entry can be hovered or clicked to highlight the associated node in the 3d scene  
- _logic_:
  - displays current information about each node in a left side readout as the nodes are organised by a criteria while assigning to labels the least relevant nodes will have a smaller readout on the overlay

**2d line overlay**  
- on hover, draws a line in a 2d canvas between the hovered node label in the left pane and the corresponding node label in the 3d scene overlay  
- animates the line drawing progressively, resetting when the hover leaves  
- _logic_:
  - renders a transparent `<canvas>` on top of the screen, recalculates the line each frame in `animateScene()`

**developer “stream”**  
- a small video overlay that automatically loops through short dev clips from a predefined list  
- metadata such as dev name is inferred by parsing the current video filename  
- _logic_:
  - `handleVideoEnded()`: picks a new random video from `allVideos` whenever the current one finishes

**dev log preview**  
- displays a short summary of the latest dev articles on the main site, each linking to the full devlog page  
- fetches data from a dedicated endpoint `/api/articles` that reads and parses .html files in `public/articles`, extracting title, date, author, and a brief preview snippet  
- sorts these articles by date in descending order and returns only the top entries, providing a concise but informative overview of recent development progress  
- _methods_:
  - server-side: uses Node’s fs/path to scan .html files, then applies regex to pull out metadata and a two-sentence preview from each article  
  - client-side: fetches the JSON response from `/api/articles`, mapping each entry to a clickable preview that navigates to the devlog page

**mobile layout**  
- a responsive, mobile-oriented version of the interface, with unique layout constraints (reduced camera rotation, simplified 3d interactions)  
- supports orbital interaction where the user can drag the scene or pinch to zoom in/out  
- _component_:
  - react component ThreeNodeSystemMobile with custom layout and logic 

**typewriter effect**  
- when an interface label is clicked, the corresponding text content is displayed with a “typewriter” animation  
- _logic_:
  - a React useEffect manages incremental character rendering for the selected interface content

**fps counter**  
- basic on-screen display of frames per second (fps) for performance debugging  
- _logic_:
  - tracks frame times in a useEffect hook, updating a small text overlay every 0.5s

=== technical stack

- **framework**: Next.js for server-side rendering and routing  
- **3d rendering**: Three.js for object creation, animation, and rendering  
- **state management**: React useState and useEffect for node, axes, and interaction management  
- **model loading**: GLTFLoader + DRACOLoader for importing compressed 3d models with animation data  
- **post-processing**: EffectComposer, RenderPass, and optional ShaderPass pipeline for visual effects

=== data structures

- **NodeObject**  
  - `x, y, z`: 3d coordinates  
  - `dx, dy, dz`: velocity in each axis  
  - `assignedLabel?`: holds a reference to a Label if assigned

- **AxesNodeObject**  
  - `x, y, z`: 3d coordinates  
  - `dx, dy, dz`: velocity in each axis  
  - `axesGroup`: a Three.js Group containing the small cross lines  
  - `opacity`: current opacity (modulated by a sine wave)  
  - `frequency, offset`: parameters controlling the sine-wave fade effect

- **BoxyObject**  
  - `model`: a Three.js Group containing the loaded GLTF scene  
  - `mixer`: a Three.js AnimationMixer for controlling animated clips  
  - `animations`: array of THREE.AnimationClip referencing all loaded animations  
  - `currentAction?`: the currently playing AnimationAction  
  - `currentAnimation, desiredAnimation`: indices referencing the active or target animation clip  
  - `dynamicEdges`: array of edge wireframes updated in real time by `getDeformedGeometry()`

- **BoundingBox**  
  - `minX, maxX, minY, maxY, minZ, maxZ`: defines movement boundaries for nodes

- **Label**  
  - `content`: display text  
  - `url?`: if a link-type label, the url to open  
  - `priority`: used to sort label importance in assignment  
  - `fontsize`: dynamically updated in `assignLabelsToNodes()`  
  - `function`: "link" | "interface", determines behavior on click  
  - `interfaceContent?`: if "interface", the typed message to display

```asciidoc
[plantuml]
....
@startuml
actor user
node "3d scene" {
  rectangle "node system" as nodes
  rectangle "axes node system" as axes
  rectangle "wireframe" as wireframe
  rectangle "connecting lines" as lines
  rectangle "grid overlay" as grid
  rectangle "camera controls" as camera
  rectangle "boxy model" as boxy
  rectangle "post-processing" as postproc
}
user -> nodes : scroll/mouse input
nodes -> wireframe : generate 3d cubes
nodes -> lines : draw dynamic lines
nodes -> grid : render grid
nodes -> camera : handle view transitions
nodes -> axes : spawn cross lines
nodes -> boxy : optional GLTF loading
nodes -> postproc : optional shader passes
@enduml
....