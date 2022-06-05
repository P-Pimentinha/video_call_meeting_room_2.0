

export function event_process_for_signaling_server(){
    socket = io.connect();
    socket.on("connect", () =>{
        alert("I am exported")
    })
    }


