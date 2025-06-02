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

function applyContent(el, content, config = {}) {
  if (typeof content === "string") {
    el.innerHTML = content;
    return;
  }
  el.appendChild(content);
}

const injectors = [
  {
    selector: "#navbar",
    load: () => fetch("./donatorPages/navBar.html").then(r => r.text()),
  },
  {
    selector: "#construction",
    load: () => {
      const numImages = 6;
      const randomIndex = Math.floor(Math.random() * numImages) + 1;
      const imageSrc = `media/construction/${randomIndex}.gif`;

      const image = createImage(
        {
          src: imageSrc,
          alt: "Under construction…",
          height: 200     
        },
        {
          display: "block",
          margin: "0 auto"
        }
      );

      const text = document.createElement("p");
      text.textContent = "This section is currently under construction!";
      Object.assign(text.style, {
        textAlign: "center",
        fontSize: "18px",
        fontWeight: "bold",
        marginTop: "10px"
      });

      const container = document.createElement("div");
      container.appendChild(image);
      container.appendChild(text);
      container.style.padding= "2rem 2rem 0 2rem";
      container.style.margin= "0 10rem 0 10rem";
      container.style.border="1px solid lightgray";


      return Promise.resolve(container);
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

    // Attach shadow DOM
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
          if (!response.ok || response.headers.get("Content-Type")?.includes("text/html")) {
            img.src = pngSrc; 
            //console.log("image source is:" + pngSrc);
            //console.log(response);
            throw new Error("GIF not found, switching to PNG...");
          }else{
            img.src = gifSrc;
            //console.log("image source is:" + gifSrc);
            //console.log(response);
          }
        })
        .catch(() => {
          img.src = pngSrc; // Default to PNG in case of error
          //console.log("we're inside the png error thing");
          //console.log("(from error) image source is:" + pngSrc);
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
      this.style.all="unset";
      this.textContent = ""; 
    });
  }
}

// Define the custom element
customElements.define("owo-img", OwOimg);