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

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)'; // Light overlay
        ctx.fill();
        ctx.restore();
    }
};

//const { annotationPlugin } = Chart.plugins.get('annotation');
document.addEventListener("DOMContentLoaded", function () {

    //Chart.register(ChartAnnotation);
    Chart.register(window['chartjs-plugin-annotation']);
    console.log(Chart.registry.plugins.items); 
    //console.log(Object.keys(Chart));

    //console.log(window.ChartAnnotation);
    //console.log(window.annotationPlugin);


    new Chart(ctx, {
        type: 'scatter',
        plugins: 
            [trianglePlugin],
        data: {
            datasets: [{
                label: 'Soil Composition',
                data: [
                    { x: 20, y: 80 }, // Example data point (Sand 20%, Clay 80%)
                    { x: 50, y: 30 }, // Example (Sand 50%, Clay 30%)
                    { x: 70, y: 10 }  // Example (Sand 70%, Clay 10%)
                ],
                backgroundColor: 'red'
            }]
        },
        options: {
            plugins: {
                annotation: {
                    annotations: {
                        clayLabel: {
                            type: 'label',
                            content: 'Clay (%)',
                            xValue: 20, // Adjust position
                            yValue: 50, // Adjust position
                            rotation: -45, // Rotate along triangle edge
                            font: {
                                size: 14,
                            }
                        }    
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Sand (%)'
                    },
                    min: 0,
                    max: 100,
                    grid: {
                        drawOnChartArea: false // Hides square gridlines
                    }
                },
                y: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Clay (%)'
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