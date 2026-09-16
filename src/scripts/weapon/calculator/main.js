import { make } from '@/src/utils/injectionUtil.js'
import _weapons from '@/src/data/weapon/weapons.json'
import passives from '@/src/data/weapon/passives.json'
import buffs from '@/src/data/weapon/buffs.json'
import { WeaponFactory } from './weapon.js'
import * as passviveHandler from './passiveHandler.js'
import { weaponAssetUrl } from './util.js'

const weapons = _weapons.filter((weapon) => weapon.objectType === 'weapon')
const wpbData = { weapons, passives, buffs }

;[...wpbData.weapons, ...wpbData.passives, ...wpbData.buffs].forEach((StatHaver) => {
	;[...StatHaver.statConfig, StatHaver.wpStatConfig].filter(Boolean).forEach((stat) => {
		stat.range = stat.max - stat.min
		stat.step = stat.range / 100
	})
})

WeaponFactory.wpbData = wpbData
const currentWeapon = WeaponFactory.fromHash()

const pGrid = document.querySelector('#passive-selector')
pGrid.append(
	...wpbData.passives.map((passive) =>
		make('img', {
			src: weaponAssetUrl(`owo_images/battleEmojis/f_${passive.slug}.png`),
			alt: passive.slug,
			title: passive.slug,
			draggable: false,
			className: 'passive-selector__passive-emote',
			onmousedown: () =>
				new passviveHandler.Passive({
					staticData: passive,
					wpbData,
					parent: currentWeapon,
				}),
		})
	)
)

const wearSelect = document.querySelector('#wear-select')

wearSelect.addEventListener('change', (e) => (currentWeapon.wear = e.target.value))
