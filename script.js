const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

const centreY = canvas.height / 2;
const centreX = canvas.width / 2;

let objects = [];


// Dictionary of pressed keys
let keys = {
  w: false,
  a: false,
  s: false,
  d: false
}


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
  // Constructor for all of the attributes 
  // that will be required to render the objects
  constructor(color, mass, radius, pos, vel, acc) {
    this.color = color;
    this.mass = mass;
    this.radius = radius;
    this.pos = pos;
    this.vel = vel;
    this.acc = acc;
  }

  // This method updates the positions 
  // and velocities of objects using leapfrog integration
  leapfrogIntegration() {
    this.vel.X += this.acc.X/2;
    this.vel.Y += this.acc.Y/2;

    this.pos.addVector(this.vel);

    this.vel.X += this.acc.X/2;
    this.vel.Y += this.acc.Y/2;

    this.acc.X = 0;
    this.acc.Y = 0;
  }

  renderObject() {
    // Saves the current canvas configuration
    ctx.save();

    ctx.beginPath();
    // Translates the origin to the position 
    // of the object relative to the centre of the canvas
    ctx.translate(this.pos.X + centreX, 
      this.pos.Y + centreY);

    // Creates the circle
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);

    // Makes the fill colour correct
    ctx.fillStyle = this.color;

    // Fills the circle
    ctx.fill();

    // Restores the original canvas state
    ctx.restore();
  }
}

class Player extends Object {
  constructor(color, mass, radius, pos, vel, acc){
    super(color, mass, radius, pos, vel, acc)
    this.angularVelocity = 0;
    this.angle = 0;

    // Decimal fraction of the acceleration being applied
    this.thrust = 0;

    // Maximum acceleration of the craft
    this.acceleration = 1;
  }

  renderObject () {
    ctx.save();
    ctx.translate(centreX, centreY);
    ctx.rotate(this.angle);
  

    // Draw exhaust
    if (this.thrust > 0) {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-50 * this.thrust, 190 * this.thrust);
      ctx.lineTo(50 * this.thrust, 190 * this.thrust);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-35 * this.thrust, 160 * this.thrust);
      ctx.lineTo(35 * this.thrust, 160 * this.thrust);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-20 * this.thrust, 130 * this.thrust);
      ctx.lineTo(20 * this.thrust, 130 * this.thrust);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#444444";
    // Engine bell
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(50, 100);
    ctx.lineTo(-50, 100);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "gray";
    // Craft body
    ctx.beginPath();
    ctx.moveTo(-50, -50);
    ctx.lineTo(0, -150);
    ctx.lineTo(50, -50);
    ctx.lineTo(50, 50);
    ctx.lineTo(-50, 50);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  applyRocketControls(){

    

    // Checks if keys are pressed down. If true apply the correct effects
    if(keys.w){
      this.thrust += 0.02
    }

    if(keys.s){
      this.thrust -= 0.02
    }

    if(keys.a){
      this.angularVelocity -= 0.001
    }

    if(keys.a){
      this.angularVelocity += 0.001
    }

    this.angle += this.angularVelocity
    if(this.angle>Math.PI*2){
      this.angle -= Math.PI*2
    }
  }

}

function updateObjects() {
  
  for(let i = 0; i < objects.length; i++) {
    objects[i].leapfrogIntegration();
  }
}

function renderObjects() {
  for(let i = 0; i < objects.length; i++) {
    objects[i].renderObject()
  }
}

function draw(time) {
  // Clears the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Updates the positions and velocities of the objects
  updateObjects();
  
  // Renders the objects on the canvas
  renderObjects();

  // Requests the next frame to be drawn, 
  // creating a loop repeating 60 times per second
  requestAnimationFrame(draw);
}

// Event listeners for keypresses

document.addEventListener("keydown", function (e) {
  switch(e.key){
    case "w":
      keys.w = true;
      break;
    case "a":
      keys.a = true;
      break;
    case "s":
      keys.s = true;
      break;
    case "d":
      keys.d = true;
      break;
    default:
      break;
  }
})

document.addEventListener("keyup", function (e) {
  switch(e.key){
    case "w":
      keys.w = false;
      break;
    case "a":
      keys.a = false;
      break;
    case "s":
      keys.s = false;
      break;
    case "d":
      keys.d = false;
      break;
    default:
      break;
  }
})

function init() {
  draw();
}

objects.push(new Player("red", 100, 100, new Vector(0,0), new Vector(0,0), new Vector(0,0), 1))
draw();





