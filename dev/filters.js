"use strict"

class Filters {

    static get availableFilters () {
        return ["Sobel 3x3", "Sobel 5x5"]
    }

    static compileShader (name) {
        return `
            uniform sampler2D texture;
            uniform float width;
            uniform float height;
            uniform float radius;
            uniform float intensity;
            uniform vec2 resolution;
            uniform highp float gamma;
            varying vec2 vUv;
                       
            void main() {

                float w = 1.0 / width;
                float h = 1.0 / height;

                vec4 pixel = texture2D(texture, vUv);

                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < radius) {

                    ${this[name+"Body"]}
                   
                    gl_FragColor = newColour*(1.0-intensity) + pixel*intensity;
                    
                    ${this.hasReducedColours ? this.reducedColoursBody : ""}

                    ${this.isInverted ? this.invertedBody : ""}
                    
                    //gamma
                    gl_FragColor.r = pow(gl_FragColor.r, gamma);
                    gl_FragColor.g = pow(gl_FragColor.g, gamma);
                    gl_FragColor.b = pow(gl_FragColor.b, gamma);
                         
                    //quantise       
                    vec3 color_resolution = vec3(8.0, 8.0, 4.0);
                    vec3 color_bands = floor(gl_FragColor.rgb * color_resolution) / (color_resolution - 1.0);
                    gl_FragColor = vec4(min(color_bands, 1.0), gl_FragColor.a);

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

            vec4 newColour = vec4(sobel, 1.0 );
        `
    }

}