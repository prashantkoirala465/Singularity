import * as THREE from 'three/webgpu'
import Experience from '../Experience.js'
import Sizes from "./Sizes.js"
import State from "../State.js";

import {
    sin, positionLocal, time, vec2, vec3, vec4, uv, uniform, color, fog, rangeFogFactor,
    texture, If, min, range, instanceIndex, step,
    mix, max, uint, varying, varyingProperty, Fn, struct, output, emissive, diffuseColor, PI, PI2,
    oneMinus, cos, atan, float, pass, mrt, assign, normalize, mul, log2, length, pow, smoothstep,
    screenUV, distance, instancedArray, instancedBufferAttribute, attribute, attributeArray, pointUV,
    select, equals, deltaTime, oscSine, hash, materialColor, mx_fractal_noise_vec4, mx_noise_vec4, abs,
    modelViewMatrix, clamp, fwidth, convertToTexture, viewportLinearDepth, viewportDepthTexture, vertexIndex,
    instance
} from 'three/tsl'

export default class FBO {
    experience = Experience.getInstance()
    renderer = this.experience.renderer
    state = this.experience.state
    floatType = this.state.floatType

    _scene;
    _camera;
    clearMaterial;

    uniforms = {
        u_color: uniform( vec4() )
    }

    constructor() {
        this.experience = Experience.getInstance()
        this.sizes = this.experience.sizes
        this.renderer = this.experience.renderer.instance
        this.debug = this.experience.debug

        this._scene = new THREE.Scene
        this._camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1 )
        this._camera.position.z = 1

        this.triGeom = new THREE.BufferGeometry
        this.triGeom.setAttribute( "position", new THREE.BufferAttribute( new Float32Array( [ -1, -1, 0, 4, -1, 0, -1, 4, 0 ] ), 3 ) )
        this.quadGeom = new THREE.PlaneGeometry( 2, 2 )
        this._tri = new THREE.Mesh( this.triGeom )
        this._tri.frustumCulled = false
        this._scene.add( this._tri )

        this.clearMaterial = new THREE.MeshBasicNodeMaterial( {
            vertexNode: vec4( attribute( 'position' ).xy, 0.0, 1.0 ),
            colorNode: this.uniforms.u_color,
            depthTest: false,
            depthWrite: false,
            blending: THREE.NoBlending
        } )
    }

    async clearColor( r, g, b, a, renderTarget ) {
        if ( this.clearMaterial ) {
            this.uniforms.u_color.value.set( r, g, b, a )
            await this.render( this.clearMaterial, renderTarget )
        }
    }

    async render( material, renderTarget ) {
        if ( this._tri && this.renderer && this._scene && this._camera ) {
            this._tri.material = material;

            this.renderer.setRenderTarget( renderTarget || null );

            await this.renderer.renderAsync( this._scene, this._camera );
            this.renderer.setRenderTarget( null );
        }
    }

    async renderMesh( mesh, renderTarget, camera = this._camera ) {
        if( this._tri && this.renderer && this._scene && camera ) {
            this._tri.visible = false;
            this._scene.add( mesh );

            this.renderer.setRenderTarget( renderTarget || null );
            await this.renderer.renderAsync( this._scene, camera );
            this.renderer.setRenderTarget( null );

            this._scene.remove( mesh );
            this._tri.visible = true;
        }
    }

    getColorState() {
        if( !this.renderer ) return {
            autoClear: true,
            autoClearColor: true,
            autoClearStencil: true,
            autoClearDepth: true,
            clearColor: 0,
            clearAlpha: 1
        };

        const color = new THREE.Color;
        this.renderer.getClearColor( color )

        return {
            autoClear: this.renderer.autoClear,
            autoClearColor: this.renderer.autoClearColor,
            autoClearStencil: this.renderer.autoClearStencil,
            autoClearDepth: this.renderer.autoClearDepth,
            clearColor: color.getHex(),
            clearAlpha: this.renderer.getClearAlpha()
        }
    }

    setColorState( colorState ) {
        if( this.renderer ) {
            this.renderer.setClearColor( colorState.clearColor, colorState.clearAlpha )
            this.renderer.autoClear = colorState.autoClear
            this.renderer.autoClearColor = colorState.autoClearColor
            this.renderer.autoClearStencil = colorState.autoClearStencil
            this.renderer.autoClearDepth = colorState.autoClearDepth
        }
    }

    createRenderTarget( width, height, nearestFilter = false, floatType = false, samples = 0 ) {
        return new THREE.RenderTarget( width, height, {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            magFilter: nearestFilter ? THREE.NearestFilter : THREE.LinearFilter,
            minFilter: nearestFilter ? THREE.NearestFilter : THREE.LinearFilter,
            type: floatType ? this.floatType : THREE.UnsignedByteType,
            colorSpace: THREE.SRGBColorSpace,
            depthBuffer: true,
            stencilBuffer: false,
            samples: this.sizes.pixelRatio <= 2 ? samples : 0
        } )
    }


    setInstance() {

    }

    setDebug() {

    }
}
