const WS = require('ws');

const PORT = 3001;
const MY_ADDRESS = "ws://localhost:3001";
const server = new WS.Server({ port: PORT });

let opened = []; // ex) opened = [{ socket: WebSocket { ... }, address: "ws://localhost:3001" }, { socket: WebSocket { ... }, address: "ws://localhost:3002" }]
let connected = []; // ex) ["ws://localhost:3001", "ws://localhost:3002", ...]

console.log("John listening on PORT", PORT);

server.on("connection", (socket) => {
  // new peer connected
  socket.on("message", message => {
    const _message = JSON.parse(message);
    console.log(_message);

    switch(_message.type) {
      case "TYPE_HANDSHAKE":
          // (peer discovery) received peer list
          const nodes = _message.data;
          // try to connect to them
          nodes.forEach(node => connect(node));
    }
  })
})

function connect(address) {
  if (!connected.find(peerAddress => peerAddress === address) && address !== MY_ADDRESS) {
    const socket = new WS(address);

    // When the connection is successfully opened:
    socket.on("open", () => {
      // 1. Send a TYPE_HANDSHAKE message to the peer (my own address + peers).
      socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [MY_ADDRESS, ...connected])));

      // 2. Notify all previously connected peers about the new node (address).
      opened.forEach(node => node.socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [address]))));

      if (!opened.find(peer => peer.address === address) && address !== MY_ADDRESS) {
        opened.push({ socket, address });
        connected.push(address);
      }
    });

    socket.on("close", () => {
      opened.splice(connected.indexOf(address), 1);
      connected.splice(connected.indexOf(address), 1);
    });
  }
}

function produceMessage(type, data) {
  return { type, data };
}

function sendMessage(message) {
  // broadcast a message to all currently connected peers
  opened.forEach(node => {
    node.socket.send(JSON.stringify(message));
  })
}

setInterval(() => {
  sendMessage(produceMessage("MESSAGE", "Hello from John !!"));
}, 10000);


process.on("uncaughtException", err => console.log(err));