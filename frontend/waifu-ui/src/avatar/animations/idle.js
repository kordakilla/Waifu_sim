// avatar/animations/idle.js

import * as THREE from 'three'

let idleTime = 0

function breath(t) {
  return (
    Math.sin(t * 0.9)  * 0.65 +
    Math.sin(t * 1.83) * 0.25 +
    Math.sin(t * 0.43) * 0.10
  )
}

function drift(t, phase = 0) {
  return (
    Math.sin(t * 0.23 + phase) * 0.50 +
    Math.sin(t * 0.41 + phase) * 0.30 +
    Math.sin(t * 0.07 + phase) * 0.20
  )
}

function weightShift(t) {
  return (
    Math.sin(t * 0.18)  * 0.60 +
    Math.sin(t * 0.073) * 0.40
  )
}

const d = THREE.MathUtils.degToRad

export function updateIdle(vrm, delta) {
  if (!vrm) return
  idleTime += delta

  const h = vrm.humanoid

  // ---- HIPS ----
  const hips = h.getRawBoneNode('hips')
  if (hips) {
    hips.rotation.z = weightShift(idleTime) * d(2)
    hips.rotation.y = drift(idleTime, 0.5)  * d(1.5)
  }

  // ---- SPINE ----
  const spine = h.getRawBoneNode('spine')
  if (spine) {
    spine.rotation.x = breath(idleTime)       * d(1.5)
    spine.rotation.z = weightShift(idleTime)  * d(-1.2)
    spine.rotation.y = drift(idleTime, 1.2)   * d(1)
  }

  // ---- CHEST ----
  const chest = h.getRawBoneNode('chest')
  if (chest) {
    chest.rotation.x = breath(idleTime - 0.2) * d(1.2)
    chest.rotation.z = weightShift(idleTime)  * d(-1)
  }

  // ---- UPPER CHEST ----
  const upperChest = h.getRawBoneNode('upperChest')
  if (upperChest) {
    upperChest.rotation.x = breath(idleTime - 0.4) * d(1)
    upperChest.rotation.z = drift(idleTime, 2.1)   * d(0.8)
  }

  // ---- NECK ----
  const neck = h.getRawBoneNode('neck')
  if (neck) {
    neck.rotation.x = drift(idleTime, 3.3) * d(1.5)
    neck.rotation.z = drift(idleTime, 1.7) * d(1.2)
    neck.rotation.y = drift(idleTime, 5.1) * d(1.2)
  }

  // ---- HEAD ----
  const head = h.getRawBoneNode('head')
  if (head) {
    head.rotation.x = drift(idleTime, 2.2) * d(2)
    head.rotation.z = drift(idleTime, 4.0) * d(1.5)
    head.rotation.y = drift(idleTime, 6.3) * d(2)
  }

  // ---- SHOULDERS — rise with breath ----
  const lShoulder = h.getRawBoneNode('leftShoulder')
  const rShoulder = h.getRawBoneNode('rightShoulder')
  const shoulderLift = breath(idleTime) * d(1.5)
  if (lShoulder) lShoulder.rotation.z = shoulderLift
  if (rShoulder) rShoulder.rotation.z = -shoulderLift

  // ---- UPPER ARMS — add on top of setupPose base (-65, +65 deg) ----
  const lUpperArm = h.getRawBoneNode('leftUpperArm')
  const rUpperArm = h.getRawBoneNode('rightUpperArm')
  if (lUpperArm) {
    lUpperArm.rotation.z = d(-65) + drift(idleTime, 0.8) * d(2.5)
    lUpperArm.rotation.y =          drift(idleTime, 2.0) * d(2)
    lUpperArm.rotation.x =          drift(idleTime, 3.5) * d(1.5)
  }
  if (rUpperArm) {
    rUpperArm.rotation.z = d(65)  + drift(idleTime, 1.3) * d(-2.5)
    rUpperArm.rotation.y =          drift(idleTime, 2.5) * d(-2)
    rUpperArm.rotation.x =          drift(idleTime, 4.0) * d(1.5)
  }

  // ---- LOWER ARMS — add on top of setupPose base (-8, +8 deg) ----
  const lLowerArm = h.getRawBoneNode('leftLowerArm')
  const rLowerArm = h.getRawBoneNode('rightLowerArm')
  if (lLowerArm) lLowerArm.rotation.z = d(-8) + drift(idleTime, 1.6) * d(2)
  if (rLowerArm) rLowerArm.rotation.z = d(8)  + drift(idleTime, 2.9) * d(-2)

  // ---- HANDS ----
  const lHand = h.getRawBoneNode('leftHand')
  const rHand = h.getRawBoneNode('rightHand')
  if (lHand) {
    lHand.rotation.z = drift(idleTime, 3.1) * d(2)
    lHand.rotation.y = drift(idleTime, 1.4) * d(1.5)
  }
  if (rHand) {
    rHand.rotation.z = drift(idleTime, 3.8) * d(-2)
    rHand.rotation.y = drift(idleTime, 2.1) * d(-1.5)

  // Add these to idle.js after the hands section

  // ---- WRISTS — subtle rotation on all axes ----
  if (lHand) {
    lHand.rotation.z = drift(idleTime, 3.1) * d(2.5)
    lHand.rotation.y = drift(idleTime, 1.4) * d(2)
    lHand.rotation.x = drift(idleTime, 5.2) * d(1.5)   // ← add X axis
  }
  if (rHand) {
    rHand.rotation.z = drift(idleTime, 3.8) * d(-2.5)
    rHand.rotation.y = drift(idleTime, 2.1) * d(-2)
    rHand.rotation.x = drift(idleTime, 6.0) * d(1.5)   // ← add X axis
  }

  // ---- THUMBS ----
  const lThumbMeta  = h.getRawBoneNode('leftThumbMetacarpal')
  const rThumbMeta  = h.getRawBoneNode('rightThumbMetacarpal')
  const lThumbProx  = h.getRawBoneNode('leftThumbProximal')
  const rThumbProx  = h.getRawBoneNode('rightThumbProximal')

  if (lThumbMeta) {
    lThumbMeta.rotation.x = d(15) + drift(idleTime, 1.1) * d(2)
    lThumbMeta.rotation.z =         drift(idleTime, 2.3) * d(1.5)
  }
  if (rThumbMeta) {
    rThumbMeta.rotation.x = d(15) + drift(idleTime, 1.6) * d(2)
    rThumbMeta.rotation.z =         drift(idleTime, 3.1) * d(-1.5)
  }
  if (lThumbProx) lThumbProx.rotation.x = d(10) + drift(idleTime, 2.8) * d(1.5)
  if (rThumbProx) rThumbProx.rotation.x = d(10) + drift(idleTime, 3.4) * d(1.5)

  // ---- INDEX FINGERS ----
  const lIndexProx = h.getRawBoneNode('leftIndexProximal')
  const rIndexProx = h.getRawBoneNode('rightIndexProximal')
  const lIndexMid  = h.getRawBoneNode('leftIndexIntermediate')
  const rIndexMid  = h.getRawBoneNode('rightIndexIntermediate')

  if (lIndexProx) lIndexProx.rotation.x = d(5) + drift(idleTime, 0.7) * d(2)
  if (rIndexProx) rIndexProx.rotation.x = d(5) + drift(idleTime, 1.2) * d(2)
  if (lIndexMid)  lIndexMid.rotation.x  = d(8) + drift(idleTime, 1.9) * d(1.5)
  if (rIndexMid)  rIndexMid.rotation.x  = d(8) + drift(idleTime, 2.4) * d(1.5)

  // ---- MIDDLE FINGERS ----
  const lMidProx = h.getRawBoneNode('leftMiddleProximal')
  const rMidProx = h.getRawBoneNode('rightMiddleProximal')
  const lMidMid  = h.getRawBoneNode('leftMiddleIntermediate')
  const rMidMid  = h.getRawBoneNode('rightMiddleIntermediate')

  if (lMidProx) lMidProx.rotation.x = d(5) + drift(idleTime, 1.3) * d(1.8)
  if (rMidProx) rMidProx.rotation.x = d(5) + drift(idleTime, 1.8) * d(1.8)
  if (lMidMid)  lMidMid.rotation.x  = d(8) + drift(idleTime, 2.5) * d(1.5)
  if (rMidMid)  rMidMid.rotation.x  = d(8) + drift(idleTime, 3.0) * d(1.5)

  // ---- RING FINGERS ----
  const lRingProx = h.getRawBoneNode('leftRingProximal')
  const rRingProx = h.getRawBoneNode('rightRingProximal')
  const lRingMid  = h.getRawBoneNode('leftRingIntermediate')
  const rRingMid  = h.getRawBoneNode('rightRingIntermediate')

  if (lRingProx) lRingProx.rotation.x = d(5) + drift(idleTime, 1.9) * d(1.8)
  if (rRingProx) rRingProx.rotation.x = d(5) + drift(idleTime, 2.4) * d(1.8)
  if (lRingMid)  lRingMid.rotation.x  = d(8) + drift(idleTime, 3.1) * d(1.5)
  if (rRingMid)  rRingMid.rotation.x  = d(8) + drift(idleTime, 3.6) * d(1.5)

  // ---- LITTLE FINGERS ----
  const lLittleProx = h.getRawBoneNode('leftLittleProximal')
  const rLittleProx = h.getRawBoneNode('rightLittleProximal')
  const lLittleMid  = h.getRawBoneNode('leftLittleIntermediate')
  const rLittleMid  = h.getRawBoneNode('rightLittleIntermediate')

  if (lLittleProx) lLittleProx.rotation.x = d(6) + drift(idleTime, 2.5) * d(2)
  if (rLittleProx) rLittleProx.rotation.x = d(6) + drift(idleTime, 3.0) * d(2)
  if (lLittleMid)  lLittleMid.rotation.x  = d(10) + drift(idleTime, 3.7) * d(1.5)
  if (rLittleMid)  rLittleMid.rotation.x  = d(10) + drift(idleTime, 4.2) * d(1.5)
  }
}