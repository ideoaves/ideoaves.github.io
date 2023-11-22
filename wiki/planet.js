let moon;
let earth;
let ejiten;
let sDown;
let mar = 10;
let b = 255;
let w = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  fill(b);

  sli = createSlider(0, 8000, 100);
  sli.position(width / 2 + mar + 10, height / 2 + mar + 20);
  let wid = width / 2;
  sli.style("width", "40%");
  textFont("monospace");

  moon = 0;
  earth = 0;
  ejiten = 0;
}

function draw() {
  orb1 = width / 8;
  orb2 = width / 4;

  noFill();
  background(b);
  stroke(w);
  var sDown = sli.value();
  rect(0 + mar / 2, 0 + mar / 2, width / 2 - mar, height / 2 - mar);
  rect(0 + mar / 2, height / 2 + mar / 2, width / 2 - mar, height / 2 - mar);
  rect(width / 2 + mar / 2, 0 + mar / 2, width / 2 - mar, height / 2 - mar);
  fill(w).noStroke();
  text("衛星の公転", mar + 10, mar + 10);
  text("惑星の自転", width / 2 + mar, mar + 10);
  text("惑星の公転", mar + 10, height / 2 + mar + 10);
  text("時間速度", width / 2 + mar + 10, height / 2 + mar + 10);
  noFill();

  var Ecol = color("#BBBBBB");
  var Mcol = color("#000000");
  var Scol = color("#FFFFFF");
  var speed = sli.value();
  sDown = 50000 / (speed / 100);

  var Mx = width / 4;
  var My = height / 4;
  var Ex = width / 4;
  var Ey = (3 * height) / 4;
  var Ejx = (3 * width) / 4;
  var Ejy = height / 4;
  fill(w).noStroke();
  text(
    int(ejiten / (2 * PI)) + "日",
    width / 2 + mar + 10,
    height / 2 + mar + 60
  );
  text(
    int(moon / (2 * PI)) + "月",
    width / 2 + mar + 10,
    height / 2 + mar + 80
  );
  text(
    int(earth / (2 * PI)) + "年",
    width / 2 + mar + 10,
    height / 2 + mar + 100
  );
  noFill();

  li1 = width / 15;
  li2 = li1 - 10;
  li3 = li1 - 15;
  li4 = li1 - width / 10;
  li5 = li4 - 5;
  stroke(w);
  line(Ex, Ey, Ex + cos(earth) * orb1, Ey + sin(earth) * orb1);
  line(Mx, My, Mx + cos(moon) * orb1, My + sin(moon) * orb1);
  line(
    Mx + cos(ejiten) * -li5,
    My + sin(ejiten) * -li5,
    Mx + cos(ejiten) * -li4,
    My + sin(ejiten) * -li4
  );
  line(
    Mx + cos(earth) * -li3,
    My + sin(earth) * -li3,
    Mx + cos(earth) * -li2,
    My + sin(earth) * -li2
  );
  line(
    Ejx + cos(moon) * li3,
    Ejy + sin(moon) * li3,
    Ejx + cos(moon) * li2,
    Ejy + sin(moon) * li2
  );
  line(
    Ejx + cos(earth) * -li3,
    Ejy + sin(earth) * -li3,
    Ejx + cos(earth) * -li1,
    Ejy + sin(earth) * -li1
  );
  line(Ex - li1, Ey, Ex - li2, Ey);
  line(Ex + li1, Ey, Ex + li2, Ey);
  line(Ex, Ey - li1, Ex, Ey - li2);
  line(Ex, Ey + li1, Ex, Ey + li2);

  moon += speed / sDown;
  noFill();
  stroke(w);
  ellipse(Mx, My, orb2, orb2);
  fill(Ecol);
  ellipse(Mx, My, 20, 20);
  fill(Mcol);
  ellipse(Mx + cos(moon) * orb1, My + sin(moon) * orb1, 10, 10);

  earth += speed / 127.8065130034324 / sDown;
  noFill();
  stroke(w);
  ellipse(Ex, Ey, orb2, orb2);
  fill(Scol);
  ellipse(Ex, Ey, 30, 30);
  fill(Ecol);
  ellipse(Ex + cos(earth) * orb1, Ey + sin(earth) * orb1, 15, 15);

  ejiten += (speed * 18.16887175295318) / sDown;
  translate(Ejx, Ejy);
  rotate(ejiten + HALF_PI);
  fill(Ecol);
  ellipse(0, 0, 60, 60);
  fill(50);
  arc(0, 0, 60, 60, PI, TWO_PI);
}
