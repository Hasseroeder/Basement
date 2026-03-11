import { initializeTriangle, getLinesAndLabels } from "../triangleCharts/triangleUtil.js"
import { loadJson } from "../util/jsonUtil.js";
import { createInjectAble } from "../util/injectionUtil.js";

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
        {created: false, name: "resChart", init: initializeResChart},
        {created: false, name: "effectiveHP"},
        {created: false, name: "effectiveStats"},
        {created: false, name: "triangle0", init: initializeTriangle, data: triangleData[0]}, 
        {created: false, name: "triangle1", init: initializeTriangle, data: triangleData[1]}
    ];
    const pathName="../donatorPages/pets/";

    extraHtml.forEach(html => createInjectAble(html,pathName));
});