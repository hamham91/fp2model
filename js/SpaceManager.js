var SpaceManager = function() {
  this.walls = [];
  this.normWalls = null;

  // flags
  this.useCornerSnap = true;
  this.useAxisAlign = true;

  // constants
  this.wallHeight = 0.4;
  this.doorHeight = 0.3;
  this.windowMaxHeight = 0.3;
  this.windowMinHeight = 0.1;
  this.wallWidth = 0.01;

  // epsilon constants
  this.snappingEpsilon = 30;
  this.axisAlignEpsilon = 20;
  this.selectEpsilon = 10;
};

SpaceManager.prototype.addWall = function(wall) {
  if (this.useAxisAlign) {
    wall = this.axisAlignWall(wall);
  }
  this.walls.push(wall);
};

SpaceManager.prototype.selectWall = function(point) {
  // TODO: fix the hacking please emma!
  var walls = this.walls;
  for (var i = 0, len = walls.length; i < len; ++i) {
    var w = walls[i];
    var slope = (w.p1.y - w.p2.y) / (w.p2.x - w.p2.x);

    var j, width = 5;
    for (j = 0; j < width; ++j) {
      if (Math.abs(slope - ((point.y - (w.p1.y + j))) / (point.x - w.p1.x)) < this.selectEpsilon) return w; 
    }
    for (j = 0; j < width; ++j) {
      if (Math.abs(slope - ((point.y - (w.p1.y - j))) / (point.x - w.p1.x)) < this.selectEpsilon) return w; 
    }
    for (j = 0; j < width; ++j) {
      if (Math.abs(slope - ((point.y - w.p1.y)) / (point.x - (w.p1.x + j))) < this.selectEpsilon) return w; 
    }
    for (j = 0; j < width; ++j) {
      if (Math.abs(slope - ((point.y - w.p1.y)) / (point.x - (w.p1.x - j))) < this.selectEpsilon) return w; 
    }
  }
  return null;
};

SpaceManager.prototype.getWalls = function() {
  return this.walls;
};

SpaceManager.prototype.axisAlignWall = function(wall) {
  if (Math.abs(wall.p1.x - wall.p2.x) < this.axisAlignEpsilon) {
    wall.p2.x = wall.p1.x;
  }
  if (Math.abs(wall.p1.y - wall.p2.y) < this.axisAlignEpsilon) {
    wall.p2.y = wall.p1.y;
  }
  return wall;
};

SpaceManager.prototype.snapPointToWall = function(point) {
  var snapPoint = null;
  var walls = this.walls;
  for (var i = 0, len = walls.length; i < len; ++i) {
    if (Math.abs(walls[i].p1.x - point.x) < this.snappingEpsilon &&
        Math.abs(walls[i].p1.y - point.y) < this.snappingEpsilon) {
      snapPoint = walls[i].p1;
      break;
    }
    if (Math.abs(walls[i].p2.x - point.x) < this.snappingEpsilon &&
        Math.abs(walls[i].p2.y - point.y) < this.snappingEpsilon) {
      snapPoint = walls[i].p2;
      break;
    }
  }
  return snapPoint ? snapPoint : point;
};

SpaceManager.prototype.calcNormalizedWalls = function() {
  // copy the walls array to normWalls
  this.normWalls = cloneWallArray(this.walls);

  // calc 2d max/min values
  var maxX = -Infinity, maxY = -Infinity;
  var minX = Infinity, minY = Infinity;
  for (i = 0, len = this.normWalls.length; i < len; ++i) {
    // determine max
    if (this.normWalls[i].p1.x > maxX) maxX = this.normWalls[i].p1.x;
    if (this.normWalls[i].p2.x > maxX) maxX = this.normWalls[i].p2.x;
    if (this.normWalls[i].p1.y > maxY) maxY = this.normWalls[i].p1.y;
    if (this.normWalls[i].p2.y > maxY) maxY = this.normWalls[i].p2.y;

    // determine min
    if (this.normWalls[i].p1.x < minX) minX = this.normWalls[i].p1.x;
    if (this.normWalls[i].p2.x < minX) minX = this.normWalls[i].p2.x;
    if (this.normWalls[i].p1.y < minY) minY = this.normWalls[i].p1.y;
    if (this.normWalls[i].p2.y < minY) minY = this.normWalls[i].p2.y;
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
    this.normWalls[i].p1.x = (this.normWalls[i].p1.x - minX) / range;
    this.normWalls[i].p2.x = (this.normWalls[i].p2.x - minX) / range;
    this.normWalls[i].p1.y = (this.normWalls[i].p1.y - minY) / range;
    this.normWalls[i].p2.y = (this.normWalls[i].p2.y - minY) / range;
  }
};

SpaceManager.prototype.calcVerts = function(wall, verts, faces) {
  var offset = verts.length;

  verts.push(new Vec3(wall.p1.x, wall.p1.y, 0));
  verts.push(new Vec3(wall.p1.x, wall.p1.y, this.wallHeight));
  verts.push(new Vec3(wall.p2.x, wall.p2.y, 0)); 
  verts.push(new Vec3(wall.p2.x, wall.p2.y, this.wallHeight)); 

  faces.push(new Vec3(offset + 1, offset + 3, offset + 2));
  faces.push(new Vec3(offset + 3, offset + 4, offset + 2));
  faces.push(new Vec3(offset + 1, offset + 2, offset + 3));
  faces.push(new Vec3(offset + 3, offset + 2, offset + 4));
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


