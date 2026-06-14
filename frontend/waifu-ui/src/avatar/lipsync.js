let talking = false

export function startTalking() {
    talking = true
}

export function stopTalking(vrm) {

    talking = false

    if (!vrm || !vrm.expressionManager) return

    vrm.expressionManager.setValue('aa', 0)
}

export function updateLipSync(vrm) {

    if (!talking) return

    if (!vrm || !vrm.expressionManager) return

    const mouthOpen =
        (Math.sin(Date.now() * 0.015) + 1) / 2

    vrm.expressionManager.setValue(
        'aa',
        mouthOpen * 0.8
    )
}