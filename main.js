import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- 1. Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 3); // Approximate eye height

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 2. Lighting (essential, otherwise model will be pitch black) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// --- 3. Load 3D Model (Member 1 exports GLB and places it in public/models/room.glb) ---
const loader = new GLTFLoader();
loader.load(
  '/models/room.glb', // Please ensure the file path is correct
  (gltf) => {
    const model = gltf.scene;
    model.traverse((node) => {
      if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
    });
    scene.add(model);
    console.log('Model loaded successfully');
  },
  undefined,
  (error) => {
    console.error('Model loading failed:', error);
    // Temporary placeholder: a simple box, for debugging when model is missing
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0x00aaff })
    );
    box.position.y = 1;
    scene.add(box);
    alert('Room model not found, currently showing placeholder box. Please check /public/models/room.glb');
  }
);

// --- 4. First-Person Free-Roaming Controls ---
const controls = new PointerLockControls(camera, renderer.domElement);
const blocker = document.getElementById('blocker');

blocker.addEventListener('click', () => controls.lock());
controls.addEventListener('lock', () => { blocker.style.display = 'none'; });
controls.addEventListener('unlock', () => { blocker.style.display = 'flex'; });

// Keyboard Input State
const keys = { w: false, a: false, s: false, d: false };
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyW') keys.w = true;
  if (e.code === 'KeyA') keys.a = true;
  if (e.code === 'KeyS') keys.s = true;
  if (e.code === 'KeyD') keys.d = true;
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'KeyW') keys.w = false;
  if (e.code === 'KeyA') keys.a = false;
  if (e.code === 'KeyS') keys.s = false;
  if (e.code === 'KeyD') keys.d = false;
});

// --- 5. Animation Loop (Movement Logic) ---
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const speed = 5.0;

function animate() {
  requestAnimationFrame(animate);

  if (controls.isLocked) {
    // Damping effect for smoother movement
    velocity.x -= velocity.x * 10.0 * 0.01;
    velocity.z -= velocity.z * 10.0 * 0.01;

    direction.z = Number(keys.w) - Number(keys.s);
    direction.x = Number(keys.d) - Number(keys.a);
    direction.normalize();

    if (keys.w || keys.s) velocity.z -= direction.z * speed * 0.01;
    if (keys.a || keys.d) velocity.x -= direction.x * speed * 0.01;

    controls.moveRight(-velocity.x);
    controls.moveForward(-velocity.z);
  }

  renderer.render(scene, camera);
}
animate();

// --- 6. Window Resize Adaptation ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});