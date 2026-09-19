import { visit } from 'unist-util-visit'
import emojiJson from './remark-emotes.json'

function parseEmojiJson(data) {
	function parseEmoteObject({ manifest, folderPath }) {
		const entries = Object.entries(manifest).map(([key, value]) => [key, folderPath + value])
		return Object.fromEntries(entries)
	}
	const unsightlyArray = Object.values(data).map(parseEmoteObject)
	const prettyObject = Object.assign({}, ...unsightlyArray)
	return prettyObject
}

const emojis = parseEmojiJson(emojiJson)

const EMOTE_REGEX = /:([a-z0-9_+]+):/g

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
