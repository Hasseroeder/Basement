export const polygonPluginFactory = polygonData =>({
    beforeDraw: chart => {
        const ctx = chart.ctx;
        ctx.save();
        const { polygons = [], colors = [] } = polygonData;

        polygons.forEach((poly, idx) => {
            ctx.fillStyle = colors[idx] || 'rgba(0,0,0,0.1)';
            ctx.beginPath();

            poly.forEach((pt, i) => {
                const x = chart.scales.x.getPixelForValue(getX(...pt));
                const y = chart.scales.y.getPixelForValue(getY(...pt));
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });

            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();
    }
})

export const polygonLabelPluginFactory = labelData => ({    
    toggle(override) {
        const {groupName} = labelData;
        const anns = Object.values(this.chart.options.plugins.annotation.annotations);
        anns.filter(ann => ann.group === groupName)
            .forEach(ann => ann.display = override ?? !ann.display)
        this.chart.update();    
    },

    beforeInit(chart) {
        this.chart = chart;
        const anns = chart.options.plugins.annotation.annotations;
        const {labels, colors, groupName} = labelData;

        (labels || []).forEach(({text, coor, rotation = 0},i) =>{
            anns[text+"label"]={
                type:"label",
                content:text,
                xValue: getX(...coor),
                yValue: getY(...coor),
                color: colors[i],
                font: { size: 16, weight:"bold"},
                rotation,
                group: groupName,
                display: false
            };
        });
    },
})

export const triangleBasePluginFactory = ({lines= true, labels = true} = {}) =>({
    beforeInit: chart => {
        const anns = chart.options.plugins.annotation.annotations;
        const rightRotation = 60;
        const scales = [
            {
                linePts: p => ([[p,0],[p,100-p]]),
                labelPos: p => ([[p,-3], 0])
            },
            {
                linePts: p => ([[100-p,p],[0,p]]),
                labelPos: p => ([[103-p,p],-rightRotation])
            },
            {
                linePts: p => ([[0,p],[p,0]]),
                labelPos: p => ([[-3,103-p], rightRotation ])
            }
        ];

        scales.forEach(({ linePts, labelPos },i) => {
            for (let percent = 0; percent <= 100; percent += 10) {
                const Title = i +"_" +percent;
                if (lines){
                    const [start, end] = linePts(percent);
                    anns[Title] = {
                        type: 'line',
                        xMin: getX(...start), yMin: getY(...start),
                        xMax: getX(...end), yMax: getY(...end),
                        borderWidth: 0.5,
                        color: 'lightgray',
                        drawTime:'beforeDraw'
                    };
                }
                if (percent == 0) continue; // we skip drawing labels saying zero
                if (labels){
                    const [xy, rotation] = labelPos(percent);
                    anns[`${Title}Label`] = {
                        type: 'label',
                        xValue: getX(...xy),
                        yValue: getY(...xy),
                        content: `${percent}`,
                        color: 'lightgray',
                        rotation
                    };
                }
            }
        });
    }
})

export function getX(topStat, rightStat){
    return rightStat + 0.5 * topStat;
}
export function getY(topStat,rightStat){
    return topStat;
}