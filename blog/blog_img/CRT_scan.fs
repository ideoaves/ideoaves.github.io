/*{
    "DESCRIPTION": "CRT Scan",
    "CREDIT": "hazuqu",
    "INPUTS": [
        { "NAME": "inputImage", "TYPE": "image" },
        { "NAME": "horizontalBlur", "TYPE": "float", "MIN": 0.0, "MAX": 1.0, "DEFAULT": 0.5, "LABEL": "blur" },
        { "NAME": "RGBeffect", "TYPE": "float", "MIN": 0.0, "MAX": 100.0, "DEFAULT": 20.0, "LABEL": "RGB %", "CLAMP_MIN": true, "CLAMP_MAX": true },
        { "NAME": "pixelScale", "TYPE": "float", "MIN": 1.0, "MAX": 50.0, "DEFAULT": 1.5, "LABEL": "Pixel size" },
        { "NAME": "decayTime", "TYPE": "float", "MIN": 0.01, "MAX": 10.0, "DEFAULT": 9.0, "LABEL": "Decay", "CLAMP_MIN": true, "CLAMP_MAX": true },
        { "NAME": "slowmotion", "TYPE": "float", "MIN": 0.1, "MAX": 1000.0, "DEFAULT": 1.0, "LABEL": "Slowmotion" },
        { "NAME": "useProgressive", "TYPE": "bool", "DEFAULT": false, "LABEL": "interlace OR Progressive" }
    ]
}*/

void main() {
    vec2 uv = isf_FragNormCoord;
    vec3 output;

    // 原点を左上にするよ。
    vec2 leftStart = vec2(gl_FragCoord.x, RENDERSIZE.y - gl_FragCoord.y);
    vec2 pixelCoord = floor(leftStart / pixelScale);
    // R,G,B単体のサブピクセルのサイズ。
    vec2 RGBdotSize = vec2(pixelScale / 6, pixelScale); 

    // pixelScaleを使ってモザイク。上下反転を直すよ。
    vec2 pixelPotision = (pixelCoord + 0.5) * pixelScale;
    vec2 mosaic = vec2(pixelPotision.x / RENDERSIZE.x, 1.0 - (pixelPotision.y / RENDERSIZE.y));

    // 横にブラーを掛けるよ。
    if (horizontalBlur > 0.0) {
        vec3 blurs = vec3(0.0);
        float w[5] = float[](0.3, 0.2, 0.1, 0.05, 0.01); // ニセガウシアン。ちょっと明るい。
        blurs += IMG_NORM_PIXEL(inputImage, mosaic).rgb * w[0];
        for (int i = 1; i < 5; ++i) {
            float offset = float(i) * (pixelScale / RENDERSIZE.x) * horizontalBlur;
            blurs += IMG_NORM_PIXEL(inputImage, mosaic + vec2(offset, 0.0)).rgb * w[i];
            blurs += IMG_NORM_PIXEL(inputImage, mosaic - vec2(offset, 0.0)).rgb * w[i];
        }
        output = blurs;
    } else {
        output = IMG_NORM_PIXEL(inputImage, mosaic).rgb;
    }

    // RGB。
    if (RGBeffect > 0.0) {
        float RGBpixels = mod(floor(leftStart.x / RGBdotSize.x), 6.0);
        vec3 RGBMask = vec3(1.0);
        float ratio = 1.0 - clamp(RGBeffect / 100.0, 0.0, 1.0);

        if (mod(RGBpixels, 3.0) < 1.0) { // R
            RGBMask = vec3(1.0, ratio, ratio);
        } else if (mod(RGBpixels, 3.0) < 2.0) { // G
            RGBMask = vec3(ratio, 1.0, ratio);
        } else { // B
            RGBMask = vec3(ratio, ratio, 1.0);
        }
        output *= RGBMask;
    }

    // 左上から走査して発光させていくよ。
    // decayTimeを0.0-3.0の範囲にリマップするよ。
    float localDecay = decayTime * 0.3;

    if (localDecay > 0.0) {
        // 1/60秒で全部の走査を終えるのを基本とするよ。
        float durationTime = 1.0 / 60.0;

        // 画面上のピクセル行/列の総数。
        float allLines = ceil(RENDERSIZE.y / pixelScale);
        float allPixels = floor(RENDERSIZE.x / pixelScale);
        // 1ラインあたりの走査時間と、1ピクセルあたりの走査時間を用意するよ。
        float lineTime = durationTime / allLines;
        float pixelTime = lineTime / allPixels;
        durationTime += lineTime;

        // 走査の順番。
        float scanOrder;
        if (useProgressive) {
            // プログレッシブ走査も付けておこう。
            scanOrder = pixelCoord.y;
        } else {
            // インターレース走査。
            float lineNo = floor(pixelCoord.y / 2.0);
            scanOrder = (mod(pixelCoord.y, 2.0) < 0.5) ? lineNo : ceil(allLines / 2.0) + lineNo;
        }

        // 1サイクル後も残すよ。
        float scanEnd = mod(TIME / slowmotion, durationTime) - scanOrder * lineTime;
        if (scanEnd < 0.0) {
            scanEnd += durationTime;
        }
        float pixelScanEnd = scanEnd - (pixelCoord.x * pixelTime);

        // 減衰。
        // 0.0で1ライン分の時間、1.0で1フレーム分の時間で減衰するよ。
        float remapDecayTime = mix(lineTime, durationTime, clamp(localDecay, 0.0, 1.0));
        float brightness = (pixelScanEnd < 0.0) ? 0.0 : pow(1.0 - smoothstep(0.0, remapDecayTime, pixelScanEnd), 4.0);
        // decayTimeが2.0->3.0になるにつれてラインの暗転をなくすよ。
        float longDecay = mix(10.0, 0.0, smoothstep(2.0, 3.0, localDecay));
        // 以上の残光効果を適用するよ。
        output *= 1.0 - (1.0 - brightness) * longDecay * 0.1;

        // ピクセルが走査された瞬間に光らせるよ。
        float flash = pixelTime * 5.0; // 5走査ドット分光るようにしてる。もっと長くても良いかも。
        
        if (pixelScanEnd >= 0.0 && pixelScanEnd < flash) {
            float flashAfter = pow(1.0 - (pixelScanEnd / flash), 2.0);
            output = mix(output, vec3(1.0), flashAfter);
        }
    }

    //ドットの質感を作るよ。
    if (pixelScale > 1.0) {
        // 線の周期だよ
        float lineX = mod(leftStart.x, RGBdotSize.x);
        float lineY = mod(leftStart.y, pixelScale / 8.0);

        // 縦線と横線の太さだよ
        float lineXweight = pixelScale / 30.0;
        float lineYweight = pixelScale / 200.0;
        
        bool is_onX = lineX < lineXweight;
        bool is_onY = lineY < lineYweight;

        // pixelScaleを8分割して上下を暗くするよ。
        float RGBdotBit = mod(floor(leftStart.y / pixelScale * 8.0), 8.0);
        if (RGBdotBit == 0.0 || RGBdotBit == 7.0) { output *= 0.4; }
        else if (RGBdotBit == 1.0 || RGBdotBit == 6.0) { output *= 0.7; }

        if (is_onX || is_onY) {
            output = mix(output, vec3(0.0), smoothstep(1.0, 8.0, pixelScale));
        }
    }

    gl_FragColor = vec4(output, 1.0);
}
