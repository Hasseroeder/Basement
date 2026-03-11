import { make } from "../util/injectionUtil.js"

function getRarity(quality) {
	const tiers = [
		{ maxQuality: 20, name: "common" },
		{ maxQuality: 40, name: "uncommon" },
		{ maxQuality: 60, name: "rare" },
		{ maxQuality: 80, name: "epic" },
		{ maxQuality: 94, name: "mythic" },
		{ maxQuality: 99, name: "legendary" },
		{ maxQuality: 105, name: "fabled" }
	];

	const tier = tiers.find(t => Math.floor(quality) <= t.maxQuality)
				|| tiers.at(-1);
				//default to fabled
	return tier.name;
}

const percentToValue = 
	(percent, { min, range }) =>
  	min + (range * percent) / 100;

const valueToPercent =
	(value, { min, range}) =>
	Math.round(100 * (value - min) / range);


function getStatImage(inputString,className) {
    const gifUrl = `../media/owo_images/battleEmojis/${inputString}.gif`;
    const pngUrl = `../media/owo_images/battleEmojis/${inputString}.png`;
    const imageClasses =  'discord-embed-emote ' + className??""

    const image = make("img",{
        alt: `:${inputString}:`,
        ariaLabel : inputString,
        title : `:${inputString}:`,
        className: imageClasses
    });

    fileExists(gifUrl).then(exists => 
        image.src = exists ? gifUrl : pngUrl
    );
    
    return image;
}

async function fileExists(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return (res.ok && !res.headers.get("Content-Type")?.includes("text/html"));
    } catch {
        return false;
    }
}

function getTierEmoji(tier){
    return make("img",{
        src: getTierEmojiPath(tier),
        alt: tier,
        ariaLabel: tier,
        title: `:${tier}:`,
        className: "discord-embed-emote"
    })
}

function getTierEmojiPath(stringOrQuality){
    const paths = {
        common: 	"../media/owo_images/tiers/common.png",
        uncommon:   "../media/owo_images/tiers/uncommon.png",
        rare:   	"../media/owo_images/tiers/rare.png",
        epic:     	"../media/owo_images/tiers/epic.png",
        mythic:  	"../media/owo_images/tiers/mythic.png",
        legendary:	"../media/owo_images/tiers/legendary.gif",
        fabled: 	"../media/owo_images/tiers/fabled.gif"
    };
    if (stringOrQuality === undefined){
        return paths["fabled"];
    }else if (typeof stringOrQuality === "string"){
        return paths[stringOrQuality];
    }else if(typeof stringOrQuality === "number"){
        return paths[getRarity(stringOrQuality)];
    }
}

const wpEmojiPath = wp =>
    "media/owo_images/battleEmojis/" + wp.prefix + wp.tier.at(0) + "_" + wp.slug + ".png"

export { wpEmojiPath, valueToPercent, percentToValue,getStatImage, getTierEmoji, getTierEmojiPath, getRarity};