const ctx = document.getElementById('myChart');
const overlayCtx = document.getElementById("overlayCanvas");
const areaCtx = document.getElementById("areaCanvas");

const petButton = document.getElementById("petButton");
const areaButton = document.getElementById("areaButton");

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

const polygonPlugin = {
  id: 'polygonHighlight',
  afterDraw: (chart) => {
    const ctx = chart.ctx;
    ctx.save();

    const polygons = [
        [
            { x: chart.scales.x.getPixelForValue(getX(100,0)), y: chart.scales.y.getPixelForValue(getY(100,0)) },
            { x: chart.scales.x.getPixelForValue(getX(50,50)), y: chart.scales.y.getPixelForValue(getY(50,50)) },
            { x: chart.scales.x.getPixelForValue(getX(40,50)), y: chart.scales.y.getPixelForValue(getY(40,50)) },
            { x: chart.scales.x.getPixelForValue(getX(90,0)), y: chart.scales.y.getPixelForValue(getY(90,0)) },
        ]
    ];

    const colors = [
        "rgba(78, 255, 34, 0.05)",


    ]

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


const externalTooltipHandler = (context) => {
  const { chart, tooltip } = context;
  // Look for existing tooltip element in the DOM
  let tooltipEl = document.getElementById('chartjs-tooltip');
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chartjs-tooltip';
    // Basic styling for the tooltip container:
    tooltipEl.style.background = '#222222';
    tooltipEl.style.color = 'white';
    tooltipEl.style.borderRadius = '3px';
    tooltipEl.style.padding = '8px';
    tooltipEl.style.transition = 'all .1s ease';
    tooltipEl.style.pointerEvents = 'none';
    document.body.appendChild(tooltipEl);
  }

  if (tooltip.opacity === 0 || overlayCtx.style.opacity == 0) {
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


const imagePlugin = {
  id: 'imagePlugin',
  afterDatasetsDraw(chart, args, pluginOptions) {
    const overlayCanvas = document.getElementById("overlayCanvas");
    const ctx = overlayCanvas.getContext("2d");

    const defaultWidth = pluginOptions.width || 20;
    const defaultHeight = pluginOptions.height || 20;
    
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

const lines = {};

const labels = {};

const pets = []

const powerImage = new Image();

const tankImage = new Image();

const wpImage = new Image();

function getX(Power, WP){
    return WP + 0.5 * Power;
}
function getY(Power,WP){
    return Power;
}



function createLine(type, percent) {
    if (type == 'power'){
        return {
            type: 'line',
            xMin: getX(percent, 0),
            yMin: getY(percent, 0),
            xMax: getX(percent, 100-percent),
            yMax: getY(percent, 100-percent),
            borderWidth: 0.5,
            color: 'lightgray'
        };
    }else if (type == 'wp'){
        return {
            type: 'line',
            xMin: getX(100-percent, percent),
            yMin: getY(100-percent, percent),
            xMax: getX(0, percent),
            yMax: getY(0, percent),
            borderWidth: 0.5,
            color: 'lightgray'
        };
    }else if (type == 'tank'){
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
    if (type== 'power'){
        return{
            type: 'label',
            xValue: getX(percent,-3.5), 
            yValue: getY(percent,-3.5), 
            content: `${percent}%`,
            color: 'lightgray'
        }
    }else if (type == 'wp'){
        return {
            type: 'label',
            xValue: getX(100-percent, percent+3.5),
            yValue: getY(100-percent, percent+3.5),
            content: `${percent}%`,
            color: 'lightgray'
        };
    }else if (type == 'tank'){
        return {
            type: 'label',
            xValue: getX(-3, 100- percent),
            yValue: getY(-3, 100- percent),
            content: `${percent}%`,
            color: 'lightgray'
        };
    }
}

function getPosition(attributes){
    let sum = attributes.reduce((acc, num) => acc + num, 0);

    let Wp= 100*(attributes[3])/sum;
    let Power= 100*(attributes[1]+attributes[4])/sum;

    return [Power, Wp];
}


for (let i = 10; i <= 100; i += 10) {
    lines[`Power${i}`] = createLine('power',i);
    labels[`PowerLabel${i}`] = createLabel('power',i);

    lines[`WP${i}`] = createLine('wp',i);
    labels[`WPLabel${i}`] = createLabel('wp',i);

    lines[`Tank${i}`] = createLine('tank',i);
    labels[`TankLabel${i}`] = createLabel('tank',i);
}

petButton.addEventListener('click', async function() {
    overlayCtx.style.opacity= overlayCtx.style.opacity== 1 ? 0 : 1;
});

areaButton.addEventListener('click', async function() {
    areaCtx.style.opacity= areaCtx.style.opacity== 1 ? 0 : 1;
});

async function loadPets() {
    try {
        const response = await fetch("../json/pets.json");
        const data = await response.json();
        pets.push(...data);
        console.log("Pets after fetch:", pets); // Ensure pets are populated
    } catch (error) {
        console.error("Error loading pets:", error);
    }
}

document.addEventListener("DOMContentLoaded", async function () {    

    await loadPets();

    mergeImages([
    { src: '../media/owo_images/STR.png'},
    { src: '../media/owo_images/MAG.png', x:128}
    ],{width: 256,height:128}
    )
    .then(b64 => powerImage.src= b64);

    wpImage.src = '../media/owo_images/WP.png';

    mergeImages([
    { src: '../media/owo_images/HP.png'},
    { src: '../media/owo_images/PR.png', x:128},
    { src: '../media/owo_images/MR.png', x:256}
    ],{width: 384,height:128}
    )
    .then(b64 => tankImage.src= b64);

    Chart.register(window['chartjs-plugin-annotation']);
    Chart.register(imagePlugin);
    
    new Chart(ctx, {
        type: 'scatter',
        plugins: 
            [trianglePlugin],
        data: {
            datasets: [{
                label: 'Pet Stats',
                data: 
                    pets.map(pet => ({
                        x: getX(...getPosition(pet.attributes)),
                        y: getY(...getPosition(pet.attributes)),
                        label: pet.name,
                        img: pet.image,
                        attributes: pet.attributes,
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
                        PowerLabel: {
                            type: 'label',
                            content: '% of stats in Power',
                            xValue: getX(49,-10), 
                            yValue: getY(49,-10), 
                            rotation: -57.2957795, 
                            color: 'lightgray',
                            font: {
                                size: 16,
                            }
                        },PowerImage: {
                            type: 'label',
                            content: powerImage,
                            width: 40,
                            height: 20,
                            xValue: getX(70,-10),
                            yValue: getY(70,-10),
                            rotation: -57.2957795, 
                        },WPLabel: {
                            type: 'label',
                            content: '% of stats in WP',
                            xValue: getX(55,55), 
                            yValue: getY(55,55), 
                            rotation: 57.2957795, 
                            color: 'lightgray',
                            font: {
                                size: 16,
                            }
                        },WPImage: {
                            type: 'label',
                            content: wpImage,
                            width: 20,
                            height: 20,
                            xValue: getX(39.3,71), 
                            yValue: getY(39.3,71), 
                            rotation: 57.2957795,  
                        },TankLabel: {
                            type: 'label',
                            content: '% of stats in Tanking',
                            xValue: getX(-10,47), 
                            yValue: getY(-10,47), 
                            color: 'lightgray',
                            font: {
                                size: 16,
                            }
                        },TankImage: {
                            type: 'label',
                            content: tankImage,
                            width: 60,
                            height: 20,
                            xValue: getX(-10,69.5), 
                            yValue: getY(-10,69.5)
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

    new Chart(overlayCtx, {
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

    new Chart(areaCtx, {
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

});