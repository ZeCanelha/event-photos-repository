import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { Express } from "express";
import { redis } from "lib/redis";

let io: Server;

export const initSocket = (app: Express) => {
  const httpServer = createServer(app);
  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  // TODO: Add socket middleware for auth and more, like helmet and so on

  io.on("connection", (socket: Socket) => {
    console.log(`Client connected to socket server: ${socket.id}`);

    // Listener to subscribe on a given eventId
    socket.on("subscribe", async (eventId: string) => {
      // Subscribe to redis for events update. Will publish event updates on this channel
      try {
        await redis.subscribe(`events:${eventId}:updates`);

        redis.on("message", (channel, message) => {
          // On events to the subscribed channel, report back through websockets
          socket.emit("event-update", JSON.parse(message));
        });
      } catch (error: any) {
        console.error("Error subscribing to redis pub: " + error?.message);
      }
    });

    socket.on("disconnect", async (eventId) => {
      await redis.unsubscribe(`events:${eventId}:updates`);
    });
  });

  return httpServer;
};
