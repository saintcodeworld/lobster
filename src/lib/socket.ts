import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { redis } from './redis'

let io: SocketIOServer | null = null

export const initSocketServer = (httpServer: HTTPServer) => {
  if (io) {
    return io
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('subscribe:match', async (matchId: string) => {
      socket.join(`match:${matchId}`)
      
      const poolData = await redis.get(`pool:${matchId}`)
      if (poolData) {
        socket.emit('pool:update', JSON.parse(poolData))
      }
    })

    socket.on('unsubscribe:match', (matchId: string) => {
      socket.leave(`match:${matchId}`)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}

export const getSocketServer = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized')
  }
  return io
}

export const emitPoolUpdate = (matchId: string, poolData: any) => {
  if (io) {
    io.to(`match:${matchId}`).emit('pool:update', poolData)
    redis.set(`pool:${matchId}`, JSON.stringify(poolData), 'EX', 60)
  }
}

export const emitMatchUpdate = (matchId: string, matchData: any) => {
  if (io) {
    io.to(`match:${matchId}`).emit('match:update', matchData)
  }
}
