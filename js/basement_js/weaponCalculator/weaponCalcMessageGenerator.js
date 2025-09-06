import { numberFixedString } from '../util/stringUtil.js';
import { createRangedInput,createStatTooltip,createStatWrapper,createUnitSpan } from '../weaponCalculator/weaponCalcElementHelper.js'
import { valueToPercent, percentToValue, getRarity,getStat,getShardValue,syncWear,calculateQualities,getStatImage,getWeaponImage,getWeaponImagePath,getTierEmoji, getTierEmojiPath } from '../weaponCalculator/weaponCalcUtil.js'
import { clampNumber } from '../util/inputUtil.js';
import { generatePassiveInputs } from './weaponCalcPassive.js';

const el = {
	weaponHeader:	document.getElementById("weaponHeader"), 
	weaponName:		document.getElementById("weaponName"),
	ownerID:		document.getElementById("ownerID"),
	weaponID:		document.getElementById("weaponID"),
	shardValue:		document.getElementById("shardValue"),
	weaponQuality:	document.getElementById("weaponQuality"),
	weaponImage: 	document.getElementById("weaponImage"),
	wpCost:			document.getElementById("WP-Cost"),
	description:	document.getElementById("description")
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

        this.percentageConfig = {
            get bonus() { return this.owner._getWearBonus(); },
            get min()   { return this.bonus; },
            get max()   { return 100 + this.bonus; },
            get range() { return this.max - this.min; },
            step: 1, unit: "%", digits: 3,
            owner: this
        };

        //remove half this shit
        console.log("hey");
        syncWear(this.weapon);
        console.log(this.weapon);

        this._buildDOM();
        const temp = percentToValue(this.stat.noWear, this._wearConfig());
        this._syncAll(+temp.toFixed(6));
    }

    _getWearBonus() {
        const src = this.weaponOrPassive;
        return src.objectType === "passive"
            ? src.wearBonus
            : src.product.blueprint.wearBonus;
    }

    _wearConfig() {
        const bonus = (this.config.range / 100) * this._getWearBonus();
        return {
            ...this.config,
            min: this.config.min + bonus,
            max: this.config.max + bonus
        };
    }

    _buildDOM() {
        this.outerWrapper = createStatWrapper("outerInputWrapperFromCalculator");
        this.wrapper      = createStatWrapper("inputWrapperFromCalculator tooltip-lite");
        this.numberInput  = createRangedInput("number", this._wearConfig());
        this.numberLabel  = createUnitSpan(this._wearConfig().unit);
        this.qualityInput = createRangedInput("number", this.percentageConfig, true);
        this.qualityLabel = createUnitSpan(this.percentageConfig.unit);
        this.slider       = createRangedInput("range",  this._wearConfig());
        this.img          = getTierEmoji(getRarity(this.stat.withWear));
        this.tooltip      = createStatTooltip([ this.img, this.qualityInput, this.qualityLabel, this.slider ]);

        this.wrapper.append(
            this.numberInput,
            ...(this._wearConfig().unit ? [this.numberLabel] : []),
            this.tooltip
        );
        this.outerWrapper.append(this.wrapper);

        this._wireEvents();
    }

    _wireEvents() {
        const clamp = (val, el) => {
            const c = clampNumber(el.min, el.max, val);
            this._syncAll(c);
        };

        this.numberInput.addEventListener("input",  e => this._syncAll(+e.target.value) );
        this.slider     .addEventListener("input",  e => this._syncAll(+e.target.value) );
        this.qualityInput.addEventListener("input", e => {
            const pct = +e.target.value;
            this._syncAll(percentToValue(pct, this.config) );
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
        const noWearPct = valueToPercent(value, this._wearConfig());

        this.qualityInput.value = pct;
        this.img.src            = getTierEmojiPath(pct);
        this.stat.noWear = noWearPct;

        syncWear(this.weapon);
        calculateQualities(this.weapon);
        displayInfo(this.weapon);
        changePassiveEmote(this.weaponOrPassive);
    }

    update(productStat, config, weaponOrPassive, weapon) {
        this.stat        = productStat;
        this.config         = config;
        this.weaponOrPassive    = weaponOrPassive;
        this.weapon             = weapon;

        [this.numberInput, this.slider].forEach(el => {
            el.min   = this._wearConfig().min;
            el.max   = this._wearConfig().max;
            el.step  = this._wearConfig().step;
        });
        this.qualityInput.min = this.percentageConfig.min;
        this.qualityInput.max = this.percentageConfig.max;

        const temp = percentToValue(this.stat.noWear, this._wearConfig());
        this._syncAll(+temp.toFixed(6));
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
    el.weaponQuality.innerHTML= "<strong>Quality:&nbsp;</strong> ";
    el.weaponQuality.append(getTierEmoji(blueprint.tier));
    el.weaponQuality.innerHTML+= numberFixedString(blueprint.qualityWear,1)+"%"
    el.weaponImage.innerHTML="";
    el.weaponImage.append(getWeaponImage(weapon));
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

function generateStatInputs(weapon){
	async function updateWPCost() {
		const inputElement = await generateWPInput(weapon);
		el.wpCost.replaceChildren(inputElement);
	}
	function updateDescription(){
		el.description.replaceChildren(generateDescription(weapon,weapon));
	}
	updateWPCost();
	updateDescription();
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