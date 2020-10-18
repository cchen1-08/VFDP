"use strict";

class DelayHeat extends IBaseComponent {
    constructor(flightMap, options) {
        super(flightMap, options, DelayHeat.defaultOptions);
        this.heatLayer = null
    }

    setHeatMax(v) {
        try {
            v = parseInt(v)
        } catch (e) {
            throw e
        }
        v = Math.max(0, v);
        this.heatLayer.setOptions({
            max: v
        });

        this.options.heatStyle.max = v;
        this.changed('setHeatMax', v)
    }

    render(data) {
        this.clear();
        this.changed('render');
        console.log('delayHeat style: ', this.options.heatStyle.max);
        this.heatLayer = this.mapMgr.addHeatmap(this.options.nameHeatLayer,
            FlightMap.packHeatmapData(data),
            this.options.heatStyle)
    }

    get heatLayerOptions() {
        return this.heatLayer.options
    }

    get isShowing() {
        // HeatLayer.js 中利用display隐藏canvas
        let t = this.heatLayer._canvas.style.display;
        return t === "" || t === "block"
    }

    show() {
        this.heatLayer.show();
        super.show()
    }

    hide() {
        this.heatLayer.hide();
        super.hide()
    }

    clear() {
        this.mapMgr.layer(this.options.nameHeatLayer, null)
    }

    // 复制HeatLayer的方法
    get heat() {
        return this.heatLayer.getHeat()
    }

    get heatGradient() {
        return this.heatLayer.getHeatGradient();
    }

    get heatGrayData() {
        return this.heatLayer.getHeatGrayData()
    }

    get heatImageData() {
        return this.heatCtx.getImageData(0, 0, this.width, this.height).data;
    }

    get heatCtx() {
        return this.heatLayer.getHeatCtx()
    }

    get heatCanvas() {
        return this.heatLayer.getHeatCanvas()
    }

}

DelayHeat.defaultOptions = {
    nameHeatLayer: 'heatmapOri',
    heatStyle: default_heatmapStyle,
};