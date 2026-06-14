const socket = new WebSocket("ws://localhost:8765")

socket.onopen = () => {
    console.log("Connected to backend.")
}

socket.onmessage = (event) => {
    const data = JSON.parse(event.data)

    console.log(data)
}

socket.onclose = () => {
    console.log("Disconnected from backend.")
}

export default socket