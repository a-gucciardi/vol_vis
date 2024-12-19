import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VTKLoader } from 'three/addons/loaders/VTKLoader.js';

// Create container for all viewports
const container = document.createElement('div');
container.style.display = 'grid';
container.style.gridTemplateColumns = 'repeat(4, 1fr)';
container.style.gridTemplateRows = 'repeat(2, 1fr)';
container.style.gap = '2px';
container.style.width = '100vw';
container.style.height = '100vh';
container.style.backgroundColor = '#000';
document.body.appendChild(container);

const fileNames = [
    'lh.vtk'
];

// Function to create a viewport
function createViewport(file) {
    const viewportDiv = document.createElement('div');
    viewportDiv.style.width = '100%';
    viewportDiv.style.height = '100%';
    viewportDiv.style.position = 'relative';
    container.appendChild(viewportDiv);

    const scene = new THREE.Scene();

    // Add lights to your scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(1, 1, 1);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight1, directionalLight2);

    const camera = new THREE.PerspectiveCamera(
        85,
        (window.innerWidth / 4) / (window.innerHeight / 2),
        0.01,
        1000
    );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(viewportDiv.clientWidth, viewportDiv.clientHeight);
    renderer.setClearColor('#483D8B');
    viewportDiv.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    // VTK loading
    const loader = new VTKLoader();
    loader.load(`./volumes/${file}`, function (geometry) {
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();

        // texture
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('./textures/cm_gray.jpg');

        const material = new THREE.MeshPhongMaterial({
            map: texture,
            transparent: false,
            opacity: 0.1,
            shininess: 100,
            wireframe: false
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Scale and center the mesh
        const boundingBox = geometry.boundingBox;
        const size = new THREE.Vector3();
        boundingBox.getSize(size);

        const maxDimension = Math.max(size.x, size.y, size.z);
        const scaleFactor = 50 / maxDimension;
        mesh.scale.multiplyScalar(scaleFactor);

        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        center.multiplyScalar(-scaleFactor);
        mesh.position.copy(center);

        scene.add(mesh);

        console.log(`Viewport - Scale factor:`, scaleFactor);
        console.log(`Viewport - Scaled dimensions:`, {
            width: size.x * scaleFactor,
            height: size.y * scaleFactor,
            depth: size.z * scaleFactor
        });
    });

    camera.lookAt(0, 0, 0);
    camera.position.set(50, 50, 50);

    // Handle resize for this viewport
    function onResize() {
        const width = viewportDiv.clientWidth;
        const height = viewportDiv.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    // Return objects needed for animation
    return { scene, camera, renderer, controls, onResize };
}

// Create 8 viewports
const viewports = fileNames.map(fileName => createViewport(fileName));

// Handle window resize
window.addEventListener('resize', () => {
    viewports.forEach(viewport => viewport.onResize());
});

// Animation loop
function animate() {
    viewports.forEach(viewport => {
        viewport.renderer.render(viewport.scene, viewport.camera);
        viewport.controls.update();
    });
}

requestAnimationFrame(function loop() {
    animate();
    requestAnimationFrame(loop);
});
