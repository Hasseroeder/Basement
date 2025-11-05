import { initCustomSelect } from './customSelect.js';
import { loadJson } from '../util/jsonUtil.js';
import { updateEverything,generateEverything } from './weaponCalcMessageGenerator.js';
import { initiatePassiveStuffs } from './weaponCalcPassive.js';
import { fillMissingWeaponInfo,applyWearToWeapon } from './weaponCalcUtil.js'
import { blueprintStringToWeapon } from './blueprintParser.js';
import { gridInjector } from '../util/injectionUtil.js';

const weaponsPromise = loadJson("../json/weapons.json");
const passivesPromise = loadJson("../json/passives.json");
const [weapons, passives] = await Promise.all([
	weaponsPromise,
	passivesPromise
]);
delete weapons[100]; // gotta get rid of fists

gridInjector({
	container: document.querySelector("#weaponImageGrid"),
	items: [weapons],
	columns: `repeat(4, 3.5rem)`,
	transform: `translate(6.5rem, -6rem)`,
	gridClasses: ["extra-padding"],
	onItemClick: handleClick
});

const currentWeapon= wepFromHash();
initiateWeapon(currentWeapon);
console.log(currentWeapon);

const wearSelectRoot = initCustomSelect(
	currentWeapon.product.blueprint.wear
);
// remove the wear on init
// instead on each new weapon, we manually change the wear with changeIndex

wearSelectRoot.addEventListener('change', e => wearWasChanged(e,currentWeapon));

function handleClick(item) {
  // do something
}

function wepFromHash(){
	const hash = location.hash.substring(1);
	const blueprintObject = blueprintStringToWeapon(hash,weapons,passives);

	const weapon = weapons[blueprintObject.id];

	weapon.product.blueprint = {
		...weapon.product.blueprint,
		stats: JSON.parse(JSON.stringify(blueprintObject.stats)),
		wear: JSON.parse(JSON.stringify(blueprintObject.wear)),
		passive: JSON.parse(JSON.stringify(blueprintObject.passive))
		// I HAVE NO IDEA WHY I NEED TO CLONE THIS
		// BUT ITS THE ONLY WAY TO GET IT WORKING
	};

	return weapon;
}

async function initiateWeapon(weapon){
	fillMissingWeaponInfo(weapon);		
	initiatePassiveStuffs(weapon,passives);			
	applyWearToWeapon(
		weapon,
		weapon.product.blueprint.wear
	);
	generateEverything(weapon);	
}

function wearWasChanged(e,weapon){
	applyWearToWeapon(weapon,e.detail.value);
	updateEverything(weapon);
}
