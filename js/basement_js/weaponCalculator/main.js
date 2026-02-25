import { customSelect } from '../util/customSelect.js';
import { loadJson, loadAll } from '../util/jsonUtil.js';
import { gridInjector, make } from '../util/injectionUtil.js';
import { Weapon } from './weapon.js';
import * as passviveHandler from "./passiveHandler.js";

/*
gridInjector({
	container: document.querySelector("#weaponImageGrid"),
	items: [weapons],
	columns: `repeat(4, 3.5rem)`,
	transform: `translate(6.5rem, -6rem)`,
	gridClasses: ["extra-padding"],
	onItemClick: () => console.log("add something here!")
});
*/

const wpbData = await loadAll({ 
    weapons: loadJson("../json/weapons.json"), 
    passives: loadJson("../json/passives.json"), 
    buffs: loadJson("../json/buffs.json") 
});

[...wpbData.weapons,...wpbData.passives,...wpbData.buffs].forEach(StatHaver=>{
    [ ...StatHaver.statConfig , StatHaver.wpStatConfig ]
    .filter(Boolean)
    .forEach(stat=>{
        stat.range = stat.max - stat.min;
        stat.step = stat.range/100;
    })
})

const currentWeapon= Weapon.fromHash(wpbData);

const pGrid = document.querySelector('.passiveGrid');
pGrid.append(...wpbData.passives.map(
	passive=>make("img",{
		className:'passiveGridImage',
		src: `media/owo_images/battleEmojis/f_${passive.slug}.png`,
		alt: passive.slug,
		title: passive.slug,
		draggable: false,
		onmousedown: () => new passviveHandler.Passive({
			staticData: passive, 
			wpbData, 
			parent:currentWeapon
		})
	})
));

const wearSelect = new customSelect(
	currentWeapon.wear,
	document.getElementById('wearSelect'),
	["WORN","DECENT","FINE","PRISTINE"]
);
wearSelect.addEventListener('change', e => 
	currentWeapon.wear = e.detail.value
);