let n = 0;
let n2 = 0;
let co = 0;
let j = 1;
let k = 1;

var depth = 6;
let characters = ["ힰힱힲힳힴힵힶힷힸힹힻힼힽힾힿퟀퟁퟂퟃ"];
let charactersArray = characters[0].split("");
let a = 0;

function setup() {
  createCanvas(1920, 1080);
  background(0);
  frameRate(24);
  speed = createSlider(0, 8, 4);
  color = createSlider(0, 255, 0);
  color2 = createSlider(0, 255, 255);
}

function draw() {
  let col1 = color.value();
  let col2 = "#FFF";
  push();
  translate(width / 2, height / 2);

  if (key == "q") {
    if (n % 2 == 0) {
      c2 = col2;
    } else {
      c2 = col1;
    }
    if (keyIsPressed) {
    n ++;
    }
    fill(c2);
    stroke(col2);
    for (let i = 0; i < 5; i++) {
      noiseSeed(n + i);
      x = map(noise(0, frameCount * 0.02), 0, 1, -width, width);
      y = map(noise(1, frameCount * 0.05), 0, 1, -height, height);
      r1 = map(noise(2, n + i), 0, 1, -width, width);
      r2 = map(noise(3, n + i), 0, 1, -height, height);
      co = random() < 0.5 ? "0" : "255";
      randomSeed(n + i * 10);
      rect(r1 + x, r2 + y, random([200, 150, 100]), random([200, 150, 100]));
    }
  }
  if (key == "w") {
    background(col1);
    scale(1.1);
    translate(-width / 2, -height / 2 + 10);

    fill(col2);
    noStroke();
    for (let i = 0; i < width; i += 10) {
      for (let j = 0; j < height; j += 10) {
        n1 = noise((j * i) / 10, frameCount * 0.1);
        tx = n1 < 0.4 ? "0" : "1";
        if (n1 < 0.5) {
          text(tx, i, j);
        }
      }
    }
  }

  if (key == "r") {
    background(col1);
    scale(2.1);
    if (j > 30) {
      j = 0;
    }
    translate(-width / 2 + j, -height / 2 + j);
    fill(col2);
    noStroke();
    for (let i = 0; i < width; i += 10) {
      for (let j = 0; j < height; j += 10) {
        n1 = noise((j * i) / 10, frameCount * 0.1);
        tx = "";
        if (n1 > 0.8) {
          tx = "✦";
        } else if (n1 > 0.75) {
          tx = "＊";
        } else if (n1 > 0.7) {
          tx = "+";
        } else if (n1 > 0.65) {
          tx = "・";
        }
        if (n1 > 0.5) {
          text(tx, i, j);
        }
      }
    }
    j += 10;
  }

  if (key == "e") {
    background(col1);
    stroke(col2);
    noFill();
    if (n2 == 0) {
      ellipse(0, 0, random([50, 100, 200]));
    }
    if (n2 == 1) {
      rectSize = random([50, 100, 200]);
      rect(-rectSize / 2, -rectSize / 2, rectSize, rectSize);
    }
    if (n2 == 2) {
      lineSize = 120;
      line(
        random([-lineSize, lineSize, -lineSize / 2, lineSize / 2]),
        random([-lineSize, lineSize, -lineSize / 2, lineSize / 2]),
        random([-lineSize, lineSize, -lineSize / 2, lineSize / 2]),
        random([-lineSize, lineSize, -lineSize / 2, lineSize / 2])
      );
      line(
        random([-lineSize, lineSize, -lineSize / 2, lineSize / 2]),
        random([-lineSize, lineSize, -lineSize / 2, lineSize / 2]),
        random([-lineSize, lineSize, -lineSize / 2, lineSize / 2]),
        random([-lineSize, lineSize, -lineSize / 2, lineSize / 2])
      );
    }
    fr = 3;
    if (frameCount % 2 == 0) {
      rotate(random([PI / 4, HALF_PI]));
      n2++;
    }
    if (n2 > fr) {
      n2 = 0;
    }
  }
  if (key == "a") {
    if (keyIsPressed) {
      n++;
    }
    background(col1);
    translate(0, 0);

    noFill();
    stroke(col2);
    for (let i = 0; i < 10; i += 1) {
      push();
      rotate(noise(i + n * 2, frameCount / 200) * 10);
      strokeWeight(noise(i + 10, frameCount / 20) * 10);
      line(0, 0, width, 0);
      pop();
    }
  }
  if (key == "s") {
    if (keyIsPressed) {
      n++;
    }
    background(col1);
    translate(-width / 2, -height / 2);

    noFill();
    stroke(col2);
    for (let i = 0; i < 4; i += 1) {
      push();
      translate(0, noise(i + n * 10, frameCount / 200) * height);
      strokeWeight(noise(i + 10, frameCount / 20) * 10);
      line(0, 0, width, 0);
      pop();
    }
  }

  if (key == "d") {
    if (keyIsPressed) {
      n++;
    }
    background(col1);
    translate(0, 0);
    noStroke();
    fill(col2);
    if (frameCount % 8 == 0) {
      k += 100;
      j = 1;
    }
    randomSeed(k + n);
    for (let i = 0; i < 6; i += 1) {
      r1 = random(-width, width);
      r2 = random(-height, height);
      rect(r1, r2, j, 4);
    }
    randomSeed(k / 2);
    for (let i = 0; i < 3; i += 1) {
      r1 = random(-width, width);
      r2 = random(-height, height);
      rect(
        r1 + j / random([-4, 2, 4, 6]),
        r2 + j / random([-4, 2, 4, 6]),
        j / 2,
        random([4, 16, 32])
      );
    }
    j += 5;
  }
  if (key == "z") {
    translate(-width / 2, -height / 2);
    
      n++;
    
    let dx, dy;
    let x = 1;
    let y = 1;
    let pointAry = [[], []];
    let seed = n * 0.0236 * speed.value() * 2.9;
    randomSeed(seed);
    background(col1);
    a += 0.4;
    if (seed % 1 >= 0.996) {
      a = 0;
    }
    drawRect(0, 0, width, height, 0);
  }

  pop();
  if (key == "1") {
    CanvasRenderingContext2D.filter = "invert(100)";
  }
}

function drawRect(x, y, o, p, d) {
  let col1 = color.value();
  let col2 = 255;
  if (d > depth) {
    return;
  }
  noFill(255);
  stroke(255);
  if (d < depth) {
    rect(x, y, o, p);
  }
  if (random() < 0.5) {
    let dd = 0.2 * (p - y);
    let yy = random(y + dd, p - dd);
    drawRect(x, y, o, yy, d + 1);
    drawRect(x, yy, o, p, d + 1);
    let randomCharacter = random(charactersArray);
    text(randomCharacter, x + random(a), y);
    textSize((o / 2) * 0.2, p / 2);
    noFill(255);
    stroke(1);
  } else {
    let dd = 0.1 * (o - x);
    let xx = random(x + dd, o - dd);
    drawRect(x, y, xx, p, d + 1);
    drawRect(xx, y, o, p, d + 1);
    let randomCharacter = random(charactersArray);
    fill(col2);
    text(randomCharacter, x - random(a), y);
    textSize((o / 2) * 0.2, p / 2);
  }
  noFill(255);
  noStroke(1);
}
