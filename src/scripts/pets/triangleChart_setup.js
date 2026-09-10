import { initializeTriangle } from '@/src/scripts/pets/triangleCharts/triangle.js'
import { loadJson } from '@/src/utils/jsonUtil.js'

window.addEventListener('DOMContentLoaded', async () => {
	const triangleConfigs = await loadJson(
		'/src/data/pets/triangleCharts/triangleChartConfigs.json'
	)
	const dataSetConfigs = []

	for (const config of Object.values(triangleConfigs)) {
		for (const moduleConfig of config.moduleConfigs ?? []) {
			for (const pluginConfig of moduleConfig.pluginConfigs ?? []) {
				for (const ds of pluginConfig.data?.dataSetConfigs ?? []) {
					dataSetConfigs.push(ds)
				}
			}
		}
	}

	await Promise.all(dataSetConfigs.map(async (ds) => (ds.array = await loadJson(ds.dataSource))))

	for (const [idSelector, config] of Object.entries(triangleConfigs)) {
		const container = document.querySelector(idSelector)
		initializeTriangle(container, config)
	}
})
