import { createApp, h } from 'vue'
import Controller from '@/static/controller.js'
import mitt from 'mitt';
import App from './App.vue'
import axios from 'axios'
import Antd from "ant-design-vue";
import "ant-design-vue/dist/antd.css";

axios.get('/configs/app_config.json').then((response) => {
  let app_config = response.data;
  const emitter = mitt();

  const app = createApp({
    render: () => h(App),
    provide: {
      config: app_config,
      controller: new Controller(app_config, emitter),
      emitter: emitter
    }
  });

  app.use(Antd)
  app.mount('#app');
});
