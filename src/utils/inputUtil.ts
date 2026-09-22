export function roundToDecimals(value: number, decimals: number) {
	const factor = Math.pow(10, decimals)
	return Math.round(value * factor) / factor
}

export function toFixedDigits(value: number, digits: number) {
	const digitsBeforeDot = value.toFixed(0).length
	const neededDigitsAfterDot = digits - digitsBeforeDot
	const boundRounding = Math.max(0, neededDigitsAfterDot)

	return roundToDecimals(value, boundRounding).toLocaleString()
}

export function debounce<T extends (...args: any[]) => any>(
	fn: T,
	wait = 200
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout>

	return function debounced(this: ThisParameterType<T>, ...args: Parameters<T>) {
		const context = this
		clearTimeout(timeoutId)
		timeoutId = setTimeout(() => fn.apply(context, args), wait)
	}
}

export function makeRepeatingButton(
	el: HTMLElement,
	action: () => void,
	delay = 400,
	interval = 50
) {
	let timeoutId: ReturnType<typeof setTimeout>
	let intervalId: ReturnType<typeof setInterval>

	const start = () => {
		stop()
		action()

		timeoutId = setTimeout(() => {
			intervalId = setInterval(action, interval)
		}, delay)
	}

	const stop = () => {
		clearTimeout(timeoutId)
		clearInterval(intervalId)
	}

	el.addEventListener('mousedown', start)
	el.addEventListener('mouseup', stop)
	el.addEventListener('mouseleave', stop)
	el.addEventListener('touchstart', start)
	el.addEventListener('touchend', stop)
}
