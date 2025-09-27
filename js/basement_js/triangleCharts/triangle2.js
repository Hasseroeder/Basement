import { loadJson } from "../util/jsonUtil.js";
import { polygonPlugin, externalTooltipHandler, getLinesAndLabels, dataPoints } from "./triangleUtil.js";

const polygonLabels = [
    {text:"shielded",coor:[55,20]},
    {text:"non-shielded",coor:[30,32.5]}
]
const colors = [
    "rgb(40, 119, 194)",
    "rgb(133, 106, 207)"
]

const polygons = [
    [[70,10],[70,15],[45,40],[45,20],[55,10]],
    [[45,40],[40,45],[15,45],[15,25],[20,20],[45,20]]
];
const polygonColors = [
    "rgba(40, 119, 194, 0.25)",
    "rgba(133, 106, 207, 0.25)"
]

function getPosition(attributes){
    let sum = attributes[0]
            + attributes[2]
            + attributes[3]
            + attributes[5];

    let Heal= 100*(attributes[2])/sum;
    let Sustain= 100*(attributes[3]+attributes[5])/sum;
    return [Heal, Sustain];
}

const bigLabels = [
    {   // topStat
        text: '% of stats in Healing',
        imageSrc:[
            '../media/owo_images/PR.png'
        ],
    },{ // rightStat
        text: '% of stats in Sustain',
        imageSrc:[
            '../media/owo_images/WP.png',
            '../media/owo_images/MR.png',
        ],
    },{ // leftStat
        text: '% of stats in Health',
        imageSrc:[
            '../media/owo_images/HP.png',
        ],
    }  
];

const {lines,labels} = await getLinesAndLabels(bigLabels,{polygonLabels,colors});

const cruneHolders = await loadJson("../json/cruneHolders.json");

export async function initializeTriangle2(){
    const ctx2 = document.getElementById('2myChart');
    const petButton2 = document.getElementById("2petButton");
    const areaButton2 = document.getElementById("2areaButton");
    
    const myChart = new Chart(ctx2, {
        type: 'scatter',
        plugins: [polygonPlugin],
        data: {
            datasets: [{
                label: 'Pet Stats',
                data: dataPoints(cruneHolders,getPosition),
                pointStyle: ctx => ctx.raw.imageEl,
                radius: 10,
                hoverRadius: 15,
                hidden: false
            }]
        },
        options: {
            layout: {
                padding: {
                    left: 60,
                    right: 60,
                    top: 48,
                    bottom: 48
                }
            },
            plugins: {
                tooltip: {
                    mode: 'nearest',
                    enabled: false,          
                    animation: false, 
                    external: externalTooltipHandler  
                },
                legend: {
                    display: false
                },
                annotation: {
                    clip: false,
                    annotations: {
                        ...lines,
                        ...labels
                    }
                },polygonPlugin: {
                    polygons: polygons,
                    colors: polygonColors
                }
            },
            scales: {
                x: {
                    display: false,
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: false,
                    },
                    min: 0,
                    max: 100,
                    grid: {
                        drawOnChartArea: false // Hides square gridlines
                    }
                },
                y: {
                    display: false,
                    type: 'linear',
                    title: {
                        display: false,
                    },
                    min: 0,
                    max: 100,
                    grid: {
                        drawOnChartArea: false // Hides square gridlines
                    }
                }
            }
        },
    });

    function checkLabelVisibility(group){
        const anns = myChart.options.plugins.annotation.annotations;
        Object.keys(anns).forEach(id => {
            if (anns[id].group === group) anns[id].display = ds.hidden && !myChart.polygons.hidden;
        });
        myChart.update();
    }

    const ds = myChart.data.datasets[0]; // pet images
    petButton2.addEventListener('click', function() {
        ds.hidden = !ds.hidden;
        checkLabelVisibility("polygonLabels");
    });

    areaButton2.addEventListener('click', function() {
        myChart.polygons.hidden = !myChart.polygons.hidden;
        checkLabelVisibility("polygonLabels");
    });
    checkLabelVisibility("polygonLabels");
}