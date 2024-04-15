<script setup>
/* eslint-disable */
//import custom components .. they are used in the below template section
import Chat from '@/components/chat.vue';
import Analysis from '@/components/analysis.vue';
// import Calculate from '@/components/calculate.vue';
// import PlaceOrder from '@/components/place_order.vue';
import FinalAnswer from '@/components/final_answer.vue';
import AiGeneratedCode from '@/components/ai_generated_code.vue';
import DefaultActionInput from '@/components/default_action_input.vue';
// import SolveMathEquationCode from '@/components/solve_math_equation_code.vue';

import interact from 'interactjs';
import { Table, Form, Input, Button } from 'ant-design-vue';
import { ref, onMounted, onUnmounted, defineProps, inject, nextTick } from 'vue';

// Define the component props and emits
const props = defineProps({
  id: String,
  content: Object,
  component: String,
});

const controller = inject('controller')
const vue_client_emitter = inject('emitter')
const config = inject('config');

var component = ref(props.component);
const notification = ref(props.content);
var input_json = ref(notification.value);

//HTML elements refs
const tile_ref = ref(null);
const edit_bar_ref = ref(null);
const chat_container_ref = ref(null);
const autocomplete_container_ref = ref(null);
const isInputEmpty = ref(true); 
const placeholder_ref = ref(null);
var textarea = ref(null);
var status_type = ref(null);
var status_message = ref(null);

let scrollable_content_ref = ref(null);
let highest_z_index = ref(0);

const MAX_TEXTAREA_ROWS = 16; // Maximum number of textarea rows
let textareaRows = ref(2); // Current number of textarea rows
let message = ref('');
let edit_bar_input_text = ref('')
var auto_complete = ref('');
var auto_complete_last_request_input_text = ref("")
var auto_complete_request_callback_key = ref("")
var last_auto_complete_request_timeout_id = ref(null)
const waiting_for_auto_complete = ref(false);

//init subscribers
vue_client_emitter.on('status', (status_update) => { processStatusUpdate(status_update) });
vue_client_emitter.on("tiles", (tile_update) => { processMessageUpdate(tile_update.tile); });
vue_client_emitter.on("updateChatTextField", (chat_input) => { processChatTextFieldUpdate(chat_input) });
//vue_client_emitter.on("autoCompleteUpdate", (auto_complete_update_input_json) => { processAutoCompleteUpdate(auto_complete_update_input_json) });


//message handlers
const processStatusUpdate = (status_update) => {
  status_type.value = status_update.type;
  status_message.value = status_update.message;
}

const processChatTextFieldUpdate = (chat_input) => {
  try {
    if (component.value === 'Chat') {
      var update_value = chat_input;
      nextTick(() => {
       
        edit_bar_ref.value.textContent = update_value
        edit_bar_ref.value.focus();
        sendAutoCompleteRequest()
        // edit_bar_input_text.value = update_value
      });
    }
  } catch (e) {
    console.log("error in processChatTextFieldUpdate" + e)
  }
};

const processAutoCompleteUpdate = (auto_complete_update_input_json) => {
  try {
    if (auto_complete_request_callback_key.value == auto_complete_update_input_json['callbackKey']) {
      if (edit_bar_ref.value.textContent.trim().length == 0) {
        //user input got deleted so no need for any delayed auto complete to be displayed.
        return
      }
      if (auto_complete_update_input_json['autoCompleteResult'] && auto_complete_update_input_json['autoCompleteResult'].trim().length > 0) {
        var update_value = auto_complete_update_input_json['autoCompleteResult']
        nextTick(() => {
          waiting_for_auto_complete.value = false
          auto_complete.value = edit_bar_ref.value.textContent.trim() + " " + update_value
          // auto_complete.value = edit_bar_input_text.value.trim() + " " + update_value
          setTimeout(() => {
            nextTick(() => {
              adjustChatInputElementSize();
            })
          }, 500);
        });
      }
    }
  } catch (e) {
    console.log("error in processAutoCompleteUpdate" + e)
  }
};

const processMessageUpdate = (tile) => {
  try {
    //check if got update for this tile
    console.log("Inside interactive_tile.processMessageUpdate() -> tile:");
    console.log(tile);
    if (input_json.value['callbackKey'] === tile.component) {
      input_json.value = tile.content;
      setTimeout(() => { scrollToBottom() }, 500);
    }
  } catch (e) {
    console.log("error in processMessageUpdate" + e)
  }
};

//send request functions
const sendMessage = () => {
  const trimmedMessage = edit_bar_ref.value.textContent.trim();
  console.log("Message: " + trimmedMessage);
  if (trimmedMessage.length === 0) return;
  console.log(input_json);
  //request from a chat tile to create new tile
  //TODO should find cleaner way to identify first question of chat
  if (input_json.value && input_json.value.inputs && input_json.value.inputs.workflowName === "Chat")
  {
    console.log("controller.sendMessage() called");
    controller.sendMessage(trimmedMessage, config['elementTile'], controller.selected_llmModel_workflow);
  } else {
    //request from current tile to update the message
    console.log("contoller.updateMessage() called");   
    controller.updateMessage(input_json.value, trimmedMessage);
  }
  
  nextTick(() => {
    edit_bar_ref.value.textContent = ""
    auto_complete.value = ""
    clearTimeout(last_auto_complete_request_timeout_id) //incase we still have a queued auto complete request
    waiting_for_auto_complete.value = false
    textareaRows.value = 2; // Reset the textarea row count to its original size after it possibly expanded
  });
  ;

};

const sendAutoCompleteRequest = () => {
  const input_text = edit_bar_ref.value.textContent.trim();
  // const input_text = edit_bar_input_text.value.trim()
  replaceAutoComplete(input_text)
  console.log(input_text)

  //need at least 2 chars to trigger auto complete 
  //TODO should be changed to 8 to make it less aggrssive 
  if (input_text.length <= 2) {
     console.log("input_text.length <= 2 return")
    return
  }
  else if (auto_complete_last_request_input_text.value == "") { //first request
    auto_complete_last_request_input_text.value = input_text
    console.log("auto_complete_last_request_input_text == '' return")
    return
  }
  else if (input_text.length < auto_complete_last_request_input_text.value.length) {
    nextTick(() => {
      auto_complete_last_request_input_text.value = input_text
      auto_complete.value = ''
      waiting_for_auto_complete.value = false
    })

    return
  }
  else if (Math.abs(auto_complete_last_request_input_text.value.length - input_text.length) <= 2) {
    console.log("Math.abs(auto_complete_last_request_input_text.length - input_text.length) <= 2 return")
    return;
  }

  console.log("sendAutoCompleteReques: diff " + (Math.abs(auto_complete_last_request_input_text.value.length - input_text.length)))

  if (last_auto_complete_request_timeout_id.value) {
    clearTimeout(last_auto_complete_request_timeout_id.value)
  }

  //only trigger autocomplete if the user stopped typing for 1s
  last_auto_complete_request_timeout_id.value = setTimeout(() => {
    waiting_for_auto_complete.value = true
    let input_text_after_wait = edit_bar_ref.value.textContent.trim();
    // let input_text_after_wait = edit_bar_input_text.value.trim();

    if (input_text_after_wait == input_text) {
      //TODO needs to be changed to a better request
      console.log("sendAutoCompleteRequest: SENDING request " + input_text)
      // let auto_complete_request = " context: " + "what is x=y+3, y = z +2, z = 1 " + " userQuestion: " + input_text
      let auto_complete_request = " context: " + " " + " userQuestion: " + input_text
      auto_complete_last_request_input_text.value = input_text
      let auto_complete_last_request_input_json = controller.sendMessage(auto_complete_request, config['elementAutoComplete'], config['autoCompleteWorkflow']);
      auto_complete_request_callback_key.value = auto_complete_last_request_input_json['callbackKey']
    }
    else {
      console.log("sendAutoCompleteRequest: EXIT input_text_after_wait != input_text")
    }
  }, 1000);
};

const retrieveNextAutoCompleteWord = () => {
  let displayed_auto_complete = auto_complete.value.substring(edit_bar_ref.value.textContent.length);
  // let displayed_auto_complete = auto_complete.value.substring(edit_bar_input_text.value.length);
  let displayed_auto_complete_words = displayed_auto_complete.trim().split(" ")
  let new_input_text = ""
  if (displayed_auto_complete_words.length >= 1) {
    new_input_text = edit_bar_ref.value.textContent.trim() + " " + displayed_auto_complete_words[0]
    // new_input_text = edit_bar_input_text.value.trim() + " " + displayed_auto_complete_words[0]

    // code to set the caret position after the text during autocomplete
    nextTick(() => {
      edit_bar_ref.value.textContent = new_input_text
      // edit_bar_input_text.value = new_input_text
      edit_bar_ref.value.focus();
      const position = new_input_text.length;  // Or wherever you want the caret.
      //edit_bar_ref.value.setSelectionRange(position, position);
      console.log(position + " " + edit_bar_ref.value);
      var range = document.createRange();
      var sel = window.getSelection();
      range.setStart(edit_bar_ref.value.firstChild, position);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      sendAutoCompleteRequest();
    })
  }
};

const replaceAutoComplete = (input_text) => {
  if (input_text.length <= placeholder_ref.value.textContent.length) {
    auto_complete.value = input_text + auto_complete.value.substring(input_text.length);
  } else {
    auto_complete.value = "";
    waiting_for_auto_complete.value = false
  }
};

//UI helper functions
const adjustChatInputElementSize = () => {
  let editBarHeight = edit_bar_ref.value.offsetHeight;
  let placeholderHeight = placeholder_ref.value.offsetHeight;
  let maxHeight = Math.max(editBarHeight, placeholderHeight);

  if (editBarHeight != placeholderHeight) {
    edit_bar_ref.value.style.height = `${maxHeight}px`;
    // Adjust the autocomplete-container to be 10% higher than the maxHeight
    autocomplete_container_ref.value.style.height = `${maxHeight * 1.1}px`;
    chat_container_ref.value.style.height = `${maxHeight * 1.3}px`;
  }
}

const bringToFront = () => {
  if (tile_ref.value.style.zIndex <= controller.state.highest_z_index) {
    controller.state.highest_z_index += 1;
    tile_ref.value.style.zIndex = controller.state.highest_z_index;
    highest_z_index.value = controller.state.highest_z_index
  }
};

const scrollToBottom = () => {
  // Scroll to the bottom
  nextTick(() => {
    if (scrollable_content_ref.value) {
      scrollable_content_ref.value.scrollTop = scrollable_content_ref.value.scrollHeight;
    }
  });
}

const addLine = () => {
  nextTick(() => {
    // Don't allow the textarea to exceed the maximum number of rows
    if (textareaRows.value < MAX_TEXTAREA_ROWS) {
      textareaRows.value = textareaRows.value + 1;
      adjustChatInputElementSize();
    }
    message.value += '\n';
  });
};

// const handleKeyEvents = (event) => {
//   if (event.shiftKey && event.key === 'Enter') {
//     // Shift + Enter is pressed
//     addLine();
//     event.preventDefault();
//   }
//   else if (event.key === 'Enter') {
//     // Enter key is pressed
//     waiting_for_auto_complete.value = false
//     clearTimeout(last_auto_complete_request_timeout_id.value)
//     sendMessage();
//     event.preventDefault();
//   }
//   // else if (event.key === 'Tab') {
//   //   // Tab key is pressed
//   //   retrieveNextAutoCompleteWord();
//   //   event.preventDefault();
//   // }
// };

const handleKeyEvents = (event) => {
  const trimmedContent = edit_bar_ref.value.textContent.trim();
  isInputEmpty.value = trimmedContent ==='';


  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  
  if (event.key === 'Enter' && event.shiftKey) {
    // Check if the caret is at the end of the current line
    const currentLine = range.toString().split('\n').pop();
    const lastIndexOfCurrentLine = range.startOffset - currentLine.length;
    if (selection.focusNode.offsetParent !== null && lastIndexOfCurrentLine < selection.focusNode.offsetParent.childNodes.length) {
      event.preventDefault();
      
      // Insert a line break
      const br = document.createElement('br');
      range.insertNode(br);
      range.setStartAfter(br);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } else if (event.key === 'Enter') {
    waiting_for_auto_complete.value = false;
    clearTimeout(last_auto_complete_request_timeout_id.value);
    sendMessage();
    event.preventDefault();
  }
  
  // else if (event.key === 'Tab') {
  //   retrieveNextAutoCompleteWord();
  //   event.preventDefault();
  // }
};


const closeTile = () => {
  vue_client_emitter.off("tiles");
  controller.tile_handler.closeTile(component.value);
};

onUnmounted(() => {
  vue_client_emitter.off('status')
  vue_client_emitter.off("tiles")
  vue_client_emitter.off("updateChatTextField")
  // vue_client_emitter.off("autoCompleteUpdate")
})

onMounted(() => {
  if (component.value === 'Chat') {
    tile_ref.value.style.zIndex = ++controller.state.highest_z_index;
    auto_complete.value = 'Hi, how can I help!';
    edit_bar_ref.value.focus();
  }
  else {
    tile_ref.value.style.zIndex = ++controller.state.highest_z_index;
    auto_complete.value = '';
  }
  controller.tile_handler.positionTile(component.value, tile_ref)

  interact(tile_ref.value)
    .draggable({
      manualStart: true,
      inertia: {
        resistance: 5,
        minSpeed: 100,
        endSpeed: 50,
      },
      listeners: {
        start(event) {
          if (event.target.style.zIndex <= controller.state.highest_z_index) {
            controller.state.highest_z_index += 1;
            event.target.style.zIndex = controller.state.highest_z_index;
          }
        },
        move(event) {
          controller.tile_handler.updateTileWindowPosition(component.value, event)
        }
      }
    })
    .on('down', function (event) {
      var element = event.currentTarget;
      var questionElement = element.querySelector('.tile-header');
      if (event.target === questionElement) {
        // Instruct Interact to start the draggable action here:
        event.interaction.start({ name: 'drag' }, event.interactable, element);
      }
      bringToFront();
    })
    .resizable({
      edges: { left: false, right: false, bottom: true, top: true },
      restrictSize: {
        min: { width: 100, height: 100 },
      },
    })
    .on('resizemove', (event) => {
      controller.tile_handler.updateTileWindowSize(component.value, event)
    });

  return {
    closeTile,
    bringToFront
    // Other variables and functions used in your template...
  };

});


</script>

<template>
  <div class="tile" ref="tile_ref">
    <div class="tile-header">
      <!-- <div class="tile-header" v-if="component !== 'Chat'"> -->
      <p class="question"> Euclidean Chat</p>
      <!-- <button class="close-button" @click="closeTile">X</button> -->
    </div>
    
    <div class="scrollable-content" ref="scrollable_content_ref">

      <template v-for="(actionInput, actionInputsIndex) in input_json['actionInputs']">
        <!-- {{ actionInput.workflowName === 'Chat' }} -->
        <Analysis v-if="actionInput.workflowName === 'Analysis'"
          :id="`${props.id}-${actionInputsIndex}-${actionInput.workflowName}`" :actionInput="actionInput"
          :workflowName="actionInput.workflowName" :question="input_json['key']" />
        <AiGeneratedCode v-else-if="actionInput.workflowName === 'AiGeneratedCode'"
          :id="`${props.id}-${actionInputsIndex}-${actionInput.workflowName}`" :actionInput="actionInput"
          :workflowName="actionInput.workflowName" />
        <!-- <Calculate v-else-if="actionInput.workflowName === 'Calculate'"
          :id="`${props.id}-${actionInputsIndex}-${actionInput.workflowName}`" :actionInput="actionInput"
          :workflowName="actionInput.workflowName" />
        <PlaceOrder v-else-if="actionInput.workflowName === 'PlaceOrder'"
          :id="`${props.id}-${actionInputsIndex}-${actionInput.workflowName}`" :actionInput="actionInput"
          :workflowName="actionInput.workflowName" />
        <Chat v-else-if="component === 'Chat'" :id="`${props.id}-${actionInputsIndex}-${actionInput.workflowName}`"
          :actionInput="actionInput" :workflowName="actionInput.workflowName" />
        <SolveMathEquationCode v-else-if="actionInput.workflowName === 'SolveMathEquationCode'"
          :id="`${props.id}-${actionInputsIndex}-${actionInput.workflowName}`" :actionInput="actionInput"
          :workflowName="actionInput.workflowName" /> -->
        <AiGeneratedCode v-else-if="actionInput.workflowName === 'AiGeneratedCode'"
          :id="`${props.id}-${actionInputsIndex}-${actionInput.workflowName}`" :actionInput="actionInput"
          :workflowName="actionInput.workflowName" />
        <FinalAnswer v-else-if="actionInput.workflowName === 'FinalAnswer'"
          :id="`${props.id}-${actionInputsIndex}-${actionInput.workflowName}`" :actionInput="actionInput"
          :workflowName="actionInput.workflowName" />
        <div v-else-if="actionInput.workflowName === 'sureliaBiChainInternalAndArchive'"
          :id="`${props.id}-${actionInputsIndex}-${actionInput.workflowName}`" :actionInput="actionInput"
          :workflowName="actionInput.workflowName" />
           <!-- blank for default workflow name -->
        <DefaultActionInput v-else :id="`${props.id}-${actionInputsIndex}-${actionInput.workflowName}`"
          :actionInput="actionInput" :workflowName="actionInput.workflowName" />
      </template>
    </div>
    <!-- <Chat :id="bubbles" /> -->
    <div class="chat-container" ref="chat_container_ref">
      
      <div ref="autocomplete_container_ref" tabindex="1" @focus="setCaret" class="autocomplete-container">
        <!-- <div v-if="waiting_for_auto_complete" class="progress-bar">
          <div class="progress-bar-inner"></div>
        </div> -->
        <!-- <span ref="edit_bar_ref" class="editable" contenteditable="true" @input="sendAutoCompleteRequest"
          @keydown="handleKeyEvents"></span> -->
        <span ref="edit_bar_ref" class="editable" contenteditable="true"
          @keydown="handleKeyEvents"></span>
        <span ref="placeholder_ref" class="placeholder" :class="{'hidden':!isInputEmpty}" contenteditable="false">{{ auto_complete }}</span>
      </div>
      <button @click="sendMessage" class="send-button">
        <i class="arrow right icon"></i>
      </button>
    </div>
    
    <div class="status-bar" v-if="statusMessage && statusType === 'error'"
      :class="{ 'status-error': statusType === 'error' }">
      {{ statusMessage }}
    </div>
  </div>
</template>

<style>
.hidden{
  display: none;
}

.autocomplete-container {
  position: relative;
  overflow: auto;
  display: flex;
  justify-content: flex-end;
  width: 100%;
  height: 100%;
  /* border-radius: 10px 0 0 10px; */
}

.editable,
.placeholder {
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 5px;
  outline: none;
}

.editable {
  z-index: 2;
  background: rgba(255, 255, 255, 0.3); 
  /* Set a white, translucent background */
  /* Add some padding for better appearance */
  color: #000000;
  /* Set text color to black */
}

.placeholder {
  z-index: 1;
  font-weight: 300;
  color: rgb(20, 76, 198);
}

.tile {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* Ensure .tile takes up the full height of its container */
  position: relative;
  border-radius: 10px;
}
/* main tile */

.tile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.scrollable-content {
  flex-grow: 1;
  /* Allow .scrollable-content to take up the remaining space */
  overflow-y: auto;
  margin: 10px;
  height: 10px;
  /* Add some margin */
}

.close-button {
  /* Styles for the close button */
  position: absolute;
  right: 10px;
  top: 10px;
}

.chat-container {
  display: flex;
  
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  border: 1px solid #736efe;
  border-radius: 10px;
  min-height: 70px;
  background-color: rgba(255, 255, 255, 0.3);
}

.message-textarea {
  flex-grow: 1;
  /* take all available horizontal space */
  resize: none;
  /* disable user resizing */
  margin-right: 10px;
  /* optional: add some spacing between the textarea and the send button */
}

.send-button {
  width: 60px;
  height: 70px;
  background-image: linear-gradient(135deg, #5EFCE8 10%, #736EFE 100%);
  /* change to light blue background */
  border: none;
  border-radius: 10px;
  /* make it square */
  display: flex;
  /* center the icon */
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.send-button .arrow.right.icon {
  border: solid;
  color: #c2e9fb;
  border-width: 0 3px 3px 0;
  display: inline-block;
  padding: 5px;
  transform: rotate(-45deg);
  -webkit-transform: rotate(-45deg);
}

.send-button:hover {
  transform: scale(0.9);
}

.status-bar {
  width: 100%;
  padding: 10px;
  color: #fff;
  text-align: center;
}

.status-error {
  background: #f00;
}

.progress-bar {
  width: 100%;
  height: 3px;
  background-color: #e2e7f3;
  overflow: hidden;
  position: relative;
}

.progress-bar-inner {
  width: 50%;
  height: 100%;
  background: linear-gradient(to right, transparent, #96b1f1);
  position: absolute;
  animation: loading 2s ease-in-out infinite;
}

::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

::-webkit-scrollbar:horizontal {
  height: 5px;
}

@keyframes loading {
  0% {
    left: -50%;
  }

  50% {
    left: 100%;
  }

  100% {
    left: -50%;
  }
}</style>
