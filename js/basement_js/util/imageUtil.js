export function smallInjector({
        container,
        items,
        idOffset,
        baseHref,
        includeCalculator = false
    }){
	items.forEach((object,id)=>{
		const link = `/${baseHref}.html#${idOffset+id}`;
		const path =`media/owo_images/f_${object.at(-1).toLowerCase()}.png`;
		const text = object[0] + (object[1]? "<br>"+object[1]:"");
		appendImageLink(container,link,path,text);
	});

	if (includeCalculator){
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