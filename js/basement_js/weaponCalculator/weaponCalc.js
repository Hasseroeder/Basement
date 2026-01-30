import { customSelect } from '../util/customSelect.js';
import { loadJson } from '../util/jsonUtil.js';
import { gridInjector } from '../util/injectionUtil.js';
import { Weapon } from './weapon.js';

//const weapons = await loadJson("../json/weapons.json");
//delete weapons[100]; // gotta get rid of fists // somehow??

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

const currentWeapon= Weapon.fromDatabase(101);

const wearSelect = new customSelect(
	currentWeapon.wear,
	document.getElementById('wearSelect'),
	["WORN","DECENT","FINE","PRISTINE"]
);
wearSelect.addEventListener('change', e => {
	currentWeapon.wear = e.detail.value;
	currentWeapon.updateVars();
});