<script setup>
/* eslint-disable */
import { defineProps, inject, ref } from 'vue';
import { Collapse } from 'ant-design-vue';
import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';

const config = inject('config');
const controller = inject('controller');
const vueClientEmitter = inject('emitter');

const props = defineProps({
  id: String,
  actionInput: Object,
  workflowName: String,
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
</script>

<template>
  <div v-if="actionInput['code'].includes('AI is generating code')">
    <a-collapse class="collapse">
      <a-collapse-panel>
        <template v-slot:header class="logo-collapse">
          <div class='animated-logo'>SureliaBI</div>
        </template>
        <div :id="id">
          <div v-html="parseMarkdown(actionInput['code'])" class="markdown-content"></div>
        </div>
      </a-collapse-panel>
    </a-collapse>
  </div>

  <div v-else>
    <!-- Unavailable content -->
  </div>
</template>


<style scoped>
.markdown-content {
  background: white;
  padding: 10px;
  /* add some padding to give a little room */
  color: black;
  /* Change the color of the text inside the markdown content */
}

@keyframes glow {
  0% {
    text-shadow: 0 0 5px #96b1f1, 0 0 10px #96b1f1, 0 0 15px #96b1f1, 0 0 20px #96b1f1;
  }

  100% {
    text-shadow: 0 0 30px #96b1f1, 0 0 50px #96b1f1, 0 0 70px #96b1f1, 0 0 90px #96b1f1;
  }
}

.collapse {
  width: fit-content;
  font-size: 12px;
  border-radius: 10px;
}

.logo-collapse{
  width: 50%;
}

.animated-logo {
  font-family: 'Orbitron', sans-serif;
  /* AI-looking font */
  font-size: .6rem;
  color: #96b1f1;
  /* Futuristic green */
  animation: glow 2s ease-in-out infinite alternate;
  left: 18%;
  top: 30%;
}
</style>