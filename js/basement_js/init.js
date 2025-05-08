fetch("./donatorPages/navBar.html")
.then(response => response.text())
.then(data => {
  document.getElementById("navbar").innerHTML = data;
})
.catch(error => console.error("Error loading navbar:", error));


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