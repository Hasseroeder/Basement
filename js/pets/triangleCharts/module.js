import { getX, getY } from "./triangleUtils.js";
import * as PluginHelper from "./trianglePlugins.js"

export class Module {
    constructor(opts){
        const {pluginConfigs,dataSetConfigs,id} = opts;

        const handleDataPoints = data => data.array.map(pet => {
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

        const handleDataSetConfig = dataSetConfig => ({
            data: handleDataPoints(dataSetConfig),
            pointStyle: ctx => ctx.raw.imageEl,
            radius: dataSetConfig.radius, 
            hoverRadius: dataSetConfig.hoverRadius, 
            hidden: false, 
            clip:false
        })

        this.id = id;
        this.dataSets = (dataSetConfigs ?? []).map(handleDataSetConfig);
        this.plugins = (pluginConfigs ?? []).map(
            pluginConfig => PluginHelper[pluginConfig.factory](pluginConfig) 
        )
    }

    set hidden(bool){
        this.dataSets.forEach(dataSet=>dataSet.hidden = bool);
        this.plugins.forEach(plugin=>plugin.hidden = bool);
    }
}