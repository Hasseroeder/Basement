import { gridInjector } from "./util/injectionUtil.js";
import { loadJson } from "./util/jsonUtil.js";
import * as cookieUtil from "./util/cookieUtil.js"

const afterWeapons = {
  weaponCalculator: { 
    name: "Weapon Calculator",                // displayName
    objectType: "weaponcalculator",           // href links to this
    aliases: [],                              // needed to be consistent with rest of JSON
    path:"./media/misc_images/cogwheel2.png", // image source
    showThisID:false                          // id not shown
  }
};

function createImage(attrs = {}, styles = {}) {
	const img = document.createElement("img");
	Object.entries(attrs).forEach(([key, val]) => {
		if ((key === "width" || key === "height") && typeof val === "number") {
			img[key] = val;
		} else {
			img.setAttribute(key, val);
		}
	});
	Object.assign(img.style, styles);
	return img;
}

const injectors = [
  {
		selector: "#navbar",
		load: () => {
			return fetch("./donatorPages/navBar.html")
				.then(r => r.text())
				.then(async html => {
          const template = document.createElement('template');
          template.innerHTML = html;
          const fragment = template.content;

          const [weapons, passives] = await Promise.all([
            loadJson("../json/weapons.json"),
            loadJson("../json/passives.json")
          ]);

					gridInjector({
						container: fragment.querySelector('#menuWeaponContainer'),
					  items: [weapons,afterWeapons]
          });
					gridInjector({
						container: fragment.querySelector("#menuPassiveContainer"),
						items: [passives]
					});
					return fragment;
				});
		},
  },
	{
		selector: ".center-pillar",
		load: () => {
			const blinkies = [
				{src:"../media/misc_images/blinkiesCafe-7m.gif",href:"https://blinkies.cafe/"},
				{src:"../media/misc_images/blinkiesCafe-ji.gif",href:"https://blinkies.cafe/"},
				{src:"../media/misc_images/autism_blinkie2.gif",cookie:"tbh"},
				{src:"../media/misc_images/advert_blinkie.gif",href:"https://github.com/Hasseroeder/Basement/"},
				{src:"../media/misc_images/rbot_blinkie.gif",href:"https://discord.com/oauth2/authorize?client_id=519287796549156864&scope=bot%20applications.commands&permissions=347200"},
				{src:"../media/misc_images/obs_blinkie.gif",href:"https://discord.gg/owobot"},
				{src:"../media/misc_images/anydice_blinkie.gif",href:"https://anydice.com/"},
				{src:"../media/misc_images/neon_blinkie.gif",href:"https://discord.gg/neonutil"},
				{src:"../media/misc_images/dontasktoask_blinkie.png",href:"https://dontasktoask.com/"}
			];

			const myBlinkies = fourRandoms(blinkies);

			const wrapper=document.createElement("div");
			wrapper.style ="margin: 2rem 4rem; gap: 0.5rem; display: flex; flex-wrap: nowrap;";

			myBlinkies.forEach(blinkie => {
				const img = document.createElement("img");
				img.src = blinkie.src;
				img.className="blinkie";
				const a = document.createElement("a");
        a.style= "display:block; flex: 1 1 0;";
        a.append(img);
        if (blinkie.href){
          a.target="_blank";
          a.href = blinkie.href;
        }	
        if (blinkie.cookie){
          a.addEventListener("click",()=>{
            const value = !(cookieUtil.getCookie(blinkie.cookie)=="true");
            cookieUtil.setCookie(blinkie.cookie, value, 30);
          });
        }
				wrapper.append(a);    
			});

			return Promise.resolve(wrapper);
		},
  },
  {
    selector: "#construction",
    load: () => {
      const container = document.createElement("div");

      Object.assign(container.style, {
        padding: "2rem 2rem 2rem 2rem",
        margin: "2rem 10rem 2rem 10rem",
        border:"1px solid gray",
      });

      const gifPromise = fetch("../media/construction/construction-list.json")
      .then(res => res.json())
      .then(files =>{
        const gifFiles = files.filter(f => f.endsWith(".gif"));
        const idx = Math.floor(Math.random()*gifFiles.length);
        const img = createImage(
          {
          src: `../media/construction/${gifFiles[idx]}`,
          alt:"Under construction...",
          height: 150 
          },{
              display: "block",
              margin: "0 auto"
            }
          );
        container.appendChild(img);
        return img;
      });

      gifPromise
        .then(()=> fetch("../donatorPages/underConstruction.html"))
        .then(res => {
          if (!res.ok) throw new Error("HTML not found");
          return res.text();
        })
        .then(htmlString => {
          const wrapper = document.createElement("div");
          wrapper.innerHTML = htmlString;
          container.appendChild(wrapper);
        });

      return gifPromise.then(() => container);
    }
  }  
];

function fourRandoms(myArray){
  for (let i = myArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [myArray[i], myArray[j]] = [myArray[j], myArray[i]];
  }
  const count = Math.min(4, myArray.length);
  return myArray.slice(0, count);
}

function initInjectors() {
  injectors.forEach(({ selector, load }) => {
    const el = document.querySelector(selector);
    if (!el) return;
    load().then(child => el.append(child));
  });
}

window.addEventListener("DOMContentLoaded", initInjectors);

cookieStore.addEventListener('change', () => {
  checkForTBH();
});

checkForTBH();

function checkForTBH(){
  if (cookieUtil.getCookie("tbh")=="true"){
    document.body.classList.add("tbh");
  }else{
    document.body.classList.remove('tbh');
  }
}