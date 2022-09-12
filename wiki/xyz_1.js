let lin = true;
let cir = true;
let c = 0;

let fo;
function preload() {
  fo = loadFont("DotGothic16-Regular.ttf");
  fo2 = loadFont("../Zinaki-Regular.ttf");
}

function setup() {
  createCanvas(300, 300, WEBGL);
  perspective();
  angleMode(DEGREES);
  textSize(15);
  textAlign(CENTER, CENTER);
}

function draw() {
  let angle = 0;
  background(255);
  if (mouseIsPressed === true) {
    rotateX(-(angle + (mouseY * 180) / width - 90));
    rotateY(constrain(-angle + (mouseX * 360) / height, 0, 360));
  } else {
    rotateX(-20);
    rotateY(c);
    c = c + 0.5;
  }
  let r = 100;

  push();
  fill("black");
  textFont(fo);
  text("中", 0, 0);
  text("左", r, 0);
  text("右", -r, 0);
  text("上", 0, -r);
  text("下", 0, r);
  translate(0, 0, r);
  text("前", 0, 0);
  translate(0, 0, -r * 2);
  text("後", 0, 0);
  pop();

  beginShape();
  fill("gray");
  noStroke();
  vertex(-50, 110, -50);
  vertex(50, 110, -50);
  vertex(50, 110, 50);
  vertex(-50, 110, 50);
  endShape(CLOSE);

  beginShape();
  stroke("black");
  strokeWeight(2);
  noFill();
  let po = 0;
  vertex(0, 0, po + 5);
  vertex(0, 0, po + 20);
  vertex(5, 0, po + 15);
  vertex(0, 0, po + 20);
  vertex(-5, 0, po + 15);
  endShape();

  if (lin === true) {
    // X
    beginShape();
    strokeWeight(0.5);
    stroke("red");
    noFill();
    vertex(r * 1.2, 0, 0);
    vertex(-r * 1.2, 0, 0);
    endShape();

    // Y
    beginShape();
    strokeWeight(0.5);
    stroke("blue");
    noFill();
    vertex(0, 0, r * 1.2);
    vertex(0, 0, -r * 1.2);
    endShape();

    // Z
    beginShape();
    strokeWeight(0.5);
    stroke("green");
    noFill();
    vertex(0, r * 1.2, 0);
    vertex(0, -r * 1.2, 0);
    endShape();
  }

  if (cir === true) {
    // X
    beginShape();
    for (let a = 0; a < 360; a += 10) {
      let sx = cos(a) * r;
      let sy = sin(a) * r;
      strokeWeight(0.5);
      stroke("red");
      noFill();
      vertex(sx, 0, sy);
    }
    endShape(CLOSE);

    // Y
    beginShape();
    for (let a = 0; a < 360; a += 10) {
      let sx = cos(a) * r;
      let sy = sin(a) * r;
      strokeWeight(0.5);
      stroke("blue");
      noFill();
      vertex(0, sy, sx);
    }
    endShape(CLOSE);

    // Z
    beginShape();
    for (let a = 0; a < 360; a += 10) {
      let sx = cos(a) * r;
      let sy = sin(a) * r;
      strokeWeight(0.5);
      stroke("green");
      noFill();
      vertex(sx, sy, 0);
    }
    endShape(CLOSE);
  }
}
