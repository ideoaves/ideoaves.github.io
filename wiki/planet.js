let moon;
let earth;
let ejiten;
let sDown;
let mar = 20;

function setup(){
  createCanvas(750, 450);
  fill(0);
  
  sli = createSlider(0, 8000, 000);
  sli.position(width/2+mar+10, height/2+mar+20);
  let wid = width/2
  sli.style('width', "30%");
  textFont('monospace');

  moon = 0;
  earth = 0;
  ejiten = 0;
}

function draw(){
  noFill();
  background(0);
  stroke(255);
  var sDown = sli.value();
  rect(0+mar/2, 0+mar/2, (width/2)-mar, (height/2)-mar);
  rect(0+mar/2, (height/2)+mar/2, (width/2)-mar, (height/2)-mar);
  rect((width/2)+mar/2, 0+mar/2, (width/2)-mar, (height/2)-mar);
  fill(255).noStroke();
  text('衛星の公転', mar+10, mar+10);
  text('惑星の自転', width/2+mar, mar+10);
  text('惑星の公転', mar+10, height/2+mar+10);
  text('時間速度', width/2+mar+10, height/2+mar+10);
  noFill();
  
  
  var Ecol = color("#BBBBBB");
  var Mcol = color("#000000");
  var Scol = color("#FFFFFF");
  var speed = sli.value();
  sDown = 50000/(speed/100);
  
  var Mx = width / 4;
  var My = height / 4;
  var Ex = width / 4;
  var Ey = 3*height / 4;
  var Ejx = 3*width / 4;
  var Ejy = height / 4;
  fill(255).noStroke();
  text(int(ejiten/(2*PI))+"日", width/2+mar+10, height/2+mar+60);
  text(int(moon/(2*PI))+"月", width/2+mar+10, height/2+mar+80);
  text(int(earth/(2*PI))+"年", width/2+mar+10, height/2+mar+100);
  noFill();

  stroke(120);
  line(Ex,Ey, Ex + cos(earth) * 100, Ey + sin(earth) * 100);
  line(Mx,My, Mx + cos(moon) * 100, My + sin(moon) * 100);
  line(Mx + cos(ejiten) * -15, My + sin(ejiten) * -15, Mx + cos(ejiten) * -20, My + sin(ejiten) * -20);
  line(Mx + cos(earth) * -105, My + sin(earth) * -105, Mx + cos(earth) * -110, My + sin(earth) * -110);
    line(Ejx + cos(moon) * 105, Ejy + sin(moon) * 105, Ejx + cos(moon) * 100, Ejy + sin(moon) * 100);
  line(Ejx + cos(earth) * -105, Ejy + sin(earth) * -105, Ejx + cos(earth) * -120, Ejy + sin(earth) * -120);
  line(Ex-120,Ey, Ex-110,Ey);
  line(Ex+120,Ey, Ex+110,Ey);
  line(Ex,Ey-120, Ex,Ey-110);
  line(Ex,Ey+120, Ex,Ey+110);
  
  moon += speed/sDown;
  noFill();
  stroke(255);
  ellipse(Mx, My, 200, 200);
  fill(Ecol);
  ellipse(Mx, My, 20, 20);
  fill(Mcol);
  ellipse(
    Mx + cos(moon) * 100,
    My + sin(moon) * 100,
    10, 10);
  
  earth += speed/127.8065130034324/sDown;
  noFill();
  stroke(255);
  ellipse(Ex, Ey, 200, 200);
  fill(Scol);
  ellipse(Ex, Ey, 30, 30);
  fill(Ecol);
  ellipse(
    Ex + cos(earth) * 100,
    Ey + sin(earth) * 100,
    15, 15);
  
  ejiten += speed*18.16887175295318/sDown;
  translate(Ejx, Ejy);
  rotate(ejiten+HALF_PI);
  fill(Ecol);
  ellipse(0, 0, 60, 60);
  fill(50);
  arc(0, 0, 60, 60, PI, TWO_PI);
  
}
