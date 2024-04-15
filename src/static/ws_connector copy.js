import { io } from "socket.io-client";

class WsConnector {
  constructor(config, emitter)  {
    this.vue_client_emitter = emitter
    this.config = config

    this.socket = io();
    this.socket.on("error", this.handleError.bind(this));
    this.socket.on("connect_error", this.handleConnectError.bind(this));
    this.socket.on("connect", this.handleConnect.bind(this));
    this.socket.on("message", this.handleMessage.bind(this));
    this.socket.on("disconnect", this.handleDisconnect.bind(this));
    this.socket.on("close", this.handleClose.bind(this));

    this.pingInterval = null;
  }

  handleConnect() {
    this.vue_client_emitter.emit('log', { logLevel: this.config['logDebug'], function: 'handleConnect', message: 'Socket connected' });
    this.ping();
  }

  handleMessage(message) {
    var inputJson = message.data;
    try {
      this.vue_client_emitter.emit("notification", { type: "system", message: inputJson["value"],inputJson: inputJson })
    } catch (error) {
      console.error('Error in the emitter: ' + error + " trace:" + error.stack);
      this.vue_client_emitter.emit("log", { logLevel: this.config["logError"], function: "handleMessage", message: "Exception:" + error + " trace:" + error.stack });
    }
    
  }

  handleConnectError(error) {
    this.vue_client_emitter.emit('log', { logLevel: this.config['logError'], function: 'handleConnectError', message: 'Connection Error: ' + error.toString() });
    this.vue_client_emitter.emit('notification', { type: "system", message: "Connection Error: " + error.toString()});
  }

  handleError(error) {
    this.vue_client_emitter.emit('log', { logLevel: this.config['logError'], function: 'handleError', message: 'Error: ' + error.toString() });
    this.vue_client_emitter.emit('notification', { type: "system", message: "Error: " + error.toString()});
  }

  handleDisconnect() {
    this.vue_client_emitter.emit('log', { logLevel: this.config['logError'], function: 'handleDisconnect', message: 'Socket disconnected' });
    // Clear the ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  handleClose(code, reason) {
    this.vue_client_emitter.emit('log', { logLevel: this.config['logError'], function: 'handleClose', message: `Socket connection closed, code: ${code}, reason: ${reason}` });
  }
  

  emitMessage(requestJson) {
    this.socket.emit("message", requestJson);
  }

  ping() {
    // Send a ping message every 30 seconds to keep the connection alive
    if (this.pingInterval) {
      // Clear any existing ping interval
      clearInterval(this.pingInterval);
    }
    this.pingInterval = setInterval(() => {
      try {
        this.emitMessage('ping');
      } catch (error) {
        this.vue_client_emitter.emit('log', { logLevel: this.config['logError'], function: 'ping', message: 'Error during ping:' + error });
      }
    }, 10000);
  }
}

export default WsConnector;
