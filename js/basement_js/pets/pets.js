import { initializeTriangle, getLinesAndLabels } from "../triangleCharts/triangleUtil.js"
import { loadJson } from "../util/jsonUtil.js";

window.addEventListener('DOMContentLoaded', async () => {
    const rawTriangleData = await loadJson("../json/triangleChartConfigs.json");
    const [anns, pets] = await Promise.all([
        Promise.all(rawTriangleData.map(cfg => getLinesAndLabels(cfg))),
        Promise.all(rawTriangleData.map(cfg => loadJson(cfg.jsonPath)))
    ]);
    const triangleData = rawTriangleData.map((chartData, i) => ({
        chartData, ann:anns[i], pets:pets[i]
    }));
    const extraHtml = [
        {created: false, name: "resChart", chartID: -1, init: initializeResChart},
        {created: false, name: "effectiveHP"},
        {created: false, name: "effectiveStats"},
        {created: false, name: "triangle0", chartID: 0, init: initializeTriangle}, 
        {created: false, name: "triangle1", chartID: 1, init: initializeTriangle}
    ];

    await Promise.all(extraHtml.map(async html => {
        const response = await fetch(`../donatorPages/${html.name}.html`);
        const htmlContent = await response.text();
        html.cachedDiv = document.createElement('div');
        html.cachedDiv.innerHTML = htmlContent;

        const container = document.getElementById(`${html.name}Container`);
        container.querySelector('button').addEventListener("click", () => {
            html.created ? container.lastElementChild.remove() 
                         : container.appendChild(html.cachedDiv);
            html.created = !html.created;
        });

        if (html.init){
            html.init(
                html.cachedDiv.querySelector("#chartContainer"),
                triangleData[html.chartID]??[]
            );
        }
    }));
});