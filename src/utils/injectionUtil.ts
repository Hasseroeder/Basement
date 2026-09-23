export const make = <K extends keyof HTMLElementTagNameMap>(
	tag: K,
	props: {
		style?: Record<string, string>
		dataset?: Record<string, string>
		[key: string]: any
	} = {},
	children?: (Node | string)[]
): HTMLElementTagNameMap[K] => {
	const el = document.createElement(tag)
	if (props.style && typeof props.style === 'object') {
		Object.assign(el.style, props.style)
		delete props.style
	}
	if (props.dataset && typeof props.dataset === 'object') {
		Object.assign(el.dataset, props.dataset)
		delete props.dataset
	}

	for (const [key, value] of Object.entries(props)) {
		if (value === undefined) continue
		;(el as any)[key] = value
	}

	if (children) {
		el.append(...children)
	}
	return el
}

const testDiv = make('div')
