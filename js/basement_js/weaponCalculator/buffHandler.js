import { make } from "../util/injectionUtil.js"
import * as messageHandler from "./messageHandler.js"

export class Buff{
    constructor({
        parent,
        staticData, 
        statOverride = []}
    ){
        Object.assign(this, staticData);
        this.parent = parent;
        this.image = make("img",{
            src:"/media/owo_images/battleEmojis/" + this.slug + ".png" ,
            ariaLabel: this.slug,
            alt:":"+this.slug+":",
            draggable:false,
            className:"discord-embed-emote weapon-desc-image",
        });

        this.stats = this.statConfig.map((statConfig,i) => ({
            noWearConfig: statConfig, 
            noWear: statOverride[i]
        }));

        this.parent.buffs.push(this);
        appendBuffNode(this);
    }

    get wear(){
        return this.parent.wear;
    }
    get wearName(){
        return this.parent.wearName;
    }
    get wearBonus(){
        return this.parent.wearBonus;
    }
}

export function appendBuffNode(buff) {
    const wrapper = make("div",{className:"buff-item"});

    const title = make("strong",{
        innerHTML: " "+buff.name+" - "
    })

    wrapper.append(
        buff.image, 
        title,
        messageHandler.generateDescription(buff),
    );
    buff.parent.bList.appendChild(wrapper);
}