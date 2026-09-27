import * as messageHandler from './messageHandler.js'
import * as weaponHandler from './weapon.js'
import __rawWeapons from '@/src/data/weapons.json'
import __passives from '@/src/data/passives.json'
import __buffs from '@/src/data/buffs.json'
import { make } from '@/src/utils/injectionUtil.ts'
import { weaponAssetUrl } from './util.js'
import type { RawBuff, RawPassive, RawWeapon, RawQuasiWeapon } from '../../wpbTypes.js'
import { getElement } from '@/src/utils/domUtil.js'

export type PreparedWeapon = Omit<RawWeapon, 'rawStatConfigs' | 'rawWPStatConfig'> & {
	stats: messageHandler.WeaponStat[]
	wpStat?: messageHandler.WeaponStat
}
export type PreparedPassive = Omit<RawPassive, 'rawStatConfigs'> & {
	stats: messageHandler.WeaponStat[]
}
export type PreparedBuff = Omit<RawBuff, 'rawStatConfigs'> & {
	stats: messageHandler.WeaponStat[]
}

const _rawWeapons = __rawWeapons as (RawWeapon | RawQuasiWeapon)[]
const rawWeapons: RawWeapon[] = _rawWeapons.filter((rawWeapon) => rawWeapon.objectType === 'weapon')
const rawPassives = __passives as RawPassive[]
const rawBuffs = __buffs as RawBuff[]

weaponHandler.WeaponFactory.wpbData = {
	weapons: rawWeapons.map((rawWeapon) => ({
		...rawWeapon,
		rawStatConfigs: undefined,
		rawWPStatConfig: undefined,
		stats: rawWeapon.rawStatConfigs.map((rawStat) => new messageHandler.WeaponStat(rawStat)),
		wpStat: rawWeapon.rawWPStatConfig
			? new messageHandler.WeaponStat(rawWeapon.rawWPStatConfig)
			: undefined,
	})),
	passives: rawPassives.map((rawPassive) => ({
		...rawPassive,
		rawStatConfigs: undefined,
		stats: rawPassive.rawStatConfigs.map((rawStat) => new messageHandler.WeaponStat(rawStat)),
		wpStat: undefined,
	})),
	buffs: rawBuffs.map((rawBuff) => ({
		...rawBuff,
		rawStatConfigs: undefined,
		stats: rawBuff.rawStatConfigs.map((rawStat) => new messageHandler.WeaponStat(rawStat)),
		wpStat: undefined,
	})),
}
const currentWeapon = weaponHandler.WeaponFactory.fromHash()

const pGrid = getElement('#add-passive-wrapper__replacement')
pGrid.append(
	...weaponHandler.WeaponFactory.wpbData.passives.map((passive) =>
		make('img', {
			src: weaponAssetUrl(`owo_images/battleEmojis/f_${passive.slug}.png`),
			alt: passive.slug,
			title: passive.slug,
			draggable: false,
			className: 'add-passive-wrapper__emote',
			onmousedown: () => currentWeapon.addPassive(passive),
		})
	)
)

const wearSelect = getElement<HTMLSelectElement>('#wear-select')
wearSelect.addEventListener('change', (e) => (currentWeapon.wear = wearSelect.value))
