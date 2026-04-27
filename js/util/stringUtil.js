export function signedNumberFixedString(input, fixed) {
	if (input == undefined || Number.isNaN(input)) return NaN
	const formatted = Math.abs(input.toFixed(fixed))
	const sign = input < 0 ? '-' : '+'
	return sign + formatted
}

export function capitalizeFirstLetter(string) {
	return string.slice(0, 1).toUpperCase() + string.slice(1)
}

export const zeroPad = (num, places) => String(num).padStart(places, '0')

export function numStringToSubscript(string) {
	;['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'].forEach(
		(subscript, i) => (string = string.replaceAll(String(i), subscript))
	)
	return string
}
