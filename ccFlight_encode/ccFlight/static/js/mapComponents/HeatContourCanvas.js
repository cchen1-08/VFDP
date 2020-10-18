"use strict";

class HeatContourCanvas extends HeatContour {

    constructor(flightMap, options) {
        super(flightMap, options, HeatContourCanvas.defaultOptions);

        this.canvas = d3.select(this.mapMgr.mapInstance.getPanes().overlayPane)
            .append('canvas').node();
        this.ctx = this.canvas.getContext('2d');

        this.canvas.classList.add('heatContourCanvas');
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.canvas.style.position = 'absolute';

        this.canvas.width = this.width * PIXEL_RATIO;   // 有关canvas 的样式尺寸与 实际像素尺寸. retina 有特殊的尺寸 scale
        this.canvas.height = this.height * PIXEL_RATIO;
        this.ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);

        // let thresholdsContours = d3.range(1, this.options.numContourLevel)
        //     .map(d => d * 50);
        // console.log(thresholdsContours)

        const thresholdsContours = d3.range(
            this.options.minContourLevel, 256,
            (256 - this.options.minContourLevel) / this.options.numContourLevel);

        console.log(thresholdsContours);

        this.contours = d3.contours()
            .size([this.width, this.height])
            .thresholds(thresholdsContours);

        this.path = d3.geoPath(null, this.ctx);
    }

    get isShowing() {
        let t = this.canvas.style.visibility;
        return t === '' || t === 'visible';
    }

    _cropColorsByNumMaxWeaveColors(colors) {
        let t = this.options.numMaxWeaveColors;
        if (t === -1 || t === 0) t = colors.length;
        colors.splice(t, colors.length);
    }

    show() {
        this.canvas.style.visibility = 'visible';
    }

    hide() {
        this.canvas.style.visibility = 'hidden';
    }

    render(data) {
        console.log('heat contour canvas render start.');

        // 若没有传入要渲染的新数据, 就使用当前数据刷新渲染
        if (data === undefined)
            data = this.flightMap.delayHeat.heatGrayData;

        this.clear();
        // this.flightMap.delayHeat.hide()
        this.changed('render');

        const arrMultiPolygons = this.contours(data);
        // for (let p of arrMultiPolygons) {
        //     this.ctx.beginPath();
        //     this.path(p);
        //     this.ctx.stroke();
        //
        //     let color = d3.color(this.fillColorScheme(p.value));
        //     color.opacity = this.options.fillOpacity;
        //     this.ctx.fillStyle = color.toString();
        //     this.ctx.fill()
        // }

        //
        // let path=d3.geoPath()
        this.contourPolygons = new ContourPolygons(arrMultiPolygons);
        this.contourPolygons.groupFlightsByRegion(this.flightMap.dataOri, 0, this.mapMgr);
        this.contourPolygons.groupMainAirportsByRegion(0, this.mapMgr);
        this.contourPolygons.processProbsDiff(this.flightMap.options.bnprobs);

        // let col_ap1 = "rgb(253,212,76)",
        //     col_ap2 = "rgb(252,98,93)";

        // 遍历等高线的各个层次, 从底层(低密度值, 面积大)向高层(高密度, 面积小)遍历
        for (let level = this.contourPolygons.lowestLevel; level >= 0; level--) {
            const polygons = this.contourPolygons.levelRegions[level].polygons;

            // 遍历该层的区域(多边形)
            for (let j = 0; j < polygons.length; j++) {
                const poly = polygons[j];   // geojson Polygon

                this.ctx.beginPath();
                this.path(poly);

                // fill
                // let colors_ = this.contourPolygons.getRegionFillColors(level, j);
                let colors = this.contourPolygons.getRegionFillColors(level, j);

                // console.log(colors_);
                // let colors;
                //
                // if (colors_ !== undefined) {
                //     // 随机颜色, 第一行紫色 + 另外两个机场色
                //     colors = [colors_[0]];
                //
                //     let rd = Math.random();
                //     if (rd > 0.65) {
                //         colors.push([col_ap1, 1]);
                //         rd = Math.random();
                //         if (rd > 0.3) {
                //             colors.push([col_ap2, 1])
                //         }
                //     } else {
                //         colors.push([col_ap2, 1]);
                //         rd = Math.random();
                //         if (rd > 0.4) {
                //             colors.push([col_ap1, 1])
                //         }
                //     }
                //
                //     // colors=colors_;
                // } else {
                //     colors = colors_;
                // }
                // console.log(colors);


                // 根据用户给定的最大颜色数量裁剪

                if (colors && colors.length !== 0) {        // 该区域没有概率信息, 跳过不填充

                    this._cropColorsByNumMaxWeaveColors(colors)

                    // 预处理颜色
                    for (let i = 0; i < colors.length; i++) {
                        colors[i][0] = d3.color(colors[i][0]);
                        colors[i][0].opacity = this.options.fillOpacity;
                        colors[i][0] = colors[i][0].toString()
                    }

                    if (colors.length === 1) {
                        this.ctx.fillStyle = colors[0][0];
                        this.ctx.fill()

                    } else {
                        // 遍历poly内的像素
                        const bb = this.path.bounds(poly); // 获取poly包围盒
                        const sizeWeave = this.options.sizeWeave;

                        // ============== 垂直排列, 不重复. 因此先找到包围盒的中间像素位置
                        // let midX = (bb[0][0] + bb[1][0]) / 2 - 2 * sizeWeave;
                        // let midY = (bb[0][1] + bb[1][1]) / 2 - 2 * sizeWeave;

                        // for (let i = 0; i < colors.length; i++) {
                        //     let color = colors[i][0]
                        //     for (let x = parseInt(midX + i * sizeWeave), lx = parseInt(midX + (i + 1) * sizeWeave); x < lx; x += sizeWeave) {
                        //         for (let y = parseInt(bb[0][1]), ly = parseInt(bb[1][1]); y < ly; y += sizeWeave) {
                        //             for (let xs = 0; xs < sizeWeave; xs++) {
                        //                 for (let ys = 0; ys < sizeWeave; ys++) {
                        //                     let xx = x + xs, yy = y + ys;
                        //                     if (d3.polygonContains(poly.coordinates[0], [xx, yy])) {
                        //                         this.ctx.fillStyle = color;
                        //                         this.ctx.fillRect(xx, yy, 1, 1);
                        //                     }
                        //                 }
                        //             }
                        //         }
                        //     }
                        // }

                        // ==============  垂直排列, 重复
                        for (let x = parseInt(bb[0][0]), lx = parseInt(bb[1][0]); x < lx; x += sizeWeave) {
                            for (let y = parseInt(bb[0][1]), ly = parseInt(bb[1][1]); y < ly; y += sizeWeave) {
                                const color = HeatContourCanvas._getBlockFillColorVertical(x, y, colors, poly);
                                // let color=HeatContourCanvas._getBlockFillColorHorizontal(x, y, colors, poly)

                                for (let xs = 0; xs < sizeWeave; xs++) {
                                    for (let ys = 0; ys < sizeWeave; ys++) {
                                        const xx = x + xs, yy = y + ys;
                                        if (d3.polygonContains(poly.coordinates[0], [xx, yy])) {
                                            this.ctx.fillStyle = color;
                                            this.ctx.fillRect(xx, yy, 1, 1);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                this.ctx.stroke();
            }
        }
        console.log('heat contour canvas render end.');
    }

    static _getBlockFillColorVertical(x, y, colors, poly) {
        return colors[x % colors.length][0];
    }

    static _getBlockFillColorHorizontal(x, y, colors, poly) {
        return colors[y % colors.length][0];
    }


    /**
     * 为了使得canvas和地图一致的移动
     *
     * @param {[number, number]} vecMove 鼠标拖动事件的方向向量
     * @memberof HeatContourCanvas
     */
    rectiftDrag(vecMove) {
        this.canvas.style.left = -vecMove[0] + 'px'
        this.canvas.style.top = -vecMove[1] + 'px'
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height)
    }
}

HeatContourCanvas.defaultOptions = {
    minContourLevel: 50,
    numContourLevel: 5,
    numMaxWeaveColors: -1,
    sizeWeave: 3,
    fillOpacity: 1,
    strokeStyle: 'black',
};

