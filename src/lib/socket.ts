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
  ws?: WebSocket;
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

  listenRoomPositions(
    onUpdate: (u: { userId: string; position: number }) => void
  ) {
    if (!this.ws) return;

    const toNum = (v: unknown): number | null => {
      const n = typeof v === "string" ? Number(v) : (v as number);
      return Number.isFinite(n) ? n : null;
    };

    const handler = (event: MessageEvent) => {
      let parsed: any;
      try {
        parsed =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      const msg = parsed?.data ?? parsed;

      if (msg?.event === "get-room-user-position") {
        const list: any[] = msg?.payload?.positions ?? [];
        if (Array.isArray(list)) {
          for (const item of list) {
            const userId = item?.userId;
            const num = toNum(item?.position);
            if (typeof userId === "string" && num !== null) {
              const clamped = Math.max(1, Math.min(100, num));
              onUpdate({ userId, position: clamped });
            }
          }
        }
        return;
      }

      const list2: any[] = msg?.payload?.positions;
      if (Array.isArray(list2)) {
        for (const item of list2) {
          const userId = item?.userId;
          const num = toNum(item?.position);
          if (typeof userId === "string" && num !== null) {
            const clamped = Math.max(1, Math.min(100, num));
            onUpdate({ userId, position: clamped });
          }
        }
      }
    };

    this.ws.addEventListener("message", handler);
    return () => this.ws?.removeEventListener("message", handler);
  }

  listenForPositionUpdates(
    onUpdate: (u: { userId: string; position: number }) => void
  ) {
    if (!this.ws) return;

    const handler = (event: MessageEvent) => {
      let parsed: any;
      try {
        parsed =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      const msg = parsed?.data ?? parsed;

      if (msg?.event === "set-position") {
        const { userId, position } = msg?.payload ?? {};
        if (typeof userId === "string" && Number.isFinite(+position)) {
          const clamped = Math.max(1, Math.min(100, Number(position)));

          onUpdate({ userId, position: clamped });
        }
        return;
      }

      if (typeof msg?.userId === "string" && Number.isFinite(msg?.position)) {
        const clamped = Math.max(1, Math.min(100, Number(msg.position)));
        onUpdate({ userId: msg.userId, position: clamped });
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
