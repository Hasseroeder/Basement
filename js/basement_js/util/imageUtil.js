export function gridInjector({
        container,								// container
        items,									// array of objects, those objects containing items
		baseHref,								// baseHref
		hashType= "id",							// type of hash the builder should add
		onItemClick,							// event listener
		columns = "repeat(3, 3.4rem)",			// custom styles for your grid
		transform="translate(-2.70rem,1.5%)"	// custom styles for your grid
    }){
	
	container.className="toolbarSubMenu navbar-grid";
	container.style.gridTemplateColumns=columns;
	container.style.transform=transform;

	const combined = items.reduce((acc, m) => ({ ...acc, ...m }), {});

	Object.values(combined).forEach(item => {
		const shortHand   = item.aliases[0] ?? item.name;
		const imagePath   = item.path ?? `media/owo_images/f_${shortHand.toLowerCase()}.png`;
		var link          = `/${baseHref ?? item.objectType}.html`;	

		const v = { id: item.id, shortHand }[hashType];
		link += v ? `#${v}` : '';

		var text  = (item.objectType=='weapon' ? shortHand : item.name)
				  + (item.showThisID? "<br>"+item.id : "");


		const el = onItemClick
				? getClickableTile(imagePath, text)      
				: getImageLink(link, imagePath, text);

		container.append(el);
	});
}

function getImageLink(link, path, text){
	const a = document.createElement("a");
	a.href = link;
	a.className = "tooltip";
	const img = document.createElement("img");
	img.src = path;
	img.style.width = "2.5rem";
	const tooltip = document.createElement("div");
	tooltip.innerHTML = text;
	tooltip.className = "navBar-tooltip-text";
	a.append(img,tooltip);

	return a;
}