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

export default function ThreeNodeSystemMobile() {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const boxyRef = useRef<BoxyObject | null>(null);

  const [showAscii, setShowAscii] = useState(false);
  const [showMountRef, setShowMountRef] = useState(false);
  const [startTypewriter, setStartTypewriter] = useState(false);

  const [typedLines, setTypedLines] = useState<string[]>(["", "", "", "", "", "", "", "", ""]);

  const linesToType = [
    "./youtube | URL: https://example.com/youtube",
    "    ",
    "./X | URL: https://example.com/x",
    "    ",
    "./instagram | URL: https://example.com/instagram",
    "    ",
    "./steam | URL: https://example.com/steam",
    "    ",
    "./about us | INTERFACE: about us",
  ];

  useEffect(() => {
    document.documentElement.style.setProperty("height", "100%");
    document.documentElement.style.setProperty("min-height", "100%");
    document.documentElement.style.setProperty("overflow", "hidden");
    
    document.body.style.setProperty("height", "100vh");
    document.body.style.setProperty("min-height", "100vh");
    document.body.style.setProperty("overflow", "hidden");
    document.body.style.setProperty("margin", "0");
    document.body.style.setProperty("padding", "0");

    document.body.style.paddingTop = "env(safe-area-inset-top)";
    document.body.style.paddingBottom = "env(safe-area-inset-bottom)";
    document.body.style.paddingLeft = "env(safe-area-inset-left)";
    document.body.style.paddingRight = "env(safe-area-inset-right)";
  
    document.body.style.background =
      "radial-gradient(circle at 50%, #eaeaea 0%, #d6d6d6 30%, #bfbfbf 60%) no-repeat center center fixed";
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
        skinnedPos.multiplyScalar(1 / 14);
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
    const camera = new THREE.PerspectiveCamera(
      95,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 60);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(dpr);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.1;
    
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
          const scaleFactor = 14;
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

  function formatTypedLine(line: string) {
    const patterns = ["URL: ", "INTERFACE: "];
    let earliestIdx = -1;
    let foundPattern = "";
  
    for (let pattern of patterns) {
      const idx = line.indexOf(pattern);
      if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) {
        earliestIdx = idx;
        foundPattern = pattern;
      }
    }
  
    if (earliestIdx === -1) return line;
  
    const prefix = line.substring(0, earliestIdx + foundPattern.length);
    const suffix = line.substring(earliestIdx + foundPattern.length);
  
    if (foundPattern === "URL: ") {
      return (
        <>
          {prefix}
          <a
            href={suffix.trim()}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline", color: "inherit" }} 
          >
            {suffix}
          </a>
        </>
      );
    }
  
    return (
      <>
        {prefix}
        <span style={{ textDecoration: "underline" }}>
          {suffix}
        </span>
      </>
    );
  }

  useEffect(() => {
    const currentMount = mountRef.current;
    const clock = new THREE.Clock();

    if (!currentMount) return;
    const { scene, camera, renderer, composer, controls } = initializeScene(currentMount);

    loadBoxyModel("/Boxy.glb")
      .then((loadedBoxy) => {
        scene.add(loadedBoxy.model);
      })
      .catch((error) => {
        console.error("Error loading Boxy model:", error);
      });

    const targetFrameInterval = 1 / 60; // seconds
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
      
            boxyRef.current.model.updateMatrixWorld(true);
            boxyRef.current.dynamicEdges.forEach(({ mesh, line, thresholdAngle }) => {
              const deformedGeom = getDeformedGeometry(mesh);
              line.geometry.dispose();
              line.geometry = new THREE.EdgesGeometry(deformedGeom, thresholdAngle);
            });
          }
          composer.render();
          accumulator %= targetFrameInterval;
        }
      }
    animate();
  }, []);

  useEffect(() => {
    setShowAscii(true);
    const t1 = setTimeout(() => setShowMountRef(true), 2000);

    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!showMountRef) return;
  
    const t2 = setTimeout(() => {
      setStartTypewriter(true);
    }, 1500);
  
    return () => clearTimeout(t2);
  }, [showMountRef]);

  useEffect(() => {
    if (!startTypewriter) return;

    let currentLineIndex = 0;
    let currentCharIndex = 0;
    let currentTyped = ["", "", "", "", "", "", "", "", "", ];

    const intervalId = setInterval(() => {
      const fullLine = linesToType[currentLineIndex];
      if (currentCharIndex < fullLine.length) {
        currentTyped[currentLineIndex] += fullLine[currentCharIndex];
        currentCharIndex++;
      } else {
        currentLineIndex++;
        currentCharIndex = 0;
        if (currentLineIndex >= linesToType.length) {
          clearInterval(intervalId);
        }
      }
      setTypedLines([...currentTyped]);
    }, 15);

    return () => clearInterval(intervalId);
  }, [startTypewriter]);


  return (
    <>
      <div
        id="ascii-container"
        style={{
          position: "absolute",
          top: "5%",
          left: "50%",
          transform: "translate(-50%, -5%)",
          fontSize: 13,
          opacity: showAscii ? 1 : 0,
          transition: "opacity 2s ease",
          whiteSpace: "pre",
        }}
      >
        {`
 __      ______ __    _____      
 \\ \\    / / __  \\ \\ \\/ /| |     
  \\ \\  / / |  |  \\ \\  / | |     
   \\ \\/ /| |  | |/ /\\ \\ | |     
    \\  / | |__| / /__\\ \\| |____ 
     \\/   \\____/_/    \\_\\______| /\\\\ /\\\\ /\\\\
                                 \\\\/ \\\\/ \\\\/
`}
      </div>

      <div
        ref={mountRef}
        style={{
          opacity: showMountRef ? 1 : 0,
          transition: "opacity 1.5s ease",

          position: "absolute",
          top: "45%",
          left: "50%",
          transform: "translate(-50%, -45%)",

          width: "80vw",
          height: "80vw",

          overflow: "hidden",
          zIndex: 10,
        }}
      >
      </div>

      <div
        style={{
          position: "absolute",
          top: "calc(50% + 40vw)",
          left: "50%",
          transform: "translate(-50%, 0)",
          whiteSpace: "pre",
          fontSize: 11,
          textAlign: "left",
          width: "80vw",
        }}
      >
        {typedLines.map((line, i) => {
            const renderedLine = formatTypedLine(line);
            return (
                <div key={i}>
                    {renderedLine}
                </div>
            );
        })}
      </div>
    </>
  );
}