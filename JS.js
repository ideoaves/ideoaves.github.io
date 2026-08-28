/* ロゴのためのp5です */

const tsubure = document.querySelector('.ロゴ')?.classList.contains('大きな') ? 1.0 : 0.4;

const path =
  "M 43.04 191.84 L 42.58 179.04 C 42.58 179.04 42.16 162.42 42.58 151.34 C 42.75 146.78 42.43 139.45 42.1 131.04 C 41.67 120.08 41.17 107.38 41.39 96.15 C 41.79 76.06 41 25.08 41 25.08 L 66.61 25.98 C 66.61 25.98 67.4 76.67 67.02 96.65 C 66.8 107.4 67.29 119.54 67.71 130.02 C 68.07 139.25 68.37 147.28 68.19 152.29 C 67.81 162.38 68.19 177.97 68.19 178.12 L 68.65 190.92 L 43.04 191.84 Z M 114.2 170.64 C 99.57 170.64 18.47 175.87 2.94 177.82 L 2.48 177.88 L 2.48 203.7 L 6.13 203.24 C 22.05 201.25 101.82 196.26 114.2 196.26 L 127.02 196.26 L 127.02 170.63 L 114.2 170.63 Z M 124.53 10.24 L 120.05 9.8 C 114.93 9.3 69.76 4.86 59.98 4.86 L 0 4.86 L 0 30.49 L 59.98 30.49 C 66.43 30.49 97.94 33.37 117.53 35.31 L 124.54 36 L 124.54 10.24 Z M 197.59 199.45 C 167.85 199.45 137.11 177.3 137.11 133.67 C 137.11 99.32 161.27 65.41 205.62 65.41 C 231.25 65.41 248.82 86.37 250.87 88.66 L 259.38 98.23 L 240.26 115.27 L 231.77 105.73 C 231.33 105.27 219.91 91.04 205.62 91.04 C 172.52 91.04 162.72 117.52 162.72 133.67 C 162.72 161.26 180.45 173.82 197.59 173.82 C 216.07 173.82 230.94 158.74 231.08 158.6 L 239.98 149.46 L 258.39 167.1 L 249.59 176.33 C 248.67 177.28 227.19 199.46 197.58 199.46 Z M 264.44 199.45 C 262.72 191.42 258.23 167.76 258.23 139.91 C 258.23 123.26 259.84 101.46 261.53 78.4 C 263.49 51.83 265.49 24.38 265.49 0 L 239.88 0 C 239.88 23.44 237.9 50.43 235.98 76.53 C 234.25 100.07 232.62 122.33 232.62 139.92 C 232.62 165.61 236.04 187.62 238.3 199.46 L 264.44 199.46 Z M 352.44 199.17 C 300.11 199.17 288.52 170.26 286.28 153.03 C 282.52 124.03 290.69 84.77 326.17 69.57 C 346.17 60.98 364.78 65.42 376.88 70.68 C 388.26 75.6 401.28 84.75 404.18 92.69 C 410.21 109.21 385.49 127.1 385.24 127.28 C 379.23 131.41 335.84 152.17 316.02 161.58 C 320.68 167.73 330.61 173.55 352.43 173.55 C 369.61 173.55 375.79 169.11 382.94 163.96 L 385.56 162.09 C 391.19 158.18 394.03 153.19 396.76 148.35 L 408.44 153.74 L 419.58 160.09 C 415.7 166.93 410.61 175.9 400.21 183.12 L 397.93 184.75 C 389.47 190.84 377.89 199.18 352.45 199.18 Z M 349.64 90.4 C 345.32 90.4 340.81 91.18 336.27 93.12 C 316.65 101.53 311.91 121.4 311.19 135.5 C 339.3 122.1 367.03 108.56 370.79 106.12 C 372.81 104.73 375.21 102.3 377.04 100.11 C 371.47 96.05 361.24 90.4 349.64 90.4 Z M 499.67 64.46 C 462.38 64.46 437.33 93.45 437.33 136.58 C 437.33 175.93 465.43 199.45 492.6 199.45 C 519.77 199.45 549.92 172.44 549.92 136.3 C 549.92 91.32 531.13 64.47 499.67 64.47 Z M 499.67 89.6 C 521.89 89.6 524.29 122.26 524.29 136.3 C 524.29 157.36 506.96 174.32 492.6 174.32 C 478.24 174.32 462.96 160.21 462.96 136.59 C 462.96 114.91 472.57 89.6 499.67 89.6 Z M 671.83 202.45 L 665.76 191.17 C 664.36 188.56 663.07 185.88 661.9 183.16 C 653.27 188.54 639.59 194.98 623.51 194.98 C 588.54 194.98 567.66 169.96 567.66 127.97 C 567.66 78.61 606.07 61.46 632.06 61.46 C 648.45 61.46 669.93 69.76 672.33 70.71 L 683.24 75.03 L 679.9 86.29 C 679.86 86.45 675.12 102.56 675.12 120.06 C 675.12 132.18 676.41 156.86 688.32 179.03 L 694.39 190.32 L 671.83 202.45 Z M 632.06 87.09 C 619.4 87.09 593.27 92.66 593.27 127.97 C 593.27 165.1 610.54 169.35 623.51 169.35 C 638.67 169.35 651.29 159.63 653.87 157.48 C 650.26 140.64 649.51 130.48 649.51 120.06 C 649.51 108.99 651.01 98.57 652.49 90.99 C 645.88 89.01 637.89 87.09 632.05 87.09 Z M 778.16 198.88 L 831.49 65.25 L 830.94 65.03 L 803.97 65.03 L 766.05 160.1 L 730.06 65.03 L 702.64 65.03 L 753.32 198.88 L 778.16 198.88 Z M 905.44 199.17 C 853.11 199.17 841.52 170.26 839.28 153.03 C 835.52 124.03 843.69 84.77 879.17 69.57 C 899.17 60.98 917.78 65.42 929.88 70.68 C 941.26 75.6 954.28 84.75 957.18 92.69 C 963.21 109.21 938.49 127.1 938.24 127.28 C 932.23 131.41 888.84 152.17 869.02 161.58 C 873.68 167.73 883.61 173.55 905.43 173.55 C 922.61 173.55 928.79 169.11 935.94 163.96 L 938.56 162.09 C 944.19 158.18 947.03 153.19 949.76 148.35 L 961.44 153.74 L 972.58 160.09 C 968.7 166.93 963.61 175.9 953.21 183.12 L 950.93 184.75 C 942.47 190.84 930.89 199.18 905.45 199.18 Z M 902.63 90.4 C 898.31 90.4 893.8 91.18 889.26 93.12 C 869.64 101.53 864.9 121.4 864.18 135.5 C 892.29 122.1 920.02 108.56 923.78 106.12 C 925.8 104.73 928.2 102.3 930.03 100.11 C 924.46 96.05 914.23 90.4 902.63 90.4 Z M 1050.35 117.58 L 1045.97 116.39 C 1040.36 114.88 1027.28 113.46 1023.76 110.99 C 1024.89 105.77 1033.69 97.71 1041.55 94.47 C 1049.18 91.33 1052.45 90.4 1067.02 86.82 L 1070.68 101.43 L 1097.1 101.43 L 1085.89 56.59 L 1073.9 59.01 C 1063.93 61.02 1038.19 66.57 1022.63 74.29 C 1008.05 81.52 997.98 94.25 997.98 110.73 C 997.98 134.96 1023.17 136.79 1039.29 141.12 L 1043.46 142.27 C 1059.98 146.88 1070.65 151.01 1070.65 157.6 C 1070.65 166.27 1055.16 173.25 1046.9 173.25 C 1034.49 173.25 1017.91 169.51 1014.58 167.32 C 1010.41 164.15 1005.34 158.64 1003.74 156.79 L 984.32 173.52 C 985.09 174.41 991.99 182.35 999.06 187.72 C 1009.07 195.33 1033.53 198.89 1046.9 198.89 C 1066.77 198.89 1096.26 183.17 1096.26 157.61 C 1096.26 138.07 1079.95 125.86 1050.34 117.59 Z";
let p = path.match(/[a-df-zA-DF-Z]|-?[0-9\.]+/g);

function setup() {
  let logo = select('.ロゴ');
  let divWidth = logo.width;
  let divHeight = divWidth * ((203.7 / 1097.1) * tsubure);
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
    const aspectRatio = 203.7 / 1097.1;
    const height = width * aspectRatio * tsubure;

    resizeCanvas(width, height);
  }
}

function draw() {
  clear();
  let x = 0;
  let y = 0;
  scale(s = (width) / 1097.1);
  strokeWeight(2 / s);
  r = 10;

  for (let i = 0; i < p.length; i++) {
    let cmd = p[i];
    if (cmd === "M") {
      x = p[i + 1];
      y = p[i + 2];
      vertex(parseFloat(x) + random(r), y * tsubure);
      i += 2;
    } else if (cmd === "L") {
      x = p[i + 1];
      y = p[i + 2];
      vertex(parseFloat(x) + random(r), y * tsubure);
      i += 2;
    } else if (cmd === (random() >= 0.3 ? "C" : random(["L", "M", "Z"]))) {
      let x1 = p[i + 1];
      let y1 = p[i + 2];
      let x2 = p[i + 3];
      let y2 = p[i + 4];
      let x3 = p[i + 5];
      let y3 = p[i + 6];
      bezierVertex(x1, y1 * tsubure, x2, y2 * tsubure, x3, y3 * tsubure);
      x = x3;
      y = y3;
      i += 6;
    } else if (cmd === "H") {
      x = p[i + 1];
      vertex(parseFloat(x) + random(r), y * tsubure);
      i += 1;
    } else if (cmd === "V") {
      y = p[i + 1];
      vertex(parseFloat(x) + random(r), y * tsubure);
      i += 1;
    } else if (cmd === (random() >= 0.1 ? "Z" : random(["L", "M", "C"]))) {
      endShape();
      beginShape();
    }
  }
  endShape(CLOSE);
}

/* ページの書式についてです */
fetch("/header.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("ヘッダー").innerHTML = html;
  });

document.querySelectorAll('.カーソルを').forEach(el => {
  el.setAttribute('tabindex', '0');
  const spans = el.querySelectorAll(':scope > span');
  if (spans.length > 1) {
    spans[1].classList.add('すると出る');
  }
});

/* lNの下線の左端から行間へ降り、左の余白を通ってtNの直前へ線を引きます */

const layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
layer.setAttribute('class', 'つなぐ線');
document.body.appendChild(layer);

function redrawLines() {
  layer.style.width = document.documentElement.scrollWidth + 'px';
  layer.style.height = document.documentElement.scrollHeight + 'px';
  layer.replaceChildren();
  const pairs = [...document.querySelectorAll('.下線[data-線]')].flatMap(from =>
    [...document.querySelectorAll(`.線の先[data-線="${from.getAttribute('data-線')}"]`)]
      .map(to => [from, to]));
  for (const [from, to] of pairs) {
    const a = from.getClientRects()[0] ?? from.getBoundingClientRect();
    const b = to.getClientRects()[0] ?? to.getBoundingClientRect();
    const style = getComputedStyle(from);
    const startX = a.left + scrollX;
    const startY = a.bottom - 3 + scrollY;
    const endX = b.left + scrollX - 10;
    const endY = b.top + b.height / 2 + scrollY + 1;
    const laneY = a.top + (parseFloat(style.lineHeight) + parseFloat(style.fontSize)) / 2 + scrollY + 4;
    const radi = 15;
    const railX = Math.min(startX - radi, endX) - 15;
    const down = Math.sign(endY - laneY) || 1;
    const r = Math.max(0, Math.min(radi,
      Math.abs(endY - laneY) / 2, startX - radi - railX, endX - railX));
    const curve = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    curve.setAttribute('d',
      `M ${startX} ${startY} Q ${startX} ${laneY} ${startX - radi} ${laneY}` +
      ` H ${railX + r} Q ${railX} ${laneY} ${railX} ${laneY + r * down}` +
      ` V ${endY - r * down} Q ${railX} ${endY} ${railX + r} ${endY} H ${endX}`);
    layer.appendChild(curve);
  }
}
new ResizeObserver(redrawLines).observe(document.body);
window.addEventListener('resize', redrawLines);

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


/* ブログ用乱数生成機 */
function rand() {
    return Math.floor(Math.random() * 201);
}

const elements = document.querySelectorAll('.乱数');
elements.forEach(el => {
  el.textContent = rand();
});
document.querySelectorAll('.承認欲求 div').forEach(div => {
  div.addEventListener('click', () => {
    const span = div.querySelector('.乱数');
    span.textContent = Number(span.textContent) + 1;
  });
});