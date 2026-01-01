import * as THREE from 'three/webgpu'
import Experience from '@experience/Experience.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ViewHelper } from 'three/examples/jsm/helpers/ViewHelper.js'
import Gizmo from '@experience/Utils/Gizmo.js'
import gridMaterial from '@experience/Materials/GridMaterialTexture.js'
import {
    add,
    cameraProjectionMatrix, cameraViewMatrix, float, floor,
    Fn, mix,
    modelWorldMatrix,
    normalGeometry,
    normalize,
    positionLocal, pow, remap, texture,
    varying,
    vec3,
    vec4
} from "three/tsl";
import { _hash, terrainHeight } from "@experience/Utils/TSL-utils.js";

export default class DebugHelpers {
    experience = new Experience()
    debug = experience.debug
    time = experience.time
    renderer = experience.renderer.instance
    resources = experience.resources
    cursor = experience.cursor
    timeline = experience.timeline;
    controls = experience.camera?.controls
    container = new THREE.Group();

    constructor( parameters = {} ) {
        if ( !this.debug.active ) return

        this.world = parameters.world
        this.scene = this.world.scene
        this.camera = this.world.camera.instance

        this.setupDebugFeatures()
    }

    setupDebugFeatures() {
        this.addViewHelper()
        //this.addGlobalAxes()
        //this.addGrid()
    }

    addGlobalAxes() {
        const axesHelper = new THREE.AxesHelper( 5 );
        this.scene.add( axesHelper );
    }

    addViewHelper() {
        this.gizmo = new Gizmo(this.camera, { size: 100, padding: 8 });
        document.body.appendChild(this.gizmo);
        this.gizmo.onAxisSelected = function(axis) {
            console.log(axis); // { axis: "x", direction: THREE.Vector3(1,0,0) }
        }
    }

    addGrid() {
        /**
         * Grid
         */
        // const grid = new THREE.Mesh(
        //     new THREE.PlaneGeometry(100, 100),
        //     gridMaterial
        // )
        // grid.rotation.x = - Math.PI * 0.5
        // grid.position.y = 0
        // this.scene.add(grid)


        const gridTexture = this.resources.items.gridTexture
        gridTexture.wrapS = THREE.RepeatWrapping;
        gridTexture.wrapT = THREE.RepeatWrapping;
        gridTexture.generateMipmaps = true
        gridTexture.minFilter = THREE.LinearMipMapLinearFilter;
        gridTexture.magFilter = THREE.LinearFilter;

        gridMaterial.map = gridTexture

        const grid = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200),
            gridMaterial
        )

        grid.rotateX( -Math.PI / 2 );
        this.scene.add(grid)
    }

    resize() {

    }

    update( deltaTime ) {
        this.gizmo?.update();
    }

}
