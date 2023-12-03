let characters = [];
let charOptions = ["✦", "*", "゜", "･", "ଳ"];

function setup() {
    createCanvas(windowWidth, windowHeight);
    textSize(32);
    frameRate(24);
    noSmooth();
}

function draw() {
    background(0);

    for (let i = 0; i < characters.length; i++) {
        let charInfo = characters[i];
        fill(255);
        textSize(int(charInfo.size)/2);
        text(charInfo.char, int(charInfo.x), int(charInfo.y));
        charInfo.x += map(noise(i,frameCount/4), 0, 1, -2, 2);
        charInfo.y -= 4;
        charInfo.size -= 0.5;
    }

    if (frameCount % 2 == 0) {
        let selectedChar = random(charOptions);
        let charSize = random([8, 4, 16, 16, 32])*2;
        let charInfo = {
            char: selectedChar,
            x: mouseX + random(-5, 5),
            y: mouseY + random(-10, 5),
            size: charSize
        };
        characters.push(charInfo);
    }

    characters = characters.filter(charInfo => charInfo.size > 0);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}