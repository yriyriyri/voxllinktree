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
  dracoLoader.setDecoderPath("/draco/"); 
  loader.setDRACOLoader(dracoLoader);

  const gltf = await loader.loadAsync(GLTF_PATH);
  const scene = gltf.scene;
  const animations = gltf.animations;
  if (!animations[ANIMATION_INDEX]) {
    throw new Error(`Animation index ${ANIMATION_INDEX} not found in GLTF!`);
  }
  const mixer = new THREE.AnimationMixer(scene);
  const clip = animations[ANIMATION_INDEX];
  const action = mixer.clipAction(clip);
  action.play();

  const duration = clip.duration; 
  const stepTime = duration / FRAME_COUNT; 

  const bakedData = [];

  
  const targetMeshes: THREE.Mesh[] = [];
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      targetMeshes.push(child);
    }
  });



  const dummyDelta = stepTime; 
  for (let i = 0; i < FRAME_COUNT; i++) {
    mixer.update(dummyDelta);

    const frameEdges: any[] = []; 

    for (const mesh of targetMeshes) {
      if (mesh instanceof THREE.Mesh) {
        const deformedGeom = getDeformedGeometry(mesh);
        const thresholdAngle = Math.PI; // match your code
        const edgesGeom = new THREE.EdgesGeometry(deformedGeom, thresholdAngle);

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

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(bakedData));
  console.log(`Baked edges saved to ${OUTPUT_JSON} with ${FRAME_COUNT} frames.`);
}

bakeEdges().catch((err) => console.error("Failed to bake edges:", err));