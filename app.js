window.onload = function() {
  var modes = {
    SELECT: 0,
    WALLS: 1,
    DOORS: 2,
    WINDOWS: 3
  };

  var spaceManager = new SpaceManager();

  var wallWidth = 5;
  var currentMode = modes.SELECT;
  var curMousePos = { x: 0, y: 0 };

  var startOfLine = null;
  var endOfLine = null;

  var selectedWall = -1;

  var canvas = document.getElementById('fp2model_canvas');
  var context = canvas.getContext('2d');
  var img = new Image();
  img.onload = function() {
    context.canvas.width = img.width;
    context.canvas.height = img.height;
    context.drawImage(img, 0, 0);
    renderer.setSize( canvas.width, canvas.height );
  };
  img.src = "./assets/fp1.jpg";

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 75, 4/3, 0.1, 1000 );

  var currentOBJ;

  var renderer = new THREE.WebGLRenderer();
  
  renderer.setClearColor( 0xffffff, 1);
  document.getElementById('preview').appendChild(renderer.domElement);

  var controls = new THREE.TrackballControls( camera, renderer.domElement );
  controls.rotateSpeed = 5.0;
  controls.zoomSpeed = 5;
  controls.panSpeed = 2;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;

  var ambient = new THREE.AmbientLight( 0x551133 );
  scene.add( ambient );

  var directionalLight = new THREE.DirectionalLight( 0xffeedd );
  directionalLight.position.set( 1,-1,-1 ).normalize();
  scene.add( directionalLight );

  /*** OBJ Loading ***/
  var manager = new THREE.LoadingManager();
  manager.onProgress = function ( item, loaded, total ) {
    console.log( item, loaded, total );
  };
  var loader = new THREE.OBJLoader( manager );

  camera.position.set(0,0,-1);
  camera.lookAt(0,0,0);
  camera.up = new THREE.Vector3(0, -1, 0);

  var plane = new THREE.Mesh(new THREE.PlaneGeometry(20,20), new THREE.MeshNormalMaterial());
  plane.position.set(0,0,0.2);
  var norm = new THREE.Vector3(0, 0, -1);
  plane.lookAt(norm);
  scene.add(plane);

  function render() {
    requestAnimationFrame(render);
    controls.update();
    renderer.render(scene, camera);
  }
  render();

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
      selectedWall = -1;
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

  context.canvas.addEventListener('mousemove', function(e) {
    curMousePos = getMousePosition(e);
  });

  context.canvas.addEventListener('mousedown', function(e) {
    if (currentMode === modes.SELECT) return;
    mousePosition = getMousePosition(e);
    startOfLine = new Point(mousePosition.x, mousePosition.y);
    startOfLine = spaceManager.snapPointToWall(startOfLine);
  });

  context.canvas.addEventListener('mouseup', function(e) {
    if (currentMode === modes.SELECT) return;
    mousePosition = getMousePosition(e);

    var walls = spaceManager.getWalls();

    endOfLine = new Point(mousePosition.x, mousePosition.y);
    endOfLine = spaceManager.snapPointToWall(endOfLine);

    if (currentMode === modes.WALLS) {
      var newWall = new Wall(new Line(startOfLine, endOfLine));
      selectedWall = walls.length; 
      spaceManager.addWall(newWall);
    } else if (currentMode === modes.DOORS) {
      if (selectedWall >= 0) {
        var newDoor = new Line(startOfLine, endOfLine);
        newDoor = spaceManager.axisAlignLine(newDoor);
        newDoor = spaceManager.snapLineToWall(newDoor, walls[selectedWall]);
        walls[selectedWall].doors.push(newDoor);
      }
    } else if (currentMode === modes.WINDOWS) {
      if (selectedWall >= 0) {
        var newWindow = new Line(startOfLine, endOfLine);
        newWindow = spaceManager.axisAlignLine(newWindow);
        newWindow = spaceManager.snapLineToWall(newWindow, walls[selectedWall]);
        walls[selectedWall].windows.push(newWindow);
      }
    }

    startOfLine = endOfLine = null;
    
    loadOBJ();

  });

  context.canvas.addEventListener('click', function(e) {
    if (currentMode !== modes.SELECT) return;
    mousePosition = getMousePosition(e);
    selectedWall = spaceManager.selectWall(mousePosition);
  });

  function drawLine(p1, p2, color) {
      context.beginPath();
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      context.lineWidth = wallWidth;
      context.strokeStyle = color;
      context.stroke();
  }

  function draw() {
    var walls = spaceManager.getWalls();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0);
    var wall, door, win;
    for (var i = 0; i < walls.length; i++) {
      wall = walls[i];
      if (i === selectedWall) {
        drawLine(wall.line.p1, wall.line.p2, "#ffff00");
      } else {
        drawLine(wall.line.p1, wall.line.p2, "#ff0000");
      }
      var j;
      for (j = 0; j < wall.doors.length; ++j) {
        door = wall.doors[j];
        drawLine(door.p1, door.p2, "#00ff00");
      }
      for (j = 0; j < wall.windows.length; ++j) {
        win = wall.windows[j];
        drawLine(win.p1, win.p2, "#0000ff");
      }
    }
    if (startOfLine && !endOfLine) {
      var color = "#ff0000";
      if (currentMode === modes.DOORS) {
        color = "#00ff00";
      } else if (currentMode === modes.WINDOWS) {
        color = "#0000ff";
      }
      drawLine(startOfLine, curMousePos, color);
    }
  }

  function update() {
    draw();
    window.requestAnimationFrame(update);
  }
  update();

  function loadOBJ() {
    var objFile = spaceManager.exportObj();
    console.log(objFile);

    var blob = new Blob([objFile]);

    // As soon as the OBJ has been loaded this function looks for a mesh
    // inside the data and applies the texture to it.
    loader.load( URL.createObjectURL(blob), function ( event ) {
      var object = event;

      object.traverse( function ( child ) {
        if ( child instanceof THREE.Mesh ) {
          child.material.color.setRGB(0.6, 0.2, 0.8);
          child.material.side = THREE.DoubleSide;
          child.geometry.center();
        }
      } );
   
      // object.scale = new THREE.Vector3( 25, 25, 25 );
   
      if (currentOBJ) {
        scene.remove(currentOBJ);
      }

      currentOBJ = object;

      scene.add( object );
    });
  }

  document.getElementById("gen_obj").onclick = loadOBJ;
};

