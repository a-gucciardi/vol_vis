import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';

import { NRRDLoader } from 'three/addons/loaders/NRRDLoader.js';
import { VolumeRenderShader1 } from 'three/addons/shaders/VolumeShader.js';


let camera, scene, renderer, object, stats;
let planes, planeObjects, planeHelpers;
let clock;
let materialBrain;

const params = {

    helper: true,
    animate: false,
    planeX: {

        constant: 0,
        negated: false,
        displayHelper: false

    },
    planeY: {

        constant: 0,
        negated: false,
        displayHelper: false

    },
    planeZ: {

        constant: 0,
        negated: false,
        displayHelper: false

    }


};

init();
animate();

function createPlaneStencilGroup( geometry, plane, renderOrder ) {

    const group = new THREE.Group();
    const baseMat = new THREE.MeshBasicMaterial();
    baseMat.depthWrite = false;
    baseMat.depthTest = false;
    baseMat.colorWrite = false;
    baseMat.stencilWrite = true;
    baseMat.stencilFunc = THREE.AlwaysStencilFunc;

    // back faces
    const mat0 = baseMat.clone();
    mat0.side = THREE.BackSide;
    mat0.clippingPlanes = [ plane ];
    mat0.stencilFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZPass = THREE.IncrementWrapStencilOp;

    const mesh0 = new THREE.Mesh( geometry, mat0 );
    mesh0.renderOrder = renderOrder;
    group.add( mesh0 );

    // front faces
    const mat1 = baseMat.clone();
    mat1.side = THREE.FrontSide;
    mat1.clippingPlanes = [ plane ];
    mat1.stencilFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZPass = THREE.DecrementWrapStencilOp;

    const mesh1 = new THREE.Mesh( geometry, mat1 );
    mesh1.renderOrder = renderOrder;

    group.add( mesh1 );

    return group;

}

function init() {

    clock = new THREE.Clock();

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 36, window.innerWidth / window.innerHeight, 1, 100 );
    camera.position.set( 2, 2, 2 );

    scene.add( new THREE.AmbientLight( 0xffffff, 1.5 ) );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
    dirLight.position.set( 5, 10, 7.5 );
    dirLight.castShadow = true;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.left = - 2;
    dirLight.shadow.camera.top	= 2;
    dirLight.shadow.camera.bottom = - 2;

    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add( dirLight );

    planes = [
        new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 0 ),
        new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 0 ),
        new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), 0 )
    ];

    planeHelpers = planes.map( p => new THREE.PlaneHelper( p, 2, 0xffffff ) );
    planeHelpers.forEach( ph => {
        ph.visible = params.helper;
        scene.add( ph );
    } );

    const geometry = new THREE.TorusKnotGeometry( 0.4, 0.15, 220, 60 );
    object = new THREE.Group();
    scene.add( object );

    // ===
    let geom;
    let matos;
    new NRRDLoader().load( 'nrrd/converted_4200_T2.nrrd', function ( volume ) {
        // volconfig = { Color_lim1: 0, Color_lim2: 1, renderstyle: 'iso', isothreshold: 0.15, colormap: 'gray' }
        // console.log(volume.data)
        const texture = new THREE.Data3DTexture( volume.data, volume.xLength, volume.yLength, volume.zLength )
        texture.format = THREE.RedFormat
        texture.type = THREE.FloatType
        texture.minFilter = texture.magFilter = THREE.LinearFilter
        texture.needsUpdate = true

        // box helper to see the extend of the volume
        geom = new THREE.BoxGeometry( volume.xLength, volume.yLength, volume.zLength )
        matos = new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
        const cube = new THREE.Mesh( geom, matos )
        const box = new THREE.BoxHelper( cube )
        box.applyMatrix4( volume.matrix )
        scene.add( box )
        box.visible = false

        // Material
        const shader = VolumeRenderShader1
        const uniforms = THREE.UniformsUtils.clone( shader.uniforms )
        uniforms[ 'u_data' ].value = texture
        uniforms[ 'u_size' ].value.set( volume.xLength, volume.yLength, volume.zLength )
        uniforms[ 'u_clim' ].value.set( 0, 1 )
        uniforms[ 'u_renderstyle' ].value = 1 // 0: MIP, 1: ISO
        uniforms[ 'u_renderthreshold' ].value = 0.15 // For ISO renderstyle
        uniforms[ 'u_cmdata' ].value = new THREE.TextureLoader().load( 'textures/cm_viridis.png', renderer.render( scene, camera )),

        // material = new THREE.RawShaderMaterial
        materialBrain = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
            side: THREE.BackSide, // The volume shader uses the backface as its "reference point",
            clipping: true,
            clippingPlanes: planes

        } );

        // THREE.Mesh
        materialBrain.depthTest = false
        const geometry = new THREE.BoxGeometry( volume.xLength, volume.yLength, volume.zLength )
        geometry.translate( volume.xLength / 2 - 0.5 , volume.yLength / 2 - 0.5, volume.zLength /2 - 0.5)

        const meshBrain = new THREE.Mesh( geometry, materialBrain )
        meshBrain.opacity = 0.9 // == mesh.material.opacity
        // meshBrain.material.depthWrite = false 
        // meshBrain.material.transparent = true

        meshBrain.position.set(145 *0.5, 145*0.5,  - volume.zLength/4 )
        meshBrain.position.set( 0,0 ,  0)
        meshBrain.rotateZ(Math.PI)
        meshBrain.scale.set(0.001, 0.001, 0.001)
        // console.log(mesh.position), console.log(mesh)
        meshBrain.visible = true
        // meshBrain.renderOrder = 1
        scene.add( meshBrain )
    });
    // ===

    // Set up clip plane rendering
    planeObjects = [];
    const planeGeom = new THREE.PlaneGeometry( 4, 4 );

    for ( let i = 0; i < 3; i ++ ) {

        const poGroup = new THREE.Group();
        const plane = planes[ i ];
        const stencilGroup = createPlaneStencilGroup( geometry, plane, i + 1 );

        // plane is clipped by the other clipping planes
        const planeMat =
            new THREE.MeshStandardMaterial( {

                color: 0xE91E63,
                metalness: 0.1,
                roughness: 0.75,
                clippingPlanes: planes.filter( p => p !== plane ),

                stencilWrite: true,
                stencilRef: 0,
                stencilFunc: THREE.NotEqualStencilFunc,
                stencilFail: THREE.ReplaceStencilOp,
                stencilZFail: THREE.ReplaceStencilOp,
                stencilZPass: THREE.ReplaceStencilOp,

            } );
        const po = new THREE.Mesh( planeGeom, planeMat );
        po.onAfterRender = function ( renderer ) {

            renderer.clearStencil();

        };

        po.renderOrder = i + 1.1;

        object.add( stencilGroup );
        poGroup.add( po );
        planeObjects.push( po );
        scene.add( poGroup );

    }

    const material = new THREE.MeshStandardMaterial( {

        color: 0x008631,
        metalness: 0.1,
        roughness: 0.75,
        clippingPlanes: planes,
        clipShadows: true,
        shadowSide: THREE.DoubleSide,

    } );

    // add the color
    const clippedColorFront = new THREE.Mesh( geometry, material );
    clippedColorFront.castShadow = true;
    clippedColorFront.renderOrder = 6;
    object.add( clippedColorFront );
    const clippedColorFront2 = new THREE.Mesh( geom, matos );
    clippedColorFront.castShadow = true;
    clippedColorFront.renderOrder = 6;
    object.add( clippedColorFront2 );


    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry( 9, 9, 1, 1 ),
        new THREE.ShadowMaterial( { color: 0x000000, opacity: 0.25, side: THREE.DoubleSide } )
    );

    ground.rotation.x = - Math.PI / 2; // rotates X/Y to X/Z
    ground.position.y = - 1;
    ground.receiveShadow = true;
    scene.add( ground );

    // Stats
    stats = new Stats();
    document.body.appendChild( stats.dom );

    // Renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x263238 );
    window.addEventListener( 'resize', onWindowResize );
    document.body.appendChild( renderer.domElement );

    renderer.localClippingEnabled = true;

    // Controls
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.update();

    // GUI
    const gui = new GUI();
    gui.add( params, 'animate' );

    const planeX = gui.addFolder( 'planeX' );
    planeX.add( params.planeX, 'displayHelper' ).onChange( v => planeHelpers[ 0 ].visible = v );
    planeX.add( params.planeX, 'constant' ).min( - 1 ).max( 1 ).onChange( d => planes[ 0 ].constant = d );
    planeX.add( params.planeX, 'negated' ).onChange( () => {

        planes[ 0 ].negate();
        params.planeX.constant = planes[ 0 ].constant;

    } );
    planeX.open();

    const planeY = gui.addFolder( 'planeY' );
    planeY.add( params.planeY, 'displayHelper' ).onChange( v => planeHelpers[ 1 ].visible = v );
    planeY.add( params.planeY, 'constant' ).min( - 1 ).max( 1 ).onChange( d => planes[ 1 ].constant = d );
    planeY.add( params.planeY, 'negated' ).onChange( () => {

        planes[ 1 ].negate();
        params.planeY.constant = planes[ 1 ].constant;

    } );
    planeY.open();

    const planeZ = gui.addFolder( 'planeZ' );
    planeZ.add( params.planeZ, 'displayHelper' ).onChange( v => planeHelpers[ 2 ].visible = v );
    planeZ.add( params.planeZ, 'constant' ).min( - 1 ).max( 1 ).onChange( d => planes[ 2 ].constant = d );
    planeZ.add( params.planeZ, 'negated' ).onChange( () => {

        planes[ 2 ].negate();
        params.planeZ.constant = planes[ 2 ].constant;

    } );
    planeZ.open();

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

    const delta = clock.getDelta();
    requestAnimationFrame( animate );
    if ( params.animate ) {

        object.rotation.x += delta * 0.5;
        object.rotation.y += delta * 0.2;

    }

    for ( let i = 0; i < planeObjects.length; i ++ ) {

        const plane = planes[ i ];
        const po = planeObjects[ i ];
        plane.coplanarPoint( po.position );
        po.lookAt(
            po.position.x - plane.normal.x,
            po.position.y - plane.normal.y,
            po.position.z - plane.normal.z,
        );

    }

    stats.begin();
    renderer.render( scene, camera );
    stats.end();

}