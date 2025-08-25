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

export { valueToPercent, percentToValue, getRarity,getStat,getShardValue,syncWear,calculateQualities};