import { make } from "/js/util/injectionUtil.js";

export const cardinals = ["left","right","bottom"]

export function getX(coor){
    const [topStat, rightStat] = coor;
    return rightStat + 0.5 * topStat;
}
export function getY(coor){
    const [topStat, rightStat] = coor;
    return topStat;
}

function getPosition(leftAttr, rightAttr, bottomAttr){
    const sum = [...leftAttr, ...rightAttr, ...bottomAttr]
        .reduce((acc, num) => acc + num, 0);
    const right = 100 * (rightAttr.reduce((acc, num) => acc + num, 0)) / sum;
    const left = 100 * (leftAttr.reduce((acc, num) => acc + num, 0)) / sum;
    return [left, right];
}

export function getPixel(scales, coor){
    const x = getX(coor);
    const y = getY(coor);
    return {
        x:scales.x.left   + (x - scales.x.min) * (scales.x.width  / (scales.x.max - scales.x.min)),
        y:scales.y.bottom - (y - scales.y.min) * (scales.y.height / (scales.y.max - scales.y.min))
    }
}

function handleDataPoints(data) {
    return data.array.map(pet => {
        const imgEl = new Image();
        imgEl.src = pet.image;
        imgEl.height = data.imageSize.height;
        imgEl.width = data.imageSize.width;
        const coor = getPosition(
            data.attributeGroups.left.map(i => pet.attributes[i]),
            data.attributeGroups.right.map(i => pet.attributes[i]),
            data.attributeGroups.bottom.map(i => pet.attributes[i])
        );

        return {
            x: getX(coor),
            y: getY(coor),
            label: pet.name,
            imageEl: imgEl,
            attributes: pet.attributes,
        };
    });
}

export function buildTriangleDataset(dataSetConfig){
    return {
        data: handleDataPoints(dataSetConfig),
        pointStyle: ctx => ctx.raw.imageEl,
        radius: dataSetConfig.radius,
        hoverRadius: dataSetConfig.hoverRadius,
        hidden: false,
        clip: false
    };
}

const imageCache = new Map(); // -> Promise<Image>

export async function createLabelImage({elements, arrow}) {
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

export function initializeLabelDOM(chart,plugin){
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

export function initializeTickDOM(chart, plugin){
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

export function DOMToSquareCoor(chart,coor){
    return [
        chart.scales.x.getValueForPixel(coor[0]),
        chart.scales.y.getValueForPixel(coor[1])
    ]
}

export function SquareToTriangleCoor(coor){
    const left = coor[1];
    const right = coor[0] - 0.5 * left;
    return { left, right, bottom: 100-left-right}
}

export function getCanvasLocation(chart){
    const canvasRect = chart.canvas.getBoundingClientRect();
    return{
        x: canvasRect.left + window.pageXOffset,
        y: canvasRect.top + window.pageYOffset
    }
}

export function drawTrident(chart, plugin, opts = {}){
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

export function clearTrident(chart,plugin){
    cardinals.forEach(cardinal=>{
        plugin[cardinal].container.style.visibility = "hidden";
    });
}