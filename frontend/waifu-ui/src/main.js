import './styles/global.css'
import './styles/subtitles.css'
import './styles/chatbox.css'
import './styles/thinking.css'

import * as THREE from 'three'

import socket from './websocket/socket'

import { createChatBox }
from './ui/chatbox'

import { GLTFLoader }
from 'three/examples/jsm/loaders/GLTFLoader.js'

import { VRMLoaderPlugin }
from '@pixiv/three-vrm'

import { showSubtitle }
from './ui/subtitles'

import { setExpression }
from './avatar/expressions'

import { updateBlink }
from './avatar/blink'

import {
  startTalking,
  stopTalking,
  updateLipSync
}
from './avatar/lipsync'

import { updateIdle }
from './avatar/animations/idle'


import { loadMixamoAnimation }
from './avatar/animations/mixamo'

import {
  showThinking,
  removeThinking
}
from './ui/thinking'

import { OrbitControls }
from 'three/examples/jsm/controls/OrbitControls.js'


/* =========================
   SCENE
========================= */

const scene = new THREE.Scene()

const camera =
  new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

camera.position.set(
  0,
  1.6,
  4
)

const renderer =
  new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  })

renderer.setSize(
  window.innerWidth,
  window.innerHeight
)

document.body.appendChild(
  renderer.domElement
)

const controls =
  new OrbitControls(
    camera,
    renderer.domElement
  )

controls.enableDamping = true

controls.target.set(0, 1, 0)

renderer.outputColorSpace =
  THREE.SRGBColorSpace



/* =========================
   LIGHTING
========================= */

const ambientLight =
  new THREE.AmbientLight(
    0xffffff,
    1.5
  )

scene.add(ambientLight)

const light =
  new THREE.DirectionalLight(
    0xffffff,
    2.5
  )

light.position.set(2, 4, 2)

light.castShadow = true

scene.add(light)



/* =========================
   GRID FLOOR
========================= */

const grid =
  new THREE.GridHelper(
    20,
    40,
    0x888888,
    0x444444
  )

grid.position.y = -1

scene.add(grid)



/* =========================
   RENDERER SETTINGS
========================= */

renderer.shadowMap.enabled = true

scene.background =
  new THREE.Color(0x111111)


/* =========================
   VRM
========================= */

let currentVRM = null

let mixer = null
let currentAction = null

const timer = new THREE.Timer()

const loader = new GLTFLoader()

loader.register((parser) => {
  return new VRMLoaderPlugin(parser)
})

loader.load(

  '/waifu.vrm',

  (gltf) => {

    currentVRM =
      gltf.userData.vrm

    scene.add(
      currentVRM.scene
    )

    currentVRM.scene.position.y = -1

    mixer =
      new THREE.AnimationMixer(
        currentVRM.scene
      )

    setupPose()

    console.log('VRM loaded.')

    animate()
  },

  undefined,

  (error) => {
    console.error(error)
  }
)



/* =========================
   DEFAULT POSE
========================= */

function setupPose() {

  if (!currentVRM) return

  const humanoid =
    currentVRM.humanoid

  const leftUpperArm =
    humanoid.getRawBoneNode(
      'leftUpperArm'
    )

  const rightUpperArm =
    humanoid.getRawBoneNode(
      'rightUpperArm'
    )

  const leftLowerArm =
    humanoid.getRawBoneNode(
      'leftLowerArm'
    )

  const rightLowerArm =
    humanoid.getRawBoneNode(
      'rightLowerArm'
    )

  if (leftUpperArm) {
    leftUpperArm.rotation.z =
      THREE.MathUtils.degToRad(-65)
  }

  if (rightUpperArm) {
    rightUpperArm.rotation.z =
      THREE.MathUtils.degToRad(65)
  }

  if (leftLowerArm) {
    leftLowerArm.rotation.z =
      THREE.MathUtils.degToRad(-8)
  }

  if (rightLowerArm) {
    rightLowerArm.rotation.z =
      THREE.MathUtils.degToRad(8)
  }
}



/* =========================
   MIXAMO ANIMATIONS
========================= */

function playAnimation(clip) {

  if (!mixer) return

  if (currentAction) {
    currentAction.fadeOut(0.5)
  }

  currentAction =
    mixer.clipAction(clip)

  currentAction
    .reset()
    .fadeIn(0.5)
    .play()
}

export async function loadAnimationFromPath(path) {

  if (!currentVRM) return

  const clip =
    await loadMixamoAnimation(
      path,
      currentVRM
    )

  playAnimation(clip)
}



/* =========================
   DRAG & DROP FBX
========================= */

document.addEventListener(
  'dragover',
  (e) => e.preventDefault()
)

document.addEventListener(
  'drop',

  async (e) => {

    e.preventDefault()

    const file =
      e.dataTransfer.files[0]

    if (
      !file ||
      !file.name.endsWith('.fbx')
    ) {
      console.warn(
        'Please drop an FBX file'
      )
      return
    }

    try {

      const clip =
        await loadMixamoAnimation(
          file,
          currentVRM
        )

      playAnimation(clip)

      console.log(
        'Animation loaded:',
        clip.name
      )

    } catch (err) {

      console.error(
        'Failed to load animation:',
        err
      )
    }
  }
)



/* =========================
   WEBSOCKET
========================= */

socket.onopen = () => {
  console.log(
    'Connected to backend.'
  )
}

socket.onclose = () => {
  console.log(
    'Disconnected from backend.'
  )
}

socket.onmessage = (event) => {

  const data =
    JSON.parse(event.data)

  console.log(data)

  if (
    data.type !== 'ai_response'
  ) return

  removeThinking()

  showSubtitle(data.text)

  setExpression(
    currentVRM,
    data.emotion
  )

  startTalking()

  setTimeout(() => {

    stopTalking(currentVRM)

  }, 4000)
}

createChatBox((message) => {

  showThinking()

  socket.send(JSON.stringify({

    type: 'user_message',

    text: message
  }))
})



/* =========================
   MAIN LOOP
========================= */

function animate() {

  requestAnimationFrame(animate)

  timer.update()

  const delta =
    timer.getDelta()

  if (currentVRM) {

    currentVRM.update(delta)

    if (mixer) {
      mixer.update(delta)
    }

    updateBlink(
      currentVRM,
      delta
    )

    updateLipSync(
      currentVRM
    )

    if (
      !currentAction ||
      !currentAction.isRunning()
    ) {

      updateIdle(
        currentVRM,
        delta
      ) 
    }
  }

  controls.update()

  renderer.render(
    scene,
    camera
  )
}



/* =========================
   RESIZE
========================= */

window.addEventListener(

  'resize',

  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight

    camera.updateProjectionMatrix()

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    )
  }
)