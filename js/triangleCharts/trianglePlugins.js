export const polygonPluginFactory = polygonData =>({
    beforeDraw: chart => {
        const ctx = chart.ctx;
        ctx.save();

        polygonData.forEach(polygon => {
            ctx.fillStyle = polygon.color;
            ctx.beginPath();

            polygon.coors.forEach((pt, i) => {
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

export const polygonLabelPluginFactory = labelData => ({    
    toggle(override) {
        const {groupName} = labelData;
        const anns = Object.values(this.chart.options.plugins.annotation.annotations);
        anns.filter(ann => ann.group === groupName)
            .forEach(ann => ann.display = override ?? !ann.display)
        this.chart.update();    
    },

    beforeInit(chart) {
        this.chart = chart;
        const anns = chart.options.plugins.annotation.annotations;
        const {labels, groupName} = labelData;

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

export const triangleBasePluginFactory = ({lines= true, labels = true} = {}) =>({
    beforeInit: chart => {
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

export const labelPluginFactory = labelData => ({
    beforeInit(chart) {
        this.chart = chart;
        const anns = chart.options.plugins.annotation.annotations;
        
        labelData.forEach( async ({id, elements, coor, rotation = 0}) =>{
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