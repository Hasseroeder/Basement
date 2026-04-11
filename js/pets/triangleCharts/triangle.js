import { make } from "/js/util/injectionUtil.js";
import { Module } from "./module.js";

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
        {style:`width: ${outerWidth}px; height:${outerHeight}px; position: relative;`},
        [ctx]
    ))
    
    const myChart = new Chart(ctx, {
        type: 'scatter',
        plugins: plugins,
        options: {
            animation: false,
            maintainAspectRatio: false,
            layout: {padding:additionalPadding},
            plugins: {
                tooltip: { mode: 'nearest', enabled: false, animation: false },
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