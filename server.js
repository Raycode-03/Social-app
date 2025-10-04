 // socket.ts
import next from "next";
import { createServer } from "node:http";

import { Server  } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";                  // listen on all interfaces
const port = process.env.PORT || 3000;
export let io;
const app = next({ dev  , hostname , port});
const handler = app.getRequestHandler();
app.prepare().then(()=>{
  const httpServer = createServer(handler);
  const io = new Server(httpServer)
  io.on("connection" , (socket) =>{
      console.log("Socket connected");
  })
  httpServer.once("error" , (err)=>{
    console.error(err)
    process.exit(1)
  })
  .listen(port,()=>{
    console.log(`> Ready on http://${hostname}:${port}`);
  })
})

