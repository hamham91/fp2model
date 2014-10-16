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

  var wallList = [];

  var isDrawing =  false;
  var startOfWall = null;
  var endOfWall = null;

  function alignWall(wall) {
    var EPSILON = 20;
    if (Math.abs(wall.p1.x - wall.p2.x) < EPSILON) {
      wall.p2.x = wall.p1.x;
    }
    if (Math.abs(wall.p1.y - wall.p2.y) < EPSILON) {
      wall.p2.y = wall.p1.y;
    }
    return wall;
  }

  function cornerSnap(point, walls) {
    var EPSILON = 30;
    var cornerPoint = null;
    for (var i = 0, len = walls.length; i < len; ++i) {
      if (Math.abs(walls[i].p1.x - point.x) < EPSILON &&
          Math.abs(walls[i].p1.y - point.y) < EPSILON) {
        // snap to p1
        cornerPoint = walls[i].p1;
        break;
      }
      if (Math.abs(walls[i].p2.x - point.x) < EPSILON &&
          Math.abs(walls[i].p2.y - point.y) < EPSILON) {
        // snap to p2
        cornerPoint = walls[i].p2;
        break;
      }
    }
    return cornerPoint ? cornerPoint : point;
  }

  context.canvas.addEventListener('mousemove', function(e) {
    curMousePos = getMousePosition(e);
  });

  context.canvas.addEventListener('mousedown', function(e) {
    if (currentMode === modes.SELECT) return;
    mousePosition = getMousePosition(e);
    startOfWall = new Point(mousePosition.x, mousePosition.y);
    startOfWall = cornerSnap(startOfWall, wallList);
    isDrawing = true;
  });

  context.canvas.addEventListener('mouseup', function(e) {
    if (currentMode === modes.SELECT) return;
    mousePosition = getMousePosition(e);
    endOfWall = new Point(mousePosition.x, mousePosition.y);
    endOfWall = cornerSnap(endOfWall, wallList);
    var newWall = new Wall(startOfWall, endOfWall);
    newWall = alignWall(newWall);
    isDrawing = false;
    wallList.push(newWall);
    document.getElementById('wall_list').innerHTML += "<li> Start[" + startOfWall.x + ", " + startOfWall.y + "] End[" + endOfWall.x + ", " + endOfWall.y + "] </li>"; 
    startOfWall = endOfWall = null;
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
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0);
    for (var i = 0, len = wallList.length; i < len; ++i) {
      drawLine(wallList[i].p1, wallList[i].p2, "#ff0000");
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
    var walls = normalizeWalls(wallList);
    var verts = [], faces = [];
    for (var i = 0, len = walls.length; i < len; ++i) {
      makePlanes(walls[i], 0.4, verts, faces);
    }
    var objFile = createObj(verts, faces);
    console.log(objFile);
  }
};

