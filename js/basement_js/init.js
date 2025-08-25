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

function applyContent(el, content) {
	if (typeof content === "string") {
		el.innerHTML = content;
		return;
	}
	el.appendChild(content);
}

const collections = {
	weapon : [
		["Fists"],
		["101","Sword"],
		["102","Hstaff"],
		["103","Bow"],
		["104","Rune"],
		["105","Shield"],
		["106","Orb"],
		["107","Vstaff"],
		["108","Dagger"],
		["109","Wand"],
		["110","Fstaff"],
		["111","Estaff"],
		["112","Sstaff"],
		["113","Scepter"],
		["114","Rstaff"],
		["115","Axe"],
		["116","Banner"],
		["117","Scythe"],
		["118","Crune"],
		["119","Pstaff"],
		["120","Lscythe"],
		["121","Ffish"],
		["122","Lrune"],
	],

  	passive : [
		["Strength","Str"],
		["Magic","Mag"],
		["Health Point","HP"],
		["Weapon Point","WP"],
		["Physical Resistance","PR"],
		["Magical Resistance","MR"],
		["Lifesteal","Ls"],
		["Thorns"],
		["Mana Tap","Mtap"],
		["Absolve","Absv"],
		["Safeguard","Sg"],
		["Critical","Crit"],
		["Discharge","Dc"],
		["Kamikaze","Kkaze"],
		["Regeneration","Hgen"],
		["Energize","Wgen"],
		["Sprout"],
		["Enrage"],
		["Sacrifice","Sac"],
		["Snail"],
		["Knowledge","Kno"]
	]
};

function smallInjector(container){
	const type = container.getAttribute("type");
	collections[type].forEach((object,id)=>{
		const link = `/${type}.html#${100+id}`;
		const path =`media/owo_images/f_${object.at(-1).toLowerCase()}.png`;
		const text = object[0] + (object[1]? "<br>"+object[1]:"");
		appendImageLink(container,link,path,text);
	});

	if (type == "weapon"){
		appendImageLink(container,"/weaponcalculator.html", "media/misc_images/cogwheel2.png", "Weapon Calculator");
	}
}

function appendImageLink(container, link, path, text){
	const a = document.createElement("a");
	a.href = link;
	a.className = "tooltip";
	container.append(a);

	const img = document.createElement("img");
	img.src = path;
	img.style.width = "2.5rem";
	a.append(img);

	const tooltip = document.createElement("div");
	tooltip.innerHTML = text;
	tooltip.className = "navBar-tooltip-text";
	a.append(tooltip);
}

const injectors = [
  	{
		selector: "#navbar",
		load: () => {
			return fetch("./donatorPages/navBar.html")
				.then(r => r.text())
				.then(html => {
					const container = document.querySelector("#navbar");
					container.innerHTML = html;

					smallInjector(container.querySelector("#menuWeaponContainer"));
					smallInjector(container.querySelector("#menuPassiveContainer"));

					return container.innerHTML;
				});
		},
  	},
	{
		selector: ".center-pillar",
		load: () => {
			const blinkies = [
				["../media/misc_images/blinkiesCafe-7m.gif","https://blinkies.cafe/"],
				["../media/misc_images/blinkiesCafe-ji.gif","https://blinkies.cafe/"],
				["../media/misc_images/blinkiesCafe-5U.gif","https://blinkies.cafe/"],
				["../media/misc_images/advert_blinkie.gif"],
				["../media/misc_images/rbot_blinkie.gif","https://discord.com/oauth2/authorize?client_id=519287796549156864&scope=bot%20applications.commands&permissions=347200"],
				["../media/misc_images/obs_blinkie.gif","https://discord.gg/owobot"],
				["../media/misc_images/anydice_blinkie.gif","https://anydice.com/"],
				["../media/misc_images/neon_blinkie.gif","https://discord.gg/neonutil"],
			];

			const myBlinkies = fourRandoms(blinkies);

			const wrapper=document.createElement("div");
			wrapper.style ="margin: 2rem 4rem; gap: 0.5rem; display: flex; flex-wrap: nowrap;";

			myBlinkies.forEach(src => {
				const img = document.createElement("img");
				img.src = src[0];
				img.className="blinkie";
				let elementToAppend = img;

				if (src[1]) {
					const link = document.createElement("a");
					link.href = src[1];
					link.style= "display:block; flex: 1 1 0;";
					link.append(img);
					link.target="_blank";
					elementToAppend = link;
				}
				wrapper.append(elementToAppend);    
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

    load()
      .then(content => applyContent(el, content))
      .catch(err =>
        console.error(`Failed to inject ${selector}:`, err)
      );
  });
}

window.addEventListener("DOMContentLoaded", initInjectors);


class OwOimg extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Create template
    this.shadowRoot.innerHTML = `<style></style>
      <slot></slot>
      <img>`;
  }

  connectedCallback() {
    const slot = this.shadowRoot.querySelector("slot");
    const img = this.shadowRoot.querySelector("img");


    let hasRun=false;
    // Extract styles from the main document
    const styleSheets = [...document.styleSheets];

    let styles = "";
    styleSheets.forEach(sheet => {
      try {
        [...sheet.cssRules].forEach(rule => {
          if (rule.selectorText?.includes(this.className)) {
            styles += rule.cssText + "\n";
          }
        });
      } catch (e) {
        console.warn("Could not access styles:", e);
      }
    });

    // Inject extracted styles into the shadow DOM
    const styleElement = document.createElement("style");
    styleElement.textContent = styles;
    this.shadowRoot.appendChild(styleElement);

    // Listen for slot changes
    slot.addEventListener("slotchange", () => {
      if (hasRun) {
        return;
      }
      hasRun=true;

      const value = slot.assignedNodes()[0]?.textContent.trim();

      const gifSrc = `media/owo_images/${value}.gif`;
      const pngSrc = `media/owo_images/${value}.png`;

      if (value) {
        
        fetch(gifSrc, { method: "GET" })
        .then((response) => {
          if (response.ok && !response.headers.get("Content-Type")?.includes("text/html")) {
            img.src = gifSrc;
          } else {
            img.src = pngSrc;
          }
        });

        img.alt = `:${value}:`;          
        img.title = `:${value}:`;         
        img.setAttribute("aria-label", `:${value}:`);
        img.draggable = false;
        img.className = this.className;
      }

      const styles = ["width", "height", "margin", "marginTop", "marginRight", "marginBottom", "marginLeft"];
      styles.forEach((prop) => {
        if (this.style[prop]) {
          img.style[prop] = this.style[prop];
        }
      });
      this.style.margin="unset";
      this.textContent = ""; 
    });
  }
}

customElements.define("owo-img", OwOimg);