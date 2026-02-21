import { gridInjector,make } from "./util/injectionUtil.js";
import { loadJson } from "./util/jsonUtil.js";
import * as cookieUtil from "./util/cookieUtil.js"

const injectors = [
  	{
		selector: "#navbar",
		load: async () => {
			const res = await fetch("/donatorPages/navBar.html"); 
			const html = await res.text();
			const fragment = document.createRange().createContextualFragment(html);

			await Promise.all([
				loadJson("../json/weapons.json").then(items =>
					gridInjector({container: fragment.querySelector('#menuWeaponContainer'),baseLink:"/weapon.html",items})
				),
				loadJson("../json/passives.json").then(items =>
					gridInjector({container: fragment.querySelector("#menuPassiveContainer"),baseLink:"/passive.html",items})
				)
			]);

			return fragment;
		}
  	},
	{
		selector: ".center-pillar",
		load: async () => {
			const blinkies = randomElements(4,
				[
					{file:"blinkiesCafe-7m.gif" ,href:"https://blinkies.cafe/"},
					{file:"blinkiesCafe-ji.gif" ,href:"https://blinkies.cafe/"},
					{file:"autism_blinkie2.gif" ,fn: () => cookieUtil.setCookie("tbh", cookieUtil.getCookie("tbh") !== "true", 30)},
					{file:"advert_blinkie.gif"  ,href:"https://github.com/Hasseroeder/Basement/"},
					{file:"rbot_blinkie.gif"    ,href:"https://discord.com/oauth2/authorize?client_id=519287796549156864&scope=bot%20applications.commands&permissions=347200"},
					{file:"obs_blinkie.gif"     ,href:"https://discord.gg/owobot"},
					{file:"anydice_blinkie.gif" ,href:"https://anydice.com/"},
					{file:"neon_blinkie.gif"    ,href:"https://discord.gg/neonutil"},
					{file:"dontasktoask_blinkie.png",href:"https://dontasktoask.com/"}
				]
			);
			const createBlinkie = blinkie => 
				make("a",{target:"_blank", href: blinkie.href, onclick: blinkie.fn },[
					make("img",{className:"blinkie", src:"../media/blinkies/" + blinkie.file})
				]);

			return make("footer",{className:"blinkie-footer"},blinkies.map(createBlinkie));
		},
	},
	{
		selector: "#construction",
		load: async () => {
			const container = make("div",{className:"construction-container"});

			const [json,html] = await Promise.all([
				fetch("../media/construction/construction-list.json").then(r => r.json()),
				fetch("../donatorPages/underConstruction.html").then(r => r.text())
			])

			const giflist = json.filter(f => f.endsWith(".gif"));
			const idx = Math.floor(Math.random() * giflist.length);

			container.append(
				make("img", {
					src: `../media/construction/${giflist[idx]}`,
					alt: "Under construction...",
					className: "construction-image"
				}),
				make("div", { innerHTML: html })
			);

			return container;
		}
	}
];

function initInjectors() {
  	injectors.forEach(({ selector, load }) => {
		const el = document.querySelector(selector);
		if (!el) return;
		load().then(child => el.append(child));
  	});
}

window.addEventListener("DOMContentLoaded", initInjectors);

function randomElements(n,inputArray){
	const clone = [...inputArray]
 	for (let i = clone.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[clone[i], clone[j]] = [clone[j], clone[i]];
  	}
  	const count = Math.min(n, clone.length);
  	return clone.slice(0, count);
}

cookieStore.addEventListener('change', checkForTBH);
checkForTBH();

function checkForTBH(){
	document.body.classList.toggle(
		"tbh",
		cookieUtil.getCookie("tbh")=="true"
	)
}