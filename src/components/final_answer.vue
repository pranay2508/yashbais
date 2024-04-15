<script setup>
/* eslint-disable */
import { defineProps, inject , ref} from 'vue';
import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import Modal from '@/components/modal.vue';


const config = inject('config');
const controller = inject('controller');
const vueClientEmitter = inject('emitter');

const props = defineProps({
  id: String,
  actionInput: Object,
  workflowName: String,
  citation: Object
});



const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>';
      } catch (__) { }
    }

    return ''; // use external default escaping
  },
});

const parseMarkdown = (input) => {
  return md.render("" + input);
};
const open = ref(true);
const showModal = () => {  
  open.value = true;
};
const closeModal = e => {
  console.log(e);
  open.value = false;
};
</script>

<template>
  
  <div :id="id" class="answer-box">
    <!-- <div v-html="actionInput['result'].answer" class="markdown-content"></div> -->
    <div class="markdown-content">
      <div v-html="actionInput['result']['answer']"></div>
      <div>
        <h5 v-if="actionInput['result']['citations'].includes('content')">CITATIONS:</h5> 
            
        <div
            v-for="(citation, index) in actionInput['result']['citations']"
            :key="index"
            class="chat-bubble"
            @click="showModal(citation)"
          >          
          <a-collapse class="collapse">
            <a-collapse-panel>
              <template v-slot:header class="logo-collapse">
                <div ><span class="citation-no-box">{{ citation.index}}</span>  {{ citation.filepath}} </div>
              </template>
              <div :id="id">
                <div class="collapse-content">
                  <h3><strong>{{ citation.title }}</strong></h3>
                      <div v-html="citation.content"></div>
                    </div>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </div>
        
        <br/>
        
          
        
      </div>
    </div>
    <div>
    
  </div>
</div>

  
</template>


<style scoped>
.answer-box{
  padding: 4px 0px 15px 0px;
  display:inline-flex; /* to contain the design within the width of the text */
  flex-direction: column;
}
.markdown-content {
  background-color: #ced4da;
  padding: 16px 20px; /* add some padding to give a little room */
  border-radius: 0 25px 25px 30px;
  color: black; /* Change the color of the text inside the markdown content */
  flex:1;
}
.collapse-content {
  background-color: #f4f6f8;
  padding: 16px 20px; /* add some padding to give a little room */  
  color: black; /* Change the color of the text inside the markdown content */
  flex:1;
  border-top: 3px solid lightgrey;
}
.subsec{
  background-color: #eeeef2;
  padding: 16px 20px; /* add some padding to give a little room */  
  color: black; /* Change the color of the text inside the markdown content */
  flex:1;
  margin-bottom: 20px;
}
.citation-no-box{
  outline: 1px solid lightgrey;
  border-radius: 5px 5px 5px 5px;
  padding: 2px;
  margin-right: 2px;
}
</style>