"use strict";

class HeatContourSVG extends HeatContour {

    constructor(flightMap, options) {
        super(flightMap, options, HeatContourSVG.defaultOptions);

        this.svg = d3.select(this.mapMgr.mapInstance.getPanes().overlayPane)
            .append('svg')
            .attr('class', 'heatContour')
            .attr('width', this.width)
            .attr('height', this.height);

        this.g = this.svg.append("g")
            .attr("class", "leaflet-zoom-hide")
            .attr("stroke", this.options.strokeStyle)
            .attr('fill-opacity', this.options.fillOpacity);

        let low = 1;
        let thresholdsContours = d3.range(low, 256, (256 - low) / this.options.numContourLevel);

        this.fillColorScheme = d3.scaleLog()
            .domain(d3.extent(thresholdsContours))
            .interpolate(() => d3.interpolatePuBu);

        this.contours = d3.contours()
            .size([this.width, this.height])
            .thresholds(thresholdsContours);
    }

    render(data) {
        if (data === undefined)
            data = this.flightMap.delayHeat.heatGrayData;

        this.clear();
        this.changed('render');

        this.g.selectAll("path")
            .data(this.contours(data))
            .enter().append("path")
            .attr("d", d3.geoPath(d3.geoIdentity().scale(1)))
            // .attr("fill",d=>{this.defaultColorScheme(d.value)})
            .attr("fill", d => this.options.hasColor ? this.fillColorScheme(d.value) : 'none');

        this.flightMap.delayHeat.hide()
    }

    get isShowing() {
        let t = this.svg.style.visibility;
        return t === '' || t === 'visible'
    }

    show() {
        this.svg.style.visibility = 'visible';
    }

    hide() {
        this.svg.style.visibility = 'hidden';
    }

    rectiftDrag(vecMove) {
        this.svg.style('left', -vecMove[0])
            .style('top', -vecMove[1]);
    }

    clear() {
        this.g.selectAll('*').remove();
    }

}

HeatContourSVG.defaultOptions = {
    numContourLevel: 5,
    hasColor: true,
    fillOpacity: 0.2,
    strokeStyle: 'darkGray',
};
