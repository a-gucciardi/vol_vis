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


// cube 0
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
cube.visible = false;
scene.add( cube );
// meshcube 0
const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const brainBox = new THREE.Mesh(geometry, wireframeMaterial);
scene.add( brainBox )
// brainBox.scale.set(2.5, 2.5, 2.5);
const edges = new THREE.EdgesGeometry( geometry ); 
const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial( { color: 0xffffff } ) ); 
scene.add( line );


// grid cubes
const geometry2 = new THREE.BoxGeometry(1, 1, 1);
const colors = [
    "#FF6633", "#FFB399", "#FF33FF", "#FFFF99", "#00B3E6", "#E6B333", "#3366E6", "#999966", "#809980", "#E6FF80", 
    "#1AFF33", "#999933", "#FF3380", "#CCCC00", "#66E64D", "#4D80CC", "#FF4D4D", "#99E6E6", "#6666FF"
]
const boxes = [...Array(19).keys()];

boxes.forEach((x, indexX) => {
    boxes.forEach((y, indexY) => {
        boxes.forEach((z, indexZ) => {
            const edges = new THREE.EdgesGeometry( geometry2 ); 
            // const line =  new THREE.LineSegments(edges, new THREE.LineBasicMaterial( { color: colors[Math.floor(x+y+z) % boxes.length] } ) ); 
            const line =  new THREE.LineSegments(edges, new THREE.LineBasicMaterial( { color: 0x008080 } ) ); 
            line.position.set(x, y, z);
            scene.add(line);
        });
    });
});
// logs
console.log(cube.position)
console.log(brainBox.position)
console.log(line)
camera.position.set(boxes.length / 2, boxes.length / 2, boxes.length + 5)
camera.lookAt(0,0,0)
// camera.position.set(50, 50, 50)

function animate() {
	renderer.render( scene, camera );
    cube.rotation.x += 0.01;
    brainBox.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    cube.rotation.z += 0.11;
}
renderer.setAnimationLoop( animate );