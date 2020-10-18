"use strict";

class FlightMap {
    constructor(domID, width, height, options, groupMgr) {
        this.options = deepClone(FlightMap.defaultOptions);
        this.setOptions(options);

        this.container = document.getElementById(domID);
        this.width = width;
        this.height = height;
        setDomSize(this.container, width, height);

        this.mainMapContainer = L.DomUtil.create('div', 'mainMapContainer', this.container);
        setDomSize(this.mainMapContainer, width, height);

        this.mapMgr = new LeafletMapMgr();
        this.mapMgr.init(this.mainMapContainer, default_mapOptions, default_tileApi, default_tileOption);
        this.mapMgr.mapInstance.on('zoomend', this.onTopMapZoomend.bind(this));
        this.mapMgr.mapInstance.on('dragend', this.onTopMapDragend.bind(this));

        // 上一次查询数据的选项
        this.airports = null;
        this.oriDatetimeRange = null;
        this.endDatetimeRange = null;

        // 上一次获得的数据
        this.epLocs = null;
        this.dataOri = null;
        this.dataEnd = null;

        // ===================== 组件创建
        this.delayHeat = new DelayHeat(this, this.options.delayHeat); // 必备组件
        this.heatContour = new this.options.classHeatContour(this, this.options.heatContour);
        this.heatTransField = new this.options.classHeatTransField(this, this.options.heatTransField);
        this.airportMarker = new this.options.classAirportMarker(this, this.options.airportMarker);
        // ===================== 组件创建结束

        this.groupMgr = groupMgr
    }

    switchComponent(name) {
        switch (name) {
            case 'airportMarker':
                this.airportMarker.switch();
                break;
            case 'heatContour':
                this.heatContour.switch();
                break;
            case 'heatTransField':
                this.heatTransField.switch();
                break;
            default:
                break
        }
    }

    get zoom() {
        return this.mapMgr.getZoom()
    }

    // 原始数据中提出构建热力图用的带权点数据
    // HeatTransField和DelayHeat调用
    static packHeatmapData(data) {
        let address = [];
        for (let datum of data) {
            address.push([datum.epLoc[0], datum.epLoc[1], datum['flightDelay']]);
        }
        return address;
    }

    static packHeatmapItem(item) {
        return [item.epLoc[0], item.epLoc[1], item['flightDelay']]
    }

    /**
     * 上层地图拖动, 通知HeatTransField控制的下层地图移动到新位置
     * 不想重新从服务器获取数据, 但是有个缺陷, 若当前可视范围显示部分热力图canvas
     * 的区域, canvas的大小就可视范围的大小, 之外的数据没有渲染. 拖动地图就可以看到
     * 热力图的边缘, 而且heatContour 根据热力图canvas的数据渲染也会出问题
     * 最好的解决方法是扩大canvas的范围, 但需要知道offset, 绘制方法也可能改变
     * 
     * @param {*} e
     * @memberof FlightMap
     */
    onTopMapDragend(e) {
        let vecMove = e.sourceTarget._newPos;   // 鼠标拖动的方向
        vecMove = [vecMove.x, vecMove.y];

        try {
            this.heatTransField.mapMgr1.setView(this.mapMgr.getCenter(), this.mapMgr.getZoom())
            // console.log(this.mapMgr.getCenter(), this.heatTransField.mapMgr1.getCenter())
        } catch (e) {
            // console.log(e)
        }

        // 地图移动矫正为了将svg或canvas容器保持与地图一致的位置
        this.heatTransField.rectiftDrag(vecMove);
        this.heatContour.rectiftDrag(vecMove);
        // this.probGlyph.rectiftDrag(vecMove);

        this.render(this.epLocs, this.dataOri, this.dataEnd)
    }

    // 当缩放地图时, 通知HeatTransField控制的下层地图要设置到变化后的zoom,
    // 因为热力数据点的泊松分布不同, 需要重新从服务器获取数据
    onTopMapZoomend(e) {
        try {
            this.heatTransField.mapMgr1.setView(this.mapMgr.getCenter(), this.mapMgr.getZoom())
        } catch (e) {
            console.log(e)
        }
        this.refresh(this.airports, this.oriDatetimeRange, this.endDatetimeRange)
    }

    // 向服务器请求数据并渲染
    // 若没有输入查询选项, 就按照上次的选项重新查询
    async refresh(airports, oriDatetimeRange, endDatetimeRange) {
        airports = airports || this.airports;
        oriDatetimeRange = oriDatetimeRange || this.oriDatetimeRange;
        endDatetimeRange = endDatetimeRange || this.endDatetimeRange;

        this.airports = airports;
        this.oriDatetimeRange = oriDatetimeRange;
        this.endDatetimeRange = endDatetimeRange;

        let [dataOri, dataEnd, epLocs] = await getDataHeatmapTwo(
            airports, oriDatetimeRange, endDatetimeRange, this.zoom);
        if (!this.bnprobs) {
            this.bnprobs = await getBnProbs()
        }
        this.render(epLocs, dataOri, dataEnd)
    }

    // 输入所有数据, 调用各组件渲染
    render(epLocs, dataOri, dataEnd) {
        if (epLocs)
            this.epLocs = epLocs;
        if (dataOri)
            this.dataOri = dataOri
        if (dataEnd)
            this.dataEnd = dataEnd

        this.delayHeat.render(this.dataOri);
        this.heatTransField.render(this.dataEnd);
        this.heatContour.render(this.delayHeat.heatGrayData);
        this.airportMarker.render(this.epLocs);
    }

    // 从外部直接输入查询的选项和结果
    inputData(airports, oriDatetimeRange, endDatetimeRange, dataOri, dataEnd, epLocs) {
        // 储存这次查询的选项
        this.airports = airports;
        this.oriDatetimeRange = oriDatetimeRange;
        this.endDatetimeRange = endDatetimeRange;

        this.render(epLocs, dataOri, dataEnd);
    }

    // 组件实例, 任务名, 参数对象
    // 中介者要和参与者约定好任务名和参数名(强耦合)
    componentChanged(component, infoName, args) {
        // console.log(infoName, component)

        if (component instanceof HeatTransField) {
            switch (infoName) {
                case 'probGlyph':
                    // 计算光流场同时输出了probGlyph的数据
                    if (this.probGlyph) {
                        this.probGlyph.render(args.pixelPartition, this.dataOri, this.bnprobs)
                    }
                    break;
            }
        } else if (component instanceof HeatContour) {
            switch (infoName) {
                case 'render':
                case 'show':
                    this.delayHeat.hide();
                    break;
                case 'hide':
                    this.delayHeat.show();
                    break
            }
        } else if (component instanceof DelayHeat) {
            switch (infoName) {
                case 'setHeatMax':
                    this.heatTransField.heatLayer1.setHeatMax(args.val)
                    break
            }
        } else if (component instanceof ProbGlyph) {
            // switch (infoName) {
            //     case 'rendered':
            //         probGlyph包装了HeatTransField传来的数据后, 能得到glyph的个数, 传给mapGroup绘制对应数量的子prob视图
            // this.changed('probGlyphRendered', args)
            // }
        }
    }

    changed(name, args) {
        this.groupMgr.flightMapChange(name, args)
    }

    setOptions(options) {
        for (let k in options) {
            if (options.hasOwnProperty(k))
                if (k in this.options) {
                    this.options[k] = options[k]
                }
        }
    }
}

FlightMap.defaultOptions = {
    classHeatTransField: IBaseComponent,
    classAirportMarker: IBaseComponent,
    classProbGlyph: IBaseComponent,
    classHeatContour: IBaseComponent,

    heatTransField: {
        pathWorkerGenTransField: null,
    },
    airportMarker: {
        pathMarkerBig: null,
        pathMarkerSmall: null,
    },
    heatContour: {
        hasColor: true,
    },
    delayHeat: {
        heatStyle: null,
    },
};
