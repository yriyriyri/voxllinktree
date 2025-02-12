uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float radius;
    uniform float blurOpacity;
    varying vec2 vUv;

    void main() {
        vec4 blurredColor = vec4(0.0);
        float totalSamples = 0.0;

        float offX = radius / resolution.x;
        float offY = radius / resolution.y;

        for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 offset = vec2(float(x) * offX, float(y) * offY);
            vec4 sampleColor = texture2D(tDiffuse, vUv + offset);

            blurredColor += sampleColor;
            totalSamples += 1.0;
        }
        }

        blurredColor /= totalSamples;

        vec4 originalColor = texture2D(tDiffuse, vUv);

        vec4 finalColor = mix(originalColor, blurredColor, blurOpacity);

        gl_FragColor = finalColor;
    }