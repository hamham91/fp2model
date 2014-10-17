var SpaceManager = function() {
  this.walls = [];
  this.normWalls = null;

  // flags
  this.useAxisAlign = true;

  // constants
  this.wallHeight = 0.4;
  this.doorHeight = 0.3;
  this.windowMaxHeight = 0.3;
  this.windowMinHeight = 0.1;
  this.wallWidth = 0.01;

  // epsilon constants
  this.snappingEpsilon = 15;
  this.axisAlignEpsilon = 15;
  this.selectEpsilon = 5;
};

SpaceManager.prototype.addWall = function(wall) {
  if (this.useAxisAlign) {
    var line = new Line(wall.line.p1, wall.line.p2);
    line = this.axisAlignLine(line);
  }
  this.walls.push(wall);
};

SpaceManager.prototype.selectWall = function(point) {
  var e = this.selectEpsilon;
  var walls = this.walls;
  for (var i = 0, len = walls.length; i < len; ++i) {
    var w = walls[i];
    var minX = Math.min(w.line.p1.x, w.line.p2.x);
    var minY = Math.min(w.line.p1.y, w.line.p2.y);
    var upperLeft = new Point(minX, minY); 
    upperLeft.x -= this.selectEpsilon;
    upperLeft.y -= this.selectEpsilon;
    var width = Math.abs(w.line.p1.x - w.line.p2.x) + (2 * e);
    var height = Math.abs(w.line.p1.y - w.line.p2.y) + (2 * e);
    if (point.x > upperLeft.x && point.x < upperLeft.x + width &&
        point.y > upperLeft.y && point.y < upperLeft.y + height) {
      return i;
    }
  }
  return null;
};

SpaceManager.prototype.getWalls = function() {
  return this.walls;
};

SpaceManager.prototype.axisAlignLine = function(line) {
  if (Math.abs(line.p1.x - line.p2.x) < this.axisAlignEpsilon) {
    line.p2.x = line.p1.x;
  }
  if (Math.abs(line.p1.y - line.p2.y) < this.axisAlignEpsilon) {
    line.p2.y = line.p1.y;
  }
  return line;
};

SpaceManager.prototype.snapPointToWall = function(point) {
  var snapPoint = null;
  var walls = this.walls;
  for (var i = 0, len = walls.length; i < len; ++i) {
    if (Math.abs(walls[i].line.p1.x - point.x) < this.snappingEpsilon &&
        Math.abs(walls[i].line.p1.y - point.y) < this.snappingEpsilon) {
      snapPoint = walls[i].line.p1.clone();
      break;
    }
    if (Math.abs(walls[i].line.p2.x - point.x) < this.snappingEpsilon &&
        Math.abs(walls[i].line.p2.y - point.y) < this.snappingEpsilon) {
      snapPoint = walls[i].line.p2.clone();
      break;
    }
  }
  return snapPoint ? snapPoint : point;
};

SpaceManager.prototype.snapLineToWall = function(line, wall) {
  var snapLine = line.clone();
  var isHorizontal = Math.abs(wall.line.p1.x - wall.line.p2.x) > Math.abs(wall.line.p1.y - wall.line.p2.y);
  var slope = (wall.line.p2.y - wall.line.p1.y) / (wall.line.p2.x - wall.line.p1.x);
  if (isHorizontal) {
    snapLine.p1.y = wall.line.p1.y + slope * (snapLine.p1.x - wall.line.p1.x);
    snapLine.p2.y = wall.line.p2.y + slope * (snapLine.p2.x - wall.line.p2.x);
  } else {
    snapLine.p1.x = wall.line.p1.x + (snapLine.p1.y - wall.line.p1.y) / slope;
    snapLine.p2.x = wall.line.p2.x + (snapLine.p2.y - wall.line.p2.y) / slope;
  }
  console.log("WALL P1 Y:", line.p1.y, "WALL P2 Y:", line.p2.y, "SNAP P1 Y:", snapLine.p1.y, "SNAP P2 Y:", snapLine.p2.y);
  return snapLine;
};

SpaceManager.prototype.calcNormalizedWalls = function() {
  // copy the walls array to normWalls
  this.normWalls = cloneWallArray(this.walls);

  // calc 2d max/min values
  var maxX = -Infinity, maxY = -Infinity;
  var minX = Infinity, minY = Infinity;
  for (i = 0, len = this.normWalls.length; i < len; ++i) {
    // determine max
    if (this.normWalls[i].line.p1.x > maxX) maxX = this.normWalls[i].line.p1.x;
    if (this.normWalls[i].line.p2.x > maxX) maxX = this.normWalls[i].line.p2.x;
    if (this.normWalls[i].line.p1.y > maxY) maxY = this.normWalls[i].line.p1.y;
    if (this.normWalls[i].line.p2.y > maxY) maxY = this.normWalls[i].line.p2.y;

    // determine min
    if (this.normWalls[i].line.p1.x < minX) minX = this.normWalls[i].line.p1.x;
    if (this.normWalls[i].line.p2.x < minX) minX = this.normWalls[i].line.p2.x;
    if (this.normWalls[i].line.p1.y < minY) minY = this.normWalls[i].line.p1.y;
    if (this.normWalls[i].line.p2.y < minY) minY = this.normWalls[i].line.p2.y;
  }
  var rangeX = maxX - minX;
  if (!rangeX) {
    rangeX = 1;
    minX -= 1;
  }
  rangeX = rangeX ? rangeX : 1;
  var rangeY = maxY - minY;
  if (!rangeY) {
    rangeY = 1;
    minY -= 1;
  }
  var range = Math.max(rangeX, rangeY);

  // normalize points
  for (i = 0, len = this.normWalls.length; i < len; ++i) {
    this.normWalls[i].line.p1.x = (this.normWalls[i].line.p1.x - minX) / range;
    this.normWalls[i].line.p2.x = (this.normWalls[i].line.p2.x - minX) / range;
    this.normWalls[i].line.p1.y = (this.normWalls[i].line.p1.y - minY) / range;
    this.normWalls[i].line.p2.y = (this.normWalls[i].line.p2.y - minY) / range;
    var j, jlen;
    for (j = 0, jlen = this.normWalls[i].doors.length; j < jlen; ++j) {
      this.normWalls[i].doors[j].p1.x = (this.normWalls[i].doors[j].p1.x - minX) / range;
      this.normWalls[i].doors[j].p2.x = (this.normWalls[i].doors[j].p2.x - minX) / range;
      this.normWalls[i].doors[j].p1.y = (this.normWalls[i].doors[j].p1.y - minY) / range;
      this.normWalls[i].doors[j].p2.y = (this.normWalls[i].doors[j].p2.y - minY) / range;
    }
    for (j = 0, jlen = this.normWalls[i].windows.length; j < jlen; ++j) {
      this.normWalls[i].windows[j].p1.x = (this.normWalls[i].windows[j].p1.x - minX) / range;
      this.normWalls[i].windows[j].p2.x = (this.normWalls[i].windows[j].p2.x - minX) / range;
      this.normWalls[i].windows[j].p1.y = (this.normWalls[i].windows[j].p1.y - minY) / range;
      this.normWalls[i].windows[j].p2.y = (this.normWalls[i].windows[j].p2.y - minY) / range;
    }
  }
};

function getSortingIndex(isHorizontal, line) {
  var p1 = line.p1;
  var p2 = line.p2;
  return isHorizontal ? Math.min(p1.x, p2.x) : Math.min(p1.y, p2.y);
}

function getNearSortPoint(isHorizontal, line) {
  var p1 = line.p1;
  var p2 = line.p2;
  if (isHorizontal) {
    return (Math.min(p1.x, p2.x) === p1.x) ? p1.clone() : p2.clone();
  } else {
    return (Math.min(p1.y, p2.y) === p1.y) ? p1.clone() : p2.clone();
  }
}

function getFarSortPoint(isHorizontal, line) {
  var p1 = line.p1;
  var p2 = line.p2;
  if (isHorizontal) {
    return (Math.min(p1.x, p2.x) === p1.x) ? p2.clone() : p1.clone();
  } else {
    return (Math.min(p1.y, p2.y) === p1.y) ? p2.clone() : p1.clone();
  }
}

function makePlane(p1, p2, verts, faces, zLow, zHigh, wallWidth) {
  var isHorizontal = Math.abs(p1.x - p2.x) > Math.abs(p1.y - p2.y);

  var offset1 = verts.length;
  var offset2 = offset1 + 4;
  if (!isHorizontal) {
    verts.push(new Vec3(p1.x + wallWidth, p1.y, zLow));
    verts.push(new Vec3(p1.x + wallWidth, p1.y, zHigh));
    verts.push(new Vec3(p2.x + wallWidth, p2.y, zLow)); 
    verts.push(new Vec3(p2.x + wallWidth, p2.y, zHigh));

    verts.push(new Vec3(p1.x - wallWidth, p1.y, zLow));
    verts.push(new Vec3(p1.x - wallWidth, p1.y, zHigh));
    verts.push(new Vec3(p2.x - wallWidth, p2.y, zLow)); 
    verts.push(new Vec3(p2.x - wallWidth, p2.y, zHigh));
  } else {
    verts.push(new Vec3(p1.x, p1.y + wallWidth, zLow));
    verts.push(new Vec3(p1.x, p1.y + wallWidth, zHigh));
    verts.push(new Vec3(p2.x, p2.y + wallWidth, zLow)); 
    verts.push(new Vec3(p2.x, p2.y + wallWidth, zHigh));

    verts.push(new Vec3(p1.x, p1.y - wallWidth, zLow));
    verts.push(new Vec3(p1.x, p1.y - wallWidth, zHigh));
    verts.push(new Vec3(p2.x, p2.y - wallWidth, zLow)); 
    verts.push(new Vec3(p2.x, p2.y - wallWidth, zHigh));
  }

  faces.push(new Vec3(offset1 + 1, offset1 + 3, offset1 + 2));
  faces.push(new Vec3(offset1 + 3, offset1 + 4, offset1 + 2));
  faces.push(new Vec3(offset2 + 1, offset2 + 2, offset2 + 3));
  faces.push(new Vec3(offset2 + 3, offset2 + 2, offset2 + 4));
}

function makeWall(p1, p2, verts, faces, wallHeight, wallWidth) {
  makePlane(p1, p2, verts, faces, 0, wallHeight, wallWidth);
}

function makeDoor(p1, p2, verts, faces, doorHeight, wallHeight, wallWidth) {
  makePlane(p1, p2, verts, faces, doorHeight, wallHeight, wallWidth);
}

function makeWindow(p1, p2, verts, faces, winMinHeight, winMaxHeight, wallHeight, wallWidth) {
  makePlane(p1, p2, verts, faces, winMaxHeight, wallHeight, wallWidth);
  makePlane(p1, p2, verts, faces, 0, winMinHeight, wallWidth);
}

SpaceManager.prototype.calcVerts = function(wall, verts, faces) {

  var objArray = [];
  var doorIndex = 0;
  var windowIndex = 0;
  var isHorizontal = Math.abs(wall.line.p1.x - wall.line.p2.x) > Math.abs(wall.line.p1.y - wall.line.p2.y);

  var i, iLen;
  for (i = 0, iLen = wall.doors.length; i < iLen; ++i) {
    objArray.push({type: "door", index: getSortingIndex(isHorizontal, wall.doors[i]), obj: wall.doors[i]}); 
  }
  for (i = 0, iLen = wall.windows.length; i < iLen; ++i) {
    objArray.push({type: "window", index: getSortingIndex(isHorizontal, wall.windows[i]), obj: wall.windows[i]}); 
  }

  objArray = objArray.sort(function(a, b) {
    if (a.index < b.index) {
      return -1;
    }
    if (a.index > b.index) {
      return 1;
    }
    return 0;
  });

  // populate the verts/faces
  for (i = 0, iLen = objArray.length; i < iLen; ++i) {
    var type = objArray[i].type;
    var obj = objArray[i].obj; 

    // link with previous object
    var prevPoint;
    if (i === 0) {
      prevPoint = getNearSortPoint(isHorizontal, wall.line);
    } else {
      prevPoint = getFarSortPoint(isHorizontal, objArray[i - 1].obj);
    }

    var p1 = getNearSortPoint(isHorizontal, obj);
    var p2 = getFarSortPoint(isHorizontal, obj);

    // link with previous object
    makeWall(prevPoint, p1, verts, faces, this.wallHeight, this.wallWidth);

    if (type === "door") {
      makeDoor(p1, p2, verts, faces, this.doorHeight, this.wallHeight, this.wallWidth); 
    }
    if (type === "window") {
      makeWindow(p1, p2, verts, faces, this.windowMinHeight, this.windowMaxHeight, this.wallHeight, this.wallWidth); 
    }

    // link with last wall point
    if (i === iLen - 1) {
      var lastPoint = getFarSortPoint(isHorizontal, wall.line);
      makeWall(p2, lastPoint, verts, faces, this.wallHeight, this.wallWidth);
    }
  }

  if (!objArray.length) {
    makeWall(wall.line.p1, wall.line.p2, verts, faces, this.wallHeight, this.wallWidth);
  }
};

SpaceManager.prototype.writeObj = function(verts, faces) {
  var objStr = "";
  var i, len;
  for (i = 0, len = verts.length; i < len; ++i) {
    objStr += "v " + verts[i].x + " " + verts[i].y + " " + verts[i].z + "\n";
  }
  for (i = 0, len = faces.length; i < len; ++i) {
    objStr += "f " + faces[i].x + " " + faces[i].y + " " + faces[i].z + "\n";
  }
  return objStr;
};

SpaceManager.prototype.exportObj = function() {
  this.calcNormalizedWalls();
  var verts = [], faces = [];
  for (var i = 0, len = this.normWalls.length; i < len; ++i) {
    this.calcVerts(this.normWalls[i], verts, faces);
  }
  var objStr = this.writeObj(verts, faces);
  return objStr;
};


