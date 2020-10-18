"use strict";

function initSelect(select, options, init_value) {
    // select: select输入，jquery对象
    // options: js对象{val: text}
    // init_val: 最初selected的默认选项的value
    let options_html = '';
    if (init_value === undefined) {
        options_html = '<option value="null" selected></option>';
    }
    for (let val in options) {
        if (options.hasOwnProperty(val)) {
            let text = options[val];
            if (val === init_value) {
                options_html += '<option value=' + val + ' selected>' + text + '</option>';
            } else {
                options_html += '<option value=' + val + '>' + text + '</option>';
            }
        }
    }
    select.html(options_html);
}

// 将 yyyymmdd 格式字符串转为js Date对象
function parseDate(str) {
    if (!str || str.length !== 8) return;

    let year = parseInt(str.slice(0, 4));
    let month = parseInt(str.slice(4, 6));
    let day = parseInt(str.slice(7, 8));
    return new Date(year, month, day);
}


function disassembleMultiPolygon(obj) {
    let polygons = [];
    for (let poly of obj.coordinates) {
        polygons.push({
            type: 'Polygon',
            coordinates: poly,
        })
    }
    return polygons
}


// 判断带洞的多边形对象是否包含点, 即外边界包含点且所有洞都不包含点
// polygon: geojson Polygon Object
function polygonHoledContains(polygon, point) {
    // 外边界包含
    if (!d3.polygonContains(polygon.coordinates[0], point))
        return false;

    // 遍历洞
    for (let i = 1; i < polygon.coordinates.length; i++) {
        if (d3.polygonContains(polygon.coordinates[i], point)) {
            return false
        }
    }
    return true
}

function dateStr2Date(s) {
    let year = s.substring(0, 4),
        month = s.substring(4, 6),
        day = s.substring(6, 8);
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

function date2DateStr(d) {
    let year = d.getFullYear().toString(),
        month = (d.getMonth() + 1).toString(),
        day = d.getDate().toString();
    if (month.length === 1) month = '0' + month;
    if (day.length === 1) day = '0' + day;

    return year + month + day;
}

function getType(obj) {
    //tostring会返回对应不同的标签的构造函数
    let toString = Object.prototype.toString;
    let map = {
        '[object Boolean]': 'boolean',
        '[object Number]': 'number',
        '[object String]': 'string',
        '[object Function]': 'function',
        '[object Array]': 'array',
        '[object Date]': 'date',
        '[object RegExp]': 'regExp',
        '[object Undefined]': 'undefined',
        '[object Null]': 'null',
        '[object Object]': 'object'
    };
    if (obj instanceof Element) {
        return 'element';
    }
    return map[toString.call(obj)];
}

function deepClone(data) {
    let type = getType(data);
    let obj;
    if (type === 'array') {
        obj = [];
    } else if (type === 'object') {
        obj = {};
    } else {
        //不再具有下一层次
        return data;
    }
    if (type === 'array') {
        for (let i = 0, len = data.length; i < len; i++) {
            obj.push(deepClone(data[i]));
        }
    } else if (type === 'object') {
        for (let key in data) {
            if (data.hasOwnProperty(key))
                obj[key] = deepClone(data[key]);
        }
    }
    return obj;
}

function setDomSize(d, w, h) {
    d.style.width = w + 'px';
    d.style.height = h + 'px';
    return d
}

const arrSumReducer = (accumVal, currVal) => accumVal + currVal;

// input: Array object
// output: [maxVal, minVal]
function maxMinValOfArray(arr, key) {
    let maxVal = -1, minVal = Infinity;
    if (key === undefined) key = (v) => v;
    for (let val of arr) {
        val = key(val);
        if (val > maxVal) maxVal = val;
        if (val < minVal) minVal = val;
    }
    return [maxVal, minVal]
}
