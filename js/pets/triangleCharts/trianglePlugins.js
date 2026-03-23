import { make } from "/js/util/injectionUtil.js";
import { getX, getY } from "./triangleUtils.js";
// --------------------------------------------------------------------------------------
//
// Plugin for the basic polygons
//
//
export const polygonPluginFactory = pluginConfig =>({
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
export const simpleLabelPluginFactory = pluginConfig => ({ 
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
export const triangleTickPluginFactory = pluginConfig =>({
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
export const triangleLinePluginFactory = pluginConfig =>({
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

export const advancedLabelPluginFactory = pluginConfig => ({
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
export const cursorLinePluginFactory = pluginConfig => ({
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
        const plugin = this;

        ["left","right","bottom"].forEach(name=>{
            plugin[name]={
                container: make('div',{className: `triangle-help-label ${name}`}),
                text: make("span")
            }
            plugin[name].container.append(
                make("div",{},[plugin[name].text])
            )
            container.append(plugin[name].container);
        })

        container.addEventListener('mousemove', function() {
            if(plugin.shouldShow()) chart.update()
        });
    },

    afterDraw(chart) {             
        if (!chart._cursorPosition || !this.shouldShow()) return;

        const plugin = this;
        const ctx = chart.ctx;
        const {x,y} = chart.scales;

        const canvasRect = chart.canvas.getBoundingClientRect();

        const squareDataX = x.getValueForPixel(chart._cursorPosition.x);
        const squareDataY = y.getValueForPixel(chart._cursorPosition.y);

        const left = squareDataY;
        const right = squareDataX - 0.5 * left;
        const data = { left, right, bottom: 100-left-right}

        const edgePoints = {
            right: {
                x:  getPixelForX(x, getX(100-data.right,data.right)),
                y:  getPixelForY(y, getY(100-data.right,data.right))
            },
            left: {
                x:  getPixelForX(x, getX(data.left,0)),
                y:  getPixelForY(y, getY(data.left,0))
            }, 
            bottom:{
                x:  getPixelForX(x, getX(0,data.left+data.right)),
                y:  getPixelForY(y, getY(0,data.left+data.right))
            }
        }

        if (
            data.left >= 0 &&
            data.right >= 0 &&
            data.bottom >= 0
        ){
            const cursorPos = [chart._cursorPosition.x, chart._cursorPosition.y]
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(...cursorPos);
            ctx.lineTo(edgePoints.right.x,edgePoints.right.y);
            ctx.moveTo(...cursorPos);
            ctx.lineTo(edgePoints.left.x,edgePoints.left.y);
            ctx.moveTo(...cursorPos);
            ctx.lineTo(edgePoints.bottom.x,edgePoints.bottom.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'gray';
            ctx.stroke();
            ctx.restore();

            const constX = canvasRect.left + window.pageXOffset;
            const constY = canvasRect.top + window.pageYOffset;

            ["left","right","bottom"].forEach(name=>{
                plugin[name].text.textContent = data[name].toFixed(0)+"%"
                plugin[name].container.style.left = constX + edgePoints[name].x+ 'px';
                plugin[name].container.style.top = constY + edgePoints[name].y+ 'px';
                plugin[name].container.style.visibility = "visible";
            });
        }
        else{
            this.left.container.style.visibility = "hidden";
            this.right.container.style.visibility = "hidden";
            this.bottom.container.style.visibility = "hidden";
        }
    },

    beforeDestroy(){
        this.left.container.remove();
        this.right.container.remove();
        this.bottom.container.remove();
    }
});

function getPixelForY(scale, data){
    return scale.bottom - (data - scale.min) * (scale.height / (scale.max - scale.min));
}

function getPixelForX(scale,data){
    return scale.left + (data - scale.min) * (scale.width / (scale.max - scale.min));
}