import { MeshBasicNodeMaterial, } from 'three/webgpu'
import {
    Fn, vec3, vec4, mix, max, texture, varying, positionLocal, modelWorldMatrix, normalize,
    normalGeometry, cameraProjectionMatrix, cameraViewMatrix, float, floor, add, remap, pow
} from 'three/tsl'

import { _hash, terrainHeight } from "@experience/Utils/TSL-utils.js";


const gridMaterial = new MeshBasicNodeMaterial({
    transparent: true,
})

const vWorldPosition = varying( vec3( 0 ) );
const vWorldNormal = varying( vec3( 0 ) );

gridMaterial.vertexNode = Fn( () => {
    const localSpacePosition = vec4( positionLocal, 1.0 ).toVar();
    const worldPosition = vec4( modelWorldMatrix.mul( localSpacePosition ) ).toVar();

    worldPosition.xyz.assign( terrainHeight( worldPosition.xyz ) );

    vWorldPosition.assign( worldPosition.xyz );
    vWorldNormal.assign( normalize( modelWorldMatrix.mul( vec4( normalGeometry, 0.0 ) ).xyz ) );

    return cameraProjectionMatrix.mul( cameraViewMatrix.mul( worldPosition ) );
} )()

gridMaterial.colorNode = Fn( ( builder ) => {
    const gridTextureTSL = texture( builder.material.map );
    const grid1 = float( gridTextureTSL.sample( vWorldPosition.xz.mul( 0.1 ) ).r ).toVar();
    const grid2 = float( gridTextureTSL.sample( vWorldPosition.xz.mul( 1.0 ) ).r ).toVar();

    const gridHash1 = float( _hash( floor( vWorldPosition.xz.mul( 1.0 ) ) ) ).toVar();
    const gridColour = vec3( mix( vec3( add( 0.5, remap( gridHash1, float( -1.0 ), 1.0, float( -0.2 ), 0.2 ) ) ), vec3( 0.0625 ), grid2 ) ).toVar();
    gridColour.assign( mix( gridColour, vec3( 0.00625 ), grid1 ) );
    const colour = vec3( gridColour ).toVar();

    return vec4( pow( colour, vec3( 1.0 / 2.2 ) ), 0.5 )
} )()
export default gridMaterial
