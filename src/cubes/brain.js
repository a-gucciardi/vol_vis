import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 85, window.innerWidth / window.innerHeight, 0.01, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(0x000000);
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );

// ply loading
const loader = new PLYLoader();
loader.load( './volumes/p0.ply', function ( brainGeo ) {

    brainGeo.computeVertexNormals();

    const brainMat = new THREE.MeshBasicMaterial( { color: 0x009cff, wireframe: true} );
    const brainMesh = new THREE.Mesh( brainGeo, brainMat );

    brainMesh.position.y = 0;
    brainMesh.position.z = 0;
    brainMesh.rotation.x = 0;
    brainMesh.scale.multiplyScalar( 1 );

    // brainMesh.castShadow = true;
    // brainMesh.receiveShadow = true;
    // Get geometry bounds
    brainGeo.computeBoundingBox();
    const boundingBox = brainGeo.boundingBox;
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    console.log("Model dimensions:", {
        width: size.x,
        height: size.y,
        depth: size.z
    });
    brainMesh.position.set(1,1,1)

    scene.add( brainMesh );

    console.log(brainMesh)
    console.log(brainGeo)

} );

camera.lookAt(0,0,0)
camera.position.set(50, 50, 50)

function animate() {
	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );