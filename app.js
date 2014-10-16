window.onload = function() {
  var modes = {
    SELECT: 0,
    WALLS: 1,
    DOORS: 2,
    WINDOWS: 3
  };

  var wallWidth = 5;
  var currentMode = modes.SELECT;
  var curMousePos = { x: 0, y: 0 };

  var canvas = document.getElementById('fp2model_canvas');
  var context = canvas.getContext('2d');

  var img = new Image();
  img.onload = function() {
    context.drawImage(img, 0, 0);
  };
  img.src = "./assets/fp1.jpg";

  var walls_control = document.getElementById("walls");
  var doors_control = document.getElementById("doors");
  var windows_control = document.getElementById("windows");
  var mode_display = document.getElementById("mode");

  walls_control.onclick = toggleWallMode;
  doors_control.onclick = toggleDoorMode;
  windows_control.onclick = toggleWindowMode;

  function toggleWallMode() {
    if (currentMode === modes.WALLS) {
      currentMode = modes.SELECT;
      mode_display.innerHTML = "Mode: select";
      walls_control.classList.remove('walls-selected');
    } else {
      currentMode = modes.WALLS;
      walls_control.classList.add('walls-selected');
      doors_control.classList.remove('doors-selected');
      windows_control.classList.remove('windows-selected');
      mode_display.innerHTML = "Mode: walls";
    }
  }

  function toggleDoorMode() {
    if (currentMode === modes.DOORS) {
      currentMode = modes.SELECT;
      mode_display.innerHTML = "Mode: select";
      doors_control.classList.remove('doors-selected');
    } else {
      currentMode = modes.DOORS;
      walls_control.classList.remove('walls-selected');
      doors_control.classList.add('doors-selected');
      windows_control.classList.remove('windows-selected');
      mode_display.innerHTML = "Mode: doors";
    }
  }

  function toggleWindowMode() {
    if (currentMode === modes.WINDOWS) {
      currentMode = modes.SELECT;
      mode_display.innerHTML = "Mode: select";
      windows_control.classList.remove('windows-selected');
    } else {
      currentMode = modes.WINDOWS;
      walls_control.classList.remove('walls-selected');
      doors_control.classList.remove('doors-selected');
      windows_control.classList.add('windows-selected');
      mode_display.innerHTML = "Mode: windows";
    }
  }

  function getMousePosition(e) {
    var rect = context.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  var Point = function(x, y) {
    this.x = x;
    this.y = y;
  };

  Point.prototype.clone = function() {
    return new Point(this.x, this.y);
  };

  var Line = function(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  };

  Line.prototype.clone = function() {
    return new Line(this.p1.clone(), this.p2.clone());
  };

  var Wall = function(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.doors = [];
    this.windows = [];
  };
  
  Wall.prototype.clone = function() {
    return new Wall(this.p1.clone(), this.p2.clone());
  };

  var Position = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  };

  var spaceManager = new SpaceManager();

  var startOfWall = null;
  var endOfWall = null;

  context.canvas.addEventListener('mousemove', function(e) {
    curMousePos = getMousePosition(e);
  });

  context.canvas.addEventListener('mousedown', function(e) {
    if (currentMode === modes.SELECT) return;
    mousePosition = getMousePosition(e);
    startOfWall = spaceManager.snapPointToWall(new Point(mousePosition.x, mousePosition.y));
  });

  context.canvas.addEventListener('mouseup', function(e) {
    if (currentMode === modes.SELECT) return;
    mousePosition = getMousePosition(e);
    endOfWall = spaceManager.snapPointToWall(new Point(mousePosition.x, mousePosition.y));
    spaceManager.addWall(new Wall(startOfWall, endOfWall));
    document.getElementById('wall_list').innerHTML += "<li> Start[" + startOfWall.x + ", " + startOfWall.y + "] End[" + endOfWall.x + ", " + endOfWall.y + "] </li>"; 
    startOfWall = endOfWall = null;
  });

  context.canvas.addEventListener('click', function(e) {
    if (currentMode !== modes.SELECT) return;
    mousePosition = getMousePosition(e);
    var wall = spaceManager.selectWall(mousePosition); 
    console.log("SELECTED", wall);
  });

  function drawLine(p1, p2, color) {
      context.beginPath();
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      context.lineWidth = wallWidth;
      context.strokeStyle = color;
      context.stroke();
  }

  function drawWalls() {
    var walls = spaceManager.getWalls();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0);
    for (var i = 0, len = walls.length; i < len; ++i) {
      drawLine(walls[i].p1, walls[i].p2, "#ff0000");
    }
    if (startOfWall && !endOfWall) {
      drawLine(startOfWall, curMousePos, "#ff0000");
    }
  }

  function update() {
    drawWalls();
    window.requestAnimationFrame(update);
  }
  update();

  document.getElementById("gen_obj").onclick = function(e) {
    var objFile = spaceManager.exportObj();
    console.log(objFile);
  };
};

