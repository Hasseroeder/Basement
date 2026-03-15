import * as PluginManager from "./trianglePlugins.js";

const imageCache = new Map(); // -> Promise<Image>

const statImages= [
    "./media/owo_images/battleEmojis/HP.png",
    "./media/owo_images/battleEmojis/STR.png",
    "./media/owo_images/battleEmojis/PR.png",
    "./media/owo_images/battleEmojis/WP.png",
    "./media/owo_images/battleEmojis/MAG.png",
    "./media/owo_images/battleEmojis/MR.png",
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

export async function getLinesAndLabels({bigLabels,statAllocation}={}){
    const rightRotation = 60;
    
    const labels = {};

    const positions = [[55,-10],[55,55],[-10,55]];
    (bigLabels || []).forEach(async (bigLabel,i) => {        
        const src = await createLabelImage(bigLabel,statAllocation[i]);
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

    return {labels};
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

async function createLabelImage(item,statIDs) {
    const font = '20px system-ui, Arial, sans-serif';
    const imageSize = 24;

    const imageSources = statIDs.map(i=>statImages[i]);
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

export async function initializeTriangle(){
    const container = this.cachedDiv.querySelector("#chartContainer");
    const {chartData, ann, pets} = this.data;

    const ctx = document.createElement("canvas");
    const ctxWrapper = document.createElement("div");
    const petButton = document.createElement("button");

    const constantPadding = 10; // this is unavoidable due to chart.js annoyingness
    const additionalPadding ={
        top: 0,
        right: 0,
        bottom: 50,
        left: 0
    };
    const outerWidth   = 480;
    const innerWidth   = outerWidth - additionalPadding.left - additionalPadding.right - constantPadding*2;
    const innerHeight  = innerWidth * (Math.sqrt(3)/2);
    const outerHeight  = innerHeight  + additionalPadding.top + additionalPadding.bottom + constantPadding*2;

    ctxWrapper.style=`width: ${outerWidth}px; height:${outerHeight}px; margin-bottom:10px;`;

    petButton.style="position: absolute; width: 4.5rem; height: 3rem; transform: translate(-275%,175%);";
    petButton.textContent="Pets";
    ctxWrapper.append(ctx);
    container.append(ctxWrapper,petButton);

    const myChart = new Chart(ctx, {
        type: 'scatter',
        plugins: [
            PluginManager.polygonPluginFactory(chartData.polygonData),
            PluginManager.polygonLabelPluginFactory(chartData.areaLabels),
            PluginManager.triangleBasePluginFactory()
        ],
        data: {
            datasets: [{
                label: 'Pet Stats',
                data: dataPoints(pets, ...chartData.statAllocation),
                pointStyle: ctx => ctx.raw.imageEl,
                radius: 10, hoverRadius: 15, hidden: false, clip:false
            }]
        },
        options: {
            animation: false,
            maintainAspectRatio: false,
            layout: {padding:additionalPadding},
            plugins: {
                tooltip: {
                    mode: 'nearest', enabled: false, animation: false, 
                    external: externalTooltipHandler  
                },
                legend: {display: false},
                annotation: {clip: false, annotations: {...ann.lines,...ann.labels}},
            },
            scales: {
                x: { display: false, min: 0, max: 100},
                y: { display: false, min: 0, max: 100}
            }
        },
    });

    const anns = Object.values(myChart.options.plugins.annotation.annotations);
    const ds = myChart.data.datasets[0];
    const toggleAnns = (group,override) => 
        anns.filter(ann => ann.group === group)
            .forEach(ann => ann.display = override ?? !ann.display)

    petButton.onclick = () => {
        ds.hidden = !ds.hidden;
        toggleAnns("polygonLabels");
        myChart.update();    
    };

    toggleAnns("polygonLabels",false);
    myChart.update();   
}