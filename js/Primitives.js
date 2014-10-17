var Vec3 = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
};

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

var Wall = function(line) {
  this.line = line;
  this.doors = [];
  this.windows = [];
};

Wall.prototype.clone = function() {
  var wall = new Wall(this.line.clone());
  for (var i=0, len=this.doors.length; i<len; i++) {
    wall.doors.push( this.doors[i].clone() );
  }
  for (var i=0, len=this.windows.length; i<len; i++) {
    wall.windows.push( this.windows[i].clone() );
  }
  return wall;
};

function cloneWallArray(walls) {
  var newWalls = [];
  for (var i = 0, len = walls.length; i < len; ++i) {
    newWalls.push(walls[i].clone());
  }
  return newWalls;
}
