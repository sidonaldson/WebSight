"use strict"

const initUI = () => {

    Filters.colourBlindness = "none"
    const filters = Filters.availableFilters
    const initialFilter = "sobel3x3"

    window.setShader(initialFilter)

    const controlsRoot = document.getElementById("controls")
    const filtersRoot = controlsRoot.getElementsByClassName("filters")[0]

    // Create filter buttons
    const filterButtons = filters.map((filter) => {
        const button = document.createElement("button")
        button.dataset.filter = filter.toLowerCase().replace(/\s|\-/g, "")
        button.innerText = filter
        button.classList.add("filter-button")

        if (button.dataset.filter === initialFilter) button.disabled = true

        filtersRoot.appendChild(button)
        return button
    }, [])

    // Radius slider
    const radiusSlider = document.getElementById("radius-slider")
    const radiusValue = document.getElementById("radius-value")
    radiusSlider.value = 100

    // Intensity slider
    const intensitySlider = document.getElementById("intensity-slider")
    const intensityValue = document.getElementById("intensity-value")
    intensitySlider.value = 100

    // Events
    document.addEventListener("click", ({ target }) => {
        if (target.dataset.filter) {
            window.setShader(target.dataset.filter)
            filterButtons.forEach(button => button.disabled = false)
            target.disabled = true
        }
    })

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

    invertedCheckbox.addEventListener("click", () => toggleInverted())
    reducedColoursCheckbox.addEventListener("click", () => toggleReducedColours())

}

