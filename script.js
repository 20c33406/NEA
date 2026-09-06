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

  calculateCollision(object) {
    let dist = Math.hypot(this.pos.X - object.pos.X, this.pos.Y - object.pos.Y)
    if (dist < this.radius + object.radius) {

      let angle = -Math.atan2(object.pos.Y - this.pos.Y, object.pos.X - this.pos.X)

      // First, rotate the system by the angle
      // to align it to the x axis using vector multiplication

      let thisRotatedVelocity = this.vel.rotate(angle)
      let objRotatedVelocity = object.vel.rotate(angle)
      let e = restitution;
      let u1 = thisRotatedVelocity.Y;
      let u2 = objRotatedVelocity.;

      let m1 = this.mass;
      let m2 = object.mass;

      let v1 = (e * m2 * (u2 - u1) + m1 * u1 + m2 * u2) / (m1 + m2);
      let v2 = (e * m1 * (u1 - u2) + m1 * u1 + m2 * u2) / (m1 + m2);

      let dv1 = v1 - u1
      let dv2 = v2 - u2

      let thisRotatedAcceleration = new Vector(dv1, 0)
      let objRotatedAcceleration = new Vector(dv2, 0)

      let thisAcceleration = thisRotatedAcceleration.rotate(-angle)
      let objAcceleration = objRotatedAcceleration.rotate(-angle)

      this.acc.X += thisAcceleration.X
      object.acc.X += objAcceleration.X
      this.acc.Y += thisAcceleration.Y
      object.acc.Y += objAcceleration.Y


    }

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
    this.acceleration = 0.01;
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

    if (this.thrust > 1) {
      this.thrust = 1
    } else if (this.thrust < 0) {
      this.thrust = 0
    }

    
    this.acc.X += this.acceleration * this.thrust * Math.cos(this.angle)
    this.acc.Y -= this.acceleration * this.thrust * Math.sin(this.angle)
  }

}

function updateObjects() {
  player.applyRocketControls();
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

  // Checks all of the registered inputs


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

let player = new Player("red", 0, 0, new Vector(0, -300), new Vector(0, 0), new Vector(0, 0), 1)

objects.push(new Object("blue", 1000, 100, new Vector(-250,0), new Vector(0,0), new Vector(0,0), 1))
objects.push(new Object("red", 1000, 100, new Vector(250,0), new Vector(0,0), new Vector(0,0), 1))

/*
objects.push(new Object("blue", 100000, 100, new Vector(-250,0), new Vector(0,0), new Vector(0,0), 1))
objects.push(new Object("red", 1000, 100, new Vector(250,0), new Vector(0,0), new Vector(0,0), 1))
*/

/*
objects.push(new Object("blue", 1000, 100, new Vector(-250,0), new Vector(0,0), new Vector(0,-1), 1))
objects.push(new Object("red", 1000, 100, new Vector(250,0), new Vector(0,0), new Vector(0,-1), 1))
*/

/*
objects.push(new Object("blue", 1000, 100, new Vector(-250,0), new Vector(0,0), new Vector(1,0), 1))
objects.push(new Object("red", 1000, 100, new Vector(250,0), new Vector(0,0), new Vector(0,-3), 1))
objects.push(new Object("red", 1000, 100, new Vector(0,500), new Vector(0,0), new Vector(2,0), 1))
*/

objects.push(player)
draw();
