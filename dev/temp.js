function log(msg) {
    var textarea = document.getElementById("log-area")
    textarea.innerHTML += (msg + "\n")
    textarea.scrollTop = textarea.scrollHeight
}

$(document).ready(function () {
    $("#sliderSigmaS").slider({
        range: "min",
        min: 1,
        max: 100,
        value: 1,
        slide: function (event, ui) {
            $("#paraS").text(ui.value)
        },
        change: function (event, ui) {
            $("#paraS").text(ui.value)
        }
    })

    $("#sliderSigmaR").slider({
        range: "min",
        min: 1,
        max: 100,
        value: 1,
        slide: function (event, ui) {
            $("#paraR").text(ui.value)
        },
        change: function (event, ui) {
            $("#paraR").text(ui.value)
        }
    })
})


SpiderGL.openNamespace()

function CanvasHandler() {
}

CanvasHandler.prototype = {

    /////////////////////////////////////////////////////////////////////////////////////
    onInitialize: function () {
        var gl = this.ui.gl

        var quadPositions = new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, 1.0
        ])

        var quadTexcoords = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ])

        var quad = new SglModel(gl, {
            data: {
                vertexBuffers: {
                    "positionBuffer": {typedArray: quadPositions},
                    "texcoordBuffer": {typedArray: quadTexcoords}
                },
                indexBuffers: {}
            },
            access: {
                vertexStreams: {
                    "position": {
                        buffer: "positionBuffer",
                        size: 2,
                        type: SGL_FLOAT32,
                        stride: 2 * SGL_SIZEOF_FLOAT32,
                        offset: 0
                    },
                    "texcoord": {
                        buffer: "texcoordBuffer",
                        size: 2,
                        type: SGL_FLOAT32,
                        stride: 2 * SGL_SIZEOF_FLOAT32,
                        offset: 0
                    }
                },
                primitiveStreams: {
                    "triangles": {
                        mode: SGL_TRIANGLE_STRIP,
                        first: 0,
                        count: 4 //number of verticies
                    }
                }
            },
            semantic: {
                bindings: {
                    "COMMON": {
                        vertexStreams: {
                            "POSITION": ["position"],
                            "TEXCOORD": ["texcoord"]
                        },
                        primitiveStreams: {
                            "FILL": ["triangles"]
                        }
                    }
                },
                chunks: {
                    "chunk0": {
                        techniques: {
                            "COMMON": {
                                binding: "COMMON"
                            }
                        }
                    }
                }
            },
            logic: {
                parts: {
                    "main": {
                        chunks: ["chunk0"]
                    }
                }
            }
        })
        this.quad = quad

        var fsQuad = new SglFragmentShader(gl, "\
   			precision highp float;                                                  \n\
                                                                                    \n\
            uniform sampler2D   sTexture;\n\
            uniform sampler2D   sTextureSamples;                                           \n\
            varying vec2        vTexcoord;                                          \n\
            uniform float scaleX, scaleY, scaleY2, sigma_r2, sigma_s2;\n\
                                                                                    \n\
                                                                                    \n\
            void main(void)                                                         \n\
            {                                                                       \n\
	            vec3 colorRef = texture2D(sTexture, vTexcoord).xyz;                   \n\
                vec3 color = vec3(0.0,0.0,0.0);\n\
                float yFetch = vTexcoord.y*scaleY2;\n\
                float weight = 0.0;\n\
                for(int i=0;i<25;i++){\n\
                    vec2 coords = texture2D(sTextureSamples,vec2(float(i)/30.0,yFetch)).xy;\n\
                    coords = (coords-0.5)*vec2(scaleX,scaleY);\n\
                    vec3 colorFetch = texture2D(sTexture,coords+vTexcoord).xyz;\n\
                    vec3 colorDist = colorFetch-colorRef;\n\
                    float tmpWeight = exp(-dot(colorDist,colorDist)/sigma_r2);\n\
                    color += colorFetch*tmpWeight;\n\
                    weight += tmpWeight;\n\
                }\n\
	            if(weight<=0.0)\n\
                    color = colorRef;\n\
                else\n\
                    color = color/weight;\n\
	            gl_FragColor = vec4(color.xyz, 1.0);                                \n\
            }                                                                       \n\
		")
        log("Aligned quad's Fragment Shader Log:\n" + fsQuad.log)

        var vsQuad = new SglVertexShader(gl, "\
    			precision highp float;                                              \n\
                                                                                    \n\
                attribute vec2 aPosition;                                           \n\
                attribute vec2 aTexcoord;                                           \n\
                                                                                    \n\
                varying   vec2 vTexcoord;                                           \n\
                                                                                    \n\
                void main(void)                                                     \n\
                {                                                                   \n\
	                vTexcoord  = aTexcoord;                                         \n\
	                gl_Position = vec4(aPosition, 0.0, 1.0);                        \n\
                }                                                                   \n\
            ")
        log("Aligned quad's Vertex Shader Log:\n" + vsQuad.log)

        var scaleX = (255.0 / 910.0)
        var scaleY = (255.0 / 540.0)
        var scaleY2 = (64.0 / 540)
        var sigma_r = 0.5
        var sigma_r2 = sigma_r * sigma_r * 2.0
        var sigma_s = 5.0
        var sigma_s2 = sigma_s * sigma_s * 2.0

        var program = new SglProgram(gl, {
            shaders: [
                vsQuad,
                fsQuad
            ],
            attributes: {
                "aPosition": 0,
                "aTexcoord": 1
            }
        })

        log("Aligned quad's program:\n" + program.log)

        var techQuad = new SglTechnique(gl, {
            name: "COMMON",
            program: program,
            semantic: {
                vertexStreams: {
                    "POSITION": [{attribute: "aPosition", value: [0.0, 0.0, 0.0, 1.0]}],
                    "TEXCOORD": [{attribute: "aTexcoord", value: [0.0, 0.0, 0.0, 1.0]}]
                },
                globals: {
                    "sTexture": {semantic: "S_TEXTURE", value: 0},
                    "sTextureSamples": {semantic: "S_TEXTURE_SAMPLES", value: 1},
                    "scaleX": {semantic: "SCALE_X", value: scaleX},
                    "scaleY": {semantic: "SCALE_Y", value: scaleY},
                    "scaleY2": {semantic: "SCALE_Y2", value: scaleY2},
                    "sigma_r2": {semantic: "SIGMA_R2", value: sigma_r2},
                    "sigma_s2": {semantic: "SIGMA_S2", value: sigma_s2}
                }
            }
        })
        this.techQuad = techQuad

        var tex = new SglTexture2D(gl, {
            url: "data/venice.png",
            generateMipmap: false,
            autoMipmap: false,
            minFilter: gl.LINEAR,
            magFilter: gl.LINEAR,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE
        })
        this.texture = tex

        var texSamples = new SglTexture2D(gl, {
            url: "data/samples64_quad.png",
            generateMipmap: false,
            autoMipmap: false,
            minFilter: gl.NEAREST,
            magFilter: gl.NEAREST,
            wrapS: gl.REPEAT,
            wrapT: gl.REPEAT
        })
        this.textureSamples = texSamples

        this.renderer = new SglModelRenderer(gl)

        var animationRate = 30
        this.ui.animateRate = animationRate
        this.exposure = 1.0
        var that = this
        setInterval(function () {
            document.getElementById("fps-div").innerHTML = "FPS: " + that.ui.framesPerSecond
        }, 1000)
    },

    onAnimate: function (dt) {
        this.ui.postDrawEvent()
    },


    onMouseButtonDown: function (btn, x, y) {
    },

    onDraw: function () {
        var gl = this.ui.gl
        var width = this.ui.width
        var height = this.ui.height
        var xform = this.xform

        var sigma_r = $("#sliderSigmaR").slider("option", "value")
        sigma_r = sigma_r / 255.0
        var sigma_r2 = sigma_r * sigma_r * 2.0

        //Rendering the aligned quad
        var globals = {
            "SIGMA_R2": sigma_r2
        }

        var renderer = this.renderer
        renderer.begin()
        renderer.setViewport(0, 0, width, height)
        renderer.clearFramebuffer({
            color: [0.0, 0.0, 0.0, 1.0]
        })
        renderer.setTechnique(this.techQuad)
        renderer.setModel(this.quad)
        renderer.setPrimitiveMode("FILL")
        renderer.setDefaultGlobals()
        renderer.setGlobals(globals)
        renderer.setTexture(0, this.texture)
        renderer.setTexture(1, this.textureSamples)
        renderer.renderModel()
        renderer.end()
    }
}

sglHandleCanvasOnLoad("draw-canvas", new CanvasHandler())