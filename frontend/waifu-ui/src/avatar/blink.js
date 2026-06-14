let blinkTimer = 0

export function updateBlink(vrm, delta) {

    if (!vrm || !vrm.expressionManager) return

    blinkTimer += delta

    const blinkInterval = 4

    const blinkDuration = 0.12

    const phase = blinkTimer % blinkInterval

    if (phase < blinkDuration) {

        const strength =
            Math.sin((phase / blinkDuration) * Math.PI)

        vrm.expressionManager.setValue('blink', strength)

    } else {

        vrm.expressionManager.setValue('blink', 0)
    }
}