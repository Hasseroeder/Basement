import * as PluginHelper from "./trianglePlugins.js"
import { make } from "../../util/injectionUtil.js";
import { getX, getY } from "./triangleUtils.js";

const dataPoints = data => data.array.map(pet => {
    function getPosition(
        leftAttr,
        rightAttr,
        bottomAttr
    ){
        const sum   = [...leftAttr,...rightAttr,...bottomAttr].reduce((acc, num) => acc + num, 0);
        const right = 100*(rightAttr.reduce((acc, num) => acc + num, 0))/sum;
        const left   = 100*(leftAttr.reduce((acc, num) => acc + num, 0))/sum;
        return [left, right];
    }
    
    const imgEl = new Image();
    imgEl.src = pet.image;
    imgEl.height=data.imageSize.height;
    imgEl.width=data.imageSize.width;
    const [left, right] = getPosition(
        data.attributeGroups.left.map(i => pet.attributes[i]),
        data.attributeGroups.right.map(i => pet.attributes[i]),
        data.attributeGroups.bottom.map(i => pet.attributes[i])
    )

    return {
        x: getX(left, right),
        y: getY(left, right),
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
        polygon:                PluginHelper.polygonPluginFactory,
        simpleLabel:            PluginHelper.simpleLabelPluginFactory,
        advancedLabel:          PluginHelper.advancedLabelPluginFactory,
        ticks:                  PluginHelper.triangleTickPluginFactory,
        line:                   PluginHelper.triangleLinePluginFactory,
        cursorLine:             PluginHelper.cursorLinePluginFactory,
        cursorLine_with_ticks:  PluginHelper.cursorLine_with_ticksPluginFactory
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