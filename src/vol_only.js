import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { NRRDLoader } from 'three/addons/loaders/NRRDLoader.js';
import { VolumeRenderShader1 } from 'three/addons/shaders/VolumeShader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let controls,
material,
volconfig,
cmtextures,
obj;

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color( 'darkorchid' )

// Renderer 
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio( window.devicePixelRatio )
renderer.setSize( window.innerWidth, window.innerHeight )
renderer.localClippingEnabled = true
renderer.sortObjects = false
renderer.shadowMap.enabled = true;
document.body.appendChild( renderer.domElement ) // ? 

// Camera
const h = 600 // frustum height
const aspect = window.innerWidth / window.innerHeight
// const camera = new THREE.OrthographicCamera( - h * aspect / 2, h * aspect / 2, h / 2, - h / 2, 0.1, 500 )
// const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 300 );
// camera.up.set( 0, 1, 0 ) // In our data, z is up
// camera.position.set(10, 50, 100)
// console.log(camera.fov)

// Cameras test
let mouseX = 0, mouseY = 0;
let windowWidth, windowHeight;
const views = [
    {
        left: - h * aspect / 2,
        bottom: h * aspect / 2,
        width: h/2,
        height: -h/2,
        background: new THREE.Color().setRGB( 0.5, 0.5, 0.7, THREE.SRGBColorSpace ),
        eye: [ 0, 300, 1800 ],
        up: [ 0, 1, 0 ],
        fov: 30,
        updateCamera: function ( camera, scene, mouseX ) {
          camera.position.x += mouseX * 0.05;
          camera.position.x = Math.max( Math.min( camera.position.x, 2000 ), - 2000 );
          camera.lookAt( scene.position );

        }
    },
    {
        left: - h * aspect / 2,
        bottom: h * aspect / 2,
        width: h/2,
        height: -h/2,
        // background: new THREE.Color().setRGB( 0.5, 0.5, 0.7, THREE.SRGBColorSpace ),
        eye: [ 0, 300, 1800 ],
        up: [ 0, 1, 0 ],
        fov: 30,
        updateCamera: function ( camera, scene, mouseX ) {

          camera.position.x -= mouseX * 0.05;
          camera.position.x = Math.max( Math.min( camera.position.x, 2000 ), - 2000 );
          camera.lookAt( camera.position.clone().setY( 0 ) );

        }
    }
];

// Controls 
// controls = new OrbitControls( camera, renderer.domElement )
// controls.addEventListener( 'change', render )
// controls.minZoom = 1
// controls.maxZoom = 4
// controls.enablePan = false // not important
// // controls.autoRotate = true
// controls.autoRotateSpeed = 10
// controls.update()

// GUI
const gui = new GUI()

init();
render();

function init() {
    // Cameras test
    for ( let ii = 0; ii < views.length; ++ ii ) {

        const view = views[ ii ];
        const camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.fromArray( view.eye );
        camera.up.fromArray( view.up );
        view.camera = camera;

    }


    // Group
    const group = new THREE.Group()
    scene.add(group)

    const helper = new THREE.AxesHelper(100)
    helper.visible = true
    scene.add(helper)

    new NRRDLoader().load( 'nrrd/converted_4200_T2.nrrd', function ( volume ) {
        console.log(volume)

        const texture = new THREE.Data3DTexture( volume.data, volume.xLength, volume.yLength, volume.zLength )
        texture.format = THREE.RedFormat
        texture.type = THREE.FloatType
        texture.minFilter = texture.magFilter = THREE.LinearFilter
        texture.needsUpdate = true

        // Material
        cmtextures = { gray: new THREE.TextureLoader().load( 'textures/cm_gray.png', render ) };
        const shader = VolumeRenderShader1
        const uniforms = THREE.UniformsUtils.clone( shader.uniforms )
        
        uniforms[ 'u_data' ].value = texture
        uniforms[ 'u_size' ].value.set( volume.xLength, volume.yLength, volume.zLength )
        uniforms[ 'u_renderstyle' ].value = 1// 0: MIP, 1: ISO
        uniforms[ 'u_cmdata' ].value = cmtextures[ 'gray' ]
        // uniforms[ 'u_clim' ].value.set(0, 2)
        // uniforms[ 'u_renderthreshold' ].value = 0.15 // For ISO renderstyle

        // material = new THREE.RawShaderMaterial
        material = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
            side: THREE.BackSide,
            clipping: true,
        } );
        // material.depthTest = false


        // Mesh
        const geometry = new THREE.BoxGeometry( volume.xLength, volume.yLength, volume.zLength )
        geometry.translate( volume.xLength / 2 - 0.5 , volume.yLength / 2 - 0.5, volume.zLength /2 - 0.5)

        // box helper to see the extend of the volume
        const matos = new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
        const cube = new THREE.Mesh( geometry, matos )
        cube.scale.set(0.1, 0.1, 0.1)
        const box = new THREE.BoxHelper( cube )
        // box.applyMatrix4( volume.matrix )
        scene.add( box )
        box.visible = true

        const meshBrain = new THREE.Mesh( geometry, material )
        // meshBrain.rotateZ(Math.PI)
        meshBrain.scale.set(0.1, 0.1, 0.1)
        // meshBrain.applyMatrix4(volume.matrix)
        meshBrain.visible = true
        meshBrain.renderOrder = 1
        scene.add( meshBrain )
        
        // GUI 
        const model = gui.addFolder( '3Dmodel' )
        const visibilityControl  = { visible: meshBrain.visible }
        model.add( visibilityControl, 'visible' ).name( 'Model Visible' ).onChange( function () {
            meshBrain.visible = visibilityControl.visible
            renderer.render( scene, camera )
        } );

    } );
    window.addEventListener( 'resize', onWindowResize );
}

// function render() { renderer.render( scene, camera ); }
function render() {

    // updateSize();

    for ( let ii = 0; ii < views.length; ++ ii ) {

        const view = views[ ii ];
        const camera = view.camera;

        view.updateCamera( camera, scene, mouseX, mouseY );

        const left = Math.floor( windowWidth * view.left );
        const bottom = Math.floor( windowHeight * view.bottom );
        const width = Math.floor( windowWidth * view.width );
        const height = Math.floor( windowHeight * view.height );

        renderer.setViewport( left, bottom, width, height );
        renderer.setScissor( left, bottom, width, height );
        renderer.setScissorTest( true );
        renderer.setClearColor( view.background );

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.render( scene, camera );

    }

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
