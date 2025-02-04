import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

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
        skinnedPos.setY(skinnedPos.y - 8);
        skinnedPos.setZ(skinnedPos.z - 5);
        skinnedPos.multiplyScalar(1 / 15);
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
    const camera = new THREE.PerspectiveCamera(95, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 60);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(dpr);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0xffffff, 0);
    mount.appendChild(renderer.domElement);
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
    return { scene, camera, renderer, composer };
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
          const scaleFactor = 15;
          const selfOcclude = true;
          model.scale.set(scaleFactor, scaleFactor, scaleFactor);
          const randomX = 0;
          const randomY = 8;
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

  useEffect(() => {
    const refHolder = { current: null as BoxyObject | null };
    const currentMount = mountRef.current;
    const clock = new THREE.Clock();

    if (!currentMount) return;
    const { scene, camera, renderer, composer } = initializeScene(currentMount);
    
    loadBoxyModel("/Boxy.glb")
      .then((loadedBoxy) => {
        refHolder.current = loadedBoxy;
        scene.add(loadedBoxy.model);
      })
      .catch((error) => {});

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
      composer.render();
    }
    
    animate()
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "white",
        zIndex: 10,
      }}
    />
  );
}