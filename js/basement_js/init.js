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

const weapons = [
  ["???","Fists"],
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
]

const injectors = [
  {
    selector: "#navbar",
    load: () => {
      return fetch("./donatorPages/navBar.html")
        .then(r => r.text())
        .then(html => {
          const container = document.querySelector("#navbar");
          container.innerHTML = html;

          const weaponContainer = container.querySelector("#menuWeaponContainer");

          weapons.forEach((weapon,id)=>{
            const a = document.createElement("a");
            a.href = "/weapon.html#" + (100+id);
            a.title= `${weapon[0]} ${weapon[1]}`;
            weaponContainer.append(a);

            const img = document.createElement("img");
            img.src=`media/owo_images/f_${weapon[1].toLowerCase()}.png`;
            img.style.width="2.5rem";
            a.append(img);
          });

          return container.innerHTML;
        });
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