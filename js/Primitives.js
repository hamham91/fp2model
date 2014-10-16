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

var Wall = function(p1, p2) {
  this.p1 = p1;
  this.p2 = p2;
};

Wall.prototype.clone = function() {
  return new Wall(this.p1.clone(), this.p2.clone());
};

function cloneWallArray(walls) {
  var newWalls = [];
  for (var i = 0, len = walls.length; i < len; ++i) {
    newWalls.push(walls[i].clone);
  }
  return newWalls();
}
