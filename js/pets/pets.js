import { initializeTriangle } from "../triangleCharts/triangleUtil.js"
import { loadJson } from "../util/jsonUtil.js";
import { createInjectAble } from "../util/injectionUtil.js";

window.addEventListener('DOMContentLoaded', async () => {
    const triangleConfigs = await loadJson("../json/triangleChartConfigs.json");
    triangleConfigs.forEach(async config => {
        config.data.array = await loadJson(config.data.dataSource)
    })

    const extraHtml = [
        {created: false, name: "resChart", init: initializeResChart},
        {created: false, name: "effectiveHP"},
        {created: false, name: "effectiveStats"},
        {created: false, name: "triangle0", init: initializeTriangle, data: triangleConfigs[0]}, 
        {created: false, name: "triangle1", init: initializeTriangle, data: triangleConfigs[1]}
    ];
    const pathName="/donatorPages/pets/";

    extraHtml.forEach(html => createInjectAble(html,pathName));
});