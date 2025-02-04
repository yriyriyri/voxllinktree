// bakeEdges.ts
//
// A Node.js script to bake wireframe edges for animation #16 and store in bakedEdges.json

import * as fs from "fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import path from "path";

const GLTF_PATH = path.resolve("../public/Boxy.glb"); 
const OUTPUT_JSON = "bakedEdges.json";
const FRAME_COUNT = 40; 
const ANIMATION_INDEX = 16; 

function getDeformedGeometry(mesh: THREE.Mesh) {
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

async function bakeEdges() {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/"); // or wherever your DRACO files reside
  loader.setDRACOLoader(dracoLoader);

  // 1) load the GLTF
  const gltf = await loader.loadAsync(GLTF_PATH);
  const scene = gltf.scene;
  const animations = gltf.animations;
  if (!animations[ANIMATION_INDEX]) {
    throw new Error(`Animation index ${ANIMATION_INDEX} not found in GLTF!`);
  }
  // 2) set up the mixer & start the target animation
  const mixer = new THREE.AnimationMixer(scene);
  const clip = animations[ANIMATION_INDEX];
  const action = mixer.clipAction(clip);
  action.play();

  // 3) We will step through FRAME_COUNT frames
  const duration = clip.duration; // total seconds of the clip
  const stepTime = duration / FRAME_COUNT; // how many seconds each frame lasts

  // 4) store baked edges for each frame in an array
  const bakedData = []; // array of frames

  // We only need the SkinnedMesh(es) or Mesh(es) that will be used for edges
  // If you have multiple, you can store them all
  // We'll store for each relevant mesh, or combine them if you prefer
  // We'll assume you just have one main mesh for now, but adapt as needed
  const targetMeshes: THREE.Mesh[] = [];
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      targetMeshes.push(child);
    }
  });

  // Make sure to update the bindMatrix if SkinnedMesh is used
  // (Usually set in the loader, but you can double-check)

  // 5) step the animation, build edges
  const dummyDelta = stepTime; // each iteration, we step by stepTime
  for (let i = 0; i < FRAME_COUNT; i++) {
    mixer.update(dummyDelta);

    // For each relevant mesh, get the deformed geometry, build edges, store result
    // We'll combine them into one data structure or separate them out
    const frameEdges: any[] = []; // store edges for each mesh in this frame

    for (const mesh of targetMeshes) {
      if (mesh instanceof THREE.Mesh) {
        // Deform geometry
        const deformedGeom = getDeformedGeometry(mesh);
        // Build edges
        const thresholdAngle = Math.PI; // match your code
        const edgesGeom = new THREE.EdgesGeometry(deformedGeom, thresholdAngle);

        // Convert edgesGeom into a raw arrays for positions & indices
        const posAttr = edgesGeom.attributes.position as THREE.BufferAttribute;
        const positions = Array.from(posAttr.array);
        const indexAttr = edgesGeom.index;
        let indices: number[] = [];
        if (indexAttr) {
          indices = Array.from(indexAttr.array);
        }

        frameEdges.push({ positions, indices });
      }
    }

    bakedData.push(frameEdges);
  }

  // 6) write out to JSON
  // This means bakedData is an array of length FRAME_COUNT,
  // each entry is an array of "meshEdges" objects,
  // each containing { positions, indices }
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(bakedData));
  console.log(`Baked edges saved to ${OUTPUT_JSON} with ${FRAME_COUNT} frames.`);
}

bakeEdges().catch((err) => console.error("Failed to bake edges:", err));