import { createRangedInput,createStatTooltip,make } from '../weaponCalculator/weaponCalcElementHelper.js'
import { valueToPercent, percentToValue, getRarity,getStat,getShardValue,syncWear,calculateQualities,getStatImage,getWeaponImagePath,getTierEmoji, getTierEmojiPath, getWearConfig } from '../weaponCalculator/weaponCalcUtil.js'
import { generatePassiveInputs } from './weaponCalcPassive.js';
import { weaponToBlueprintString } from './blueprintParser.js';

const el = {
	weaponHeader:	    document.getElementById("weaponHeader"), 
	weaponName:		    document.getElementById("weaponName"),
	ownerID:		    document.getElementById("ownerID"),
	weaponID:		    document.getElementById("weaponID"),
	shardValue:		    document.getElementById("shardValue"),
	weaponQualityImage: document.getElementById("weaponQualityImage"),
    weaponQualitySpan:  document.getElementById("weaponQualitySpan"),
	weaponImage: 	    document.getElementById("weaponImage"),
	wpCost:			    document.getElementById("WP-Cost"),
	description:	    document.getElementById("description")
}

async function generateDescription(weaponOrPassive,weapon) {
    const TOKEN_SPECS = [
        { name: "STAT",   pattern: "\\[stat\\]"},         // literal [stat]
        { name: "IMAGE",  pattern: ":[A-Za-z0-9_+]+:"},   // :emojiName:
        { name: "BOLD",   pattern: "\\*\\*[^*]+\\*\\*"},  // **bold**
        { name: "ITALIC", pattern: "\\*[^*]+\\*"},        // *italic*
        { name: "NEWLINE",pattern: "\\r?\\n"}             // newline
    ];

    const tokenRegex = new RegExp("(" + TOKEN_SPECS.map(s => s.pattern).join("|") + ")", "g");
    
    const NEWLINE_RE = /^\r?\n$/;
    const STAT_TOKEN = "[stat]";
    const IMAGE_RE = /^:([A-Za-z0-9_+]+):$/;
    const BOLD_RE = /^\*\*([^*]+)\*\*$/;
    const ITALIC_RE = /^\*([^*]+)\*$/;

    // This is the opposite of DRY, I am aware, but I have no idea how to fix.

    const parts      = weaponOrPassive.description.split(tokenRegex);
    let statIndex = 0;
    
    return make("div",
        {style:{ display: "inline", whiteSpace: "normal", lineHeight: "1.4rem"}},
        await Promise.all(parts.map(elif))
    );

    async function elif(part){
        if (NEWLINE_RE.test(part)) return document.createElement("br")
        if (part === STAT_TOKEN) return getStatNode()
        const imgMatch = part.match(IMAGE_RE);
        if (imgMatch) return await getStatImage(imgMatch[1],"weapon-desc-image")
        const boldMatch = part.match(BOLD_RE);
        if (boldMatch) return make("span",{style:{fontWeight: "bold"},textContent: boldMatch[1]})
        const italicMatch = part.match(ITALIC_RE);  
        if (italicMatch) return make("span",{style:{fontStyle: "italic"},textContent: italicMatch[1]})
        return document.createTextNode(part);
    }

    function getStatNode(){
        const [stat, statConfig] = getStat(
            statIndex,
            weaponOrPassive.objectType === "passive"
                ? weaponOrPassive.stats
                : weaponOrPassive.product.blueprint.stats,
            weaponOrPassive.statConfig
        );
        stat.IO = new WeaponStat(stat, statConfig, weaponOrPassive, weapon);
        const toAppend = stat.IO.render();
        statIndex++;
        return toAppend;
    }
}


async function generateWPInput(weapon){
    const [stat, statConfig] = getStat(
        "WP-Cost",
        weapon.product.blueprint.stats,
        weapon.statConfig
    );
    const child = stat
        ? (stat.IO = new WeaponStat(stat, statConfig, weapon, weapon), stat.IO.render())
        : `\u00A0${0}\u00A0`;

    const WPimage = await getStatImage("WP");

    return make("div",
        {
            innerHTML:"<strong>WP Cost:&nbsp;</strong>",
            style: {display: "flex", alignItems: "center"}
        },
        [child,WPimage]
    );
}

class WeaponStat {
    constructor(stat, config, weaponOrPassive, weapon) {
        this.stat            = stat;
        this.config          = config;
        this.weaponOrPassive = weaponOrPassive;
        this.weapon          = weapon;

        syncWear(this.weapon);
        this._buildDOM();
        const temp = percentToValue(this.stat.noWear, getWearConfig(this.config,this.wear));
        this._syncAll(+temp.toFixed(6));
    }

    get wearBonus() {
        return this.weapon.product.blueprint.wearBonus;
    }
    
    get wear() {
        return this.weapon.product.blueprint.wear;
    }

    get percentageConfig() {
        const bonus = this.wearBonus;
        return {
            bonus:  bonus,
            min:    bonus,
            max:    100 + bonus,
            range:  100, step: 1, unit: '%', digits: 3
        };
    }

    _buildDOM() {
        this.outerWrapper = make("div",{className:"outerInputWrapperFromCalculator"});
        this.wrapper      = make("div",{className:"inputWrapperFromCalculator tooltip-lite"});
        this.numberInput  = createRangedInput("number", getWearConfig(this.config,this.wear));
        this.numberLabel  = this.config.unit?
                            make("span",{
                                className:"smol-right-margin",
                                textContent:this.config.unit
                            }):"";
        this.qualityInput = createRangedInput("number", this.percentageConfig, {height:"1.5rem"});
        this.qualityLabel = make("span",{
                                className:"smol-right-margin",
                                textContent:"%"
                            });
        this.slider       = createRangedInput("range",  getWearConfig(this.config,this.wear));
        this.img          = getTierEmoji(getRarity(this.stat.withWear));
        this.tooltip      = createStatTooltip([ this.img, this.qualityInput, this.qualityLabel, this.slider ]);

        this.wrapper.append(
            this.numberInput,
            this.numberLabel,
            this.tooltip
        );
        this.outerWrapper.append(this.wrapper);

        this._wireEvents();
    }

    _wireEvents() {
        const clamp = (val, el) => {
            const min = parseFloat(el.min);
            const max = parseFloat(el.max);
            const step = parseFloat(el.step);

            const offset = (val - min) / step;
            const snapped = min + Math.round(offset) * step;
            const clamped = Math.min(max, Math.max(min, snapped));

            this._syncAll(clamped);
        };

        this.numberInput.addEventListener("input",  e => {
            const num = parseFloat(e.target.value);
            if (!isNaN(num) && 
                !(e.inputType === "insertText" && e.data === ".")
            ){
                this._syncAll(num);
            }
        });
        this.slider     .addEventListener("input",  e => this._syncAll(+e.target.value) );
        this.qualityInput.addEventListener("input", e => {
            const pct = parseFloat(e.target.value);
            if (!isNaN(pct)) {
                this._syncAll(percentToValue(pct, this.config));
            }
        });

        this.numberInput.addEventListener("change",  e => clamp(+e.target.value, e.target) );
        this.qualityInput.addEventListener("change", e => {
            const val = percentToValue(+e.target.value, this.config);
            clamp(val, this.numberInput);
        });
    }

    _syncAll(value) {
        this.numberInput.value  = value;
        this.slider.value       = value;

        const pct       = valueToPercent(value, this.config);
        const noWearPct = valueToPercent(value, getWearConfig(this.config,this.wear));

        this.qualityInput.value = pct;
        this.img.src            = getTierEmojiPath(pct);
        this.stat.noWear = noWearPct;

        syncWear(this.weapon);
        calculateQualities(this.weapon);
        displayInfo(this.weapon);
        changePassiveEmote(this.weaponOrPassive);
        weaponToBlueprintString(this.weapon)
    }

    update(productStat, config, weaponOrPassive, weapon) {
        this.stat            = productStat;
        this.config          = config;
        this.weaponOrPassive = weaponOrPassive;
        this.weapon          = weapon;

        [this.numberInput, this.slider].forEach(el => {
            const { min, max, step } = getWearConfig(this.config,this.wear);
            el.min = Math.min(min, max);
            el.max = Math.max(min, max);
            el.step  = step;
        });

        Object.assign(this.qualityInput, this.percentageConfig);

        const temp = percentToValue(this.stat.noWear, getWearConfig(this.config,this.wear));
        this._syncAll(+temp.toFixed(6));
    }

    justUpdateDumbass(){
        this.update(this.stat,this.config,this.weaponOrPassive,this.weapon);
    }

    render() {
        return this.outerWrapper;
    }

}

function changePassiveEmote(passive){
    if (passive.objectType == "passive"){
        passive.image.src= getWeaponImagePath(passive);
    }
}

function displayInfo(weapon){
    const blueprint = weapon.product.blueprint;

    el.weaponHeader.textContent=weapon.product.owner.displayName+"'s "+blueprint.wearName+weapon.name;
    el.weaponName.innerHTML="<strong>Name:&nbsp;</strong> " + weapon.name;
    el.ownerID.innerHTML="<strong>Owner:&nbsp;</strong> " + weapon.product.owner.name;
    el.weaponID.innerHTML=`<strong>ID:&nbsp;</strong> <code class="discord-code" style="font-size: 0.8rem; height: 1rem; line-height: 1rem;">${weapon.product.id}</code>`;
    el.shardValue.innerHTML= "<strong>Shard Value:&nbsp;</strong> " + getShardValue(weapon);
    el.weaponQualityImage.src= getTierEmojiPath(blueprint.tier);
    el.weaponQualitySpan.textContent= blueprint.qualityWear.toFixed(1)+"%"
    el.weaponImage.src=getWeaponImagePath(weapon);
}

async function generateEverything(weapon){
	await generateStatInputs(weapon);
	displayInfo(weapon);
	generatePassiveInputs(weapon);
}

function updateEverything(weapon){
	updateStatInputs(weapon);
	displayInfo(weapon);
}

async function generateStatInputs(weapon){
	el.wpCost.replaceChildren(await generateWPInput(weapon));
	el.description.replaceChildren(await generateDescription(weapon,weapon));
}

async function updateStatInputs(weapon){
    const blueprint = weapon.product.blueprint;
    blueprint.passive.forEach(passive => {
        passive.stats.forEach((stat,statIndex) => {
            const [_, statConfig] = getStat(
                statIndex,
                passive.stats,
                passive.statConfig
            );
            stat.IO.update(stat,statConfig, passive, weapon);
        });
    });
    blueprint.stats.forEach((stat,statIndex) => {
        const [_, statConfig] = getStat(
                    statIndex,
                    weapon.product.blueprint.stats,
                    weapon.statConfig
                );
        stat.IO.update(stat,statConfig, weapon, weapon)
    });
}

export { generateDescription,updateEverything,generateEverything,displayInfo };