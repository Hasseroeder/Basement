export async function createInjectAble(html, pathName) {
	const response = await fetch(pathName + html.name + '.html')
	const htmlContent = await response.text()
	html.cachedDiv = make('div', { className: 'injectable-box' })
	html.cachedDiv.innerHTML = htmlContent

	const container = document.getElementById(`${html.name}Container`)

	const button = container.querySelector('button')

	button.addEventListener('click', () => {
		html.created ? container.lastElementChild.remove() : container.appendChild(html.cachedDiv)
		html.created = !html.created
		button.classList.toggle('opened')
	})

	html.init?.()

	if (location.hash === '#' + html.name) {
		container.appendChild(html.cachedDiv)
		html.created = true
		container.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}
}

export const make = (tag, props = {}, children) => {
	const el = document.createElement(tag)
	if (props.style && typeof props.style == 'object') {
		Object.assign(el.style, props.style)
		delete props.style
	}
	if (props.dataset && typeof props.dataset === 'object') {
		Object.assign(el.dataset, props.dataset)
		delete props.dataset
	}

	for (const [key, value] of Object.entries(props)) {
		if (value === undefined) continue
		el[key] = value
	}

	if (children) {
		el.append(...children)
	}
	return el
}

export function doTimestamps() {
	document
		.querySelectorAll('.discord-timestamp')
		.forEach((el) => (el.textContent = new Date().toTimeString().slice(0, 5)))
}
