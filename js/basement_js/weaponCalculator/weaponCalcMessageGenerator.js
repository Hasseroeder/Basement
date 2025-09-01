import { numberFixedString } from '../util/stringUtil.js';
import { createRangedInput,createStatTooltip,createStatWrapper,createUnitSpan } from '../weaponCalculator/weaponCalcElementHelper.js'
import { valueToPercent, percentToValue, getRarity,getStat,getShardValue,syncWear,calculateQualities } from '../weaponCalculator/weaponCalcUtil.js'
import { clampNumber,roundToDecimals } from '../util/inputUtil.js';

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
    const description = weaponOrPassive.description;
    const wrapper     = document.createElement("div");
    const tokenRegex = /(\[stat\]|:[A-Za-z0-9_+]+:|\*\*[^*]+\*\*|\*[^*]+\*|\r?\n)/g;
    const parts      = description.split(tokenRegex);

    async function renderParts(parts, wrapper) {
        let statIndex = 0;
        for (const part of parts) {
            if (!part) continue;

            if (/^\r?\n$/.test(part)) {
                wrapper.appendChild(document.createElement("br"));
                continue;
            }

            if (part === "[stat]") {
                const mystat = getStat(
                    statIndex,
                    weaponOrPassive.objectType === "passive"
                    ? weaponOrPassive.stats
                    : weaponOrPassive.product.blueprint.stats,
                    weaponOrPassive.statConfig
                );
                const statContainer = createWeaponStatInput(...mystat, weaponOrPassive, weapon);
                statContainer.style.margin = "0 -0.2rem";
                wrapper.append(statContainer);
                statIndex++;
                continue;
            }if (/^:[A-Za-z0-9_+]+:$/.test(part)) {
                const key = part.slice(1, -1);
                const img = await getStatImage(key);
                const imgWrapper = document.createElement("div");
                img.style.margin = "0 0 0.17rem 0";
                imgWrapper.style.display = "inline-block";
                imgWrapper.append(img);
                wrapper.append(imgWrapper);
                continue;
            }if (/^\*\*([^*]+)\*\*$/.test(part)) {
                const text = part.slice(2, -2);
                const span = document.createElement("span");
                span.style.fontWeight = "bold";
                span.textContent = text;
                wrapper.append(span);
                continue;
            }if (/^\*([^*]+)\*$/.test(part)) {
                const text = part.slice(1, -1);
                const span = document.createElement("span");
                span.style.fontStyle = "italic";
                span.textContent = text;
                wrapper.append(span);
                continue;
            }
            wrapper.append(document.createTextNode(part));
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
    const WPStat = getStat("WP-Cost",weapon.product.blueprint.stats,weapon.statConfig);
    const WPimage = await getStatImage("WP");
    WPimage.style.margin="0 0 0.11rem -0.2rem";
    wrapper.append(WPStat[0]? createWeaponStatInput(...WPStat,weapon,weapon): "\u00A00\u00A0",WPimage);
    return wrapper;
}

function createWeaponStatInput(productStat,config,weaponOrPassive,weapon) {
    var wearBonus = weaponOrPassive.objectType == "passive" 
            ? weaponOrPassive.wearBonus
            : weaponOrPassive.product.blueprint.wearBonus;

    const percentageConfig = {
        get bonus() {
            return wearBonus;
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

    function enhanceConfig(config) {
        const bonus = (config.range / 100) * wearBonus;
        return {
            ...config,
            min: config.min + bonus,
            max: config.max + bonus
        };
    }

    const wearConfig 		= enhanceConfig(config);
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
        displayInfo(weapon);
    }
    function syncWithClamp(value,element) {
        const clamped = clampNumber(element.min, element.max, value);
        syncAll(clamped);
    }

    [slider, numberInput].forEach(input =>
        input.addEventListener('input', () => 
            syncAll(
                Number(input.value)
            )
        )
    );
    qualityInput.addEventListener('input', () => {
        syncAll(
            percentToValue(Number(qualityInput.value),config)
        );
    });
    numberInput.addEventListener('change', () =>
        syncWithClamp(
            Number(numberInput.value),
            numberInput
        )
    );
    qualityInput.addEventListener('change', () => {
        syncWithClamp(
            percentToValue(Number(qualityInput.value),config),
            numberInput
        );
    });

    wrapper.append(
        numberInput, 
        ...(wearConfig.unit === "" ? [] : [numberLabel]), 
        tooltip);
    outerWrapper.append(wrapper);
    syncAll(roundToDecimals(initialValue,6));
    return outerWrapper;
}

async function getStatImage(inputString) {
  const gifUrl = `../media/owo_images/${inputString}.gif`;
  const pngUrl = `../media/owo_images/${inputString}.png`;

  const img = document.createElement('img');
  if (await fileExists(gifUrl)) {
    img.src = gifUrl;
  } else {
    img.src = pngUrl;
  }
  img.alt = `:${inputString}:`;
  img.ariaLabel = inputString;
  img.title = `:${inputString}:`;
  img.className = 'discord-embed-emote';
  img.style = 'margin: 0 0 -0.01rem -0.2rem;';
  return img;
}

async function fileExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
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
    const blueprint = weapon.product.blueprint;

    const img = document.createElement("img");
    const p = blueprint.wearBonus==0?"":"p";
    const q = letters[blueprint.tier] || "f";
    const w = getWeaponShorthand();
    img.src = `media/owo_images/${p+q+"_"+w}.png`;
    img.ariaLabel= getWeaponShorthand();
    img.alt=":"+getWeaponShorthand()+":";
    img.style.borderRadius="0.2rem";
    img.draggable=false;
    img.className="discord-pet-display";

    return img;
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

export { generateDescription,generateWPInput,displayInfo };