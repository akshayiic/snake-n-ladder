export const Events = {
  SET_POSITION: "set-position",
  GET_POSITION: "get-position",
  JOIN_ROOM: "join-room",
  LEAVE_ROOM: "leave-room",
  CREATE_ROOM: "create-room",
  GET_ROOM: "get-room",
  GET_ROOMS_USERS: "get-rooms-users",
};

type RoomUsersPayload = { users: string[] };

class SocketConnection {
  private ws?: WebSocket;
  private isConnected = false;

  async connect(url: string) {
    if (this.ws) {
      this.ws.close();
    }
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("✅ Connected to", url);
      this.isConnected = true;
    };

    this.ws.onclose = () => {
      console.log("❌ Disconnected");
      this.isConnected = false;
    };

    this.ws.onerror = (err) => {
      console.error("⚠️ WebSocket error", err);
      this.isConnected = false;
    };
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not open. Message not sent:", message);
    }
  }

  getRooms() {
    if (!this.ws) return;
    this.send({
      event: Events.GET_ROOM,
      payload: null,
    });
  }

  getConnection() {
    return this.isConnected;
  }

  listenForRooms(
    onRooms: (rooms: { roomId: string; users: string[] }[]) => void
  ) {
    if (!this.ws) return;

    const handler = (event: MessageEvent) => {
      let parsed: any;
      try {
        parsed =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch (e) {
        console.warn("Bad JSON:", event.data);
        return;
      }

      const envelope = parsed?.data ?? parsed;
      if (envelope?.event !== "rooms") return;

      const rooms = envelope?.payload?.rooms;
      if (Array.isArray(rooms)) {
        onRooms(rooms);
      } else {
        console.warn("Unexpected rooms payload:", envelope?.payload);
      }
    };

    this.ws.addEventListener("message", handler);

    return () => this.ws?.removeEventListener("message", handler);
  }

  joinRoom(roomId: string, userId: string) {
    if (!this.ws) return;
    if (!roomId || !userId) return;

    this.send({
      event: Events.JOIN_ROOM,
      payload: {
        roomId,
        userId,
      },
    });
  }

  createRoom(roomId: string) {
    if (!this.ws) return;

    this.send({
      event: Events.CREATE_ROOM,
      payload: {
        roomId,
      },
    });
  }

  getRoomUsers(roomId: string) {
    if (!this.ws) return;
    this.send({
      event: Events.GET_ROOMS_USERS,
      payload: {
        roomId,
      },
    });
  }

  listenForRoomUsers(onUsers: (users: string[]) => void) {
    if (!this.ws) return;

    const handler = (event: MessageEvent) => {
      let parsed: any;
      try {
        parsed =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        console.warn("Bad JSON:", event.data);
        return;
      }

      const envelope = parsed?.data ?? parsed;
      if (envelope?.event !== "rooms-users") return;

      const payload: RoomUsersPayload | undefined = envelope?.payload;
      const users = payload?.users;
      if (Array.isArray(users)) {
        onUsers(users);
      } else {
        console.warn("Unexpected users payload:", payload);
      }
    };

    this.ws.addEventListener("message", handler);
    return () => this.ws?.removeEventListener("message", handler);
  }

  listenForPosition(onPosition: (position: number) => void) {
    if (!this.ws) return;

    const handler = (event: MessageEvent) => {
      let parsed: any;
      try {
        parsed =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        console.warn("Bad JSON:", event.data);
        return;
      }

      const envelope = parsed?.data ?? parsed;
      if (envelope?.event !== "set-position") return;

      const position = envelope?.payload?.position;
      if (typeof position === "number") {
        onPosition(position);
      } else {
        console.warn("Unexpected position payload:", envelope?.payload);
      }
    };

    this.ws.addEventListener("message", handler);
    return () => this.ws?.removeEventListener("message", handler);
  }

  setPositionForUser(userId: string, position: number) {
    if (!this.ws) return;
    this.send({
      event: Events.SET_POSITION,
      payload: {
        userId,
        position,
      },
    });
  }
}

export const socket = new SocketConnection();
