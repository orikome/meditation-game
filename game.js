// Constants
const STARTING_RADIUS = 100;
const GROWTH_FACTOR = 1.5;
const SHRINK_FACTOR = 0.5;
const SCORE_POSITION_Y = 50;
const TEXT_SIZE = 32;
const TOLERANCE = 20;
const EFFECT_DURATION = 15;
const CYCLE_DURATION = 480; // Duration of the complete grow and shrink cycle in frames
const BACKGROUND_COLOR = [18, 18, 18];
const STATIC_CIRCLE_COLOR = [60, 60, 60];
const DYNAMIC_CIRCLE_COLOR = [70, 130, 180, 100];
const EFFECT_COLOR = [0, 255, 100]; // Green
const SCORE_COLOR = [255];

// State variables
let dynamicRadius;
let grow = true;
let score = 0;
let effectCounter = 0;
let maxSize;
let minSize;

// p5.js setup function to initialize the game
function setup() {
  createCanvas(windowWidth, windowHeight);
  dynamicRadius = STARTING_RADIUS;
  maxSize = STARTING_RADIUS * GROWTH_FACTOR;
  minSize = STARTING_RADIUS * SHRINK_FACTOR;
  textAlign(CENTER, CENTER);
  textSize(TEXT_SIZE);
  noStroke();
}

// Main draw loop
function draw() {
  background(...BACKGROUND_COLOR);

  // Draw static circle
  fill(...STATIC_CIRCLE_COLOR);
  ellipse(width / 2, height / 2, STARTING_RADIUS * 2);

  updateAndRenderDynamicCircle();
  renderScore();
  applyEffectIfNecessary();
}

function updateAndRenderDynamicCircle() {
  let cycleProgress = (frameCount % CYCLE_DURATION) / CYCLE_DURATION;
  let easedProgress = (cos(TWO_PI * cycleProgress) + 1) / 2; // Oscillates between 0 and 1
  dynamicRadius = lerp(minSize, maxSize, easedProgress);
  grow = sin(TWO_PI * cycleProgress) >= 0;

  fill(...DYNAMIC_CIRCLE_COLOR);
  ellipse(width / 2, height / 2, dynamicRadius * 2);
}

function renderScore() {
  fill(...SCORE_COLOR);
  text(`Score: ${score}`, width / 2, SCORE_POSITION_Y);
}

function applyEffectIfNecessary() {
  if (effectCounter > 0) {
    fill(...EFFECT_COLOR);
    ellipse(width / 2, height / 2, STARTING_RADIUS * 2);
    effectCounter--;
  }
}

function keyPressed() {
  // Spacebar
  if (keyCode === 32) {
    checkTiming();
  }
}

function checkTiming() {
  let diff = abs(STARTING_RADIUS - dynamicRadius);
  if (diff <= TOLERANCE) {
    score++;
    effectCounter = EFFECT_DURATION;
  } else {
    score = 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}