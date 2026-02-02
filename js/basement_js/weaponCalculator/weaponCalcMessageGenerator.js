import { valueToPercent, percentToValue,getShardValue,getStatImage,getWeaponImagePath,getTierEmoji, getTierEmojiPath } from '../weaponCalculator/weaponCalcUtil.js'
import { make } from "../util/injectionUtil.js"

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

const getWearBonus = w => ({pristine: 5, fine: 3, decent: 1})[w] ?? 0;
const getWearName = w => ({pristine:"Pristine\u00A0", fine:"Fine\u00A0", decent:"Decent\u00A0"})[w] ?? "";

class WeaponStat {
    constructor(stat, parent) {
        this.stat   = stat;
        this.parent = parent;
        this._buildDOM();

        const temp = percentToValue(this.stat.noWear, this.wearConfig);
        this._syncAll(+temp.toFixed(6));
        this.initiated = true;
    }

    _applyWear(){
        this.wearBonus = getWearBonus(this.wear);
        this.wearName = getWearName(this.wear);
        // TODO: it'd be cooler if we did weapon wear in the weapon loop 
        this.parent.wearBonus = getWearBonus(this.wear);
        this.parent.wearName = getWearName(this.wear);
    }
    
    get wear() {
        return  this.parent.wear
    }

    get percentageConfig() {
        this._applyWear();
        const bonus = this.wearBonus;
        return {
            bonus:  bonus,
            min:    bonus,
            max:    100 + bonus,
            range:  100, step: 1, unit: '%', digits: 3.5
        };
    }

    get noWearConfig(){
        return this.stat.noWearConfig
    }

    get wearConfig(){
        this._applyWear();
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
        const clamp = val => {
            const {min, max, step} = this.wearConfig;
            val = parseFloat(val);      // because we might get a string as input
            if (isNaN(val)) val = min;  // because we might get a stupid string as input
            const offset  = (val - min) / step;
            const snapped = min + Math.round(offset) * step;
            return Math.min(max, Math.max(min, snapped));
        };

        const wire = (input, valueType) => {
            input.addEventListener("input", e => {
                if (e.target.value === "" || e.data === "." || e.data === ",") return;
                const val = valueType == "percent"
                    ?percentToValue(e.target.value, this.noWearConfig)
                    :e.target.value;
                if (isNaN(val)) return;
                this._syncAll(val);
            });

            input.addEventListener("change", e => {
                const val = valueType == "percent"
                    ?percentToValue(e.target.value, this.noWearConfig)
                    :e.target.value;
                this._syncAll(clamp(val));
            });
        };

        wire(this.numberInput, "raw");
        wire(this.qualityInput,"percent");
        wire(this.slider,      "raw");
    }

    _syncAll(value) {
        this.numberInput.value  = value;
        this.slider.value       = value;

        const pct       = valueToPercent(value, this.noWearConfig);
        const noWearPct = valueToPercent(value, this.wearConfig);

        this.qualityInput.value = pct;
        this.img.src            = getTierEmojiPath(pct);
        this.stat.noWear        = noWearPct;
        this.stat.withWear      = pct;

        this.parent.image && (this.parent.image.src= getWeaponImagePath(this.parent));
        this.initiated && boundWeapon.updateVars();
    }

    update(stat) {
        if (this.wearName == getWearName(this.wear)) {
            return;     // probably the ugliest way to solve infinite recusion lmao
                        // and it doesn't even work!!! TODO: fix
        }
        this.stat = stat;

        [this.numberInput, this.slider].forEach(el => {
            const { min, max, step } = this.wearConfig;
            el.min = Math.min(min, max);
            el.max = Math.max(min, max);
            el.step  = Math.abs(step);
        });

        Object.assign(this.qualityInput, this.percentageConfig);

        const temp = percentToValue(this.stat.noWear, this.wearConfig);
        this._syncAll(+temp.toFixed(6));
    }
}

function displayInfo(){
    el.weaponHeader.textContent= boundWeapon.owner.name+"'s " +boundWeapon.wearName +boundWeapon.typeName;
    el.weaponName.innerHTML="<strong>Name:&nbsp;</strong> " + boundWeapon.typeName;
    el.ownerID.innerHTML="<strong>Owner:&nbsp;</strong> " + boundWeapon.owner.id;
    el.weaponID.innerHTML=`<strong>ID:&nbsp;</strong> <code class="discord-code" style="font-size: 0.8rem; height: 1rem; line-height: 1rem;">${boundWeapon.weaponID}</code>`;
    el.shardValue.innerHTML= "<strong>Shard Value:&nbsp;</strong> " + getShardValue(boundWeapon);
    el.weaponQualityImage.src= getTierEmojiPath(boundWeapon.tier);
    el.weaponQualitySpan.textContent= boundWeapon.qualityWear.toFixed(1)+"%"
    el.weaponImage.src=getWeaponImagePath(boundWeapon);
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