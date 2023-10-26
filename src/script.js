import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { NRRDLoader } from 'three/addons/loaders/NRRDLoader.js';
import { VolumeRenderShader1 } from 'three/addons/shaders/VolumeShader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


let renderer,
scene,
camera,
controls,
material,
volconfig,
cmtextures,
obj;

init();
animate();

function init() {

    // Scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color( 'darkorchid' )
    // Group
    const group = new THREE.Group()
    scene.add(group)
    // Renderer 
    renderer = new THREE.WebGLRenderer()
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize( window.innerWidth, window.innerHeight )
    renderer.localClippingEnabled = true
    renderer.sortObjects = false
    document.body.appendChild( renderer.domElement ) // ? 

    // Camera
    const h = 600 // frustum height
    const aspect = window.innerWidth / window.innerHeight
    camera = new THREE.OrthographicCamera( - h * aspect / 2, h * aspect / 2, h / 2, - h / 2, 1, 500 )
    camera.up.set( 0, 1, 0 ) // In our data, z is up
    camera.position.set(10, 10, 100)

    // Create controls
    controls = new OrbitControls( camera, renderer.domElement )
    controls.addEventListener( 'change', render )
    controls.minZoom = 1
    controls.maxZoom = 4
    controls.enablePan = false // not important
    // controls.autoRotate = true
    controls.autoRotateSpeed = 10
    controls.update()
    // controls.target.set( 0, 0, 50 ) // default 0 0 0 
    
    const gui = new GUI()
    const helper = new THREE.AxesHelper(100)
    helper.visible = false
    scene.add(helper)

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
        group.add( sliceZ.mesh ) 
        group.add( sliceY.mesh ) 
        group.add( sliceX.mesh )

        const planeX = gui.addFolder( 'planeX' ); const visControlX = { visible: true };
        planeX.add( visControlX, 'visible' ).name( 'visible' ).onChange( function () {
            sliceX.mesh.visible = visControlX.visible;
            renderer.render( scene, camera );
        } );
        planeX.add( sliceX, 'index', 0, volume.RASDimensions[ 0 ], 1 ).name( 'Sagittal' ).onChange( function () {
            sliceX.repaint.call( sliceX );
        } );
        const planeY = gui.addFolder( 'planeY' ); const visControlY = { visible: true };
        planeY.add( visControlY, 'visible' ).name( 'visible' ).onChange( function () {
            sliceY.mesh.visible = visControlY.visible;
            renderer.render( scene, camera );
        } );
        planeY.add( sliceY, 'index', 0, volume.RASDimensions[ 1 ], 1 ).name( 'Axial' ).onChange( function () {
            sliceY.repaint.call( sliceY );
        } );
        const planeZ = gui.addFolder( 'planeZ' ); const visControlZ = { visible: true };
        planeZ.add( visControlZ, 'visible' ).name( 'visible' ).onChange( function () {
            sliceZ.mesh.visible = visControlZ.visible;
            renderer.render( scene, camera );
        } );
        planeZ.add( sliceZ, 'index', 0, volume.RASDimensions[ 2 ], 1 ).name( 'Coronal' ).onChange( function () {
            sliceZ.repaint.call( sliceZ );
        } );

        gui.add( volume, 'lowerThreshold', volume.min, volume.max, 1 ).name( 'Lower Threshold' ).onChange( function () {
            volume.repaintAllSlices();
        } );
        gui.add( volume, 'upperThreshold', volume.min, volume.max, 1 ).name( 'Upper Threshold' ).onChange( function () {
            volume.repaintAllSlices();
        } );
        gui.add( volume, 'windowLow', volume.min, volume.max, 1 ).name( 'Window Low' ).onChange( function () {
            volume.repaintAllSlices();
        } );
        gui.add( volume, 'windowHigh', volume.min, volume.max, 1 ).name( 'Window High' ).onChange( function () {
            volume.repaintAllSlices();
        } );

        render();

    } );
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
        // meshBrain.material.depthWrite = false 
        // meshBrain.material.transparent = true

        meshBrain.position.set(145 *0.5, 145*0.5,  - volume.zLength/4 )
        meshBrain.rotateZ(Math.PI)
        meshBrain.scale.set(0.5, 0.5, 0.5)
        // console.log(mesh.position), console.log(mesh)
        meshBrain.visible = true
        meshBrain.renderOrder = 1
        scene.add( meshBrain )
        
        // test 2nd mesh
        const mesh2 = new THREE.Mesh( geometry, material )
        mesh2.position.set(145 , 145*0.5,  - volume.zLength/4 )
        mesh2.scale.set(0.5, 0.5, 0.5)
        // mesh2.renderOrder = 1
        // scene.add( mesh2 )
        
        render();
        animate();

        const model = gui.addFolder( '3Dmodel' )
        const visibilityControl  = { visible: true }
        const visibilityControlb = { visibleb: false }
        const visibilityControlh = { visibleh: false }
        model.add( visibilityControl, 'visible' ).name( 'Model Visible' ).onChange( function () {
            meshBrain.visible = visibilityControl.visible
            renderer.render( scene, camera )
        } );
        model.add( volconfig, 'Color_lim1', 0, 1, 0.01 ).onChange( updateUniforms )
        model.add( volconfig, 'Color_lim2', 0, 1, 0.01 ).onChange( updateUniforms )
        model.add( volconfig, 'colormap', { gray: 'gray', viridis: 'viridis', brain:'test' , green:'mc'} ).onChange( updateUniforms )
        model.add( visibilityControlb, 'visibleb' ).name( 'BBox Visible' ).onChange( function () {
            box.visible = visibilityControlb.visibleb;
            renderer.render( scene, camera );
        } );
        model.add( visibilityControlh, 'visibleh' ).name( 'Axes Visible' ).onChange( function () {
            helper.visible = visibilityControlh.visibleh;
            renderer.render( scene, camera );
        } );

    } );

    // Annotations

    const vertices = new Float32Array( [
        5, 70, 45,      // p1.0  0
        5, -70, 45,     // p1.1  1
        7, 70, 10,      // p2.0  2
        7, -70, 10,     // p2.1  3
        7, 70, -45,     // p3.0  4 
        8, -70, -45,    // p3.1  5        
    ] )
    const indices = [
        0, 1, 2,
        1, 2, 3,
        3, 4, 5,
        3, 4, 2
    ]
    const createAnnots = (vertices, indices) => {
        let geometrys = new THREE.BufferGeometry()
        geometrys.setIndex(indices)
        // itemSize = 3 because there are 3 values (components) per vertex
        geometrys.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
        let materials = new THREE.MeshBasicMaterial( { color: 0xff0000 , side: THREE.DoubleSide })
        return new THREE.Mesh( geometrys, materials )
    }
    // used to create larger annotations on depths of interest
    const createPlane = (width, length) => {
        let planeGeometry = new THREE.PlaneGeometry(width, length)
        let material = new THREE.MeshBasicMaterial({
        //   color: 0xffffff * Math.random(),
          color: 0x966919,
          side: THREE.DoubleSide
        })
        return new THREE.Mesh(planeGeometry, material)
      }

    let planeAnnot = createAnnots(vertices, indices)
    let plane3D = new THREE.Object3D()
    plane3D.add(planeAnnot)
    plane3D.opacity = 0.4
    plane3D.renderOrder = 2
    
    let face1 = createPlane(4, 140); let face2 = createPlane(4, 140); let face3 = createPlane(4, 140)
    face1.position.set(vertices[0], 0, vertices[2])
    face2.position.set(vertices[6], 0, vertices[8])
    face3.position.set(vertices[12], 0, vertices[14])
    // face1.opacity = 0.4
    // face2.opacity = 0.4
    // face3.opacity = 0.4

    plane3D.add(face1, face2, face3)
    scene.add(plane3D)
    const annots = gui.addFolder( 'Annotations' )
    const visibilityControlA = { visible: true }
    annots.add( visibilityControlA, 'visible' ).name( 'Annotations Visible' ).onChange( function () {
        plane3D.visible = visibilityControlA.visible
        renderer.render( scene, camera )
    } );

    window.addEventListener( 'resize', onWindowResize );
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

function render() { renderer.render( scene, camera ); }

function animate() {
    requestAnimationFrame( animate );
    // required if controls.enableDamping or controls.autoRotate are set to true
    controls.update();
    renderer.render( scene, camera );
}

function updateUniforms() {
    material.uniforms[ 'u_clim' ].value.set( volconfig.Color_lim1, volconfig.Color_lim2 );
    material.uniforms[ 'u_renderstyle' ].value = volconfig.renderstyle == 'mip' ? 0 : 1; // 0: MIP, 1: ISO
    material.uniforms[ 'u_renderthreshold' ].value = volconfig.isothreshold; // For ISO renderstyle
    material.uniforms[ 'u_cmdata' ].value = cmtextures[ volconfig.colormap ];
    render();
}