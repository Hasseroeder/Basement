function setCookie(name, value, daysToLive, path = '/') {
	const date = new Date()
	date.setDate(date.getDate() + daysToLive)

	let expires = 'expires=' + date.toUTCString()
	document.cookie = `${name}=${value}; ${expires}; path=${path};`
}

function deleteCookie(name, path = '/') {
	setCookie(name, '', -1, path)
}

function getCookie(name) {
	const cookieDecoded = decodeURIComponent(document.cookie)
	const cookieArray = cookieDecoded.split('; ')

	let result = null
	cookieArray.forEach((element) => {
		if (element.indexOf(name + '=') === 0) {
			result = element.substring(name.length + 1)
		}
	})

	return result
}

export { getCookie, setCookie, deleteCookie }
