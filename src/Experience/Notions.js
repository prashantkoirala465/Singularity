import * as THREE from 'three/webgpu'
import * as Helpers from '@experience/Utils/Helpers.js'
import Model from '@experience/Worlds/Abstracts/Model.js'
import Experience from '@experience/Experience.js'
import Debug from '@experience/Utils/Debug.js'
import State from "@experience/State.js";

import {
    sin, positionLocal, time, vec2, vec3, vec4, uv, uniform, color, fog, rangeFogFactor, texture, If, min,
    range, instanceIndex, step, mix, max, uint, varying, Fn, struct, output, emissive, diffuseColor, PI, PI2, oneMinus, cos, atan, float,
    pass, mrt, viewportDepthTexture, screenUV, linearDepth, depth, viewportLinearDepth, mod, floor, fract, smoothstep, clamp, abs, blendOverlay,
    normalView, reflect, normalize, positionViewDirection, asin, positionView, mx_rgbtohsv, mx_hsvtorgb, positionWorld,
    positionGeometry, modelWorldMatrix, objectPosition, userData, rotate, mat3, mul, mx_fractal_noise_vec3, faceDirection,
    inverse, modelViewMatrix, transformDirection, modelViewPosition, modelWorldMatrixInverse, cameraWorldMatrix,
    cameraPosition, positionWorldDirection, sub, dot, Loop, length, remap, remapClamp, lengthSq, equirectUV
} from 'three/tsl'
``
import {
    ColorRamp2_Linear, ColorRamp3_Linear, srgbToLinear, linearToSrgb, noise21, Rot, adjustTemperature, adjustHue,
    adjustSaturation, adjustLevels, fbm, hash12, brickTexture, vecToFac, mixColorHSV, emission, ColorRamp2_Constant,
    rotateZ, rotateAxis, ColorRamp3_BSpline, ColorRamp4_BSpline
} from '@experience/Utils/TSL-utils.js'

