const imageCache = new Map();        // -> Promise<Image>

export const polygonPlugin = {
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

export const externalTooltipHandler = (context) => {
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

export async function getLinesAndLabels(stats){
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
                xMin: getX(...start),
                yMin: getY(...start),
                xMax: getX(...end),
                yMax: getY(...end),
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
    stats.forEach(async (stat,i) => {        
        const src = await createLabelImage(stat);
        const image = await loadImage(src);

        const { width, height } = scaleToFit(image.naturalWidth, image.naturalHeight, 20);

        labels["BigLabel_"+i] = {
            type: 'label',
            content: image,
            width,
            height,
            rotation: [-rightRotation, rightRotation,0][i],
            xValue: getX(...positions[i]),
            yValue: getY(...positions[i])
        };
    });
    return {lines,labels};
}

function scaleToFit(naturalW, naturalH,  maxH) {
    const ratio = Math.min(maxH / naturalH, 1);
    return { width: Math.round(naturalW * ratio), height: Math.round(naturalH * ratio) };
}

export function loadImage(src) {
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

    const imgs = await Promise.all(item.imageSrc.map(loadImage));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.font = font;
    const metrics = ctx.measureText(item.text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(
        (metrics.actualBoundingBoxAscent || 0) + (metrics.actualBoundingBoxDescent || 0) || parseInt(font, 10)
    );

    const scaleFactor = 2;
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

export function getPolygonLabels(polygonLabels, colors){
    const labelObject = {};
    polygonLabels.forEach(({text, coor},i) =>{
        labelObject[text+"label"]={
            type:"label",
            content:text,
            xValue: getX(...coor),
            yValue: getY(...coor),
            color: colors[i],
            font: {
                size: 16,
                weight:"bold"
            }
        };
    });
    return labelObject;
}