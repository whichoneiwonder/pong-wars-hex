// const { Hex, Layout } = require("./red-blob-hex/lib");

// Source palette: https://twitter.com/AlexCristache/status/1738610343499157872
const colorPalette = {
  ArcticPowder: "#F1F6F4",
  MysticMint: "#D9E8E3",
  Forsythia: "#FFC801",
  DeepSaffron: "#FF9932",
  NocturnalExpedition: "#114C5A",
  OceanicNoir: "#172B36",
  NeutralSpace: "#555555",
  NullSpace: "rgba(0 0 0 0)",
  DarkRed: "#e44949dd",
  Green: "#49e449dd",
  Blue: "#4949e4dd",
  Yellow: "#ebd50f",
  Cyan: "#0febd5",
  Magenta: "#d50feb",
};

// Idea for Pong wars: https://twitter.com/nicolasdnl/status/1749715070928433161
// blatantly forked by whichoneiwonder

const CANVAS = document.getElementById("pongCanvas");
const BG_CANVAS = document.getElementById("backgroundCanvas");

const BALL_CTX = CANVAS.getContext("2d");
const HEX_CTX = BG_CANVAS.getContext("2d");
const scoreElement = document.getElementById("score");

// 1v1 team colors
const TEAM1 = colorPalette.MysticMint;
const TEAM1_BALL = colorPalette.NocturnalExpedition;

const TEAM2 = colorPalette.NocturnalExpedition;
const TEAM2_BALL = colorPalette.MysticMint;
// 3 player team colors
const COLORS_3_TEAMS = [
  colorPalette.Yellow,
  colorPalette.Cyan,
  colorPalette.Magenta,
];
const COLORS_3_BALLS = [
  colorPalette.Blue,
  colorPalette.DarkRed,
  colorPalette.Green,
];

// 6 player team colors
const HSL_6_TEAM_COLORS = [190, 250, 310, 10, 70, 130].map(
  (x) => `hsl(${x + 25}, 100%, 60%)`
);
const HSL_6_BALL_COLORS = [10, 70, 130, 190, 250, 310].map(
  (x) => `hsl(${x + 25}, 100%, 50%)`
);

const DEADSPACE = undefined;
const HIT = colorPalette.Forsythia;
const NEUTRAL = colorPalette.NeutralSpace;
// const NEUTRAL = colorPalette.NullSpace;
const CLASSIC_MODE = window.location.search.toLowerCase() === "?classic";
const SOLID_HEX = CLASSIC_MODE || !window.location.hash;  // if not solid, then there are gaps between hexes.
const USE_HEX_BORDER = false;
const ANGLE = (Math.PI * 2) / 6;
const HEX_RADIUS_GAME = SOLID_HEX ? 1 : 0.9;
const BALL_RADIUS_GAME = 0.75;
const SPEED = 0.25;
const LAYOUT = new Layout(Layout.flat, new Point(1, 1), new Point(50, 50));
// pretend that the game field is from 0 -> +100 in both x and y
// the game is 10 hex tall
//
const MAP_RADIUS = 20;

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
const COLORS = new Map([[0, new Map([[0, NEUTRAL]])]]);
for (const c of Hex.directions) {
  for (let r = 1; r <= MAP_RADIUS; r++) {
    let h = c.scale(r);
    COLORS[h.q] = COLORS[h.q] || new Map();
    COLORS[h.q][h.r] = NEUTRAL;
  }
}
const RECENTS = [];
function Ball(x, y, dx, dy, c) {
  return { x, y, dx, dy, c };
}
const BALLS = [];

function* iterate_hex(radius = MAP_RADIUS) {
  radius++;
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

function* iterate_hex_slice_3(start, direction, radius = MAP_RADIUS) {
  if (start.len() > radius) {
    return;
  }
  yield start;
  yield* iterate_hex_slice_inner([start], direction, radius - start.len(), 3);
}

function* iterate_hex_slice_inner(
  start_group,
  direction,
  more_layers,
  mode = 1
) {
  if (more_layers <= 0) {
    return;
  }

  const edge = Hex.directions[direction];
  // const rightEdge = edge.rotateLeft();
  let next_layer = [...start_group.map((start) => start.add(edge))];
  if (mode > 2) {
    next_layer = [start_group[0].add(edge.rotateLeft()), ...next_layer];
  }
  if (mode > 1) {
    next_layer.push(
      start_group[start_group.length - 1].add(edge.rotateRight())
    );
  }
  yield* next_layer;
  yield* iterate_hex_slice_inner(next_layer, direction, more_layers - 1, mode);
}
function* iterate_hex_slice_6(start, direction, radius = MAP_RADIUS) {
  if (start.len() > radius) {
    return;
  }
  yield start;
  yield* iterate_hex_slice_inner([start], direction, radius - start.len(), 2);
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

function makeStartingPositionThreePlayer() {
  COLORS[0][0] = NEUTRAL;  // Centre tile is neutral
  for (const i in [0, 1, 2]) {
    wedgeDir = Hex.directions[2 * i];
    coords = LAYOUT.hexToPixel(wedgeDir.scale(10));
    BALLS.push(
      Ball(
        coords.x,
        coords.y,
        randomNum(-3, 3),
        randomNum(-3, 3),
        COLORS_3_BALLS[i]
      )
    );
    for (const n of iterate_hex_slice_3(wedgeDir, 2 * i)) {
      if (n.len() <= MAP_RADIUS) {
        COLORS[n.q] = COLORS[n.q] || new Map();
        COLORS[n.q][n.r] = COLORS_3_TEAMS[i];
      } else {
        break;
      }
    }
  }
}

function makeStartingPositionSixPlayer() {
  COLORS[0][0] = NEUTRAL;

  for (const i in [0, 1, 2, 3, 4, 5]) {
    const wedgeDir = Hex.directions[i].add(Hex.directions[i].rotateRight());
    coords = LAYOUT.hexToPixel(wedgeDir.scale(3));
    BALLS.push(
      Ball(
        coords.x,
        coords.y,
        randomNum(-3, 3),
        randomNum(-3, 3),
        HSL_6_BALL_COLORS[i]
      )
    );
    for (const h of iterate_hex_slice_6(wedgeDir, i)) {
      if (!COLORS[h.q]) {
        COLORS[h.q] = new Map();
      }
      COLORS[h.q][h.r] = HSL_6_TEAM_COLORS[i];
    }
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
  ...Object.fromEntries(
    [0, 1, 2].map((i) => [COLORS_3_BALLS[i], COLORS_3_TEAMS[i]])
  ),
  ...Object.fromEntries(
    [0, 1, 2, 3, 4, 5].map((i) => [HSL_6_BALL_COLORS[i], HSL_6_TEAM_COLORS[i]])
  ),
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
    if (currentColor === NEUTRAL || currentColor !== SAME_TEAM[ball.c]) {
      COLORS[h.q][h.r] = SAME_TEAM[ball.c];
      drawHexagon(h, "black");
      bounce(ball, h);
      RECENTS.push(h);
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
  BALL_CTX.fillStyle = ball.c;
  BALL_CTX.strokeStyle = "black";
  BALL_CTX.lineWidth = 0.1;
  BALL_CTX.beginPath();
  BALL_CTX.arc(Math.floor(x), Math.floor(y), Math.floor(getScale() * BALL_RADIUS_GAME), 0, Math.PI * 2, false);
  BALL_CTX.fill();
  BALL_CTX.stroke();
  BALL_CTX.closePath();
}

function drawAroundBall(ball) {
  // Not needed with multi-canvas approach, but could be used if we want to draw the ball on the same canvas as the hexes.
  let ballCentre = new Point(ball.x, ball.y);
  let ballAsHex = LAYOUT.pixelToHex(ballCentre);
  let hc = ballAsHex.round();
  let radius = (0.2 + BALL_RADIUS_GAME) * getScale();
  let { x, y } = gamePointToCanvasPoint(ballCentre);
  BALL_CTX.clearRect(x - radius, y - radius, radius * 2, radius * 2);

  if (hc.len() <= MAP_RADIUS + 1) {
    drawHexagon(hc);
  }
  for (const h of iterate_hex_neighbors(hc)) {
    if (h.len() <= MAP_RADIUS + 1) drawHexagon(h);
  }
}

function drawAllHexagons() {
  for (const h of iterate_hex()) {
    if (h.len() <= MAP_RADIUS + 1) drawHexagon(h);
  }
}

function drawHexBackground() {
  let hex_centre = gamePointToCanvasPoint({ x: 50, y: 50 });
  let rad = HEX_RADIUS_GAME * (MAP_RADIUS - 1.75) * 2 * getScale();
  HEX_CTX.beginPath();
  for (var i = 0; i < 6; i++) {
    HEX_CTX.lineTo(
      Math.floor(hex_centre.x + rad * Math.sin(ANGLE * i)),
      Math.floor(hex_centre.y + rad * Math.cos(ANGLE * i))
    );
  }
  HEX_CTX.fillStyle = colorPalette.NeutralSpace;
  HEX_CTX.strokeStyle = colorPalette.NeutralSpace;

  HEX_CTX.closePath();
  HEX_CTX.fill();
}
function drawHexagon(hex, override_color = undefined) {
  let color = override_color || (COLORS[hex.q] || {})[hex.r] || DEADSPACE;
  if (color === DEADSPACE) {
    color = NEUTRAL;
  }
  let hex_centre = gamePointToCanvasPoint(LAYOUT.hexToPixel(hex));

  HEX_CTX.lineWidth = 0.05 * getScale();

  HEX_CTX.fillStyle = color;
  HEX_CTX.strokeStyle = color;
  
  HEX_CTX.strokeStyle = "black";
  if (USE_HEX_BORDER) {
  }
  HEX_CTX.beginPath();
  const rad = Math.ceil(HEX_RADIUS_GAME * getScale());
  for (var i = 0; i < 6; i++) {
    HEX_CTX.lineTo(
      Math.floor(hex_centre.x + rad * Math.cos(ANGLE * i)),
      Math.floor(hex_centre.y + rad * Math.sin(ANGLE * i))
    );
  }
  HEX_CTX.closePath();
  HEX_CTX.stroke();
  HEX_CTX.fill();
}
function firstDraw() {
  drawAllHexagons();
}
function draw() {
  while (true) {
    let r = RECENTS.pop();
    if (!r) {
      break;
    }
    drawHexagon(r);
  }
  // clear the ball context and redraw all balls, since they can move around and overlap each other
  BALL_CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);

  BALLS.forEach((ball) => {
    // drawAroundBall(ball);
    updateSquareAndBounce(ball);
    updateBall(ball);
  });
  BALLS.forEach((ball) => {
    drawBall(ball);
  });

  requestAnimationFrame(draw);
}
addEventListener("load", () => {
  console.log("starting", window.location.search);
  if (window.location.search.toLowerCase() === "?classic") {
    makeStartingPosition();
  } else if (window.location.search.toLowerCase() === "?sixplayer") {
    makeStartingPositionSixPlayer();
  } else {
    makeStartingPositionThreePlayer();
  }
  firstDraw();
  requestAnimationFrame(draw);
});
