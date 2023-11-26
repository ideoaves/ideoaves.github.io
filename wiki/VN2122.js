let speed1 = 0;
let speed2 = 0;
let speed3 = 0;
let speed4 = 0;
let speed5 = 0;
let speed6 = 0;
let f = 60;

function setup() {
  createCanvas(windowWidth, windowHeight)
  frameRate(f)
  sli = createSlider(0, 20000, 5000);
  sli.position(0, height-25);
  let wid = width / 2;
  sli.style("width", str(width)-5 + "px");
  
}

function draw() {
  var speed = sli.value();
  translate(width/2,height/2)
  background(255);
  sca = width/30/2;
  noFill()
  stroke(0)
  strokeWeight(0.2)
  ellipse(0,0,1.44*sca*2,1.44*sca*2)
  ellipse(0,0,5.90*sca*2,5.90*sca*2)
  ellipse(0,0,8.75*sca*2,9.2*sca*2)
  ellipse(0,0,14.7*sca*2,14.7*sca*2)
  ellipse(0,0,22.7*sca*2,22.8*sca*2)
  ellipse(0,0,25.8*sca*2,26.9*sca*2)
  fill(0)
  size = 8;
  fill("#07F2FF")
  circle(0,0,size,size)
  size = 5;
  fill("#FFC107")
  circle(sin(speed1)*1.44*sca,cos(speed1)*1.44*sca,size,size)
  speed1 += (1/448/f)*speed;
  fill("#009688")
  circle(sin(speed2)*5.90*sca,cos(speed2)*5.90*sca,size,size)
  speed2 += (1/3710/f)*speed;
  fill("#FF0707")
  circle(sin(speed3)*8.75*sca,cos(speed3)*9.2*sca,size,size)
  speed3 += (1/7160/f)*speed;
  size = 8;
  fill("#FFBE40")
  circle(sin(speed4)*14.7*sca,cos(speed4)*14.7*sca,size,size)
  speed4 += (1/14494/f)*speed;
  fill("#C1A85E")
  circle(sin(speed5)*22.7*sca,cos(speed5)*22.8*sca,size,size)
  speed5 += (1/27980/f)*speed;
  fill("#07C9FF")
  circle(sin(speed6)*25.8*sca,cos(speed6)*26.9*sca,size,size)
  speed6 += (1/35928/f)*speed;
  
  fill(0)
  noStroke()
  textSize(8)
  text("VN 2122 星系簡易軌道図",-width/2 + 3,-height/2 + 13)
  translate(3,-3)
  text("VN 2122 a",sin(speed1)*1.44*sca,cos(speed1)*1.44*sca)
  text("白露(VN 2122 b)",sin(speed2)*5.90*sca,cos(speed2)*5.90*sca)
  text("VN 2122 c",sin(speed3)*8.75*sca,cos(speed3)*9.2*sca)
  text("VN 2122 d",sin(speed4)*14.7*sca,cos(speed4)*14.7*sca)
  text("VN 2122 e",sin(speed5)*22.7*sca,cos(speed5)*22.8*sca)
  text("VN 2122 f",sin(speed6)*25.8*sca,cos(speed6)*26.9*sca)
}