let thinkingBox = null

export function showThinking() {

  removeThinking()

  thinkingBox = document.createElement('div')

  thinkingBox.className = 'thinking-box'

  thinkingBox.innerText = 'Aiko is thinking...'

  document.body.appendChild(thinkingBox)
}

export function removeThinking() {

  if (thinkingBox) {

    thinkingBox.remove()

    thinkingBox = null
  }
}