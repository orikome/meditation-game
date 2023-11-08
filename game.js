// Constants
const STARTING_RADIUS = 100;
const GROWTH_FACTOR = 1.5;
const SHRINK_FACTOR = 0.5;
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
const SCALE_FACTOR = 50; // Distance between phyllotaxis pattern points
const OFFSET = STARTING_RADIUS + 60; // Ensure we start outside the static circle
const RESET_SCORE_AMOUNT = 20;

// State variables
let dynamicRadius;
let score = 0;
let effectCounter = 0;
let maxSize;
let minSize;

let rippleStart = false;
let rippleRadius = 0;
let rippleSpeed = 2;
let rippleWidth = 80;
let rippleAmplitude = 20; // Height of the ripple
let phyllotaxisPoints = [];

let isEndingSequence = false;
let endingSequenceFrameCounter = 0;
let endingSequenceSpeed = 2;


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
  if (isEndingSequence) {
    animateEndingSequence();
  } else {
    renderPhyllotaxis();
  }
  renderRipple();

  if (score >= RESET_SCORE_AMOUNT && !isEndingSequence) {
    startEndingSequence();
  }
}

function renderPhyllotaxis() {
  phyllotaxisPoints = []; // Reset the array each frame
  push();
  translate(width / 2, height / 2);

  // Gradient colors
  let innerColor = color(...DYNAMIC_CIRCLE_COLOR);
  let outerColor = color(...ACTIVE_CIRCLE_COLOR);

  // Find the starting point where the radius will be just outside the static circle
  let start = floor((OFFSET * OFFSET) / (SCALE_FACTOR * SCALE_FACTOR));

  // Define the outer boundary for the gradient effect, half the width or height of the canvas
  let boundaryRadius = min(width, height) / 2;

  for (let i = start; i < start + score * 3; i++) {
    let angle = i * GOLDEN_ANGLE;
    let radius = SCALE_FACTOR * sqrt(i);

    if (radius >= OFFSET) {
      // Convert polar coordinates to Cartesian coordinates
      let x = radius * cos(radians(angle));
      let y = radius * sin(radians(angle));
      
      let isAffectedByRipple = isWithinRipple(x, y);

      // Apply the ripple effect
      let rippleEffect = applyRippleEffect(x, y, isAffectedByRipple);
      let rippleX = rippleEffect.x;
      let rippleY = rippleEffect.y;

      // Calculate the gradient based on the distance to the center
      let lerpAmount = map(radius, OFFSET, boundaryRadius, 0, 1);
      let currentColor = lerpColor(innerColor, outerColor, lerpAmount);

      // Change the color if affected by ripple
      fill(isAffectedByRipple ? EFFECT_COLOR : currentColor);
      
      noStroke();
      ellipse(rippleX, rippleY, 25, 25);

      phyllotaxisPoints.push({x: rippleX, y: rippleY, color: currentColor});
    }
  }

  drawLinesBetweenPoints(phyllotaxisPoints);
  pop();
}

function animateEndingSequence() {
  if (phyllotaxisPoints.length > 0) {
    // Only remove a point every 'endingSequenceSpeed' frame
    if (endingSequenceFrameCounter % endingSequenceSpeed === 0) {
      phyllotaxisPoints.pop();
      score = max(0, score - 1);
      endingSequenceFrameCounter = 0;
    }
    endingSequenceFrameCounter++;

    push();
    translate(width / 2, height / 2);
    drawLinesBetweenPoints(phyllotaxisPoints);

    for (let point of phyllotaxisPoints) {
      fill(point.color);
      noStroke();
      ellipse(point.x, point.y, 25, 25);
    }
    pop();
  } else {
    // Once all points are gone, stop the ending sequence
    isEndingSequence = false;
  }
}

function drawLinesBetweenPoints(points) {
  let maxLineDistance = 90;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) { // Start at i + 1 to avoid duplicating lines
      let d = dist(points[i].x, points[i].y, points[j].x, points[j].y);
      if (d < maxLineDistance) {
        let lineColor = lerpColor(points[i].color, points[j].color, 0.5);
        stroke(lineColor);
        line(points[i].x, points[i].y, points[j].x, points[j].y);
      }
    }
  }
}

function startRipple() {
  rippleStart = true;
  rippleRadius = 0; // Reset the ripple to start from the beginning
}

function renderRipple() {
  if (!rippleStart) return;
  
  rippleRadius += rippleSpeed;
  if (rippleRadius - OFFSET > width) {
    rippleStart = false;
  }
}

function applyRippleEffect(x, y, isAffectedByRipple) {
  let distanceFromCenter = dist(0, 0, x, y) - OFFSET;
  if (isAffectedByRipple) {
    // Apply a displacement based on a sine wave
    let displacement = sin((rippleRadius - distanceFromCenter) / rippleWidth * PI) * rippleAmplitude;
    // Move the ellipse outward by the displacement amount
    let angle = atan2(y, x);
    x += displacement * cos(angle);
    y += displacement * sin(angle);
  }
  return { x, y };
}

function isWithinRipple(x, y) {
  let distanceFromCenter = dist(0, 0, x, y) - OFFSET;
  // Check if the ellipse is within the range of the current ripple wave
  return (
    rippleStart &&
    distanceFromCenter < rippleRadius &&
    distanceFromCenter > rippleRadius - rippleWidth
  );
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
  text(`${score}`, width / 2, height / 2);
}

function applyEffect() {
  if (effectCounter > 0) {
    fill(...EFFECT_COLOR);
    ellipse(width / 2, height / 2, STARTING_RADIUS * 2);
    effectCounter--;
  }
}

function touchStarted() {
  const distanceFromCenter = dist(mouseX, mouseY, width / 2, height / 2);
  if (distanceFromCenter <= STARTING_RADIUS) {
    checkTiming();
    startRipple();
    return false;
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
  if (isEndingSequence) return;

  let diff = abs(STARTING_RADIUS - dynamicRadius);
  if (diff <= TOLERANCE) {
    score++;
    effectCounter = EFFECT_DURATION;
  } else {
    score = 0;
  }
}

function startEndingSequence() {
  isEndingSequence = true;
}

function resetGame() {
  isEndingSequence = false;
  score = 0;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}