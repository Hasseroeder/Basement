export const polygonPlugin = {
    id: 'polygonPlugin',

    beforeDraw: chart => {
        const ctx = chart.ctx;
        ctx.save();
        const { polygons = [], colors = [] } = chart.options.plugins.polygonPlugin;

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
    },

    beforeDestroy: chart => {
        if (chart.polygons) delete chart.polygons;
    }
};

export function getX(topStat, rightStat){
    return rightStat + 0.5 * topStat;
}
export function getY(topStat,rightStat){
    return topStat;
}