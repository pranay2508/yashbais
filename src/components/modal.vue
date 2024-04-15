<script setup>
/* eslint-disable */
import { defineProps, inject, ref } from 'vue';


const config = inject('config');
const controller = inject('controller');
const vueClientEmitter = inject('emitter');

const props = defineProps({
  id: String,
  actionInput: Object,
  workflowName: String,
  question: String,
});

</script>


<template>
  <div class="modal-backdrop">
    <div class="modal">
      <slot name="header"></slot>
      <slot name="body"></slot>
      <slot name="footer"></slot>
    </div>
  </div>
</template>



<style scoped>
.question-box{
  border-radius: 5px;
  text-align: right;
}
.question{
  background-color:#1c9dea ;
  color:whitesmoke;
  border-radius: 30px 25px 0 30px;
  padding: 16px 20px;
  font-weight: 600;
  display: inline-flex;
  width: auto;
} 
</style>