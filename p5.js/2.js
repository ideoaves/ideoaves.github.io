var mic;
let cha;
let teto = "ξ(-⊿-ξ";
let miku = "Yヾ（゜□゜@）";
let rei = "ｽﾞﾓ(´☋｀)";

function setup() {
  createCanvas(1920, 1080);
  frameRate(30);
  mic = new p5.AudioIn();
  mic.start();
  cha = rei;
}

function draw() {
  var vol = mic.getLevel();
  var d = map(vol, 0, 1, 0, 10);

  /*　　ξ(-⊿-ξ丫(°Д°乙ｽﾞﾓ(´☋｀)　KaoMoji_River_1.0.0　ｽﾞﾓ(´☋｀)丫(°Д°乙ξ(-⊿-ξ
       音声に合わせ、ミクがネギを振り、テトの髪が増殖し、レイがズモります。
       音声入力はマイクです。
  */
  let ts = 100;
  textSize(ts);
  background(240);

  //歌ってるのはだれ？//
  if (key == "r") {
    cha = rei;
  }
  if (key == "m") {
    cha = miku;
  }
  if (key == "t") {
    cha = teto;
  }
  chara = cha.split("");

  //かおもじ
  for (let i = 0; i < 12; i++) {
    if (i !== 6) {
      let lineText = "";
      for (let j = 0; j <= 36; j++) {
        let n = noise(i * 0.2, j * 0.2, frameCount * 0.1);

        if (cha == rei) {
          fill("#D3A211");
          let index = floor(map(n, 0, 1, 2, rei.length));
          lineText += chara[index];
          if (d > 2) {
            lineText += chara[0];
            lineText += chara[1];
            for (let mo = 0; mo < random(d * 2); mo++) {
              lineText += chara[2];
            }
          }
        }
        if (cha == teto) {
          fill("#BB4949");
          let index = floor(map(n, 0, 1, 0, teto.length));
          lineText += chara[index];
          if (d > 2) {
            for (let mo = 0; mo < d; mo++) {
              lineText += chara[0];
            }
          }
        }
        if (cha == miku) {
          fill("#3E6C76");
          let index = floor(map(n, 0, 1, 0, miku.length));
          lineText += chara[index];
          if (d > 2) {
            for (let mo = 0; mo < d; mo++) {
              lineText += chara[0];
            }
          }
        }
      }

      text(lineText, -20, i * ts);
    }
  }
  text(cha, width / 2, 6 * ts);
}
