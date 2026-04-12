import { initializeTriangle } from './triangleCharts/triangle.js'
import { loadJson } from '/js/util/jsonUtil.js'
import { createInjectAble } from '/js/util/injectionUtil.js'

window.addEventListener('DOMContentLoaded', async () => {
	const triangleConfigs = await loadJson('/json/triangleChartConfigs.json')
	const dataSetConfigs = []

	for (const config of triangleConfigs) {
		for (const moduleConfig of config.moduleConfigs ?? []) {
			for (const pluginConfig of moduleConfig.pluginConfigs ?? []) {
				for (const ds of pluginConfig.data?.dataSetConfigs ?? []) {
					dataSetConfigs.push(ds)
				}
			}
		}
	}

	await Promise.all(dataSetConfigs.map(async (ds) => (ds.array = await loadJson(ds.dataSource))))

	const extraHtml = [
		{ created: false, name: 'resChart', init: initializeResChart },
		{ created: false, name: 'effectiveHP' },
		{ created: false, name: 'effectiveStats' },
		{ created: false, name: 'triangle0', init: initializeTriangle, data: triangleConfigs[0] },
		{ created: false, name: 'triangle1', init: initializeTriangle, data: triangleConfigs[1] },
	]
	const pathName = '/donatorPages/pets/'

	extraHtml.forEach((html) => createInjectAble(html, pathName))
})
