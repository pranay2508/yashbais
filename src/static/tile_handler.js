/* eslint-disable */
// Description: This file contains the MessageHandler class.
class TileHandler {
  constructor(config, emitter, tiles, deleted_tiles) {
    this.config = config;
    this.vue_client_emitter = emitter;
    this.tiles = tiles;
    this.deleted_tiles = deleted_tiles;
  }

  updateTile(input_json) {
    let callback_key = input_json["callbackKey"];

    //check if the tile is in the deleted_tiles array
    let tile_deleted = this.deleted_tiles.hasOwnProperty(callback_key);
    if (tile_deleted) {
      return; //do not process the notification if the tile is in the deleted_tiles array
    }

    let tile = {};
    //check if the tile is already in the active tiles array
    let tile_exisits = this.tiles.hasOwnProperty(callback_key);
    if (tile_exisits) {
      //if the tile is found replace the tile
      tile = {
        ...this.tiles[callback_key], //makes sure we copy over all web client specific properties
        content: input_json,
        component: callback_key,
        action: "update",
      };
      this.tiles[callback_key] = tile;
    } else {
      // if the tile is not found, add it to the tiles json
      let tileId = this.uuidv4();
      tile = {
        id: tileId,
        content: input_json,
        component: callback_key,
        action: "insert",
      };
      this.tiles[callback_key] = tile;
    }
    //'direct' page update since reactive state is not working
    try {
      this.vue_client_emitter.emit("tiles", {
        action: tile.action,
        tile: tile,
      });
    } catch (error) {
      // console.error("Error in the emitter: " + error + " trace:" + error.stack);
      this.vue_client_emitter.emit("log", {
        logLevel: this.config["logError"],
        function: "processNotification",
        message:
          "Error sending direct tile notfication Exception:" +
          error +
          " trace:" +
          error.stack,
      });
    }
  }

  createChatTile() {
    var input_json = {
      callbackKey: "Chat",
      // actionInputs: { 0: { workflowName: "Chat", actionInput: {} } },
      inputs: { workflowName: "Chat" },
    };
    var tile = {
      id: this.uuidv4(),
      content: input_json,
      component: input_json["callbackKey"],
      action: "insert",
    };
    this.tiles[input_json["callbackKey"]] = tile;
    this.vue_client_emitter.emit("notification", { inputJson: input_json });
  }

  closeTile(callback_key) {
    let is_deleted_already = this.deleted_tiles.hasOwnProperty(callback_key);
    if (!is_deleted_already) {
      //add the tile to the deleted_tiles array so it can be restored and memory manage the array
      let tile = this.tiles[callback_key];
      tile.action = "delete";
      this.deleted_tiles[callback_key] = tile;

      //TODO need to figure out how to keep the bin from growing too large
      // if(this.deleted_tiles.length > 25) {
      //   this.deleted_tiles.splice(0, this.deleted_tiles.length - 20);
      // }

      //remove the tile from the active tiles array
      delete this.tiles[callback_key];
      this.vue_client_emitter.emit("tiles", { action: tile.action, tile: tile });
    } else {
      this.vue_client_emitter.emit("log", {
        logLevel: this.config["logError"],
        function: "closeTile",
        message: "could not find tile to close for tileId:" + tileId,
      });
    }
  }

  updateTileWindowSize(callback_key, event) {
    let target = event.target;
    let tile_width = Math.max(100, event.rect.width);
    let tile_height = Math.max(100, event.rect.height);
    target.style.width = tile_width + 'px';
    target.style.height = tile_height + 'px';

    this.tiles[callback_key]["tileWidth"] = tile_width;
    this.tiles[callback_key]["tileHeight"] = tile_height;
  }

  updateTileWindowPosition(callback_key, event) {
    var target = event.target;
    var x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
    var y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

    target.style.transform = "translate(" + x + "px, " + y + "px)";

    target.setAttribute("data-x", x);
    target.setAttribute("data-y", y);

    this.tiles[callback_key]["xTilePosition"] = x;
    this.tiles[callback_key]["yTilePosition"] = y;
  }

  positionTile(callback_key, tileRef) {
    var new_x = 0;
    var new_y = 0;

    const tile_width = tileRef.value.offsetWidth;
    const tile_height = tileRef.value.offsetHeight;

    //chat tile postioning
    if (callback_key === "Chat") {
      const screen_width = window.innerWidth;
      const screen_height = window.innerHeight;
      new_x = screen_width / 2 - tile_width / 2;
      // new_y = screen_height - (tile_height + 10); // 10 x padding from the bottom 
      new_y = 10; // 10 x padding from the top 
    } else if (this.tiles[callback_key]["xTilePosition"]) {
      new_x = this.tiles[callback_key]["xTilePosition"] || 0;
      new_y = this.tiles[callback_key]["yTilePosition"] || 0;
    } else {
      //init tile position value,    
      this.tiles[callback_key]["xTilePosition"] = 200
      this.tiles[callback_key]["yTilePosition"] = 200
      this.tiles[callback_key]["tileWidth"] = tile_width
      this.tiles[callback_key]["tileHeight"] = tile_height

      // Use the findOpenSpace function to get an available position
      const position = this.findFreeWindowGrid(callback_key,
        tile_width,
        tile_height
      );
      new_x = position.x;
      new_y = position.y;
    }

    tileRef.value.style.position = 'absolute';
    tileRef.value.style.left = `${new_x}px`;
    tileRef.value.style.top = `${new_y}px`;

    // Update tile position in the controller state
    this.tiles[callback_key]["xTilePosition"] = new_x
    this.tiles[callback_key]["yTilePosition"] = new_y
    this.tiles[callback_key]["tileWidth"] = tile_width
    this.tiles[callback_key]["tileHeight"] = tile_height

  }

  findFreeWindowGrid(callback_key, tile_width, tile_height) {
    const screen_width = window.innerWidth;
    const screen_height = window.innerHeight - 150 //150px for bottom chat tile height;

    this.vue_client_emitter.emit("log", {
      logLevel: this.config["logDebug"],
      function: "findFreeWindowGrid",
      message: `Screen size: ${screen_width}x${screen_height}`
    });

    // Divide the screen into 9 equal squares
    const grid_size = 3;
    const screen_grid = new Array(grid_size)
      .fill(0)
      .map(() => new Array(grid_size).fill(0));

    // Calculate the width and height of each grid square
    const grid_width = Math.floor(screen_width / grid_size);
    const grid_height = Math.floor(screen_height / grid_size);
    
    this.vue_client_emitter.emit("log", {
      logLevel: this.config["logDebug"],
      function: "findFreeWindowGrid",
      message: `Grid size: ${grid_width}x${grid_height}`
    });


    // Calculate occupied area for each tile in all squares
    Object.values(this.tiles).forEach((tile) => {
      //ingor the chat tile and current tile window when tryign to find an empty grid space
      if (tile.component !== "Chat" && tile.component !== callback_key) {
        const start_x = Math.floor(tile.xTilePosition / grid_width);
        const start_y = Math.floor(tile.yTilePosition / grid_height);
        const end_x = start_x + Math.ceil(tile.tileWidth / grid_width);
        const end_y = start_y + Math.ceil(tile.tileHeight / grid_height);

        this.vue_client_emitter.emit("log", {
          logLevel: this.config["logDebug"],
          function: "findFreeWindowGrid",
          message: `Tile covers squares from (${start_x},${start_y}) to (${end_x},${end_y})`,
        });

        // Calculate overlap area for each square the tile occupies
        for (let x = start_x; x < end_x; x++) {
          for (let y = start_y; y < end_y; y++) {
            if (x >= 0 && x < grid_size && y >= 0 && y < grid_size) {
              const overlapX =
                x === start_x ? tile.xTilePosition % grid_width : 0;
              const overlapY =
                y === start_y ? tile.yTilePosition % grid_height : 0;
              const overlap_width =
                x === end_x - 1
                  ? (tile.xTilePosition + tile.tileWidth) % grid_width
                  : grid_width;
              const overlap_height =
                y === end_y - 1
                  ? (tile.yTilePosition + tile.tileHeight) % grid_height
                  : grid_height;
              const overlapArea =
                (overlap_width - overlapX) * (overlap_height - overlapY);
              screen_grid[y][x] += overlapArea;

              this.vue_client_emitter.emit("log", {
                logLevel: this.config["logDebug"],
                function: "findFreeWindowGrid",
                message: `Overlap area at square (${x},${y}): ${overlapArea}`,
              });
            }
          }
        }
      }
    });

    // Find the square with the least overlap area
    let min_overlap_area = Infinity;
    let min_overlap_position = { x: 0, y: 0 };
    for (let y = 0; y < grid_size; y++) {
      for (let x = 0; x < grid_size; x++) {
        if (screen_grid[y][x] < min_overlap_area) {
          min_overlap_area = screen_grid[y][x];
          min_overlap_position = { x: x * grid_width, y: y * grid_height };

          this.vue_client_emitter.emit("log", {
            logLevel: this.config["logDebug"],
            function: "findFreeWindowGrid",
            message: `New minimum overlap area: ${min_overlap_area} at square (${x},${y})`,
          });
        }
      }
    }
    this.vue_client_emitter.emit("log", {
      logLevel: this.config["logDebug"],
      function: "findFreeWindowGrid",
      message: `Position for new tile: ${min_overlap_position.x},${min_overlap_position.y}`
    });

    // Return the position of the square with the least overlap area
    return min_overlap_position;
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

export default TileHandler;
