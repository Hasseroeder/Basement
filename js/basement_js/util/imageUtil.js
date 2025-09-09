export function smallInjector({
        container,
        items,
        idOffset,
        baseHref,
        includeCalculator = false,
		columns = "repeat(3, 3.4rem)",
		transform="translate(-2.70rem,1.5%)"
    }){
	
	container.className="toolbarSubMenu navbar-grid";
	container.style.gridTemplateColumns=columns;
	container.style.transform=transform;

	items.forEach((object,id)=>{
		const link = `/${baseHref}.html#${idOffset+id}`;
		const path =`media/owo_images/f_${object.at(-1).toLowerCase()}.png`;
		const text = object[0] + (object[1]? "<br>"+object[1]:"");
		container.append(
			getImageLink(link,path,text)
		);
	});

	if (includeCalculator){
		container.append(
			getImageLink("/weaponcalculator.html", "media/misc_images/cogwheel2.png", "Weapon Calculator")
		);
	}
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