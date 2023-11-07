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
const DYNAMIC_CIRCLE_COLOR = [70, 130, 180, 100]; // Blue
const ACTIVE_CIRCLE_COLOR = [128, 0, 128, 100]; // Purple
const EFFECT_COLOR = [0, 255, 100]; // Green
const SCORE_COLOR = [255];
const GOLDEN_ANGLE = 137.5;
const SCALE_FACTOR = 25; // Distance between phyllotaxis pattern points
const OFFSET = STARTING_RADIUS + 50; // Ensure we start outside the static circle

// State variables
let dynamicRadius;
let score = 0;
let effectCounter = 0;
let maxSize;
let minSize;

let rippleStart = false;
let rippleRadius = 0;
let rippleSpeed = 5;
let rippleWidth = 80;
let rippleAmplitude = 20; // Height of the ripple


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

function draw() {
  background(...BACKGROUND_COLOR);

  // Draw static circle
  fill(...STATIC_CIRCLE_COLOR);
  ellipse(width / 2, height / 2, STARTING_RADIUS * 2);

  renderDynamicCircle();
  renderScore();
  applyEffect();
  renderPhyllotaxis();
  renderRipple();
}

function renderPhyllotaxis() {
  push();
  translate(width / 2, height / 2);

  // Find the starting point where the radius will be just outside the static circle
  let start = floor((OFFSET * OFFSET) / (SCALE_FACTOR * SCALE_FACTOR));

  for (let i = start; i < start + score * 9; i++) {
    let angle = i * GOLDEN_ANGLE;
    let radius = SCALE_FACTOR * sqrt(i);

    if (radius >= OFFSET) {
      // Convert polar coordinates to Cartesian coordinates
      let x = radius * cos(radians(angle));
      let y = radius * sin(radians(angle));

      // Apply ripple effect
      let { x: rippleX, y: rippleY } = applyRippleEffect(x, y);

      fill(...ACTIVE_CIRCLE_COLOR);
      noStroke();
      ellipse(rippleX, rippleY, 15, 15);
    }
  }

  pop();
}

function startRipple() {
  rippleStart = true;
  rippleRadius = 0; // Reset the ripple to start from the beginning
}

function renderRipple() {
  if (!rippleStart) return;
  
  rippleRadius += 2;
  if (rippleRadius - OFFSET > width) {
    rippleStart = false;
  }
}

function applyRippleEffect(x, y) {
  let distanceFromCenter = dist(0, 0, x, y) - OFFSET;
  // Check if the ellipse is within the range of the current ripple wave
  if (rippleStart && distanceFromCenter < rippleRadius && distanceFromCenter > rippleRadius - rippleWidth) {
    // Apply a displacement based on a sine wave
    let displacement = sin((rippleRadius - distanceFromCenter) / rippleWidth * PI) * rippleAmplitude;
    // Move the ellipse outward by the displacement amount
    let angle = atan2(y, x);
    x += displacement * cos(angle);
    y += displacement * sin(angle);
  }
  return { x, y };
}

function renderDynamicCircle() {
  let cycleProgress = (frameCount % CYCLE_DURATION) / CYCLE_DURATION;
  let easedProgress = (cos(TWO_PI * cycleProgress) + 1) / 2; // Oscillates between 0 and 1
  dynamicRadius = lerp(minSize, maxSize, easedProgress);

  let colorAtMaxSize = color(...DYNAMIC_CIRCLE_COLOR); // Blue when the circle is at max or min size
  let colorAtOptimalSize = color(...ACTIVE_CIRCLE_COLOR); // Purple when it's time to press

  // Determine the proximity to the optimal size
  let proximity = abs(dynamicRadius - STARTING_RADIUS) / (maxSize - STARTING_RADIUS);

  // Use a quadratic easing for a smoother transition
  let colorEasedProgress = easeInOutQuad(max(0, 1 - proximity * 2));

  // Lerp the color based on the current size of the circle
  let currentColor = lerpColor(colorAtMaxSize, colorAtOptimalSize, colorEasedProgress);

  fill(currentColor);
  ellipse(width / 2, height / 2, dynamicRadius * 2);
}

// https://easings.net/#easeInOutQuad
function easeInOutQuad(x) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function renderScore() {
  fill(...SCORE_COLOR);
  text(`Score: ${score}`, width / 2, SCORE_POSITION_Y);
}

function applyEffect() {
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
    startRipple();
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