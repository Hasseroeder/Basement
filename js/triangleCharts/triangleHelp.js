import { getX, getY, getLinesAndLabels } from "./triangleUtil.js";

const ctx = document.getElementById('myChart');

const HealLabel = document.getElementById('healLabel');
const SustainLabel = document.getElementById('sustainLabel');
const HealthLabel = document.getElementById('healthLabel');

const cursorLinePlugin = {
    id: 'cursorLinePlugin',

    afterEvent: (chart, args) => {
        const event = args.event;
        if (event.type === 'mousemove') {
            chart._cursorPosition = {
                x: event.x,
                y: event.y
            };
        }
    },

    afterDraw: (chart) => {
        const ctx = chart.ctx;
        
        if (!chart._cursorPosition) {
            return;
        }

        const {x,y} = chart.scales;

        const canvasRect = chart.canvas.getBoundingClientRect();

        const dataX = x.getValueForPixel(chart._cursorPosition.x);
        const dataY = y.getValueForPixel(chart._cursorPosition.y);

        const { Heal, Sustain, Health } = reverseXY(dataX, dataY);

        const SustainX = getPixelForX(x, getX(100-Sustain,Sustain));
        const SustainY = getPixelForY(y, getY(100-Sustain,Sustain));
        const HealX = getPixelForX(x, getX(Heal,0));
        const HealY = getPixelForY(y, getY(Heal,0));
        const HealthX = getPixelForX(x, getX(0,100-Health));
        const HealthY = getPixelForY(y, getY(0,100-Health));

        if (
            Heal >= 0 &&
            Sustain >= 0 &&
            Health >= 0
        ){
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(chart._cursorPosition.x, chart._cursorPosition.y);
            ctx.lineTo(SustainX,SustainY);
            ctx.moveTo(chart._cursorPosition.x, chart._cursorPosition.y);
            ctx.lineTo(HealX,HealY);
            ctx.moveTo(chart._cursorPosition.x, chart._cursorPosition.y);
            ctx.lineTo(HealthX,HealthY);
            ctx.moveTo(chart._cursorPosition.x, chart._cursorPosition.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'gray';
            ctx.stroke();
            ctx.restore();

            HealLabel.innerHTML = `${Heal.toFixed(0)}%`;
            HealLabel.style.left = canvasRect.left + window.pageXOffset + getPixelForX(x, getX(Heal,0)) - 37 + 'px';
            HealLabel.style.top = canvasRect.top + window.pageYOffset + getPixelForY(y, getY(Heal,0)) - 10+  'px';

            SustainLabel.innerHTML = `${Sustain.toFixed(0)}%`;
            SustainLabel.style.left = canvasRect.left + window.pageXOffset + getPixelForX(x, getX(100-Sustain,Sustain)) -5 + 'px';
            SustainLabel.style.top = canvasRect.top + window.pageYOffset + getPixelForY(y, getY(100-Sustain,Sustain)) - 30+ 'px';

            HealthLabel.innerHTML = `${Health.toFixed(0)}%`;
            HealthLabel.style.left = canvasRect.left + window.pageXOffset + getPixelForX(x, getX(0,100-Health)) + 'px';
            HealthLabel.style.top = canvasRect.top + window.pageYOffset + getPixelForY(y, getY(0,100-Health)) + 10+ 'px';
        }
    }
};

function getPixelForY(scale, data){
    return scale.bottom - (data - scale.min) * (scale.height / (scale.max - scale.min));
}

function getPixelForX(scale,data){
    return scale.left + (data - scale.min) * (scale.width / (scale.max - scale.min));
}

const {lines} = await getLinesAndLabels();

function reverseXY(x,y){
    let Heal= y;
    let Sustain= x -0.5 * Heal;
    let Health=100-Heal-Sustain;
    return {Heal, Sustain, Health};
}

document.addEventListener("DOMContentLoaded", async function () {    
    const myChart = new Chart(ctx, {
        type: 'scatter',
        plugins: [cursorLinePlugin],
        options: {
            layout: {padding: {left:60,right:60,top:48,bottom:48}},
            plugins: {
                cursorLine: true, 
                tooltip: {mode: 'nearest',enabled: false,animation: false,},
                legend: {display: false},
                annotation: {clip: false, annotations: {...lines}}
            },
            scales: {
                x: {
                    display: false, type: 'linear',
                    title: {display: false},
                    min: 0, max: 100,
                    grid: {drawOnChartArea: false}
                },
                y: {
                    display: false, type: 'linear',
                    title: {display: false},
                    min: 0, max: 100,
                    grid: {drawOnChartArea: false}
                }
            }
        },
    });
    ctx.addEventListener('mousemove', () => {
        myChart.update();
    });
});