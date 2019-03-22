"use strict"

const initUI = () => {

    // Radius slider
    const radiusSlider = document.getElementById("radius-slider")
    const radiusValue = document.getElementById("radius-value")
    radiusSlider.value = 100

    // Intensity slider
    const intensitySlider = document.getElementById("intensity-slider")
    const intensityValue = document.getElementById("intensity-value")
    intensitySlider.value = 1

    // Intensity slider
    const gammaSlider = document.getElementById("gamma-slider")
    const gammaValue = document.getElementById("gamma-value")
    gammaSlider.value = 0

    // Threshold slider
    const thresholdSlider = document.getElementById("threshold-slider")
    const thresholdValue = document.getElementById("threshold-value")
    thresholdSlider.value = 0

    const updateRadius = ({ target }) => {
        window.setRadius(target.value / 100)
        radiusValue.innerText = `${target.value}%`
    }
    updateRadius({target: radiusSlider})

    radiusSlider.addEventListener("change", updateRadius)
    radiusSlider.addEventListener("mousemove", updateRadius)

    const updateIntensity = ({ target }) => {
        window.setIntensity(target.value === "0" ? 0.01 : target.value / 100)
        intensityValue.innerText = `${target.value}%`
    }
    updateIntensity({target: intensitySlider})

    intensitySlider.addEventListener("mousemove", updateIntensity)
    intensitySlider.addEventListener("change", updateIntensity)

    const updateGamma = ({ target }) => {
        window.setGamma(target.value === "0" ? 0.01 : target.value / 100)
        gammaValue.innerText = `${target.value}%`
    }
    updateGamma({target: gammaSlider})

    gammaSlider.addEventListener("mousemove", updateGamma)
    gammaSlider.addEventListener("change", updateGamma)

    const updateThreshold = ({ target }) => {
        window.setThreshold(target.value === "0" ? 0.01 : target.value / 100)
        thresholdValue.innerText = `${target.value}%`
    }
    updateThreshold({target: thresholdSlider})

    thresholdSlider.addEventListener("mousemove", updateThreshold)
    thresholdSlider.addEventListener("change", updateThreshold)

    invertedCheckbox.addEventListener("click", () => toggleInverted())
    reducedColoursCheckbox.addEventListener("click", () => toggleReducedColours())

}

