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
	container.append(...items.map(
		item=>makeGridItem(
			onItemClick,
			baseLink  + "#" + item.slug,
			`media/owo_images/f_${item.slug}.png`,
			item.name + (item.id ? "<br>"+item.id : "")
		)
	));
}

const makeGridItem = (onClick, link, path, text) =>
	make(
		onClick?"button":"a",
		{
			href: link,
			className: "tooltip unset-me",
			onClick
		},[
			make("img",{src:path,	   style:{width:"2.5rem"}}),
			make("div",{innerHTML:text,className:"navBar-tooltip-text"})
		]
	)

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

    if (location.hash === "#"+html.name) {
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