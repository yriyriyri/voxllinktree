import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface BoxyObject {
  model: THREE.Group;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  mixer: THREE.AnimationMixer;
  currentAnimation: number;
  desiredAnimation: number;
  animations: THREE.AnimationClip[];
  currentAction?: THREE.AnimationAction;
  dynamicEdges: { mesh: THREE.Mesh; line: THREE.LineSegments; thresholdAngle: number }[];
}

interface DebugCubeEntry {
  mesh: THREE.Mesh;
  cubes: THREE.Mesh[];
  vertexCount: number;
}

const spawnAllCubes = false;

const cubesToMake = [

  "vox005-110",
  // "vox013_4-93",
  // "vox013_4-231",
  // "vox013_4-96",
  // "vox013_4-114",
  "vox013_2-162",
  "vox013-266",
  "vox013-271",
  "vox013_2-63",
  "vox013_2-72",
  "vox013-126",
  "vox013_2-330",
  "vox013_2-91",
  "vox013-150",
  "vox013_2-318",
  "vox003_1-0",
  "vox001_1-17",
  "vox002_4-31",
  "vox004_4-29",
  "vox013_2-5",
  "vox013_2-14"
];

export default function ThreeNodeSystemMobile() {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const boxyRef = useRef<BoxyObject | null>(null);
  const debugCubeEntries: DebugCubeEntry[] = [];
  const prevOverlayMappingRef = useRef<string[]>([]);
  const overlayPositionsRef = useRef<{ id: string; label: string; x: number; y: number }[]>([]);
  const startDelay = 0.4;
  const transitionLockTime = 0.6;

  const [typedLabels, setTypedLabels] = useState<string[]>(["", "", "", ""]);
  const prevTypedLabelsRef = useRef<string[]>(["", "", "", ""]);

  const typewriterProgressRef = useRef<
    { currentText: string; charIndex: number; timer: number; delay: number }[]
  >([
    { currentText: "", charIndex: 0, timer: 0, delay: 0 },
    { currentText: "", charIndex: 0, timer: 0, delay: 0 },
    { currentText: "", charIndex: 0, timer: 0, delay: 0 },
    { currentText: "", charIndex: 0, timer: 0, delay: 0 },
  ]);

  const transitionsRef = useRef<Array<{
    oldText: string;
    target: string;
    oldCubeId: string;
    newCubeId: string;  // <--- new
    newPos: { x: number; y: number };
    elapsed: number;
  } | null>>([null, null, null, null]);

  const [overlayPositions, setOverlayPositions] = useState<
    { id: string; label: string; x: number; y: number }[]
  >([]);

  const baseUrl =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://fallback.com";

  const labels = [
    "./devlog",
    "./X",
    "./instagram",
    "./youtube"
  ];

  const labelUrls = [
    `${baseUrl}/devlog`,
    "https://x.com/voxldev",
    "https://www.instagram.com/voxl.online//",
    "https://www.youtube.com/channel/UCgCwjJJ7qHF0QV27CzHSZnw"
  ];

  useEffect(() => {
    document.documentElement.style.height = "100%";
    document.documentElement.style.minHeight = "100%";
    document.documentElement.style.overflow = "hidden";

    document.body.style.height = "100vh";
    document.body.style.minHeight = "100vh";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.paddingTop = "env(safe-area-inset-top)";
    document.body.style.paddingBottom = "env(safe-area-inset-bottom)";
    document.body.style.paddingLeft = "env(safe-area-inset-left)";
    document.body.style.paddingRight = "env(safe-area-inset-right)";
    document.body.style.background =
      "radial-gradient(circle at 50%, #ffffff 0%, #ffffff 30%, #ffffff 60%) no-repeat center center fixed";
    document.body.style.backgroundSize = "cover";

    return () => {
      document.body.style.background = "";
    };
  }, []);

  function getDeformedGeometry(mesh: THREE.Mesh): THREE.BufferGeometry {
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

      for (let i = 0; i < vertexCount; i++) {
        tempPos.fromBufferAttribute(posAttr, i);
        tempPos.applyMatrix4(skinnedMesh.bindMatrix);
        skinnedPos.set(0, 0, 0);

        skinIndices.fromBufferAttribute(skinIndexAttr, i);
        skinWeights.fromBufferAttribute(skinWeightAttr, i);

        for (let j = 0; j < 4; j++) {
          const boneIndex = skinIndices.getComponent(j);
          const weight = skinWeights.getComponent(j);
          if (weight === 0) continue;
          boneMatrix.copy(skinnedMesh.skeleton.bones[boneIndex].matrixWorld);
          boneMatrix.multiply(skinnedMesh.skeleton.boneInverses[boneIndex]);
          tempVec.copy(tempPos).applyMatrix4(boneMatrix).multiplyScalar(weight);
          skinnedPos.add(tempVec);
        }
        skinnedPos.setY(skinnedPos.y - 5);
        skinnedPos.setZ(skinnedPos.z - 5);
        skinnedPos.multiplyScalar(1 / 12);

        deformedPositions[i * 3] = skinnedPos.x;
        deformedPositions[i * 3 + 1] = skinnedPos.y;
        deformedPositions[i * 3 + 2] = skinnedPos.z;
      }

      const deformedGeometry = new THREE.BufferGeometry();
      deformedGeometry.setAttribute("position", new THREE.BufferAttribute(deformedPositions, 3));
      if (sourceGeom.index) {
        deformedGeometry.setIndex(sourceGeom.index.clone());
      }
      return deformedGeometry;
    } else {
      return mesh.geometry.clone();
    }
  }

  function initializeScene(mount: HTMLDivElement) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 150);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(dpr);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 2.0;
    controls.enableZoom = true;
    controls.enablePan = false;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    renderPass.clearColor = new THREE.Color(0x000000);
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);

    const blurOverlayShader = {
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2() },
        radius: { value: 1.0 },
        blurOpacity: { value: 0.5 },
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
          vec4 blurredColor = vec4(0.0);
          float totalSamples = 0.0;
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
          blurredColor /= totalSamples;
          vec4 originalColor = texture2D(tDiffuse, vUv);
          vec4 finalColor = mix(originalColor, blurredColor, blurOpacity);
          gl_FragColor = finalColor;
        }
      `,
    };

    const blurOverlayPass = new ShaderPass(blurOverlayShader);
    blurOverlayPass.material.uniforms.resolution.value.set(mount.clientWidth, mount.clientHeight);
    blurOverlayPass.material.uniforms.radius.value = 3.0;
    blurOverlayPass.material.uniforms.blurOpacity.value = 0.4;
    composer.addPass(blurOverlayPass);

    return { scene, camera, renderer, composer, controls };
  }

  function loadBoxyModel(url: string) {
    return new Promise<BoxyObject>((resolve, reject) => {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco/");
      loader.setDRACOLoader(dracoLoader);

      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          const scaleFactor = 12;
          const selfOcclude = true;
          model.scale.set(scaleFactor, scaleFactor, scaleFactor);
          const randomX = 0;
          const randomY = 5;
          const randomZ = 5;
          const position = new THREE.Vector3(randomX, randomY, randomZ);
          model.position.copy(position);
          model.rotation.set(0, 0, 0);

          const dynamicEdges: { mesh: THREE.Mesh; line: THREE.LineSegments; thresholdAngle: number }[] = [];
          const thresholdAngle = Math.PI;

          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const edgesGeometry = new THREE.EdgesGeometry(child.geometry, thresholdAngle);
              const lineMaterial = new THREE.LineBasicMaterial({
                color: 0x000000,
                depthTest: true,
              });
              const edgeWireframe = new THREE.LineSegments(edgesGeometry, lineMaterial);
              edgeWireframe.layers.set(0);
              dynamicEdges.push({ mesh: child, line: edgeWireframe, thresholdAngle });
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  mat.colorWrite = false;
                  mat.depthWrite = selfOcclude;
                  mat.polygonOffset = true;
                  mat.polygonOffsetFactor = 4;
                  mat.polygonOffsetUnits = 10;
                });
              } else {
                child.material.colorWrite = false;
                child.material.depthWrite = selfOcclude;
                child.material.polygonOffset = true;
                child.material.polygonOffsetFactor = 4;
                child.material.polygonOffsetUnits = 10;
              }
              edgeWireframe.renderOrder = 999;
              model.add(edgeWireframe);
            }
          });

          model.traverse((child) => {
            if (child instanceof THREE.Mesh && !child.userData.hasDebugCubes) {
              const defGeom = getDeformedGeometry(child);
              const posAttr = defGeom.getAttribute("position");
              if (!posAttr) return;
              const vertexCount = posAttr.count;
              const meshName = child.name || "UnnamedMesh";
              const cubes: THREE.Mesh[] = [];
              for (let i = 0; i < vertexCount; i++) {
                const globalDebugCubeId = `${meshName}-${i}`;
                const x = posAttr.getX(i);
                const y = posAttr.getY(i);
                const z = posAttr.getZ(i);
                const debugCube = new THREE.Mesh(
                  new THREE.BoxGeometry(0.05, 0.05, 0.05),
                  new THREE.MeshBasicMaterial({ color: 0xff0000 })
                );
                debugCube.userData.debugCubeId = i;
                debugCube.userData.meshName = meshName;
                debugCube.userData.globalDebugCubeId = globalDebugCubeId;
                debugCube.position.set(x, y, z);
                model.add(debugCube);
                if (!spawnAllCubes) {
                  debugCube.visible = false;
                }
                cubes.push(debugCube);
              }
              child.userData.hasDebugCubes = true;
              debugCubeEntries.push({ mesh: child, cubes, vertexCount });
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
          reject(error);
        }
      );
    });
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

  function updateDebugCubes() {
    debugCubeEntries.forEach((entry) => {
      const defGeom = getDeformedGeometry(entry.mesh);
      const posAttr = defGeom.getAttribute("position");
      if (!posAttr) return;
      entry.cubes.forEach((cube) => {
        const i = cube.userData.debugCubeId;
        if (i < posAttr.count) {
          const x = posAttr.getX(i);
          const y = posAttr.getY(i);
          const z = posAttr.getZ(i);
          cube.position.set(x, y, z);
        }
      });
    });
  }

  function getOverlayPositionForCubeId(cubeId: string): { x: number; y: number } | null {
    console.log(`[getOverlayPositionForCubeId] Searching for oldCubeId: "${cubeId}"`);
  
    if (!cameraRef.current || !mountRef.current) {
      console.warn("[getOverlayPositionForCubeId] cameraRef or mountRef not ready, returning null");
      return null;
    }
  
    const camera = cameraRef.current;
    const containerWidth = mountRef.current.clientWidth || window.innerWidth;
    const containerHeight = mountRef.current.clientHeight || window.innerHeight;
    
    for (const entry of debugCubeEntries) {
      for (const cube of entry.cubes) {
        const currentId = cube.userData.globalDebugCubeId;
        if (currentId === cubeId) {
          console.log(`[getOverlayPositionForCubeId] Found match! Cube ID: "${cubeId}"`);
          const pos = cube.getWorldPosition(new THREE.Vector3());
          const vector = pos.clone().project(camera);
          const position = {
            x: (vector.x + 1) / 2 * containerWidth,
            y: (-vector.y + 1) / 2 * containerHeight
          };
          console.log(`[getOverlayPositionForCubeId] Position for "${cubeId}":`, position);
          return position;
        } else {

        }
      }
    }
  
    console.warn(`[getOverlayPositionForCubeId] Could not find a cube with ID: "${cubeId}"`);
    return null;
  }

  function updateOverlayPositions() {
    if (!cameraRef.current || !mountRef.current) return;
    const camera = cameraRef.current;
  
    let allCubes: THREE.Mesh[] = [];
    debugCubeEntries.forEach((entry) => {
      allCubes.push(...entry.cubes);
    });
  
    if (!spawnAllCubes) {
      allCubes = allCubes.filter(cube =>
        cubesToMake.includes(cube.userData.globalDebugCubeId)
      );
    }
  
    const cubesWithDistance = allCubes.map((cube) => {
      const pos = cube.getWorldPosition(new THREE.Vector3());
      return { cube, distance: camera.position.distanceTo(pos) };
    });
    cubesWithDistance.sort((a, b) => a.distance - b.distance);
  
    const candidateCubes = cubesWithDistance.slice(0, 6);
  
    const selected: { id: string; label: string; x: number; y: number }[] = [];
    const containerWidth = mountRef.current.clientWidth || window.innerWidth;
    const containerHeight = mountRef.current.clientHeight || window.innerHeight;
  
    for (let i = 0; i < candidateCubes.length && selected.length < 4; i++) {
      const pos = candidateCubes[i].cube.getWorldPosition(new THREE.Vector3());
      const vector = pos.clone().project(camera);
      const x = (vector.x + 1) / 2 * containerWidth;
      const y = (-vector.y + 1) / 2 * containerHeight;
  
      if (x >= 0 && x <= containerWidth && y >= 0 && y <= containerHeight) {
        const overlayLabel = labels[selected.length] || (selected.length + 1).toString();
        selected.push({
          id: candidateCubes[i].cube.userData.globalDebugCubeId,
          label: overlayLabel,
          x,
          y
        });
      }
    }
  
    const newMapping = selected.map((item) => item.id);
    const prevMapping = prevOverlayMappingRef.current;
  
    for (let i = 0; i < newMapping.length; i++) {
      if (
        prevMapping[i] !== newMapping[i] &&
        prevTypedLabelsRef.current[i] === labels[i] &&
        transitionsRef.current[i] === null &&
        prevMapping[i] !== undefined &&  
        prevMapping[i] !== null
      ) {
        console.log(
          `** Transition Triggered for overlay index ${i} **\n` +
          `   Old ID: ${prevMapping[i]}\n` +
          `   New ID: ${newMapping[i]}`
        );
  
        transitionsRef.current[i] = {
          oldText: labels[i],
          target: labels[i],
          oldCubeId: prevMapping[i], 
          newCubeId: newMapping[i],
          newPos: selected[i],
          elapsed: 0
        };
  
        console.log("Created transition:", transitionsRef.current[i]);
  
        typewriterProgressRef.current[i] = { currentText: "", charIndex: 0, timer: 0, delay: 0 };
      }
    }
  
    for (let i = 0; i < newMapping.length; i++) {
      if (transitionsRef.current[i] === null) {
        prevMapping[i] = newMapping[i];
      }
    }
  
    prevOverlayMappingRef.current = [...prevMapping];
    overlayPositionsRef.current = selected;
    setOverlayPositions(selected);
  }
  
  function updateTypewriterEffect(delta: number) {
    setTypedLabels(labels);
  }

  useEffect(() => {
    const currentMount = mountRef.current;
    const clock = new THREE.Clock();
    if (!currentMount) return;
    const { scene, camera, renderer, composer, controls } = initializeScene(currentMount);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseClick(event: MouseEvent) {
      if (!spawnAllCubes) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const clickableObjects: THREE.Mesh[] = [];
      debugCubeEntries.forEach((entry) => {
        clickableObjects.push(...entry.cubes);
      });
      const intersects = raycaster.intersectObjects(clickableObjects);
      if (intersects.length > 0) {
        const firstHit = intersects[0];
        const clickedObject = firstHit.object;
        if (clickedObject instanceof THREE.Mesh) {
          (clickedObject.material as THREE.MeshBasicMaterial).color.set(0x0000ff);
          console.log("Clicked global cube id:", clickedObject.userData.globalDebugCubeId);
        }
      }
    }

    renderer.domElement.addEventListener("click", onMouseClick);

    loadBoxyModel("/Boxy.glb").then((loadedBoxy) => {
      scene.add(loadedBoxy.model);
    }).catch((error) => {
      console.error("Error loading Boxy model:", error);
    });

    const targetFrameInterval = 1 / 60;
    let accumulator = 0;

    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      accumulator += delta;

      if (controls) controls.update();

      if (accumulator >= targetFrameInterval) {
        if (boxyRef.current) {
          boxyRef.current.mixer.update(accumulator);
          updateAnimation(boxyRef.current);
          updateDebugCubes();

          if (boxyRef.current.currentAction) {
            boxyRef.current.currentAction.timeScale = 0.5;
          }

          boxyRef.current.model.updateMatrixWorld(true);
          boxyRef.current.dynamicEdges.forEach(({ mesh, line, thresholdAngle }) => {
            const deformedGeom = getDeformedGeometry(mesh);
            line.geometry.dispose();
            line.geometry = new THREE.EdgesGeometry(deformedGeom, thresholdAngle);
          });
        }

        composer.render();
        updateOverlayPositions();
        updateTypewriterEffect(accumulator);
        accumulator %= targetFrameInterval;
      }
    }

    animate();
    return () => {
      renderer.domElement.removeEventListener("click", onMouseClick);
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div
        ref={mountRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden"
        }}
      />
      {overlayPositions.map((overlay, index) => {
        const transition = transitionsRef.current[index];
        if (transition) {
          const oldPos =
            getOverlayPositionForCubeId(transition.oldCubeId) || overlay;
          return (
            <div
              key={overlay.id}
              style={{
                position: "absolute",
                left: oldPos.x,
                top: oldPos.y,
                backgroundColor: "black",
                color: "white",
                fontSize: "10px",
                display: "none",
                cursor: "pointer",
                zIndex: 10,              }}
            >
              {transition.oldText}
            </div>
          );
        } else {
          return (
            <div
              key={overlay.id}
              onClick={() => {
                if (index === 0) {
                  window.location.href = labelUrls[index];
                } else {
                  window.open(labelUrls[index], "_blank");
                }
              }}
              style={{
                position: "absolute",
                left: overlay.x,
                top: overlay.y,
                backgroundColor: "black",
                color: "white",
                fontSize: "10px",
                padding: "0px",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              {typedLabels[index] || ""}
            </div>
          );
        }
      })}
    </div>
  );
}