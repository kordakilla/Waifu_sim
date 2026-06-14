let subtitleElement = null
let subtitleTimeout = null

export function showSubtitle(text) {

  if (!subtitleElement) {

    subtitleElement =
      document.createElement('div')

    subtitleElement.className =
      'subtitle-box'

    document.body.appendChild(
      subtitleElement
    )
  }

  subtitleElement.textContent = text

  subtitleElement.classList.add('show')

  clearTimeout(subtitleTimeout)

  const duration =
    Math.max(
      5000,
      text.length * 90
    )

  subtitleTimeout =
    setTimeout(() => {

      subtitleElement.classList.remove(
        'show'
      )

    }, duration)
}