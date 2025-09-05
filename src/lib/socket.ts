// socket.ts
class SocketConnection {
  private ws?: WebSocket;

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("✅ Connected to", url);
    };

    this.ws.onclose = () => {
      console.log("❌ Disconnected");
    };

    this.ws.onerror = (err) => {
      console.error("⚠️ WebSocket error", err);
    };
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not open. Message not sent:", message);
    }
  }

  onMessage(callback: (data: any) => void) {
    if (!this.ws) return;
    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        callback(parsed);
      } catch {
        callback(event.data);
      }
    };
  }
}

export const socket = new SocketConnection();
