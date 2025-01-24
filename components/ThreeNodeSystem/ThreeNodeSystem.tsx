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
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export default function ThreeDNodeSystem() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NodeObject[]>([]);

  // The bounding box
  const boundingBox: BoundingBox = {
    minX: -35,
    maxX: 35,
    minY: -30,
    maxY: 35,
    minZ: -35,
    maxZ: 35,
  };

  const lineDistanceFactor = 30;
  const nodeCount = 30;

  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

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

  const clampAndBounce = (node: NodeObject, bbox: BoundingBox) => {
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
      100,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 60);

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
    nodes: NodeObject[]
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

    // Flag to indicate if we're currently rotating (animation not done)
    let isRotating = false;

    // A small epsilon to decide when rotation is "close enough" to target
    const angleEpsilon = 0.001;

    // On scroll => only if !isRotating => pick next or prev side
    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      // If we're mid-rotation, ignore
      if (isRotating) return;

      // Start a new rotation
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

      // Lerp
      const step = diff * lerpSpeed;
      currentAngle += step;

      const x = radius * Math.sin(currentAngle);
      const z = radius * Math.cos(currentAngle);
      const y = camera.position.y;
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);

      // If we've gotten close to the target, we consider ourselves "done"
      if (Math.abs(diff) < angleEpsilon) {
        // Snap exactly
        currentAngle = targetAngle;
        // End rotation
        isRotating = false;
      }
    }

    function animate() {
      requestAnimationFrame(animate);

      // Update nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.dx;
        node.y += node.dy;
        node.z += node.dz;
        clampAndBounce(node, boundingBox);
        cubeEdges[i].position.set(node.x, node.y, node.z);
      }

      // Update lines
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
          } else {
            lineItem.line.visible = true;
            mat.opacity = opacity;

            // Recompute geometry
            const newPoints = [
              new THREE.Vector3(nodeA.x, nodeA.y, nodeA.z),
              new THREE.Vector3(nodeB.x, nodeB.y, nodeB.z),
            ];
            lineItem.line.geometry.setFromPoints(newPoints);
          }
          lineIndex++;
        }
      }

      // Update camera angle => if isRotating is true, we keep animating the rotation
      if (isRotating) {
        updateCameraAngle();
      }

      renderer.render(scene, camera);
    }

    animate();
  };

  useEffect(() => {
    const newNodes = createRandomNodes(nodeCount);
    setNodes(newNodes);

    const currentMount = mountRef.current;
    if (!currentMount) return;

    const { scene, camera, renderer } = initializeScene(currentMount);

    const cubeEdges = createEdgeWireframes(scene, newNodes);
    createGrid(scene);
    const { lines } = createConnectingLines(scene, newNodes);

    animateScene(scene, camera, renderer, cubeEdges, lines, newNodes);

    return () => {
      renderer.dispose();
      currentMount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
}