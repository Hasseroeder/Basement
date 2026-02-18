import * as messageHandler from "./messageHandler.js"
import * as buffHandler from "./buffHandler.js";
import { getRarity } from './util.js';
import { make } from "../util/injectionUtil.js"

const pList = document.querySelector(".passiveContainer");
let passives, weapons, buffs, boundWeapon;

export const bindWeapon = weapon => boundWeapon = weapon;

export function init(weaponData,passiveData,buffData){
    weapons  = weaponData;
    passives = passiveData;
    buffs = buffData;
    const pGrid = document.querySelector('.passiveGrid');
    pGrid.append(...passives.map(
        passive=>make("img",{
            className:'passiveGridImage',
            src: `media/owo_images/battleEmojis/f_${passive.slug}.png`,
            alt: passive.slug,
            title: passive.slug,
            draggable: false,
            onmousedown: () => new Passive({slug: passive.slug})
        })
    ));
}

export function appendPassiveNode(passive) {
    const wrapper = make("div",{className:"passive-item"});

    passive.image.onclick = () => {passive.remove(); wrapper.remove();}

    passive.parent.updateQualities();

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
        slug, 
        statOverride
    }){
        Object.assign(
            this, 
            passives.find(passive => passive.slug == slug)
        );
        this.parent = boundWeapon;
        this.slug = slug;
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
                    buffs.find(buff => buff.slug == slug).statConfig.map(_=>100)
                )
            }

        this.stats = this.statConfig.map((statConfig,i) => ({
            noWearConfig: statConfig, 
            noWear: statOverride.base[i]
        }));

        const buffGenParams = this.buffSlugs.map((slug,i) => ({
            parent: this,
            slug,
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

    get selfStats(){
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

    updateImage(){
        this.image.src = 
            "media/owo_images/battleEmojis/"
            + this.prefix
            + this.tier.at(0)
            + "_"
            + this.slug
            + ".png"
    }

    remove() {
        this.parent.passives =
            this.parent.passives.filter(p => p !== this);

        this.parent.updateQualities();
    }
}
