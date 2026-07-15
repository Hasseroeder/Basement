export function clampedInput(el, value) {
	const min = parseFloat(el.min)
	const max = parseFloat(el.max)

	if (isNaN(value)) {
		return
	} else if (value < min) {
		el.value = min
	} else if (value > max) {
		el.value = max
	} else {
		el.value = value
	}
}

export function clampNumber(min, max, value) {
	if (isNaN(value)) return
	return Math.min(Math.max(value, min), max)
}

export function roundToDecimals(value, decimals) {
	const factor = Math.pow(10, decimals)
	return Math.round(value * factor) / factor
}

export function toFixedDigits(value, digits) {
	const digitsBeforeDot = String(value.toFixed(0)).length
	const neededDigitsAfterDot = digits - digitsBeforeDot
	const boundRounding = Math.max(0, neededDigitsAfterDot)

	return roundToDecimals(value, boundRounding).toLocaleString()
}

export function debounce(fn, wait = 200, immediate = false) {
	let timeoutId

	return function debounced(...args) {
		const context = this
		const callNow = immediate && !timeoutId

		clearTimeout(timeoutId)
		timeoutId = setTimeout(() => {
			timeoutId = null
			if (!immediate) fn.apply(context, args)
		}, wait)

		if (callNow) fn.apply(context, args)
	}
}

export function makeRepeatingButton(el, action, delay = 400, interval = 50) {
	let timeoutId = null
	let intervalId = null

	const start = () => {
		action()

		timeoutId = setTimeout(() => {
			intervalId = setInterval(action, interval)
		}, delay)
	}

	const stop = () => {
		clearTimeout(timeoutId)
		clearInterval(intervalId)
		timeoutId = null
		intervalId = null
	}

	el.addEventListener('mousedown', start)
	el.addEventListener('mouseup', stop)
	el.addEventListener('mouseleave', stop)
	el.addEventListener('touchstart', start)
	el.addEventListener('touchend', stop)
}
