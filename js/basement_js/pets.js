import { initializeTriangle } from './triangleCharts/triangle.js';
import { initializeTriangle2 } from './triangleCharts/triangle2.js';

window.initializetriangle = initializeTriangle;
window.initializetriangle2 = initializeTriangle2;

const buttonNames = ["resChart","effectiveHP","effectiveStats","triangle", "triangle2"];

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
        fetch(`donatorPages/${Name}.html`)
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
                if (window[`initialize${Name}`]) {
                    window[`initialize${Name}`]();
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