import * as THREE from 'three';
import { NRRDLoader } from 'three/addons/loaders/NRRDLoader.js';
import { VolumeRenderShader1 } from 'three/addons/shaders/VolumeShader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


import Stats from 'three/addons/libs/stats.module.js';

let stats;

let scene, renderer;

let mouseX = 0, mouseY = 0;

let windowWidth, windowHeight;

let materialb;

const views = [
    {
        left: 0,
        bottom: 0,
        width: 0.5,
        height: 1.0,
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
        left: 0.5,
        bottom: 0,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color().setRGB( 0.7, 0.5, 0.5, THREE.SRGBColorSpace ),
        eye: [ 0, 1800, 0 ],
        up: [ 0, 0, 1 ],
        fov: 45,
        updateCamera: function ( camera, scene, mouseX ) {

            camera.position.x -= mouseX * 0.05;
            camera.position.x = Math.max( Math.min( camera.position.x, 2000 ), - 2000 );
            camera.lookAt( camera.position.clone().setY( 0 ) );

        }
    },
    {
        left: 0.5,
        bottom: 0.5,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color().setRGB( 0.5, 0.7, 0.7, THREE.SRGBColorSpace ),
        eye: [ 1400, 800, 1400 ],
        up: [ 0, 1, 0 ],
        fov: 60,
        updateCamera: function ( camera, scene, mouseX ) {

            camera.position.y -= mouseX * 0.05;
            camera.position.y = Math.max( Math.min( camera.position.y, 1600 ), - 1600 );
            camera.lookAt( scene.position );

        }
    }
];

const gui = new GUI()

init();
animate();

function init() {

    const container = document.getElementById( 'container' );

    for ( let ii = 0; ii < views.length; ++ ii ) {

        const view = views[ ii ];
        const camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 10000 );
        const h = 600 // frustum height
        const aspect = window.innerWidth / window.innerHeight
        // const camera = new THREE.OrthographicCamera( - h * aspect / 2, h * aspect / 2, h / 2, - h / 2, 1, 500 )
        camera.up.set( 0, 1, 0 ) // In our data, z is up
    
        camera.position.fromArray( view.eye );
        camera.up.fromArray( view.up );
        camera.zoom = 3;
        view.camera = camera;

    }

    scene = new THREE.Scene();

    // const light = new THREE.DirectionalLight( 0xffffff, 3 );
    // light.position.set( 0, 0, 1 );
    // scene.add( light );

    new NRRDLoader().load( 'nrrd/converted_4200_T2.nrrd', function ( volume ) {
        console.log(volume)

        let texture = new THREE.Data3DTexture( volume.data, volume.xLength, volume.yLength, volume.zLength )
        texture.format = THREE.RedFormat
        texture.type = THREE.FloatType
        texture.minFilter = texture.magFilter = THREE.LinearFilter
        texture.needsUpdate = true

        // Material
        let cmtextures = { gray: new THREE.TextureLoader().load( 'textures/cm_gray.png', render ) };
        let shader = VolumeRenderShader1
        let uniforms = THREE.UniformsUtils.clone( shader.uniforms )
        
        uniforms[ 'u_data' ].value = texture
        uniforms[ 'u_size' ].value.set( volume.xLength, volume.yLength, volume.zLength )
        uniforms[ 'u_renderstyle' ].value = 1// 0: MIP, 1: ISO
        uniforms[ 'u_cmdata' ].value = cmtextures[ 'gray' ]
        // uniforms[ 'u_clim' ].value.set(0, 2)
        // uniforms[ 'u_renderthreshold' ].value = 0.15 // For ISO renderstyle

        // material = new THREE.RawShaderMaterial
        materialb = new THREE.ShaderMaterial( {
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
        cube.scale.set(0.5, 0.5, 0.5)
        const box = new THREE.BoxHelper( cube )
        // box.applyMatrix4( volume.matrix )
        scene.add( box )
        box.visible = true

        const meshBrain = new THREE.Mesh( geometry, materialb )
        // meshBrain.rotateZ(Math.PI)
        meshBrain.scale.set(0.5, 0.5, 0.5)
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

    const radius = 200;

    const geometry1 = new THREE.IcosahedronGeometry( radius, 1 );

    const count = geometry1.attributes.position.count;
    geometry1.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( count * 3 ), 3 ) );

    const geometry2 = geometry1.clone();
    const geometry3 = geometry1.clone();

    const color = new THREE.Color();
    const positions1 = geometry1.attributes.position;
    const positions2 = geometry2.attributes.position;
    const positions3 = geometry3.attributes.position;
    const colors1 = geometry1.attributes.color;
    const colors2 = geometry2.attributes.color;
    const colors3 = geometry3.attributes.color;

    for ( let i = 0; i < count; i ++ ) {

        color.setHSL( ( positions1.getY( i ) / radius + 1 ) / 2, 1.0, 0.5, THREE.SRGBColorSpace );
        colors1.setXYZ( i, color.r, color.g, color.b );

        color.setHSL( 0, ( positions2.getY( i ) / radius + 1 ) / 2, 0.5, THREE.SRGBColorSpace );
        colors2.setXYZ( i, color.r, color.g, color.b );

        color.setRGB( 1, 0.8 - ( positions3.getY( i ) / radius + 1 ) / 2, 0, THREE.SRGBColorSpace );
        colors3.setXYZ( i, color.r, color.g, color.b );

    }

    const material = new THREE.MeshPhongMaterial( {
        color: 0xffffff,
        flatShading: true,
        vertexColors: true,
        shininess: 0
    } );

    const wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, transparent: true } );

    let mesh = new THREE.Mesh( geometry1, material );
    let wireframe = new THREE.Mesh( geometry1, wireframeMaterial );
    mesh.add( wireframe );
    mesh.position.x = - 400;
    mesh.rotation.x = - 1.87;
    // scene.add( mesh );

    mesh = new THREE.Mesh( geometry2, material );
    wireframe = new THREE.Mesh( geometry2, wireframeMaterial );
    mesh.add( wireframe );
    mesh.position.x = 400;
    // scene.add( mesh );

        mesh = new THREE.Mesh( geometry3, material );
    wireframe = new THREE.Mesh( geometry3, wireframeMaterial );
    mesh.add( wireframe );
    // scene.add( mesh );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    stats = new Stats();
    container.appendChild( stats.dom );

    // document.addEventListener( 'mousemove', onDocumentMouseMove );

}

function onDocumentMouseMove( event ) {

    mouseX = ( event.clientX - windowWidth / 2 );
    mouseY = ( event.clientY - windowHeight / 2 );

}

function updateSize() {

    if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {

        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        renderer.setSize( windowWidth, windowHeight );

    }

}

function animate() {

    render();
    stats.update();

    requestAnimationFrame( animate );

}

function render() {

    updateSize();

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