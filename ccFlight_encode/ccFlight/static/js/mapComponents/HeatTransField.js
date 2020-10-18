"use strict";

class HeatTransField extends IBaseComponent {
    
    constructor(flightMap, options) {
        super(flightMap, options, HeatTransField.defaultOptions);

        // 创建用于计算光流场的下一帧热力图地图
        this.mapContainer1 = L.DomUtil.create('div', 'deputyMapContainer', this.flightMap.container);
        setDomSize(this.mapContainer1, this.width, this.height);
        this.mapMgr1 = new LeafletMapMgr();
        this.mapMgr1.init(this.mapContainer1, default_mapOptions, default_tileApi, default_tileOption);

        // 上层map上用于显示向量场的canvas
        this.canvas = d3.select(this.mapMgr.mapInstance.getPanes().overlayPane)
            .append('canvas').node();
        this.canvasCtx = this.canvas.getContext('2d');

        this.canvas.classList.add('heatTransField');
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.canvas.style.position = 'absolute';

        this.canvas.width = this.width * PIXEL_RATIO;
        this.canvas.height = this.height * PIXEL_RATIO;
        this.canvasCtx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);

        // this.canvas.width = this.width;
        // this.canvas.height = this.height;

        // 负责后台计算向量场的worker
        this.workerHeatmapField = null;
    }

    get heatLayer1() {
        return this.mapMgr1.layer(this.options.nameHeatLayer)
    }

    get isShowing() {
        let t = this.canvas.style.visibility
        return t === '' || t === 'visible'
    }

    hide() {
        this.canvas.style.visibility = 'hidden';
        super.hide()
    }

    show() {
        this.canvas.style.visibility = 'visible';
        super.show()
    }

    render(data) {
        if (data === undefined) data = this.flightMap.dataEnd
        this.changed('render')
        this.addEndHeatmap(data);
        this.genHeatmapField()
    }

    _render(field) {
        this.clear();
        let heatData = this.flightMap.delayHeat.heatImageData;
        this.drawField(field, heatData);
    }

    get heatLayer() {
        return this.mapMgr1.layer(this.options.nameHeatLayer)
    }

    addEndHeatmap(data) {
        console.log('delayHeat style: ', this.flightMap.delayHeat.heatLayerOptions.max)

        this.mapMgr1.layer(this.options.nameHeatLayer, null)
        this.mapMgr1.addHeatmap(this.options.nameHeatLayer,
            FlightMap.packHeatmapData(data),
            this.flightMap.delayHeat.heatLayerOptions)
    }

    // 创建用于计算光流法变化场的多线程Worker
    initWorkerHeatmapField() {
        let worker = null;
        if (window.Worker) {
            worker = new Worker(this.options.pathWorkerGenTransField);

            // 定义获取Worker结果后进行绘制的操作
            worker.onmessage = function (e) {
                this._render(e.data.field);

                // 将 e.data.pixelPartition 传给中介者
                // 中介者再传给probGlyph组件处理
                // this.changed('probGlyph', {
                //     pixelPartition: e.data.pixelPartition
                // })
            }.bind(this)
        }
        return worker;
    }

    // 获取两个地图热力图数据, 计算光流法变化场
    genHeatmapField() {
        // 调用两个leaflet地图管理类绘制热力图，获得地图的canvas数据，计算变化场，绘制场
        let heatLayer0 = this.flightMap.delayHeat.heatLayer,
            heatLayer1 = this.heatLayer;
        if (!heatLayer0 || !heatLayer1) return null;

        let heatCtx0 = heatLayer0.getHeatCtx(),
            heatCtx1 = heatLayer1.getHeatCtx();
        if (!heatCtx0 || !heatCtx1) return null;

        // 因为mapCtx是CanvasRenderingContext2D对象，无法克隆到worker
        // Dawn的StreamMapMgr中只使用调用它们getImageData生成的数据，

        let mapImageData0 = heatCtx0.getImageData(0, 0, this.width, this.height),
            mapImageData1 = heatCtx1.getImageData(0, 0, this.width, this.height),
            mapGradient = heatLayer0.getHeatGradient(),
            mapGrayData0 = heatLayer0.getHeatGrayData(),
            mapGrayData1 = heatLayer1.getHeatGrayData();

        // 终止并重新创建worker
        if (this.workerHeatmapField) this.workerHeatmapField.terminate();
        this.workerHeatmapField = this.initWorkerHeatmapField();
        // 输入用于生成变化场的热力图信息, worker开始计算向量场
        this.workerHeatmapField.postMessage({
            widthMap: this.width,
            heightMap: this.height,
            mapImageData0: mapImageData0,
            mapImageData1: mapImageData1,
            mapGradient: mapGradient,
            mapGrayData0: mapGrayData0,
            mapGrayData1: mapGrayData1,
        });
    }

    clear() {
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    rectiftDrag(vecMove) {
        this.canvas.style.left = -vecMove[0] + 'px';
        this.canvas.style.top = -vecMove[1] + 'px'
    }

    // 绘制场向量，判断向量终点是否落在t时间的热力图内，若是则代表热力收缩，绿色，若否代表热力扩张，红色
    drawField(field, heatData) {
        let lineDrawer = new LineDrawer(this.canvasCtx);

        for (let i = 0, l = field.ux.length; i < l; i++) {
            // if (Math.random() > 0.04) continue;  // 全体随机采样
            let vec = new Vector(-field.ux[i], -field.uy[i]);
            let vecLen = vec.norm(); // 向量长度
            if (vecLen < 1 || vecLen > 4) continue; // 筛选长度
            let pos = [i % this.width, i / this.width]; // 当前点的像素坐标, 未拉伸的canvas坐标

            vec = vec.mul(10);

            // 在长度倍乘后判断向量终点所在canvas像素有无颜色
            let lineSize;
            let color = d3.scaleLinear().domain([0, 30]);
            if (this.vecOuttaField(pos, vec, heatData)) {
                if (Math.random() > sampleRateHeatTransField.expanding) continue; // 随机采样
                vec = vec.mul(1.2)
                lineSize = 2.5;
                color.range([colorsHeatTransField.expanding, colorsHeatTransField.expanding])
                lineDrawer.drawVector(pos, vec, lineSize, color);

            } else {
                if (Math.random() > sampleRateHeatTransField.shrinking) continue; // 随机采样
                vec = vec.mul(1.2);
                lineSize = 2.7;
                color.range([colorsHeatTransField.shrinking, colorsHeatTransField.shrinking])

                let newPos = [pos[0] - vec.x, pos[1] - vec.y]

                lineDrawer.drawVector(newPos, vec, lineSize, color);
            }

            // 向量长度映射颜色
            // let color = d3.scaleLinear().domain([5, 25]).range(['green', 'red']);
            // lineDrawer.drawVector(pos, vec, lineSize, color);
        }
    }

    // 判断向量终点是否在热力范围内
    vecOuttaField(pos, vec, canvasData) {
        let vec_end = [parseInt(pos[0] + vec.x), parseInt(pos[1] + vec.y)];
        let id = (vec_end[1] * this.width + vec_end[0]) * 4; // 二维坐标转对应canvasData的一维坐标
        return canvasData[id + 3] < 120;
    }
}

HeatTransField.defaultOptions = {
    pathWorkerGenTransField: '',
    nameHeatLayer: 'heatmapEnd',
};
