import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { NRRDLoader } from 'three/addons/loaders/NRRDLoader.js';
import { VolumeRenderShader1 } from 'three/addons/shaders/VolumeShader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let renderer,
scene,
camera,
controls,
material,
volconfig,
cmtextures,
obj;

const o1 = createScene();
// const o2 = createScene();

initControls();
render();

function createScene() {

    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 'darkorchid' )
    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setScissor( 0, 0, window.innerWidth * 0.5, window.innerHeight * 3.0);
    renderer.setSize( window.innerWidth/2, window.innerHeight )
    // renderer.setScissorTest( true );
    document.body.appendChild(renderer.domElement);

    // const camera = new THREE.PerspectiveCamera(75,1, 0.1, 1000);
    // camera.position.z = 12;
    const h = 600 // frustum height
    const aspect = window.innerWidth / window.innerHeight
    const camera1 = new THREE.OrthographicCamera( - h * aspect / 2, h * aspect / 2, h / 2, - h / 2, 1, 500 )
    camera1.up.set( 0, 1, 0 ) // In our data, z is up
    camera1.position.set(10, 10, 100)

    const camera2 = new THREE.OrthographicCamera( - h * aspect / 2, h * aspect / 2, h / 2, - h / 2, 1, 500 )
    camera2.up.set( 0, 1, 0 ) // In our data, z is up
    camera2.position.set(100, 10, 10)

    new NRRDLoader().load( 'nrrd/converted_4200_T2.nrrd', function ( volume ) {
        // helper
        const geometry = new THREE.BoxGeometry( volume.xLength, volume.yLength, volume.zLength )
        const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
        const cube = new THREE.Mesh( geometry, material )
        const box = new THREE.BoxHelper( cube )
        box.applyMatrix4( volume.matrix )
        // scene.add( box )
        // console.log(box.geometry)

        // x, y, z  planes
        const sliceX = volume.extractSlice( 'x', Math.floor( volume.RASDimensions[ 0 ] / 2 ) )
        const sliceY = volume.extractSlice( 'y', Math.floor( volume.RASDimensions[ 1 ] / 5 ) )
        const sliceZ = volume.extractSlice( 'z', Math.floor( volume.RASDimensions[ 2 ] / 4 ) )
        // console.log("sliceZ", sliceZ)
        // sliceZ.mesh.renderOrder = 0 
        sliceX.mesh.material.opacity = 0.6
        sliceY.mesh.material.opacity = 0.6
        sliceZ.mesh.material.opacity = 0.6
        sliceZ.mesh.visible = sliceY.mesh.visible = sliceX.mesh.visible = true
        scene.add( sliceZ.mesh ) 
        scene.add( sliceY.mesh ) 
        scene.add( sliceX.mesh )

    });
    new NRRDLoader().load( 'nrrd/converted_4200_T2.nrrd', function ( volume ) {
        volconfig = { Color_lim1: 0, Color_lim2: 1, renderstyle: 'iso', isothreshold: 0.15, colormap: 'gray' }
        // console.log(volume.data)
        const texture = new THREE.Data3DTexture( volume.data, volume.xLength, volume.yLength, volume.zLength )
        texture.format = THREE.RedFormat
        texture.type = THREE.FloatType
        texture.minFilter = texture.magFilter = THREE.LinearFilter
        texture.needsUpdate = true

        // box helper to see the extend of the volume
        const geom = new THREE.BoxGeometry( volume.xLength, volume.yLength, volume.zLength )
        const matos = new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
        const cube = new THREE.Mesh( geom, matos )
        const box = new THREE.BoxHelper( cube )
        box.applyMatrix4( volume.matrix )
        scene.add( box )
        box.visible = false
        // console.log(cube.position), console.log(volume.zLength)
        // Colormap textures
        cmtextures = {
            viridis: new THREE.TextureLoader().load( 'textures/cm_viridis.png', render),
            gray: new THREE.TextureLoader().load( 'textures/cm_gray.png', render ),
            test: new THREE.TextureLoader().load( 'textures/floors/FloorsCheckerboard_S_Diffuse.jpg', render),
            mc: new THREE.TextureLoader().load( 'textures/minecraft/atlas.png', render)
        };

        // Material
        const shader = VolumeRenderShader1
        const uniforms = THREE.UniformsUtils.clone( shader.uniforms )

        uniforms[ 'u_data' ].value = texture
        uniforms[ 'u_size' ].value.set( volume.xLength, volume.yLength, volume.zLength )
        uniforms[ 'u_clim' ].value.set( volconfig.Color_lim1, volconfig.Color_lim2 )
        uniforms[ 'u_renderstyle' ].value = volconfig.renderstyle == 'mip' ? 0 : 1 // 0: MIP, 1: ISO
        uniforms[ 'u_renderthreshold' ].value = volconfig.isothreshold // For ISO renderstyle
        uniforms[ 'u_cmdata' ].value = cmtextures[ volconfig.colormap ]

        // material = new THREE.RawShaderMaterial
        material = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
            side: THREE.BackSide // The volume shader uses the backface as its "reference point",
        } );

        // THREE.Mesh
        material.depthTest = false
        const geometry = new THREE.BoxGeometry( volume.xLength, volume.yLength, volume.zLength )
        geometry.translate( volume.xLength / 2 - 0.5 , volume.yLength / 2 - 0.5, volume.zLength /2 - 0.5)

        const meshBrain = new THREE.Mesh( geometry, material )
        meshBrain.opacity = 0.9 // == mesh.material.opacity

        meshBrain.position.set(145 *0.5, 145*0.5,  - volume.zLength/4 )
        meshBrain.rotateZ(Math.PI)
        meshBrain.scale.set(0.5, 0.5, 0.5)
        // console.log(mesh.position), console.log(mesh)
        meshBrain.visible = true
        meshBrain.renderOrder = 1
        scene.add( meshBrain )
        
    } );

    // const geom = new THREE.CubeGeometry(5, 5, 5);
    // const mat = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random() } );
    // const cube = new THREE.Mesh( geom, mat );
    // scene.add(cube);

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 2, 3);
    scene.add(light);
    
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    
    return { camera1, camera2, renderer, scene };

}

function initControls() {

    const controls1 = new OrbitControls(o1.camera1, o1.renderer.domElement);
    controls1.addEventListener('change', () => {
    //   o2.camera.position.copy( o1.camera.position );
    //   o2.camera.rotation.copy( o1.camera.rotation );
    	render();
    });
    
    // const controls2 = new OrbitControls(o1.camera2, o1.renderer.domElement);
    // controls1.addEventListener('change', () => {
    // //   o1.camera.position.copy( o2.camera.position );
    // //   o1.camera.rotation.copy( o2.camera.rotation );
    // 	render();
    // });

}

function render() {

    /* renderer.render(scene, camera) */;
		o1.renderer.render( o1.scene, o1.camera1 );
		// o1.renderer.render( o1.scene, o1.camera2 );
		// o2.renderer.render( o2.scene, o2.camera );

}

function onWindowResize() {
    renderer.setSize( window.innerWidth, window.innerHeight );
    const aspect = window.innerWidth / window.innerHeight;
    const frustumHeight = camera.top - camera.bottom;
    camera.left = - frustumHeight * aspect / 2;
    camera.right = frustumHeight * aspect / 2;
    camera.updateProjectionMatrix();
    render();
}