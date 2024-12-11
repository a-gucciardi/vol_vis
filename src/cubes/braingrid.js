import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';

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
    'p1_stp.ply',
    'p0_stp.ply',
    'p1.ply',
    'stp_r15.ply',
    'stp_r50.ply',
    '10_Left-Thalamus.ply',
    '11_Left-Caudate.ply',
    '13_Left-Pallidum.ply'
];

// Function to create a viewport
function createViewport(file) {
    const viewportDiv = document.createElement('div');
    viewportDiv.style.width = '100%';
    viewportDiv.style.height = '100%';
    viewportDiv.style.position = 'relative';
    container.appendChild(viewportDiv);

    const scene = new THREE.Scene();

    //light
    // Add lights to your scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    // scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 200);
    directionalLight1.position.set(1, 1, 1);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 200);
    directionalLight2.position.set(50, 50, 50);
    scene.add(directionalLight1, directionalLight1);

    const camera = new THREE.PerspectiveCamera(
        70,
        (window.innerWidth/4) / (window.innerHeight/2),
        1,
        1000
    );
    camera.zoom = 0.5
    // console.log(camera)

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(viewportDiv.clientWidth, viewportDiv.clientHeight);
    renderer.setClearColor('#483D8B');
    viewportDiv.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping=true
    controls.damping=0.2

    // PLY loading
    const loader = new PLYLoader();
    loader.load(`./volumes/${file}`, function(brainGeo) {
        console.log(brainGeo)
        brainGeo.computeVertexNormals();
        brainGeo.computeBoundingBox();

        // texture
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('./textures/cm_gray.jpg');

        const brainMat = new THREE.MeshPhongMaterial({ 
            map: texture,
            transparent: false,
            // opacity: 1,
            shininess: 1,
            wireframe: true
        });
        const brainMesh = new THREE.Mesh(brainGeo, brainMat);
        console.log(brainMesh)
        
        // current size
        const boundingBox = brainGeo.boundingBox;
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        // console.log(size)
        // max -> fit to 50^3
        // const maxDimension = Math.max(size.x, size.y, size.z);
        // const scaleFactor = 50 / maxDimension;
        // brainMesh.scale.multiplyScalar(scaleFactor);
        // Center the mesh
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        // center.multiplyScalar(-scaleFactor); // Adjust center based on scale
        // brainMesh.position.copy(center);

        // bounding box geometry using the dimensions of the bounding box
        const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const boxMesh = new THREE.Mesh(
            boxGeometry,
            new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
        );
        boxMesh.position.copy(center);
        // Create a bounding sphere geometry with radius based on the max dimension
        const radius = Math.max(size.x, size.y, size.z) / 2;
        const sphereGeometry = new THREE.SphereGeometry(radius);
        const sphereMesh = new THREE.Mesh(
            sphereGeometry,
            new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
        );
        sphereMesh.position.copy(center);

        scene.add(brainMesh);
        scene.add(boxMesh);
        // scene.add(sphereMesh);

        // console.log(`Viewport - Scale factor:`, scaleFactor);
        // console.log(`Viewport - Scaled dimensions:`, {
        //     width: size.x * scaleFactor,
        //     height: size.y * scaleFactor,
        //     depth: size.z * scaleFactor
        // });
    });

    camera.lookAt(0, 0, 0);
    camera.position.set(50, 150, 0);

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