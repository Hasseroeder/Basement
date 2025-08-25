import { numberFixedString } from '../util/stringUtil.js';
import { createRangedInput,createStatTooltip,createStatWrapper,createUnitSpan } from '../weaponCalculator/weaponCalcElementHelper.js'

function generateDescription(weapon,el) {
    const description = weapon.description;
    const wrapper     = document.createElement("div");

    Object.assign(wrapper.style, {
        display:     "inline",
        whiteSpace:  "normal",
        lineHeight:  "1.4rem",
    });

    let statIndex = 0;

    const tokenRegex = /(\[stat\]|:[A-Za-z0-9_+]+:|\*\*[^*]+\*\*|\*[^*]+\*|\r?\n)/g;
    const parts      = description.split(tokenRegex);

    parts.forEach(part => {
        if (!part) return;
        if (/^\r?\n$/.test(part)) {
            wrapper.appendChild(document.createElement("br"));
            return;
        }
        if (part === "[stat]") {
            const statContainer = createWeaponStatInput(...getStat(statIndex,weapon),weapon,el);
            statContainer.style.margin = "0 -0.2rem";
            wrapper.append(statContainer);
            statIndex++;
            return;
        }
        if (/^:[A-Za-z0-9_+]+:$/.test(part)) {
            const key        = part.slice(1, -1);
            const img        = getStatImage(key);
            const imgWrapper = document.createElement("div");
            img.style.margin       = "0 0 0.17rem 0";
            imgWrapper.style.display = "inline-block";
            imgWrapper.append(img);
            wrapper.append(imgWrapper);
            return;
        }
        if (/^\*\*([^*]+)\*\*$/.test(part)) {
            const text = part.slice(2, -2);
            const span = document.createElement("span");
            span.style.fontWeight = "bold";
            span.textContent      = text;
            wrapper.append(span);
            return;
        }
        if (/^\*([^*]+)\*$/.test(part)) {
            const text = part.slice(1, -1);
            const span = document.createElement("span");
            span.style.fontStyle = "italic";
            span.textContent = text;
            wrapper.append(span);
            return;
        }
        wrapper.append(document.createTextNode(part));
    });
    return wrapper;
}

function generateWPInput(weapon,el){
    const wrapper = document.createElement("div");	
    wrapper.innerHTML="<strong>WP Cost:</strong>";
    const WPStat = getStat("WP-Cost",weapon);
    const WPimage = getStatImage("WP");
    WPimage.style.margin="0 0 0.05rem -0.2rem";
    wrapper.append(WPStat[0]? createWeaponStatInput(...WPStat,weapon,el): "\u00A00\u00A0",WPimage);
    return wrapper;
}

function createWeaponStatInput(productStat,config,weapon,el) {

    const percentageConfig = {
        get bonus() {
            return getWearBonus(weapon);
        },
        get min() {
            return this.bonus;
        },
        get max() {
            return 100 + this.bonus;
        },
        get range() {
            return this.max - this.min;
        },
        step: 1,
        unit: "%",
        digits:3
    };
        
    function calculateQualities(weapon) {
        const blueprint = weapon.product.blueprint;
        const baseStats = Array.isArray(blueprint.stats) ? blueprint.stats : [];
        const passives  = Array.isArray(blueprint.passive) ? blueprint.passive : [];

        passives.forEach(entry => {
            const { sumWear, sumNoWear } = entry.stats.reduce((acc, stat) => ({ 
                sumWear: acc.sumWear     + stat.withWear, 
                sumNoWear: acc.sumNoWear + stat.noWear
            }), { sumWear: 0, sumNoWear: 0 });

            entry.qualityWear   = sumWear / entry.stats.length;
            entry.qualityNoWear = sumNoWear / entry.stats.length;
            entry.tier          = getRarity(entry.qualityNoWear);
        });

        const allStats = [
            ...baseStats,
            ...passives.flatMap(entry => entry.stats)
        ];

        const { sumWear, sumNoWear } = allStats.reduce((acc, stat) => ({
            sumWear:   acc.sumWear   + stat.withWear,
            sumNoWear: acc.sumNoWear + stat.noWear 
        }), { sumWear: 0, sumNoWear: 0 });

        blueprint.qualityWear = sumWear   / allStats.length;
        blueprint.qualityNoWear = sumNoWear / allStats.length;
        blueprint.tier = getRarity(Math.floor(blueprint.qualityWear));

    }

    function enhanceConfig(config, wearBonus) {
        const bonus = (config.range / 100) * wearBonus;
        return {
            ...config,
            min: config.min + bonus,
            max: config.max + bonus
        };
    }

    const wearConfig 		= enhanceConfig(config,getWearBonus(weapon));
    const initialValue 		= percentToValue(productStat.noWear,wearConfig);
    const outerWrapper		= createStatWrapper("outerInputWrapperFromCalculator");
    const wrapper 			= createStatWrapper("inputWrapperFromCalculator tooltip-lite");
    const numberInput 		= createRangedInput('number', wearConfig);
    const numberLabel 		= createUnitSpan(wearConfig.unit);
    const img 				= getTierEmoji(getRarity(productStat.withWear));
    const qualityInput 		= createRangedInput('number', percentageConfig,true);
    const qualityLabel 		= createUnitSpan(percentageConfig.unit);
    const slider 			= createRangedInput('range',  wearConfig);
    const tooltipChildren 	= [img, qualityInput, qualityLabel, slider];
    const tooltip         	= createStatTooltip(tooltipChildren);

    function syncAll(value) {
        // this is also called when wear changes and such, it should always be called when any stat changes in any way
        numberInput.value  = value;
        slider.value       = value;
        const pct = valueToPercent(value, config);
        const noWearPtc = valueToPercent(value, wearConfig);
        qualityInput.value = pct;
        img.src = getTierEmojiPath(pct);
        productStat.noWear=noWearPtc;

        syncWear(weapon);
        calculateQualities(weapon);
        displayInfo(el,weapon);
    }
    [slider, numberInput].forEach(el =>
        el.addEventListener('input', () => syncAll(Number(el.value)))
    );
    qualityInput.addEventListener('input', () => { 
        syncAll(percentToValue(Number(qualityInput.value), config));	
    });

    wrapper.append(
        numberInput, 
        ...(wearConfig.unit === "" ? [] : [numberLabel]), 
        tooltip);
    outerWrapper.append(wrapper);
    syncAll(initialValue);
    return outerWrapper;
}

function getStat(keyOrIndex,weapon){
    const idx =
        typeof keyOrIndex === 'number'
        ? keyOrIndex
        : weapon.stats.findIndex(stat => stat.type === keyOrIndex);

    return [
        weapon.product.blueprint.stats[idx]?? undefined, 
        weapon.stats[idx]?? undefined
    ];
}

const percentToValue = 
	(percent, { min, range }) =>
  	min + (range * percent) / 100;

const valueToPercent =
	(value, { min, range}) =>
	Math.round(100 * (value - min) / range);

function getStatImage(inputString){
	const img = document.createElement("img");
	img.src = `../media/owo_images/${inputString}.gif`;
	img.onerror = function () {
		this.onerror = null; 
		this.src = `../media/owo_images/${inputString}.png`;
	};
	img.alt = `:${inputString}:`;
	img.ariaLabel = `${inputString}`;
	img.title = `:${inputString}:`;
	img.className="discord-embed-emote";
	img.style="margin: 0 0 -0.01rem -0.2rem;";
	return img;
}

function getWearBonus(weapon){
    console.log(weapon);
	var wear = weapon.product.blueprint.wear;
	const wearValues = {
		pristine: 5,
		fine:     3,
		decent:   1,
		worn:     0,
		unknown:  0
	};
	return wearValues[wear] || 0;
}

function getTierEmoji(tier){
	const img = document.createElement("img");
	img.src = getTierEmojiPath(tier);
	img.alt = tier;
	img.ariaLabel = tier;
	img.title = `:${tier}:`;
	img.className = "discord-embed-emote";
	return img;
}

function getTierEmojiPath(stringOrQuality){
	const paths = {
		common: 	"../media/owo_images/common.png",
		uncommon:   "../media/owo_images/uncommon.png",
		rare:   	"../media/owo_images/rare.png",
		epic:     	"../media/owo_images/epic.png",
		mythic:  	"../media/owo_images/mythic.png",
		legendary:	"../media/owo_images/legendary.gif",
		fabled: 	"../media/owo_images/fabled.gif"
	};
	if (typeof stringOrQuality === "string"){
		return paths[stringOrQuality];
	}else if(typeof stringOrQuality === "number"){
		return paths[getRarity(stringOrQuality)];
	}
}

function getRarity(quality) {
	const tiers = [
		{ maxQuality: 20, name: "common" },
		{ maxQuality: 40, name: "uncommon" },
		{ maxQuality: 60, name: "rare" },
		{ maxQuality: 80, name: "epic" },
		{ maxQuality: 94, name: "mythic" },
		{ maxQuality: 99, name: "legendary" },
		{ maxQuality: 105, name: "fabled" }
		//  -- Annoying stuff in scoot's code: --
		// 	Weapons and Passives work differently with these values
		// 	example: 
		// 	- for weapons, anything 81<=x<95 would be considered mythic
		//	- for passives, anything 80<x<=94 would be considered mythic
		// --------------------------------------
	];

	const tier = tiers.find(t => quality <= t.maxQuality)
				|| tiers.at(-1);
				//default to fabled if we have nonsensical input
	return tier.name;
}

function syncWear(weapon){
    weapon.product.blueprint.passive.forEach(entry => {
        entry.stats.forEach(stat => {
            stat.withWear = stat.noWear + getWearBonus(weapon);
        });
    });
    weapon.product.blueprint.stats.forEach(stat => {
        stat.withWear = stat.noWear + getWearBonus(weapon);
    });
}

function getWearName(weapon){
    var wear = weapon.product.blueprint.wear;
    const wearValues = {
        pristine: "Pristine\u00A0",
        fine:     "Fine\u00A0",
        decent:   "Decent\u00A0",
        worn:     "",
        unknown:  ""
    };
    return wearValues[wear] || "";
}

function getShardValue(weapon,weaponID){
    const shardValue = {
        common: 	1,
        uncommon:   3,
        rare:   	5,
        epic:     	25,
        mythic:  	300,
        legendary:	1000,
        fabled: 	5000
    };
    const tier  = weapon.product.blueprint.tier;
    const value = shardValue[tier] || 0;
    if (weaponID==104){return "UNSELLABLE"};
    return value + " selling / " + Math.ceil(value*2.5) + " buying"
}

function getWeaponImage(weapon){
    function getWeaponShorthand(){
        const shorthand = weapon.aliases[0]? weapon.aliases[0]: weapon.name;
        return shorthand.toLowerCase();
    }
    const letters = {
        common: 	"c",
        uncommon:   "u",
        rare:   	"r",
        epic:     	"e",
        mythic:  	"m",
        legendary:	"l",
        fabled: 	"f"
    };

    const img = document.createElement("img");
    const p = getWearBonus(weapon)==0?"":"p";
    const q = letters[weapon.product.blueprint.tier] || "f";
    const w = getWeaponShorthand();
    img.src = `media/owo_images/${p+q+"_"+w}.png`;
    img.ariaLabel= getWeaponShorthand();
    img.alt=":"+getWeaponShorthand()+":";
    img.style.borderRadius="0.2rem";
    img.draggable=false;
    img.className="discord-pet-display";

    return img;
}

function displayInfo(el,weapon){
    el.weaponHeader.textContent=weapon.product.owner.displayName+"'s "+getWearName(weapon)+weapon.name;
    el.weaponName.innerHTML="<strong>Name:&nbsp;</strong> " + weapon.name;
    el.ownerID.innerHTML="<strong>Owner:&nbsp;</strong> " + weapon.product.owner.name;
    el.weaponID.innerHTML=`<strong>ID:&nbsp;</strong> <code class="discord-code" style="font-size: 0.8rem; height: 1rem; line-height: 1rem;">${weapon.product.id}</code>`;
    el.shardValue.innerHTML= "<strong>Shard Value:&nbsp;</strong> " + getShardValue(weapon,weapon.id);
    el.weaponQuality.innerHTML= "<strong>Quality:&nbsp;</strong> ";
    el.weaponQuality.append(getTierEmoji(weapon.product.blueprint.tier));
    el.weaponQuality.innerHTML+= numberFixedString(weapon.product.blueprint.qualityWear,1)+"%"
    el.weaponImage.innerHTML="";
    el.weaponImage.append(getWeaponImage(weapon));
}

export { generateDescription,generateWPInput,syncWear,displayInfo };