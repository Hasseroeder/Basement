const ctx = document.getElementById('myChart');
const overlayCtx = document.getElementById("overlayCanvas");
const areaCtx = document.getElementById("areaCanvas");
const labelCtx = document.getElementById("labelCanvas");

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

const cursorLinePlugin = {
  id: 'cursorLinePlugin',

  afterEvent: (chart, args) => {
    const event = args.event;

    // When the mouse leaves the chart area, clear the stored position.
    if (event.type === 'mouseout') {
      chart._cursorPosition = null;
    }
    // When the mouse moves, capture the new position.
    else if (event.type === 'mousemove') {
      chart._cursorPosition = {
        x: event.offsetX,
        y: event.offsetY
      };
    }
  },

  afterDraw: (chart, args, options) => {
    const ctx = chart.ctx;
    
    // Only draw the line if we have a valid cursor position and a defined pointB.
    if (!chart._cursorPosition || !options.pointB) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    // Move to current cursor position:
    ctx.moveTo(chart._cursorPosition.x, chart._cursorPosition.y);
    // Draw line to pointB (provided via plugin options):
    ctx.lineTo(options.pointB.x, options.pointB.y);
    ctx.lineWidth = options.lineWidth || 2;
    ctx.strokeStyle = options.lineColor || 'rgba(0, 0, 0, 0.5)';
    
    // If a dashed style is wanted, you can configure it (example: [5, 5]).
    if (options.lineDash && Array.isArray(options.lineDash)) {
      ctx.setLineDash(options.lineDash);
    }
    
    ctx.stroke();
    ctx.restore();
  }
};

const lines = {};

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

function getPosition(attributes){
    let sum = attributes[0]
            + attributes[2]
            + attributes[3]
            + attributes[5];

    let Heal= 100*(attributes[2])/sum;
    let Sustain= 100*(attributes[3]+attributes[5])/sum;

    return [Heal, Sustain];
}


for (let i = 10; i <= 100; i += 10) {
    lines[`Power${i}`] = createLine('power',i);
    lines[`WP${i}`] = createLine('wp',i);
    lines[`Tank${i}`] = createLine('tank',i);
}

Chart.register(cursorLinePlugin);

document.addEventListener("DOMContentLoaded", async function () {    

    healImage.src= '../media/owo_images/PR.png';

    mergeImages([
    { src: '../media/owo_images/WP.png'},
    { src: '../media/owo_images/MR.png', x:128}
    ],{width: 256,height:128}
    )
    .then(b64 => sustainImage.src= b64);

    healthImage.src = '../media/owo_images/HP.png'

    Chart.register(window['chartjs-plugin-annotation']);

    new Chart(ctx, {
        type: 'scatter',
        plugins: [
            trianglePlugin
        ],
        data: {
        },
        options: {
            cursorLinePlugin: {
                pointB: { x: 150, y: 50 },   // Set your fixed point B coordinates (adjust as needed)
                lineColor: 'red',           // Customize the line color
                lineWidth: 3,               // Customize the line width
                lineDash: [5, 5]            // Example: Dashed line of 5px dash, 5px gap
            },

            layout: {
                padding: {
                    left: 60,
                    right: 60,
                    top: 48,
                    bottom: 48
                }
            },
            plugins: {
                cursorLine: true, 
                tooltip: {
                    mode: 'nearest',
                    enabled: false,          
                    animation: false, 
                },
                legend: {
                    display: false
                },
                annotation: {
                    clip: false,
                    annotations: {
                        ...lines,
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

});