import {
    float, vec2, vec3, cos, sin, Fn, normalize, max, color, vec4,
    length, smoothstep, Loop, int, uvec2, uint, mat3, sub, mul, fract, dot, mix,
    floor, bitcast, pow, saturate, add, reflect, min, If, uv, dFdx, dFdy, bool,
    select, clamp, abs, step, mat2, overloadingFn, Break, property, mod, mx_rgbtohsv, mx_hsvtorgb
} from 'three/tsl';

bitcast.setParameterLength( 1 );

const Rot = /*@__PURE__*/ Fn( ( [ a ] ) => {

    const s = sin( a );
    const c = cos( a );

    return mat2( c, s.negate(), s, c );

}, { a: 'float', return: 'mat2' } );

// Using for Gras
// const rotateY = /*#__PURE__*/ Fn( ( [ theta_immutable ] ) => {
//
//     const theta = float( theta_immutable ).toVar();
//     const c = float( cos( theta ) ).toVar();
//     const s = float( sin( theta ) ).toVar();
//
//     return mat3( vec3( c, int( 0 ), s ), vec3( int( 0 ), int( 1 ), int( 0 ) ), vec3( s.negate(), int( 0 ), c ) );
//
// } ).setLayout( {
//     name: 'rotateY',
//     type: 'mat3',
//     inputs: [
//         { name: 'theta', type: 'float' }
//     ]
// } );

const rotateX = /*#__PURE__*/ Fn( ( [ v_immutable, angle_immutable ] ) => {

    const v = vec3( v_immutable ).toVar();
    const a = float( angle_immutable ).toVar();
    const c = cos( a ).toVar();
    const s = sin( a ).toVar();

    // ( x', y', z' ) = ( x, y*c - z*s, y*s + z*c )
    return vec3(
        v.x,
        v.y.mul( c ).sub( v.z.mul( s ) ),
        v.y.mul( s ).add( v.z.mul( c ) )
    );

} ).setLayout( {
    name: 'rotateX_fast',
    type: 'vec3',
    inputs: [
        { name: 'v', type: 'vec3' },
        { name: 'angle', type: 'float' }
    ]
} );

const rotateY = /*#__PURE__*/ Fn( ( [ v_immutable, angle_immutable ] ) => {

    const v = vec3( v_immutable ).toVar();
    const a = float( angle_immutable ).toVar();
    const c = cos( a ).toVar();
    const s = sin( a ).toVar();

    // ( x', y', z' ) = ( x*c + z*s, y, -x*s + z*c )
    return vec3(
        v.x.mul( c ).add( v.z.mul( s ) ),
        v.y,
        v.x.mul( s ).negate().add( v.z.mul( c ) )
    );

} ).setLayout( {
    name: 'rotateY_fast',
    type: 'vec3',
    inputs: [
        { name: 'v', type: 'vec3' },
        { name: 'angle', type: 'float' }
    ]
} );

const rotateZ = /*#__PURE__*/ Fn( ( [ v_immutable, angle_immutable ] ) => {

    const angle = float( angle_immutable ).toVar();
    const v = vec3( v_immutable ).toVar();
    const cosAngle = float( cos( angle ) ).toVar();
    const sinAngle = float( sin( angle ) ).toVar();

    return vec3( v.x.mul( cosAngle ).sub( v.y.mul( sinAngle ) ), v.x.mul( sinAngle ).add( v.y.mul( cosAngle ) ), v.z );

} ).setLayout( {
    name: 'rotateZ',
    type: 'vec3',
    inputs: [
        { name: 'v', type: 'vec3' },
        { name: 'angle', type: 'float' }
    ]
} );


const facture = Fn( ( [ vector_immutable ] ) => {

    const vector = vec3( vector_immutable ).toVar();
    const normalizedVector = vec3( normalize( vector ) ).toVar();

    return max( max( normalizedVector.x, normalizedVector.y ), normalizedVector.z );

} ).setLayout( {
    name: 'facture',
    type: 'float',
    inputs: [
        { name: 'vector', type: 'vec3' }
    ]
} );

const emission = Fn( ( [ color_immutable, strength_immutable ] ) => {

    const strength = float( strength_immutable ).toVar();
    const color = vec3( color_immutable ).toVar();

    return color.mul( strength );

} ).setLayout( {
    name: 'emission',
    type: 'vec3',
    inputs: [
        { name: 'color', type: 'vec3' },
        { name: 'strength', type: 'float' }
    ]
} );


const directionalBlur = /*#__PURE__*/ Fn( ( [ uv_immutable, direction_immutable, radius_immutable ] ) => {

    const radius = float( radius_immutable ).toVar();
    const direction = vec2( direction_immutable ).toVar();
    const uv = vec2( uv_immutable ).toVar();
    const sum = float( 0.0 ).toVar();
    const total = float( 0.0 ).toVar();

    Loop( { start: int( radius.negate() ), end: int( radius ), type: 'int', condition: '<=' }, ( { i } ) => {
        const offset = vec2( uv.add( direction.mul( i ).div( radius ) ) ).toVar();
        const dist = float( length( offset.sub( vec2( 0.5, 0.5 ) ) ) ).toVar();
        const circle = float( smoothstep( 0.4, 0.5, dist ) ).toVar();
        sum.addAssign( circle );
        total.addAssign( 1.0 );
    } );

    return sum.div( total );

} ).setLayout( {
    name: 'directionalBlur',
    type: 'float',
    inputs: [
        { name: 'uv', type: 'vec2' },
        { name: 'direction', type: 'vec2' },
        { name: 'radius', type: 'float' }
    ]
} );

const scaleWithCenter = /*#__PURE__*/ Fn( ( [ uv_immutable, scale_immutable, center_immutable ] ) => {

    const center = vec2( center_immutable ).toVar();
    const scale = vec2( scale_immutable ).toVar();
    const uv = vec2( uv_immutable ).toVar();

    return center.add( uv.sub( center ).mul( scale ) );

} ).setLayout( {
    name: 'scaleWithCenter',
    type: 'vec2',
    inputs: [
        { name: 'uv', type: 'vec2' },
        { name: 'scale', type: 'vec2' },
        { name: 'center', type: 'vec2' }
    ]
} );

const murmurHash21 = /*#__PURE__*/ Fn( ( [ src_immutable ] ) => {

    const src = uint( src_immutable ).toVar();
    const M = uint( int( 0x5bd1e995 ) );
    const h = uvec2( uint( 1190494759 ), uint( 2147483647 ) ).toVar();
    src.mulAssign( M );
    src.bitXorAssign( src.shiftRight( uint( 24 ) ) );
    src.mulAssign( M );
    h.mulAssign( M );
    h.bitXorAssign( src );
    h.bitXorAssign( h.shiftRight( uvec2( uint( 13 ), uint( 13 ) ) ) );
    h.mulAssign( M );
    h.bitXorAssign( h.shiftRight( uvec2( uint( 15 ), uint( 13 ) ) ) );

    return h;

} ).setLayout( {
    name: 'murmurHash21',
    type: 'uvec2',
    inputs: [
        { name: 'src', type: 'uint' }
    ]
} );


// 2 outputs, 1 input
const hash21 = /*#__PURE__*/ Fn( ( [ src_immutable ] ) => {

    const src = float( src_immutable ).toVar();
    const h = uvec2( murmurHash21( bitcast( src ) ) ).toVar();

    const x = bitcast( h.x.bitAnd( int( 0x007fffff ) ).bitOr( int( 0x3f800000 ) ) );
    const y = bitcast( h.y.bitAnd( int( 0x007fffff ) ).bitOr( int( 0x3f800000 ) ) );

    return vec2( x, y ).sub( 1.0 );
    //return float( h.bitAnd( int( 0x007fffff ) ).bitOr( int( 0x3f800000 ) ) ).sub( 1.0 );

} ).setLayout( {
    name: 'hash21',
    type: 'vec2',
    inputs: [
        { name: 'src', type: 'float' }
    ]
} );

// const hash21 = /*#__PURE__*/ Fn( ( [ p_immutable ] ) => {
//
//     const p = float( p_immutable ).toVar();
//     const p3 = vec3( fract( vec3( p ).mul( vec3( .1031, .1030, .0973 ) ) ) ).toVar();
//     p3.addAssign( dot( p3, p3.yzx.add( 33.33 ) ) );
//
//     return fract( p3.xx.add( p3.yz ).mul( p3.zy ) );
//
// } ).setLayout( {
//     name: 'hash21',
//     type: 'vec2',
//     inputs: [
//         { name: 'p', type: 'float' }
//     ]
// } );


const _hash = /*#__PURE__*/ Fn( ( [ p_immutable ] ) => {

    const p = vec3( p_immutable ).toVar();
    p.assign( vec3( dot( p, vec3( 127.1, 311.7, 74.7 ) ), dot( p, vec3( 269.5, 183.3, 246.1 ) ), dot( p, vec3( 113.5, 271.9, 124.6 ) ) ) );

    return float( -1.0 ).add( mul( 2.0, fract( sin( p ).mul( 43758.5453123 ) ) ) );

} ).setLayout( {
    name: 'hash',
    type: 'vec3',
    inputs: [
        { name: 'p', type: 'vec3' }
    ]
} );

const easeOut = /*#__PURE__*/ Fn( ( [ x_immutable, t_immutable ] ) => {

    const t = float( t_immutable ).toVar();
    const x = float( x_immutable ).toVar();

    return sub( 1.0, pow( sub( 1.0, x ), t ) );

} ).setLayout( {
    name: 'easeOut',
    type: 'float',
    inputs: [
        { name: 'x', type: 'float' },
        { name: 't', type: 'float' }
    ]
} );

const rotateAxis = /*#__PURE__*/ Fn( ( [ axis_immutable, angle_immutable ] ) => {

    const angle = float( angle_immutable ).toVar();
    const axis = vec3( axis_immutable ).toVar();
    const s = float( sin( angle ) ).toVar();
    const c = float( cos( angle ) ).toVar();
    const oc = float( sub( 1.0, c ) ).toVar();

    return mat3(
        oc.mul( axis.x ).mul( axis.x ).add( c ),
        oc.mul( axis.x ).mul( axis.y ).sub( axis.z.mul( s ) ),
        oc.mul( axis.z ).mul( axis.x ).add( axis.y.mul( s ) ),
        oc.mul( axis.x ).mul( axis.y ).add( axis.z.mul( s ) ),
        oc.mul( axis.y ).mul( axis.y ).add( c ),
        oc.mul( axis.y ).mul( axis.z ).sub( axis.x.mul( s ) ),
        oc.mul( axis.z ).mul( axis.x ).sub( axis.y.mul( s ) ),
        oc.mul( axis.y ).mul( axis.z ).add( axis.x.mul( s ) ),
        oc.mul( axis.z ).mul( axis.z ).add( c )
    );

} ).setLayout( {
    name: 'rotateAxis',
    type: 'mat3',
    inputs: [
        { name: 'axis', type: 'vec3' },
        { name: 'angle', type: 'float' }
    ]
} );

const bezier = /*#__PURE__*/ Fn( ( [ P0_immutable, P1_immutable, P2_immutable, P3_immutable, t_immutable ] ) => {

    const t = float( t_immutable ).toVar();
    const P3 = vec3( P3_immutable ).toVar();
    const P2 = vec3( P2_immutable ).toVar();
    const P1 = vec3( P1_immutable ).toVar();
    const P0 = vec3( P0_immutable ).toVar();

    return sub( 1.0, t ).mul( sub( 1.0, t ) ).mul( sub( 1.0, t ) ).mul( P0 ).add( mul( 3.0, sub( 1.0, t ) ).mul( sub( 1.0, t ) ).mul( t ).mul( P1 ) ).add( mul( 3.0, sub( 1.0, t ) ).mul( t ).mul( t ).mul( P2 ) ).add( t.mul( t ).mul( t ).mul( P3 ) );

} ).setLayout( {
    name: 'bezier',
    type: 'vec3',
    inputs: [
        { name: 'P0', type: 'vec3' },
        { name: 'P1', type: 'vec3' },
        { name: 'P2', type: 'vec3' },
        { name: 'P3', type: 'vec3' },
        { name: 't', type: 'float' }
    ]
} );

const bezierGrad = /*#__PURE__*/ Fn( ( [ P0_immutable, P1_immutable, P2_immutable, P3_immutable, t_immutable ] ) => {

    const t = float( t_immutable ).toVar();
    const P3 = vec3( P3_immutable ).toVar();
    const P2 = vec3( P2_immutable ).toVar();
    const P1 = vec3( P1_immutable ).toVar();
    const P0 = vec3( P0_immutable ).toVar();

    return mul( 3.0, sub( 1.0, t ) ).mul( sub( 1.0, t ) ).mul( P1.sub( P0 ) ).add( mul( 6.0, sub( 1.0, t ) ).mul( t ).mul( P2.sub( P1 ) ) ).add( mul( 3.0, t ).mul( t ).mul( P3.sub( P2 ) ) );

} ).setLayout( {
    name: 'bezierGrad',
    type: 'vec3',
    inputs: [
        { name: 'P0', type: 'vec3' },
        { name: 'P1', type: 'vec3' },
        { name: 'P2', type: 'vec3' },
        { name: 'P3', type: 'vec3' },
        { name: 't', type: 'float' }
    ]
} );

const noise = /*#__PURE__*/ Fn( ( [ p_immutable ] ) => {

    const p = vec3( p_immutable ).toVar();
    const i = vec3( floor( p ) ).toVar();
    const f = vec3( fract( p ) ).toVar();
    const u = vec3( f.mul( f ).mul( sub( 3.0, mul( 2.0, f ) ) ) ).toVar();

    return mix( mix( mix( dot( _hash( i.add( vec3( 0.0, 0.0, 0.0 ) ) ),
                    f.sub( vec3( 0.0, 0.0, 0.0 ) ) ),
                dot( _hash( i.add( vec3( 1.0, 0.0, 0.0 ) ) ),
                    f.sub( vec3( 1.0, 0.0, 0.0 ) ) ), u.x ),
            mix( dot( _hash( i.add( vec3( 0.0, 1.0, 0.0 ) ) ),
                    f.sub( vec3( 0.0, 1.0, 0.0 ) ) ),
                dot( _hash( i.add( vec3( 1.0, 1.0, 0.0 ) ) ),
                    f.sub( vec3( 1.0, 1.0, 0.0 ) ) ), u.x ), u.y ),
        mix( mix( dot( _hash( i.add( vec3( 0.0, 0.0, 1.0 ) ) ),
                    f.sub( vec3( 0.0, 0.0, 1.0 ) ) ),
                dot( _hash( i.add( vec3( 1.0, 0.0, 1.0 ) ) ),
                    f.sub( vec3( 1.0, 0.0, 1.0 ) ) ), u.x ),
            mix( dot( _hash( i.add( vec3( 0.0, 1.0, 1.0 ) ) ),
                    f.sub( vec3( 0.0, 1.0, 1.0 ) ) ),
                dot( _hash( i.add( vec3( 1.0, 1.0, 1.0 ) ) ),
                    f.sub( vec3( 1.0, 1.0, 1.0 ) ) ), u.x ), u.y ), u.z );

} ).setLayout( {
    name: 'noise',
    type: 'float',
    inputs: [
        { name: 'p', type: 'vec3', qualifier: 'in' }
    ]
} );

const terrainHeight = /*#__PURE__*/ Fn( ( [ worldPos_immutable ] ) => {

    const worldPos = vec3( worldPos_immutable ).toVar();

    return vec3( worldPos.x, noise( worldPos.mul( 0.02 ) ).mul( 10.0 ), worldPos.z );

} ).setLayout( {
    name: 'terrainHeight',
    type: 'vec3',
    inputs: [
        { name: 'worldPos', type: 'vec3' }
    ]
} );

const lambertLight = /*#__PURE__*/ Fn( ( [ normal_immutable, viewDir_immutable, lightDir_immutable, lightColour_immutable ] ) => {

    const lightColour = vec3( lightColour_immutable ).toVar();
    const lightDir = vec3( lightDir_immutable ).toVar();
    const viewDir = vec3( viewDir_immutable ).toVar();
    const normal = vec3( normal_immutable ).toVar();
    const wrap = float( 0.5 ).toVar();
    const dotNL = float( saturate( dot( normal, lightDir ).add( wrap ).div( add( 1.0, wrap ) ) ) ).toVar();
    const lighting = vec3( dotNL ).toVar();
    const backlight = float( saturate( dot( viewDir, lightDir.negate() ).add( wrap ).div( add( 1.0, wrap ) ) ) ).toVar();
    const scatter = vec3( pow( backlight, 2.0 ) ).toVar();
    lighting.addAssign( scatter );

    return lighting.mul( lightColour );

} ).setLayout( {
    name: 'lambertLight',
    type: 'vec3',
    inputs: [
        { name: 'normal', type: 'vec3' },
        { name: 'viewDir', type: 'vec3' },
        { name: 'lightDir', type: 'vec3' },
        { name: 'lightColour', type: 'vec3' }
    ]
} );

const hemiLight = /*#__PURE__*/ Fn( ( [ normal_immutable, groundColour_immutable, skyColour_immutable ] ) => {

    const skyColour = vec3( skyColour_immutable ).toVar();
    const groundColour = vec3( groundColour_immutable ).toVar();
    const normal = vec3( normal_immutable ).toVar();

    return mix( groundColour, skyColour, mul( 0.5, normal.y ).add( 0.5 ) );

} ).setLayout( {
    name: 'hemiLight',
    type: 'vec3',
    inputs: [
        { name: 'normal', type: 'vec3' },
        { name: 'groundColour', type: 'vec3' },
        { name: 'skyColour', type: 'vec3' }
    ]
} );

const phongSpecular = /*#__PURE__*/ Fn( ( [ normal_immutable, lightDir_immutable, viewDir_immutable ] ) => {

    const viewDir = vec3( viewDir_immutable ).toVar();
    const lightDir = vec3( lightDir_immutable ).toVar();
    const normal = vec3( normal_immutable ).toVar();
    const dotNL = float( saturate( dot( normal, lightDir ) ) ).toVar();
    const r = vec3( normalize( reflect( lightDir.negate(), normal ) ) ).toVar();
    const phongValue = float( max( 0.0, dot( viewDir, r ) ) ).toVar();
    phongValue.assign( pow( phongValue, 32.0 ) );
    const specular = vec3( dotNL.mul( vec3( phongValue ) ) ).toVar();

    return specular;

} ).setLayout( {
    name: 'phongSpecular',
    type: 'vec3',
    inputs: [
        { name: 'normal', type: 'vec3' },
        { name: 'lightDir', type: 'vec3' },
        { name: 'viewDir', type: 'vec3' }
    ]
} );

const rgb_to_hsv = /*#__PURE__*/ Fn( ( [ c_immutable ] ) => {

    const c = vec3( c_immutable ).toVar();
    const r = float( c.r ).toVar(), g = float( c.g ).toVar(), b = float( c.b ).toVar();
    const maxc = float( max( r, max( g, b ) ) ).toVar();
    const minc = float( min( r, min( g, b ) ) ).toVar();
    const delta = float( maxc.sub( minc ) ).toVar();
    const h = float( 0.0 ).toVar();
    const s = float( 0.0 ).toVar();
    const v = float( maxc ).toVar();

    If( delta.greaterThan( 1e-5 ), () => {

        s.assign( delta.div( maxc ) );

        If( r.equal( maxc ), () => {

            h.assign( g.sub( b ).div( delta ) );

        } ).ElseIf( g.equal( maxc ), () => {

            h.assign( add( 2.0, b.sub( r ).div( delta ) ) );

        } ).Else( () => {

            h.assign( add( 4.0, r.sub( g ).div( delta ) ) );

        } );

        h.assign( h.div( 6.0 ) );

        If( h.lessThan( 0.0 ), () => {

            h.addAssign( 1.0 );

        } );

    } );

    return vec3( h, s, v );

} ).setLayout( {
    name: 'rgb_to_hsv',
    type: 'vec3',
    inputs: [
        { name: 'c', type: 'vec3' }
    ]
} );

const hsv_to_rgb = /*#__PURE__*/ Fn( ( [ c_immutable ] ) => {

    const c = vec3( c_immutable ).toVar();
    const h = float( c.x ).toVar();
    const s = float( c.y ).toVar();
    const v = float( c.z ).toVar();

    If( s.lessThanEqual( 0.0 ), () => {

        return vec3( v );

    } );

    h.assign( fract( h ).mul( 6.0 ) );
    const i = int( floor( h ) ).toVar();
    const f = float( h.sub( float( i ) ) ).toVar();
    const p = float( v.mul( sub( 1.0, s ) ) ).toVar();
    const q = float( v.mul( sub( 1.0, s.mul( f ) ) ) ).toVar();
    const t = float( v.mul( sub( 1.0, s.mul( sub( 1.0, f ) ) ) ) ).toVar();

    If( i.equal( int( 0 ) ), () => {

        return vec3( v, t, p );

    } );

    If( i.equal( int( 1 ) ), () => {

        return vec3( q, v, p );

    } );

    If( i.equal( int( 2 ) ), () => {

        return vec3( p, v, t );

    } );

    If( i.equal( int( 3 ) ), () => {

        return vec3( p, q, v );

    } );

    If( i.equal( int( 4 ) ), () => {

        return vec3( t, p, v );

    } );

    return vec3( v, p, q );

} ).setLayout( {
    name: 'hsv_to_rgb',
    type: 'vec3',
    inputs: [
        { name: 'c', type: 'vec3' }
    ]
} );

const colorRamp = Fn( ( [ factory, color_1, color_2, color2pos ] ) => {
    const fac = factory.clamp( 0, 1 )
    const color1 = color_1.toVar();
    const color2 = color_2.toVar();

    const t = smoothstep( 0.0, color2pos, fac );
    return mix( color1, color2, t );
} )

const ColorRamp2_Linear = /*#__PURE__*/ Fn( ( [ T_immutable, A_immutable, B_immutable ] ) => {

    const B = vec4( B_immutable ).toVar();
    const A = vec4( A_immutable ).toVar();
    const T = float( T_immutable ).toVar();
    const AB = float( B.w.sub( A.w ) ).toVar();
    const iAB = float( clamp( T.sub( A.w ).div( AB ), 0.0, 1.0 ) ).toVar();
    const pA = float( sub( 1.0, iAB ) ).toVar();
    const pB = float( iAB ).toVar();

    return pA.mul( A.xyz ).add( pB.mul( B.xyz ) );

} ).setLayout( {
    name: 'ColorRamp2_Linear',
    type: 'vec3',
    inputs: [
        { name: 'T', type: 'float', qualifier: 'in' },
        { name: 'A', type: 'vec4' },
        { name: 'B', type: 'vec4', qualifier: 'in' }
    ]
} );


const ColorRamp3_Linear = /*#__PURE__*/ Fn( ( [ T_immutable, A_immutable, B_immutable, C_immutable ] ) => {

    const C = vec4( C_immutable ).toVar();
    const B = vec4( B_immutable ).toVar();
    const A = vec4( A_immutable ).toVar();
    const T = float( T_immutable ).toVar();
    const AB = float( B.w.sub( A.w ) ).toVar();
    const BC = float( C.w.sub( B.w ) ).toVar();
    const iAB = float( clamp( T.sub( A.w ).div( AB ), 0.0, 1.0 ) ).toVar();
    const iBC = float( clamp( T.sub( B.w ).div( BC ), 0.0, 1.0 ) ).toVar();
    const pA = float( sub( 1.0, iAB ) ).toVar();
    const pB = float( iAB.sub( iBC ) ).toVar();
    const pC = float( iBC ).toVar();

    return pA.mul( A.xyz ).add( pB.mul( B.xyz ) ).add( pC.mul( C.xyz ) );

} ).setLayout( {
    name: 'ColorRamp3_Linear',
    type: 'vec3',
    inputs: [
        { name: 'T', type: 'float', qualifier: 'in' },
        { name: 'A', type: 'vec4' },
        { name: 'B', type: 'vec4', qualifier: 'in' },
        { name: 'C', type: 'vec4', qualifier: 'in' }
    ]
} );

const ColorRamp2_Constant = /*@__PURE__*/ Fn( ( [ T, A, B ] ) => {

    If( T.lessThan( B.w ), () => {

        return A.xyz;

    } );

    return B.xyz;

}, { T: 'float', A: 'vec4', B: 'vec4', return: 'vec3' } );

const ColorRamp3_Constant = /*@__PURE__*/ Fn( ( [ T, A, B, C ] ) => {

    If( T.lessThan( B.w ), () => {

        return A.xyz;

    } );

    If( T.lessThan( C.w ), () => {

        return B.xyz;

    } );

    return C.xyz;

}, { T: 'float', A: 'vec4', B: 'vec4', C: 'vec4', return: 'vec3' } );

const ColorRamp4_Constant = /*@__PURE__*/ Fn( ( [ T, A, B, C, D ] ) => {

    If( T.lessThan( B.w ), () => {

        return A.xyz;

    } );

    If( T.lessThan( C.w ), () => {

        return B.xyz;

    } );

    If( T.lessThan( D.w ), () => {

        return C.xyz;

    } );

    return D.xyz;

}, { T: 'float', A: 'vec4', B: 'vec4', C: 'vec4', D: 'vec4', return: 'vec3' } );


const applyHueSatValue = Fn( ( [ color, hue, saturation, value, factory ] ) => {
    //const hsv = mx_rgbtohsv( color ).toVar();
    const hsv = rgb_to_hsv( color ).toVar();

    const hueShift = hue.sub( 0.5 );
    //
    hsv.x = fract( hsv.x.add( hueShift ) ); // hue - add ( modify angle )
    hsv.y.mulAssign( saturation ); // saturation - mul ( modify value )
    hsv.z.mulAssign( value ); // value - mul ( modify value )

    //const adjustedColor = mx_hsvtorgb( hsv );
    const adjustedColor = hsv_to_rgb( hsv );

    return mix( color, adjustedColor, factory );
} )

const grid = /*#__PURE__*/ Fn( ( [ uv_immutable, lineWidth_immutable ] ) => {

    const lineWidth = vec2( lineWidth_immutable ).toVar();
    const uv = vec2( uv_immutable ).toVar();
    const ddx = vec2( dFdx( uv ) ).toVar();
    const ddy = vec2( dFdy( uv ) ).toVar();
    const uvDeriv = vec2( length( vec2( ddx.x, ddy.x ) ), length( vec2( ddx.y, ddy.y ) ) ).toVar();
    const invertLineX = bool( lineWidth.x.greaterThan( 0.5 ) ).toVar();
    const invertLineY = bool( lineWidth.y.greaterThan( 0.5 ) ).toVar();
    const targetWidth = vec2( select( invertLineX, sub( 1.0, lineWidth.x ), lineWidth.x ), select( invertLineY, sub( 1.0, lineWidth.y ), lineWidth.y ) ).toVar();
    const drawWidth = vec2( clamp( targetWidth, uvDeriv, vec2( 0.5 ) ) ).toVar();
    const lineAA = vec2( uvDeriv.mul( 1.5 ) ).toVar();
    const gridUV = vec2( abs( fract( uv ).mul( 2.0 ).sub( 1.0 ) ) ).toVar();
    gridUV.x.assign( select( invertLineX, gridUV.x, sub( 1.0, gridUV.x ) ) );
    gridUV.y.assign( select( invertLineY, gridUV.y, sub( 1.0, gridUV.y ) ) );
    const grid2 = vec2( smoothstep( drawWidth.add( lineAA ), drawWidth.sub( lineAA ), gridUV ) ).toVar();
    grid2.mulAssign( clamp( targetWidth.div( drawWidth ), 0.0, 1.0 ) );
    grid2.assign( mix( grid2, targetWidth, clamp( uvDeriv.mul( 2.0 ).sub( 1.0 ), 0.0, 1.0 ) ) );
    grid2.x.assign( select( invertLineX, sub( 1.0, grid2.x ), grid2.x ) );
    grid2.y.assign( select( invertLineY, sub( 1.0, grid2.y ), grid2.y ) );

    return grid2;

} ).setLayout( {
    name: 'grid',
    type: 'vec2',
    inputs: [
        { name: 'uv', type: 'vec2', qualifier: 'in' },
        { name: 'lineWidth', type: 'vec2' }
    ]
} );

const srgbToLinear = Fn( ( [ rgb ] ) => {
    return mix( rgb.div( 12.92 ), pow( add( rgb, 0.055 ).div( 1.055 ), vec3( 2.4 ) ), step( 0.04045, rgb ) );
} )

const linearToSrgb = Fn( ( [ lin ] ) => {
    // piecewise:
    // lin <= 0.0031308  →  12.92 * lin
    // lin >  0.0031308  →  1.055 * lin^(1/2.4) - 0.055
    const low = lin.mul( 12.92 );
    const high = pow( lin, vec3( 1.0 / 2.4 ) ).mul( 1.055 ).sub( 0.055 );
    return mix( low, high, step( 0.0031308, lin ) );
} );

const noise21 = /*@__PURE__*/ Fn( ( [ p ] ) => {

    const i = floor( p );
    const f = fract( p );
    const u = f.mul( f ).mul( sub( 3.0, mul( 2.0, f ) ) );
    const n = mix( mix( dot( float(-1.0).add( mul( 2.0, _hash( i.add( vec2( 0.0 ) ) ) ) ),
        f.sub( vec2( 0.0 ) ) ), dot( float(-1.0).add( mul( 2.0, _hash( i.add( vec2( 1.0, 0.0 ) ) ) ) ),
        f.sub( vec2( 1.0, 0.0 ) ) ), u.x ), mix( dot( float(-1.0).add( mul( 2.0, _hash( i.add( vec2( 0.0, 1.0 ) ) ) ) ),
        f.sub( vec2( 0.0, 1.0 ) ) ), dot( float(-1.0).add( mul( 2.0, _hash( i.add( vec2( 1.0, 1.0 ) ) ) ) ),
        f.sub( vec2( 1.0, 1.0 ) ) ), u.x ), u.y );

    return add( 0.5, mul( 0.5, n ) );

}, { p: 'vec2', return: 'float' } );

const mod289_0 = /*@__PURE__*/ Fn( ( [ x ] ) => {

    return x.sub( floor( x.mul( 1.0 / 289.0 ) ).mul( 289.0 ) );

}, { x: 'vec3', return: 'vec3' } );

const mod289_1 = /*@__PURE__*/ Fn( ( [ x ] ) => {

    return x.sub( floor( x.mul( 1.0 / 289.0 ) ).mul( 289.0 ) );

}, { x: 'vec2', return: 'vec2' } );

const mod289 = /*@__PURE__*/ overloadingFn( [ mod289_0, mod289_1 ] );

const permute = /*@__PURE__*/ Fn( ( [ x ] ) => {

    return mod289( x.mul( 34.0 ).add( 1.0 ).mul( x ) );

}, { x: 'vec3', return: 'vec3' } );

const snoise = /*@__PURE__*/ Fn( ( [ v ] ) => {

    const C = vec4( 0.211324865405187, 0.366025403784439, - 0.577350269189626, 0.024390243902439 );
    const i = floor( v.add( dot( v, C.yy ) ) );
    const x0 = v.sub( i ).add( dot( i, C.xx ) );
    const i1 = select( x0.x.greaterThan( x0.y ), vec2( 1.0, 0.0 ), vec2( 0.0, 1.0 ) );
    const x12 = x0.xyxy.add( C.xxzz );
    x12.xy.subAssign( i1 );
    i.assign( mod289( i ) );
    const p = permute( permute( i.y.add( vec3( 0.0, i1.y, 1.0 ) ) ).add( i.x ).add( vec3( 0.0, i1.x, 1.0 ) ) );
    const m = max( sub( 0.5, vec3( dot( x0, x0 ), dot( x12.xy, x12.xy ), dot( x12.zw, x12.zw ) ) ), 0.0 );
    m.mulAssign( m );
    m.mulAssign( m );
    const x = mul( 2.0, fract( p.mul( C.www ) ) ).sub( 1.0 );
    const h = abs( x ).sub( 0.5 );
    const ox = floor( x.add( 0.5 ) );
    const a0 = x.sub( ox );
    m.mulAssign( sub( 1.79284291400159, mul( 0.85373472095314, a0.mul( a0 ).add( h.mul( h ) ) ) ) );
    const g = property( 'vec3' );
    g.x.assign( a0.x.mul( x0.x ).add( h.x.mul( x0.y ) ) );
    g.yz.assign( a0.yz.mul( x12.xz ).add( h.yz.mul( x12.yw ) ) );

    return mul( 130.0, dot( m, g ) );

}, { v: 'vec2', return: 'float' } );

const fbm = /*@__PURE__*/ Fn( ( [ p, oct ] ) => {

    const v = float( 0.0 );
    const amp = float( 0.5 );
    const freq = float( 1.0 );

    Loop( { start: 0.0, end: 4.0, type: 'float' }, ( { i } ) => {

        If( i.greaterThanEqual( oct ), () => {

            Break();

        } );

        v.addAssign( amp.mul( snoise( p.mul( freq ) ) ) );
        freq.mulAssign( 2.0 );
        amp.mulAssign( 0.5 );

    } );

    return v;

}, { p: 'vec2', oct: 'float', return: 'float' } );

const hash12 = /*@__PURE__*/ Fn( ( [ p ] ) => {

    const p3 = fract( vec3( p.xyx ).mul( 0.1031 ) );
    p3.addAssign( dot( p3, p3.yzx.add( 33.33 ) ) );

    return fract( p3.x.add( p3.y ).mul( p3.z ) );

}, { p: 'vec2', return: 'float' } );

const rgb2hsv = /*@__PURE__*/ Fn( ( [ c ] ) => {

    const K = vec4( 0.0, - 1.0 / 3.0, 2.0 / 3.0, - 1.0 );
    const p = mix( vec4( c.bg, K.wz ), vec4( c.gb, K.xy ), step( c.b, c.g ) );
    const q = mix( vec4( p.xyw, c.r ), vec4( c.r, p.yzx ), step( p.x, c.r ) );
    const d = q.x.sub( min( q.w, q.y ) );
    const e = float( 1.0e-10 );

    return vec3( abs( q.z.add( q.w.sub( q.y ).div( mul( 6.0, d ).add( e ) ) ) ), d.div( q.x.add( e ) ), q.x );

}, { c: 'vec3', return: 'vec3' } );

const hsv2rgb = /*@__PURE__*/ Fn( ( [ c ] ) => {

    const K = vec4( 1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0 );
    const p = abs( fract( c.xxx.add( K.xyz ) ).mul( 6.0 ).sub( K.www ) );

    return c.z.mul( mix( K.xxx, clamp( p.sub( K.xxx ), 0.0, 1.0 ), c.y ) );

}, { c: 'vec3', return: 'vec3' } );

const adjustSaturation = /*@__PURE__*/ Fn( ( [ color, saturation ] ) => {

    const gray = vec3( dot( color, vec3( 0.299, 0.587, 0.114 ) ) );

    return mix( gray, color, saturation );

}, { color: 'vec3', saturation: 'float', return: 'vec3' } );

const adjustTemperature = /*@__PURE__*/ Fn( ( [ color, temp ] ) => {

    const warm = vec3( add( 1.0, temp.mul( 0.1 ) ), 1.0, sub( 1.0, temp.mul( 0.2 ) ) );
    const cool = vec3( add( 1.0, temp.mul( 0.2 ) ), 1.0, sub( 1.0, temp.mul( 0.1 ) ) );

    return color.mul( select( temp.greaterThan( 0.0 ), warm, cool ) );

}, { color: 'vec3', temp: 'float', return: 'vec3' } );

const adjustHue = /*@__PURE__*/ Fn( ( [ color, hueShift ] ) => {

    const hsv = rgb2hsv( color );
    hsv.x.assign( fract( hsv.x.add( hueShift.div( 360.0 ) ) ) );

    return hsv2rgb( hsv );

}, { color: 'vec3', hueShift: 'float', return: 'vec3' } );

const adjustLevels = /*@__PURE__*/ Fn( ( [ color, blackLevel, whiteLevel ] ) => {

    return color.sub( blackLevel ).div( max( 1e-5, whiteLevel.sub( blackLevel ) ) );

}, { color: 'vec3', blackLevel: 'float', whiteLevel: 'float', return: 'vec3' } );

const brickTexture = Fn( ( { inputVector, scale, brickWidth, rowHeight, mortar, offset, freq, squash, squashFreq, color1, color2, mortarColor, bias, variance } )  =>
{
    // Анизотропный масштаб кирпича
    const st0 = inputVector.toVar()
    const st  = vec2(
        st0.x.mul( scale ).div( brickWidth ),
        st0.y.mul( scale ).div( rowHeight )
    )

    // Ряды
    const row = floor( st.y )

    // Ряды с squash: активен, когда mod(row, squashFreq)==0
    const m        = mod( row, squashFreq )
    const isSquash = step( m, 0.0001 )                 // ~1 на кратных рядах
    const sx       = mix( 1.0, squash, isSquash )

    // Применяем squash по X к координате ряда
    const stRow = vec2( st.x.mul( sx ), st.y )

    // Сдвиг рядов
    const cycle      = floor( row.div( freq ) )
    const rowInCycle = row.sub( cycle.mul( freq ) )
    const rowOffset  = fract( rowInCycle.mul( offset ) )
    const stShift    = vec2( stRow.x.add( rowOffset ), stRow.y )

    // Локальные координаты и шов
    const g    = fract( stShift )
    const cx   = min( g.x, float(1.0).sub( g.x ) )
    const cy   = min( g.y, float(1.0).sub( g.y ) )
    const halfM = float( mortar ).mul( 0.5 )
    const edge = min( cx, cy )
    const mMask = step( edge, halfM )                   // 1 в шве

    // Пер-кирпичный рандом
    const cell = vec2( floor( stShift.x ), floor( stShift.y ) )
    const rnd  = fract( sin( cell.x.mul(12.9898).add( cell.y.mul(78.233) ) ).mul(43758.5453) )

    // Цвет кирпича с bias и вариативностью
    const choose2 = step( rnd, float( bias ) )
    let brickCol  = mix( color1, color2, choose2 )
    brickCol      = mix( brickCol, mix( color1, color2, rnd ), float( variance ) )

    // Шов поверх кирпича
    const base = mix( brickCol, mortarColor, mMask )

    return vec4( base , 1.0 )
})

const vecToFac = /*@__PURE__*/ Fn( ( [ vector ] ) => {
    return vector.r.mul( 0.2126 ).add( vector.g.mul( 0.7152 ) ).add( vector.b.mul( 0.0722 ) ).toVar()
} )

const mixColorHSV = Fn( ([a, b, factor]) => {
    // clamp factor
    const f = max( float(0.0), min( float(1.0), factor ) )

    const ha = mx_rgbtohsv( a )
    const hb = mx_rgbtohsv( b )

    // H,S из B; V из A
    const hsv = vec3( hb.x, hb.y, ha.z )
    const col = mx_hsvtorgb( hsv )

    return mix( a, col, f )
})

const CatmulRom = /*@__PURE__*/ Fn( ( [ T, D, C, B, A ] ) => {

    return mul( 0.5, mul( 2.0, B ).add( A.negate().add( C ).mul( T ) ).add( mul( 2.0, A ).sub( mul( 5.0, B ) ).add( mul( 4.0, C ) ).sub( D ).mul( T ).mul( T ) ).add( A.negate().add( mul( 3.0, B ) ).sub( mul( 3.0, C ) ).add( D ).mul( T ).mul( T ).mul( T ) ) );

}, { T: 'float', D: 'vec3', C: 'vec3', B: 'vec3', A: 'vec3', return: 'vec3' } );

const ColorRamp4_BSpline = /*@__PURE__*/ Fn( ( [ T, A, B, C, D ] ) => {

    const AB = B.w.sub( A.w );
    const BC = C.w.sub( B.w );
    const CD = D.w.sub( C.w );

    const iAB = T.sub( A.w ).div( AB ).saturate()
    const iBC = T.sub( B.w ).div( BC ).saturate()
    const iCD =  T.sub( C.w ).div( CD ).saturate()

    const p = vec4( sub( 1.0, iAB ), iAB.sub( iBC ), iBC.sub( iCD ), iCD );
    const cA = CatmulRom( p.x, A.xyz, A.xyz, B.xyz, C.xyz );
    const cB = CatmulRom( p.y, A.xyz, B.xyz, C.xyz, D.xyz );
    const cC = CatmulRom( p.z, B.xyz, C.xyz, D.xyz, D.xyz );
    const cD = D.xyz;


    If( T.lessThan( B.w ), () => {

        return cA.xyz;

    } );

    If( T.lessThan( C.w ), () => {

        return cB.xyz;

    } );

    If( T.lessThan( D.w ), () => {

        return cC.xyz;

    } );

    return cD.xyz;

}, { T: 'float', A: 'vec4', B: 'vec4', C: 'vec4', D: 'vec4', return: 'vec3' } );

const ColorRamp3_BSpline = /*@__PURE__*/ Fn( ( [ T, A, B, C ] ) => {

    const AB = B.w.sub( A.w );
    const BC = C.w.sub( B.w );

    const iAB = T.sub( A.w ).div( AB ).saturate();
    const iBC = T.sub( B.w ).div( BC ).saturate();

    const p = vec3( sub( 1.0, iAB ), iAB.sub( iBC ), iBC );

    const cA = CatmulRom( p.x, A.xyz, A.xyz, B.xyz, C.xyz );
    const cB = CatmulRom( p.y, A.xyz, B.xyz, C.xyz, C.xyz );
    const cC = C.xyz;

    If( T.lessThan( B.w ), () => {
        return cA.xyz;
    } );

    If( T.lessThan( C.w ), () => {
        return cB.xyz;
    } );

    return cC.xyz;

}, { T: 'float', A: 'vec4', B: 'vec4', C: 'vec4', return: 'vec3' } );

const whiteNoise3D = (coord) =>
    fract(sin(dot(coord, vec3(12.9898, 78.233, 37.719))).mul(43758.5453));

const whiteNoise2D = (coord) => fract(sin(dot(coord, vec2(12.9898, 78.233))).mul(43758.5453));

const lengthSqrt = Fn( ( [v] ) => {
    return v.x.mul(v.x).add( v.y.mul(v.y) ).add( v.z.mul(v.z) ).sqrt()
})

const smoothRange = /*@__PURE__*/ Fn( ( [ value, inMin, inMax, outMin, outMax ] ) => {

    const t = clamp( ( value.sub( inMin ) ).div( inMax.sub( inMin ) ), 0.0, 1.0 );
    const smoothT = t.mul( t ).mul( float(3.0).sub( t.mul( 2.0 ) ) ); // smoothstep curve
    return mix( outMin, outMax, smoothT );

}, { value: 'float', inMin: 'float', inMax: 'float', outMin: 'float', outMax: 'float', return: 'float' } );


export {
    Rot,
    rotateY,
    rotateZ,
    emission,
    facture,
    scaleWithCenter,
    directionalBlur,
    murmurHash21,
    hash21,
    _hash,
    easeOut,
    rotateAxis,
    bezier,
    bezierGrad,
    noise,
    terrainHeight,
    phongSpecular,
    hemiLight,
    lambertLight,
    rgb_to_hsv,
    hsv_to_rgb,
    colorRamp,
    ColorRamp2_Linear,
    ColorRamp3_Linear,
    ColorRamp2_Constant,
    ColorRamp3_Constant,
    ColorRamp4_Constant,
    applyHueSatValue,
    grid,
    srgbToLinear,
    linearToSrgb,
    noise21,
    snoise,
    fbm,
    hash12,
    rgb2hsv,
    hsv2rgb,
    adjustSaturation,
    adjustTemperature,
    adjustHue,
    adjustLevels,
    brickTexture,
    vecToFac,
    mixColorHSV,
    CatmulRom,
    ColorRamp4_BSpline,
    ColorRamp3_BSpline,
    whiteNoise3D,
    whiteNoise2D,
    lengthSqrt,
    smoothRange
}
