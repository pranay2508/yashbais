/* eslint-disable */
// Description: This file contains the MessageHandler class.
class MessageHandler {
  constructor(config, emitter) {
    this.config = config;
    this.cellCallbackArray = new Map();
    this.vue_client_mitter = emitter;
  }

  updateMessage(wsConnector, inputJson, message, includeContext) {

    if (!inputJson['inputs']) {
      inputJson['inputs'] = {};
    }

    inputJson['key'] = message
    inputJson['inputs']['key'] = message
    inputJson['requestStatus'] = this.config['requestNew']

    wsConnector.emitMessage(inputJson);
    this.vue_client_mitter.emit("notification", {
      type: "user",
      message: inputJson.key,
      inputJson: inputJson,
    })

    return inputJson;

  }


  sendMessage(ws_connector, message, workflow_name, cell_type, web_socket_user_id) {
    let input_json = {};
    try {
      input_json = this.createRequest(
        message,
        workflow_name,
        cell_type,
        web_socket_user_id
      );
      this.vue_client_mitter.emit("log", {
        logLevel: this.config["logDebug"],
        function: "sendMessage",
        message: "request Json:" + JSON.stringify(input_json),
      });
    } catch (error) {
      this.vue_client_mitter.emit("log", {
        logLevel: this.config["logError"],
        function: "sendMessage",
        message: "Exception:" + error + " trace:" + error.stack,
      });
    }

    ws_connector.emitMessage(input_json);
    this.vue_client_mitter.emit("notification", {
      type: "user",
      message: input_json.key,
      inputJson: input_json,
    })

    return input_json;
  }

  createRequest(input, workflow_name, cell_type, web_socket_user_id) {
    var args_map = new Map();
    args_map.set("key", input);
    args_map.set("tag", "");
    args_map.set("tagGroup", this.config["outputFormatText"]); //TODO check if we shoudl default this
    args_map.set("dataVersion", this.config["requestDataVersionDefault"]);
    args_map.set("workflowName", workflow_name);
    args_map.set("formatterName", "default");
    args_map.set("functionName", cell_type);
    args_map.set("dataType", this.config["dataTypeElement"]);
    args_map.set("userValue", this.config["naValue"]);
    var inputs = this.mapToJson(args_map);

    //sigle chat change
    // var callback_key = "cell_type + this.uuidv4()";
    var callback_key = ""
    if(cell_type == this.config['elementAutoComplete'])
    {
      callback_key = cell_type + this.uuidv4();
    }
    else{
      callback_key = "Chat"
    }


    return this.getRequestJson(
      inputs["key"],
      inputs["tag"],
      inputs["tagGroup"],
      inputs["dataVersion"],
      this.config["requestTypeGet"], //check if still need this. should be able to get from inputs
      callback_key,
      inputs
    );
  }

  getRequestJson(
    key,
    tag,
    tagGroup,
    dataVersion,
    requestType,
    callbackKey,
    inputs
  ) {
    var json_message = {
      event: this.config["eventKeyValueChanged"],
      value: this.config["naValue"],
      key: key,
      tag: tag,
      tagGroup: tagGroup,
      dataVersion: dataVersion,
      requestType: requestType,
      callbackKey: callbackKey,
      actionInputs: {},
      inputs: inputs,
      requestStatus: this.config["requestNew"],
      comment: "",
      webSocketUserId: this.web_socket_user_id,
    };
    return json_message;
  }

  //basic helper method
  mapToJson(inputMap) {
    let obj = {};
    inputMap.forEach(function (value, key) {
      obj[key] = value;
    });
    return obj;
  }

  uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

}

export default MessageHandler;