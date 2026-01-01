import * as THREE from 'three'
import Experience from '@experience/Experience.js'
import DebugHelpers from "../Objects/DebugHelpers.js";
import Time from "@experience/Utils/Time.js";
import EventEmitter from '@experience/Utils/EventEmitter.js';
import Debug from '@experience/Utils/Debug.js';

import Camera from './Camera.js'
import Input from "@experience/Utils/Input.js";
import Environment from "./Environment.js";

import BlackHole from "@experience/Worlds/MainWorld/BlackHole.js";

import { color, uniform } from "three/tsl";

export default class MainWorld extends EventEmitter {
    experience = Experience.getInstance()
    time = this.experience.time
    debug = this.experience.debug
    state = this.experience.state
    renderer = this.experience.renderer.instance
    scene = new THREE.Scene()
    camera = new Camera( { world: this } )
    input = new Input( { camera: this.camera.instance } )
    resources = this.experience.resources
    html = this.experience.html
    sound = this.experience.sound

    uniforms = this.state.uniforms.mainScene

    enabled = true

    constructor() {
        super();

        this._setDebug()

        this.init()

        this.scene.add( this.camera.instance )
    }

    init() {
        //this.example = new ExampleClass( { world: this } )
        this.blackHole = new BlackHole( { world: this } )

        this.environment = new Environment( { world: this } )

        this.debugHelpers = new DebugHelpers( { world: this } )
    }

    animationPipeline() {
        this.example?.animationPipeline()
        this.blackHole?.animationPipeline()
    }

    postInit() {
        this.example?.postInit()
        this.blackHole?.postInit()
    }

    resize() {
        this.example?.resize()
        this.blackHole?.resize()

        this.camera?.resize()
    }

    update( deltaTime ) {
        if ( !this.enabled ) return

        this.debugHelpers?.update( deltaTime )
        this.blackHole?.update( deltaTime )

        this.camera?.update()
    }

    postUpdate( deltaTime ) {

    }

    _setDebug() {
        if ( !this.debug.active ) return

        this.debugFolder = this.debug.panel.addFolder( {
            title: 'Main World', expanded: true
        } )

        const postProcessFolder = this.debugFolder.addFolder( {
            title: 'PostProcess',
            expanded: false
        } )

        // Bloom Pass Preload
        postProcessFolder.addBinding( this.state.uniforms.mainScene.bloomPass.strength, 'value', {
            min: 0, max: 5, step: 0.001, label: 'Strength'
        } )

        postProcessFolder.addBinding( this.state.uniforms.mainScene.bloomPass.radius, 'value', {
            min: -2, max: 1, step: 0.001, label: 'Radius'
        } )

        postProcessFolder.addBinding( this.state.uniforms.mainScene.bloomPass.threshold, 'value', {
            min: 0, max: 1, step: 0.001, label: 'Threshold'
        } )



        // this.debugFolder.addBinding( this.uniforms.compositionColor, 'value', {
        //     label: 'Composition Color',
        //     color: { type: 'float' }
        // } ).on( 'change', () => {
        //     this.water.rectLight1.color = this.uniforms.compositionColor.value
        // } )
        //
        // this.debugFolder.addBinding( this.uniforms.emissiveIntensity, 'value', {
        //     label: 'Emission Intensity',
        //     min: 1,
        //     max: 4
        // } )

    }
}
