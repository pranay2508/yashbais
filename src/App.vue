<script>
/* eslint-disable */
import Tile from './components/interactive_tile.vue';
import chathistory from './components/chat_history.vue';
</script>

<script setup>
/* eslint-disable */
import { ref, onMounted, onUnmounted, inject, watch , computed} from 'vue';
import { Row, Col } from 'ant-design-vue';
const leftSpan = 7; // Represents 30% of the total width
const rightSpan = 17; 
const content = ref(null);
const name = 'App'
const tiles = ref({})
const message = ref(null)
const config = inject('app_config')
const controller = inject('controller')
const vue_client_emitter = inject('emitter')

vue_client_emitter.on("tiles", (tileUpdate) => { processMessageUpdate(tileUpdate.tile);});

const updateMessage = (newMessage) => {
  message.value = newMessage;
};

//adding tiles here just in case the vue didn't 'replicate' the tiles from the controller
//updates are processed directly inside the tile vue component (interactive_tile.vue)
const processMessageUpdate = (tile) => {
  try{
    let tile_exisits = tiles.value.hasOwnProperty(tile.component) 
    if (tile_exisits && tile.action === 'delete') {
      delete tiles.value[tile.component];
    }
  }catch(e){
    console.log("got error in the processMessageUpdate  handler in app.vue")
  }
};

// Computed property for non-chat tiles
const nonChatTiles = computed(() => {
  return Object.values(tiles.value).filter(tile => tile.component !== 'Chat');
});

// Computed property for chat tile
const chatTiles = computed(() => {
  return Object.values(tiles.value).filter(tile => tile.component === 'Chat');
});

onMounted(() => {
  //sync at start but later rely on the tile subscriber to process updates
  tiles.value = controller.state.tiles;
});


</script>

<template>
  <div class="app-layout">
    <!-- Left side content (30%) -->
    <!-- <chathistory/> -->
    <div class="left-side">
      <div class="chat-history">
        <!-- <chathistory/> -->
      </div>
    </div>

    <!-- Right side content (70%) -->
    <div class="right-side">
      <div class="animated-logo">Euclidean</div>
      <div class="app-container">
        <div class="content" ref="content">
          <Tile v-for="(tile, tileName) in tiles" 
                :key="tile.id" 
                :id="tile.id" 
                :content="tile.content"
                :class="{ 'chat-tile': tile.component === 'Chat' }" 
                :component="tile.component" 
                @message-change="updateMessage">
          </Tile>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
body, html {
  margin: 0;
  padding: 0;
}
#app {
  position: relative;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
}

.app-layout {
  display: flex;
  height: 100vh;
  width:100%
}

.left-side {
  width: 30%;
}

.right-side {
  width: 70%;
}

.app-container {
  display: flex;
  justify-content: center;
  /* Centers content horizontally */
  /* align-items: center; */
  /* Centers content vertically */
  height: 100vh;
  /* Takes full viewport height */
  flex-direction: column;
}

.content {
  /* position: relative; */
  width: 100%;
  height: 100%;
  font-family: 'Montserrat', sans-serif;
}

.tile, .chat-tile {
  box-sizing: border-box;
  /* other styles... */
  background: #eff7fe;
  /* Blue background */
  border: 1px solid #7d8387;
  /* Black border */
  box-shadow: 2px 2px 6px rgba(97, 90, 224, 0.1);
  padding: 10px;
  color: #352b34;
  /* Change the color of the text inside the tile to white */
  width: 600px;
  /* Initial width */
  height: 400px;
  /* Initial height */
}

.chat-tile {
  width: 68%;
  /* For example, you might set a relative width */
  height: 99%;
  /* And a fixed height */
}

@keyframes glow {
  0% {
    text-shadow: 0 0 5px #96b1f1, 0 0 10px #96b1f1, 0 0 15px #96b1f1, 0 0 20px #96b1f1;
  }

  100% {
    text-shadow: 0 0 30px #96b1f1, 0 0 50px #96b1f1, 0 0 70px #96b1f1, 0 0 90px #96b1f1;
  }
}

.animated-logo {
  font-family: 'Orbitron', sans-serif;
  /* AI-looking font */
  font-size: 1rem;
  color: #96b1f1;
  /* Futuristic green */
  text-align: right;
  animation: glow 2s ease-in-out infinite alternate;
  position: absolute;
  left: 1%;
  top: 5%;
}
</style>
