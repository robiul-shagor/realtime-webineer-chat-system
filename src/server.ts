import express, { Application } from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "https";
import path from "path";
import fs from "fs";

const options = {
  key: fs.readFileSync("/home/admin/conf/web/ssl.webineer.ntwasl.com.key", "utf8"),
  cert: fs.readFileSync("/home/admin/conf/web/ssl.webineer.ntwasl.com.crt", "utf8"),
  ca: fs.readFileSync("/home/admin/conf/web/ssl.webineer.ntwasl.com.ca", "utf8")
};

export class Server {
  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIOServer;

  private activeSockets: string[] = [];

  private readonly DEFAULT_PORT = 5005;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.app = express();

    this.httpServer = createServer(options, this.app);
    this.io = socketIO(this.httpServer);


    this.configureApp();
    this.configureRoutes();
    this.handleSocketConnection();
  }

  private configureApp(): void {
    this.app.use(express.static(path.join(__dirname, "../public")));
  }

  private configureRoutes(): void {
    this.app.get("/", (req, res) => {
      res.sendFile("index.html");
    });
  }

  private handleSocketConnection(): void {
    this.io.on("connection", socket => {
      // Join Room Process
      socket.on('join-room', (roomId, userID) => {
        socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-connected', userID);

        socket.on("message", (message, username) => {
          socket.to(roomId).emit("createMessage", message, userID, username);
        });
      });

      // Calling System
      const existingSocket = this.activeSockets.find(
        existingSocket => existingSocket === socket.id
      );

      if (!existingSocket) {
        this.activeSockets.push(socket.id);

        socket.emit("update-user-list", {
          users: this.activeSockets.filter(
            existingSocket => existingSocket !== socket.id
          )
        });

        socket.broadcast.emit("update-user-list", {
          users: [socket.id]
        });
      }

      socket.on("call-user", (data: any) => {
        socket.to(data.to).emit("call-made", {
          offer: data.offer,
          socket: socket.id
        });
      });

      socket.on("make-answer", data => {
        socket.to(data.to).emit("answer-made", {
          socket: socket.id,
          answer: data.answer
        });
      });

      socket.on("reject-call", data => {
        socket.to(data.from).emit("call-rejected", {
          socket: socket.id
        });
      });

      // socket.on("chat message", data => {
      //   this.io.emit("chat message", data);
      // });

      socket.on("typing", data => {
        socket.broadcast.emit("typing", data);
      });

      socket.on("disconnect", () => {
        this.activeSockets = this.activeSockets.filter(
          existingSocket => existingSocket !== socket.id
        );
        socket.broadcast.emit("remove-user", {
          socketId: socket.id
        });
      });
    });
  }

  public listen(callback: (port: number) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }
}
