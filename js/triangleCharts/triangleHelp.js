import { getX, getY } from "./triangleUtil.js";
import * as pluginHandler from "./trianglePlugins.js"
import { make } from "../util/injectionUtil.js";

const cursorLinePlugin = {
    enabled: true,

    toggle(override) {
        this.enabled = override || !this.enabled;
    },

    afterEvent: (chart, args) => {
        const event = args.event;
        chart._cursorPosition = { x: event.x, y: event.y };
    },

    beforeInit(chart) {
        const container = chart.canvas.parentNode;

        this.healLabel = make('div',{className: 'triangle-help-label'});
        this.sustainLabel = make('div',{className: 'triangle-help-label right'});
        this.healthLabel = make('div',{className: 'triangle-help-label bottom'});

        container.append(this.healLabel, this.sustainLabel, this.healthLabel);
    },

    afterDraw(chart) {
        const ctx = chart.ctx;
        
        if (!chart._cursorPosition || this.enabled === false) return;

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

            this.healLabel.innerHTML = `${Heal.toFixed(0)}%`;
            this.healLabel.style.left = canvasRect.left + window.pageXOffset + getPixelForX(x, getX(Heal,0)) - 37 + 'px';
            this.healLabel.style.top = canvasRect.top + window.pageYOffset + getPixelForY(y, getY(Heal,0)) - 10+  'px';
            this.healLabel.style.visibility = "visible";

            this.sustainLabel.innerHTML = `${Sustain.toFixed(0)}%`;
            this.sustainLabel.style.left = canvasRect.left + window.pageXOffset + getPixelForX(x, getX(100-Sustain,Sustain)) -5 + 'px';
            this.sustainLabel.style.top = canvasRect.top + window.pageYOffset + getPixelForY(y, getY(100-Sustain,Sustain)) - 30+ 'px';
            this.sustainLabel.style.visibility = "visible";

            this.healthLabel.innerHTML = `${Health.toFixed(0)}%`;
            this.healthLabel.style.left = canvasRect.left + window.pageXOffset + getPixelForX(x, getX(0,100-Health)) + 'px';
            this.healthLabel.style.top = canvasRect.top + window.pageYOffset + getPixelForY(y, getY(0,100-Health)) + 10+ 'px';
            this.healthLabel.style.visibility = "visible";
        }
        else{
            this.healLabel.style.visibility = "hidden";
            this.sustainLabel.style.visibility = "hidden";
            this.healthLabel.style.visibility = "hidden";
        }
    },

    beforeDestroy(){
        this.healLabel.remove();
        this.sustainLabel.remove();
        this.healthLabel.remove();
    }
};

function getPixelForY(scale, data){
    return scale.bottom - (data - scale.min) * (scale.height / (scale.max - scale.min));
}

function getPixelForX(scale,data){
    return scale.left + (data - scale.min) * (scale.width / (scale.max - scale.min));
}

function reverseXY(x,y){
    let Heal= y;
    let Sustain= x -0.5 * Heal;
    let Health=100-Heal-Sustain;
    return {Heal, Sustain, Health};
}

document.addEventListener("DOMContentLoaded", async function () {    
    const ctx = document.getElementById('myChart');

    const myChart = new Chart(ctx, {
        type: 'scatter',
        plugins: [cursorLinePlugin, pluginHandler.triangleBasePluginFactory()],
        options: {
            layout: {padding: {left:60,right:60,top:48,bottom:48}},
            plugins: {
                tooltip: {mode: 'nearest',enabled: false,animation: false},
                legend: {display: false},
                annotation: {clip: false}
            },
            scales: {
                x: { display: false, min: 0, max: 100 },
                y: { display: false, min: 0, max: 100,}
            }
        },
    });
    ctx.addEventListener('mousemove', () => {
        myChart.update();
    });
});