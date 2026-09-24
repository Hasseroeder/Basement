import { initializeTriangle } from '@/src/scripts/pets/triangleCharts/triangle.js'
import ternaryChart from '@/src/data/pets/triangleCharts/ternaryPetRoles.json'
import ternaryChartCrune from '@/src/data/pets/triangleCharts/ternaryPetRolesCrune.json'

window.addEventListener('DOMContentLoaded', async () => {
	initializeTriangle(document.querySelector('#petRoles-container'), ternaryChart)
	initializeTriangle(document.querySelector('#petRolesCrune-container'), ternaryChartCrune)
})
