import { visit } from 'unist-util-visit'

const emojis = {
	//Buffs and Debuffs
	taunt: '/src/assets/images/owo_images/battleEmojis/taunt.png',
	freeze: '/src/assets/images/owo_images/battleEmojis/freeze.png',
	poison: '/src/assets/images/owo_images/battleEmojis/poison.png',
	flame: '/src/assets/images/owo_images/battleEmojis/flame.png',
	celeb: '/src/assets/images/owo_images/battleEmojis/celeb.png',
	mortality: '/src/assets/images/owo_images/battleEmojis/mort.png',
	mort: '/src/assets/images/owo_images/battleEmojis/mort.png',
	leech: '/src/assets/images/owo_images/battleEmojis/leech.png',
	stinky: '/src/assets/images/owo_images/battleEmojis/stinky.png',
	attup: '/src/assets/images/owo_images/battleEmojis/attup.png',
	'attup+': '/src/assets/images/owo_images/battleEmojis/attup+.png',
	'attup++': '/src/assets/images/owo_images/battleEmojis/attup++.png',
	defup: '/src/assets/images/owo_images/battleEmojis/defup.png',
	//Weapons
	f_shield: '/src/assets/images/owo_images/battleEmojis/f_shield.png',
	f_banner: '/src/assets/images/owo_images/battleEmojis/f_banner.png',
	f_hgen: '/src/assets/images/owo_images/battleEmojis/f_hgen.png',
	f_wgen: '/src/assets/images/owo_images/battleEmojis/f_wgen.png',
	//Misc
	woah: '/src/assets/images/misc_images/woah.png',
}

const EMOTE_REGEX = /:([a-z0-9_]+):/g

export default function remarkEmotes() {
	return (tree) => {
		visit(tree, 'text', (node, index, parent) => {
			if (index == null || !parent) return

			const value = node.value

			let match
			let lastIndex = 0
			const newNodes = []

			while ((match = EMOTE_REGEX.exec(value)) !== null) {
				const emojiName = match[1]
				const emojiSrc = emojis[emojiName]

				// Not one of our emotes
				if (!emojiSrc) continue

				// Text before the emote
				if (match.index > lastIndex) {
					newNodes.push({
						type: 'text',
						value: value.slice(lastIndex, match.index),
					})
				}

				// The emote itself
				newNodes.push({
					type: 'html',
					value: `<img class="emote" src="${emojiSrc}" alt="${emojiName}" />`,
				})

				lastIndex = match.index + match[0].length
			}

			// No emotes found
			if (newNodes.length === 0) return

			// Remaining text
			if (lastIndex < value.length) {
				newNodes.push({
					type: 'text',
					value: value.slice(lastIndex),
				})
			}

			parent.children.splice(index, 1, ...newNodes)
		})
	}
}
