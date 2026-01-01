import * as THREE from 'three/webgpu'
import * as Helpers from '@experience/Utils/Helpers.js'
import Model from '@experience/Worlds/Abstracts/Model.js'
import Experience from '@experience/Experience.js'
import Debug from '@experience/Utils/Debug.js'
import State from "@experience/State.js";

import {
    sin, positionLocal, positionWorld, time, vec2, vec3, vec4, uv, uniform, color, fog, rangeFogFactor,
    texture, If, min, range, instanceIndex, step,
    mix, max, uint, varying, Fn, struct, output, emissive, diffuseColor, PI, PI2,
    oneMinus, cos, atan, float, pass, mrt, viewportDepthTexture, screenUV, linearDepth, depth, viewportLinearDepth,
    lightProjectionUV, lights, materialColor, directPointLight, normalize, dot, storage, instancedArray,
    atomicAdd, atomicStore, instancedBufferAttribute, shapeCircle, assign, Discard, deltaTime
} from 'three/tsl'
import { PhysicalLightingModel } from "three/webgpu";

import { TiledLighting } from 'three/addons/lighting/TiledLighting.js';
import { simplexNoise4d } from "@experience/TSL/simplexNoise4d.js";


class CustomLightingModel extends THREE.PhysicalLightingModel {

    direct( { lightDirection, lightColor, reflectedLight }, builder ) {

        super.direct( { lightDirection, lightColor, reflectedLight }, builder );

        reflectedLight.directDiffuse.mulAssign( vec3( 2, 0, 0 ) );
        //
        //reflectedLight.directSpecular.mulAssign( vec3(1,0,0) );
    }

}


export default class SandboxLight extends Model {
    experience = Experience.getInstance()
    debug = this.experience.debug
    state = this.experience.state
    input = experience.input
    time = experience.time
    renderer = experience.renderer.instance
    resources = experience.resources
    container = new THREE.Group();

    uniforms = {
        lightPosition: uniform( vec3( 0 ) ),
        lightAngle: uniform( float( 0 ) ),
        lightTargetPosition: uniform( vec3( 0 ) ),
    }

    constructor( parameters = {} ) {
        super()

        this.world = parameters.world
        this.camera = this.world.camera.instance
        this.scene = this.world.scene
        this.transformControls = this.world.camera.transformControls

        this.init()
        this._setDebug()
    }

    init() {
        this.setModel()
    }

    postInit() {

    }

    setModel() {
        const displacementTexture = this.resources.items.displacementTexture

        // Add spot light
        const spotLight = this.spotLight = new THREE.SpotLight( 0xffffff, 200 )
        spotLight.position.set( 0, 10, 0 )
        spotLight.angle = Math.PI / 6
        spotLight.penumbra = 1
        spotLight.decay = 2
        spotLight.distance = 0

        this._updateUniforms()

        this.scene.add( spotLight )

        const lightHelper = new THREE.SpotLightHelper( spotLight );
        this.scene.add( lightHelper );

        this.transformControls.attach( spotLight )


        // Create floor
        const floorGeometry = new THREE.PlaneGeometry( 60, 60, 256, 256 )
        floorGeometry.rotateX( -Math.PI / 2 )
        const floorMaterial = new THREE.MeshStandardNodeMaterial( {
            color: 0xbcbcbc,
            wireframe: false,
            transparent: true,
            side: THREE.DoubleSide,
            map: displacementTexture
        } );


        const spotLightIntensity = varying( 0 )

        floorMaterial.positionNode = Fn( () => {
            // Calculate the position of the vertex in world space
            const vertexPosition = positionLocal.toVar()
            const lightPosition = this.uniforms.lightPosition.toVar()
            const lightDirection = normalize( this.uniforms.lightTargetPosition.sub( lightPosition ) );
            const vertexToLight = normalize( vertexPosition.sub( lightPosition ) );
            const dotProduct = dot( lightDirection, vertexToLight );

            // Check if the vertex is lit by the light
            const angleLimit = float( cos( this.uniforms.lightAngle ) );
            const isLit = dotProduct.greaterThan( angleLimit );

            // If the vertex is lit, move it up
            //assign(outputBuffer, vertexPosition, isLit);
            spotLightIntensity.assign( isLit )
            //spotLightIntensity.assign( dotProduct )

            // const positionFinal = positionLocal.toVar()
            // positionFinal.y.addAssign( isLit )

            return positionLocal
        } )()

        floorMaterial.colorNode = Fn( () => {
            const alpha = spotLightIntensity.oneMinus()

            If( alpha.lessThan( 0.1 ), () => {
                Discard()
            } )

            const color = texture( displacementTexture, uv() ).toVar()
            //color.a.assign(spotLightIntensity.oneMinus().smoothstep(0.4, 0.6))
            color.a.assign( spotLightIntensity.oneMinus() )
            //return vec4( 1, 0, 0, spotLightIntensity.oneMinus() )
            return color
        } )()


        const allLights = lights( [ spotLight ] )


        const lightingModel = new CustomLightingModel();

        const lightingModelContext = allLights.context( { lightingModel } );

        //floorMaterial.lightsNode = lightingModelContext


        const floor = new THREE.Mesh( floorGeometry, floorMaterial )
        //floor.rotation.x = -Math.PI / 2
        this.scene.add( floor )

        // add sphere
        const sphereGeometry = new THREE.SphereGeometry( 3, 32, 32 );
        sphereGeometry.translate( -10, 3, 5 )

        const sphereMesh = new THREE.Mesh( sphereGeometry, new THREE.MeshStandardNodeMaterial( {
            positionNode: floorMaterial.positionNode,
            colorNode: floorMaterial.colorNode
        } ) )


        this.container.add( sphereMesh )


        const allPositions = new Float32Array( floorGeometry.attributes.position.array.length + sphereGeometry.attributes.position.array.length )

        allPositions.set( floorGeometry.attributes.position.array, 0 )
        allPositions.set( sphereGeometry.attributes.position.array, floorGeometry.attributes.position.array.length )

        const positionInitBuffer = instancedArray( allPositions, 'vec3' );
        const positionBuffer = instancedArray( allPositions, 'vec3' );

        this.computePositions = Fn( () => {
            const posInit = positionInitBuffer.element( instanceIndex )
            const pos = positionBuffer.element( instanceIndex )


            // Calculate the position of the vertex in world space
            const vertexPosition = posInit.toVar()
            const lightPosition = this.uniforms.lightPosition.toVar()
            const lightDirection = normalize( this.uniforms.lightTargetPosition.sub( lightPosition ) );
            const vertexToLight = normalize( vertexPosition.sub( lightPosition ) );
            const dotProduct = dot( lightDirection, vertexToLight );

            // Check if the vertex is lit by the light
            const angleLimit = float( cos( this.uniforms.lightAngle ) );
            const isLit = dotProduct.greaterThan( angleLimit );

            If( dotProduct.lessThan( angleLimit ), () => {
                pos.assign( vec3( 99999999 ) )
            } ).Else( () => {
                const uFlowFieldFrequency = 0.1

                // Flow field
                const flowField = vec3(
                    simplexNoise4d( vec4( posInit.mul( uFlowFieldFrequency ).add( 0 ), time ) ),
                    simplexNoise4d( vec4( posInit.mul( uFlowFieldFrequency ).add( 1.0 ), time ) ),
                    simplexNoise4d( vec4( posInit.mul( uFlowFieldFrequency ).add( 2.0 ), time ) )
                ).normalize()

                pos.assign( posInit.add( simplexNoise4d( vec4( posInit.mul( uFlowFieldFrequency ).add( 1.0 ), time ) ) ) )

                pos.addAssign( flowField.mul( deltaTime ).mul( 0.1 ) /* * strength */ )


                //pos.assign( posInit.add(sin(posInit.xz.mul(time))) )
            } )


        } )().compute( floorGeometry.attributes.position.count + sphereGeometry.attributes.position.count )


        // create Points
        const material = new THREE.PointsNodeMaterial( {
            color: 0x00ff00,
            sizeAttenuation: false,
            positionNode: positionBuffer.element( instanceIndex ),
            sizeNode: float( 4 ),
            opacityNode: shapeCircle(),
            //alphaToCoverage: true,
            depthWrite: false,
            transparent: true,
        } )

        const points = new THREE.Sprite( material );
        points.count = floorGeometry.attributes.position.count + sphereGeometry.attributes.position.count;

        this.container.add( points );


        this.scene.add( this.container )
    }

    _updateUniforms() {
        this.uniforms.lightPosition.value.copy( this.spotLight.position )
        this.uniforms.lightAngle.value = this.spotLight.angle
        this.uniforms.lightTargetPosition.value.copy( this.spotLight.target.position )
    }

    animationPipeline() {

    }

    resize() {

    }

    _setDebug() {
        if ( !this.debug.active ) return


        // const test = uniform(0)
        //
        // const exampleFolder = this.world.debugFolder.addFolder( {
        //     title: 'depth',
        //     expanded: true
        // } )
        //
        // exampleFolder.addBinding( test, 'value', {
        //     label: 'TEST',
        // } )


        //this.debug.createDebugNode( viewportDepthTexture( uv().flipY() ).step(test), this.world )
        //this.debug.createDebugNode( viewportLinearDepth, this.world )
        //this.debug.createDebugNode( uv().step(0.1), this.world )

        // const exampleFolder = this.world.debugFolder.addFolder( {
        //     title: 'Smoke',
        //     expanded: false
        // } )
        //
        // exampleFolder.addBinding( this.uniforms.exampleColor, 'value', {
        //     label: 'Smoke Color',
        //     color: { type: 'float' }
        // } )
        //
        // exampleFolder.addBinding( this.uniforms.size, 'value', {
        //     label: 'Size',
        //     min: 0,
        //     max: 10,
        //     step: 0.01
        // } )
    }

    async update( deltaTime ) {
        this._updateUniforms()

        await this.renderer.computeAsync( this.computePositions )
    }
}
