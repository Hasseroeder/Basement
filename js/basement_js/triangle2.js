const trianglePlugin = {
    id: 'triangleOverlay',
    beforeDraw(chart) {
        const { ctx, chartArea: { left, top, right, bottom } } = chart;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(left, bottom); 
        ctx.lineTo(right, bottom); 
        ctx.lineTo(left + (right - left) / 2, top); 
        ctx.closePath();

        ctx.strokeStyle = 'lightgray';
        ctx.lineWidth = 0.2;
        ctx.stroke();

        ctx.restore();
    }
};

const colors = [
    "rgba(40, 119, 194, 0.25)",
    "rgba(133, 106, 207, 0.25)"
]

const polygonPlugin = {
  id: 'polygonHighlight',
  afterDraw: (chart) => {
    const ctx = chart.ctx;
    ctx.save();
    const polygons = [
        [
            { x: chart.scales.x.getPixelForValue(getX(70,10)), y: chart.scales.y.getPixelForValue(getY(70,10)) },
            { x: chart.scales.x.getPixelForValue(getX(70,15)), y: chart.scales.y.getPixelForValue(getY(70,15)) },
            { x: chart.scales.x.getPixelForValue(getX(45,40)), y: chart.scales.y.getPixelForValue(getY(45,40)) },
            { x: chart.scales.x.getPixelForValue(getX(45,20)), y: chart.scales.y.getPixelForValue(getY(45,20)) },
            { x: chart.scales.x.getPixelForValue(getX(55,10)), y: chart.scales.y.getPixelForValue(getY(55,10)) },
        ],
        [
            { x: chart.scales.x.getPixelForValue(getX(45,40)), y: chart.scales.y.getPixelForValue(getY(45,40)) },
            { x: chart.scales.x.getPixelForValue(getX(40,45)), y: chart.scales.y.getPixelForValue(getY(40,45)) },
            { x: chart.scales.x.getPixelForValue(getX(15,45)), y: chart.scales.y.getPixelForValue(getY(15,45)) },
            { x: chart.scales.x.getPixelForValue(getX(15,25)), y: chart.scales.y.getPixelForValue(getY(15,25)) },
            { x: chart.scales.x.getPixelForValue(getX(20,20)), y: chart.scales.y.getPixelForValue(getY(20,20)) },
            { x: chart.scales.x.getPixelForValue(getX(45,20)), y: chart.scales.y.getPixelForValue(getY(45,20)) },
        ]
    ];

    polygons.forEach((points, index) => {
        ctx.fillStyle = colors[index];
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.closePath();
        ctx.fill();
    });

    ctx.restore();
  }
};

const lines = {};

const labels = {};

const healImage = new Image();

const sustainImage = new Image();

const healthImage = new Image();

function getX(Heal, Sustain){
    return Sustain + 0.5 * Heal;
}
function getY(Heal,WP){
    return Heal;
}

function createLine(type, percent) {
    if (type == 'heal'){
        return {
            type: 'line',
            xMin: getX(percent, 0),
            yMin: getY(percent, 0),
            xMax: getX(percent, 100-percent),
            yMax: getY(percent, 100-percent),
            borderWidth: 0.5,
            color: 'lightgray'
        };
    }else if (type == 'sustain'){
        return {
            type: 'line',
            xMin: getX(100-percent, percent),
            yMin: getY(100-percent, percent),
            xMax: getX(0, percent),
            yMax: getY(0, percent),
            borderWidth: 0.5,
            color: 'lightgray'
        };
    }else if (type == 'health'){
        return {
            type: 'line',
            xMin: getX(0, percent),
            yMin: getY(0, percent),
            xMax: getX(percent, 0),
            yMax: getY(percent, 0),
            borderWidth: 0.5,
            color: 'lightgray'
        };
    }

}

function createLabel(type, percent){
    if (type== 'heal'){
        return{
            type: 'label',
            xValue: getX(percent,-3), 
            yValue: getY(percent,-3), 
            content: `${percent}`,
            color: 'lightgray'
        }
    }else if (type == 'sustain'){
        return {
            type: 'label',
            xValue: getX(103-percent, percent),
            yValue: getY(103-percent, percent),
            content: `${percent}`,
            color: 'lightgray',
            rotation: -57.2957795 // TODO: decide whether to rotate this or keep it level
        };
    }else if (type == 'health'){
        return {
            type: 'label',
            xValue: getX(-3, 103- percent),
            yValue: getY(-3, 103- percent),
            content: `${percent}`,
            color: 'lightgray',
            rotation: 57.2957795 // TODO: decide whether to rotate this or keep it level
        };
    }
}

function getPosition(attributes){
    let sum = attributes[0]
            + attributes[2]
            + attributes[3]
            + attributes[5];

    let Heal= 100*(attributes[2])/sum;
    let Sustain= 100*(attributes[3]+attributes[5])/sum;

    return [Heal, Sustain];
}

function rgbaToRgb(rgba) {
    return rgba.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*\d*\.?\d*\)/, 'rgb($1, $2, $3)');
}

for (let i = 10; i <= 100; i += 10) {
    lines[`Heal${i}`] = createLine('heal',i);
    labels[`HealLabel${i}`] = createLabel('heal',i);

    lines[`Sustain${i}`] = createLine('sustain',i);
    labels[`SustainLabel${i}`] = createLabel('sustain',i);

    lines[`Health${i}`] = createLine('health',i);
    labels[`HealthLabel${i}`] = createLabel('health',i);
}

async function loadCrune() {
    let crune = [];
    try {
        const response = await fetch("../json/cruneHolders.json");
        const data = await response.json();
        crune.push(...data);
        console.log("Pets after fetch:", crune); // Ensure pets are populated
    } catch (error) {
        console.error("Error loading pets:", error);
    }
    return crune;
}

export async function initializeTriangle2(){
    
    const ctx2 = document.getElementById('2myChart');
    const overlayCtx2 = document.getElementById("2overlayCanvas");
    const areaCtx2 = document.getElementById("2areaCanvas");
    const labelCtx2 = document.getElementById("2labelCanvas");

    const petButton2 = document.getElementById("2petButton");
    const areaButton2 = document.getElementById("2areaButton");

    const crune = [];

    const imagePlugin2 = {
        id: 'imagePlugin2',
        afterDatasetsDraw(chart, args) {
            const ctx = overlayCtx2.getContext("2d");

            const defaultWidth = 22;
            const defaultHeight = 22;
            
            chart.data.datasets.forEach(dataset => {
                if (!dataset.data) return;
                dataset.data.forEach(dataPoint => {
                    if (dataPoint.img && dataPoint.drawn=="false") {
                        const x = chart.scales.x.getPixelForValue(dataPoint.x);
                        const y = chart.scales.y.getPixelForValue(dataPoint.y);

                        let image = new Image();
                        image.src = dataPoint.img;

                        if (image.complete) {
                            ctx.drawImage(
                                image,
                                x - defaultWidth / 2,
                                y - defaultWidth / 2,
                                defaultWidth,
                                defaultHeight
                            );
                            dataPoint.drawn = "true";
                        }else {
                            image.onload = () => {
                                chart.draw();
                            };
                        }
                    }
                });        
            });
        }
    };
    
    const externalTooltipHandler = (context) => {
        const { chart, tooltip } = context;
        let tooltipEl = document.getElementById('chartjs-tooltip');
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.style.background = '#222222';
            tooltipEl.style.color = 'white';
            tooltipEl.style.borderRadius = '3px';
            tooltipEl.style.padding = '8px';
            tooltipEl.style.transition = 'all .1s ease';
            tooltipEl.style.pointerEvents = 'none';
            document.body.appendChild(tooltipEl);
        }

        if (tooltip.opacity === 0 || overlayCtx2.style.opacity == 0) {
            tooltipEl.style.opacity = 0;
            return;
        }

        let innerHTML = `<div>`;
        tooltip.dataPoints?.forEach(dataPoint => {
            const imageUrl= [
                "./media/owo_images/HP.png",
                "./media/owo_images/STR.png",
                "./media/owo_images/PR.png",
                "./media/owo_images/WP.png",
                "./media/owo_images/MAG.png",
                "./media/owo_images/MR.png",
            ]; 


            innerHTML +=`<div style="margin-bottom: 0.1rem;"> ${dataPoint.raw.label}</div>`;
            innerHTML +=`<div style="display:flex;">`
            innerHTML +=`<div style="display:flex; gap:0.2rem; width:2.5rem;"> 
                            <img src="${imageUrl[0]}" alt="" style="width:1rem;height:1rem;margin-top:0.05rem;">
                            ${dataPoint.raw.attributes[0]}` + 
                        "</div>";
            innerHTML +=`<div style="display:flex; gap:0.2rem; width:2.5rem;"> 
                            <img src="${imageUrl[1]}" alt="" style="width:1rem;height:1rem;margin-top:0.05rem;">
                            ${dataPoint.raw.attributes[1]}` + 
                        "</div>";
            innerHTML +=`<div style="display:flex; gap:0.2rem; width:2.5rem;"> 
                            <img src="${imageUrl[2]}" alt="" style="width:1rem;height:1rem;margin-top:0.05rem;"> 
                            ${dataPoint.raw.attributes[2]}` + 
                        "</div>";
            innerHTML +=`</div> <div style="display:flex">`
            innerHTML +=`<div style="display:flex; gap:0.2rem; width:2.5rem;"> 
                            <img src="${imageUrl[3]}" alt="" style="width:1rem;height:1rem;margin-top:0.05rem;">
                            ${dataPoint.raw.attributes[3]}` + 
                        "</div>";
            innerHTML +=`<div style="display:flex; gap:0.2rem; width:2.5rem;"> 
                            <img src="${imageUrl[4]}" alt="" style="width:1rem;height:1rem;margin-top:0.05rem;">
                            ${dataPoint.raw.attributes[4]}` + 
                        "</div>";
            innerHTML +=`<div style="display:flex; gap:0.2rem; width:2.5rem;"> 
                            <img src="${imageUrl[5]}" alt="" style="width:1rem;height:1rem;margin-top:0.05rem;">
                            ${dataPoint.raw.attributes[5]}` + 
                        "</div>";
            innerHTML += `</div>`

        });
        innerHTML += `</div>`;

        tooltipEl.innerHTML = innerHTML;

        const canvasRect = chart.canvas.getBoundingClientRect();
        tooltipEl.style.opacity = 1;
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.left = canvasRect.left + window.pageXOffset + tooltip.caretX + 'px';
        tooltipEl.style.top = canvasRect.top + window.pageYOffset + tooltip.caretY + 'px';
    };
    
    petButton2.addEventListener('click', async function() {
        if ( overlayCtx2.style.opacity== 1 ){
            overlayCtx2.style.opacity = 0;
            labelCtx2.style.opacity= areaCtx2.style.opacity== 1? 1: 0;
        }else{
            overlayCtx2.style.opacity = 1;
            labelCtx2.style.opacity = 0;
        }
    });

    areaButton2.addEventListener('click', async function() {
        if ( areaCtx2.style.opacity == 1){
            areaCtx2.style.opacity =0;
            labelCtx2.style.opacity = 0;
        }else {
            areaCtx2.style.opacity =1;
            labelCtx2.style.opacity= overlayCtx2.style.opacity == 0? 1:0;
        }
    });

    const newCrune = await loadCrune(); 
    crune.push(...newCrune);

    healImage.src= '../media/owo_images/PR.png';

    mergeImages([
    { src: '../media/owo_images/WP.png'},
    { src: '../media/owo_images/MR.png', x:128}
    ],{width: 256,height:128}
    )
    .then(b64 => sustainImage.src= b64);

    healthImage.src = '../media/owo_images/HP.png'

    Chart.register(window['chartjs-plugin-annotation']);
    //Chart.register(imagePlugin2);
    
    new Chart(ctx2, {
        type: 'scatter',
        plugins: 
            [
                trianglePlugin,
                imagePlugin2
            ],
            
        data: {
            datasets: [{
                label: 'Pet Stats',
                data: 
                    crune.map(cruneHolder => ({
                        x: getX(...getPosition(cruneHolder.attributes)),
                        y: getY(...getPosition(cruneHolder.attributes)),
                        label: cruneHolder.name,
                        img: cruneHolder.image,
                        attributes: cruneHolder.attributes,
                        drawn: "false"
                    })),
                pointStyle: false,
                pointRadius: 10,
                pointHoverRadius: 15,
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
                        HealLabel: {
                            type: 'label',
                            content: '% of stats in Healing',
                            xValue: getX(51,-10), 
                            yValue: getY(51,-10), 
                            rotation: -57.2957795, 
                            color: 'lightgray',
                            font: {
                                size: 16,
                            }
                        },HealImage: {
                            type: 'label',
                            content: healImage,
                            width: 20,
                            height: 20,
                            xValue: getX(70,-9.5),
                            yValue: getY(70,-9.5),
                            rotation: -57.2957795, 
                        },SustainLabel: {
                            type: 'label',
                            content: '% of stats in Sustain',
                            xValue: getX(60,50), 
                            yValue: getY(60,50), 
                            rotation: 57.2957795, 
                            color: 'lightgray',
                            font: {
                                size: 16,
                            }
                        },SustainImage: {
                            type: 'label',
                            content: sustainImage,
                            width: 40,
                            height: 20,
                            xValue: getX(39,71.3), 
                            yValue: getY(39,71.3), 
                            rotation: 57.2957795,  
                        },HealthLabel: {
                            type: 'label',
                            content: '% of stats in Health',
                            xValue: getX(-10,52), 
                            yValue: getY(-10,52), 
                            color: 'lightgray',
                            font: {
                                size: 16,
                            }
                        },HealthImage: {
                            type: 'label',
                            content: healthImage,
                            width: 20,
                            height: 20,
                            xValue: getX(-9.8,69), 
                            yValue: getY(-9.8,69)
                        }      
                        
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

    new Chart(overlayCtx2, {
        type: 'scatter',
        options: {
            plugins: {
                tooltip: {
                    enabled: false,           // Disable the default tooltip
                    animation: false, 
                },
                legend: {
                    display: false
                },
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

    new Chart(areaCtx2, {
        type: 'scatter',
        plugins:
            [polygonPlugin],
        options: {
            plugins: {
                tooltip: {
                    enabled: false,           // Disable the default tooltip
                    animation: false, 
                },
                legend: {
                    display: false
                },
                annotation: {
                    clip: false,
                    annotations: {

                    }
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

    
    new Chart(labelCtx2, {
        type: 'scatter',
        options: {
            plugins: {
                tooltip: {
                    enabled: false,           // Disable the default tooltip
                    animation: false, 
                },
                legend: {
                    display: false
                },
                annotation: {
                    clip: false,
                    annotations: {
                        SheieldedLabel: {
                            type: 'label',
                            content: 'shielded',
                            xValue: getX(55,20), 
                            yValue: getY(55,20), 
                            color: rgbaToRgb(colors[0]),
                            font: {
                                size: 16,
                                weight:"bold"
                            }
                        },NoShieldLabel: {
                            type: 'label',
                            content: 'non-shielded',
                            xValue: getX(30,32.5), 
                            yValue: getY(30,32.5), 
                            color: rgbaToRgb(colors[1]),
                            font: {
                                size: 16,
                                weight:"bold"
                            }
                        }
                    }
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

}