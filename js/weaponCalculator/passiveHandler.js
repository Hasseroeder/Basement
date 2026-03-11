import * as messageHandler from "./messageHandler.js"
import * as buffHandler from "./buffHandler.js";
import { getRarity, wpEmojiPath } from './util.js';
import { make } from "../util/injectionUtil.js"

const pList = document.querySelector(".passiveContainer");

export function appendPassiveNode(passive) {
    const wrapper = make("div",{className:"passive-item"});
    passive.image.onclick = () => {passive.remove(); wrapper.remove();}
    passive.updateQualities();

    const title = make("strong",{
        innerHTML: " "+passive.name+" - "
    })

    wrapper.append(
        passive.image, 
        title,
        messageHandler.generateDescription(passive),
        passive.bList
    );
    pList.appendChild(wrapper);
}

export class Passive {
    constructor({
        staticData,
        statOverride,
        wpbData,
        parent
    }){
        const { buffs } = wpbData;
        Object.assign(this, staticData);
        this.parent = parent;
        this.image = make("img",{
            ariaLabel: this.slug,
            alt:":"+this.slug+":",
            draggable:false,
            className:"discord-embed-emote weapon-desc-image passive-emote",
        });

        this.bList = make("div",{className:"buffContainer"});

        if (!statOverride) 
            statOverride = {
                base: this.statConfig.map(_=>100),
                buff: this.buffSlugs.map(slug=>
                    buffs.find(buff => buff.slug === slug).statConfig.map(_=>100)
                )
            }

        this.stats = this.statConfig.map((statConfig,i) => ({
            noWearConfig: statConfig, 
            noWear: statOverride.base[i]
        }));

        const buffGenParams = this.buffSlugs.map((slug,i) => ({
            parent: this,
            staticData: buffs.find(buff => buff.slug === slug),
            statOverride: statOverride.buff[i]
        }));
        this.buffs = [];
        buffGenParams.forEach(params => new buffHandler.Buff(params));
        
        this.parent.passives.push(this);
        appendPassiveNode(this);
    }

    get allStats(){
        return [
            ...this.stats,
            ...this.buffs.flatMap(b => b.stats)
        ].filter(Boolean)
    }

    get prefix() { return "" }

    get tier() {
        return getRarity(this.qualityWear);
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

    updateImage(){ this.image.src = wpEmojiPath(this) }

    remove() {
        this.parent.passives =
            this.parent.passives.filter(p => p !== this);

        this.parent.updateQualities();
    }

    updateQualities(){
        this.parent.updateQualities();
    }
}
