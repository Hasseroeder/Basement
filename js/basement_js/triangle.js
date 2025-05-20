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

const imagePlugin = {
  id: 'imagePlugin',
  afterDatasetsDraw(chart, args, pluginOptions) {
    const ctx = chart.ctx;
    const defaultWidth = pluginOptions.width || 40;
    const defaultHeight = pluginOptions.height || 40;
    
    // Loop over all datasets (or adjust to target a specific one)
    chart.data.datasets.forEach(dataset => {
      if (!dataset.data) return;
      dataset.data.forEach(dataPoint => {
        if (dataPoint.img) {
          // Convert chart data values into pixel coordinates
          const x = chart.scales.x.getPixelForValue(dataPoint.x);
          const y = chart.scales.y.getPixelForValue(dataPoint.y);

          let image = new Image();
          image.src = dataPoint.img;

          // If the image is loaded, draw it immediately
          if (image.complete) {
            ctx.drawImage(
              image,
              x - defaultWidth / 2,
              y - defaultHeight / 2,
              defaultWidth,
              defaultHeight
            );
          } else {
            // If not loaded yet, trigger a redraw when it finishes loading.
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

  // Hide tooltip if there's no content to display
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  // Build custom HTML for the tooltip. Here we assume each tooltip data point should show an image along with the label and value.
  let innerHTML = `<div>`;
  tooltip.dataPoints?.forEach(dataPoint => {
    // Access the image from your data. We assume it is under dataPoint.raw.img.
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

  // Positioning the tooltip relative to the canvas
  const canvasRect = chart.canvas.getBoundingClientRect();
  tooltipEl.style.opacity = 1;
  tooltipEl.style.position = 'absolute';
  tooltipEl.style.left = canvasRect.left + window.pageXOffset + tooltip.caretX + 'px';
  tooltipEl.style.top = canvasRect.top + window.pageYOffset + tooltip.caretY + 'px';
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
    image: "../media/owo_images/spider.gif",
    name: "Spider",
    attributes: [0, 19, 0, 1, 0, 0]
});

pets.push({
    image: "../media/owo_images/camel.gif",
    name: "Camel",
    attributes: [1, 0, 0, 5, 14, 0]
});

pets.push({
    image: "../media/owo_images/shrimp.gif",
    name: "Shrimp",
    attributes: [0, 0, 0, 10, 10, 0]
});

pets.push({
    image: "../media/owo_images/panda.gif",
    name: "Panda",
    attributes: [1, 10, 0, 9, 0, 0]
});

pets.push({
    image: "../media/owo_images/fox.gif",
    name: "Fox",
    attributes: [4, 9, 1, 3, 1, 2]
});

pets.push({
    image: "../media/owo_images/slothbot.gif",
    name: "Slothbot",
    attributes: [9, 0, 2, 8, 0, 2]
});

pets.push({
    image: "../media/owo_images/lobbot.gif",
    name: "Lobbot",
    attributes: [14, 0, 3, 1, 0, 3]
});

pets.push({
    image: "../media/owo_images/dinobot.gif",
    name: "Dinobot",
    attributes: [13, 0, 2, 4, 0, 2]
});

pets.push({
    image: "../media/owo_images/may.gif",
    name: "May",
    attributes: [15, 1, 1, 1, 1, 1]
});

pets.push({
    image: "../media/owo_images/gorilla.gif",
    name: "Gorilla",
    attributes: [8, 7, 2, 1, 1, 2]
});

pets.push({
    image: "../media/owo_images/spoopy.gif",
    name: "Spoopy",
    attributes: [9, 6, 2, 1, 1, 2]
});

pets.push({
    image: "../media/owo_images/squid.gif",
    name: "Squid",
    attributes: [3, 1, 2, 6, 6, 2]
});

pets.push({
    image: "../media/owo_images/deer.gif",
    name: "Deer",
    attributes: [3, 1, 1, 3, 11, 1]
});

pets.push({
    image: "../media/owo_images/lion.gif",
    name: "Lion",
    attributes: [7, 7, 2, 1, 1, 2]
});

pets.push({
    image: "../media/owo_images/horsebot.gif",
    name: "Horsebot",
    attributes: [2, 1, 2, 8, 5, 2]
});

pets.push({
    image: "../media/owo_images/zebra.gif",
    name: "Zebra",
    attributes: [3, 1, 2, 8, 5, 2]
});

pets.push({
    image: "../media/owo_images/eagle.gif",
    name: "Eagle",
    attributes: [2, 13, 2, 1, 1, 2]
});

pets.push({
    image: "../media/owo_images/bitter.png",
    name: "Bitter",
    attributes: [1, 15, 1, 1, 1, 1]
});

pets.push({
    image: "../media/owo_images/vampire.gif",
    name: "Vampire",
    attributes: [2, 1, 1, 1, 14, 1]
});

pets.push({
    image: "../media/owo_images/pastel.gif",
    name: "Pastel",
    attributes: [11, 3, 3, 1, 1, 1]
});

pets.push({
    image: "../media/owo_images/snail.png",
    name: "Snail",
    attributes: [8, 1, 2, 3, 5, 1]
});

pets.push({
    image: "../media/owo_images/boar.gif",
    name: "Boar",
    attributes: [7, 5, 2, 4, 1, 2]
});

pets.push({
    image: "../media/owo_images/new_owo.png",
    name: "new_owo",
    attributes: [4, 1, 1, 4, 11, 1]
});

pets.push({
    image: "../media/owo_images/day.gif",
    name: "Day",
    attributes: [7, 1, 1, 9, 1, 1]
});

pets.push({
    image: "../media/owo_images/love.gif",
    name: "Love",
    attributes: [9, 1, 1, 7, 1, 1]
});


pets.push({
    image: "../media/owo_images/night.gif",
    name: "Night",
    attributes: [12, 1, 1, 5, 1, 1]
});

pets.push({
    image: "../media/owo_images/lovebunny.gif",
    name: "Lovebunny",
    attributes: [8, 1, 1, 8, 1, 1]
});

pets.push({
    image: "../media/owo_images/angelowo.gif",
    name: "Angelowo",
    attributes: [2, 1, 1, 7, 8, 1]
});



document.addEventListener("DOMContentLoaded", function () {

    Chart.register(window['chartjs-plugin-annotation']);
    Chart.register(imagePlugin);
    console.log(Chart.registry.plugins.items); 



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
                        attributes: pet.attributes
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
                imagePlugin: {
                    width: 20,   // Desired width of the static image
                    height: 20   // Desired height of the static image
                },
                tooltip: {
                    enabled: false,           // Disable the default tooltip
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