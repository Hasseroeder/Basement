import { Chart } from './node_modules/chart.js/auto';
import annotationPlugin from "../node_modules/chartjs-plugin-annotation/dist/chartjs-plugin-annotation.esm.js";


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

Chart.register(annotationPlugin);


new Chart(ctx, {
    type: 'scatter',
    plugins: 
        [trianglePlugin],
        annotation: {
            annotations: {
                clayLabel: {
                    type: 'label',
                    content: 'Clay (%)',
                    position: 'top',
                    xValue: 10, // Adjust position
                    yValue: 90, // Adjust position
                    rotation: -45, // Rotate along triangle edge
                    font: {
                        size: 14,
                        style: 'italic'
                    }
                }
            }
        },
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