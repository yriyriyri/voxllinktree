// components/ThreeDNodeSystem/ThreeDNodeSystem.tsx
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

interface NodeObject {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
  assignedLabel?: Label; // Optional: a label assigned to this node
}

interface AxesNodeObject {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
  axesGroup: THREE.Group; // Group containing the cross lines
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

interface Label {
  content: string;
  url: string;
  priority: number;
  fontsize: number;
}

export default function ThreeDNodeSystem() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NodeObject[]>([]);
  
  // State for AxesNodes
  const [axesNodes, setAxesNodes] = useState<AxesNodeObject[]>([]);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // The bounding box
  const boundingBox: BoundingBox = {
    minX: -35,
    maxX: 35,
    minY: -30,
    maxY: 35,
    minZ: -35,
    maxZ: 35,
  };

  const labels: Label[] = [
    { content: "./youtube", url: "https://example.com/youtube", priority: 1, fontsize: 16 },
    { content: "./X", url: "https://example.com/x", priority: 2, fontsize: 16 },
    { content: "./instagram", url: "https://example.com/instagram", priority: 3, fontsize: 16 },
    { content: "./steam", url: "https://example.com/steam", priority: 4, fontsize: 16 },
    { content: "./about us", url: "https://example.com/about", priority: 5, fontsize: 16 },
    { content: "./contact", url: "https://example.com/contact", priority: 6, fontsize: 16 },
  ];

  const lineDistanceFactor = 30;
  const nodeCount = 30;
  const axesNodeCount = 5;

  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const measureTextWidth = (text: string, fontSize: number = 16): number => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return 0;

    context.font = `${fontSize}px dico-code-two`;
    return context.measureText(text).width;
  };

  const createRandomNodes = (count: number): NodeObject[] => {
    const spawned: NodeObject[] = [];
    for (let i = 0; i < count; i++) {
      spawned.push({
        x: randomInRange(boundingBox.minX, boundingBox.maxX),
        y: randomInRange(boundingBox.minY, boundingBox.maxY),
        z: randomInRange(boundingBox.minZ, boundingBox.maxZ),
        dx: (Math.random() - 0.5) * 0.01,
        dy: (Math.random() - 0.5) * 0.01,
        dz: (Math.random() - 0.5) * 0.01,
      });
    }
    return spawned;
  };

  /**
   * Creates an array of AxesNodeObject, each with a black "3D cross"
   * that extends equally in the +/- direction for x, y, z.
   */
  const createAxesNodes = (count: number): AxesNodeObject[] => {
    const spawned: AxesNodeObject[] = [];
    
    const buildCrossGroup = (size: number = 2) => {
      const group = new THREE.Group();
      const half = size / 2;
      // Single black material
      const blackMat = new THREE.LineBasicMaterial({ color: 0x000000 });

      // X axis from -half to +half
      const xGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-half, 0, 0),
        new THREE.Vector3(half, 0, 0),
      ]);
      const xLine = new THREE.Line(xGeom, blackMat);
      group.add(xLine);

      // Y axis from -half to +half
      const yGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -half, 0),
        new THREE.Vector3(0, half, 0),
      ]);
      const yLine = new THREE.Line(yGeom, blackMat);
      group.add(yLine);

      // Z axis from -half to +half
      const zGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -half),
        new THREE.Vector3(0, 0, half),
      ]);
      const zLine = new THREE.Line(zGeom, blackMat);
      group.add(zLine);

      return group;
    };

    for (let i = 0; i < count; i++) {
      const crossGroup = buildCrossGroup(2); // small cross
      spawned.push({
        x: randomInRange(boundingBox.minX, boundingBox.maxX),
        y: randomInRange(boundingBox.minY, boundingBox.maxY),
        z: randomInRange(boundingBox.minZ, boundingBox.maxZ),
        dx: (Math.random() - 0.5) * 0.05, // Faster velocity
        dy: (Math.random() - 0.5) * 0.05,
        dz: (Math.random() - 0.5) * 0.05,
        axesGroup: crossGroup,
      });
    }
    return spawned;
  };

  const clampAndBounce = (
    node: { x: number; y: number; z: number; dx: number; dy: number; dz: number },
    bbox: BoundingBox
  ) => {
    if (node.x > bbox.maxX) {
      node.x = bbox.maxX;
      node.dx *= -1;
    } else if (node.x < bbox.minX) {
      node.x = bbox.minX;
      node.dx *= -1;
    }

    if (node.y > bbox.maxY) {
      node.y = bbox.maxY;
      node.dy *= -1;
    } else if (node.y < bbox.minY) {
      node.y = bbox.minY;
      node.dy *= -1;
    }

    if (node.z > bbox.maxZ) {
      node.z = bbox.maxZ;
      node.dz *= -1;
    } else if (node.z < bbox.minZ) {
      node.z = bbox.minZ;
      node.dz *= -1;
    }
  };

  const initializeScene = (
    mount: HTMLDivElement
  ): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
  } => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      95,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 60);

    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(dpr);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0xffffff);

    mount.appendChild(renderer.domElement);
    return { scene, camera, renderer };
  };

  const createEdgeWireframes = (scene: THREE.Scene, nodes: NodeObject[]) => {
    const cubeEdges: THREE.LineSegments[] = [];
    nodes.forEach((node) => {
      const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
      const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x323232,
        transparent: true,
        opacity: 1,
      });

      const edgeLines = new THREE.LineSegments(edgesGeometry, edgeMaterial);
      edgeLines.position.set(node.x, node.y, node.z);
      scene.add(edgeLines);

      cubeEdges.push(edgeLines);
    });
    return cubeEdges;
  };

  const createGrid = (scene: THREE.Scene) => {
    const centerY = (boundingBox.minY + boundingBox.maxY) / 2;
    const width = boundingBox.maxX - boundingBox.minX;
    const height = boundingBox.maxY - boundingBox.minY;
    const depth = boundingBox.maxZ - boundingBox.minZ;
    const bottomY = centerY - height / 2;

    const gridGroup = new THREE.Group();

    // For a 4x4 => 3 lines
    const gridLinesCount = 5;
    const spacingX = width / 6;
    const spacingZ = depth / 6;

    const innerMinX = boundingBox.minX + spacingX;
    const innerMaxX = boundingBox.maxX - spacingX;
    const innerMinZ = boundingBox.minZ + spacingZ;
    const innerMaxZ = boundingBox.maxZ - spacingZ;

    // Horizontal lines
    for (let i = 1; i <= gridLinesCount; i++) {
      const z = boundingBox.minZ + i * spacingZ;
      const points = [
        new THREE.Vector3(innerMinX, bottomY, z),
        new THREE.Vector3(innerMaxX, bottomY, z),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x000000 });
      const line = new THREE.Line(geometry, material);
      gridGroup.add(line);
    }

    // Vertical lines
    for (let i = 1; i <= gridLinesCount; i++) {
      const x = boundingBox.minX + i * spacingX;
      const points = [
        new THREE.Vector3(x, bottomY, innerMinZ),
        new THREE.Vector3(x, bottomY, innerMaxZ),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x000000 });
      const line = new THREE.Line(geometry, material);
      gridGroup.add(line);
    }

    // Perimeter
    const corners = [
      new THREE.Vector3(innerMinX, bottomY, innerMinZ),
      new THREE.Vector3(innerMaxX, bottomY, innerMinZ),
      new THREE.Vector3(innerMaxX, bottomY, innerMaxZ),
      new THREE.Vector3(innerMinX, bottomY, innerMaxZ),
    ];
    for (let i = 0; i < corners.length; i++) {
      const start = corners[i];
      const end = corners[(i + 1) % corners.length];
      const points = [start, end];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x000000 });
      const perimeterLine = new THREE.Line(geometry, material);
      gridGroup.add(perimeterLine);
    }

    scene.add(gridGroup);
  };

  const createConnectingLines = (scene: THREE.Scene, nodes: NodeObject[]) => {
    const lines: {
      line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
      nodeA: number;
      nodeB: number;
    }[] = [];

    // No lines for AxesNodeObjects, only for normal nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0x323232,
          transparent: true,
          opacity: 1,
          linewidth: 1,
        });

        const points = [
          new THREE.Vector3(nodes[i].x, nodes[i].y, nodes[i].z),
          new THREE.Vector3(nodes[j].x, nodes[j].y, nodes[j].z),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        scene.add(line);

        lines.push({ line, nodeA: i, nodeB: j });
      }
    }
    return { lines };
  };

  const assignLabelsToNodes = (
    nodes: NodeObject[],
    labels: Label[],
    camera: THREE.PerspectiveCamera
  ): NodeObject[] => {
    const occupiedAreas: { x: number; y: number; width: number; height: number }[] = [];

    const screenNodes = nodes.map((node) => {
      const screenPos = new THREE.Vector3(node.x, node.y, node.z).project(camera);
      const screenX = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const screenY = (screenPos.y * -0.5 + 0.5) * window.innerHeight;
      const screenZ = screenPos.z; // Perceived depth

      return {
        ...node,
        screenX,
        screenY,
        screenZ,
      };
    });

    const sortedNodes = screenNodes.sort((a, b) => a.screenZ - b.screenZ);

    const assignedLabels = new Set<Label>();

    return sortedNodes.map((node) => {
      if (node.assignedLabel) return node;

      const availableLabel = labels
        .sort((a, b) => b.priority - a.priority)
        .find((label) => {
          if (assignedLabels.has(label)) return false;

          // Dynamically calculate font size
          const fontSize = Math.max(12, 50 - node.screenZ * 40); // Scale font size
          label.fontsize = fontSize; // Assign font size to the label

          const labelWidth = measureTextWidth(label.content, fontSize);
          const labelHeight = fontSize; // Use font size as height
          const labelBox = {
            x: node.screenX,
            y: node.screenY,
            width: labelWidth,
            height: labelHeight,
          };

          const overlaps = occupiedAreas.some((area) => {
            return (
              labelBox.x < area.x + area.width &&
              labelBox.x + labelBox.width > area.x &&
              labelBox.y < area.y + area.height &&
              labelBox.y + labelBox.height > area.y
            );
          });

          return !overlaps;
        });

      if (availableLabel) {
        assignedLabels.add(availableLabel);

        // Add the occupied area for the label
        const labelWidth = measureTextWidth(availableLabel.content, availableLabel.fontsize);
        occupiedAreas.push({
          x: node.screenX + 10,
          y: node.screenY - 10,
          width: labelWidth,
          height: availableLabel.fontsize,
        });

        return {
          ...node,
          assignedLabel: availableLabel,
        };
      }

      return node;
    });
  };

  const animateScene = (
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    cubeEdges: THREE.LineSegments[],
    lines: {
      line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
      nodeA: number;
      nodeB: number;
    }[],
    nodes: NodeObject[],
    axesNodes: AxesNodeObject[],
    labels: Label[]
  ) => {
    // Four cardinal angles
    const angles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    let sideIndex = 0;
    let currentAngle = Math.atan2(camera.position.x, camera.position.z);
    let targetAngle = currentAngle;
    const initX = camera.position.x;
    const initZ = camera.position.z;
    const radius = Math.sqrt(initX * initX + initZ * initZ);

    const lerpSpeed = 0.05;
    let isRotating = false;
    const angleEpsilon = 0.001;

    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      if (isRotating) return;

      isRotating = true;
      if (e.deltaY < 0) {
        // Up => previous
        sideIndex = (sideIndex + 3) % 4;
      } else {
        // Down => next
        sideIndex = (sideIndex + 1) % 4;
      }
      targetAngle = angles[sideIndex];
    };

    if (renderer.domElement) {
      renderer.domElement.addEventListener("wheel", handleScroll, {
        passive: false,
      });
    }

    function updateCameraAngle() {
      let diff = targetAngle - currentAngle;
      if (diff > Math.PI) diff -= 2 * Math.PI;
      if (diff < -Math.PI) diff += 2 * Math.PI;

      const step = diff * lerpSpeed;
      currentAngle += step;

      const x = radius * Math.sin(currentAngle);
      const z = radius * Math.cos(currentAngle);
      const y = camera.position.y;
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);

      if (Math.abs(diff) < angleEpsilon) {
        currentAngle = targetAngle;
        isRotating = false;
      }
    }

    function animate() {
      requestAnimationFrame(animate);

      // Update normal nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.dx;
        node.y += node.dy;
        node.z += node.dz;
        clampAndBounce(node, boundingBox);
        cubeEdges[i].position.set(node.x, node.y, node.z);
      }

      // Update the AxesNodes (faster movement, same bounce logic)
      for (let i = 0; i < axesNodes.length; i++) {
        const axNode = axesNodes[i];
        axNode.x += axNode.dx;
        axNode.y += axNode.dy;
        axNode.z += axNode.dz;
        clampAndBounce(axNode, boundingBox);
        axNode.axesGroup.position.set(axNode.x, axNode.y, axNode.z);
      }

      const updatedNodes = assignLabelsToNodes(nodes, labels, camera);
      setNodes([...updatedNodes]); // triggers re-render for labels

      // Update lines among NodeObjects
      let lineIndex = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          const dist = new THREE.Vector3(nodeA.x, nodeA.y, nodeA.z).distanceTo(
            new THREE.Vector3(nodeB.x, nodeB.y, nodeB.z)
          );

          let opacity = 1 - dist / lineDistanceFactor;
          opacity = Math.max(0, Math.min(1, opacity));

          const lineItem = lines[lineIndex];
          const mat = lineItem.line.material;

          if (opacity === 0) {
            lineItem.line.visible = false;
          } else if (opacity < 0.4) {
            // Introduce some chance of hiding lines
            const hideChance = Math.random();
            if (hideChance < 0.15) {
              lineItem.line.visible = false;
            } else {
              lineItem.line.visible = true;
              mat.opacity = opacity;

              const newPoints = [
                new THREE.Vector3(nodeA.x, nodeA.y, nodeA.z),
                new THREE.Vector3(nodeB.x, nodeB.y, nodeB.z),
              ];
              lineItem.line.geometry.setFromPoints(newPoints);
            }
          } else {
            lineItem.line.visible = true;
            mat.opacity = opacity;

            const newPoints = [
              new THREE.Vector3(nodeA.x, nodeA.y, nodeA.z),
              new THREE.Vector3(nodeB.x, nodeB.y, nodeB.z),
            ];
            lineItem.line.geometry.setFromPoints(newPoints);
          }

          lineIndex++;
        }
      }

      if (isRotating) {
        updateCameraAngle();
      }

      renderer.render(scene, camera);
    }

    animate();
  };

  useEffect(() => {
    // Create normal nodes
    const newNodes = createRandomNodes(nodeCount);
    setNodes(newNodes);

    // Create the 3D cross axes nodes
    const newAxesNodes = createAxesNodes(axesNodeCount);
    setAxesNodes(newAxesNodes);

    const currentMount = mountRef.current;
    if (!currentMount) return;

    const { scene, camera, renderer } = initializeScene(currentMount);

    const cubeEdges = createEdgeWireframes(scene, newNodes);

    // Add the cross axes to the scene
    newAxesNodes.forEach((axNode) => {
      scene.add(axNode.axesGroup);
    });

    createGrid(scene);

    const { lines } = createConnectingLines(scene, newNodes);

    animateScene(scene, camera, renderer, cubeEdges, lines, newNodes, newAxesNodes, labels);

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      renderer.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      renderer.dispose();
      currentMount.removeChild(renderer.domElement);
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: "relative", // Use relative positioning for the parent container
        width: "100%", // Full width of the container
        height: "100vh", // Full height of the viewport
        backgroundColor: "white", // Set the background color to white
        overflow: "hidden",
      }}
    >
      {/* Left Overlay - Terminal Style (restored to original) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%", // Increased width to 600px
          height: "100%",
          overflowY: "auto",
          padding: "20px",
          zIndex: 20, // Ensure it's above the 3D scene
          fontFamily: "monospace", // Monospace font for terminal look
          fontSize: "8px", // Set font size to 10px
          color: "#000000", // Black text
          pointerEvents: "none"
        }}
      >
        {/* Node Details List */}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {nodes.map((node, index) => (
            <li
              key={index}
              style={{
                marginBottom: "10px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {/* One line per node with technical jargon */}
              INFO: Node <strong>{index + 1}</strong> | Position X=<span>{node.x.toFixed(2)}</span>, Y=<span>{node.y.toFixed(2)}</span>, Z=<span>{node.z.toFixed(2)}</span>
              {node.assignedLabel && (
                <span style={{ marginLeft: "15px" }}>
                  | Label: <span>{node.assignedLabel.content}</span>
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* Labels Section */}
        <div style={{ marginTop: "30px", fontWeight: "bold" }}></div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {labels.map((label, index) => (
            <li
              key={index}
              style={{
                marginBottom: "8px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {/* One line per label with technical jargon */}
              LABEL: <strong>{label.content}</strong> | Priority=<span>{label.priority}</span> | FontSize=<span>{label.fontsize}px</span> | URL:{" "}
              <a
                href={label.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#000000", // Black text
                  textDecoration: "none", // Remove underline
                  cursor: "pointer",
                  pointerEvents: "auto"
                }}
              >
                {label.url}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* 3D Scene */}
      <div
        ref={mountRef}
        style={{
          position: "absolute",
          left: `200px`, // Shift the 3D scene right by 200px to make room for the original overlay
          width: "100%",
          height: "100%",
          overflow: "hidden",
          backgroundColor: "white",
          zIndex: 10, // Ensure it's below the overlay
        }}
      >
        {nodes.map((node) => {
          if (!node.assignedLabel || !cameraRef.current) return null;

          const screenPos = new THREE.Vector3(node.x, node.y, node.z).project(cameraRef.current);
          const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth - 200; // Adjust for left overlay
          const y = (screenPos.y * -0.5 + 0.5) * window.innerHeight;

          if (x < 0 || x > window.innerWidth - 200 || y < 0 || y > window.innerHeight) {
            console.warn(`Label '${node.assignedLabel.content}' is offscreen`);
            return null;
          }

          return (
            <div
              key={node.assignedLabel.content}
              style={{
                position: "absolute",
                left: `${x}px`,
                top: `${y}px`,
                color: "black",
                padding: "0px 0px",
                zIndex: 30, // Ensure labels are above the overlay
                cursor: "pointer",
                transform: "translateX(210px) translateY(-10px)", // Adjusted for overlay shift
                pointerEvents: "auto",
                fontSize: "12px", // Fixed 12px font size
                fontFamily: "monospace",
                fontWeight: 100,
                fontStyle: "normal",
              }}
              onClick={() => window.open(node.assignedLabel?.url, "_blank")}
            >
              {node.assignedLabel.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}