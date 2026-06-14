import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { mixamoVRMRigMap } from './mixamoVRMRigMap'

// Convert a Mixamo FBX animation to work on a VRM model
export async function loadMixamoAnimation(source, vrm) {

  const loader = new FBXLoader()

  const fbx = await new Promise((resolve, reject) => {
    if (typeof source === 'string') {
      loader.load(source, resolve, undefined, reject)
    } else {
      const url = URL.createObjectURL(source)
      loader.load(url, (fbx) => {
        URL.revokeObjectURL(url)
        resolve(fbx)
      }, undefined, reject)
    }
  })

  const clip = fbx.animations[0]
  if (!clip) throw new Error('No animation in FBX')

  const tracks = []

  const restRotationInverse = new THREE.Quaternion()
  const parentRestWorldRotation = new THREE.Quaternion()
  const _quatA = new THREE.Quaternion()
  const _vec3 = new THREE.Vector3()

  // Normalize hips height
  const motionHipsHeight = fbx.getObjectByName('mixamorigHips').position.y
  const vrmHipsNode = vrm.humanoid.getNormalizedBoneNode('hips')
  const vrmHipsY = vrmHipsNode.getWorldPosition(_vec3).y
  const vrmRootY = vrm.scene.getWorldPosition(_vec3).y
  const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY)
  const hipsPositionScale = vrmHipsHeight / motionHipsHeight

  clip.tracks.forEach((track) => {
    const [boneName, property] = track.name.split('.')

    const vrmBoneName = mixamoVRMRigMap[boneName]
    if (!vrmBoneName) return

    const vrmBoneNode = vrm.humanoid.getNormalizedBoneNode(vrmBoneName)
    const mixamoBone = fbx.getObjectByName(boneName)
    if (!vrmBoneNode || !mixamoBone) return

    const mixamoRestPose = mixamoBone.quaternion.clone()

    if (property === 'quaternion') {
      // Get rest rotation of the Mixamo bone
      mixamoBone.getWorldQuaternion(restRotationInverse).invert()

      // Get parent world rotation
      mixamoBone.parent?.getWorldQuaternion(parentRestWorldRotation)

      const newTrack = new THREE.QuaternionKeyframeTrack(
        `${vrmBoneNode.name}.${property}`,
        track.times,
        track.values.reduce((arr, val, i) => {
          arr.push(val)
          if (i % 4 === 3) {
            // Reconstruct quaternion
            const q = new THREE.Quaternion(
              arr[arr.length - 4],
              arr[arr.length - 3],
              arr[arr.length - 2],
              arr[arr.length - 1]
            )

            // Apply coordinate conversion
            q.premultiply(parentRestWorldRotation)
              .multiply(restRotationInverse)

            // Write back
            arr[arr.length - 4] = q.x
            arr[arr.length - 3] = q.y
            arr[arr.length - 2] = q.z
            arr[arr.length - 1] = q.w
          }
          return arr
        }, [])
      )

      tracks.push(newTrack)
    }

    if (property === 'position' && vrmBoneName === 'hips') {

      const values = track.values.map((val, i) => {
    
        // X movement
        if (i % 3 === 0) {
          return val * hipsPositionScale
        }
    
        // Y movement
        if (i % 3 === 1) {
    
          // prevent sinking into floor
          const y = val * hipsPositionScale
    
          return Math.max(y, 0)
        }
    
        // Z movement
        if (i % 3 === 2) {
          return -val * hipsPositionScale
        }
      })
    
      const newTrack =
        new THREE.VectorKeyframeTrack(
          `${vrmBoneNode.name}.${property}`,
          track.times,
          values
        )
    
      tracks.push(newTrack)
    }
  })

  return new THREE.AnimationClip(clip.name, clip.duration, tracks)
}