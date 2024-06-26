// const { Hex } = require("./red-blob-hex/lib");

// Source palette: https://twitter.com/AlexCristache/status/1738610343499157872
const colorPalette = {
  ArcticPowder: "#F1F6F4",
  MysticMint: "#D9E8E3",
  Forsythia: "#FFC801",
  DeepSaffron: "#FF9932",
  NocturnalExpedition: "#114C5A",
  OceanicNoir: "#172B36",
  NeutralSpace: "gray",
  NullSpace: "rgba(0 0 0 0)",
};

// Idea for Pong wars: https://twitter.com/nicolasdnl/status/1749715070928433161
// blatantly forked by whichoneiwonder

const CANVAS = document.getElementById("pongCanvas");

const CTX = CANVAS.getContext("2d");
const scoreElement = document.getElementById("score");

const TEAM1 = colorPalette.MysticMint;
const TEAM1_BALL = colorPalette.NocturnalExpedition;

const TEAM2 = colorPalette.NocturnalExpedition;
const TEAM2_BALL = colorPalette.MysticMint;

const DEADSPACE = undefined;
const HIT = colorPalette.Forsythia;
const NEUTRAL = colorPalette.NeutralSpace;

const ANGLE = (Math.PI * 2) / 6;
const HEX_RADIUS_GAME = 1;
const BALL_RADIUS_GAME = 0.75;
const SPEED = 0.25;
const LAYOUT = new Layout(Layout.flat, new Point(1, 1), new Point(50, 50));
// pretend that the game field is from 0 -> +100 in both x and y
// the game is 10 hex tall
//
const MAP_RADIUS = 24;

function getScale() {
  return Math.min(CANVAS.width, CANVAS.height) / 100.0;
}
console.log("scale", getScale());
function gamePointToCanvasPoint({ x, y }) {
  scale = getScale();
  return { x: scale * x, y: scale * y };
}

function vecLength(lx, ly) {
  return Math.sqrt(lx * lx + ly * ly);
}

function randomNum(min, max) {
  return Math.random() * (max - min) + min;
}

//GAME OBJECTS
const COLORS = new Map([[0, [new Map([[0, NEUTRAL]])]]]);
const RECENTS = []
function Ball(x, y, dx, dy, c) {
  return { x, y, dx, dy, c };
}
const BALLS = [];

function* iterate_hex(radius = MAP_RADIUS) {
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      yield new Hex(q, r, -q - r);
    }
  }
}

function* iterate_hex_neighbors(hex) {
  for (const d in Hex.directions) {
    yield hex.neighbor(d);
  }
}

// GAME UPDATE
function makeStartingPosition() {
  BALLS.push(
    Ball(25, 50, +3, randomNum(-2, 2), TEAM1_BALL),
    Ball(75, 50, -3, randomNum(-2, 2), TEAM2_BALL)
  );

  for (const h of iterate_hex(MAP_RADIUS + 1)) {
    var c = NEUTRAL;
    if (Math.round(h.len()) > MAP_RADIUS) {
      c = DEADSPACE;
    } else if (h.q < 0) {
      c = TEAM1;
    } else if (h.q > 0) {
      c = TEAM2;
    }
    if (!COLORS[h.q]) {
      COLORS[h.q] = new Map();
    }
    COLORS[h.q][h.r] = c;
  }
}

function bounce(ball, hex) {
  let hex_pix = LAYOUT.hexToPixel(hex);
  let normalx = -ball.x + hex_pix.x;
  let normaly = -ball.y + hex_pix.y;
  let normalLen = vecLength(normalx, normaly);
  let dotproduct = (ball.dx * normalx + ball.dy * normaly) / normalLen;
  if (dotproduct < 0) {
    return;
  }
  let ddx = (normalx * dotproduct * 2.0) / normalLen;
  let ddy = (normaly * dotproduct * 2.0) / normalLen;
  ball.dx -= ddx + randomNum(-0.01, 0.01);
  ball.dy -= ddy + randomNum(-0.01, 0.01);
}

function outOfBounds(ballAsHex) {
  return ballAsHex.len() > MAP_RADIUS;
}
function wallBounce(ball, ballAsHex) {
  let mirror = ballAsHex.scale(1.2, 1.2).round();
  bounce(ball, mirror);
  bounce(ball, mirror);
}

function updateBall(ball) {
  ball.x += ball.dx * SPEED;
  ball.y += ball.dy * SPEED;
}

const SAME_TEAM = {
  [TEAM1_BALL]: TEAM1,
  [TEAM2_BALL]: TEAM2,
};

const COLLISION_DIST = HEX_RADIUS_GAME + BALL_RADIUS_GAME;
function ballToHexDistance(ball, hex) {
  let hex_centre = LAYOUT.hexToPixel(hex);
  return vecLength(ball.x - hex_centre.x, ball.y - hex_centre.y);
}
function updateSquareAndBounce(ball) {
  let ballCentre = new Point(ball.x, ball.y);
  let ballAsHex = LAYOUT.pixelToHex(ballCentre);
  let hc = ballAsHex.round();
  if (outOfBounds(ballAsHex)) {
    wallBounce(ball, ballAsHex);
  }
  for (const h of iterate_hex_neighbors(hc)) {
    if (ballToHexDistance(ball, h) > COLLISION_DIST) {
      continue;
    }

    if (!COLORS[h.q] || !COLORS[h.q][h.r] || COLORS[h.q][h.r] === DEADSPACE) {
      // DEADSPACE is undefined
      bounce(ball, h);
      continue;
    }
    let currentColor = COLORS[h.q][h.r];
    if (currentColor !== SAME_TEAM[ball.c]) {
      COLORS[h.q][h.r] = SAME_TEAM[ball.c];
      drawHexagon(h, HIT);
      bounce(ball, h);
      RECENTS.push(h)
    }
  }
}

// DRAW METHODS

function updateScoreElement() {
  let team1Score = 0;
  let team2Score = 0;
  for (const hex of iterate_hex()) {
    let c = COLORS[hex.q][hex.r];
    if (c === TEAM1) {
      team1Score++;
    } else if (c === TEAM2) {
      team2Score++;
    }
  }
  scoreElement.textContent = `day ${team1Score} | night ${team2Score}`;
}

function drawBall(ball) {
  let { x, y } = gamePointToCanvasPoint(new Point(ball.x, ball.y));
  CTX.fillStyle = ball.c;
  CTX.beginPath();
  CTX.arc(x, y, getScale() * BALL_RADIUS_GAME, 0, Math.PI * 2, false);
  CTX.fill();
  CTX.closePath();
}

function drawAroundBall(ball) {
  let ballCentre = new Point(ball.x, ball.y);
  let ballAsHex = LAYOUT.pixelToHex(ballCentre);
  let hc = ballAsHex.round();

  if (hc.len() <= MAP_RADIUS + 1) {
    drawHexagon(hc);
  }
  for (const h of iterate_hex_neighbors(hc)) {
    if (h.len() <= MAP_RADIUS + 1) drawHexagon(h);
  }
}

function drawAllHexagons() {
  for (const h of iterate_hex()) {
    if (h.len() <= MAP_RADIUS) drawHexagon(h);
  }
}

function drawHexBackground() {
  let hex_centre = gamePointToCanvasPoint({ x: 50, y: 50 });
  let rad = HEX_RADIUS_GAME * (MAP_RADIUS - 1.6) * 2 * getScale();
  CTX.beginPath();
  for (var i = 0; i < 6; i++) {
    CTX.lineTo(
      hex_centre.x + rad * Math.sin(ANGLE * i),
      hex_centre.y + rad * Math.cos(ANGLE * i)
    );
  }
  CTX.fillStyle = colorPalette.NeutralSpace;
  CTX.closePath();
  CTX.fill();
}
function drawHexagon(hex, override_color) {
  let color = override_color || (COLORS[hex.q] || {})[hex.r] || DEADSPACE;
  if (color === DEADSPACE) {
    color = NEUTRAL;
  }
  let hex_centre = gamePointToCanvasPoint(LAYOUT.hexToPixel(hex));
  let rad = HEX_RADIUS_GAME * getScale();
  CTX.lineWidth = 0.2;
  CTX.strokeStyle = color;
  CTX.beginPath();

  for (var i = 0; i < 6; i++) {
    CTX.lineTo(
      hex_centre.x + rad * Math.cos(ANGLE * i),
      hex_centre.y + rad * Math.sin(ANGLE * i)
    );
  }
  CTX.fillStyle = color;
  CTX.closePath();
  CTX.fill();
  CTX.stroke();
}
function firstDraw() {
  updateScoreElement();
  drawHexBackground();
  drawAllHexagons();
}
function draw() {
  updateScoreElement();
  while(true){
    let r = RECENTS.pop()
    if (!r){ break}
    drawHexagon(r)
  }
  BALLS.forEach((ball) => {
    drawAroundBall(ball);
    updateSquareAndBounce(ball);
    updateBall(ball);
  });
  BALLS.forEach((ball) => {
    drawBall(ball);
  });

  requestAnimationFrame(draw);
}
addEventListener("load", () => {
  console.log("starting");
  makeStartingPosition();
  firstDraw();
  requestAnimationFrame(draw);
});
