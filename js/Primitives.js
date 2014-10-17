var Vec3 = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
};

Vec3.prototype.cross = function(v) {
  return new Vec3(this.y * v.z - this.z * v.y,
                  this.z * v.x - this.x * v.z,
                  this.x * v.y - this.y * v.x
  );
};

var Point = function(x, y) {
  this.x = x;
  this.y = y;
};

Point.prototype.sub = function(p) {
  return new Point(this.x - p.x, this.y - p.y);
};

Point.prototype.cross = function(p) {
  return (new Vec3(this.x, this.y, 0)).cross(new Vec3(p.x, p.y, 0));
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
  var i, len;
  for (i = 0, len = this.doors.length; i < len; ++i) {
    wall.doors.push(this.doors[i].clone());
  }
  for (i = 0, len = this.windows.length; i < len; ++i) {
    wall.windows.push(this.windows[i].clone());
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
