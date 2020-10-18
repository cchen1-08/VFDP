"use strict";

class FlightMapGroup {
    constructor(containerID, width, height, bnprobs, options) {
        this.container = document.getElementById(containerID);
        this.width = width;
        this.height = height;
        setDomSize(this.container, width, height);

        this.mainViewContainer = L.DomUtil.create('div', 'mainViewContainer', this.container);
        this.mainViewContainer.id = 'mainViewContainer'
        // this.probViewsContainer = L.DomUtil.create('div', 'probViewsContainer', this.container);
        setDomSize('mainViewContainer', width, height);
        // setDomSize(this.probViewsContainer, 0.2 * width, 0.8 * height);
        // setDomSize(this.auxViewContainer, 0.4 * width, 0.6 * height)

        // this.probViewWidth = 160;
        // this.probViewHeight = 158;

        this.mainFlightMap = new FlightMap(this.mainViewContainer, {
            urlDataHeatmap: options.urlDataHeatmap,
            classHeatTransField: HeatTransField,
            classAirportMarker: AirportMarker,
            // classHeatContour: HeatContourSVG,
            classHeatContour: HeatContourCanvas,
            // classProbGlyph: ProbGlyph,
            heatTransField_pathWorker: options.pathWorkerGenTransField,
            airportMarker_pathMarkerBig: options.pathMarkerBig,
            airportMarker_pathMarkerSmall: options.pathMarkerSmall,
            heatContour_hasColor: true,
        }, this);
        // this.auxFlightMap = new FlightMap(this.auxViewContainer, {
        //     classAirportMarker: AirportMarker,
        //     classHeatContour: HeatContourSVG,
        //     urlDataHeatmap: urlDataHeatmap,
        //     heatTransField_pathWorker: pathWorkerGenTransField,
        //     airportMarker_pathMarkerBig: pathMarkerBig,
        //     airportMarker_pathMarkerSmall: pathMarkerSmall,
        //     heatContour_hasColor: true,
        // }, this)

        // this.probMaps = [];
        this.bnprobs = bnprobs;

        // 上一次查询数据时使用的选项
        this.airports = null;
        this.oriDatetimeRange = null;
        this.endDatetimeRange = null;

        // 上一次查询获得的数据
        this.epLocs = null;
        this.dataOri = null;
        this.dataEnd = null;
        // this.probViewsLoaded = false
    }

    // 提供查询选项, 由本实例发起查询
    async refresh(airports, oriDatetimeRange, endDatetimeRange) {
        // 储存这次查询的选项
        this.airports = airports;
        this.oriDatetimeRange = oriDatetimeRange;
        this.endDatetimeRange = endDatetimeRange;

        let [dataOri, dataEnd, epLocs] = await getDataHeatmapTwo(
            airports, oriDatetimeRange, endDatetimeRange,
            this.mainFlightMap.zoom);

        // 储存这次查询的结果
        this.dataOri = dataOri;
        this.dataEnd = dataEnd;
        this.epLocs = epLocs;

        this.mainFlightMap.inputData(airports, oriDatetimeRange, endDatetimeRange, dataOri, dataEnd, epLocs)
    }

    // 从外部直接输入查询的选项和结果
    inputData(airports, oriDatetimeRange, endDatetimeRange, dataOri, dataEnd, epLocs) {
        // 储存这次查询的选项
        this.airports = airports;
        this.oriDatetimeRange = oriDatetimeRange;
        this.endDatetimeRange = endDatetimeRange;

        // 储存这次查询的结果
        this.dataOri = dataOri;
        this.dataEnd = dataEnd;
        this.epLocs = epLocs;

        this.mainFlightMap.inputData(airports, oriDatetimeRange, endDatetimeRange, dataOri, dataEnd, epLocs)
    }

    initProbView(glyphData) {
        for (let datum of glyphData) {
            let dom = L.DomUtil.create('div', 'probContainer', this.probViewsContainer);
            setDomSize(dom, this.probViewWidth, this.probViewHeight);

            let map = new LeafletMapMgr();
            map.init(dom, {
                    center: datum.loc,
                    zoom: this.mainFlightMap.zoom + 1,
                    attributionControl: false,
                    zoomControl: false,
                    dragging: false,
                    doubleClickZoom: false,
                    boxZoom: false,
                },
                FlightMap.defaultOptions.tileApi,
                FlightMap.defaultOptions.tileOption,
            );

            datum.glyph.attr('transform', `translate(${this.probViewWidth / 2},${this.probViewHeight / 2})`);
            let svg = d3.select(map.mapInstance.getPanes().overlayPane)
                .append('svg')
                .attr('width', this.probViewWidth)
                .attr('height', this.probViewHeight);
            svg.node().appendChild(datum.glyph.node());

            this.probMaps.push(map)
        }
    }

    flightMapChange(name, args) {
        switch (name) {
            case 'probGlyphRendered':
                if (!this.probViewsLoaded) {
                    // console.log('probGlyphRendered', args.glyphData)
                    this.probViewsLoaded = true;
                    this.initProbView(args.glyphData)
                }
                break;
            default:
                break
        }
    }
}
