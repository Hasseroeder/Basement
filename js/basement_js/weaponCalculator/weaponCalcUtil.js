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
    img.style.margin = "0 0 0.17rem 0";
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

function getWeaponImage(weaponOrPassive){
    const shorthand = weaponOrPassive.aliases[0]? weaponOrPassive.aliases[0]: weaponOrPassive.name;
    const img = document.createElement("img");
    img.src = getWeaponImagePath(weaponOrPassive);
    img.ariaLabel= shorthand.toLowerCase();
    img.alt=":"+shorthand.toLowerCase()+":";
    img.style.borderRadius="0.2rem";
    img.draggable=false;
    img.className="discord-pet-display";

    return img;
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

export { valueToPercent, percentToValue, getRarity,getStat,getShardValue,syncWear,calculateQualities,getStatImage,getWeaponImage,getWeaponImagePath};