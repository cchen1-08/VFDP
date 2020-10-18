// default setting, options
"use strict";

const default_mapOptions = {
    center: [33.5, 110],
    // center: [31, 111],
    zoom: 5,
    attributionControl: false,
};

// const default_tileApi = "https://api.tiles.mapbox.com/{id}/{z}/{x}/{y}.png?access_token={accessToken}";
const default_tileApi = "https://api.mapbox.com/styles/v1/fleetingkl/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}";
const default_tileOption = {
    maxZoom: 8,
    minZoom: 3,
    accessToken: "pk.eyJ1IjoiZmxlZXRpbmdrbCIsImEiOiJjajlveWd3aHcyeXljMzFwZzZvd2lkbTllIn0.jMeCHfFeDI3OoH1zndeKKQ",
    // id: 'v4/mapbox.dark',
    id:'cjp8bbuy84lfu2stmd4uagjqu', // blue designer,
    // id:'cjp6n0pci2ths2sk55fkw0c3g', // clean white
};

const default_heatmapStyle = {
    radius: 20,
    opacity: 1,
    maxZoom: 8,
    minZoom: 3,
    max: 2000,
};

// const vsupColorScheme = [
//     ['#472d7b', '#755d9b', '#a390bc', '#d0c6dd'],
//     ['#2c728e', '#6793a9', '#9ab6c5', '#ccdae2'],
//     ['#28ae80', '#6dc39e', '#a0d7be', '#d0ebde'],
//     ['#addc30', '#c5e56d', '#dbee9f', '#eef6cf']
// ];
const vsupColorScheme = [
    ['#6d4d90', '#9075ab', '#b5a2c7', '#dbd0e3'],
    ['#5ba7a1', '#86bcb8', '#afd2cf', '#d7e9e7'],
    ['#71cd8c', '#98daa8', '#bbe6c4', '#ddf3e1'],
    ['#cee55e', '#dded88', '#eaf2b0', '#f5f9d9']
];

const mainAirports = {
    "ZBAA": [40.0801, 116.5846],
    "ZUUU": [30.5785, 103.9471],
    "ZSSS": [31.1979, 121.3363],
    "ZLXY": [34.4471, 108.7516],
    "ZGGG": [23.3924, 113.2988],
    "ZHCC": [34.5197, 113.8409],
    "ZPPP": [25.1019, 102.9292],
    "ZUCK": [29.7194, 106.641],
    "ZSPD": [31.1428, 121.7924],
    "ZGSZ": [22.6395, 113.8124],
    "ZSAM": [24.544, 118.1277]
};

const PIXEL_RATIO = (function () {
    let ctx = document.createElement('canvas').getContext('2d'),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();

// 延误时间分级,和FlightFilesControllers中segDelay相同
const segDelay = d => {
    if (d < 900)
        return 0;
    else if (d < 30 * 60)
        return 1;
    else if (d < 60 * 60)
        return 2;
    else if (d < 120 * 60)
        return 3;
    else
        return 4
};

// 延误概率分级,和FlightFilesControllers中segRate相同
const segRate = (r) => {
    let tmp = parseInt(r * 4);
    return tmp === 4 ? 3 : tmp; // 若4变3,否则照常,分级是0,1,2,3, 4是100%
};

// 从vsup二维矩阵中获取颜色
const lookupColor = (key, val) => {
    val = 3 - val;
    switch (key) {
        case 'Dde':
            return vsupColorScheme[0][val];
        case 'Dr15':
            return vsupColorScheme[1][val];
        case'Dr30':
            return vsupColorScheme[2][val];
        case 'Dr60':
            return vsupColorScheme[3][val];
    }
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// 扩张和收缩向量的颜色
const colorsHeatTransField = {
    expanding: 'red',
    // shrinking: '#66ff00',
    // shrinking: 'rgb(0,58,87)',
    // shrinking: 'rgb(2,38,79)',
    shrinking: '#001eff',
};

// 为扩张和收缩向量上色时的随机采样概率, 避免显示所有向量
const sampleRateHeatTransField = {
    expanding: 0.075,
    shrinking: 0.055,
};