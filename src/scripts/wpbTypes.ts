type _RawBaseWeapon = {
	name: string
	aliases: string[]
	slug: string
	wikiStars: { name: string; stars: number }[]
}

export type RawQuasiWeapon = _RawBaseWeapon & {
	objectType: 'quasiweapon'
}

export type RawWeapon = _RawBaseWeapon & {
	objectType: 'weapon'
	id: number
	rawStatConfigs: RawStatConfig[]
	rawWPStatConfig?: RawStatConfig
	buffSlugs: string[]
	description: string
	normalPassiveAmount: 1 | 2
}

export type RawStatConfig = {
	min: number
	max: number
	emoji: string[]
	unit: string
	digits: number
}

export type RawBuff = {
	objectType: 'buff'
	name: string
	aliases: string[]
	description: string
	slug: string
	rawStatConfigs: RawStatConfig[]
	traits: { slug: string; value?: number }[]
}

export type RawPassive = {
	objectType: 'passive'
	name: string
	aliases: string[]
	slug: string
	rawStatConfigs: RawStatConfig[]
	buffSlugs: string[]
	description: string
}
