import { make } from "../util/injectionUtil.js";

// --------------------------------------------------------------------------------------
//
// Plugin for the basic polygons
//
//
const polygonPluginFactory = pluginConfig =>({
    id: pluginConfig.pluginName,
    visibleIn: pluginConfig.visibleIn,
    currentMode: undefined, 

    shouldShow(){
        return ( this.visibleIn === undefined
              || this.visibleIn.includes(this.currentMode)
        )
    },

    beforeDraw(chart){
        if (!this.shouldShow()) return; 

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
const simpleLabelPluginFactory = pluginConfig => ({ 
    id: pluginConfig.pluginName,
    visibleIn: pluginConfig.visibleIn,
    currentMode: undefined, 

    shouldShow(){
        return ( this.visibleIn === undefined
              || this.visibleIn.includes(this.currentMode)
        )
    },

    beforeUpdate(){
        const groupName = pluginConfig.data.groupName;
        const anns = Object.values(this.chart.options.plugins.annotation.annotations);
        anns.filter(ann => ann.group === groupName)
            .forEach(ann => ann.display = this.shouldShow())
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
                group: groupName
            };
        });
    },
})

// --------------------------------------------------------------------------------------
//
// Plugin for basic ticks in any ternary chart
//
//
const triangleTickPluginFactory = pluginConfig =>({
    id: pluginConfig.pluginName,
    visibleIn: pluginConfig.visibleIn,
    currentMode: undefined, 

    shouldShow(){
        return ( this.visibleIn === undefined
              || this.visibleIn.includes(this.currentMode)
        )
    },

    beforeUpdate(){
        const groupName = pluginConfig.data.groupName;
        const anns = Object.values(this.chart.options.plugins.annotation.annotations);
        anns.filter(ann => ann.group === groupName)
            .forEach(ann => ann.display = this.shouldShow())
    },

    beforeInit(chart){
        this.chart = chart;
        const anns = chart.options.plugins.annotation.annotations;
        const rightRotation = 60;
        const posFns = [
            p => ({coor: [p,-3], rotation: 0}),
            p => ({coor: [103-p,p],rotation: -rightRotation }),
            p => ({coor: [-3,103-p],rotation: rightRotation })
        ];

        posFns.forEach((posFn,i) => {
            for (let percent = 10; percent <= 100; percent += 10) {
                const Title = i+"_tick_" +percent;
                const {coor, rotation} = posFn(percent);
                anns[`${Title}Label`] = {
                    type: 'label',
                    xValue: getX(...coor),
                    yValue: getY(...coor),
                    content: percent,
                    color: 'lightgray',
                    rotation,
                    group: pluginConfig.data.groupName
                };
            }
        });
    }
})

// --------------------------------------------------------------------------------------
//
// Plugin for basic lines in any ternary chart
//
//
const triangleLinePluginFactory = pluginConfig =>({
    id: pluginConfig.pluginName,
    visibleIn: pluginConfig.visibleIn,
    currentMode: undefined, 

    shouldShow(){
        return ( this.visibleIn === undefined
              || this.visibleIn.includes(this.currentMode)
        )
    },

    beforeUpdate(){
        const groupName = pluginConfig.data.groupName;
        const anns = Object.values(this.chart.options.plugins.annotation.annotations);
        anns.filter(ann => ann.group === groupName)
            .forEach(ann => ann.display = this.shouldShow())
    },

    beforeInit(chart){
        this.chart = chart;
        const anns = chart.options.plugins.annotation.annotations;
        const posFns = [
            p => ({start:[p,0],end:[p,100-p]}),
            p => ({start:[100-p,p],end:[0,p]}),
            p => ({start:[0,p],end:[p,0]}),
        ];

        posFns.forEach((posFn,i) => {
            for (let percent = 0; percent <= 100; percent += 10) {
                const Title = i+"_label_" +percent;
                const {start, end} = posFn(percent);
                anns[Title] = {
                    type: 'line',
                    xMin: getX(...start), yMin: getY(...start),
                    xMax: getX(...end), yMax: getY(...end),
                    borderWidth: 0.5,
                    color: 'lightgray',
                    drawTime:'beforeDraw',
                    group: pluginConfig.data.groupName
                };
            }
        });
    }
})

function getX(topStat, rightStat){
    return rightStat + 0.5 * topStat;
}
function getY(topStat,rightStat){
    return topStat;
}

// --------------------------------------------------------------------------------------
//
// Plugin for Annotations generated with a canvas, which allows images inline with text
//
//
const imageCache = new Map(); // -> Promise<Image>

async function createLabelImage({elements, arrow}) {
    // I'm aware this is super specific and can never be reused
    // I'm aware that I wanted to make this reusable originally
    // I don't care at this point anymore
    const font = '20px system-ui, Arial, sans-serif';
    const defaultImageSize = 24;

    // --- First pass: measure elements ---
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    ctx.textBaseline = 'middle';

    const measured = [];
    let contentWidth = 0;
    let contentHeight = 0;

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
            contentWidth += w;
            contentHeight = Math.max(contentHeight, h);

        } else if (el.type === "image") {
            const img = await loadImage(el.source);
            const w = defaultImageSize;
            const h = defaultImageSize;
            measured.push({ type: "image", img, width: w, height: h });
            contentWidth += w;
            contentHeight = Math.max(contentHeight, h);

        } else if (el.type === "gap") {
            measured.push({ type: "gap", width: el.px, height: 0 });
            contentWidth += el.px;
        }
    }

    const arrowLength = arrow?.length ?? contentWidth;
    const arrowWidth = arrow?.width ?? 1.25;
    const arrowGap = arrow?.gap ?? 0;
    const arrowHead = arrow?.headSize ?? 10;
    const arrowDirection = arrow?.direction ?? "ltr";

    const finalWidth = Math.max(contentWidth, arrowLength);

    // Height = content + gap + arrow head height
    const adjArrowGap = Math.max(
        0,
        Math.abs(arrowGap) + (arrowHead/2) -(contentHeight/2)
    );

    const finalHeight = contentHeight + adjArrowGap ;

    // --- Prepare canvas ---
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'lightgray';
    ctx.strokeStyle = 'lightgray';

    // --- Second pass: draw content ---
    let x = (finalWidth - contentWidth) / 2;

    const textCenterY = Math.max(
        -arrowGap + (arrowHead/2),
        contentHeight/2
    )

    for (const el of measured) {
        if (el.type === "text") {
            ctx.fillText(el.content, x, textCenterY);
            x += el.width;

        } else if (el.type === "image") {
            ctx.drawImage(
                el.img, 
                x, 
                textCenterY - contentHeight/2,
                el.width, 
                el.height
            );
            x += el.width;

        } else if (el.type === "gap") {
            x += el.width;
        }
    }

    // --- Draw arrow ---
    const arrowY = textCenterY + arrowGap;
    const arrowStartX = (finalWidth - arrowLength) / 2;
    const arrowEndX = arrowStartX + arrowLength;

    ctx.lineWidth = arrowWidth;

    // Line
    ctx.beginPath();
    ctx.moveTo(arrowStartX, arrowY);
    ctx.lineTo(arrowEndX, arrowY);
    ctx.stroke();
    ctx.fill();

    // Arrow head
    ctx.beginPath();
    if (arrowDirection === "ltr"){
        ctx.moveTo(arrowEndX, arrowY);
        ctx.lineTo(arrowEndX - arrowHead, arrowY - arrowHead / 2);
        ctx.lineTo(arrowEndX - arrowHead, arrowY + arrowHead / 2);
    }else if (arrowDirection === "rtl"){
        ctx.moveTo(arrowStartX, arrowY);
        ctx.lineTo(arrowStartX + arrowHead, arrowY - arrowHead / 2);
        ctx.lineTo(arrowStartX + arrowHead, arrowY + arrowHead / 2);
    }
    ctx.closePath();
    ctx.fill();

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

const advancedLabelPluginFactory = pluginConfig => ({
    id: pluginConfig.pluginName,
    visibleIn: pluginConfig.visibleIn,
    currentMode: undefined, 

    shouldShow(){
        return ( this.visibleIn === undefined
              || this.visibleIn.includes(this.currentMode)
        )
    },

    beforeUpdate(){
        const groupName = pluginConfig.data.groupName;
        const anns = Object.values(this.chart.options.plugins.annotation.annotations);
        anns.filter(ann => ann.group === groupName)
            .forEach(ann => ann.display = this.shouldShow())
    },

    beforeInit(chart) {
        this.chart = chart;
        const anns = chart.options.plugins.annotation.annotations;
        const {labels, groupName} = pluginConfig.data;
        
        labels.forEach( async ({id, imageConfig, coor, rotation = 0}) =>{
            const image = await createLabelImage(imageConfig);
            const { width, height } = scaleToFit(image.naturalWidth, image.naturalHeight, 27.5);

            anns[id]={
                type:"label",
                content: image,
                width,
                height,
                xValue: getX(...coor),
                yValue: getY(...coor),
                rotation,
                group: groupName
            };
        });
    }
})

// --------------------------------------------------------------------------------------
//
// Plugin for helping lines toward the Cursor
//
//
const cursorLinePluginFactory = pluginConfig => ({
    id: pluginConfig.pluginName,
    visibleIn: pluginConfig.visibleIn,
    currentMode: undefined, 

    shouldShow(){
        return ( this.visibleIn === undefined
              || this.visibleIn.includes(this.currentMode)
        )
    },

    afterEvent: (chart, args) => {
        const event = args.event;
        chart._cursorPosition = { x: event.x, y: event.y };
    },

    beforeInit(chart) {
        const container = chart.canvas.parentNode;

        this.leftLabel = make('div',{className: 'triangle-help-label'});
        this.rightLabel = make('div',{className: 'triangle-help-label right'});
        this.bottomLabel = make('div',{className: 'triangle-help-label bottom'});

        container.append(this.leftLabel, this.rightLabel, this.bottomLabel);
        const plugin = this;

        container.addEventListener('mousemove', function() {
            if(plugin.shouldShow()) chart.update()
        });
    },

    afterDraw(chart) {        
        if (!chart._cursorPosition || !this.shouldShow()) return;

        const ctx = chart.ctx;
        const {x,y} = chart.scales;

        const canvasRect = chart.canvas.getBoundingClientRect();

        const dataX = x.getValueForPixel(chart._cursorPosition.x);
        const dataY = y.getValueForPixel(chart._cursorPosition.y);

        const { left, right, bottom } = reverseXY(dataX, dataY);

        const rightX = getPixelForX(x, getX(100-right,right));
        const rightY = getPixelForY(y, getY(100-right,right));
        const leftX = getPixelForX(x, getX(left,0));
        const leftY = getPixelForY(y, getY(left,0));
        const bottomX = getPixelForX(x, getX(0,100-bottom));
        const bottomY = getPixelForY(y, getY(0,100-bottom));

        if (
            left >= 0 &&
            right >= 0 &&
            bottom >= 0
        ){
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(chart._cursorPosition.x, chart._cursorPosition.y);
            ctx.lineTo(rightX,rightY);
            ctx.moveTo(chart._cursorPosition.x, chart._cursorPosition.y);
            ctx.lineTo(leftX,leftY);
            ctx.moveTo(chart._cursorPosition.x, chart._cursorPosition.y);
            ctx.lineTo(bottomX,bottomY);
            ctx.moveTo(chart._cursorPosition.x, chart._cursorPosition.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'gray';
            ctx.stroke();
            ctx.restore();

            this.leftLabel.innerHTML = `${left.toFixed(0)}%`;
            this.leftLabel.style.left = canvasRect.left + window.pageXOffset + getPixelForX(x, getX(left,0)) - 33 + 'px';
            this.leftLabel.style.top = canvasRect.top + window.pageYOffset + getPixelForY(y, getY(left,0)) - 7+  'px';
            this.leftLabel.style.visibility = "visible";

            this.rightLabel.innerHTML = `${right.toFixed(0)}%`;
            this.rightLabel.style.left = canvasRect.left + window.pageXOffset + getPixelForX(x, getX(100-right,right)) -4 + 'px';
            this.rightLabel.style.top = canvasRect.top + window.pageYOffset + getPixelForY(y, getY(100-right,right)) - 27+ 'px';
            this.rightLabel.style.visibility = "visible";

            this.bottomLabel.innerHTML = `${bottom.toFixed(0)}%`;
            this.bottomLabel.style.left = canvasRect.left + window.pageXOffset + getPixelForX(x, getX(0,100-bottom)) -1 +'px';
            this.bottomLabel.style.top = canvasRect.top + window.pageYOffset + getPixelForY(y, getY(0,100-bottom)) + 10+ 'px';
            this.bottomLabel.style.visibility = "visible";
        }
        else{
            this.leftLabel.style.visibility = "hidden";
            this.rightLabel.style.visibility = "hidden";
            this.bottomLabel.style.visibility = "hidden";
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
    let left= y;
    let right= x -0.5 * left;
    let bottom=100-left-right;
    return {left, right, bottom};
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
    const [top, right] = getPosition(
        data.attributeGroups.left.map(i => pet.attributes[i]),
        data.attributeGroups.right.map(i => pet.attributes[i]),
        data.attributeGroups.bottom.map(i => pet.attributes[i])
    )

    return {
        x: getX(top, right),
        y: getY(top, right),
        label: pet.name,
        imageEl: imgEl,
        attributes: pet.attributes,
    };
});

const externalTooltipHandler = context => {
    const { chart, tooltip } = context;
    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
        const statImageSources = [
            "./media/owo_images/battleEmojis/HP.png",
            "./media/owo_images/battleEmojis/STR.png",
            "./media/owo_images/battleEmojis/PR.png",
            "./media/owo_images/battleEmojis/WP.png",
            "./media/owo_images/battleEmojis/MAG.png",
            "./media/owo_images/battleEmojis/MR.png",
        ];
        tooltipEl = make('div', {
            id: 'chartjs-tooltip',
            className: 'triangle-tooltip'
        });

        const rows = [ make('div'), make('div'), make('div') ];
        tooltipEl.append(...rows);

        const statTexts = [];
        const statCells = [];

        statImageSources.forEach(src => {
            const text = document.createTextNode('');
            const img = make('img', { src });
            const cell = make('div', {}, [img, text]);
            statTexts.push(text);
            statCells.push(cell);
        });

        statCells.slice(0, 3).forEach(cell => rows[1].append(cell));
        statCells.slice(3).forEach(cell => rows[2].append(cell));

        // Save references
        tooltipEl._nodes = {
            labelRow: rows[0],
            statTexts
        };

        document.body.append(tooltipEl);
    }

    tooltipEl.style.opacity = tooltip.opacity;
    if (tooltip.opacity===0) return; 

    const { label, attributes } = tooltip.dataPoints[0].raw;

    tooltipEl._nodes.labelRow.textContent = label;
    tooltipEl._nodes.statTexts.forEach((text, i) => {
        text.textContent = ' ' + attributes[i];
    });

    const { left, top } = chart.canvas.getBoundingClientRect();
    tooltipEl.style.left = `${left + window.pageXOffset + tooltip.caretX + 5}px`;
    tooltipEl.style.top = `${top + window.pageYOffset + tooltip.caretY + 5}px`;
    // hardcoded offset is stupid, I know.
};

export async function initializeTriangle(){
    const container = this.cachedDiv.querySelector("#chartContainer");
    const {dataSetsConfig, baseConfig, modes, pluginConfigs} = this.data;

    const constantPadding = 10; // this is unavoidable due to chart.js annoyingness
    const additionalPadding =baseConfig.additionalPadding;
    const outerWidth   = 480;
    const innerWidth   = outerWidth - additionalPadding.left - additionalPadding.right - constantPadding*2;
    const innerHeight  = innerWidth * (Math.sqrt(3)/2);
    const outerHeight  = innerHeight + additionalPadding.top + additionalPadding.bottom + constantPadding*2;

    const ctx = make("canvas");
    container.append(make("div",
        {style:`width: ${outerWidth}px; height:${outerHeight}px;`},
        [ctx]
    ))

    const pluginNameMap = {
        polygon: polygonPluginFactory,
        simpleLabel: simpleLabelPluginFactory,
        advancedLabel: advancedLabelPluginFactory,
        ticks: triangleTickPluginFactory,
        line:triangleLinePluginFactory,
        cursorLine: cursorLinePluginFactory
    }
    const pluginArray = pluginConfigs.map(
        pluginConfig => pluginNameMap[pluginConfig.pluginName](pluginConfig) 
    )

    const datasets = dataSetsConfig.map(dataSetConfig=>({
        data: dataPoints(dataSetConfig),
        pointStyle: ctx => ctx.raw.imageEl,
        radius: dataSetConfig.radius, 
        hoverRadius: dataSetConfig.hoverRadius, 
        hidden: false, 
        clip:false,
        shouldHideInMode(mode){
            return ( dataSetConfig.visibleIn 
                && !dataSetConfig.visibleIn.includes(mode)
            )
        }
    }));

    if (modes && modes.length > 0){
        pluginArray.forEach(plugin => plugin.currentMode = modes[0].slug);

        const buttonWrapper = make("div",{className: "triangle-button-wrapper"})
        modes.forEach(mode =>
            buttonWrapper.append(
                make("button",{
                    textContent:mode.prettyName,
                    onclick() {
                        datasets.forEach(dataset =>{
                            dataset.hidden = dataset.shouldHideInMode(mode.slug);
                        })
                        pluginArray.forEach(plugin => plugin.currentMode = mode.slug);
                        myChart.update();
                    }
                })
            )
        )
        container.append(buttonWrapper);
    }

    const myChart = new Chart(ctx, {
        type: 'scatter',
        plugins: pluginArray,
        data: {datasets: datasets},
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