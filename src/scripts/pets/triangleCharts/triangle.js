import { make } from '@/src/utils/injectionUtil.ts'
import { Module } from './module.js'
import Chart from 'chart.js/auto'
import annotationPlugin from 'chartjs-plugin-annotation'
Chart.register(annotationPlugin)

export async function initializeTriangle(container, data) {
	const { moduleConfigs, baseConfig, buttonConfigs } = data

	const constantPadding = 10 // this is unavoidable due to chart.js annoyingness
	const additionalPadding = baseConfig.additionalPadding
	const outerWidth = 480
	const innerWidth =
		outerWidth - additionalPadding.left - additionalPadding.right - constantPadding * 2
	const innerHeight = innerWidth * (Math.sqrt(3) / 2)
	const outerHeight =
		innerHeight + additionalPadding.top + additionalPadding.bottom + constantPadding * 2

	const ctx = make('canvas')
	const modules = moduleConfigs.map((moduleConfig) => new Module(moduleConfig))

	const plugins = modules.map((module) => module.plugins).flat()
	plugins.forEach((plugin) => (plugin._deferInitialImageUpdate = true))

	const initFns = []

	if (buttonConfigs && buttonConfigs.length > 0) {
		const buttons = buttonConfigs.map((buttonConfig) => {
			const button =
				buttonConfig.type === 'link'
					? make('a', {
							href: buttonConfig.href,
							target: '_blank',
							className: 'control-wrapper__clickable',
						})
					: make('button', { className: 'control-wrapper__clickable' })
			if (buttonConfig.image) button.append(make('img', buttonConfig.image))
			if (buttonConfig.prettyName)
				button.append(make('div', { textContent: buttonConfig.prettyName }))

			if (buttonConfig.type === 'cycle') {
				const cycle = buttonConfig.cycle
				const cycleText = make('div')
				var idx = cycle.length - 1
				button.onclick = () => {
					const { turnOn, turnOff } = cycle[idx]
					modules.forEach((module) => {
						if ((turnOn ?? []).includes(module.id)) module.hidden = false
						if ((turnOff ?? []).includes(module.id)) module.hidden = true
					})
					cycleText.textContent = cycle[idx].nameTo
					idx = (idx + 1) % cycle.length
					myChart.update()
				}
				button.append(cycleText)
				initFns.push(() => button.click()) // very inelegant
			}
			return button
		})
		container.append(make('div', { className: 'control-wrapper' }, buttons))
	}

	const stupidDumbWrapper = make(
		'div',
		{ style: `width: ${outerWidth}px; height:${outerHeight}px; position: relative;` },
		[ctx]
	)
	container.append(stupidDumbWrapper)

	const myChart = new Chart(ctx, {
		type: 'scatter',
		plugins: plugins,
		options: {
			animation: false,
			maintainAspectRatio: false,
			layout: { padding: additionalPadding },
			plugins: {
				tooltip: { mode: 'nearest', enabled: false, animation: false },
				legend: { display: false },
				annotation: {
					clip: false,
					// The ternary plugins populate this during their beforeInit hooks.
					annotations: {},
				},
			},
			scales: {
				x: { display: false, min: 0, max: 100 },
				y: { display: false, min: 0, max: 100 },
			},
		},
	})
	initFns.forEach((fn) => fn())

	const imageLoadPromises = plugins.flatMap((plugin) => [
		...(plugin._imageLoadPromises ?? []),
		...(plugin.dataSets ?? []).flatMap((dataSet) => dataSet._imageLoadPromises ?? []),
	])

	if (imageLoadPromises.length > 0) {
		Promise.allSettled(imageLoadPromises).then(() => {
			if (myChart._initialImageUpdateFired) return
			myChart._initialImageUpdateFired = true
			myChart.update()
		})
	}
}
