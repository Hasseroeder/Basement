import * as pluginHandler from "./trianglePlugins.js"

document.addEventListener("DOMContentLoaded", () => {    
    const ctx = document.getElementById('myChart');
    new Chart(ctx, {
        type: 'scatter',
        plugins: [pluginHandler.cursorLinePluginFactory(), pluginHandler.triangleBasePluginFactory()],
        options: {
            layout: {padding: {left:60,right:60,top:48,bottom:48}},
            plugins: {legend: {display: false},annotation: {clip: false}},
            scales: {
                x: { display: false, min: 0, max: 100 },
                y: { display: false, min: 0, max: 100,}
            }
        },
    });
});