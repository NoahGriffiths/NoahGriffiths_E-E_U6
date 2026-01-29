let titleVideo;
let gameStarted = false;
let lastInputTime = 0; 

let froImg, toImg;
let PaddleLeftOpen, PaddleLeftHit, PaddleRightOpen, PaddleRightHit;
let paddleLeftX, paddleLeftY, paddleRightX, paddleRightY;
let paddleSpeed = 8; 
let leftScore = 0, rightScore = 0;
let paddleHeight = 160, paddleWidth = 20;

let ballPosX, ballPosY, ballSpeedX = 0, ballSpeedY = 0, ballSize = 60;
let playAreaHeight;
let leftHitTime = 0, rightHitTime = 0, hitDuration = 400;
let ballImg, trailImgs = [];
let bgImg;
let positionHistory = [];
let wistleSound;

let fallingSubtitles = [];
let placeData = [
  { name: "BeckinghamJunction", file: "sound1/BeckinghamJunction.mp3" },
  { name: "Blackfriars", file: "sound1/Blackfriars.mp3" },
  { name: "SntpancrasInternational", file: "sound1/SntPancrasInternational.mp3" },
  { name: "BrentCrossWest", file: "sound1/BrentCrossWest.mp3" },
  { name: "CityThamesLink", file: "sound1/CityThamesLink.mp3" },
  { name: "Cricklewood", file: "sound1/Cricklewood.mp3" },
  { name: "ElephantAndCastle", file: "sound1/ElephantAndCastle.mp3" },
  { name: "ElstreeAndBorehamwood", file: "sound1/ElstreeAndBorehamwood.mp3" },
  { name: "Farringdon", file: "sound1/Farringdon.mp3" },
  { name: "Hendon", file: "sound1/Hendon.mp3" },
  { name: "KentishTown", file: "sound1/KentishTown.mp3" },
  { name: "MillHillBraudway", file: "sound1/MillHillBraudway.mp3" },
  { name: "Radlet", file: "sound1/Radlet.mp3" },
  { name: "SntAlbansCity", file: "sound1/SntAlbansCity.mp3" },
  { name: "WestHampsteadThamesLink", file: "sound1/WestHampsteadThamesLink.mp3" },
];

let letterSets = [[], [], []];

function preload() {}

function setup() {
  createCanvas(windowWidth, windowHeight);
  playAreaHeight = height / 2.5;
  
  titleVideo = createVideo(['FixedTitleScreen.mp4']);
  titleVideo.hide();
  titleVideo.volume(0); 
  titleVideo.loop();
  titleVideo.play();

  loadGameAssets();

  paddleLeftX = 40;
  paddleLeftY = playAreaHeight / 2;
  paddleRightX = width - 40;
  paddleRightY = playAreaHeight / 2;
  
  lastInputTime = millis(); 
}

function loadGameAssets() {
  bgImg = loadImage('BlackFriersBackground1.png');
  froImg = loadImage('Fro.png');
  toImg = loadImage('To.png');
  PaddleLeftOpen = loadImage('Paddles/PPaddleLeftOpen.png');
  PaddleRightOpen = loadImage('Paddles/PPaddleRightOpen.png');
  PaddleLeftHit = loadImage('Paddles/PPaddleLeftHit.png');
  PaddleRightHit = loadImage('Paddles/PPaddleRightHit.png');
  ballImg = loadImage('Train/PBallFront.png');
  
  trailImgs[0] = loadImage('Train/PBallCar1.png');
  trailImgs[1] = loadImage('Train/PBallCar2.png');
  trailImgs[2] = loadImage('Train/PBallCar3.png');
  trailImgs.splice(3, 0, trailImgs[0], trailImgs[1], trailImgs[0], trailImgs[1]);

  soundFormats('mp3');
  wistleSound = loadSound('wistle.mp3');

  let letters = "abcdefghijklmnopqrstuvwxyz";
  for (let s = 0; s < 3; s++) {
    for (let i = 0; i < letters.length; i++) {
      let ch = letters[i];
      let path = `Letters${s + 1}/${ch}.png`;
      loadImage(path, img => {
        if (s >= 1) {
            img.loadPixels();
            for (let p = 0; p < img.pixels.length; p += 4) {
              if (img.pixels[p] > 240 && img.pixels[p+1] > 240 && img.pixels[p+2] > 240) img.pixels[p+3] = 0;
            }
            img.updatePixels();
        }
        letterSets[s][ch] = img;
      });
    }
  }
}

function draw() {
  if (millis() - lastInputTime > 15000) {
    window.location.reload(); 
  }

  if (!gameStarted) {
    background(0);
    if (titleVideo) image(titleVideo, 0, 0, width, height);
    return; 
  }

  imageMode(CORNER);
  if (bgImg) image(bgImg, 0, 0, width, height);
  else background(0);

  // --- SCORE ICONS (TO / FRO) ---
  imageMode(CENTER);
  let scoreY = playAreaHeight * 0.15 + 10;
  
  // Check if images are loaded before drawing
  if (froImg) {
    image(froImg, width * 0.25 - 50, scoreY, 40, 40);
  }
  if (toImg) {
    image(toImg, width * 0.75 + 50, scoreY, 40, 40);
  }

  // --- PADDLES ---
  let leftImg = (millis() - leftHitTime < hitDuration) ? PaddleLeftHit : PaddleLeftOpen;
  let rightImg = (millis() - rightHitTime < hitDuration) ? PaddleRightHit : PaddleRightOpen;
  
  if (leftImg) image(leftImg, paddleLeftX, paddleLeftY, paddleWidth, paddleHeight);
  if (rightImg) image(rightImg, paddleRightX, paddleRightY, paddleWidth, paddleHeight);

  drawBallTrain();

  // --- SCORE TEXT ---
  fill(255);
  textSize(50);
  textAlign(CENTER);
  text(leftScore, width * 0.25, scoreY + 19);
  text(rightScore, width * 0.75, scoreY + 19);

  ballPosX += ballSpeedX;
  ballPosY += ballSpeedY;

  if (ballPosX <= paddleLeftX + paddleWidth/2 + ballSize/2 && ballPosY > paddleLeftY - paddleHeight/2 && ballPosY < paddleLeftY + paddleHeight/2) {
    ballSpeedX = abs(ballSpeedX) * 1.08;
    ballSpeedY = (ballPosY - paddleLeftY) / 6;
    leftHitTime = millis();
    leftScore++;
    triggerFallingSubtitle(random(placeData), paddleLeftX, paddleLeftY, 'left');
  }
  if (ballPosX >= paddleRightX - paddleWidth/2 - ballSize/2 && ballPosY > paddleRightY - paddleHeight/2 && ballPosY < paddleRightY + paddleHeight/2) {
    ballSpeedX = -abs(ballSpeedX) * 1.08;
    ballSpeedY = (ballPosY - paddleRightY) / 6;
    rightHitTime = millis();
    rightScore++;
    triggerFallingSubtitle(random(placeData), paddleRightX, paddleRightY, 'right');
  }

  if (ballPosX < 0 || ballPosX > width) { leftScore = 0; rightScore = 0; resetBall(); }
  if (ballPosY < 0 || ballPosY > playAreaHeight) ballSpeedY *= -1;

  paddleLeftY = lerp(paddleLeftY, ballPosY, 0.12);
  if (keyIsDown(UP_ARROW)) {
    paddleRightY -= paddleSpeed;
    lastInputTime = millis(); 
  }
  if (keyIsDown(DOWN_ARROW)) {
    paddleRightY += paddleSpeed;
    lastInputTime = millis(); 
  }
  paddleRightY = constrain(paddleRightY, paddleHeight/2, playAreaHeight - paddleHeight/2);

  drawFallingSubtitles();
}

function handleStart() {
  lastInputTime = millis(); 
  if (!gameStarted) {
    gameStarted = true;
    titleVideo.stop();
    titleVideo.remove();
    resetBall();
    if (wistleSound) wistleSound.play();
  }
}

function mousePressed() { handleStart(); }
function keyPressed() { handleStart(); }

function drawBallTrain() {
  positionHistory.unshift({ x: ballPosX, y: ballPosY });
  if (positionHistory.length > 100) positionHistory.pop();

  let spacing = 4; 
  for (let i = trailImgs.length - 1; i >= 0; i--) {
    let index = (i + 1) * spacing;
    if (index < positionHistory.length && trailImgs[i]) {
      let pos = positionHistory[index];
      push();
      imageMode(CENTER);
      translate(pos.x, pos.y);
      let prevPos = positionHistory[index - 1] || {x: ballPosX, y: ballPosY};
      rotate(atan2(prevPos.y - pos.y, prevPos.x - pos.x));
      image(trailImgs[i], 0, 0, ballSize, ballSize);
      pop();
    }
  }

  if (ballImg) {
    push();
    imageMode(CENTER);
    translate(ballPosX, ballPosY);
    rotate(atan2(ballSpeedY, ballSpeedX));
    image(ballImg, 0, 0, ballSize, ballSize);
    pop();
  }
}

function triggerFallingSubtitle(place, startX, startY, side) {
  let textStr = place.name;
  for (let i = 0; i < textStr.length; i++) {
    fallingSubtitles.push({
      char: textStr[i].toLowerCase(),
      x: startX + (side === 'left' ? 40 : -40),
      y: startY,
      vy: random(2, 4), 
      vx: random(-0.5, 0.5), 
      startTime: millis() + i * 150 
    });
  }
}

function drawFallingSubtitles() {
  for (let i = fallingSubtitles.length - 1; i >= 0; i--) {
    let s = fallingSubtitles[i];
    if (millis() < s.startTime) continue;
    s.y += s.vy;
    s.x += s.vx;
    let progress = constrain(s.y / height, 0, 1);
    let setIdx = Math.floor(progress * 2.9);
    let img = (letterSets[setIdx]) ? letterSets[setIdx][s.char] : null;
    if (img) image(img, s.x, s.y, 35, 35);
    if (s.y > height) fallingSubtitles.splice(i, 1);
  }
}

function resetBall() {
  ballPosX = width / 2;
  ballPosY = playAreaHeight / 2;
  ballSpeedX = random([-12, 12]); 
  ballSpeedY = random([-6, 6]);
  positionHistory = [];
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }