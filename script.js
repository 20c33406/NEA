
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

const centreY = canvas.height / 2;
const centreX = canvas.width / 2;

let objects = [];

class Vector {
  constructor(x, y) {
    this.X = x;
    this.Y = y;
  }
  addVector(vector) {
    this.X += vector.X;
    this.Y += vector.Y;
  }
  setZero() {
    this.X = 0;
    this.Y = 0;
  }
  
}



class Object {
  // Constructor for all of the attributes that will be required to render the objects
  constructor(color, mass, radius, pos, vel, acc) {
    this.color = color;
    this.mass = mass;
    this.radius = radius;
    this.pos = pos;
    this.vel = vel;
    this.acc = acc;
  }

  // This method updates the positions and velocities of objects using leapfrog integration
  leapfrogIntegration() {
    this.vel.X += this.acc.X/2;
    this.vel.Y += this.acc.Y/2;

    this.pos.addVector(this.vel);

    this.vel.X += this.acc.X/2;
    this.vel.Y += this.acc.Y/2;

    this.acc.X = 0;
    this.acc.Y = 0;
  }
}

function updateObjects() {
  for(let i = 0; i < objects.length; i++) {
    objects[i].leapfrogIntegration();
  }
}

function renderObjects() {
  for(let i = 0; i < objects.length; i++) {

    // Saves the current canvas configuration
    ctx.save();

    ctx.beginPath();
    // Translates the origin to the position 
    // of the object relative to the centre of the canvas
    ctx.translate(objects[i].pos.X + centreX, 
      objects[i].pos.Y + centreY);

    // Creates the circle
    ctx.arc(0, 0, objects[i].radius, 0, 2 * Math.PI);

    // Makes the fill colour correct
    ctx.fillStyle = objects[i].color;

    // Fills the circle
    ctx.fill();

    // Restores the original canvas state
    ctx.restore();
  }
}


function init() {
  draw();
}

function draw(time) {
  // Clears the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Updates the positions and velocities of the objects
  updateObjects();
  
  // Renders the objects on the canvas
  renderObjects();

  // Requests the next frame to be drawn, creating a loop repeating 60 times per second
  requestAnimationFrame(draw);
}


objects.push(new Object("red", 1, 20, new Vector(0, 0), new Vector(0, 0), new Vector(0, 0)));
draw();

ctx.rotate(angle+Math.PI/2)