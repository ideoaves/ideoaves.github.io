/* ロゴのためのp5です */

const path =
  "M 66.41 78.22 H 0 V 60.21 H 90.87 L 67.49 181.17 L 73.67 183.59 L 126.62 137.89 L 139.25 149.72 C 121.65 166.01 85.17 202.13 67.48 202.13 C 54.04 202.13 44.97 194.13 46.78 183.59 L 66.4 78.22 Z M 87.38 0 C 65.56 0.37 65.57 32.82 87.38 33.19 C 109.19 32.82 109.19 0.37 87.38 0 Z M 205.49 202.13 C 133.94 202.27 158.8 53.35 227.8 56.98 C 247.69 56.98 261.4 66.39 267.32 84.4 H 268.13 L 282.18 0 H 303.1 L 273.02 183.32 H 292.1 V 202.13 C 258.1 202.81 247.48 202.21 254.41 166.11 C 257.03 151.14 262.16 120.92 264.62 105.9 C 267.85 86.55 254.14 75.53 233.71 75.53 C 198.17 75.05 189.3 107.99 185.6 138.43 C 182.8 161.45 189.17 184.7 212.75 183.59 V 202.14 H 205.49 Z M 377.54 202.13 C 284.39 202.16 320.65 48.7 399.04 56.98 C 426.19 56.98 446.08 70.15 446.08 94.34 C 446.08 113.96 433.45 138.15 345.01 140.57 C 343.7 162.57 347.39 183.91 379.42 184.11 V 202.12 H 377.54 Z M 346.9 123.37 L 346.63 126.06 C 414.37 123.91 424.58 108.59 424.58 95.15 C 424.58 83.86 417.32 74.45 397.16 74.45 C 369.21 74.45 350.93 91.92 346.9 123.37 Z M 465.18 129.56 C 460.9 33.17 595.26 33.17 590.97 129.56 C 595.25 225.95 460.89 225.94 465.18 129.56 Z M 568.13 129.56 H 568.13 C 568.5 58.19 487.64 58.24 488.03 129.56 H 488.03 C 487.66 200.93 568.52 200.89 568.13 129.56 Z M 662.5 202.13 C 590.95 202.27 615.81 53.35 684.81 56.98 C 704.7 56.98 718.41 66.39 724.33 84.4 H 725.14 L 729.17 60.21 H 750.14 L 729.43 183.32 H 748.51 V 202.13 C 715.35 203.05 702.79 201.69 711.43 166.11 C 714.05 151.14 719.18 120.92 721.64 105.9 C 724.87 86.55 711.16 75.53 690.73 75.53 C 655.19 75.05 645.89 107.94 642.62 138.43 C 638.12 160.57 646.19 184.7 669.77 183.59 V 202.14 H 662.51 Z M 816.21 184.87 C 875.58 177.72 902.31 112.4 880.46 64.51 L 900.62 58.6 C 931.09 118.74 880.29 203.51 817.02 201.06 C 803.04 201.06 796.32 193.81 796.32 181.71 C 795.88 178.64 810.75 83.73 811.37 78.23 H 783.2 V 60.22 H 834.76 L 816.21 184.88 Z M 1003.39 202.13 C 917.41 205.56 918.61 55.95 1002.06 58.59 C 1043.35 57.82 1066.45 94.83 1062.93 135.67 H 961.39 C 959.12 161.81 974.69 184.11 1003.39 183.78 V 202.12 Z M 961.39 117.87 V 119.73 H 1040.07 C 1043.89 61.87 961.32 62.71 961.39 117.87 Z M 1143.27 184.12 C 1164.77 184.12 1180.09 176.59 1180.09 160.2 C 1180.09 145.69 1168.26 141.92 1155.63 140.04 L 1133.86 136.81 C 1114.24 133.85 1086.28 128.48 1086.28 98.37 C 1084.55 47.02 1174.4 47.21 1198.64 79.29 L 1184.66 92.46 C 1175.83 74.34 1107.82 62.73 1107.52 97.03 C 1107.52 111.54 1119.62 115.31 1131.98 117.19 L 1153.75 120.41 C 1173.64 123.37 1201.33 128.74 1201.33 158.85 C 1202.71 189.78 1168.79 204.78 1133.58 202.13 V 184.15 L 1143.27 184.12 Z";
let p = path.match(/[a-df-zA-DF-Z]|-?[0-9\.]+/g);

function setup() {
  let logo = select('.ロゴ');
  let divWidth = logo.width;
  let divHeight = divWidth * (202.43 / 1201.37);
  const canvas = createCanvas(divWidth, divHeight);
  canvas.parent(logo);
  const logoDiv = document.querySelector('.ロゴ');
  uds();
  window.addEventListener('resize', uds);
  noFill();
  stroke(255);
  frameRate(12);
  function uds() {
    const width = logoDiv.offsetWidth;
    const aspectRatio = 202.43 / 1201.37;
    const height = width * aspectRatio;

    resizeCanvas(width, height);
  }
}



function draw() {
  clear();
  let x = 0;
  let y = 0;
  scale(s = (height) / 202.43);
  strokeWeight(2 / s);
  r = 10;

  for (let i = 0; i < p.length; i++) {
    let cmd = p[i];
    if (cmd === "M") {
      x = p[i + 1];
      y = p[i + 2];
      vertex(parseFloat(x) + random(r), y);
      i += 2;
    } else if (cmd === "L") {
      x = p[i + 1];
      y = p[i + 2];
      vertex(parseFloat(x) + random(r), y);
      i += 2;
    } else if (cmd === (random() >= 0.3 ? "C" : random(["L", "M", "Z"]))) {
      let x1 = p[i + 1];
      let y1 = p[i + 2];
      let x2 = p[i + 3];
      let y2 = p[i + 4];
      let x3 = p[i + 5];
      let y3 = p[i + 6];
      bezierVertex(x1, y1, x2, y2, x3, y3);
      x = x3;
      y = y3;
      i += 6;
    } else if (cmd === "H") {
      x = p[i + 1];
      vertex(parseFloat(x) + random(r), y);
      i += 1;
    } else if (cmd === "V") {
      y = p[i + 1];
      vertex(parseFloat(x) + random(r), y);
      i += 1;
    } else if (cmd === (random() >= 0.1 ? "Z" : random(["L", "M", "C"]))) {
      endShape();
      beginShape();
    }
  }
  endShape(CLOSE);
}

/* ページの書式についてです */

fetch("header.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("ヘッダー").innerHTML = html;
  });

document.querySelectorAll('.カーソルを').forEach(el => {
  el.setAttribute('tabindex', '0');
  const spans = el.querySelectorAll('span');
  if (spans.length > 1) {
    spans[1].classList.add('すると出る');
  }
});

/* codeをコピーします */

document.querySelectorAll('code').forEach(el => {
  el.addEventListener('click', () => {
    navigator.clipboard.writeText(el.textContent)
      .then(() => {
        el.classList.add('コピー！');
        setTimeout(() => el.removeAttribute('class'), 800);
      });
  });
});