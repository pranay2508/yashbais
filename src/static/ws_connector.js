/* eslint-disable */
// import { io } from "socket.io-client";

class WsConnector {
  constructor(config, emitter) {
    this.vue_client_emitter = emitter
    this.config = config

    this.connect();
    // this.socket = io();
    // this.socket.on("error", this.handleError.bind(this));
    // this.socket.on("connect_error", this.handleConnectError.bind(this));
    // this.socket.on("connect", this.handleConnect.bind(this));
    // this.socket.on("message", this.handleMessage.bind(this));
    // this.socket.on("disconnect", this.handleDisconnect.bind(this));
    // this.socket.on("close", this.handleClose.bind(this));

    this.pingInterval = null;
  }

  connect() {
    this.socket = new WebSocket(this.config['WEBSOCKET_URL']);
    this.socket.addEventListener('open', this.handleConnect.bind(this));
    this.socket.addEventListener('message', this.handleMessage.bind(this));
    this.socket.addEventListener('close', this.handleClose.bind(this));
    this.socket.addEventListener('error', this.handleError.bind(this));
  }

  handleConnect() {
    this.vue_client_emitter.emit('log', { logLevel: this.config['logDebug'], function: 'handleConnect', message: 'Socket connected' });
    this.ping();
    this.vue_client_emitter.emit('status', { type: 'info', message: 'Succesfully connected' });
  }

  handleMessage(message) {
    try {
      var input_json = JSON.parse(message.data);
      if (input_json.message === "pong") {

      }else{
        this.vue_client_emitter.emit("notification", { type: "system", message: input_json["value"], inputJson: input_json })
      }
      
    } catch (error) {
      console.error('Error in the emitter: ' + error + " trace:" + error.stack);
      this.vue_client_emitter.emit("log", { logLevel: this.config["logError"], function: "handleMessage", message: "Exception:" + error + " trace:" + error.stack });
      this.vue_client_emitter.emit('status', { type: 'error', message: 'Error during new message processing: ' + error.toString() });
    }

  }

  handleConnectError(error) {
    this.vue_client_emitter.emit('log', { logLevel: this.config['logError'], function: 'handleConnectError', message: 'Connection Error: ' + error.toString() });
    this.vue_client_emitter.emit('status', { type: 'error', message: 'Socket connection error: ' + error.toString() });
  }

  handleError(error) {
    this.vue_client_emitter.emit('log', { logLevel: this.config['logError'], function: 'handleError', message: 'Error: ' + error.toString() });
    this.vue_client_emitter.emit('status', { type: 'error', message: 'Socket error: ' + error.toString() });
  }

  handleDisconnect() {
    this.vue_client_emitter.emit('log', { logLevel: this.config['logError'], function: 'handleDisconnect', message: 'Socket disconnected' });
    this.vue_client_emitter.emit('status', { type: 'error', message: 'Socket disconnected' });

    // Clear the ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  handleClose(code, reason) {
    this.vue_client_emitter.emit('log', { logLevel: this.config['logError'], function: 'handleClose', message: `Socket connection closed, code: ${code}, reason: ${reason}` });
    this.vue_client_emitter.emit('status', { type: 'error', message: `Socket connection closed, code: ${code}, reason: ${reason}` });
    // Retry connection in 5 seconds
    setTimeout(() => {
      this.connect();
    }, 5000);
  }

  async emitMessage(requestJson, retryCount = 0) {
    try {
      this.socket.send(JSON.stringify(requestJson));
    } catch (error) {
      if (retryCount < this.config['wsSendMaxRetries']) {
        this.vue_client_emitter.emit('status', { type: 'error', message: 'Error sending message - retrying' });
        // If message send fails, wait for a while then retry
        setTimeout(() => {
          this.emitMessage(requestJson, retryCount + 1);
        }, this.config['wsSendRetryDelay'] * Math.pow(2, retryCount));
      } else {
        // If retries exhausted, do something (e.g., alert the user, log the error)
        this.vue_client_emitter.emit('log', { logLevel: this.config['logError'], function: 'emitMessage', message: 'Max retries reached for message send.' });
        this.vue_client_emitter.emit('status', { type: 'error', message: 'Max retries reached for message send.' });
      }
    }
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
