<script setup>
/* eslint-disable */
import { defineProps, inject, ref } from 'vue';
import { Collapse } from 'ant-design-vue';

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
  <div :id="id" class="question-box">
    <h4 class="question">{{actionInput['description']}}</h4>
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
  box-shadow: 10px 10px 10px lightgrey;
} 
</style>