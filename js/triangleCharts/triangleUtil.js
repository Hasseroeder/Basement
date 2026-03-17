import * as PluginManager from "./trianglePlugins.js";
import { make } from "../util/injectionUtil.js";

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
    const sum   = [...topAttr,...rightAttr,...leftAttr].reduce((acc, num) => acc + num, 0);
    const right = 100*(rightAttr.reduce((acc, num) => acc + num, 0))/sum;
    const top   = 100*(topAttr.reduce((acc, num) => acc + num, 0))/sum;

    return [top, right];
}

const externalTooltipHandler = context => {
    const { chart, tooltip } = context;
    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
        tooltipEl = make('div',{
            id: 'chartjs-tooltip',
            className: 'triangle-tooltip'
        });
        document.body.appendChild(tooltipEl);
    }

    tooltipEl.style.opacity = tooltip.opacity;

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

const imageCache = new Map(); // -> Promise<Image>

async function createLabelImage(elements) {
    const font = '20px system-ui, Arial, sans-serif';
    const defaultImageSize = 24;

    // --- First pass: measure everything ---
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    ctx.textBaseline = 'middle';

    const measured = [];
    let totalWidth = 0;
    let maxHeight = 0;

    for (const el of elements) {
        if (el.type === "text") {
            const metrics = ctx.measureText(el.content);
            const w = Math.ceil(metrics.width);
            const h = Math.ceil(
                (metrics.actualBoundingBoxAscent || 0) +
                (metrics.actualBoundingBoxDescent || 0) ||
                parseInt(font, 10)
            );
            measured.push({ type: "text", content: el.content, width: w, height: h });
            totalWidth += w;
            maxHeight = Math.max(maxHeight, h);

        } else if (el.type === "image") {
            const img = await loadImage(el.source);
            const w = defaultImageSize;
            const h = defaultImageSize;
            measured.push({ type: "image", img, width: w, height: h });
            totalWidth += w;
            maxHeight = Math.max(maxHeight, h);

        } else if (el.type === "gap") {
            measured.push({ type: "gap", width: el.px, height: 0 });
            totalWidth += el.px;
        }
    }

    // --- Prepare canvas ---
    canvas.width = totalWidth;
    canvas.height = maxHeight;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${maxHeight}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'lightgray';

    // --- Second pass: draw everything ---
    let x = 0;
    const centerY = maxHeight / 2;

    for (const el of measured) {
        if (el.type === "text") {
            ctx.fillText(el.content, x, centerY);
            x += el.width;

        } else if (el.type === "image") {
            ctx.drawImage(el.img, x, 0, el.width, el.height);
            x += el.width;

        } else if (el.type === "gap") {
            x += el.width;
        }
    }

    return loadImage(canvas.toDataURL("image/png"));
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

export async function getLabels(scaleTitles){    
    const labels = {};

    (scaleTitles || []).forEach(async (scaleTitle,i) => {        
        const image = await createLabelImage(scaleTitle.elements);
        const { width, height } = scaleToFit(image.naturalWidth, image.naturalHeight, 20);

        labels["ScaleTitle_"+i] = {
            type: 'label',
            content: image,
            width,
            height,
            rotation: scaleTitle.rotation || 0,
            xValue: getX(...scaleTitle.coor), yValue: getY(...scaleTitle.coor)
        };
    });
    return labels;
}

function scaleToFit(naturalW, naturalH,  maxH) {
    const ratio = Math.min(maxH / naturalH, 1);
    return { width: Math.round(naturalW * ratio), height: Math.round(naturalH * ratio) };
}

export async function initializeTriangle(){
    const container = this.cachedDiv.querySelector("#chartContainer");
    const {chartData, pets} = this.data;

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
    const outerHeight  = innerHeight + additionalPadding.top + additionalPadding.bottom + constantPadding*2;

    const ctx = make("canvas");
    const ctxWrapper = make("div",{
        style:`width: ${outerWidth}px; height:${outerHeight}px; margin-bottom:10px;`
    },[
        ctx
    ]);

    const petButton = make("button",{
        className:"triangle-pet-button",
        textContent:"Pets",
        onclick: () => {
            dataset.hidden = !dataset.hidden;
            polygonLabelPlugin.toggle();
            myChart.update();    
        }
    });

    container.append(ctxWrapper,petButton);

    const polygonPlugin = PluginManager.polygonPluginFactory(chartData.polygonData);
    const polygonLabelPlugin = PluginManager.polygonLabelPluginFactory(chartData.areaLabels);
    const baseTrianglePlugin = PluginManager.triangleBasePluginFactory();

    const dataset = {
        data: dataPoints(pets, ...chartData.statAllocation),
        pointStyle: ctx => ctx.raw.imageEl,
        radius: 10, hoverRadius: 15, hidden: false, clip:false
    }

    const labels = await getLabels(chartData.scaleTitles);

    const myChart = new Chart(ctx, {
        type: 'scatter',
        plugins: [ polygonPlugin, polygonLabelPlugin, baseTrianglePlugin],
        data: {datasets: [dataset]},
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
                annotation: {
                    clip: false, 
                    annotations: labels
                },
            },
            scales: {
                x: { display: false, min: 0, max: 100},
                y: { display: false, min: 0, max: 100}
            }
        },
    });
}