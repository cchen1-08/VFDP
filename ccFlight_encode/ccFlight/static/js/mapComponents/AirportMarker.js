"use strict"

class AirportMarker extends IBaseComponent {
    constructor(flightMap, options) {
        super(flightMap, options, AirportMarker.defaultOptions)
    }

    // epLocs: 机场地理坐标
    render(epLocs) {
        if (epLocs === undefined) epLocs = this.flightMap.epLocs
        this.clear()
        this.changed('render')

        let halfSizeSmall = this.options.sizeMarkerSmall / 2,
            halfSizeBig = this.options.sizeMarkerBig / 2,
            pathMarkerSmall = this.options.pathMarkerSmall,
            pathMarkerBig = this.options.pathMarkerBig

        let markers = [],
            latLng,
            curAirports = this.flightMap.airports;
        
        // 遍历所有机场, 将不是当前查询机场的创建marker
        for (let airport in epLocs) {
            if (!epLocs.hasOwnProperty(airport)) continue
            latLng = epLocs[airport];
            if (latLng !== null && curAirports.indexOf(airport) === -1) {
                markers.push(L.marker(latLng, {
                    title: airport,
                    icon: L.icon({
                        iconUrl: pathMarkerSmall,
                        iconAnchor: [halfSizeSmall, halfSizeSmall],
                    })
                }))
            }
        }
        // 遍历当前查询机场, 大marker
        curAirports.forEach(function (airport) {
            latLng = epLocs[airport];
            markers.push(L.marker(latLng, {
                title: airport,
                icon: L.icon({
                    iconUrl: pathMarkerBig,
                    iconAnchor: [halfSizeBig, halfSizeBig],
                })
            }))
        });
        this.mapMgr.layer(this.options.nameLayer, L.layerGroup(markers));
    }

    get layerMarkers() {
        return this.mapMgr.layer(this.options.nameLayer)
    }

    get isShowing() {
        return this.layerMarkers.leafletMapMgr_layerShow
    }

    show() {
        this.mapMgr.showLayer(this.options.nameLayer)
        super.show()
    }

    hide() {
        this.mapMgr.hideLayer(this.options.nameLayer)
        super.hide()
    }

    clear() {
        if (this.layerMarkers) {
            this.mapMgr.layer(this.options.nameLayer, null)
        }
    }
}

AirportMarker.defaultOptions = {
    nameLayer: 'airportMarkers',
    pathMarkerSmall: null,
    pathMarkerBig: null,
    sizeMarkerSmall: 4,
    sizeMarkerBig: 12,
}