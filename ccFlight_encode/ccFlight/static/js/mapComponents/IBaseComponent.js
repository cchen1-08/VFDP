class IBaseComponent {
    constructor(flightMap, options, defaultOptions) {
        defaultOptions = defaultOptions || {};
        this.options = deepClone(defaultOptions);
        this.setOptions(options);

        this.flightMap = flightMap;
        this.width = flightMap.width;
        this.height = flightMap.height

    }

    get mapMgr() {
        return this.flightMap.mapMgr
    }

    setOptions(options) {
        // 若设置项已存在, 则覆盖. 就是说一个覆盖组件的默认选项中定义所有可用的选项, 然后从外部用这个方法覆盖自定义的新选项
        for (let k in options) {
            if (options.hasOwnProperty(k) && k in this.options) {
                this.options[k] = options[k]
            }
        }
    }

    changed(name, args) {
        this.flightMap.componentChanged(this, name, args)
    }

    clear() {
    }

    render(data) {
    }

    rectiftDrag(vecMove) {
        throw new Error('not implemented')
    }

    get isShowing() {
        return false
    }
    switch() {
        if (this.isShowing) {
            this.hide()
        } else {
            this.show()
        }
    }

    hide() {
        this.changed('hide')
    }
    show() {
        this.changed('show')
    }
}
