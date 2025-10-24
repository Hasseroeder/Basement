import { make } from "./weaponCalcElementHelper.js";

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

function syncWear(weapon){
    const blueprint = weapon.product.blueprint;
    blueprint.passive.forEach(entry => {
        entry.stats.forEach(stat => {
            stat.withWear = stat.noWear + blueprint.wearBonus;
        });
    });
    blueprint.stats.forEach(stat => {
        stat.withWear = stat.noWear + blueprint.wearBonus;
    });
}

function getStat(keyOrIndex,stats,statConfig){
    const idx =
        typeof keyOrIndex === 'number'
        ? keyOrIndex
        : statConfig.findIndex(stat => stat.type === keyOrIndex);

    return [
        stats[idx]?? undefined, 
        statConfig[idx]?? undefined
    ];
}

function getShardValue(weapon){
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
    if (weapon.id==104){return "UNSELLABLE"};
    return value + " selling / " + Math.ceil(value*2.5) + " buying"
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

const percentToValue = 
	(percent, { min, range }) =>
  	min + (range * percent) / 100;

const valueToPercent =
	(value, { min, range}) =>
	Math.round(100 * (value - min) / range);


async function getStatImage(inputString) {
    const gifUrl = `../media/owo_images/${inputString}.gif`;
    const pngUrl = `../media/owo_images/${inputString}.png`;

    return make("img",{
        src: (await fileExists(gifUrl)) ? gifUrl : pngUrl,
        alt: `:${inputString}:`,
        ariaLabel : inputString,
        title : `:${inputString}:`,
        className: 'discord-embed-emote zeroZeroZeroThirteenMargin'
    });
}

async function fileExists(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return (res.ok && !res.headers.get("Content-Type")?.includes("text/html"));
    } catch {
        return false;
    }
}

function getWeaponImage(weaponOrPassive){
    const shorthand = weaponOrPassive.aliases[0]? weaponOrPassive.aliases[0]: weaponOrPassive.name;

    return make("img",{
        src : getWeaponImagePath(weaponOrPassive),
        ariaLabel: shorthand.toLowerCase(),
        alt:":"+shorthand.toLowerCase()+":",
        style:{
            borderRadius:"0.2rem"
        },
        draggable:false,
        className:"discord-pet-display"
    });
}

function getWeaponImagePath(weaponOrPassive){
    const shorthand = weaponOrPassive.aliases[0]? weaponOrPassive.aliases[0]: weaponOrPassive.name;
    const letters = {
        common: 	"c",
        uncommon:   "u",
        rare:   	"r",
        epic:     	"e",
        mythic:  	"m",
        legendary:	"l",
        fabled: 	"f"
    };
    const blueprint = weaponOrPassive.objectType == "passive" 
        ? weaponOrPassive
        : weaponOrPassive.product.blueprint;

    const p = (blueprint.wearBonus == 0 || weaponOrPassive.objectType == "passive")
            ? ""
            : "p";
    const q = letters[blueprint.tier] || "f";
    const w = shorthand.toLowerCase();
    const path = `media/owo_images/${p+q+"_"+w}.png`;
    return path;
}

function fillMissingWeaponInfo(weapon){
	function generateMissingStat(stat){
		if (!stat.noWear && weapon.id == 104){
			const qualities = [
				{ quality: 20,  chance: 40},
				{ quality: 40,  chance: 60},
				{ quality: 60,  chance: 75},
				{ quality: 75,  chance: 85},
				{ quality: 85,  chance: 95},
				{ quality: 95,  chance: 99},
				{ quality: 100, chance: 100}
			];
			const match = qualities.find(t => Math.floor(Math.random() * 101) <= t.chance);
			stat.noWear = match.quality;
			//when we generate a rune stat, it generally shouldn't be at any value
		}else if (!stat.noWear){
			stat.noWear=Math.floor(Math.random() * 101);
		}
	}
	weapon.product.blueprint.passive.forEach(entry => {
		entry.stats.forEach(stat => generateMissingStat(stat));
    });
	weapon.product.blueprint.stats.forEach(stat => generateMissingStat(stat));
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
    if (stringOrQuality == undefined){
        return paths["fabled"];
    }else if (typeof stringOrQuality === "string"){
        return paths[stringOrQuality];
    }else if(typeof stringOrQuality === "number"){
        return paths[getRarity(stringOrQuality)];
    }
}

function getWearBonus(wear){
    const wearValues = {
        pristine: 5,
        fine:     3,
        decent:   1,
        worn:     0,
        unknown:  0
    };
    return wearValues[wear] || 0;
}

function applyWearToWeapon(weapon,wear){
	function getWearName(wear){
		const wearValues = {
			pristine: "Pristine\u00A0",
			fine:     "Fine\u00A0",
			decent:   "Decent\u00A0",
			worn:     "",
			unknown:  ""
		};
		return wearValues[wear] || "";
	}
	function applyValues(toApply){
		toApply.wear = wear;
		toApply.wearBonus = getWearBonus(wear);
		toApply.wearName = getWearName(wear);
	}
	applyValues(weapon.product.blueprint);
	weapon.product.blueprint.passive.forEach(passive => applyValues(passive));
}


function getWearConfig(config,wear) {
	const bonus = (config.range / 100) * getWearBonus(wear);
	return {
		...config,
		min: config.min + bonus,
		max: config.max + bonus
	};
}

export { getWearConfig, getWearBonus, valueToPercent, percentToValue, getRarity,getStat,getShardValue,syncWear,calculateQualities,getStatImage,getWeaponImage,getWeaponImagePath, fillMissingWeaponInfo, getTierEmoji, getTierEmojiPath, applyWearToWeapon};