import { initializeTriangle, getTriangleData } from "../triangleCharts/triangleUtil.js"

window.initializetriangle = initializeTriangle;

const buttonNames = ["resChart","effectiveHP","effectiveStats","triangle0", "triangle1"];

const triangleData = await getTriangleData();

function handleButtonClick(Name) {
    const button = document.getElementById(`${Name}Button`); 
    const container = document.getElementById(`${Name}Container`);
    let isCreated = container.dataset.created === "true";

    if (isCreated) {
        const divToRemove = container.querySelector(`.dynamic-${Name}-div`);
        if (divToRemove) {
            container.removeChild(divToRemove);
        }
        container.dataset.created = "false";
    } else {
        button.disabled = true; 
        fetch(`../donatorPages/${Name}.html`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch the file');
                return response.text();
            })
            .then(htmlContent => {
                const newDiv = document.createElement('div');
                newDiv.innerHTML = htmlContent;
                newDiv.className = `dynamic-${Name}-div`;

                container.appendChild(newDiv);
                container.dataset.created = "true";
                if (container.dataset.chartNumber) {
                    initializeTriangle(
                        triangleData[container.dataset.chartNumber],
                        container.querySelector("#chartContainer")
                    );
                }
            })
            .catch(error => console.error('Error:', error))
            .finally(() => button.disabled = false);
    }
}

buttonNames.forEach(Name => {
    document.getElementById(`${Name}Button`).addEventListener("click", () => {
        handleButtonClick(Name);
    });
});