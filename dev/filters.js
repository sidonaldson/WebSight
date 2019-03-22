"use strict"

class Filters {

    static compileShader(name) {
        return `
           
            uniform sampler2D texture;
            uniform float width;
            uniform float height;
            uniform float radius;
            uniform float intensity;
            uniform float threshold;
            uniform highp float gamma;
            varying vec2 vUv;
                       
            void main() {

                float w = 1.0 / width;
                float h = 1.0 / height;

                vec4 pixel = texture2D(texture, vUv);

                if (sqrt( (0.5 - vUv[0])*(0.5 - vUv[0]) + (0.5 - vUv[1])*(0.5 - vUv[1]) ) < radius) {
                    
                    ${this.sobel3x3}   
                                 
                    ${this.intensityBody}                    
                                   
                    ${this.quantiseBody}   
                    
                    ${this.hasReducedColours ? this.reducedColoursBody : ""}  
                    
                    ${this.isInverted ? this.invertedBody : ""}  
                    
                    ${this.gammaBody} 
                    
                    ${this.thresholdBody}                                    
                    
                } else {
                    gl_FragColor = vec4(pixel.rgb, 1.0);
                }

            }
        `
    }

    // static get randomShaderFunc(scale, seed) {
    //     return `
    //         fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed)
    //     `
    // }

    static get thresholdBody() {
        // ar output = Filters.createImageData(pixels.width, pixels.height);
        // if (high == null) high = 255;
        // if (low == null) low = 0;
        // var d = pixels.data;
        // var dst = output.data;
        // for (var i=0; i<d.length; i+=4) {
        //     var r = d[i];
        //     var g = d[i+1];
        //     var b = d[i+2];
        //     var v = (0.3*r + 0.59*g + 0.11*b >= threshold) ? high : low;
        //     dst[i] = dst[i+1] = dst[i+2] = v;
        //     dst[i+3] = d[i+3];
        // }
        // return output;
        // var v = (0.2126*r + 0.7152*g + 0.0722*b >= threshold) ? 255 : 0;
        // 			d[i] = d[i+1] = d[i+2] = v
        return `
             vec3 col = gl_FragColor.rgb;
            float bright = 0.33333 * (col.r + col.g + col.b);
            float b = mix(0.0, 1.0, step(threshold, bright));
           
            gl_FragColor = vec4(vec3(b), 1.0);
        `
    }

    static get intensityBody() {
        return `
             //gl_FragColor = gl_FragColor.a*(1.0-intensity) + pixel*intensity;
             gl_FragColor.a = pow(gl_FragColor.a, intensity);

        `
    }

    static get gammaBody() {
        return `
            gl_FragColor.r = pow(gl_FragColor.r, gamma);
            gl_FragColor.g = pow(gl_FragColor.g, gamma);
            gl_FragColor.b = pow(gl_FragColor.b, gamma);
        `
    }

    static get quantiseBody() {
        return `
            vec3 color_resolution = vec3(4.0, 8.0, 4.0);
            vec3 color_bands = floor(gl_FragColor.rgb * color_resolution) / (color_resolution - 1.0);
            gl_FragColor = vec4(min(color_bands, 1.0), gl_FragColor.a);
        `
    }

    static get invertedBody() {
        return `
            gl_FragColor.rgb = 1.0 - gl_FragColor.rgb;
        `
    }

    static get reducedColoursBody() {
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
    static get sobel3x3() {
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

            gl_FragColor = vec4( sobel, 1.0 );
        `
    }

}