
var code1 = function(p){
let imgWidth = 400;
let imgHeight = 100;
let zoff = 0.1;
let zoff2 = 0.1;
let pix = 20;

function setup() {
  createCanvas(imgWidth, imgHeight);
  noSmooth();
  frameRate(20);
}

function draw() {
  fill("#c0c0c0");
  rect(0, 0, imgWidth, imgHeight);
  zoff += 0.004;
  zoff2 += 0.009;
  for (let x = 0; x < imgWidth; x += pix * 3) {
    for (let y = 0; y < imgHeight; y += pix) {
      fill("#c0c0c0");

      let loc = (x + y * imgWidth) * 4;
      let n = noise(x, y, zoff) * 2;
      let n2 = noise(x, y, zoff2) * 2;
      fill("#c0c0c0");
      noStroke();
      rect(x * n2, y, n * 80, pix);

      fill("#222222");
      rect(x * n2, y + pix - 1, imgWidth, 1);
      rect(x * n2 + n * 80, y, 1, pix);
      rect(x * n2 - 1, y, 1, pix);

      fill("#FFF");
      rect(x * n2, y, imgWidth, 1);
      rect(x * n2, y, 1, pix);

      let ss = pix - 6;
      let sX = x * n2 - 15 + n * 80;
      let sY = y + 3;
      let ta = 60 * n2;
      let ico = (pix / 10) * 8.5;
      textFont("Marlett", (pix / 10) * 6);

      if (n >= 0.92 && n < 1) {
        fill("#222222");
        rect(sX, sY, ss, ss);
        fill("#FFF");
        rect(sX - 1, sY - 1, ss, ss);
        fill("#c0c0c0");
        rect(sX, sY, ss - 1, ss - 1);
        fill("black");

        text("r", sX, sY + pix / 1.65);
      }
      if (n >= 0.93 && n < 1) {
        fill("#222222");
        rect(sX - ico, sY, ss, ss);
        fill("#FFF");
        rect(sX - 1 - ico, sY - 1, ss, ss);
        fill("#c0c0c0");
        rect(sX - ico, sY, ss - 1, ss - 1);
        fill("black");

        text("s", sX - ico + pix / 20, sY + pix / 1.65);
      }
      if (n >= 0.95 && n < 1) {
        fill("#222222");
        rect(sX - ico, sY, ss, ss);
        fill("#FFF");
        rect(sX - 1 - ico, sY - 1, ss, ss);
        fill("#c0c0c0");
        rect(sX - ico, sY, ss - 1, ss - 1);
        fill("black");

        text("1", sX - ico + 1, sY + pix / 1.65);
        
        fill("#222222");
        rect(sX - ico * 2, sY, ss, ss);
        fill("#FFF");
        rect(sX - 1 - ico * 2, sY - 1, ss, ss);
        fill("#c0c0c0");
        rect(sX - ico * 2, sY, ss - 1, ss - 1);
        fill("black");

        text("0", sX - ico * 2 + pix / 10, sY + pix / 1.65);
      }
      if (n >= 0.95 && n < 0.96) {
        fill("#222222");
        rect(sX - ico, sY, ss, ss);
        fill("#FFF");
        rect(sX - 1 - ico, sY - 1, ss, ss);
        fill("#c0c0c0");
        rect(sX - ico, sY, ss - 1, ss - 1);
        fill("black");

        text("2", sX - ico + 1, sY + pix / 1.65);
      }
      
      
      if (n >= 1.2 && n < 1.5) {
        fill("#222222");
        rect(sX, sY, ss, ss);
        fill("#FFF");
        rect(sX - 1, sY - 1, ss, ss);
        fill("#c0c0c0");
        rect(sX, sY, ss - 1, ss - 1);
        fill("black");

        text("4", sX, sY + pix / 1.65);
      }
      if (n >= 1.3 && n < 1.5) {
        fill("#222222");
        rect(sX - ico, sY, ss, ss);
        fill("#FFF");
        rect(sX - 1 - ico, sY - 1, ss, ss);
        fill("#c0c0c0");
        rect(sX - ico, sY, ss - 1, ss - 1);
        fill("black");

        text("3", sX - ico, sY + pix / 1.65);
      }
      if (n >= 1.3 && n < 2) {
        fill("#FFF");
        rect(sX+pix, sY, ss+ta, ss);
        fill("#222222");
        rect(sX - 1+pix, sY - 1, ss+ta, ss);
        fill("#FFF");
        rect(sX+pix, sY, ss - 1+ta, ss - 1);

        fill("#222222");
        rect(sX + ta+pix, sY, ss, ss);
        fill("#FFF");
        rect(sX + ta+pix, sY, ss - 1, ss - 1);
        fill("#c0c0c0");
        rect(sX + ta + 1+pix, sY + 1, ss - 2, ss - 2);
        fill("black");

        text("6", sX + ta+pix, sY + pix / 1.65);
      }
      if (n < 0.7) {
        fill("#000D79");
        rect(x * n2 - 1, y - 1, n * 80 + 5, pix + 1);
        fill("#222222");
        rect(x * n2 - 1, y, 1, pix);
        fill("#FFF");
        rect(x * n2 + n * 80 + 4, y, 1, pix);
      }
    }
  }
}

}

new p5(code1, "container1");