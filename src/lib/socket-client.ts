'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
  }
  return socket
}

export const subscribeToMatch = (matchId: string, onUpdate: (data: any) => void) => {
  const socket = getSocket()
  
  socket.emit('subscribe:match', matchId)
  socket.on('pool:update', onUpdate)
  socket.on('match:update', onUpdate)
  
  return () => {
    socket.emit('unsubscribe:match', matchId)
    socket.off('pool:update', onUpdate)
    socket.off('match:update', onUpdate)
  }
}
