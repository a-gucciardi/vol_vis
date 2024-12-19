import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { VTKLoader } from 'three/examples/jsm/loaders/VTKLoader';

function loadSegmentation(vtkPath, transformMatrix) {
    const loader = new VTKLoader();
    loader.load(vtkPath, function (geometry) {
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.applyMatrix4(new THREE.Matrix4().fromArray(transformMatrix));
        scene.add(mesh);
    });
}

// Example usage
const vtkPath = 'path/to/segmentation.vtk';
const transformMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; // Identity matrix
loadSegmentation(vtkPath, transformMatrix);