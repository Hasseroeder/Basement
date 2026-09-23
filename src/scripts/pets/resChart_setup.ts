import Chart from 'chart.js/auto'
import annotationPlugin from 'chartjs-plugin-annotation'
import { make } from '@/src/utils/injectionUtil.ts'
import { getElement } from '@/src/utils/domUtil.js'
import type { Plugin, ChartType, ChartDataset } from 'chart.js'
Chart.register(annotationPlugin)

declare module 'chart.js' {
	interface Chart {
		legendText: HTMLLIElement[]
		percents: HTMLSpanElement[]
	}
	interface PluginOptionsByType<TType extends ChartType> {
		htmlLegendPlugin?: {
			legendDiv: HTMLElement
		}
	}
}

const xValues = Array.from({ length: 90 }, (_, index) => index + 1)

const petData = [
	{ resistance: 9, color: 'rgb(150, 220, 220)', imageName: '2026march_miku.gif' },
	{ resistance: 8, color: 'rgb(219, 219, 219)', imageName: '2025dec_polar.gif' },
	{ resistance: 7, color: 'rgb(234, 153, 153)', imageName: '3m_specialpanda.gif' },
	{ resistance: 6, color: 'rgb(149, 149, 149)', imageName: 'hedgebot.gif' },
	{ resistance: 5, color: 'rgb(139, 122, 190)', imageName: 'hkoala.gif' },
	{ resistance: 4, color: 'rgb(149, 149, 149)', imageName: 'giraffbot.gif' },
	{ resistance: 3, color: 'rgb(175, 85, 82)', imageName: 'glitchparrot.gif' },
	{ resistance: 2, color: 'rgb(111, 168, 220)', imageName: 'dgorilla.gif' },
	{ resistance: 1, color: 'rgb(255, 217, 102)', imageName: 'gdeer.gif' },
	{ resistance: 0, color: 'rgb(147, 196, 125)', imageName: 'gspider.gif' },
]

const datasets: ChartDataset<'line', number[]>[] = petData.map(({ color, resistance }) => {
	const data = Array.from(
		{ length: 90 },
		(_, i) => (0.8 * (25 + 2 * i * resistance)) / (125 + 2 * i * resistance)
	)
	return {
		label: `${resistance} Res`,
		data,
		borderColor: color,
		pointRadius: 0,
		pointHoverRadius: 7,
	}
})

const htmlLegendPlugin: Plugin<'line'> = {
	id: 'htmlLegend',
	beforeInit(chart) {
		const legendContainer = chart.options.plugins?.htmlLegendPlugin?.legendDiv
		if (!(legendContainer instanceof HTMLElement)) {
			throw new Error('Invariant violation: htmlLegendPlugin.legendDiv is required')
		}
		const ul = make('ul', { className: 'res-ul' })
		legendContainer.append(ul)

		chart.legendText = []
		chart.percents = []

		chart.data.datasets.forEach((ds, idx) => {
			const li = make('li', {
				className: 'res-li',
				onclick() {
					chart.setDatasetVisibility(idx, !chart.isDatasetVisible(idx))
					chart.update()
				},
			})
			const colorCircle = make('div', {
				style: { backgroundColor: petData[idx].color },
				className: 'res-color-circle',
			})
			const img = make('img', {
				src: `/assets/images/owo_images/pets/${petData[idx].imageName}`,
				alt: ds.label ?? '',
				className: 'res-image',
			})
			const p = make('p', {
				textContent: ds.label,
			})
			const percentSpan = make('span', {
				className: 'res-percent-span',
			})

			li.append(colorCircle, img, p, percentSpan)
			ul.appendChild(li)

			chart.percents.push(percentSpan)
			chart.legendText.push(li)
		})
	},

	afterUpdate(chart) {
		chart.legendText.forEach((p, idx) => {
			p.style.textDecoration = chart.isDatasetVisible(idx) ? '' : 'line-through'
		})
	},
}

const lvlDiv = getElement('#reschart-level-container')
const legendDiv = getElement<HTMLDivElement>('#reschart-legend-container')
const ctx = getElement<HTMLCanvasElement>('#reschart')

new Chart(ctx, {
	type: 'line',
	data: {
		labels: xValues,
		datasets: datasets,
	},
	plugins: [htmlLegendPlugin],
	options: {
		onHover: function (_, chartElement, chart: Chart<'line'>) {
			if (chartElement.length) {
				const level = chartElement[0].index
				const nbsp = '\u00A0'
				lvlDiv.textContent = `Level ${level}`
				chart.data.datasets.forEach((ds, i) => {
					if (typeof ds.data[level] !== 'number')
						throw new Error('Invariant violation: data point not a number')
					chart.percents[i].textContent =
						nbsp + nbsp + nbsp + (ds.data[level] * 100).toFixed(1) + '%'
				})
			}
		},
		hover: {
			mode: 'index',
			intersect: false,
		},
		responsive: true,
		plugins: {
			tooltip: { enabled: false },
			legend: { display: false },
			htmlLegendPlugin: { legendDiv: legendDiv },
		},
		scales: {
			x: {
				grid: { color: '#404040' },
				ticks: {
					color: 'lightgray',
					callback: function (value, index) {
						return index % 5 === 0 ? value : null // Show every fifth tick
					},
				},
				title: {
					display: true, // Show the title
					text: 'Pet Level', // Title text
				},
			},
			y: {
				beginAtZero: true,
				grid: { color: '#404040' },
				ticks: {
					color: 'lightgray',
					callback: function (value) {
						if (typeof value !== 'number') {
							return ''
						}
						return `${value * 100}%`
					},
				},
				title: {
					display: true, // Show the title
					text: 'Actual Resistance', // Title text
				},
			},
		},
	},
})
