import { numberFixedString } from '../util/stringUtil.js';
import { createRangedInput,createStatTooltip,createStatWrapper,createUnitSpan } from '../weaponCalculator/weaponCalcElementHelper.js'
import { valueToPercent, percentToValue, getRarity,getStat,getShardValue,syncWear,calculateQualities,getStatImage,getWeaponImagePath,getTierEmoji, getTierEmojiPath, getWearConfig } from '../weaponCalculator/weaponCalcUtil.js'
import { clampNumber } from '../util/inputUtil.js';
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

function generateDescription(weaponOrPassive,weapon) {
    const wrapper    = document.createElement("div");
    const tokenRegex = /(\[stat\]|:[A-Za-z0-9_+]+:|\*\*[^*]+\*\*|\*[^*]+\*|\r?\n)/g;
    const parts      = weaponOrPassive.description.split(tokenRegex);

    async function renderParts(parts, wrapper) {
        let statIndex = 0;
        for (const part of parts) {
            if (/^\r?\n$/.test(part)) {
                wrapper.appendChild(document.createElement("br"));
            }else if (part === "[stat]") {
                const [stat, statConfig] = getStat(
                    statIndex,
                    weaponOrPassive.objectType === "passive"
                        ? weaponOrPassive.stats
                        : weaponOrPassive.product.blueprint.stats,
                    weaponOrPassive.statConfig
                );
                stat.IO = new WeaponStat(stat, statConfig, weaponOrPassive, weapon);
                const toAppend = stat.IO.render();
                toAppend.style.margin = "0 -0.2rem";
                wrapper.append(toAppend);
                statIndex++;
            }else if (/^:[A-Za-z0-9_+]+:$/.test(part)) {
                const key = part.slice(1, -1);
                const img = await getStatImage(key);
                const imgWrapper = document.createElement("div");
                imgWrapper.style.display = "inline-block";
                imgWrapper.append(img);
                wrapper.append(imgWrapper);
            }else if (/^\*\*([^*]+)\*\*$/.test(part)) {
                const text = part.slice(2, -2);
                const span = document.createElement("span");
                span.style.fontWeight = "bold";
                span.textContent = text;
                wrapper.append(span);
            }else if (/^\*([^*]+)\*$/.test(part)) {
                const text = part.slice(1, -1);
                const span = document.createElement("span");
                span.style.fontStyle = "italic";
                span.textContent = text;
                wrapper.append(span);
            }else{
                wrapper.append(document.createTextNode(part));
            }
        }
    }

    Object.assign(wrapper.style, {
        display:     "inline",
        whiteSpace:  "normal",
        lineHeight:  "1.4rem",
    });
    renderParts(parts, wrapper);
    return wrapper;
}

async function generateWPInput(weapon){
    const wrapper = document.createElement("div");	
    wrapper.innerHTML="<strong>WP Cost:</strong>";
    wrapper.style= "display: flex; align-items: center;";
    const [stat, statConfig] = getStat(
        "WP-Cost",
        weapon.product.blueprint.stats,
        weapon.statConfig
    );
    if (stat){
        stat.IO= new WeaponStat(stat, statConfig, weapon, weapon)
        wrapper.append(stat.IO.render());
    }else{
        wrapper.append("\u00A0"+"0"+"\u00A0");
    }
    const WPimage = await getStatImage("WP");
    WPimage.style.margin = "0 0 0 -0.2rem";
    wrapper.append(WPimage);

    return wrapper;
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
        this.outerWrapper = createStatWrapper("outerInputWrapperFromCalculator");
        this.wrapper      = createStatWrapper("inputWrapperFromCalculator tooltip-lite");
        this.numberInput  = createRangedInput("number", getWearConfig(this.config,this.wear));
        this.numberLabel  = createUnitSpan(this.config.unit);
        this.qualityInput = createRangedInput("number", this.percentageConfig, true);
        this.qualityLabel = createUnitSpan("%");
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
    el.weaponQualitySpan.textContent= numberFixedString(blueprint.qualityWear,1)+"%"
    el.weaponImage.src=getWeaponImagePath(weapon);
}

function generateEverything(weapon){
	generateStatInputs(weapon);
	displayInfo(weapon);
	generatePassiveInputs(weapon);
}

function updateEverything(weapon){
	updateStatInputs(weapon);
	displayInfo(weapon);
}

async function generateStatInputs(weapon){
    // WP cost & inputs
	const inputElement = await generateWPInput(weapon);
	el.wpCost.replaceChildren(inputElement);
    // Description & inputs
	el.description.replaceChildren(generateDescription(weapon,weapon));
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