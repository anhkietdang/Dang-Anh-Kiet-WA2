// FIELD TRIP SIMULATION — GRAVITY BASED
// Science Lens: Newtonian Gravity

let bodies = [];       // Array of moving particles
let attractors = [];   // Array of gravity sources
let environment;       // Drag zone area

// UI and mode toggles
let calmMode = true;
let chaosMode = false;
let snowMode = false;
let windMode = false;
let decaytime = 1000;
let showOverlay = true;
let modeName = '';

// Simulation seed for reproducibility
let seed;

function setup() {
  createCanvas(windowWidth, windowHeight);
  seed = int(random(10000));
  randomSeed(seed);
  noiseSeed(seed);

  // Initialize bodies and attractor
  for (let i = 0; i < 2; i++) {
    bodies.push(new Body(random(width), random(height), random(-1, 1), random(-1, 1), random(10, 30)));
  }
  attractors.push(new Attractor(width / 2, height / 2, 50));

  // Define environment drag zone
  environment = new DragZone(width / 4, height / 4, width / 2, height / 2);
}

function draw() {
  // Background color based on mode
  if (calmMode) background(30);
  else if (chaosMode) background(200);
  else if (windMode) background(245);
  else background(80);

  // Apply forces to bodies
  for (let body of bodies) {
    for (let attractor of attractors) {
      let force = attractor.attract(body);
      body.applyForce(force);
    }
    if (environment.contains(body)) environment.applyEffect(body);
    body.update();
    body.display();
  }

  // Draw attractors
  for (let attractor of attractors) attractor.display();

  // Overlay info panel
  if (showOverlay) {
    fill(calmMode || snowMode ? 255 : 0);
    textSize(16);
    text("T: show overlay", width - 170, 20);
    text("M: calm mode", width - 170, 40);
    text("L: chaos mode", width - 170, 60);
    text("N: new seed", width - 170, 80);
    text("R: reset seed", width - 170, 100);
    text("S: snow mode", width - 170, 120);
    text("W: wind mode", width - 170, 140);

    text(`Bodies: ${bodies.length}`, 20, 20);
    text(`Attractors: ${attractors.length}`, 20, 40);

    if (calmMode) modeName = "Calm";
    else if (chaosMode) modeName = "Chaos";
    else if (snowMode) modeName = "Snow";
    else if (windMode) modeName = "Hurricane";
    text(`Mode: ${modeName}`, 20, 60);
    text(`Seed: ${seed}`, 20, 80);
  }

  // Remove offscreen or expired bodies
  cleanupBodies();
}

function mousePressed(event) {
  if (event.shiftKey) {
    attractors.push(new Attractor(mouseX, mouseY, 50));
  } else {
    let count = calmMode ? 1 : chaosMode ? 2 : snowMode ? 3 : windMode ? 4 : 1;
    for (let i = 0; i < count; i++) {
      bodies.push(new Body(mouseX, mouseY, random(-2, 2), random(-2, 2), random(10, 30)));
    }
  }
}

function keyPressed() {
  const k = key.toLowerCase();

  if (k === 't') showOverlay = !showOverlay;
  else if (k === 'm') setMode("calm");
  else if (k === 'l') setMode("chaos");
  else if (k === 's') setMode("snow");
  else if (k === 'w') setMode("wind");
  else if (k === 'r') {
    randomSeed(seed);
    noiseSeed(seed);
    resetSimulation();
  } else if (k === 'n') {
    seed = int(random(10000));
    randomSeed(seed);
    noiseSeed(seed);
    resetSimulation();
  }
}

function setMode(mode) {
  calmMode = chaosMode = snowMode = windMode = false;
  if (mode === "calm") calmMode = true;
  else if (mode === "chaos") chaosMode = true;
  else if (mode === "snow") snowMode = true;
  else if (mode === "wind") windMode = true;
}

function resetSimulation() {
  bodies = [];
  attractors = [new Attractor(width / 2, height / 2, 50)];
  for (let i = 0; i < 2; i++) {
    bodies.push(new Body(random(width), random(height), random(-1, 1), random(-1, 1), random(10, 30)));
  }
}

function cleanupBodies() {
  for (let i = bodies.length - 1; i >= 0; i--) {
    let b = bodies[i];
    if (b.pos.x < -50 || b.pos.x > width + 50 || b.pos.y < -50 || b.pos.y > height + 50 || b.isDead()) {
      bodies.splice(i, 1);
    }
  }
}

// Body: A particle influenced by forces
class Body {
  constructor(x, y, vx, vy, m) {
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.acc = createVector(0, 0);
    this.mass = m;
    this.lifetime = decaytime;
  }

  applyForce(f) {
    let a = p5.Vector.div(f, this.mass);
    this.acc.add(a);
  }

  update() {
    this.vel.add(this.acc);

    // Boost velocity by mode type
    if (!calmMode) {
      this.vel.add(this.acc * (chaosMode ? 16 : snowMode ? 0.25 : 64));
    }

    this.pos.add(this.vel);
    this.acc.mult(0);
    this.lifetime--;
  }

  isDead() {
    return this.lifetime <= 0;
  }

  display() {
    noStroke();
    let alpha = map(this.lifetime, 0, decaytime, 0, 255);
    if (calmMode) fill(200, 200, 255, alpha);
    else if (chaosMode) fill(20, 20, 20, alpha);
    else if (snowMode) fill(230, 230, 255, alpha);
    else fill(10, 10, 10, alpha);

    ellipse(this.pos.x, this.pos.y, this.mass);
  }
}

// Attractor: Applies gravitational pull
class Attractor {
  constructor(x, y, m) {
    this.pos = createVector(x, y);
    this.mass = m;
    this.G = 1;
  }

  attract(b) {
    let force = p5.Vector.sub(this.pos, b.pos);
    let d = constrain(force.mag(), 5, 25);
    force.normalize();
    let strength = (this.G * this.mass * b.mass) / (d * d);
    force.mult(strength);
    return force;
  }

  display() {
    noStroke();
    if (calmMode) fill(255, 100, 100);
    else if (chaosMode) fill(0, 55, 155);
    else if (snowMode) fill(135, 255, 135);
    else fill(255, 175, 40);
    ellipse(this.pos.x, this.pos.y, this.mass);
  }
}

// DragZone: Area that applies drag to slow bodies
class DragZone {
  constructor(x, y, w, h) {
    this.bounds = { x, y, w, h };
  }

  contains(b) {
    return (
      b.pos.x > this.bounds.x &&
      b.pos.x < this.bounds.x + this.bounds.w &&
      b.pos.y > this.bounds.y &&
      b.pos.y < this.bounds.y + this.bounds.h
    );
  }

  applyEffect(b) {
    let drag = b.vel.copy();
    drag.mult(-0.1);
    b.applyForce(drag);
  }
}
