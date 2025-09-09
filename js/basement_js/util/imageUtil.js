export function gridInjector({
        container,
        items,
		baseHref,
		wantIDs,
		hashType= "id",
		columns = "repeat(3, 3.4rem)",
		transform="translate(-2.70rem,1.5%)"
    }){
	
	container.className="toolbarSubMenu navbar-grid";
	container.style.gridTemplateColumns=columns;
	container.style.transform=transform;

	const combinedItems = items.reduce(
		(acc, itemMap) => ({ ...acc, ...itemMap }),
		{}
	);

	Object.values(combinedItems).forEach(({ aliases = [], name, path, objectType, id }) => {
		const shortHand   = aliases[0] ?? name;
		const imagePath   = path ?? `media/owo_images/f_${shortHand.toLowerCase()}.png`;

		var link          = `/${baseHref ?? objectType}.html`;	
		const v = { id, name, shortHand }[hashType];
		link += v ? `#${v}` : '';

		var text  = objectType === 		'weapon'? shortHand : name;
			text += wantIDs && id && id != "100"? "<br>"+id : "";

		container.append(
			getImageLink(link, imagePath, text)
		);
	});
}

function getImageLink(link, path, text){
	const a = document.createElement("a");
	a.href = link;
	a.className = "tooltip";

	const img = document.createElement("img");
	img.src = path;
	img.style.width = "2.5rem";
	a.append(img);

	const tooltip = document.createElement("div");
	tooltip.innerHTML = text;
	tooltip.className = "navBar-tooltip-text";
	a.append(tooltip);

	return a;
}