// components/ThreeDNodeSystem/ThreeDNodeSystem.tsx
import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/router";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";


interface NodeObject {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
  assignedLabel?: Label; 
}

interface AxesNodeObject {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
  axesGroup: THREE.Group;
  opacity: number;    
  frequency: number; 
  offset: number;     //sine wave functions
}

interface BoxyObject {
  model: THREE.Group;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  mixer: THREE.AnimationMixer;
  currentAnimation: number;
  desiredAnimation: number;
  animations: THREE.AnimationClip[];  // access all clips from anywhere 
  currentAction?: THREE.AnimationAction; // keep track of current action
  dynamicEdges: { mesh: THREE.Mesh; line: THREE.LineSegments; thresholdAngle: number }[];
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
  url?: string;  
  priority: number;
  fontsize: number;
  function: "link" | "interface";
  interfaceContent?: string;
}

export default function ThreeDNodeSystem() {
  //external refs 
  const mountRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NodeObject[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [axesNodes, setAxesNodes] = useState<AxesNodeObject[]>([]);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [selectedInterfaceContent, setSelectedInterfaceContent] = useState<string | null>(null);
  const [typedContent, setTypedContent] = useState<string>("");
  const boxyRef = useRef<BoxyObject | null>(null);

  const router = useRouter();

  // bounding box for spawn/containment of nodes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const boundingBox: BoundingBox = {
    minX: -35,
    maxX: 35,
    minY: -30,
    maxY: 35,
    minZ: -35,
    maxZ: 35,
  };

  //labels

  const labels: Label[] = [
    { content: "./youtube", url: "https://www.youtube.com/channel/UCgCwjJJ7qHF0QV27CzHSZnw", priority: 1, fontsize: 16, function: "link" },
    { content: "./X", url: "https://x.com/voxldev", priority: 2, fontsize: 16, function: "link" },
    { content: "./instagram", url: "https://www.instagram.com/voxl.online//", priority: 3, fontsize: 16, function: "link" },
    // { content: "./steam", url: "https://example.com/steam", priority: 4, fontsize: 16, function: "link" },
    { content: "./about us", priority: 5, fontsize: 16, function: "interface", interfaceContent: "./about us () VOXL is an innovative social building game that pushes the boundaries of creativity and immersive gameplay. Unleash your imagination, build connections, and shape your own adventure in this stunningly crafted universe—where the only limit is your creativity. " },
    { content: "./contact", priority: 6, fontsize: 16, function: "interface", interfaceContent: "./contact () management@voxl.world" },
    { content: "./devlog", priority: 4, fontsize: 16, function: "interface", interfaceContent: " " },
  ];

  //fps counter

  const [fps, setFps] = useState(0);
  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);

  //debug animation keys DEBUG

  const keyToAnimationIndex = React.useMemo(() => {
    const mapping: { [key: string]: number } = {};
    const keys = "qwertyuiopasdfghjklzxcvb";
    for (let i = 0; i < keys.length; i++) {
      mapping[keys[i]] = i;
    }
    return mapping;
  }, []);

  //debug vers boxy/notboxy

  const boxyVers = false;

  //major variable adjusts (make dynamic based on screensize)

  let lineDistanceFactor = 30;
  if (boxyVers){
    lineDistanceFactor = 0;
  }
  const nodeCount = 25; //changed 25
  const axesNodeCount = 5; //changed 5

  //dynamic screen size refs

  const [overlayFontSize, setOverlayFontSize] = useState(8);
  const [overlayLineSpacing, setOverlayLineSpacing] = useState(10);
  const [cornerOffset, setCornerOffset] = useState(11);

  //####helper functions

  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const measureTextWidth = (text: string, fontSize: number = 16): number => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return 0;
    context.font = `${fontSize}px dico-code-two`;
    return context.measureText(text).width;
  };

  function getDeformedGeometry(mesh: THREE.Mesh): THREE.BufferGeometry {
    //ensure update
    mesh.updateMatrixWorld(true);
  
   
    if (mesh instanceof THREE.SkinnedMesh) {
      const skinnedMesh = mesh;
      const sourceGeom = skinnedMesh.geometry as THREE.BufferGeometry;
      const posAttr = sourceGeom.attributes.position;
      const skinIndexAttr = sourceGeom.attributes.skinIndex as THREE.BufferAttribute;
      const skinWeightAttr = sourceGeom.attributes.skinWeight as THREE.BufferAttribute;
      const vertexCount = posAttr.count;
      
      const deformedPositions = new Float32Array(vertexCount * 3);
      
      const tempPos = new THREE.Vector3();
      const skinnedPos = new THREE.Vector3();
      const tempVec = new THREE.Vector3();
      const boneMatrix = new THREE.Matrix4();
      const skinIndices = new THREE.Vector4();
      const skinWeights = new THREE.Vector4();
  
      // 4 each vertex
      for (let i = 0; i < vertexCount; i++) {
        // get the original vertex position
        tempPos.fromBufferAttribute(posAttr, i);
        
        // transform into bind space
        tempPos.applyMatrix4(skinnedMesh.bindMatrix);
        
        // reset the acc
        skinnedPos.set(0, 0, 0);
        
        // get the skin indices and weights
        skinIndices.fromBufferAttribute(skinIndexAttr, i);
        skinWeights.fromBufferAttribute(skinWeightAttr, i);
        
        // for each of the 4 influences
        for (let j = 0; j < 4; j++) {
          const boneIndex = skinIndices.getComponent(j);
          const weight = skinWeights.getComponent(j);
          if (weight === 0) continue;
          
          // compute bone matrix transform  bone.matrixWorld * boneInverse
          boneMatrix.copy(skinnedMesh.skeleton.bones[boneIndex].matrixWorld);
          boneMatrix.multiply(skinnedMesh.skeleton.boneInverses[boneIndex]);
          
          // transform the vertex position by the boneMatrix and weight it
          tempVec.copy(tempPos).applyMatrix4(boneMatrix).multiplyScalar(weight);
          skinnedPos.add(tempVec);
        }

        skinnedPos.setY(skinnedPos.y - 8)
        skinnedPos.setZ(skinnedPos.z - 5)
        skinnedPos.multiplyScalar(1 / 15);

        deformedPositions[i * 3] = skinnedPos.x;
        deformedPositions[i * 3 + 1] = skinnedPos.y;
        deformedPositions[i * 3 + 2] = skinnedPos.z;
      }
      
      // create  new BufferGeometry to hold the deformed vertex positions
      const deformedGeometry = new THREE.BufferGeometry();
      deformedGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(deformedPositions, 3)
      );
      
      // copy over index if one exists
      if (sourceGeom.index) {
        deformedGeometry.setIndex(sourceGeom.index.clone());
      }
      
      return deformedGeometry;
    } else {
      // for non-skinned meshes return a clone 
      return mesh.geometry.clone();
    }
  }
  
  const updateOverlayFontSize = () => {
    const baselineWidth = 1400;
  
    const baselineFontSize = 8;
    const maxFontSize = 12;
    const computedFontSize = (window.innerWidth / baselineWidth) * baselineFontSize;
    const newFontSize = Math.min(computedFontSize, maxFontSize);
    setOverlayFontSize(newFontSize);
  
    const baselineLineSpacing = 10; 
    const maxLineSpacing = 400;
    const computedLineSpacing = (window.innerWidth / baselineWidth) * baselineLineSpacing;
    const newLineSpacing = Math.min(computedLineSpacing, maxLineSpacing);
    setOverlayLineSpacing(newLineSpacing);

    const baselineCornerOffset = 100; 
    const maxCornerOffset = 200;
    const computedCornerOffset = (window.innerWidth / baselineWidth) * baselineCornerOffset;
    const newCornerOffset = Math.min(computedCornerOffset, maxCornerOffset);
    setCornerOffset(newCornerOffset);
  };

  //####createn odes

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

  const createAxesNodes = (count: number): AxesNodeObject[] => {
    const spawned: AxesNodeObject[] = [];

    const buildCrossGroup = (size: number = 1) => {
      const group = new THREE.Group();
      const half = size / 2;
      let opacity = 1
      if (boxyVers){
        opacity = 0
      }
      const blackMat = new THREE.LineBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: opacity, 
      });

      // x axis
      const xGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-half, 0, 0),
        new THREE.Vector3(half, 0, 0),
      ]);
      const xLine = new THREE.Line(xGeom, blackMat);
      group.add(xLine);

      // y axis
      const yGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -half, 0),
        new THREE.Vector3(0, half, 0),
      ]);
      const yLine = new THREE.Line(yGeom, blackMat);
      group.add(yLine);

      // z axis
      const zGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -half),
        new THREE.Vector3(0, 0, half),
      ]);
      const zLine = new THREE.Line(zGeom, blackMat);
      group.add(zLine);

      return group;
    };

    for (let i = 0; i < count; i++) {
      const crossGroup = buildCrossGroup(1.5);
      spawned.push({
        x: randomInRange(boundingBox.minX, boundingBox.maxX),
        y: randomInRange(boundingBox.minY, boundingBox.maxY),
        z: randomInRange(boundingBox.minZ, boundingBox.maxZ),
        dx: (Math.random() - 0.5) * 0.05,
        dy: (Math.random() - 0.5) * 0.05,
        dz: (Math.random() - 0.5) * 0.05,
        axesGroup: crossGroup,
        // sine-wave fade properties
        opacity: 1,
        frequency: randomInRange(0.2, 1.5),
        offset: randomInRange(0, 2 * Math.PI),
      });
    }
    return spawned;
  };

  //####load boxy

  const loadBoxyModel = (url: string, boundingBox: BoundingBox): Promise<BoxyObject> => {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
  
      // DRACOLoader alloows draco-compressed models 2be decoded
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/'); // '/draco/' exists in the  public folder
      loader.setDRACOLoader(dracoLoader);
  
      loader.load(
        url, // e.g., "/Boxy.glb"
        (gltf) => {
          const model = gltf.scene;
  
          const scaleFactor = 15;
          const selfOcclude = true;
          model.scale.set(scaleFactor, scaleFactor, scaleFactor);
  
          const randomX = 0; // or randomInRange(boundingBox.minX, boundingBox.maxX)
          const randomY = 8; // or randomInRange(boundingBox.minY, boundingBox.maxY)
          const randomZ = 5; // adjust 
          const position = new THREE.Vector3(randomX, randomY, randomZ);
          model.position.copy(position);
  
          model.rotation.set(0, 0, 0);
  
          const dynamicEdges: { mesh: THREE.Mesh; line: THREE.LineSegments; thresholdAngle: number }[] = [];
          // edge filtering 
          const thresholdAngle = Math.PI;
  
          // traverse model
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              // compute initial edges geom
              const edgesGeometry = new THREE.EdgesGeometry(child.geometry, thresholdAngle);
              const lineMaterial = new THREE.LineBasicMaterial({ 
                color: 0x000000,
                depthTest: true,
              });
              const edgeWireframe = new THREE.LineSegments(edgesGeometry, lineMaterial);
              edgeWireframe.layers.set(0);
              // store pair in dynamic edges array
              dynamicEdges.push({ mesh: child, line: edgeWireframe, thresholdAngle });
              // child.visible = true;
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  mat.colorWrite = false;
                  mat.depthWrite = selfOcclude; //
                  mat.polygonOffset = true;
                  mat.polygonOffsetFactor = 4;  
                  mat.polygonOffsetUnits = 10;
                });
              } else {
                child.material.colorWrite = false;
                child.material.depthWrite = selfOcclude; //
                child.material.polygonOffset = true;
                child.material.polygonOffsetFactor = 4;
                child.material.polygonOffsetUnits = 10;
              }
              edgeWireframe.renderOrder = 999;
              model.add(edgeWireframe);
            }
          });
  
          const mixer = new THREE.AnimationMixer(model);
          let currentAction: THREE.AnimationAction | undefined = undefined;
          if (gltf.animations && gltf.animations.length > 0) {
            const action = mixer.clipAction(gltf.animations[16]);
            action.play();
            currentAction = action;
          }
          const currentAnimation = 16;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const desiredAnimation = 16;

          const boxyObj: BoxyObject = {
            model,
            position,
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor),
            mixer,
            currentAnimation,
            desiredAnimation,
            animations: gltf.animations || [],
            currentAction,
            dynamicEdges,
          };

          boxyRef.current = boxyObj;
  
          resolve(boxyObj);
        },
        undefined,
        (error) => {
          console.error("Error loading Boxy.glb:", error);
          reject(error);
        }
      );
    });
  };

  //####containment logic

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

  //####basic scene init

  const initializeScene = (
    mount: HTMLDivElement
  ): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.max(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0xFFFFFF, 0);
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    renderPass.clearColor = new THREE.Color(0x000000); 
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);

    const blurOverlayShader = {
      uniforms: {
        tDiffuse:    { value: null },             // original scene render
        resolution:  { value: new THREE.Vector2() },
        radius:      { value: 1.0 },              // how large the blur kernel is
        blurOpacity: { value: 0.5 }               // how strongly to overlay the blurred image
      },
      vertexShader: `
        varying vec2 vUv;
    
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float radius;
        uniform float blurOpacity;
        varying vec2 vUv;
    
        void main() {
          // We'll do a simple 3x3 box blur
          // For a stronger blur, increase the sample area or do multiple passes.
          vec4 blurredColor = vec4(0.0);
          float totalSamples = 0.0;
    
          // Offsets in the 3x3 neighborhood
          float offX = radius / resolution.x;
          float offY = radius / resolution.y;
    
          for (int x = -1; x <= 1; x++) {
            for (int y = -1; y <= 1; y++) {
              vec2 offset = vec2(float(x) * offX, float(y) * offY);
              vec4 sampleColor = texture2D(tDiffuse, vUv + offset);
    
              blurredColor += sampleColor;
              totalSamples += 1.0;
            }
          }
    
          // Average the sum to get the final blurred color
          blurredColor /= totalSamples;
    
          // Grab the original color at this pixel
          vec4 originalColor = texture2D(tDiffuse, vUv);
    
          // Overlay the blurred image over the original
          // blurOpacity = 0.0 => no blur; 1.0 => fully blurred
          vec4 finalColor = mix(originalColor, blurredColor, blurOpacity);
    
          gl_FragColor = finalColor;
        }
      `
    };
  
    const blurOverlayPass = new ShaderPass(blurOverlayShader);

    blurOverlayPass.material.uniforms.resolution.value.set(
      mount.clientWidth,
      mount.clientHeight
    );

    blurOverlayPass.material.uniforms.radius.value = 3.0; 

    blurOverlayPass.material.uniforms.blurOpacity.value = 0.4; 

    composer.addPass(blurOverlayPass);

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms['resolution'].value.set(
      1 / mount.clientWidth,
      1 / mount.clientHeight
    );

    composer.addPass(fxaaPass);

    return { scene, camera, renderer, composer };
  };

  //####render logic for normal nodes
  const createEdgeWireframes = (scene: THREE.Scene, nodes: NodeObject[]) => {
    const cubeEdges: THREE.LineSegments[] = [];
    nodes.forEach((node) => {
      const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
      const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
      let opacity = 1;
      if (boxyVers){
        opacity = 0;
      }
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x323232,
        transparent: true,
        opacity: opacity, //CHANGED 1
      });

      const edgeLines = new THREE.LineSegments(edgesGeometry, edgeMaterial);
      edgeLines.position.set(node.x, node.y, node.z);
      scene.add(edgeLines);

      cubeEdges.push(edgeLines);
    });
    return cubeEdges;
  };

  //####visual grid for depth
  const createGrid = (scene: THREE.Scene) => {
    const centerY = (boundingBox.minY + boundingBox.maxY) / 2;
    const width = boundingBox.maxX - boundingBox.minX;
    const height = boundingBox.maxY - boundingBox.minY;
    const depth = boundingBox.maxZ - boundingBox.minZ;
    const bottomY = centerY - height / 2;

    const gridGroup = new THREE.Group();

    const gridLinesCount = 5;
    const spacingX = width / 6;
    const spacingZ = depth / 6;

    const innerMinX = boundingBox.minX + spacingX;
    const innerMaxX = boundingBox.maxX - spacingX;
    const innerMinZ = boundingBox.minZ + spacingZ;
    const innerMaxZ = boundingBox.maxZ - spacingZ;

    // horizontal lines
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

    // vertical lines
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

    // perimeter
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

  //####creates lines between normal nodes
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

  //####creates lines to and from axes nodes
  const createNodeAxesLines = (
    scene: THREE.Scene,
    nodes: NodeObject[],
    axes: AxesNodeObject[]
  ) => {
    const nodeAxesLines: {
      line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
      nodeIndex: number;
      axesIndex: number;
    }[] = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < axes.length; j++) {
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0x323232,
          transparent: true,
          opacity: 1,
          linewidth: 1,
        });

        const points = [
          new THREE.Vector3(nodes[i].x, nodes[i].y, nodes[i].z),
          new THREE.Vector3(axes[j].x, axes[j].y, axes[j].z),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        scene.add(line);

        nodeAxesLines.push({ line, nodeIndex: i, axesIndex: j });
      }
    }

    return nodeAxesLines;
  };

  //####assigns labels to nodes based on a criteria 
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
      const screenZ = screenPos.z;
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
  
          const fontSize = Math.max(12, 50 - node.screenZ * 40);
          label.fontsize = fontSize;
          const labelWidth = measureTextWidth(label.content, fontSize);
          const labelHeight = fontSize;
          const labelBox = {
            x: node.screenX,
            y: node.screenY,
            width: labelWidth,
            height: labelHeight,
          };
  
          if (
            labelBox.x < 0 ||
            labelBox.x + labelBox.width > window.innerWidth ||
            labelBox.y < 0 ||
            labelBox.y + labelBox.height > window.innerHeight
          ) {
            return false;
          }
  
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

  //####animation loop
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
    nodeAxesLines: {
      line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
      nodeIndex: number;
      axesIndex: number;
    }[],
    nodes: NodeObject[],
    axesNodes: AxesNodeObject[],
    labels: Label[],
    composer: EffectComposer,
    boxyRef: { current: BoxyObject | null } 
  ) => {
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

    const startTime = performance.now();

    const clock = new THREE.Clock();

    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      if (isRotating) return;

      isRotating = true;
      if (e.deltaY < 0) {
        // up => previous
        sideIndex = (sideIndex + 3) % 4;
      } else {
        // down => next
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
      // make sure -PI < diff < PI
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

    function updateAnimation(boxy: BoxyObject) {
      if (boxy.currentAnimation !== boxy.desiredAnimation) {
        const newClip = boxy.animations[boxy.desiredAnimation];
        const newAction = boxy.mixer.clipAction(newClip);
        newAction.reset();
        newAction.play();
        
        if (boxy.currentAction) {
          boxy.currentAction.crossFadeTo(newAction, 0.5, false);
        }
        
        boxy.currentAction = newAction;
        boxy.currentAnimation = boxy.desiredAnimation;
      }
    }

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();

      if (boxyRef.current) {
        boxyRef.current.mixer.update(delta);

        const desiredAnimation = boxyRef.current.currentAnimation; 
        updateAnimation(boxyRef.current);
      
        boxyRef.current.model.updateMatrixWorld(true);
        boxyRef.current.dynamicEdges.forEach(({ mesh, line, thresholdAngle }) => {
          const deformedGeom = getDeformedGeometry(mesh);
          line.geometry.dispose();
          line.geometry = new THREE.EdgesGeometry(deformedGeom, thresholdAngle);
        });
      }

      const elapsed = (performance.now() - startTime) * 0.001; 

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.dx;
        node.y += node.dy;
        node.z += node.dz;
        clampAndBounce(node, boundingBox);
        cubeEdges[i].position.set(node.x, node.y, node.z);
      }

      for (let i = 0; i < axesNodes.length; i++) {
        const axNode = axesNodes[i];
        axNode.x += axNode.dx;
        axNode.y += axNode.dy;
        axNode.z += axNode.dz;
        clampAndBounce(axNode, boundingBox);
        axNode.axesGroup.position.set(axNode.x, axNode.y, axNode.z);

        // sine function
        const fade = Math.sin(axNode.frequency * elapsed + axNode.offset) * 0.5 + 0.5;
        axNode.opacity = fade;

        axNode.axesGroup.traverse((child) => {
          if (child instanceof THREE.Line) {
            const mat = child.material as THREE.LineBasicMaterial;
            mat.opacity = axNode.opacity;
            mat.transparent = true;
          }
        });
      }

      // node <-> node lines
      let lineIndex = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          const dist = new THREE.Vector3(nodeA.x, nodeA.y, nodeA.z).distanceTo(
            new THREE.Vector3(nodeB.x, nodeB.y, nodeB.z)
          );

          let baseOpacity = 1 - dist / lineDistanceFactor;
          baseOpacity = Math.max(0, Math.min(1, baseOpacity));

          const lineItem = lines[lineIndex];
          const mat = lineItem.line.material;

          if (baseOpacity === 0) {
            lineItem.line.visible = false;
          } else {
            lineItem.line.visible = true;
            mat.opacity = baseOpacity;

            const newPoints = [
              new THREE.Vector3(nodeA.x, nodeA.y, nodeA.z),
              new THREE.Vector3(nodeB.x, nodeB.y, nodeB.z),
            ];
            lineItem.line.geometry.setFromPoints(newPoints);
          }
          lineIndex++;
        }
      }

      // node <-> axes lines
      for (let i = 0; i < nodeAxesLines.length; i++) {
        const { line, nodeIndex: nIndex, axesIndex: aIndex } = nodeAxesLines[i];

        const node = nodes[nIndex];
        const axNode = axesNodes[aIndex];

        const dist = new THREE.Vector3(node.x, node.y, node.z).distanceTo(
          new THREE.Vector3(axNode.x, axNode.y, axNode.z)
        );
        let baseOpacity = 1 - dist / lineDistanceFactor;
        baseOpacity = Math.max(0, Math.min(1, baseOpacity));

        if (baseOpacity === 0) {
          line.visible = false;
        } else {
          const finalOpacity = baseOpacity * axNode.opacity;

          if (finalOpacity <= 0) {
            line.visible = false;
          } else {
            line.visible = true;
            (line.material as THREE.LineBasicMaterial).opacity = finalOpacity;

            line.geometry.setFromPoints([
              new THREE.Vector3(node.x, node.y, node.z),
              new THREE.Vector3(axNode.x, axNode.y, axNode.z),
            ]);
          }
        }
      }

      // 5) re-assign labels for normal nodes
      const updatedNodes = assignLabelsToNodes(nodes, labels, camera);
      setNodes([...updatedNodes]);

      if (isRotating) {
        updateCameraAngle();
      }

      // renderer.render(scene, camera);
      composer.render()
    }

    animate();
  };

  //####main functionality useffect
  useEffect(() => {
    // 1 create normal nodes
    const newNodes = createRandomNodes(nodeCount);
    setNodes(newNodes);

    // 2 create axes nodes
    const newAxesNodes = createAxesNodes(axesNodeCount);
    setAxesNodes(newAxesNodes);

    // 3 set up scene
    const boxyRef = { current: null as BoxyObject | null };
    const currentMount = mountRef.current;
    if (!currentMount) return;
    const { scene, camera, renderer, composer } = initializeScene(currentMount);

    // 4 initial font size calc

    updateOverlayFontSize();

    // 5 wireframes for normal nodes
    const cubeEdges = createEdgeWireframes(scene, newNodes);

    // 6 add axes nodes to scene
    newAxesNodes.forEach((axNode) => {
      scene.add(axNode.axesGroup);
    });

    // 7 grid
    createGrid(scene);

    // 8 lines between normal nodes
    const { lines } = createConnectingLines(scene, newNodes);

    // 9 lines between each normal node and each axes node
    const nodeAxesLines = createNodeAxesLines(scene, newNodes, newAxesNodes);

    // 10 load Boxy.glb 
    if (boxyVers){
      loadBoxyModel("/Boxy.glb", boundingBox)
      .then((loadedBoxy) => {
        boxyRef.current = loadedBoxy;
        scene.add(loadedBoxy.model);
      })
      .catch((error) => {
        console.error("Failed to load Boxy model:", error);
      });
    }
    // 11 animate
    animateScene(
      scene,
      camera,
      renderer,
      cubeEdges,
      lines,
      nodeAxesLines,
      newNodes,
      newAxesNodes,
      labels,
      composer,
      boxyRef
    );

    // handle window resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      renderer.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      updateOverlayFontSize()
    };

    window.addEventListener("resize", handleResize);
    return () => {
      renderer.dispose();
      currentMount.removeChild(renderer.domElement);
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //####typewriter effect  hhhhhhhhh
  useEffect(() => {
    if (selectedInterfaceContent) {
      setTypedContent("");
      let index = -1;
      const typeWriter = () => {
        if (index < selectedInterfaceContent.length - 1) {
          setTypedContent((prev) => prev + selectedInterfaceContent[index]);
          index++;
          setTimeout(typeWriter, 30); 
        }
      };
      typeWriter();
    }
  }, [selectedInterfaceContent]);

  //###fps counter
  useEffect(() => {
    let animationFrameId: number;
  
    const updateFps = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastFrameTime.current;
      if (delta >= 500) {
        const currentFps = (frameCount.current * 1000) / delta;
        setFps(Math.round(currentFps));
        lastFrameTime.current = now;
        frameCount.current = 0;
      }
      animationFrameId = requestAnimationFrame(updateFps);
    };
  
    animationFrameId = requestAnimationFrame(updateFps);
  
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  //###DEBUG KEY ANIMATION ######## REMOVE
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key in keyToAnimationIndex) {
        console.log("Key pressed:", key);
        if (boxyRef.current) {
          const newAnimationIndex = keyToAnimationIndex[key];
          console.log("Setting DESIREDanimation to:", newAnimationIndex);
          boxyRef.current.desiredAnimation = newAnimationIndex;
        } else {
          console.log("boxyRef.current is null!");
        }
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [boxyRef, keyToAnimationIndex]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background:
          "radial-gradient(circle at calc(50% + 200px) 50%, #eaeaea 0%, #d6d6d6 30%, #bfbfbf 60%) no-repeat center center fixed",
        backgroundSize: "cover",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: "5px",
          top: "20px",
          zIndex: 20,
          fontFamily: "monospace",
          fontSize: "8px",
          color: "#000000",
          pointerEvents: "none",
          textShadow: "2px 2px 3px rgba(61, 61, 61, 0.5)",
          display: "none",
        }}
      >
        current_frame_rate = {fps}
      </div>

     {/* corner lines */}
      <div
        style={{
          position: "absolute",
          left: `${400 + cornerOffset}px`,
          top: "40px",
          width: "2px",
          height: "30px",
          backgroundColor: "#3d3d3d",
          opacity: 0.8,
          zIndex: 25,
          boxShadow: "0 0 6px rgba(61, 61, 61, 0.7)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: `${400 + cornerOffset}px`,
          top: "40px",
          width: "30px",
          height: "2px",
          backgroundColor: "#3d3d3d",
          opacity: 0.8,
          zIndex: 25,
          boxShadow: "0 0 6px rgba(61, 61, 61, 0.7)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: `${400 + cornerOffset}px`,
          bottom: "40px",
          width: "2px",
          height: "30px",
          backgroundColor: "#3d3d3d",
          opacity: 0.8,
          zIndex: 25,
          boxShadow: "0 0 6px rgba(61, 61, 61, 0.7)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: `${400 + cornerOffset}px`,
          bottom: "40px",
          width: "30px",
          height: "2px",
          backgroundColor: "#3d3d3d",
          opacity: 0.8,
          zIndex: 25,
          boxShadow: "0 0 6px rgba(61, 61, 61, 0.7)",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: `${cornerOffset}px`,
          top: "40px",
          width: "2px",
          height: "30px",
          backgroundColor: "#3d3d3d",
          opacity: 0.8,
          zIndex: 25,
          boxShadow: "0 0 6px rgba(61, 61, 61, 0.7)",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: `${cornerOffset}px`,
          top: "40px",
          width: "30px",
          height: "2px",
          backgroundColor: "#3d3d3d",
          opacity: 0.8,
          zIndex: 25,
          boxShadow: "0 0 6px rgba(61, 61, 61, 0.7)",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: `${cornerOffset}px`,
          bottom: "40px",
          width: "2px",
          height: "30px",
          backgroundColor: "#3d3d3d",
          opacity: 0.8,
          zIndex: 25,
          boxShadow: "0 0 6px rgba(61, 61, 61, 0.7)",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: `${cornerOffset}px`,
          bottom: "40px",
          width: "30px",
          height: "2px",
          backgroundColor: "#3d3d3d",
          opacity: 0.8,
          zIndex: 25,
          boxShadow: "0 0 6px rgba(61, 61, 61, 0.7)",
        }}
      />
  
      {/* left overlay */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          overflowY: "auto",
          padding: "20px",
          zIndex: 20,
          fontFamily: "monospace",
          lineHeight: `${overlayLineSpacing}px`,
          fontSize: `${overlayFontSize}px`,
          color: "#000000",
          pointerEvents: "none",
          textShadow: "2px 2px 3px rgba(61, 61, 61, 0.5)",
        }}
      >
        {/* node details */}
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
              INFO: Node <strong>{index + 1}</strong> | Position X=
              <span>{node.x.toFixed(2)}</span>, Y=<span>{node.y.toFixed(2)}</span>, Z=
              <span>{node.z.toFixed(2)}</span>
              {node.assignedLabel && (
                <span style={{ marginLeft: "15px" }}>
                  | Label: <span>{node.assignedLabel.content}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
  
        {/* labels */}
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
              LABEL: <strong>{label.content}</strong> | Priority = <span>{label.priority}</span> | Function = <span>{label.function}</span> | 
              {label.function === "link" && label.url && (
                <> URL: <a
                    href={label.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#000000",
                      textDecoration: "none",
                      cursor: "pointer",
                      pointerEvents: "auto",
                    }}
                  >
                    {label.url}
                  </a>
                </>
              )}
              {label.function === "interface" && label.interfaceContent && (
                <a
                  onClick={(e) => {
                    e.preventDefault(); 
                    setSelectedInterfaceContent(label.interfaceContent || "");
                  }}
                  style={{
                    color: "#000000", 
                    cursor: "pointer",
                    textDecoration: "none",
                    pointerEvents: "auto",
                  }}
                >
                  INTERFACE: {label.content.replace('./', '')}
                </a>
              )}
            </li>
          ))}
        </ul>
        {/* interface label content */}
        {typedContent && (
          <div style={{ marginTop: "30px", fontWeight: "normal" }}>
            <h3></h3>
            <p
              style={{
                maxWidth: "600px",      
                width: "100%",            
                wordWrap: "break-word",
              }}
            >
              {typedContent}
            </p>
          </div>
        )}
      </div>
  
      {/* 3D scene */}
      <div
        ref={mountRef}
        style={{
          position: "absolute",
          left: `200px`,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          zIndex: 10,
        }}
      >
       {/* node labels */}
      {nodes.map((node) => {
        if (!node.assignedLabel || !cameraRef.current) return null;

        const screenPos = new THREE.Vector3(node.x, node.y, node.z).project(cameraRef.current);
        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth - 200;
        const y = (screenPos.y * -0.5 + 0.5) * window.innerHeight;
        let displayType = "block"
        if (boxyVers){
          displayType = "none"
        }

        if (x < 0 || x > window.innerWidth - 200 || y < 0 || y > window.innerHeight) {
          // console.warn(`Label '${node.assignedLabel.content}' is offscreen`);
          return null;
        }

        const handleClick = () => {
          if (node.assignedLabel!.function === "link" && node.assignedLabel!.url) {
            window.open(node.assignedLabel!.url, "_blank");
          } else if (node.assignedLabel!.function === "interface") {
            if (node.assignedLabel!.content === "./devlog") {
              router.push("/devlog");
            } else {
              setSelectedInterfaceContent(node.assignedLabel!.interfaceContent || "");
            }
          }
        };

        {/* node styling */}
        return (
          <div
            key={node.assignedLabel.content}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y}px`,
              color: "black",
              padding: "0px 0px",
              zIndex: 30,
              cursor: "pointer",
              transform: "translateX(210px) translateY(-10px)",
              pointerEvents: "auto",
              fontSize: "11px",
              fontFamily: "monospace",
              fontWeight: 100,
              fontStyle: "normal",
              textDecoration: "none", 
              textShadow: "2px 2px 3px rgba(61, 61, 61, 0.5)",
              display:  displayType,
            }}
            onClick={handleClick}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} 
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            {node.assignedLabel.content}
          </div>
        );
      })}
      </div>
    </div>
  );
}