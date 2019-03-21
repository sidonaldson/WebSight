"use strict"

class Filters {

    static get availableFilters () {
        return ["Sobel 3x3", "Sobel 5x5"]
    }

    static compileShader (name) {
        return `
            uniform sampler2D texture;
            uniform sampler2D fireTex;
            uniform sampler2D noiseTex;
            uniform float width;
            uniform float height;
            uniform float radius;
            uniform float intensity;
            uniform vec2 resolution;
            varying vec2 vUv;

            uniform float edgeR;
            uniform float edgeG;
            uniform float edgeB;

            uniform float surfaceR;
            uniform float surfaceG;
            uniform float surfaceB;

            uniform float fireTimer;
            uniform float lightCols[5];
            uniform float lightColsEnds[5];

            float rand(vec2 co){
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
            }

            void main() {

                float w = 1.0 / width;
                float h = 1.0 / height;

                vec4 pixel = texture2D(texture, vUv);

                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < radius) {

                    ${this[name+"Body"]}

                    gl_FragColor = newColour*(1.0-intensity) + pixel*intensity;

                    ${this.hasBackground ? this.addBackground : ""}

                    ${this.hasReducedColours ? this.reducedColoursBody : ""}

                    ${this.isInverted ? this.invertedBody : ""}

                } else {
                    gl_FragColor = vec4(pixel.rgb, 1.0);
                }

            }
        `
    }

    static get invertedBody () {
        return `
            gl_FragColor.rgb = 1.0 - gl_FragColor.rgb;
        `
    }

    static get reducedColoursBody () {
        return `
            gl_FragColor.r = float(floor(gl_FragColor.r * 5.0 ) / 5.0);
            gl_FragColor.g = float(floor(gl_FragColor.g * 5.0 ) / 5.0);
            gl_FragColor.b = float(floor(gl_FragColor.b * 5.0 ) / 5.0);
        `
    }

    static get addBackground () {
        return `
            gl_FragColor.r += pixel.r * 0.9;
            gl_FragColor.g += pixel.g * 0.9;
            gl_FragColor.b += pixel.b * 0.9;
        `
    }

    /*
    1   0   -1
    2   0   -2
    1   0   -1
    */
    static get sobel3x3Body () {
        return `
            vec4 n[9];
            n[0] = texture2D(texture, vUv + vec2(0.0, 0.0) );
            n[1] = texture2D(texture, vUv + vec2(w, 0.0) );
            n[2] = texture2D(texture, vUv + vec2(2.0*w, 0.0) );
            n[3] = texture2D(texture, vUv + vec2(0.0*w, h) );
            n[4] = texture2D(texture, vUv + vec2(w, h) );
            n[5] = texture2D(texture, vUv + vec2(2.0*w, h) );
            n[6] = texture2D(texture, vUv + vec2(0.0, 2.0*h) );
            n[7] = texture2D(texture, vUv + vec2(w, 2.0*h) );
            n[8] = texture2D(texture, vUv + vec2(2.0*w, 2.0*h) );

            vec4 sobel_x = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
            vec4 sobel_y = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);

            float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0;
            float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0;

            sobel_x.r = avg_x;
            sobel_x.g = avg_x;
            sobel_x.b = avg_x;
            sobel_y.r = avg_y;
            sobel_y.g = avg_y;
            sobel_y.b = avg_y;

            vec3 sobel = vec3(sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)));
            sobel.r = surfaceR * (1.0 - sobel.r) + sobel.r * edgeR;
            sobel.g = surfaceG * (1.0 - sobel.g) + sobel.g * edgeG;
            sobel.b = surfaceB * (1.0 - sobel.b) + sobel.b * edgeB;

            vec4 newColour = vec4( sobel, 1.0 );
        `
    }

    /*
    2   1   0   -1  -2
    3   2   0   -2  -3
    4   3   0   -3  -4
    3   2   0   -2  -3
    2   1   0   -1  -2
    */
    static get sobel5x5Body () {
        return `
            vec4 n[25];

            for (int i=-2; i<=2; i++) {
                for (int j=-2; j<=2; j++) {
                    n[(j+2)+(i+2)*5] = texture2D(texture, vUv + vec2(float(j)*w, float(i)*h) );
                }
            }

            vec4 sobel_x = 2.0*n[4] + 3.0*n[9] + 4.0*n[14] + 3.0*n[19] + 2.0*n[24] +
                           n[3] + 2.0*n[8] + 3.0*n[13] + 2.0*n[18] + n[23] -
                           (2.0*n[0] + 3.0*n[5] + 4.0*n[10] + 3.0*n[15] + 2.0*n[20] +
                           n[1] + 2.0*n[6] + 3.0*n[11] + 2.0*n[16] + n[21]);

            vec4 sobel_y = 2.0*n[0] + n[1] + n[3] + n[4] +
                           3.0*n[5] + 2.0*n[6] + 2.0*n[8] + 3.0*n[9] -
                           (3.0*n[15] + 2.0*n[16] + 2.0*n[18] + 3.0*n[19] +
                            2.0*n[20] + n[21] + n[23] + n[24]);

            float avg_x = (sobel_x.r + sobel_x.g + sobel_x.b) / 3.0 / 9.0;
            float avg_y = (sobel_y.r + sobel_y.g + sobel_y.b) / 3.0 / 9.0;

            sobel_x.r = avg_x;
            sobel_x.g = avg_x;
            sobel_x.b = avg_x;
            sobel_y.r = avg_y;
            sobel_y.g = avg_y;
            sobel_y.b = avg_y;

            vec3 sobel = vec3(sqrt((sobel_x.rgb * sobel_x.rgb) + (sobel_y.rgb * sobel_y.rgb)));
            sobel.r = surfaceR * (1.0 - sobel.r) + sobel.r * edgeR;
            sobel.g = surfaceG * (1.0 - sobel.g) + sobel.g * edgeG;
            sobel.b = surfaceB * (1.0 - sobel.b) + sobel.b * edgeB;

            vec4 newColour = vec4(sobel, 1.0 );
        `
    }

}