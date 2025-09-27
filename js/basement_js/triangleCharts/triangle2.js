import { loadJson } from "../util/jsonUtil.js";
import { polygonPlugin, externalTooltipHandler, getX, getY, getLinesAndLabels, getPolygonLabels } from "./triangleUtil.js";

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

const stats = [
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

const {lines,labels} = await getLinesAndLabels(stats);

const crune = await loadJson("../json/cruneHolders.json");
const dataPoints = crune.map(item => {
    const imgEl = new Image();
    imgEl.src = item.image;
    imgEl.height=22;
    imgEl.width=22;
    return {
        x: getX(...getPosition(item.attributes)),
        y: getY(...getPosition(item.attributes)),
        label: item.name,
        imageEl: imgEl,
        attributes: item.attributes,
    };
});

export async function initializeTriangle2(){
    const ctx2 = document.getElementById('2myChart');
    const areaCtx2 = document.getElementById("2areaCanvas");

    const petButton2 = document.getElementById("2petButton");
    const areaButton2 = document.getElementById("2areaButton");

    Chart.register(window['chartjs-plugin-annotation']);
    
    const mainChart = new Chart(ctx2, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Pet Stats',
                data: dataPoints,
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

    const polygonChart = new Chart(areaCtx2, {
        type: 'scatter',
        plugins:
            [polygonPlugin],
        options: {
            plugins: {
                tooltip: {
                    enabled: false,
                    animation: false, 
                },
                legend: {
                    display: false
                },
                polygonPlugin: {
                    polygons: polygons,
                    colors: polygonColors
                },
                annotation: {
                    clip: false,
                    annotations:getPolygonLabels(polygonLabels,colors)
                }
            },
            layout: {
                padding: {
                    left: 60,
                    right: 60,
                    top: 48,
                    bottom: 48
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

    function labelVisibility(){
        const anns = polygonChart.options.plugins.annotation.annotations;
        Object.keys(anns).forEach(id => {
            anns[id].display = 
                ds.hidden && !polygonChart.polygons.hidden;
        });
        polygonChart.update();
    }

    const ds = mainChart.data.datasets[0]; // pet images
    petButton2.addEventListener('click', function() {
        if ( !ds.hidden ){
            ds.hidden = true;
        }else{
            ds.hidden = false;
        }
        labelVisibility();
        mainChart.update();
    });

    areaButton2.addEventListener('click', function() {
        if ( polygonChart.polygons.hidden == true){
            polygonChart.polygons.hidden = false;
        }else {
            polygonChart.polygons.hidden = true;
        }
        labelVisibility();
    });

    labelVisibility();
}