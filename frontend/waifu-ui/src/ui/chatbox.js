export function createChatBox(sendMessage) {

  const container =
    document.createElement('div')

  container.className =
    'chat-input-container'

  const input =
    document.createElement('input')

  input.type = 'text'

  input.placeholder =
    'Type your message...'

  input.className =
    'chat-input'

  const button =
    document.createElement('button')

  button.innerText = '➤'

  button.className =
    'chat-send-button'

  function handleSend() {

    const text =
      input.value.trim()

    if (!text) return

    sendMessage(text)

    input.value = ''
  }

  button.onclick =
    handleSend

  input.addEventListener(
    'keydown',
    (e) => {

      if (e.key === 'Enter') {
        handleSend()
      }
    }
  )

  container.appendChild(input)
  container.appendChild(button)

  document.body.appendChild(container)
}