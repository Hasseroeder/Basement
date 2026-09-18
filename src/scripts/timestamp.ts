document
	.querySelectorAll('.discord-message__timestamp')
	.forEach((el) => (el.textContent = new Date().toTimeString().slice(0, 5)))
