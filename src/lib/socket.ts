import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocket(server: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/api/socket',
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join:room', (room: string) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function emitLeadCreated(lead: object) {
  if (io) io.emit('lead:created', lead);
}

export function emitLeadUpdated(lead: object) {
  if (io) io.emit('lead:updated', lead);
}

export function emitLeadAssigned(data: { lead: object; agentId: string }) {
  if (io) {
    io.emit('lead:assigned', data);
    io.to(`agent:${data.agentId}`).emit('lead:assigned:me', data);
  }
}

export function emitLeadDeleted(leadId: string) {
  if (io) io.emit('lead:deleted', { id: leadId });
}
