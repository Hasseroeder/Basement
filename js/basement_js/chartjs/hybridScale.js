class HybridScale extends Chart.LinearScale {
    constructor(cfg) {
        super(cfg);
    }

    static id = 'hybrid';
    static defaults = {
        ticks: { callback: undefined },
        alpha: 0.1,
        eps: 1e-6,
        logBase: 10
    };

    hybridTransform(value, alpha, eps, logBase) {
        const v = value + eps;
        if (alpha <= 0) return v;
        if (alpha >= 1) return Math.log(v) / Math.log(logBase);
        const linearPart = v;
        const logPart = Math.log(v) / Math.log(logBase);
        return (1 - alpha) * linearPart + alpha * logPart;
    }

    getPixelForValue(value) {
        const opts = this.options;
        const alpha = +opts.alpha;
        const eps = +opts.eps;
        const base = +opts.logBase;
        const vTrans = this.hybridTransform(Number(value), alpha, eps, base);

        const tMin = this.hybridTransform(this.min, alpha, eps, base);
        const tMax = this.hybridTransform(this.max, alpha, eps, base);

        const pixelStart = this.isHorizontal() ? this.left : this.bottom;
        const pixelEnd = this.isHorizontal() ? this.right : this.top;

        const axisLength = pixelEnd - pixelStart;
        const span = tMax - tMin || 1e-12;
        const pct = (vTrans - tMin) / span;

        return pixelStart + pct * axisLength;
    }

    getValueForPixel(pixel) {
        const opts = this.options;
        const alpha = +opts.alpha;
        const eps = +opts.eps;
        const base = +opts.logBase;

        const pixelStart = this.isHorizontal() ? this.left : this.bottom;
        const pixelEnd = this.isHorizontal() ? this.right : this.top;

        const axisLength = pixelEnd - pixelStart || 1e-12;
        const tMin = this.hybridTransform(this.min, alpha, eps, base);
        const tMax = this.hybridTransform(this.max, alpha, eps, base);

        const span = tMax - tMin || 1e-12;
        const pct = (pixel - pixelStart) / axisLength;
        const t = tMin + pct * span;

        return this.hybridInverse(t, alpha, eps, base);
    }

    /*
    buildTicks() {
        const opts = this.options;
        const alpha = +opts.alpha;
        const eps = +opts.eps;
        const base = +opts.logBase;
        const ticks = [];
        const maxTicks = 10;

        const tMin = this.hybridTransform(this.min, alpha, eps, base);
        const tMax = this.hybridTransform(this.max, alpha, eps, base);

        for (let i = 0; i <= maxTicks; i++) {
            const t = tMin + (i / maxTicks) * (tMax - tMin);
            const v = this.hybridInverse(t, alpha, eps, base);
            ticks.push({ value: v });
        }

        return ticks;
    }
    */
    buildTicks() {
        const ticks = [];
        const step = 10; 
        const ds = this.chart.data.datasets[0];
        const sourceValues = ds.data.map(d => d.x);

        for (let i = -1; i < sourceValues.length; i += step) {
            const xValue = i <= 0? 0 : i;
            ticks.push({ value: Number(sourceValues[xValue]) });
        }

        const first = ticks[0].value;
        const last = ticks.at(-1).value;
        if (first !== this.min) ticks.unshift({ value: this.min });
        if (last !== this.max) ticks.push({ value: this.max });
    
        return ticks;
    }

    hybridInverse(pos, alpha, eps, logBase) {
        if (alpha <= 0) return pos - eps;
        if (alpha >= 1) return Math.pow(logBase, pos) - eps;

        let v = Math.max(eps, (1 - alpha) * pos + alpha * Math.pow(logBase, pos));
        for (let i = 0; i < 40; ++i) {
            const f = (1 - alpha) * v + alpha * Math.log(v) / Math.log(logBase) - pos;
            const df = (1 - alpha) + alpha / (v * Math.log(logBase));
            const dv = f / df;
            v -= dv;
            if (!isFinite(v) || v <= eps) v = eps * 10;
            if (Math.abs(dv) < 1e-12) break;
        }
        return Math.max(eps, v) - eps;
    }
}

Chart.register(HybridScale);