export function setExpression(vrm, emotion) {

    if (!vrm) return

    const manager = vrm.expressionManager

    if (!manager) return

    const expressions = [
        'happy',
        'angry',
        'sad',
        'relaxed',
        'surprised'
    ]

    expressions.forEach((expr) => {
        manager.setValue(expr, 0)
    })

    switch (emotion) {

        case 'happy':
            manager.setValue('happy', 1)
            break

        case 'angry':
            manager.setValue('angry', 1)
            break

        case 'sad':
            manager.setValue('sad', 1)
            break

        case 'embarrassed':
            manager.setValue('relaxed', 1)
            break

        case 'surprised':
            manager.setValue('surprised', 1)
            break
    }

    console.log("Expression:", emotion)
}