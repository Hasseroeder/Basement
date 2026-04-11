import { make } from "/js/util/injectionUtil.js";
import { cardinals, clearTrident, drawTrident, SquareToTriangleCoor, DOMToSquareCoor, initializeTickDOM, initializeLabelDOM, createLabelImage, getPixel, buildTriangleDataset, getX, getY } from "./triangleUtils.js";
import { roundToDecimals } from "/js/util/inputUtil.js";

// --------------------------------------------------------------------------------------
//
// Plugin wrapper around one or more dataset configs.
// Keeps module init surface as "plugins only" while still producing datasets.
//
//
export const dataSetPluginFactory = pluginConfig => ({
    dataSets: (pluginConfig.data?.dataSetConfigs ?? []).map(buildTriangleDataset),

    beforeInit(chart){
        chart.data.datasets = this.dataSets;
    },

    set hidden(value){
        (this.dataSets ?? []).forEach(dataSet => dataSet.hidden = value);
    },
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
export const advancedLabelPluginFactory = pluginConfig => ({
    hidden: false,

    beforeUpdate(chart){
        const groupName = pluginConfig.data.groupName;
        const anns = Object.values(chart.options.plugins.annotation.annotations);
        anns.filter(ann => ann.group === groupName)
            .forEach(ann => ann.display = !this.hidden)
    },

    beforeInit(chart) {
        function scaleToFit(naturalW, naturalH,  maxH) {
            const ratio = Math.min(maxH / naturalH, 1);
            return { width: Math.round(naturalW * ratio), height: Math.round(naturalH * ratio) };
        }

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
        initializeLabelDOM(chart,this);

        this._updateOnVisible = function (){
            !this.hidden && chart.update()
        }
        chart.canvas.parentNode.addEventListener('mousemove', this._updateOnVisible);
    },

    beforeDraw(chart) {
        const plugin = this;
        !plugin._initialized && initializeTickDOM(chart, plugin);

        cardinals.forEach(cardinal =>{
            plugin[cardinal].ticks.forEach(tick => {
                var coor;
                if (cardinal === "left") 
                    coor = getPixel(chart.scales,[tick.percent,0])
                else if (cardinal === "right") 
                    coor = getPixel(chart.scales,[100-tick.percent,tick.percent])
                else if (cardinal === "bottom")
                    coor = getPixel(chart.scales,[0,100-tick.percent])

                tick.container.style.left = coor.x + 'px';
                tick.container.style.top = coor.y + 'px';
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

    beforeDestroy(chart){
        const plugin = this;
        cardinals.forEach(cardinal =>{
            plugin[cardinal].ticks.forEach(tick => tick.container.remove());
            plugin[cardinal].container.remove();
        })
        chart.canvas.parentNode.removeEventListener('mousemove', this._updateOnVisible);
    }
});

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

// --------------------------------------------------------------------------------------
//
// Plugin for pretty tooltip that looks like this:
//  _______________________
// / Hedgebot              \
// | :hp: 7 :str: 0 :pr: 6 |
// | :wp: 2 :mag: 0 :mr: 6 |
// \_______________________/
//
export const tooltipPluginFactory = pluginConfig => ({
    beforeInit(chart){
        const plugin = this;
        const externalTooltipHandler = context => {
            const { chart, tooltip } = context;
            if (!plugin.tooltipEl) {
                const statImageSources = [
                    "./media/owo_images/battleEmojis/HP.png",
                    "./media/owo_images/battleEmojis/STR.png",
                    "./media/owo_images/battleEmojis/PR.png",
                    "./media/owo_images/battleEmojis/WP.png",
                    "./media/owo_images/battleEmojis/MAG.png",
                    "./media/owo_images/battleEmojis/MR.png",
                ];
                plugin.tooltipEl = make('div', { className: 'triangle-tooltip' });
        
                plugin.rows = [ make('div'), make('div'), make('div') ];
                plugin.tooltipEl.append(...plugin.rows);
                plugin.statTexts = [];

                const statCells = [];
        
                statImageSources.forEach(src => {
                    const text = document.createTextNode('');
                    const img = make('img', { src });
                    const cell = make('div', {}, [img, text]);
                    plugin.statTexts.push(text);
                    statCells.push(cell);
                });
        
                statCells.slice(0, 3).forEach(cell => plugin.rows[1].append(cell));
                statCells.slice(3).forEach(cell => plugin.rows[2].append(cell));
        
                chart.canvas.parentNode.append(plugin.tooltipEl);
            }
        
            plugin.tooltipEl.style.opacity = tooltip.opacity;
            if (tooltip.opacity === 0 || tooltip.dataPoints.length === 0) return; 
        
            const { label, attributes } = tooltip.dataPoints[0].raw;
        
            plugin.rows[0].textContent = label;
            plugin.statTexts.forEach((text, i) => 
                text.textContent = ' ' + attributes[i]
            );
        
            plugin.tooltipEl.style.left = tooltip.caretX + 5 + "px";
            plugin.tooltipEl.style.top = tooltip.caretY + 5 + "px";
            // hardcoded offset is stupid
        };

        chart.options.plugins.tooltip.external = externalTooltipHandler;
    },

    beforeDestroy(){
        this.tooltipEl?.remove();
    }
})