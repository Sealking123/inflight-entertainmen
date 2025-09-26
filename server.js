const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Food Order System ---
let orders = []; // { id, item, type, status, message }

io.on('connection', (socket) => {
  // Passenger places order
  socket.on('place-order', (order) => {
    order.id = Date.now() + '-' + Math.floor(Math.random()*10000);
    order.status = "Pending";
    order.message = "";
    orders.push(order);
    io.emit('new-order', order); // Update all admins
  });

  // Admin gets all current orders on connect
  socket.on('get-orders', () => {
    socket.emit('order-list', orders);
  });

  // Admin updates order status
  socket.on('order-action', ({id, action, message}) => {
    const order = orders.find(o => o.id === id);
    if(order) {
      if(action === "accept") {
        order.status = "Accepted";
        order.message = "";
      }
      if(action === "deny") {
        order.status = "Denied";
        order.message = message || "Order denied";
      }
      if(action === "cancel") {
        order.status = "Cancelled";
        order.message = message || "Order cancelled";
      }
      io.emit('order-update', order); // Update all clients
    }
  });

  // --- Existing admin-command logic ---
  socket.on('admin-command', (cmd) => {
    socket.broadcast.emit('screen-command', cmd);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
