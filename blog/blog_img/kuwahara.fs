/*{
    "DESCRIPTION": "XY Kuwahara filter",
    "CREDIT": "hazuqu",
    "INPUTS": [
        { "NAME": "inputImage", "TYPE": "image" },
        { "NAME": "radiusX", "TYPE": "float", "MIN": 1.0, "MAX": 20.0, "DEFAULT": 2.0 },
        { "NAME": "radiusY", "TYPE": "float", "MIN": 1.0, "MAX": 20.0, "DEFAULT": 2.0 }
    ]
}*/

void main() {
    int r = int(floor(radiusX));
    int r2 = int(floor(radiusY));

    vec4 m[4];
    vec4 s[4];
    for (int k = 0; k < 4; k++) {
        m[k] = vec4(0.0);
        s[k] = vec4(0.0);
    }

    for (int q = 0; q < 4; q++) {
        for (int y = -r2; y <= r2; y++) {
            if ((q < 2 && y > 0) || (q >= 2 && y < 0)) continue;
            for (int x = -r; x <= r; x++) {
                if ((q % 2 == 0 && x > 0) || (q % 2 == 1 && x < 0)) continue;
                vec4 c = IMG_NORM_PIXEL(inputImage, isf_FragNormCoord + vec2(x, y) / RENDERSIZE);
                m[q] += c;
                s[q] += c * c;
            }
        }
    }

    float cnt = float((r + 1) * (r2 + 1));
    vec4 result = vec4(0.0);
    float minSigma = 10.0;

    for (int k = 0; k < 4; k++) {
        vec4 mean = m[k] / cnt;
        vec4 sigma = abs(s[k] / cnt - mean * mean);
        float sum = sigma.r + sigma.g + sigma.b;
        if (sum < minSigma) {
            minSigma = sum;
            result = mean;
        }
    }

    gl_FragColor = vec4(result.rgb, 1.0);
}
