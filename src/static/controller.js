/* eslint-disable */
import { reactive, inject } from "vue";
import WsConnector from "@/static/ws_connector.js";
import MessageHandler from "@/static/message_handler.js";
import TileHandler from "@/static/tile_handler.js";

class Controller {
  constructor(config, emitter) {
    this.state = reactive({
      chat_messages: [],
      log_messages: [],
      tiles: {},
      deleted_tiles: {},
      highest_z_index: 0,
    });
    this.log_level = config["logInfo"]; //TODO need to make this configurable
    this.config = config;
    this.web_socket_user_id = "vue_client"; //TODO should be config driven
    this.llm_models = this.config["llmModels"];
    this.selected_llm_model_name = "SureliaGptWorkflow"; //TODO should be config driven
    this.selected_llmModel_workflow = "sureliaBiChainInternalAndArchive";
    this.last_request_json = { conversationId: "#N/A", callbackKey: "#N/A" }; //TODO check if we need this

    //comfig vue client pubSub  
    this.vue_client_emitter = emitter;
    this.vue_client_emitter.on("notification", (notification) => {
      this.processNotification(notification);
    });
    this.vue_client_emitter.on("log", (logData) => {
      this.log(logData.logLevel, logData.function, logData.message);
    });

    this.message_handler = new MessageHandler(config, emitter);
    this.ws_connector = new WsConnector(config, emitter);
    this.tile_handler = new TileHandler(config, emitter, this.state.tiles, this.state.deleted_tiles)

    //add the chat tile to the tiles array so it is displayed on startup
    this.tile_handler.createChatTile();
  }

  processNotification(notification) {
    if (
      typeof notification != "string" &&
      notification["inputJson"] &&
      notification["inputJson"]["actionInputs"]
    ) {
      if (notification["inputJson"]["callbackKey"].startsWith(this.config["elementAutoComplete"])) {
        if (notification["inputJson"]['autoCompleteResult']) {
          this.vue_client_emitter.emit("autoCompleteUpdate", notification["inputJson"]);
        }
      }
      else
        this.tile_handler.updateTile(notification["inputJson"]);
    }
  }

  updateMessage(input_json, message, include_context = true) {
    this.last_request_json = this.message_handler.updateMessage(
      this.ws_connector,
      input_json,
      message,
      include_context
    );
  }

  sendMessage(message, cell_type, workflow_name) {
    this.last_request_json = this.message_handler.sendMessage(
      this.ws_connector,
      message,
      workflow_name,
      cell_type,
      this.web_socket_user_id
    );
    return this.last_request_json
  }

  selectLlmModel(selected_model_name) {
    // Display the description in the chat
    let selected_model = this.llm_models.find(
      (model) => model.name === selected_model_name
    );
    let description = selected_model
      ? selected_model.description
      : "model_not_found";
    this.selected_llm_model_name = selected_model
      ? selected_model.name
      : "model_not_found";
    this.selected_llmModel_workflow = selected_model
      ? selected_model.workflowName
      : "model_not_found";

    //TODO change type to notification
    this.vue_client_emitter.emit("notification", {
      type: "system",
      message: description,
    });
  }

  log(log_level, fct, msg) {
    try {
      if (
        this.config["logLevel"] != this.config["logDebug"] &&
        this.log_level == this.config["logDebug"]
      )
        return;

      let new_log_message = {
        type: "log",
        logLevel: log_level,
        function: fct,
        message: msg,
      };

      //console.log("log: " + JSON.stringify(new_log_message));
      this.state.log_messages.push(new_log_message);
    } catch (error) {
      var log_msg =
        "" +
        this.config["logError"] +
        " error logging fct: " +
        fct +
        " msg: " +
        msg +
        " exception " +
        error;
      console.log("log error: " + log_msg + " error" + error.stack);
    }
  }
}

export default Controller;
