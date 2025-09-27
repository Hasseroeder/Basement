import { loadJson } from "../util/jsonUtil.js";
import { getLinesAndLabels, externalTooltipHandler, polygonPlugin, dataPoints } from "./triangleUtil.js";

const polygonLabels = [
    {text: 'Gem', coor: [70,25], rotation: 57.2957795},
    {text: 'Gemlike', coor: [60,25], rotation: 57.2957795},
    {text: 'Attacker', coor: [72.5,7], rotation: -57.2957795},
    {text: 'Hybrid', coor: [35.5,7], rotation: -57.2957795},
    {text: 'Pure', coor: [7.5,7], rotation: -57.2957795},
    {text: 'WP Tank', coor: [7.5,32.5]},
    {text: 'WP Hybrid', coor: [23,25.6]},
    {text: 'Supporter', coor: [47.5,32.5]},
    {text: 'Useless', coor: [15,67.5]}
];

const colors = [
    "rgb(65, 172, 39)",
    "rgb(99, 192, 187)",
    "rgb(210, 210, 210)",
    "rgb(218, 147, 214)",
    "rgb(210, 210, 210)",
    "rgb(99, 192, 187)",
    "rgb(76, 148, 255)",
    "rgb(160, 160, 160)",
    "rgb(160, 160, 160)",
]

const polygons = [
    [[100,0],[50,50],[40,50],[90,0]],
    [[90,0],[40,50],[30,50],[80,0]],
    [[100,0],[85,15],[55,15],[55,0]],
    [[55,0],[55,15],[15,15],[15,0]],
    [[15,0],[15,15],[0,15],[0,0]],
    [[15,15],[15,50],[0,50],[0,15]],
    [[15,15],[45,15],[15,45]],
    [[45,15],[85,15],[50,50],[15,50],[15,45]]
];
const polygonColors = [
    "rgba(65, 172, 39, 0.25)",
    "rgba(99, 192, 187, 0.25)",
    "rgba(210, 210, 210, 0.25)",
    "rgba(218, 147, 214, 0.25)",
    "rgba(210, 210, 210, 0.25)",
    "rgba(99, 192, 187, 0.25)",
    "rgba(76, 148, 255, 0.25)",
    "rgba(160, 160, 160, 0.25)",
]

const bigLabels = [
    {   // topStat
        text: '% of stats in Power',
        imageSrc:[
            '../media/owo_images/STR.png',
            '../media/owo_images/MAG.png'
        ],
    },{ // rightStat
        text: '% of stats in WP',
        imageSrc:[
            '../media/owo_images/WP.png',
        ],
    },{ // leftStat
        text: '% of stats in Tanking',
        imageSrc:[
            '../media/owo_images/HP.png',
            '../media/owo_images/PR.png',
            '../media/owo_images/MR.png',
        ],
    }  
];


const pets = await loadJson("../json/pets.json");

const {lines,labels} = await getLinesAndLabels(bigLabels,{polygonLabels,colors});

function getPosition(attributes){
    let sum = attributes.reduce((acc, num) => acc + num, 0);

    let Wp= 100*(attributes[3])/sum;
    let Power= 100*(attributes[1]+attributes[4])/sum;

    return [Power, Wp];
}

export async function initializeTriangle(){

    const ctx = document.getElementById('1myChart');
    const petButton = document.getElementById("petButton");
    const areaButton = document.getElementById("areaButton");


    Chart.register(window['chartjs-plugin-annotation']);
    
    const mainChart = new Chart(ctx, {
        type: 'scatter',
        plugins: 
            [polygonPlugin],
        data: {
            datasets: [{
                label: 'Pet Stats',
                data: dataPoints(pets, getPosition),
                pointStyle: ctx => ctx.raw.imageEl,
                radius: 10,
                hoverRadius: 15,
                hidden: false,
                clip:false
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
                        ...labels,
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
        const anns = mainChart.options.plugins.annotation.annotations;
        Object.keys(anns).forEach(id => {
            if (anns[id].group === group) anns[id].display = ds.hidden && !mainChart.polygons.hidden;
        });
        mainChart.update();
    }

    const ds = mainChart.data.datasets[0]; // pet images
    petButton.addEventListener('click', function() {
        ds.hidden = !ds.hidden;
        checkLabelVisibility("polygonLabels");
    });

    areaButton.addEventListener('click', function() {
        mainChart.polygons.hidden = !mainChart.polygons.hidden;
        checkLabelVisibility("polygonLabels");
    });
    checkLabelVisibility("polygonLabels");

}