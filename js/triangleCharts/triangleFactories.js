import { make } from "../util/injectionUtil.js";

// --------------------------------------------------------------------------------------
//
// Plugin for the basic polygons
//
//
export const polygonPluginFactory = pluginConfig =>({
    id: pluginConfig.pluginName,

    beforeDraw: chart => {
        const ctx = chart.ctx;
        ctx.save();

        const polygons = pluginConfig.data

        polygons.forEach(polygon => {
            ctx.fillStyle = polygon.color;
            ctx.beginPath();

            polygon.coorArray.forEach((pt, i) => {
                const x = chart.scales.x.getPixelForValue(getX(...pt));
                const y = chart.scales.y.getPixelForValue(getY(...pt));
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });

            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();
    }
})

// --------------------------------------------------------------------------------------
//
// Plugin for the basic colored labels
//
//
export const simpleLabelPluginFactory = pluginConfig => ({ 
    id: pluginConfig.pluginName,
    
    toggle(override) {
        const groupName = pluginConfig.data.groupName;
        const anns = Object.values(this.chart.options.plugins.annotation.annotations);
        anns.filter(ann => ann.group === groupName)
            .forEach(ann => ann.display = override ?? !ann.display)
        this.chart.update();    
    },

    beforeInit(chart) {
        this.chart = chart;
        const anns = chart.options.plugins.annotation.annotations;
        const {labels, groupName} = pluginConfig.data;

        labels.forEach(label =>{
            anns[label.content+"label"]={
                type:"label",
                content: label.content,
                xValue: getX(...label.coor),
                yValue: getY(...label.coor),
                color: label.color,
                font: { size: 16, weight:"bold"},
                rotation: label.rotation || 0,
                group: groupName,
                display: false
            };
        });
    },
})

// --------------------------------------------------------------------------------------
//
// Plugin for the basic lines and labels in any ternary chart
//
//
export const triangleBasePluginFactory = pluginConfig =>({
    id: pluginConfig.pluginName,
    
    beforeInit: chart => {
        const lines = pluginConfig.lines ?? true;
        const labels = pluginConfig.labels ?? true;

        const anns = chart.options.plugins.annotation.annotations;
        const rightRotation = 60;
        const scales = [
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

        scales.forEach(({ linePts, labelPos },i) => {
            for (let percent = 0; percent <= 100; percent += 10) {
                const Title = i +"_" +percent;
                if (lines){
                    const [start, end] = linePts(percent);
                    anns[Title] = {
                        type: 'line',
                        xMin: getX(...start), yMin: getY(...start),
                        xMax: getX(...end), yMax: getY(...end),
                        borderWidth: 0.5,
                        color: 'lightgray',
                        drawTime:'beforeDraw'
                    };
                }
                if (percent == 0) continue; // we skip drawing labels saying zero
                if (labels){
                    const [xy, rotation] = labelPos(percent);
                    anns[`${Title}Label`] = {
                        type: 'label',
                        xValue: getX(...xy),
                        yValue: getY(...xy),
                        content: `${percent}`,
                        color: 'lightgray',
                        rotation
                    };
                }
            }
        });
    }
})

export function getX(topStat, rightStat){
    return rightStat + 0.5 * topStat;
}
export function getY(topStat,rightStat){
    return topStat;
}

// --------------------------------------------------------------------------------------
//
// Plugin for Annotations generated with a canvas, which allows images inline with text
//
//
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

function scaleToFit(naturalW, naturalH,  maxH) {
    const ratio = Math.min(maxH / naturalH, 1);
    return { width: Math.round(naturalW * ratio), height: Math.round(naturalH * ratio) };
}

export const advancedLabelPluginFactory = pluginConfig => ({
    id: pluginConfig.pluginName,

    beforeInit(chart) {
        this.chart = chart;
        const anns = chart.options.plugins.annotation.annotations;
        const labels = pluginConfig.data;
        
        labels.forEach( async ({id, elements, coor, rotation = 0}) =>{
            const image = await createLabelImage(elements);
            const { width, height } = scaleToFit(image.naturalWidth, image.naturalHeight, 20);

            anns[id]={
                type:"label",
                content: image,
                width,
                height,
                xValue: getX(...coor),
                yValue: getY(...coor),
                rotation
            };
        });
    }
})

// --------------------------------------------------------------------------------------
//
// Plugin for helping lines toward the Cursor
//
//
export const cursorLinePluginFactory = pluginConfig => ({
    id: pluginConfig.pluginName,
    enabled: pluginConfig.enabled,

    toggle(override) {
        this.enabled = override ?? !this.enabled;
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

        container.addEventListener('mousemove', () => chart.update());
    },

    afterDraw(chart) {
        const ctx = chart.ctx;
        
        if (!chart._cursorPosition || !this.enabled) return;

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
});

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

// --------------------------------------------------------------------------------------
//
// Non plugin code starts here, mostly for the chart factory itself
//
//

const dataPoints = data => data.array.map(pet => {
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
    
    const imgEl = new Image();
    imgEl.src = pet.image;
    imgEl.height=data.imageSize.height;
    imgEl.width=data.imageSize.width;
    return {
        x: getX(...getPosition(
            data.attributeGroups.left.map(i => pet.attributes[i]),
            data.attributeGroups.right.map(i => pet.attributes[i]),
            data.attributeGroups.bottom.map(i => pet.attributes[i])
        )),
        y: getY(...getPosition(
            data.attributeGroups.left.map(i => pet.attributes[i]),
            data.attributeGroups.right.map(i => pet.attributes[i]),
            data.attributeGroups.bottom.map(i => pet.attributes[i])
        )),
        label: pet.name,
        imageEl: imgEl,
        attributes: pet.attributes,
    };
});

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
    if (tooltip.opacity===0) return; 

    const statImages= [
        "./media/owo_images/battleEmojis/HP.png",
        "./media/owo_images/battleEmojis/STR.png",
        "./media/owo_images/battleEmojis/PR.png",
        "./media/owo_images/battleEmojis/WP.png",
        "./media/owo_images/battleEmojis/MAG.png",
        "./media/owo_images/battleEmojis/MR.png",
    ]; 

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

export async function initializeTriangle(){
    const container = this.cachedDiv.querySelector("#chartContainer");
    const {data, baseConfig, pluginConfigs} = this.data;

    const constantPadding = 10; // this is unavoidable due to chart.js annoyingness
    const additionalPadding =baseConfig.additionalPadding;
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
        /*onclick: () => {
            dataset.hidden = !dataset.hidden;
            polygonLabelPlugin.toggle();
            myChart.update();  
            
                // need some way of toggling the visibility of specific plugins, datasets and tooltips easily 
                // this should all be easily configurable 
                // different viewing modes should have different things visible each 
                //
                // this DOM element creation should also not be part of triangleFactories.js
        }*/
    });

    container.append(ctxWrapper,petButton);

    const pluginArray = pluginConfigs.map(pluginConfig => {
        switch (pluginConfig.pluginName){
            case "polygon":
                return polygonPluginFactory(pluginConfig)
            case "simpleLabel":
                return simpleLabelPluginFactory(pluginConfig)
            case "advancedLabel":
                return advancedLabelPluginFactory(pluginConfig)
            case "triangleBase": 
                return triangleBasePluginFactory(pluginConfig)
            case "cursorLine":
                return cursorLinePluginFactory(pluginConfig)
        }
    })

    const dataset = {
        data: dataPoints(data),
        pointStyle: ctx => ctx.raw.imageEl,
        radius: 10, hoverRadius: 15, hidden: false, clip:false
    }

    const myChart = new Chart(ctx, {
        type: 'scatter',
        plugins: pluginArray,
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
                annotation: {clip: false},
            },
            scales: {
                x: { display: false, min: 0, max: 100},
                y: { display: false, min: 0, max: 100}
            }
        },
    });
}