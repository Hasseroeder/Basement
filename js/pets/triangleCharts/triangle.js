import { make } from "../../util/injectionUtil.js";
import { Module } from "./module.js";

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
    const {moduleConfigs, baseConfig, buttonConfigs} = this.data;

    const constantPadding = 10; // this is unavoidable due to chart.js annoyingness
    const additionalPadding =baseConfig.additionalPadding;
    const outerWidth   = 480;
    const innerWidth   = outerWidth - additionalPadding.left - additionalPadding.right - constantPadding*2;
    const innerHeight  = innerWidth * (Math.sqrt(3)/2);
    const outerHeight  = innerHeight + additionalPadding.top + additionalPadding.bottom + constantPadding*2;

    const ctx = make("canvas");
    const modules = moduleConfigs.map(moduleConfig => new Module(moduleConfig));

    const datasets = modules.map(module=>module.dataSets).flat();
    const plugins = modules.map(module=>module.plugins).flat();

    const initFns = [];

    if (buttonConfigs && buttonConfigs.length > 0){
        const buttonWrapper = make("div",{className: "triangle-button-wrapper"})
        buttonConfigs.forEach(buttonConfig=>{
            const button = make("button");
            const children = [];
            if (buttonConfig.image)
                children.push(make("img",buttonConfig.image));
            const textEl = make("div");
            children.push(textEl);
            if (buttonConfig.prettyName)
                textEl.textContent = buttonConfig.prettyName;

            if (buttonConfig.type==="cycle"){
                buttonWrapper.append(button);    
                const cycle = buttonConfig.cycle;
                var idx = cycle.length-1;
                button.onclick = () => {
                    const {turnOn, turnOff} = cycle[idx];
                    modules.forEach(module => {
                        if ((turnOn ?? []).includes(module.id)) module.hidden = false;
                        if ((turnOff ?? []).includes(module.id)) module.hidden = true;
                    });
                    textEl.textContent = cycle[idx].nameTo;
                    idx = (idx + 1) % cycle.length;
                    myChart.update();
                }
                initFns.push(()=>button.click()); // very inelegant
            }else if (buttonConfig.type==="link"){
                buttonWrapper.append(
                    make("a",{href:buttonConfig.href, target:"_blank"},[button])
                );
            }
            button.append(...children);
        })
        container.append(buttonWrapper);
    }

    container.append(make("div",
        {style:`width: ${outerWidth}px; height:${outerHeight}px;`},
        [ctx]
    ))
    
    const myChart = new Chart(ctx, {
        type: 'scatter',
        plugins: plugins,
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
    initFns.forEach(fn=>fn());
}