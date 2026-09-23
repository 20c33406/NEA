// Defines the HTML objects needed for canvas
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// Reference to the body tag for deceting zoom event
const body = document.querySelector("body");

// The gameSpeedValue tag which is updated when the game speed is changed
const gameSpeedValue = document.getElementById("gameSpeedValue")

const configInput = document.getElementById('configInput')

// The location of the centre of the canvas
const centreY = canvas.height / 2;
const centreX = canvas.width / 2

// The minimum radius an object can be on the screen before its symbol appears
const minimumRadius = 1.5;

// The constant that defines the speed of the scrolling
const scaleFactor = 1/1000;

// The gravitational constant of the simulation
const GCONST = 6.67*(10**-11);

// The coefficient of restitution between all of the objects in the game
const restitution = 1;

// The current game speed multiplier
let gameSpeed = 1;

// The current scale of the camera view
let scale = 1;

let doCollisions = true
let doGravity = true
let usePlayer = true

//
let objects = [];

let player;


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
  rotate(theta) {
    return new Vector(
      this.X * Math.cos(theta) - this.Y * Math.sin(theta),
      this.X * Math.sin(theta) + this.Y * Math.cos(theta)
    )
  }
  unitVector() {
    return new Vector(
      this.X / Math.hypot(this.Y, this.X),
      this.Y / Math.hypot(this.Y, this.X)
    )
  }
  mult(mult) {
    return new Vector(
      this.X * mult,
      this.Y * mult
    )
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

  calculateGravity(object) {


    let dist = Math.hypot(this.pos.X - object.pos.X, this.pos.Y - object.pos.Y);
    let angle = Math.atan2(object.pos.Y - this.pos.Y, object.pos.X - this.pos.X);

    if (dist < this.radius + object.radius) { return }

    let thisMagnitude = (GCONST * object.mass) / (dist ** 2);
    let objMagnitude = (GCONST * this.mass) / (dist ** 2);

    let thisAcceleration = new Vector(thisMagnitude, 0).rotate(angle)
    let objAcceleration = new Vector(objMagnitude, 0).rotate(angle + Math.PI)

    this.acc.X += thisAcceleration.X
    this.acc.Y += thisAcceleration.Y

    object.acc.X += objAcceleration.X
    object.acc.Y += objAcceleration.Y
  }

  calculateCollision(object) {
    if(this.mass==0 || object.mass==0){return}
    let dist = Math.hypot(this.pos.X - object.pos.X, this.pos.Y - object.pos.Y);
    if (dist < this.radius + object.radius) {

      let angle = -Math.atan2(object.pos.Y - this.pos.Y, object.pos.X - this.pos.X);

      // First, rotate the system by the angle
      // to align it to the x axis using vector multiplication

      let thisRotatedVelocity = this.vel.rotate(angle);
      let objRotatedVelocity = object.vel.rotate(angle);


      let e = restitution;

      let u1 = thisRotatedVelocity.X;
      let u2 = objRotatedVelocity.X;

      let m1 = this.mass;
      let m2 = object.mass;

      let v1 = (m1 * u1 + m2 * u2 + e * m2 * (u2 - u1)) / (m1 + m2);
      let v2 = (m1 * u1 + m2 * u2 + e * m1 * (u1 - u2)) / (m1 + m2);

      let dv1 = v1 - u1;
      let dv2 = v2 - u2;

      let thisRotatedAcceleration = new Vector(dv1, 0);
      let objRotatedAcceleration = new Vector(dv2, 0);

      let thisAcceleration = thisRotatedAcceleration.rotate(-angle);
      let objAcceleration = objRotatedAcceleration.rotate(-angle);

      this.vel.X += thisAcceleration.X;
      object.vel.X += objAcceleration.X;
      this.vel.Y += thisAcceleration.Y;
      object.vel.Y += objAcceleration.Y;
    }

  }

  // This method updates the positions
  // and velocities of objects using leapfrog integration


  renderObject() {

    // Saves the current canvas configuration
    ctx.save();

    ctx.beginPath();
    // Translates the origin to the position
    // of the object relative to the centre of the canvas
    ctx.translate(this.pos.X + centreX - player.pos.X,
      this.pos.Y + centreY - player.pos.Y);

    // Creates the circle
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);

    // Makes the fill colour correct
    ctx.fillStyle = this.color;

    // Fills the circle
    ctx.fill();

    // Restores the original canvas state
    ctx.restore();
  }

  renderSymbol() {
    ctx.save();

    ctx.beginPath();
    // Translates the origin to the position
    // of the object relative to the centre of the canvas
    ctx.translate(centreX + ((this.pos.X - player.pos.X)*scale),
      centreY - ((-this.pos.Y + player.pos.Y)*scale));

    // Creates the circle
    ctx.arc(0, 0, 10, 0, 2 * Math.PI);

    // Makes the fill colour correct
    ctx.fillStyle = this.color;

    // Makes the circle transparent
    ctx.globalAlpha = 0.5

    // Fills the circle
    ctx.fill();

    // Makes the pen opaque again
    ctx.globalAlpha = 1

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
    this.acceleration = 100;

    //
    this.sas = 'na'
  }

  renderObject () {
    ctx.save();
    ctx.translate(centreX, centreY);
    ctx.rotate(- this.angle + Math.PI/2);


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

  renderSymbol() {
    ctx.save();

    ctx.translate(centreX, centreY);
    ctx.rotate(- this.angle + Math.PI/2);
    ctx.translate(-centreX, -centreY);

    ctx.fillStyle = "green";
    ctx.globalAlpha = 0.5;

    ctx.beginPath();
    ctx.moveTo(centreX, centreY - 15);
    ctx.lineTo(centreX - 10, centreY + 15);
    ctx.lineTo(centreX + 10, centreY + 15);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;

    ctx.restore();
  }

  getSOI() {
    let soiEffect = -1;
    let soi = 0;
    for (let i = 0; i < objects.length; i++){
      let dist = Math.hypot(objects[i].pos.Y - this.pos.Y, objects[i].pos.X - this.pos.X)
      let effect = dist**2 / objects[i].mass
      if ((effect < soiEffect || soiEffect == -1) && dist!=0) {
        soiEffect = effect
        soi = i
      }
    }
    return objects[soi]
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
      this.angularVelocity += 0.0001
    }
    if(keys.d){
      this.angularVelocity -= 0.0001
    }

    let soi = this.getSOI()
    let newAngle = this.angle
    switch (this.sas) {
      case 'pg':
        newAngle = -Math.atan2(this.vel.Y - soi.vel.Y, this.vel.X - soi.vel.X)
        break
      case 'rg':
        newAngle = -Math.atan2(this.vel.Y - soi.vel.Y, this.vel.X - soi.vel.X) + Math.PI
        break
      case 'no':
        newAngle = -Math.atan2(this.vel.Y - soi.vel.Y, this.vel.X - soi.vel.X) + Math.PI/2
        break
      case 'an':
        newAngle = -Math.atan2(this.vel.Y - soi.vel.Y, this.vel.X - soi.vel.X) + 3*Math.PI/2
        break
      case 'ri':
        newAngle = -Math.atan2(this.pos.Y - soi.pos.Y, this.pos.X - soi.pos.X) + Math.PI
        break
      case 'ro':
        newAngle = -Math.atan2(this.pos.Y - soi.pos.Y, this.pos.X - soi.pos.X)
        break
      default:
        break
    }

    if (this.sas == 'na') {

      this.angle += this.angularVelocity
      if (this.angle > Math.PI * 2) {
        this.angle -= Math.PI * 2
      }
    } else {
      this.angle = newAngle
      this.angularVelocity = 0
    }


    // Limits the thrust between 0 and 1

    if (this.thrust > 1) {
      this.thrust = 1
    } else if (this.thrust < 0) {
      this.thrust = 0
    }

    this.acc.X += this.acceleration * this.thrust * Math.cos(this.angle)
    this.acc.Y -= this.acceleration * this.thrust * Math.sin(this.angle)
  }

}

function applyPhysics() {
  for (let i = 0; i < objects.length; i++){
    for (let j = i + 1; j < objects.length; j++){
      if (doGravity) {
        objects[i].calculateGravity(objects[j]);
      }
      if (doCollisions) {
        objects[i].calculateCollision(objects[j]);
      }
    }
  }
}



function updateObjects() {
  for(let i = 0; i < objects.length; i++) {
    objects[i].vel.X += objects[i].acc.X/2;
    objects[i].vel.Y += objects[i].acc.Y / 2;

    objects[i].pos.addVector(objects[i].vel);
  }

  for(let i = 0; i < objects.length; i++) {
    objects[i].acc.setZero()
  }

  applyPhysics();
  if (usePlayer) {
    player.applyRocketControls();
  }


  for(let i = 0; i < objects.length; i++) {
    objects[i].vel.X += objects[i].acc.X/2;
    objects[i].vel.Y += objects[i].acc.Y / 2;
  }
}

function renderObjects() {
  for(let i = 0; i < objects.length; i++) {
    objects[i].renderObject()

  }
}

function renderSymbols(){
  for (let i = 0; i < objects.length; i++){
    if (objects[i].radius * scale < minimumRadius) {
      objects[i].renderSymbol()
    }
  }
}


function draw(time) {
  // Clears the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Scales the camera view
  ctx.save()
  ctx.translate(centreX,centreY)
  ctx.scale(scale,scale)
  ctx.translate(-centreX,-centreY)

  // Updates the positions and velocities of the objects
  // and repeats depending on the game speed
  for (let i = 0; i < gameSpeed; i++){
    updateObjects();
  }

  // Renders the objects on the canvas
  renderObjects();

  ctx.restore()

  renderSymbols();
  console.log(objects)
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


function loadConfig() {
  const JSONconfig = configInput.value
  const config = JSON.parse(JSONconfig)

  objects = [];
  usePlayer = config[0][0]
  doGravity = config[0][1]
  doCollisions = config[0][2]
  if (usePlayer) {
    player = new Player("red", 1, 1, new Vector(0, 0), new Vector(0, 10 ** 4), new Vector(0, 0))
    objects.push(player)
  }



  for (let i = 1; i < config.length; i++){
    let card = config[i]
    objects.push(new Object(
      card[12],
      card[2] * 10 ** card[3],
      card[0] * 10 ** card[1],
      new Vector(card[4] * 10 ** card[5], card[6] * 10 ** card[7]),
      new Vector(card[8] * 10 ** card[9], card[10] * 10 ** card[11]),
      new Vector(0, 0)
    ))
  }
}

function zoom(event) {
  scale = Math.min(1,scale + (scaleFactor * event.deltaY * scale))
}

function increaseTime() {
  gameSpeed *= 2
  gameSpeedValue.innerText = gameSpeed

}

function decreaseTime() {
  if (gameSpeed == 1) { return }
  gameSpeed *= 0.5
  gameSpeedValue.innerText = gameSpeed
}

function checkControls() {
  player.sas = document.querySelector('input[name="rocketControls"]:checked').value;
}

body.onwheel = zoom

function init() {
  draw();
}

player = new Player("red", 1, 1, new Vector(0, 0), new Vector(0, 0), new Vector(0, 0))

draw();
