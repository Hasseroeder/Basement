import * as PluginHelper from "./trianglePlugins.js"

export class Module {
    constructor(opts){
        const {pluginConfigs,id} = opts;

        this.id = id;
        this.plugins = (pluginConfigs ?? []).map(
            pluginConfig => PluginHelper[pluginConfig.factory](pluginConfig) 
        )
    }

    set hidden(bool){
        this.plugins.forEach(plugin=>plugin.hidden = bool);
    }
}