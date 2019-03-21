"use strict"

const degToRad = x => x * Math.PI / 180

window.addEventListener("load", async () => {

    // Renderer and VR stuff
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    renderer.domElement.style.backgroundColor = "#333333"

    let effect = new THREE.VREffect(renderer)
    effect.separation = 0
    effect.setSize(window.innerWidth, window.innerHeight)

    // Scenes and camera
    const fov = 70
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000)
    scene.add(camera)

    // Box object
    let texture
    let boxMaterial
    let box

    // Detection box/canvas
    window.detectionCanvas = document.createElement("canvas")
    let detectionContext
    let detectionTexture
    let detectionMaterial
    let detectionBox

    const makeBoxObject = () => {
        window.video = document.createElement("video")
        video.autoplay = true
        video.width = window.innerWidth / 2
        video.height = window.innerHeight / 2
        getVideoFeed()

        detectionCanvas.width = video.width
        detectionCanvas.height = video.height
        window.detectionContext = detectionContext = detectionCanvas.getContext("2d")
        detectionContext.strokeWidth = 25
        detectionContext.font = "20px Arial"
        detectionContext.textAlign = "center"

        const boxWidth = video.width
        const boxHeight = video.height

        const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, 1)
        texture = new THREE.Texture(video)
        texture.minFilter = THREE.NearestFilter

        const detectionGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, 1)
        detectionTexture = new THREE.Texture(detectionCanvas)
        detectionTexture.minFilter = THREE.NearestFilter

        boxMaterial = new THREE.ShaderMaterial({
            uniforms: {
                texture: {
                    type: "t",
                    value: texture
                },
                width: {
                    type: "f",
                    value: video.width
                },
                height: {
                    type: "f",
                    value: video.height
                },
                radius: {
                    type: "f",
                    value: 0.4
                },
                intensity: {
                    type: "f",
                    value: 1.0
                },
                gamma: {
                    type: "f",
                    value: 1
                }
            },
            vertexShader: vertexShaderSource.text,
            fragmentShader: Filters.compileShader("sobel3x3")
        })
        box = new THREE.Mesh(boxGeometry, boxMaterial)
        scene.add(box)

        detectionMaterial = new THREE.MeshBasicMaterial({map: detectionTexture, transparent: true})
        detectionBox = new THREE.Mesh(detectionGeometry, detectionMaterial)
        scene.add(detectionBox)

        camera.position.z = 0.5 * boxWidth * Math.atan(degToRad(90 - fov / 2)) + 100
    }

    let getVideoFeedAttempts = 0

    const getVideoFeed = () => {

        let errMessage = "There was an error accessing the camera."

        if (!location.protocol.startsWith("https")) {
            errMessage += " Please make sure you are using https."
        }

        try {

            if ("mozGetUserMedia" in navigator) {
                navigator.mozGetUserMedia(
                    {video: {facingMode: "environment"}},
                    stream => {
                        video.srcObject = stream
                    },
                    err => {
                        console.log(err)
                        alert(errMessage)
                    }
                )
            } else {
                const mediaDevicesSupport = navigator.mediaDevices && navigator.mediaDevices.getUserMedia

                if (mediaDevicesSupport) {
                    navigator.mediaDevices
                        .getUserMedia({video: {facingMode: "environment"}})
                        .then(stream => {
                            video.srcObject = stream
                        })
                        .catch(err => {
                            console.log(err)
                            getVideoFeedAttempts++

                            // Rarely, getting the camera fails. Re-attempting usually works, on refresh.
                            if (getVideoFeedAttempts < 3) {
                                getVideoFeed()
                            } else {
                                alert(errMessage)
                            }
                        })
                } else {
                    const getUserMedia =
                        navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia

                    if (getUserMedia) {
                        getUserMedia(
                            {video: {facingMode: "environment"}},
                            stream => {
                                video.srcObject = stream
                            },
                            err => {
                                console.log(err)
                                alert(errMessage)
                            }
                        )
                    } else {
                        alert("Camera not available")
                    }
                }
            }

        } catch (e) {
            alert(errMessage)
        }
    }

    // Render loop
    const render = () => {

        requestAnimationFrame(render)

        if (video.currentTime) {
            texture.needsUpdate = true
            detectionTexture.needsUpdate = true
        }

        effect.render(scene, camera)

    }

    makeBoxObject()
    render()

    // Resizing
    window.addEventListener("resize", () => {
        effect.setSize(window.innerWidth, window.innerHeight)
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        scene.remove(box)
        video.pause()
        makeBoxObject()
    })

    window.setShader = shader => {
        Filters.shader = shader
        boxMaterial.fragmentShader = Filters.compileShader(shader)
        boxMaterial.needsUpdate = true
    }

    window.setRadius = val => {
        boxMaterial.uniforms.radius.value = val
    }

    window.setIntensity = val => {
        boxMaterial.uniforms.intensity.value = 1 - val
    }

    window.setGamma = val => {
        boxMaterial.uniforms.gamma.value = 1 - val
    }

    window.toggleInverted = () => {
        Filters.isInverted = !Filters.isInverted
        boxMaterial.fragmentShader = Filters.compileShader(Filters.shader)
        boxMaterial.needsUpdate = true
    }

    window.toggleReducedColours = () => {
        Filters.hasReducedColours = !Filters.hasReducedColours
        boxMaterial.fragmentShader = Filters.compileShader(Filters.shader)
        boxMaterial.needsUpdate = true
    }


    initUI()
})