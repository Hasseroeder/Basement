export function gridInjector({
        container,								// container
        items,									// array of items
		baseLink,								// baseLink
		onItemClick,							// event listener
		columns = "repeat(3, 3.5rem)",			// custom styles grid
		transform="translate(-2.8rem,1.5%)",	// custom styles grid
		gridClasses=[]							// custom classes grid
    }){
	
	container.className="toolbarSubMenu navbar-grid";
	container.style.gridTemplateColumns=columns;
	container.style.transform=transform;

	container.classList.add(...gridClasses);

	items.forEach(item => {
		const shortHand   = item.aliases[0] ?? item.name;
		const imagePath   = `media/owo_images/f_${shortHand.toLowerCase()}.png`;
		const link        = baseLink  + "#" + shortHand;	

		var text  = (item.objectType=='weapon' ? shortHand : item.name)
				  + (item.id ? "<br>"+item.id : "");

		const el = getImageLink(onItemClick, item, 
			link, 
			imagePath, text);

		container.append(el);
	});
}

function getImageLink(onClick, item, link, path, text){
	const el = make(onClick?"button":"a",{
			href: link,
			className: "tooltip unset-me"
		},[
			make("img",{src:path,	   style:{width:"2.5rem"}}),
			make("div",{innerHTML:text,className:"navBar-tooltip-text"})
		]
	);

	if (onClick)
		el.addEventListener("click", () => onClick(item));

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

	for (const [key, value] of Object.entries(props)) {
		if (value === undefined) continue;
		el[key] = value;
	}
	
    if (children){
        el.append(...children);
    }
    return el;
};

export function doTimestamps(){
	document.querySelectorAll('.discord-timestamp').forEach(el=>el.textContent=new Date().toTimeString().slice(0,5));
}