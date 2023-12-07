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
let planes, planeObjects, planeHelpers;


// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color( 'darkorchid' )
// Renderer 
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio( window.devicePixelRatio )
renderer.setSize( window.innerWidth, window.innerHeight )
renderer.localClippingEnabled = true
renderer.sortObjects = false
document.body.appendChild( renderer.domElement ) // ? 
renderer.shadowMap.enabled = true;


// Camera
const h = 600 // frustum height
const aspect = window.innerWidth / window.innerHeight
const camera = new THREE.OrthographicCamera( - h * aspect / 2, h * aspect / 2, h / 2, - h / 2, 1, 500 )
camera.up.set( 0, 1, 0 ) // In our data, z is up
camera.position.set(10, 10, 100)

// Controls 
controls = new OrbitControls( camera, renderer.domElement )
controls.addEventListener( 'change', render )
controls.minZoom = 1
controls.maxZoom = 4
controls.enablePan = false // not important
// controls.autoRotate = true
controls.autoRotateSpeed = 10
controls.update()
// GUI
const gui = new GUI()

init();
// animate();
render();

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

const params = {

    // animate: true,
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

function init() {
    // Group
    const group = new THREE.Group()
    scene.add(group)

    const helper = new THREE.AxesHelper(100)
    helper.visible = true
    scene.add(helper)

    planes = [
        new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 0 ),
        new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 0 ),
        new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), 0 )
    ];
    planeHelpers = planes.map( p => new THREE.PlaneHelper( p, 2, 0xffffff ) );
    planeHelpers.forEach( ph => {

        ph.visible = false;
        scene.add( ph );

    } );

    new NRRDLoader().load( 'nrrd/converted_4200_T2.nrrd', function ( volume ) {
        volconfig = { Color_lim1: 0, Color_lim2: 2, renderstyle: 'iso', isothreshold: 0.15, colormap: 'gray' }
        // console.log(volume.data)
        const texture = new THREE.Data3DTexture( volume.data, volume.xLength, volume.yLength, volume.zLength )
        texture.format = THREE.RedFormat
        texture.type = THREE.FloatType
        texture.minFilter = texture.magFilter = THREE.LinearFilter
        texture.needsUpdate = true

        // Colormap textures
        cmtextures = { gray: new THREE.TextureLoader().load( 'textures/cm_gray.png', render ) };

        // Material
        const shader = VolumeRenderShader1
        console.log(shader)
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
            side: THREE.BackSide, // The volume shader uses the backface as its "reference point",
            clipping: true,
            clippingPlanes: planes
        } );

        

        // THREE.Mesh
        material.depthTest = false
        const geometry = new THREE.BoxGeometry( volume.xLength, volume.yLength, volume.zLength )
        geometry.translate( volume.xLength / 2 - 0.5 , volume.yLength / 2 - 0.5, volume.zLength /2 - 0.5)

        const meshBrain = new THREE.Mesh( geometry, material )
        // meshBrain.rotateZ(Math.PI)
        meshBrain.scale.set(0.1, 0.1, 0.1)
        console.log(meshBrain.position)
        meshBrain.visible = true
        meshBrain.renderOrder = 1
        scene.add( meshBrain )
    
        const model = gui.addFolder( '3Dmodel' )
        const visibilityControl  = { visible: meshBrain.visible }
        model.add( visibilityControl, 'visible' ).name( 'Model Visible' ).onChange( function () {
            meshBrain.visible = visibilityControl.visible
            renderer.render( scene, camera )
        } );

        // PLANES
        // Set up clip plane rendering
        planeObjects = [];
        const planeGeom = new THREE.PlaneGeometry( 40, 40 );
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
            
            let object = new THREE.Group();
            scene.add( object );
            object.add( stencilGroup );
            console.log(po)
            poGroup.add( po );
            planeObjects.push( po );
            scene.add( poGroup );

        }
        const planeX = gui.addFolder( 'planeX' );
        planeX.add( params.planeX, 'displayHelper' ).onChange( v => planeHelpers[ 0 ].visible = v );
        planeX.add( params.planeX, 'constant' ).min( - 1 ).max( 1 ).onChange( d => planes[ 0 ].constant = d );
        planeX.add( params.planeX, 'negated' ).onChange( () => {

            planes[ 0 ].negate();
            params.planeX.constant = planes[ 0 ].constant;

        } );
        planeX.open();

        // const material = new THREE.MeshStandardMaterial( {

        //     color: 0xFFC107,
        //     metalness: 0.1,
        //     roughness: 0.75,
        //     clippingPlanes: planes,
        //     clipShadows: true,
        //     shadowSide: THREE.DoubleSide,

        // } );

    } );
    window.addEventListener( 'resize', onWindowResize );
}

function render() { renderer.render( scene, camera ); }
function onWindowResize() {
    renderer.setSize( window.innerWidth, window.innerHeight );
    const aspect = window.innerWidth / window.innerHeight;
    const frustumHeight = camera.top - camera.bottom;
    camera.left = - frustumHeight * aspect / 2;
    camera.right = frustumHeight * aspect / 2;
    camera.updateProjectionMatrix();
    render();
}
