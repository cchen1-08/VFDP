'use strict';

// 持有一个leaflet的Map实例, 管理地图Dom的引用, 封装一些对地图的高级操作
class LeafletMapMgr {
    constructor() {
        this.mapInstance = null;
        this._divId = null;
        this._tileApi = null;
        this._tileOption = null;
        this.clipPolygon = null;
        this.layers = {};
    }

    init(divId, mapOption, tileApi, tileOption) {
        this.mapInstance = L.map(divId, mapOption);
        this._divId = divId;

        L.tileLayer(tileApi, tileOption).addTo(this.mapInstance);
        this._tileApi = tileApi;
        this._tileOption = tileOption;

        this._center = mapOption.center;
    }

    // 维持当前的位置和缩放
    redraw() {
        let dom = document.getElementById(this._divId);
        dom.innerHTML = "";
        this.init(this._divId, this.getCenter(), this.getZoom(), this._tileApi, this._tileOption);
    }

    // 经纬度坐标, 若无剪裁, 则地图Dom中心, 若有剪裁则剪裁多边形质心转经纬度
    get centerFocusLatLng() {
        if (this.clipPolygon !== null) {
            return this.containerPointToLatLng(this.clipPolygon.centroid);
        } else {
            return this.getCenter();
        }
    }

    // 像素坐标, 若无剪裁, 地图Dom中心, 若有剪裁则剪裁多边形质心
    get centerFocusPixel() {
        if (this.clipPolygon !== null) {
            return this.clipPolygon.centroid;
        } else {
            return L.point(this._containerWidth / 2, this._containerHeight / 2)
        }
    }

    get _clipCenter() {
        if (this.clipPolygon !== null) {
            return this.clipPolygon.centroid
        } else {
            return null
        }
    }

    applyClip(clipPolygon) {
        if (!(clipPolygon instanceof ConvexPolygon)) {
            throw new TypeError('clipPolygon should be instance of ConvexPolygon')
        }
        this.clipPolygon = clipPolygon;
        this._container.style['clip-path'] = clipPolygon.clipPath;
        this._container.style['-webkit-clip-path'] = clipPolygon.clipPath;
    }

    removeClip() {
        this.clipPolygon = null;
        this._container.style['clip-path'] = "";
        this._container.style['-webkit-clip-path'] = ""
    }

    // 因为clip-path后导致的可视区域中心偏移leafletmap dom的中心, 进行偏移的setView
    setViewOffset(center) {
        let zoom = this.getZoom(); // zoom 不变
        // 地理位置标记
        // this.addMarker(center, 'center')
        // 地图可视多边形区域质心称为Cp, 像素坐标; ROI中心称为Cr, 地理坐标
        // 要移动地图, 使Cr在地图上显示的像素坐标等于Cp
        // 将Cr转为像素坐标, 计算像素坐标差后移动地图, 这样不会产生偏移
        // 先置为直接中心
        this.setView(center, zoom);
        // 在像素坐标上计算偏移量, ROI中心经纬度的像素坐标此时一定是(w/2, h/2)
        // 此时, 偏移目标点的像素坐标与布局中心像素坐标关于地图组件中心对称
        let centerOffset = L.point([widthCollage - this._clipCenter.x, heightCollage - this._clipCenter.y]);

        this.setView(this.containerPointToLatLng(centerOffset), zoom);
        return centerOffset;
    }

    fitLatLngs(latLngs) {
        let bound = L.latLngBounds(latLngs);
        this.mapInstance.fitBounds(bound, {
            // padding: [10, 10],
            animate: false,
        });
    }

    fitContainerPts(pts) {
        let latLngs = [];
        for (let i = 0; i < pts.length; i++) {
            latLngs.push(this.containerPointToLatLng(pts[i]));
        }
        this.fitLatLngs(latLngs);
    }

    // start: 包装leaflet map本身的方法
    getCenter() {
        return this.mapInstance.getCenter();
    }

    getZoom() {
        return this.mapInstance.getZoom();
    }

    setView(center, zoom, options) {
        options = options || {
            animate: false
        };
        this.mapInstance.setView(center, zoom, options);
    }

    latLngToContainerPoint(latLng) {
        return this.mapInstance.latLngToContainerPoint(latLng);
    }

    containerPointToLatLng(point) {
        return this.mapInstance.containerPointToLatLng(point);
    }

    // end: 包装leaflet map本身的方法

    addMarker(name, latLng, options) {
        return this.layer(name, L.marker(latLng, options));
    }

    addMarkers(name, latLngs) {
        let markers = [];
        latLngs.forEach(function (latLng) {
            markers.push(L.marker(latLng));
        });
        let group = L.layerGroup(markers);
        return this.layer(name, group)
    }

    addPolygon(name, latLngs, options) {
        return this.layer(name, L.polygon(latLngs, options));
    }

    addHeatmap(name, heatPts, option) {
        return this.layer(name, L.heatLayer(heatPts, option));
    }

    /*
    调用layer的addTo来应用添加层, 并记录到键值对
    若不指定layer, 获取name对应的值, 若name不存在则返回null.
    若layer为null, 从地图中移除name对应的layer并删除键值对中name对应的layer
    */
    layer(name, layer) {
        if (!name) {
            throw new Error('undefined name of layer')
        }
        switch (layer) {
            case undefined:
                return this.getLayer(name);
            case null:
                return this.removeLayer(name);
            default:
                return this.addLayer(name, layer)
        }
    }

    addLayer(name, layer) {
        if (name in this.layers) {
            throw new Error(`layer name ${name} existed, manually remove to override`)
        } else {
            this.layers[name] = layer;
            layer.addTo(this.mapInstance);
            layer.leafletMapMgr_layerShow = true;
        }
        return layer
    }

    removeLayer(name) {
        let l;
        if (name in this.layers) {
            l = this.layers[name];
            this.mapInstance.removeLayer(l);
            delete l.leafletMapMgr_layerShow;
            delete this.layers[name]
        }
        return l
    }

    getLayer(name) {
        return this.layers[name];
    }

    /*
    切换layer的显示和隐藏, 状态变量在添加layer时被添加到layer对象中
    若name不存在则什么都不会发生
    */
    switchLayer(name) {
        if (name in this.layers) {
            let l = this.layers[name];
            if (l.leafletMapMgr_layerShow) {
                this.mapInstance.removeLayer(l);
                l.leafletMapMgr_layerShow = false
            } else {
                l.addTo(this.mapInstance);
                l.leafletMapMgr_layerShow = true
            }
        }
    }

    showLayer(name) {
        if (name in this.layers) {
            let l = this.layers[name];
            l.addTo(this.mapInstance);
            l.leafletMapMgr_layerShow = true
        }
    }

    hideLayer(name) {
        if (name in this.layers) {
            let l = this.layers[name];
            this.mapInstance.removeLayer(l);
            l.leafletMapMgr_layerShow = false
        }
    }

    get _container() {
        return this.mapInstance._container;
    }

    get _containerWidth() {
        return this._container.clientWidth;
    }

    get _containerHeight() {
        return this._container.clientHeight;
    }
}

LeafletMapMgr.defaultHeatLayerStyle = {
    maxZoom: 18,
    blur: 15,
    opacity: 0.4,
    max: 2.0,
};
