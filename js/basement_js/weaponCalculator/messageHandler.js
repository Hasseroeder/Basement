import { valueToPercent, percentToValue,getShardValue,getStatImage,getTierEmoji, getTierEmojiPath } from './util.js'
import { make } from "../util/injectionUtil.js"

const el = {
	weaponHeader:	    document.getElementById("weaponHeader"), 
	weaponName:		    document.getElementById("weaponName"),
	ownerID:		    document.getElementById("ownerID"),
	weaponID:		    document.getElementById("weaponID"),
	shardValue:		    document.getElementById("shardValue"),
	weaponQualityImage: document.getElementById("weaponQualityImage"),
    weaponQualitySpan:  document.getElementById("weaponQualitySpan"),
	wpCost:			    document.getElementById("WP-Cost"),
	description:	    document.getElementById("description")
}

let boundWeapon;
export const bindWeapon = weapon => boundWeapon = weapon;

function generateDescription(weaponOrPassive) {
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

    const parts = weaponOrPassive.description.split(tokenRegex)
    let statIndex = 0;
    
    return make("div",
        {style:{ display: "inline", whiteSpace: "normal", lineHeight: "1.4rem"}},
        parts.map(elif)
    );

    function elif(part){
        if (NEWLINE_RE.test(part)) return document.createElement("br")
        if (part === STAT_TOKEN) return getStatNode()
        const imgMatch = part.match(IMAGE_RE);
        if (imgMatch) return getStatImage(imgMatch[1],"weapon-desc-image")
        const boldMatch = part.match(BOLD_RE);
        if (boldMatch) return make("span",{style:{fontWeight: "bold"},textContent: boldMatch[1]})
        const italicMatch = part.match(ITALIC_RE);  
        if (italicMatch) return make("span",{style:{fontStyle: "italic"},textContent: italicMatch[1]})
        return document.createTextNode(part);
    }

    function getStatNode(){
        const stat = weaponOrPassive.stats[statIndex];
        statIndex++;
        return (stat.IO = new WeaponStat(stat, weaponOrPassive), stat.IO.wrapper);
    }
}

function generateWPInput(weapon){
    const stat = weapon.wpStat;
    const child = stat
        ? (stat.IO = new WeaponStat(stat, weapon), stat.IO.wrapper)
        : `\u00A0${0}\u00A0`;

    return make("div",
        {
            innerHTML:"<strong>WP Cost:&nbsp;</strong>",
            style: {display: "flex", alignItems: "center"}
        },
        [child,getStatImage("WP")]
    );
}

const clamp = (val, config) => {
    const {min, max, step} = config;
    val = parseFloat(val);      // because we might get a string as input
    if (isNaN(val)) val = min;  // because we might get a stupid string as input
    const offset  = (val - min) / step;
    const snapped = min + Math.round(offset) * step;
    return Math.min(max, Math.max(min, snapped));
};

class WeaponStat {
    constructor(stat, parent) {
        this.stat   = stat;
        this.parent = parent;
        this._buildDOM();
        this._syncAll(this.stat.noWear + this.wearBonus);
        // initiate initial stats
    }
    
    get wear() {
        return  this.parent.wear
    }
    get wearBonus(){
        return this.parent.wearBonus
    }
    get wearName(){
        return this.parent.wearName
    }

    get percentageConfig() {
        const bonus = this.wearBonus;
        return {
            min:    bonus,
            max:    100 + bonus,
            range:  100, step: 1, unit: '%', digits: 3.5
        };
    }

    get noWearConfig(){
        return this.stat.noWearConfig
    }

    get wearConfig(){
        const bonus = (this.noWearConfig.range / 100) * this.wearBonus;
        return {
            ...this.noWearConfig,
            min: this.noWearConfig.min + bonus,
            max: this.noWearConfig.max + bonus
        };
    }

    _buildDOM() {
        const makeUnitLabel = config => config.unit
            ? make("span",{ className:"smol-right-margin", textContent:config.unit })
            :"";

        this.wrapper      = make("div",{className:"outerInputWrapperFromCalculator"});
        this.numberInput  = createRangedInput("number", this.wearConfig);
        this.numberLabel  = makeUnitLabel(this.noWearConfig);
        this.qualityInput = createRangedInput("number", this.percentageConfig, {height:"1.5rem"});
        this.qualityLabel = makeUnitLabel(this.percentageConfig);
        this.slider       = createRangedInput("range",  this.wearConfig);
        this.img          = getTierEmoji(this.parent.tier);
        this.tooltip      = make("div",
                                {className:'hidden tooltip-lite-child'},
                                [ this.img, this.qualityInput, this.qualityLabel, this.slider ]
                            );

        this.wrapper.append(
            make("div",{className:"inputWrapperFromCalculator tooltip-lite"},[
                this.numberInput,
                this.numberLabel,
                this.tooltip
            ])
        );

        this._wireEvents();
    }

    _wireEvents() {
        const wire = (input, valueType) => {
            input.addEventListener("input", e => {
                if (e.target.value === "" || e.data === "." || e.data === ",") return;
                const val = valueType == "percent"
                    ?e.target.value
                    :valueToPercent(e.target.value, this.noWearConfig);
                if (isNaN(val)) return;
                this._syncAll(val);
            });

            input.addEventListener("change", e => {
                const val = valueType == "percent"
                    ?e.target.value
                    :valueToPercent(e.target.value, this.noWearConfig);
                this._syncAll(clamp(val,this.percentageConfig));
            });
        };

        wire(this.numberInput, "raw");
        wire(this.qualityInput,"percent");
        wire(this.slider,      "raw");
    }

    _syncAll(pct) {
        pct = Number(pct);
        const noWearPct = pct - this.wearBonus;
        const rawValue  = percentToValue(pct, this.noWearConfig);
        
        this.numberInput.value  = rawValue;
        this.slider.value       = rawValue;

        // percentToValue() 100% -> Sword 55% STR
        // valueToPercent() Sword 55% STR -> 100%

        this.qualityInput.value = pct;
        this.img.src            = getTierEmojiPath(pct);
        this.stat.noWear        = noWearPct;
        this.stat.withWear      = pct;

        boundWeapon.updateQualities();
    }

    updateWear() {
        [
            { el: this.numberInput, config: this.wearConfig },
            { el: this.slider, config: this.wearConfig },
            { el: this.qualityInput, config: this.percentageConfig },
        ].forEach(input => {
            const { min, max } = input.config;
            input.el.min = Math.min(min, max);
            input.el.max = Math.max(min, max);
        });

        this._syncAll(this.stat.noWear+this.wearBonus);
    }
}

function displayInfo(){
    el.weaponHeader.textContent= boundWeapon.owner.name+"'s " +boundWeapon.wearName +boundWeapon.typeName;
    el.weaponName.innerHTML="<strong>Name:&nbsp;</strong> " + boundWeapon.typeName;
    el.ownerID.innerHTML="<strong>Owner:&nbsp;</strong> " + boundWeapon.owner.id;
    el.weaponID.innerHTML=`<strong>ID:&nbsp;</strong> <code class="discord-code weapon-id">${boundWeapon.weaponID}</code>`;
    el.shardValue.innerHTML= "<strong>Shard Value:&nbsp;</strong> " + getShardValue(boundWeapon);
    el.weaponQualityImage.src= getTierEmojiPath(boundWeapon.tier);
    el.weaponQualitySpan.textContent= boundWeapon.qualityWear.toFixed(1)+"%"
}

function generateStatInputs(){
	el.wpCost.replaceChildren(generateWPInput(boundWeapon));
	el.description.replaceChildren(generateDescription(boundWeapon));
}

function createRangedInput(type, {min, max, step, digits}, extraStyles={}) {
    const className = type=="range"?'weaponSlider':
                      type=="number"?'inputFromWeaponCalculator no-arrows':"";

    const style = 
        type=="range"?{
            margin: '0 0 0 0.2rem',
            background: '#555',
            transform: min>max ? 'scaleX(-1)' : '',
            transformOrigin: min>max ? 'center' : '',
            pointer: 'var(--cur-pointer)'
        }:
        type=="number"?{
            width:(digits*0.5)+'rem'
        }:{};

    Object.assign(style, extraStyles);

    return make("input",{
        className,
        style,
        min: Math.min(max,min), 
        max: Math.max(max,min), 
        type, 
        step: Math.abs(step), 
        lang: "en" 
    });
}

export { generateDescription, displayInfo, generateStatInputs };