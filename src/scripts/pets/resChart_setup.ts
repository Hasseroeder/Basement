import Chart from 'chart.js/auto'
import annotationPlugin from 'chartjs-plugin-annotation'
import { make } from '@/src/utils/injectionUtil.ts'
import { getElement } from '@/src/utils/domUtil.js'
import type { Plugin, ChartDataset } from 'chart.js'
Chart.register(annotationPlugin)

const lvlDiv = getElement('#reschart-level-container')
const legendDiv = getElement<HTMLDivElement>('#reschart-legend-container')
const ctx = getElement<HTMLCanvasElement>('#reschart')
const ul = make('ul', { className: 'res-ul' })
legendDiv.append(ul)

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

const dataSetDomMap = new Map<
	ChartDataset<'line', number[]>,
	{
		percentSpan: HTMLSpanElement
		liWrapper: HTMLLIElement
	}
>()

const datasets: ChartDataset<'line', number[]>[] = petData.map(
	({ color, resistance, imageName }) => {
		const data = Array.from(
			{ length: 90 },
			(_, i) => (0.8 * (25 + 2 * i * resistance)) / (125 + 2 * i * resistance)
		)
		const liWrapper = make('li', {
			className: 'res-li',
			onclick() {
				const chart = Chart.getChart(ctx)
				if (!chart) return
				const idx = chart.data.datasets.indexOf(dataset)
				if (idx === -1) return
				chart.setDatasetVisibility(idx, !chart.isDatasetVisible(idx))
				chart.update()
			},
		})
		const colorCircle = make('div', {
			style: { backgroundColor: color },
			className: 'res-color-circle',
		})
		const img = make('img', {
			src: `/assets/images/owo_images/pets/${imageName}`,
			alt: `${resistance} Res`,
			className: 'res-image',
		})
		const p = make('p', {
			textContent: `${resistance} Res`,
		})
		const percentSpan = make('span', {
			className: 'res-percent-span',
		})

		liWrapper.append(colorCircle, img, p, percentSpan)
		ul.appendChild(liWrapper)

		const dataset = {
			label: `${resistance} Res`,
			data,
			borderColor: color,
			pointRadius: 0,
			pointHoverRadius: 7,
		}
		dataSetDomMap.set(dataset, {
			percentSpan,
			liWrapper,
		})
		return dataset
	}
)

const htmlLegendPlugin: Plugin<'line', number[]> = {
	id: 'htmlLegend',
	afterUpdate(chart: Chart<'line', number[]>) {
		chart.data.datasets.forEach((ds, idx) => {
			const domEls = dataSetDomMap.get(ds)
			if (!domEls) throw new Error('Invariant violation: we fucked up dom elements somehow.')
			domEls.liWrapper.style.textDecoration = chart.isDatasetVisible(idx)
				? ''
				: 'line-through'
		})
	},
}

new Chart(ctx, {
	type: 'line',
	data: {
		labels: xValues,
		datasets: datasets,
	},
	plugins: [htmlLegendPlugin],
	options: {
		onHover: function (_, chartElement, chart: Chart<'line', number[]>) {
			if (chartElement.length) {
				const level = chartElement[0].index
				const nbsp = '\u00A0'
				lvlDiv.textContent = `Level ${level}`
				chart.data.datasets.forEach((ds) => {
					const domEls = dataSetDomMap.get(ds)
					if (!domEls)
						throw new Error('Invariant violation: we fucked up dom elements somehow.')
					domEls.percentSpan.textContent =
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
					display: true,
					text: 'Pet Level',
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
					display: true,
					text: 'Actual Resistance',
				},
			},
		},
	},
})
