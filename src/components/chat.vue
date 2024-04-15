<script setup>
/* eslint-disable */
import { ref, nextTick, inject, onMounted, watch } from 'vue';

const props = defineProps({
  id: String,
  actionInput: Object,
  workflowName: String,
  messages: Array
});
const config = inject('config');
const controller = inject('controller');
const vue_client_emitter = inject('emitter')

const chatPromptExamples = ref(config['chatPromptExamples']);

const updateChatTextField = (message) => {
  vue_client_emitter.emit("updateChatTextField", message)
};

onMounted(() => {
  console.log("Chat messages received as prop: ", props.messages);
});
</script>

<template>
  <div :id="id" class="chat-container">
    <!-- chat-bubble-container has been modified to be just a thin strip above the chat-input -->
    <div class="chat-content-container">
     
      <div class="chat-bubble-container">
        <div class="chat-bubble-row">
          <div
            v-for="(example, index) in chatPromptExamples"
            :key="index"
            class="chat-bubble"
            @click="updateChatTextField(example)"
          >
            {{ example }}
          </div>
        </div>
      </div>
      <!-- Placeholder for chat input. The actual input element should go here -->
      <div class="chat-input">
        <!-- Your chat input element goes here -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-content-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: calc(100% - 40px); /* Adjust the height based on the header's height */
}

.chat-bubble-container {
  overflow-x: auto;
  white-space: nowrap;
  background-color: #e0e0e0;
  flex-shrink: 0; /* Prevent the container from shrinking below its content size */
}

.chat-bubble-row {
  display: flex;
  align-items: center; /* Align bubbles vertically in the center */
  padding: 4px 10px; /* Adjust padding to your needs */
}

.chat-bubble {
  background-color: #f0f0f0; /* Lighter grey for bubbles */
  color: blue;
  border-radius: 15px;
  padding: 8px 12px;
  margin-right: 10px; /* Margin on the right for spacing */
  cursor: pointer;
}

.chat-bubble:hover {
  background-color: #d0d0d0;
}

/* Updated styling for chat input */
.chat-input {
  padding: 10px; /* Add padding for the input area */
  background-color: #ffffff; /* White background for the input area */
  border-top: 1px solid #cccccc; /* Separator between input and bubbles */
  flex-shrink: 0; /* Prevent the container from shrinking */
}

</style>
