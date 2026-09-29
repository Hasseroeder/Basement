import * as weaponHandler from './weapon.js'
import rawWeapons from '@/src/data/weapons.json'
import passives from '@/src/data/passives.json'
import buffs from '@/src/data/buffs.json'
import { make } from '@/src/utils/injectionUtil.ts'
import { weaponAssetUrl } from './util.js'
import type { RawBuff, RawPassive, RawWeapon } from '../../wpbTypes.js'
import { getElement } from '@/src/utils/domUtil.js'

const weapons = rawWeapons.filter((rawWeapon) => rawWeapon.objectType === 'weapon')

const wpbData = {
	weapons: weapons as RawWeapon[],
	passives: passives as RawPassive[],
	buffs: buffs as RawBuff[],
}
const currentWeapon = weaponHandler.WeaponFactory.fromHash(wpbData)

const pGrid = getElement('#add-passive-wrapper__replacement')
pGrid.append(
	...wpbData.passives.map((passive) =>
		make('img', {
			src: weaponAssetUrl(`owo_images/battleEmojis/f_${passive.slug}.png`),
			alt: passive.slug,
			title: passive.slug,
			draggable: false,
			className: 'add-passive-wrapper__emote',
			onmousedown: () => currentWeapon.addPassive(passive, wpbData),
		})
	)
)

const wearSelect = getElement<HTMLSelectElement>('#wear-select')
wearSelect.addEventListener('change', (e) => (currentWeapon.wear = wearSelect.value))
