const ctx = document.getElementById('myChart');

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

  beforeInit: (chart) => {
        chart._cursorPosition = { x: 0, y: 0 }; // Initialize to avoid undefined errors
  },

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

    const xScale = chart.scales['x'];
    const yScale = chart.scales['y'];

    const canvasRect = chart.canvas.getBoundingClientRect();

    let dataX = xScale.getValueForPixel(chart._cursorPosition.x);
    let dataY = yScale.getValueForPixel(chart._cursorPosition.y);

    let Heal = reverseXY(dataX, dataY).Heal;
    let Sustain = reverseXY(dataX, dataY).Sustain;
    let Health = reverseXY(dataX, dataY).Health;

    let SustainX = getPixelForX(xScale, getX(100-Sustain,Sustain));
    let SustainY = getPixelForY(yScale, getY(100-Sustain,Sustain));
    let HealX = getPixelForX(xScale, getX(Heal,0));
    let HealY = getPixelForY(yScale, getY(Heal,0));
    let HealthX = getPixelForX(xScale, getX(0,100-Health));
    let HealthY = getPixelForY(yScale, getY(0,100-Health));

    let HealLabel = document.getElementById('healLabel');
    if (!HealLabel) {
        HealLabel = document.createElement('div');
        HealLabel.id = 'healLabel';
        HealLabel.style.pointerEvents = 'none';
        document.body.appendChild(HealLabel);
    }
    let SustainLabel = document.getElementById('sustainLabel');
    if (!SustainLabel) {
        SustainLabel = document.createElement('div');
        SustainLabel.id = 'sustainLabel';
        SustainLabel.style.pointerEvents = 'none';
        SustainLabel.style.transform = 'rotate(-57.2957795deg)';
        document.body.appendChild(SustainLabel);
    }
    let HealthLabel = document.getElementById('healthLabel');
    if (!HealthLabel) {
        HealthLabel = document.createElement('div');
        HealthLabel.id = 'healthLabel';
        HealthLabel.style.pointerEvents = 'none';
        HealthLabel.style.transform = 'rotate(57.2957795deg)';
        document.body.appendChild(HealthLabel);
    }


    
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

        HealLabel.innerHTML = `<div>${Heal.toFixed(0)}%</div>`;
        HealLabel.style.position = 'absolute';
        HealLabel.style.left = canvasRect.left + window.pageXOffset + getPixelForX(xScale, getX(Heal,0)) - 37 + 'px';
        HealLabel.style.top = canvasRect.top + window.pageYOffset + getPixelForY(yScale, getY(Heal,0)) - 10+  'px';

        SustainLabel.innerHTML = `<div>${Sustain.toFixed(0)}%</div>`;
        SustainLabel.style.position = 'absolute';
        SustainLabel.style.left = canvasRect.left + window.pageXOffset + getPixelForX(xScale, getX(100-Sustain,Sustain)) -5 + 'px';
        SustainLabel.style.top = canvasRect.top + window.pageYOffset + getPixelForY(yScale, getY(100-Sustain,Sustain)) - 30+ 'px';

        HealthLabel.innerHTML = `<div>${Health.toFixed(0)}%</div>`;
        HealthLabel.style.position = 'absolute';
        HealthLabel.style.left = canvasRect.left + window.pageXOffset + getPixelForX(xScale, getX(0,100-Health)) + 'px';
        HealthLabel.style.top = canvasRect.top + window.pageYOffset + getPixelForY(yScale, getY(0,100-Health)) + 10+ 'px';

    }
  }
};

function getPixelForY(scale, data){
    return scale.bottom - (data - scale.min) * (scale.height / (scale.max - scale.min));
}

function getPixelForX(scale,data){
    return scale.left + (data - scale.min) * (scale.width / (scale.max - scale.min));
}

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

function reverseXY(x,y){
    
    
    let Heal= y;
    let Sustain= x -0.5 * Heal;
    let Health=100-Heal-Sustain;

    return {Heal, Sustain, Health};

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


for (let i = 10; i < 100; i += 10) {
    lines[`Power${i}`] = createLine('power',i);
    lines[`WP${i}`] = createLine('wp',i);
    lines[`Tank${i}`] = createLine('tank',i);
}


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

    const myChart = new Chart(ctx, {
        type: 'scatter',
        plugins: [
            trianglePlugin,
            cursorLinePlugin
        ],
        data: {
        },
        options: {
            cursorLinePlugin: {
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
                    }
                }
            },
            scales: {
                x: {
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

    ctx.addEventListener('mousemove', () => {
        myChart.update();  // Forces the chart to rerender
    });


});