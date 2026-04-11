import { make } from "/js/util/injectionUtil.js";
import { buildTriangleDataset, getX, getY } from "./triangleUtils.js";
import { roundToDecimals } from "../../util/inputUtil.js";

const cardinals = ["left","right","bottom"]

// --------------------------------------------------------------------------------------
//
// Plugin wrapper around one or more dataset configs.
// Keeps module init surface as "plugins only" while still producing datasets.
//
//
export const dataSetPluginFactory = pluginConfig => ({
    skipRegistration: true,
    dataSets: (pluginConfig.data?.dataSetConfigs ?? []).map(buildTriangleDataset),

    beforeInit(chart){
        chart.data.datasets = this.dataSets;
    },

    set hidden(value){
        this._hidden = value;
        (this.dataSets ?? []).forEach(dataSet => dataSet.hidden = value);
    },

    get hidden(){
        return this._hidden ?? false;
    }
});

// --------------------------------------------------------------------------------------
//
// Plugin for the basic polygons
//
//
export const polygonPluginFactory = pluginConfig =>({
    hidden:false,

    beforeDraw(chart){
        if (this.hidden) return; 

        const ctx = chart.ctx;
        ctx.save();

        const polygons = pluginConfig.data

        polygons.forEach(polygon => {
            ctx.fillStyle = polygon.color;
            ctx.beginPath();

            polygon.coorArray.forEach((coor, i) => {
                const x = chart.scales.x.getPixelForValue(getX(coor));
                const y = chart.scales.y.getPixelForValue(getY(coor));
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
    hidden: false,

    beforeUpdate(chart){
        const groupName = pluginConfig.data.groupName;
        const anns = Object.values(chart.options.plugins.annotation.annotations);
        anns.filter(ann => ann.group === groupName)
            .forEach(ann => ann.display = !this.hidden)
    },

    beforeInit(chart) {
        const anns = chart.options.plugins.annotation.annotations;
        const {labels, groupName} = pluginConfig.data;

        labels.forEach(label =>{
            anns[label.content+"label"]={
                type:"label",
                content: label.content,
                xValue: getX(label.coor),
                yValue: getY(label.coor),
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
export const triangleTickPluginFactory = pluginConfig =>({
    hidden: false,

    beforeUpdate(){
        const groupName = pluginConfig.data.groupName;
        const anns = Object.values(this.chart.options.plugins.annotation.annotations);
        anns.filter(ann => ann.group === groupName)
            .forEach(ann => ann.display = !this.hidden)
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
                const {coor, rotation} = posFn(percent);
                anns[cardinals[i]+"_tick_" +percent] = {
                    type: 'label',
                    xValue: getX(coor),
                    yValue: getY(coor),
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
export const triangleLinePluginFactory = pluginConfig =>({
    hidden: false,

    beforeUpdate(chart){
        const groupName = pluginConfig.data.groupName;
        const anns = Object.values(chart.options.plugins.annotation.annotations);
        anns.filter(ann => ann.group === groupName)
            .forEach(ann => ann.display = !this.hidden)
    },

    beforeInit(chart){
        const anns = chart.options.plugins.annotation.annotations;
        const posFns = [
            p => ({start:[p,0],end:[p,100-p]}),
            p => ({start:[100-p,p],end:[0,p]}),
            p => ({start:[0,p],end:[p,0]}),
        ];

        posFns.forEach((posFn,i) => {
            for (let percent = 0; percent <= 100; percent += 10) {
                const {start, end} = posFn(percent);
                anns[cardinals[i]+"_line_" +percent] = {
                    type: 'line',
                    xMin: getX(start), yMin: getY(start),
                    xMax: getX(end), yMax: getY(end),
                    borderWidth: 0.5,
                    color: 'lightgray',
                    drawTime:'beforeDraw',
                    group: pluginConfig.data.groupName
                };
            }
        });
    }
})

// --------------------------------------------------------------------------------------
//
// Plugin for Annotations generated with a canvas, which allows images inline with text
//
//
const imageCache = new Map(); // -> Promise<Image>

async function createLabelImage({elements, arrow}) {
    // I'm aware this is super specific and can never be reused
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

export const advancedLabelPluginFactory = pluginConfig => ({
    hidden: false,

    beforeUpdate(chart){
        const groupName = pluginConfig.data.groupName;
        const anns = Object.values(chart.options.plugins.annotation.annotations);
        anns.filter(ann => ann.group === groupName)
            .forEach(ann => ann.display = !this.hidden)
    },

    beforeInit(chart) {
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
                xValue: getX(coor),
                yValue: getY(coor),
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

const updateOnVisible = (chart,plugin) => function (){
    !plugin.hidden && chart.update()
}

export const cursorLinePluginFactory = pluginConfig => ({
    hidden: false,

    afterEvent: (chart, args) => {
        const event = args.event;
        chart._cursorPosition = { x: event.x, y: event.y };
    },

    beforeInit(chart) {
        const container = chart.canvas.parentNode;
        const plugin = this;
        initializeLabelDOM(chart,plugin);
        container.addEventListener('mousemove', updateOnVisible(chart,plugin));
    },

    afterDraw(chart) {          
        this.left.container.style.visibility = "hidden";
        this.right.container.style.visibility = "hidden";
        this.bottom.container.style.visibility = "hidden";
        
        if (!chart._cursorPosition || this.hidden) return;

        const DOMCoors = [chart._cursorPosition.x,chart._cursorPosition.y]
        const data = SquareToTriangleCoor(DOMToSquareCoor(chart,DOMCoors));

        if ( data.left >= 0 && data.right >= 0 && data.bottom >= 0 ) 
            drawTrident(chart, this);
    },

    beforeDestroy(chart){
        const plugin = this;
        plugin.left.container.remove();
        plugin.right.container.remove();
        plugin.bottom.container.remove();
        container.removeEventListener('mousemove', updateOnVisible(chart,plugin));
    }
});

function getPixel(scales, coor){
    const x = getX(coor);
    const y = getY(coor);
    return {
        x:scales.x.left   + (x - scales.x.min) * (scales.x.width  / (scales.x.max - scales.x.min)),
        y:scales.y.bottom - (y - scales.y.min) * (scales.y.height / (scales.y.max - scales.y.min))
    }
}


// --------------------------------------------------------------------------------------
//
// Plugin for helping lines toward the Cursor WITH automatically hiding ticks
// 
//
export const cursorLine_with_ticksPluginFactory = pluginConfig => ({
    hidden: false,

    afterEvent: (chart, args) => {
        const event = args.event;
        chart._cursorPosition = { x: event.x, y: event.y };
    },

    beforeInit(chart) {
        const container = chart.canvas.parentNode;
        const plugin = this;

        initializeLabelDOM(chart,this);

        const smartUpdate = () => { if(!plugin.hidden) chart.update() };

        container.addEventListener('mousemove', smartUpdate);
        window.addEventListener("resize",smartUpdate);
    },

    beforeDraw(chart) {
        const plugin = this;
        const canvasLocation = getCanvasLocation(chart);
        !plugin._initialized && initializeTickDOM(chart, plugin);

        cardinals.forEach(cardinal =>{
            plugin[cardinal].ticks.forEach(tick => {
                const coor = 
                    cardinal === "left"   ? getPixel(chart.scales,[tick.percent,0])
                    : cardinal === "right"  ? getPixel(chart.scales,[100-tick.percent,tick.percent])
                    : cardinal === "bottom" ? getPixel(chart.scales,[0,100-tick.percent])
                    : "error";
                tick.container.style.left = canvasLocation.x + coor.x+ 'px';
                tick.container.style.top = canvasLocation.y + coor.y+ 'px';
            });
            plugin[cardinal].container.style.visibility = "hidden";
        });

        if (!chart._cursorPosition || plugin.hidden) return;

        const DOMCoors = [chart._cursorPosition.x,chart._cursorPosition.y]
        const data = SquareToTriangleCoor(DOMToSquareCoor(chart,DOMCoors));

        if (
            data.left >= 0 &&
            data.right >= 0 &&
            data.bottom >= 0
        ){
            drawTrident(chart,plugin);
            cardinals.forEach(cardinal =>{
                function isWithin(toTest,target, radius){
                    const min = target-radius;
                    const max = target+radius;
                    return toTest >= min && toTest <=max
                        ? 0
                        : 1;
                }
                plugin[cardinal].ticks.forEach(tick => 
                    tick.container.style.opacity = isWithin(tick.percent, data[cardinal],5)
                );
            })
        }else{
            cardinals.forEach(cardinal =>{
                plugin[cardinal].ticks.forEach(tick => 
                    tick.container.style.opacity = 1
                );
            })
        }
    },

    beforeDestroy(){
        const plugin = this;
        cardinals.forEach(cardinal =>{
            plugin[cardinal].ticks.forEach(tick => tick.container.remove());
            plugin[cardinal].container.remove();
        })
    }
});

function drawTrident(chart, plugin, opts = {}){
    const line = {
        width: 2,
        color: "gray",
        ...(opts.line || {})
    };
    const coor = opts.coor ?? [
        chart._cursorPosition.x,
        chart._cursorPosition.y
    ]

    const canvasLocation = getCanvasLocation(chart);
    const data = SquareToTriangleCoor(DOMToSquareCoor(chart,coor));

    const edgePoints = {
        right: getPixel(chart.scales,[100-data.right,data.right]),
        left: getPixel(chart.scales,[data.left,0]), 
        bottom: getPixel(chart.scales,[0,data.left+data.right])
    }

    const ctx = chart.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(...coor);
    ctx.lineTo(edgePoints.right.x,edgePoints.right.y);
    ctx.moveTo(...coor);
    ctx.lineTo(edgePoints.left.x,edgePoints.left.y);
    ctx.moveTo(...coor);
    ctx.lineTo(edgePoints.bottom.x,edgePoints.bottom.y);
    ctx.lineWidth = line.width;
    ctx.strokeStyle = line.color;
    ctx.stroke();
    ctx.restore();

    cardinals.forEach(cardinal=>{
        const thisData = data[cardinal];

        plugin[cardinal].text.textContent = thisData.toFixed(0)+"%"
        plugin[cardinal].container.style.left = canvasLocation.x + edgePoints[cardinal].x+ 'px';
        plugin[cardinal].container.style.top = canvasLocation.y + edgePoints[cardinal].y+ 'px';
        plugin[cardinal].container.style.visibility = "visible";
    });
}

function clearTrident(chart,plugin){
    cardinals.forEach(cardinal=>{
        plugin[cardinal].container.style.visibility = "hidden";
    });
}

function initializeTickDOM(chart, plugin){
    const canvasLocation = getCanvasLocation(chart);
    const container = chart.canvas.parentNode;

    cardinals.forEach(cardinal=>{
        plugin[cardinal].ticks=
            [10,20,30,40,50,60,70,80,90,100].map(percent=>{
                var coor;
                if (cardinal === "left") 
                    coor = getPixel(chart.scales,[percent,0])
                else if (cardinal === "right") 
                    coor = getPixel(chart.scales,[100-percent,percent])
                else if (cardinal === "bottom")
                    coor = getPixel(chart.scales,[0,100-percent])

                const tickContainer = make('div',{className: `triangle-help-label animated ${cardinal}`});
                const tickText = make("span",{textContent:percent});
                tickContainer.append(make("div",{},[tickText]))
                container.append(tickContainer);

                tickContainer.style.left = canvasLocation.x + coor.x+ 'px';
                tickContainer.style.top = canvasLocation.y + coor.y+ 'px';

                return {container: tickContainer, text: tickText, percent}; 
            })
    });

    plugin._initialized = true;
}

function initializeLabelDOM(chart,plugin){
    const container = chart.canvas.parentNode;
    
    cardinals.forEach(cardinal=>{
        plugin[cardinal]={
            container: make('div',{className: `triangle-help-label ${cardinal}`}),
            text: make("span")
        }
        plugin[cardinal].container.append(
            make("div",{},[plugin[cardinal].text])
        )
        container.append(plugin[cardinal].container);
    })
}

// --------------------------------------------------------------------------------------
//
// Plugin for helping lines toward the Cursor whenever the user clicks on an item
// 
//
export const lineOnClickPluginFactory = pluginConfig => ({
    selectedPoint: undefined,
    hidden: false,

    afterInit(chart){
        initializeLabelDOM(chart,this)
    },

    afterEvent(chart, args){
        if (this.hidden) return;
        if (args.event.type !== "click") return;

        const [element] = chart.getElementsAtEventForMode(
            args.event,
            "nearest",
            { intersect: true },
            false
        );

        this.selectedPoint = element
            ? [ element.element.x, element.element.y ]
            : undefined;

        chart.update();
    },

    beforeUpdate(chart){
        const anns = chart.options.plugins.annotation?.annotations;
        const data = this.selectedPoint
            ? SquareToTriangleCoor(DOMToSquareCoor(chart,this.selectedPoint))
            : {left: Infinity, right: Infinity, bottom: Infinity}

        cardinals.forEach(cardinal =>{
            const thisRoundedData = roundToDecimals(data[cardinal],-1);
            for (let percent = 10; percent <= 100; percent += 10) {
                const ann = anns[cardinal+"_tick_" +percent];
                if (!ann) continue;
                ann.display = thisRoundedData != ann.content;
            }
        });
    },

    beforeDraw(chart){
        if (this.hidden) return;
        if (!this.selectedPoint) return clearTrident(chart, this);
        drawTrident(chart,this, { coor: this.selectedPoint });
    }
})

function DOMToSquareCoor(chart,coor){
    return [
        chart.scales.x.getValueForPixel(coor[0]),
        chart.scales.y.getValueForPixel(coor[1])
    ]
}

function SquareToTriangleCoor(coor){
    const left = coor[1];
    const right = coor[0] - 0.5 * left;
    return { left, right, bottom: 100-left-right}
}

function getCanvasLocation(chart){
    const canvasRect = chart.canvas.getBoundingClientRect();
    return{
        x: canvasRect.left + window.pageXOffset,
        y: canvasRect.top + window.pageYOffset
    }
}