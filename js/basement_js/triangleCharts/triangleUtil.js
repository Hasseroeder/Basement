import { loadJson } from "../util/jsonUtil.js";

const imageCache = new Map(); // -> Promise<Image>

const polygonPlugin = {
    id: 'polygonPlugin',

    afterInit: (chart) => {
        chart.polygons = { hidden: false };
    },

    beforeDraw: (chart) => {
        if (chart.polygons && chart.polygons.hidden) return;

        const ctx = chart.ctx;
        ctx.save();
        const { polygons = [], colors = [] } = chart.options.plugins.polygonPlugin;

        polygons.forEach((poly, idx) => {
            ctx.fillStyle = colors[idx] || 'rgba(0,0,0,0.1)';
            ctx.beginPath();

            poly.forEach((pt, i) => {
                const x = chart.scales.x.getPixelForValue(getX(...pt));
                const y = chart.scales.y.getPixelForValue(getY(...pt));
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });

            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();
    },

    beforeDestroy: (chart) => {
        if (chart.polygons) delete chart.polygons;
    }
};

const statImages= [
    "./media/owo_images/HP.png",
    "./media/owo_images/STR.png",
    "./media/owo_images/PR.png",
    "./media/owo_images/WP.png",
    "./media/owo_images/MAG.png",
    "./media/owo_images/MR.png",
]; 

const dataPoints = (pets,top,right,left) => pets.map(pet => {
    const imgEl = new Image();
    imgEl.src = pet.image;
    imgEl.height=22;
    imgEl.width=22;
    return {
        x: getX(...getPosition(
            top.map(i => pet.attributes[i]),
            right.map(i => pet.attributes[i]),
            left.map(i => pet.attributes[i])
        )),
        y: getY(...getPosition(
            top.map(i => pet.attributes[i]),
            right.map(i => pet.attributes[i]),
            left.map(i => pet.attributes[i])
        )),
        label: pet.name,
        imageEl: imgEl,
        attributes: pet.attributes,
    };
});

function getPosition(
    topAttr,
    rightAttr,
    leftAttr
){
    let sum = [...topAttr,...rightAttr,...leftAttr].reduce((acc, num) => acc + num, 0);

    let right= 100*(rightAttr.reduce((acc, num) => acc + num, 0))/sum;
    let top=   100*(topAttr.reduce((acc, num) => acc + num, 0))/sum;

    return [top, right];
}

const externalTooltipHandler = (context) => {
    const { chart, tooltip } = context;
    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'chartjs-tooltip';
        tooltipEl.className= 'triangle-tooltip';
        document.body.appendChild(tooltipEl);
    }

    if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
    }

    const renderPoint = ({ raw: { label, attributes } }) => {
        const cells = attributes.map(
        (value, i) =>
            `<div style="display:flex;gap:0.2rem;width:2.5rem">
            <img src="${statImages[i]}" style="width:1rem;height:1rem;margin-top:0.05rem" />
            ${value}
            </div>`
        );

        return `
        <div style="margin-bottom:0.1rem">${label}</div>
        <div style="display:flex">${cells.slice(0, 3).join('')}</div>
        <div style="display:flex">${cells.slice(3).join('')}</div>
        `;
    };

    tooltipEl.innerHTML = `<div>${tooltip.dataPoints.map(renderPoint).join('')}</div>`;

    const { left, top } = chart.canvas.getBoundingClientRect();
    tooltipEl.style.cssText += `
        z-index: 2;
        opacity:1;
        position:absolute;
        left:${left + window.pageXOffset + tooltip.caretX + 5}px; 
        top:${top + window.pageYOffset + tooltip.caretY + 5}px;
    `;  // hardcoded offset is stupid, I know.
};

export function getX(topStat, rightStat){
    return rightStat + 0.5 * topStat;
}
export function getY(topStat,rightStat){
    return topStat;
}

export async function getLinesAndLabels({bigLabels,areaLabels}={}){
    const rightRotation = 57.2957795;
    
    const annotations = [
        {
            linePts: p => ([[p,0],[p,100-p]]),
            labelPos: p => ([[p,-3], 0])
        },
        {
            linePts: p => ([[100-p,p],[0,p]]),
            labelPos: p => ([[103-p,p],-rightRotation])
        },
        {
            linePts: p => ([[0,p],[p,0]]),
            labelPos: p => ([[-3,103-p], rightRotation ])
        }
    ];

    const lines  = {};
    const labels = {};

    annotations.forEach(({ linePts, labelPos },i) => {
        for (let percent = 0; percent <= 100; percent += 10) {
            const Title = i +"_" +percent;
            const [start, end] = linePts(percent);
            lines[Title] = {
                type: 'line',
                xMin: getX(...start), yMin: getY(...start),
                xMax: getX(...end), yMax: getY(...end),
                borderWidth: 0.5,
                color: 'lightgray',
                drawTime:'beforeDraw'
            };
            if (percent == 0) {continue;} // we skip drawing labels saying zero
            const [xy, rotation] = labelPos(percent);
            labels[`${Title}Label`] = {
                type: 'label',
                xValue: getX(...xy),
                yValue: getY(...xy),
                content: `${percent}`,
                color: 'lightgray',
                rotation
            };
        }
    });

    const positions = [[55,-10],[55,55],[-10,55]];
    (bigLabels || []).forEach(async (bigLabel,i) => {        
        const src = await createLabelImage(bigLabel);
        const image = await loadImage(src);
        const { width, height } = scaleToFit(image.naturalWidth, image.naturalHeight, 20);

        labels["BigLabel_"+i] = {
            type: 'label',
            content: image,
            width,
            height,
            rotation: [-rightRotation, rightRotation,0][i],
            xValue: getX(...positions[i]), yValue: getY(...positions[i])
        };
    });

    Object.assign(labels, getPolygonLabels(areaLabels));

    return {lines,labels};
}

function scaleToFit(naturalW, naturalH,  maxH) {
    const ratio = Math.min(maxH / naturalH, 1);
    return { width: Math.round(naturalW * ratio), height: Math.round(naturalH * ratio) };
}

function loadImage(src) {
    if (imageCache.has(src)) return imageCache.get(src);
    const p = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image failed to load: ' + src));
        img.src = src;
    });
    imageCache.set(src, p);
    return p;
}

async function createLabelImage(item) {
    const font = '20px system-ui, Arial, sans-serif';
    const imageSize = 24;

    const imageSources = item.images.map(i=>statImages[i]);
    const imgs = await Promise.all(imageSources.map(loadImage));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.font = font;
    const metrics = ctx.measureText(item.text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(
        (metrics.actualBoundingBoxAscent || 0) + (metrics.actualBoundingBoxDescent || 0) || parseInt(font, 10)
    );

    const scaleFactor = 5;
    const cssWidth = textWidth + imgs.length * imageSize;
    const cssHeight = Math.max(textHeight, imageSize);      

    canvas.width = Math.ceil(cssWidth * scaleFactor);
    canvas.height = Math.ceil(cssHeight * scaleFactor);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = 'lightgray';
    ctx.textBaseline = 'middle';
    ctx.font = '20px system-ui, Arial, sans-serif';
    const textY = cssHeight / 2;
    ctx.fillText(item.text, 0, textY);

    let x = textWidth;
    for (const img of imgs) {
        ctx.drawImage(img, x, 0, imageSize, imageSize);
        x += imageSize;
    }

    return canvas.toDataURL('image/png');
}

function getPolygonLabels({labels, colors} = {}){
    const labelObject = {};
    (labels || []).forEach(({text, coor, rotation = 0},i) =>{
        labelObject[text+"label"]={
            type:"label",
            content:text,
            xValue: getX(...coor),
            yValue: getY(...coor),
            color: colors[i],
            font: {
                size: 16,
                weight:"bold"
            },
            rotation,
            group: "polygonLabels"
        };
    });
    return labelObject;
}

export async function initializeTriangle({ chartData, ann, pets, statAllocation }, container){
    //const ctx = document.getElementById(chartData.elNames[0]);
    //const petButton = document.getElementById(chartData.elNames[1]);
    //const areaButton = document.getElementById(chartData.elNames[2]);
    
    const ctx = document.createElement("canvas");
    const petButton = document.createElement("button");
    const areaButton = document.createElement("button");

    container.append(ctx,petButton,areaButton);
    ctx.style="width: 600px; max-width:600px; height:480px; max-height:480px; margin-bottom:10px;";
    petButton.style="position: absolute; width: 4rem; transform: translate(-275%,175%);";
    petButton.textContent="Pets";
    areaButton.style="position: absolute; width: 4rem; transform: translate(-275%,300%);";
    areaButton.textContent="Area";
    
    const myChart = new Chart(ctx, {
        type: 'scatter',
        plugins: 
            [polygonPlugin],
        data: {
            datasets: [{
                label: 'Pet Stats',
                data: dataPoints(pets, ...statAllocation),
                pointStyle: ctx => ctx.raw.imageEl,
                radius: 10, hoverRadius: 15, hidden: false, clip:false
            }]
        },
        options: {
            layout: {padding: {left: 60, right: 60, top: 48, bottom: 48}},
            plugins: {
                tooltip: {
                    mode: 'nearest', enabled: false, animation: false, 
                    external: externalTooltipHandler  
                },
                legend: {display: false},
                annotation: {clip: false, annotations: {...ann.lines,...ann.labels}},
                polygonPlugin: chartData.polygonData
            },
            scales: {
                x: {
                    display: false, type: 'linear', position: 'bottom',
                    min: 0, max: 100,
                    title: {display: false},
                    grid: {drawOnChartArea: false}
                },
                y: {
                    display: false, type: 'linear',
                    min: 0, max: 100,
                    title: {display: false},
                    grid: {drawOnChartArea: false}
                }
            }
        },
    });

    function checkLabelVisibility(group,chart){
        const anns = chart.options.plugins.annotation.annotations;
        Object.keys(anns).forEach(id => {
            if (anns[id].group === group) anns[id].display = ds.hidden && !chart.polygons.hidden;
        });
        chart.update();
    }

    const ds = myChart.data.datasets[0];
    petButton.addEventListener('click', function() {
        ds.hidden = !ds.hidden;
        checkLabelVisibility("polygonLabels",myChart);
    });

    areaButton.addEventListener('click', function() {
        myChart.polygons.hidden = !myChart.polygons.hidden;
        checkLabelVisibility("polygonLabels",myChart);
    });
    checkLabelVisibility("polygonLabels",myChart);
}

export async function getTriangleData(){
    const statAllocation =[
        [[1,4],[3],[0,2,5]],// top:STR,MAG right:WP    left:HP,PR,MR
        [[2],[3,5],[0]]     // top:PR      right:WP,MR left:HP
    ];
    const chartData = [
        {
            areaLabels :{
                labels : [
                    {text: 'Gem', coor: [70,25], rotation: 57.2957795},
                    {text: 'Gemlike', coor: [60,25], rotation: 57.2957795},
                    {text: 'Attacker', coor: [72.5,7], rotation: -57.2957795},
                    {text: 'Hybrid', coor: [35.5,7], rotation: -57.2957795},
                    {text: 'Pure', coor: [7.5,7], rotation: -57.2957795},
                    {text: 'WP Tank', coor: [7.5,32.5]},
                    {text: 'WP Hybrid', coor: [23,25.6]},
                    {text: 'Supporter', coor: [47.5,32.5]},
                    {text: 'Useless', coor: [15,67.5]}
                ],colors : [
                    "rgb(65, 172, 39)",
                    "rgb(99, 192, 187)",
                    "rgb(210, 210, 210)",
                    "rgb(218, 147, 214)",
                    "rgb(210, 210, 210)",
                    "rgb(99, 192, 187)",
                    "rgb(76, 148, 255)",
                    "rgb(160, 160, 160)",
                    "rgb(160, 160, 160)",
                ]
            },
            polygonData:{
                polygons : [
                    [[100,0],[50,50],[40,50],[90,0]],
                    [[90,0],[40,50],[30,50],[80,0]],
                    [[100,0],[85,15],[55,15],[55,0]],
                    [[55,0],[55,15],[15,15],[15,0]],
                    [[15,0],[15,15],[0,15],[0,0]],
                    [[15,15],[15,50],[0,50],[0,15]],
                    [[15,15],[45,15],[15,45]],
                    [[45,15],[85,15],[50,50],[15,50],[15,45]]
                ],colors : [
                    "rgba(65, 172, 39, 0.25)",
                    "rgba(99, 192, 187, 0.25)",
                    "rgba(210, 210, 210, 0.25)",
                    "rgba(218, 147, 214, 0.25)",
                    "rgba(210, 210, 210, 0.25)",
                    "rgba(99, 192, 187, 0.25)",
                    "rgba(76, 148, 255, 0.25)",
                    "rgba(160, 160, 160, 0.25)",
                ]
            },
            bigLabels : [
                {text: '% of stats in Power', images:statAllocation[0][0]},
                {text: '% of stats in WP', images:statAllocation[0][1]},
                {text: '% of stats in Tanking', images:statAllocation[0][2]}
            ],
            jsonPath: "../json/pets.json"
        },
        {
            areaLabels :{
                labels : [
                    {text:"shielded",coor:[55,20]},
                    {text:"non-shielded",coor:[30,32.5]}
                ],
                colors : [
                    "rgb(40, 119, 194)",
                    "rgb(133, 106, 207)"
                ]
            },
            polygonData:{
                polygons : [
                    [[70,10],[70,15],[45,40],[45,20],[55,10]],
                    [[45,40],[40,45],[15,45],[15,25],[20,20],[45,20]]
                ],
                colors : [
                    "rgba(40, 119, 194, 0.25)",
                    "rgba(133, 106, 207, 0.25)"
                ]
            },
            bigLabels : [
                {text: '% of stats in Healing', images:statAllocation[1][0]},
                {text: '% of stats in Sustain', images:statAllocation[1][1]},
                {text: '% of stats in Health', images:statAllocation[1][2],}  
            ],
            jsonPath: "../json/cruneHolders.json"
        }
    ];
    
    const annsPromise  = Promise.all(chartData.map(cfg => getLinesAndLabels(cfg)));
    const petsPromise  = Promise.all(chartData.map(cfg => loadJson(cfg.jsonPath)));
    const [anns, pets] = await Promise.all([annsPromise, petsPromise]);

    return chartData.map((cfg, i) => ({
        chartData: cfg,
        ann: anns[i],
        pets: pets[i],
        statAllocation: statAllocation[i]
    }));
}