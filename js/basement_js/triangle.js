//import { Chart } from 'chart.js';
//import annotationPlugin from 'chartjs-plugin-annotation';
//import Chart from 'chart.js/auto';
//import annotationPlugin from 'chartjs-plugin-annotation';


const ctx = document.getElementById('myChart');
const trianglePlugin = {
    id: 'triangleOverlay',
    beforeDraw(chart) {
        const { ctx, chartArea: { left, top, right, bottom } } = chart;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(left, bottom);  // Bottom left (Sand 100%, Clay 0%)
        ctx.lineTo(right, bottom); // Bottom right (Sand 0%, Clay 0%)
        ctx.lineTo(left + (right - left) / 2, top); // Top middle (Sand 0%, Clay 100%)
        ctx.closePath();

        ctx.strokeStyle = 'lightgray';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.fillStyle = 'rgba(200, 200, 200, 0.0)'; // Light overlay
        ctx.fill();
        ctx.restore();
    }
};
const lines = {};
const labels = {};

const pets = []

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

    console.log("WP is:" + Wp +". And Power is:" + Power);

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

window.getPets = function(){
    return pets;
}

pets.push({
    image: "spider.gif",
    name: "Spider",
    attributes: [0, 19, 0, 1, 0, 0]
});

document.addEventListener("DOMContentLoaded", function () {

    Chart.register(window['chartjs-plugin-annotation']);
    console.log(Chart.registry.plugins.items); 



    new Chart(ctx, {
        type: 'scatter',
        plugins: 
            [trianglePlugin],
        data: {
            datasets: [{
                label: 'Pet Stats',
                data: [
                    { x: getX(...getPosition(pets[0].attributes)), y: getY(...getPosition(pets[0].attributes)), label: pets[0].name },  
                ],
                //pointStyle: pointImages,
                pointRadius: 20,
                pointHoverRadius: 25,
            }]
        },
        options: {
            maintainAspectRatio: true,  // Ensures the aspect ratio is preserved
            aspectRatio: 2,  
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
                    callbacks: {
                        label: function(context) {
                            // You can include any text you want here.
                            return context.raw.label;
                        }
                    }
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
                            xValue: getX(50,-10), 
                            yValue: getY(50,-10), 
                            rotation: -57.2957795, 
                            color: 'lightgray',
                            font: {
                                size: 18,
                            }
                        },WPLabel: {
                            type: 'label',
                            content: '% of stats in WP',
                            xValue: getX(50,60), 
                            yValue: getY(50,60), 
                            rotation: 57.2957795, 
                            color: 'lightgray',
                            font: {
                                size: 18,
                            }
                        },TankLabel: {
                            type: 'label',
                            content: '% of stats in Tanking',
                            xValue: getX(-10,55), 
                            yValue: getY(-10,55), 
                            color: 'lightgray',
                            font: {
                                size: 18,
                            }
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
        }
    });
});