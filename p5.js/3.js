function setup() {
  createCanvas(1920, 1080);
  capture = createCapture(VIDEO);
  capture.size(640 / 9, 480 / 9);
  capture.hide();
}

function draw() {
  ke = 255 / 5;
  textSize(60);
  background(0);
  //取得する色の間隔
  let skip = 30;
  //x,y方向にスキャン
  for (let j = 0; j < height; j += skip) {
    for (let i = 0; i < width; i += skip) {
      let x = map(i, 0, width, 0, 640 / 9);
      let y = map(j, 0, height, 0, 480 / 9);
      let col = capture.get(x, y);
      fill(255);
      if (col[1] < ke * 1) {
        text("", i * 2, j * 2);
      } else if (col[1] < ke * 2) {
        if (random() < 0.5) {
          text("C", i * 2, j * 2);
        } else {
          text("D", i * 2, j * 2);
        }
      } else if (col[1] < ke * 3) {
        text("音", i * 2, j * 2);
      } else if (col[1] < ke * 4) {
        text("盘", i * 2, j * 2);
      } else if (col[1] < ke * 5) {
        text("䪭", i * 2, j * 2);
      }
    }
  }
}
