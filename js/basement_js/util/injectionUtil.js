export function gridInjector({
        container,								// container
        items,									// array of objects, those objects containing items
		baseHref,								// baseHref
		hashType= "id",							// type of hash the builder should add
		onItemClick,							// event listener
		columns = "repeat(3, 3.5rem)",			// custom styles for your grid
		transform="translate(-2.8rem,1.5%)",	// custom styles for your grid
		gridClasses=[]							// custom classes for your grid
    }){
	
	container.className="toolbarSubMenu navbar-grid";
	container.style.gridTemplateColumns=columns;
	container.style.transform=transform;

	container.classList.add(...gridClasses);

	const combined = items.reduce((acc, m) => ({ ...acc, ...m }), {});

	Object.values(combined).forEach(item => {
		const shortHand   = item.aliases[0] ?? item.name;
		const imagePath   = item.path ?? `media/owo_images/f_${shortHand.toLowerCase()}.png`;
		var link          = `/${baseHref ?? item.objectType}.html`;	

		const v = { id: item.id, shortHand }[hashType];
		link += v ? `#${v}` : '';

		var text  = (item.objectType=='weapon' ? shortHand : item.name)
				  + (item.showThisID? "<br>"+item.id : "");

		const el = getImageLink(onItemClick, item, link, imagePath, text);

		container.append(el);
	});
}

function getImageLink(onClick, item, link, path, text){
	const el = document.createElement(onClick?"button":"a");
	el.href = link;
	el.className = "tooltip unset-me";
	const img = document.createElement("img");
	img.src = path;
	img.style.width = "2.5rem";
	const tooltip = document.createElement("div");
	tooltip.innerHTML = text;
	tooltip.className = "navBar-tooltip-text";
	el.append(img,tooltip);

	if (onClick){
		el.addEventListener("click", () => onClick(item));
	}

	return el;
}

export async function createInjectAble(html,pathName){
    const response = await fetch(pathName+html.name+".html");
    const htmlContent = await response.text();
    html.cachedDiv = document.createElement('div');
    html.cachedDiv.innerHTML = htmlContent;

    const container = document.getElementById(`${html.name}Container`);
    container.querySelector('button').addEventListener("click", () => {
        html.created ? container.lastElementChild.remove() 
                        : container.appendChild(html.cachedDiv);
        html.created = !html.created;
    });

    html.init?.();

    if (window.location.hash === "#"+html.name) {
        container.appendChild(html.cachedDiv);
        html.created= true;
        container.scrollIntoView({ behavior: "smooth", block: "start"});
    }
}

export const make = (tag, props = {}, children) => {
    const el = document.createElement(tag);
    if (props.style && typeof props.style == "object") {
        Object.assign(el.style, props.style);
        delete props.style;
    }
    if (props.dataset && typeof props.dataset === "object") {
        Object.assign(el.dataset, props.dataset);
        delete props.dataset;
    }

    Object.assign(el, props);
    if (children){
        el.append(...children);
    }
    return el;
};

export function doTimestamps(){
	document.querySelectorAll('.discord-timestamp').forEach(el=>el.textContent=new Date().toTimeString().slice(0,5));
}