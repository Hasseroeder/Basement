import { make } from "../util/injectionUtil.js"

function getShardValue(weapon){
    const value = {
        common: 	1,
        uncommon:   3,
        rare:   	5,
        epic:     	25,
        mythic:  	300,
        legendary:	1000,
        fabled: 	5000
    }[weapon.tier];
    if (weapon.typeID==104) return "UNSELLABLE"
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


function getStatImage(inputString,className) {
    const gifUrl = `../media/owo_images/${inputString}.gif`;
    const pngUrl = `../media/owo_images/${inputString}.png`;
    const imageClasses =  'discord-embed-emote ' + className??""

    const image = make("img",{
        alt: `:${inputString}:`,
        ariaLabel : inputString,
        title : `:${inputString}:`,
        className: imageClasses
    });

    fileExists(gifUrl).then(exists => 
        image.src = exists ? gifUrl : pngUrl
    );
    
    return image;
}

async function fileExists(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return (res.ok && !res.headers.get("Content-Type")?.includes("text/html"));
    } catch {
        return false;
    }
}

const getWeaponImage = weaponOrPassive => 
    make("img",{
        src : getWeaponImagePath(weaponOrPassive),
        ariaLabel: weaponOrPassive.slug,
        alt:":"+weaponOrPassive.slug+":",
        draggable:false,
        className:"discord-pet-display"
    });

function getWeaponImagePath(weaponOrPassive){
    const p = (weaponOrPassive.wearBonus == 0 || weaponOrPassive.objectType == "passive")
            ? ""
            : "p";
    const q = {
        common: 	"c",
        uncommon:   "u",
        rare:   	"r",
        epic:     	"e",
        mythic:  	"m",
        legendary:	"l",
        fabled: 	"f"
    }[weaponOrPassive.tier];

    const w = weaponOrPassive.slug.toLowerCase();
    return `media/owo_images/${p+q+"_"+w}.png`;
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
			//when we generate a rune stat, it shouldn't be at any value
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
    return make("img",{
        src: getTierEmojiPath(tier),
        alt: tier,
        ariaLabel: tier,
        title: `:${tier}:`,
        className: "discord-embed-emote"
    })
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

const getWearName = w =>
    ({
        pristine:"Pristine\u00A0", 
        fine:"Fine\u00A0", 
        decent:"Decent\u00A0"
    })[w] ?? ""

const getWearBonus = w =>
    ({
        pristine: 5, 
        fine: 3, 
        decent: 1
    })[this.wear] ?? 0

export { getWearBonus, getWearName, valueToPercent, percentToValue,getShardValue,getStatImage,getWeaponImage,getWeaponImagePath, fillMissingWeaponInfo, getTierEmoji, getTierEmojiPath, getRarity};