"use strict";

let iptAirport = null,
    iptOriDatetimeRange = null,
    iptEndDatetimeRange = null;

// 所有机场，除去厦门和郑州
// iptAirport = ['ZBAA', 'ZUUU', 'ZSSS', 'ZLXY',
//     'ZGGG', 'ZPPP', 'ZUCK', 'ZSPD', 'ZGSZ'];
// iptOriDatetimeRange = '20171223'
// iptEndDatetimeRange = '20171224'

// 上海厦门比较
// iptAirport = ['ZSSS'];
// iptAirport = ['ZSAM'];
// iptOriDatetimeRange = ['2018011000', '2018011011'];
// iptEndDatetimeRange = ['2018011000', '2018011015'];

// 广州 圣诞
// iptAirport = ['ZGGG']
// iptOriDatetimeRange = '20171225';
// iptEndDatetimeRange = '20171226';

// 机场群
// iptAirport = ['ZSSS', 'ZSPD'] // 虹桥 浦东
// iptAirport = ['ZGGG','ZGSZ'] // 广州 深圳
// iptAirport = ['ZUCK','ZUUU'] // 重庆 成都
// iptOriDatetimeRange = ['2018010200', '2018010220']
// iptEndDatetimeRange = ['2018010200', '2018010224']

// 广州一天
// iptAirport = ['ZGGG']
// iptOriDatetimeRange = ['2018020200', '2018020207']
// iptEndDatetimeRange = ['2018020200', '2018020210']
// iptOriDatetimeRange = ['2018020100', '2018020120']
// iptEndDatetimeRange = ['2018020100', '2018020124']
// iptOriDatetimeRange = '20180201';
// iptEndDatetimeRange = '20180201';

// 郑州单独
iptAirport = ['ZHCC'];
iptOriDatetimeRange = '20180207';
iptEndDatetimeRange = '20180208';

// 东南西北 同一天 各取一个
// iptAirport = ['ZSPD','ZPPP','ZGSZ','ZLXY','ZBAA']   // 上海 东 昆明 西南 深圳 南 西安 西 北京 北
// iptOriDatetimeRange = '20180201'
// iptEndDatetimeRange = '20180202'

// 春运 0201 - 0207
// iptAirport = ['ZBAA', 'ZUUU', 'ZSSS', 'ZLXY', 'ZGGG', 'ZPPP', 'ZUCK', 'ZSPD', 'ZGSZ', 'ZSAM', 'ZHCC'];
// iptOriDatetimeRange = '20180207'
// iptEndDatetimeRange = '20180208'

//
// iptAirport = ['ZBAA', 'ZUUU', 'ZSSS', 'ZLXY', 'ZGGG', 'ZPPP', 'ZUCK', 'ZSPD', 'ZGSZ', 'ZSAM', 'ZHCC'];
// iptOriDatetimeRange = '20180131';
// iptEndDatetimeRange = '20180201';

// 全部 大雪
// iptAirport = ['ZBAA', 'ZUUU', 'ZSSS', 'ZLXY', 'ZGGG', 'ZPPP', 'ZUCK', 'ZSPD', 'ZGSZ', 'ZSAM', 'ZHCC'];
//iptOriDatetimeRange = '20180125'
//iptEndDatetimeRange = '20180126'

// 大雪
// iptAirport = ['ZBAA'];
// iptAirport  = ['ZSSS'];
// iptOriDatetimeRange = '20180125';
// iptEndDatetimeRange = '20180126';


// let widMap = 960,
//     heiMap = 540;
let widMap = 960,
    heiMap = 740;
// let widMap = 1000,
//     heiMap = 900;
let widTimeView = widMap,
    heiTimeView = 128;

// 状态指示
let animating = false;
let animDataLoading = false;

// GUI部件
// 查询
let control = $('#control'),
    ctrl_select = $('#ctrl_select'),
    ctrl_layers = $('#ctrl_layers'),
    ctrl_anim = $('#ctrl_anim'),
    container = $('#container');

let jq_ctrl_group = $('.jq_ctrl_group')
// let layer_airportMarker = $('#layer_airportMarker')
let layer_heatContour = $('#layer_heatContour'),
    layer_heatTransField = $('#layer_heatTransField');

let txt_oriDateStart = $('input[name="oriDateStart"]'),
    txt_oriDateEnd = $('input[name="oriDateEnd"]'),
    txt_endDateStart = $('input[name="endDateStart"]'),
    txt_endDateEnd = $('input[name="endDateEnd"]');

let domDateList = $('#dateList'),
    formAirports = $('#cb_airports');

// 主要
let flightMap;
let tmpMap0 = initTmpMap('tmpMap0'),
    tmpMap1 = initTmpMap('tmpMap1');

// 数据
let dataOri;
let segHourDataOri = null;   // 按一天24小时分割的dataOri, 在准备timeView数据时存储
let segDateDataOri = null;


// =================== 入口

let options = {
    classHeatTransField: HeatTransField,
    // classAirportMarker: AirportMarker,
    // classHeatContour: HeatContourSVG,
    classHeatContour: HeatContourCanvas,

    heatTransField: {
        pathWorkerGenTransField: mapURLOptions.pathWorkerGenTransField,
    },
    // airportMarker: {
    //     pathMarkerBig: mapURLOptions.pathMarkerBig,
    //     pathMarkerSmall: mapURLOptions.pathMarkerSmall,
    // },
    heatContour: {
        hasColor: true,
        sizeWeave: 5,
        numMaxWeaveColors: -1,
    },
    delayHeat: {
        heatStyle: default_heatmapStyle,
    },
}


jq_ctrl_group.controlgroup();
// layer_airportMarker.prop('checked', true)
layer_heatTransField.prop('checked', true)
layer_heatContour.prop('checked', true)

// 设置密度图的max 阈值, 越大图越稀疏
let txt_heatMax = $('#txt_heatMax')
txt_heatMax.attr('value', default_heatmapStyle.max)
txt_heatMax.change(e => {
    try {
        let val = parseInt(e.currentTarget.value)
        flightMap.delayHeat.setHeatMax(val)
    } catch (e) {
        console.warn(e)
    }
})

// 设置影响要素编织最多允许显示的颜色数目
let txt_numMaxWeaveColors = $('#txt_numMaxWeaveColors');
txt_numMaxWeaveColors.attr('value', options.heatContour.numMaxWeaveColors);
txt_numMaxWeaveColors.change(e => {
    try {
        let n = e.currentTarget.value;
        try {
            n = parseInt(n);
        } catch (error) {
            return false
        }

        if (n < 0 && n != -1) { return false }
        if (n === 0) n = 1;

        flightMap.heatContour.setOptions({
            numMaxWeaveColors: n
        })
    } catch (e) {
        console.warn(e)
    }
})

let txt_sizeWeave = $('#txt_sizeWeave')
txt_sizeWeave.attr('value', options.heatContour.sizeWeave)
txt_sizeWeave.change(e => {
    try {
        let n = e.currentTarget.value;
        try {
            n = parseInt(n);
        } catch (error) {
            return false
        }

        flightMap.heatContour.setOptions({
            sizeWeave: n
        })
    } catch (e) {
        console.warn(e)
    }
})



$('.btn_jq').button()

// layer_airportMarker.click(() => {
//     console.log("switch layer airportMarker");
//     flightMap.switchComponent('airportMarker')
// });

layer_heatContour.click(() => {
    console.log("switch layer heatContour");
    flightMap.switchComponent('heatContour')
});
layer_heatTransField.click(() => {
    console.log("switch layer heatTransField");
    flightMap.switchComponent('heatTransField')
});

ctrl_layers.controlgroup({ direction: "vertical" });
ctrl_anim.controlgroup({ direction: "vertical" });

initForm();

let timeView = new TimeView('timeView', widTimeView, heiTimeView);
// gui end

// let bnprobs = await getBnProbs();


flightMap = new FlightMap('flightMap', widMap, heiMap, options);
queryAndRender();
getSegDateDataOri(iptOriDatetimeRange, iptEndDatetimeRange, flightMap.zoom);
console.log('pipeline end');

// =================== 方法定义

async function queryAndRender() {
    // 查询两天的航班数据, 合并涉及到的主要机场信息
    console.log('query start');
    let [_dataOri, _epLocsOri] = await getDataHeatmap(iptAirport, iptOriDatetimeRange, default_mapOptions.zoom);
    dataOri = _dataOri;

    console.log('query dataOri end');
    let [_dataEnd, _epLocsEnd] = await getDataHeatmap(iptAirport, iptEndDatetimeRange, default_mapOptions.zoom);
    console.log('query dataEnd end');

    // 合并到epLocsOri
    for (let airport in _epLocsEnd) {
        if (_epLocsEnd.hasOwnProperty(airport) && !_epLocsOri.hasOwnProperty(airport)) {
            _epLocsOri[airport] = _epLocsEnd[airport]
        }
    }
    flightMap.inputData(iptAirport, iptOriDatetimeRange, iptEndDatetimeRange, _dataOri, _dataEnd, _epLocsOri);
    // console.log(segDayDataOri);


    let dataTimeView = countHeatGrayData(_dataOri);
    timeView.render(dataTimeView);
}

// 创建临时leaflet地图, 按时间拆分数据, 渲染到热力图, 统计各像素值的像素数量, 删除临时leaflet地图, 返回数量统计结果
function countHeatGrayData(dataOri) {
    let oriDate = iptOriDatetimeRange.length !== 8 ? iptOriDatetimeRange.slice(0, 8) : iptOriDatetimeRange

    // 初始化leaflet地图, 用来渲染热力图, 隐藏显示

    let domID = "tmpMapTimeView";
    let dom = $(`<div id="${domID}"></div>`);
    container.append(dom);
    dom.width(widMap);
    dom.height(heiMap);
    dom.addClass('hidden-position');    // 隐藏显示
    let tmpMap = new LeafletMapMgr();
    tmpMap.init(domID, default_mapOptions, default_tileApi, default_tileOption);

    let scaleValSeg = d3.scaleLinear().domain([1, 255]).range([0, 7]);
    let countRes = new Array(24);

    let strDatetime = [];
    for (let i = 0; i <= 9; i++)    strDatetime.push(oriDate + '0' + i.toString())
    for (let i = 10; i <= 24; i++)  strDatetime.push(oriDate + i.toString())

    segHourDataOri = [];

    let curr_heatStyle = deepClone(flightMap.delayHeat.heatLayerOptions);
    curr_heatStyle.max = curr_heatStyle.max / 5;

    // 遍历本日时间, 24小时
    for (let i = 0; i < 24; i++) {
        // 找出本时段的航班
        let heatData = [];
        for (let flight of dataOri) {
            let t = parseFloat(flight['schedH']);
            if (t > i && t < i + 1) {
                heatData.push(FlightMap.packHeatmapItem(flight))
            }
        }
        segHourDataOri.push(heatData);

        // 用这些点数据渲染热力图. 热力图配置选项需要和当前用于显示的一致, 因此要在flightMap之后初始化timeView
        tmpMap.layer("heatmap", null);

        tmpMap.addHeatmap("heatmap", heatData, curr_heatStyle);
        let heatmap = tmpMap.layer("heatmap");
        let grayData = heatmap.getHeatGrayData();

        let bin = new Array(8).fill(0);
        for (let pixel of grayData) {
            if (pixel === 0) continue;
            let seg = parseInt(scaleValSeg(pixel));
            bin[seg]++;
        }

        countRes[i] = bin
        // if (i === 2) break
    }
    dom.remove();
    return countRes
}

// 返回false是为了阻止默认自动跳转行为
async function formSubmit() {
    console.log('=============== input params');
    // 机场
    let airports = [];
    $('input[name="airports"]:checked').each(function () {
        airports.push($(this).val())
    });
    if (airports.length === 0) {
        alert('输入错误: 未选择机场');
        return false
    }

    // 日期
    let oriDateStart = txt_oriDateStart.val(),
        oriDateEnd = txt_oriDateEnd.val(),
        endDateStart = txt_endDateStart.val(),
        endDateEnd = txt_endDateEnd.val();

    let oriDateRange, endDateRange;

    if (oriDateStart.length === 8) {
        if (oriDateEnd.length !== 0) {
            alert('wrong date input');
            return false
        }
        oriDateRange = oriDateStart
    } else {
        oriDateRange = [oriDateStart, oriDateEnd]
    }

    if (endDateStart.length === 8) {
        if (endDateEnd.length !== 0) {
            alert('wrong date input');
            return false
        }
        endDateRange = endDateStart
    } else {
        endDateRange = [endDateStart, endDateEnd]
    }

    console.log('submit airports', airports);
    console.log('submit oriDateRange', oriDateRange);
    console.log('submit endDateRange', endDateRange);

    $.cookie('airports', airports);
    $.cookie('oriDateRange', oriDateRange);
    $.cookie('endDateRange', endDateRange);

    iptAirport = airports;
    iptOriDatetimeRange = oriDateRange;
    iptEndDatetimeRange = endDateRange;

    await queryAndRender();

    // flightMap.refresh(airports, oriDateRange, endDateRange);
    // mapGroup.refresh(airports, oriDateRange, endDateRange);

    return false;
}

// 读取cookie中记录的上一次提交表单时表单中存储的内容
function loadCookieForm() {
    let airports = $.cookie('airports'),
        oriDateRange = $.cookie('oriDateRange'),
        endDateRange = $.cookie('endDateRange');

    // 无存储
    if (airports === undefined || oriDateRange === undefined || endDateRange === undefined) return;
    if (!(airports instanceof Object)) return;

    console.log('input loaded', airports, oriDateRange, endDateRange);

    // 应用数据
    airports.forEach(airport => {
        $(`#cbAirports${airport}`).attr('checked', true)
    });
    txt_oriDateStart.val(oriDateRange[0]);
    txt_oriDateEnd.val(oriDateRange[1]);
    txt_endDateStart.val(endDateRange[0]);
    txt_endDateEnd.val(endDateRange[1])
}

// 初始化查询表单, 需要查询后端
async function initForm() {
    // 日期选择提示
    let allDates = await getAvailableDates('ZSSS');
    for (let e of allDates) {
        domDateList.append(`<option label="${e}" value="${e}" />`)
    }

    // 机场选择checkbox, jquery-ui
    let allAirports = await getAirports();
    for (let airport of allAirports) {
        let domID = `cbAirports${airport}`;
        formAirports.append(
            `<label for="${domID}"><input id="${domID}" type="checkbox" name="airports" value="${airport}">${airport}</label>`
            // `<input type="checkbox" id="cbAirports${airport}" name="airports" value="${airport}"><label for="cbAirports${airport}">${airport}</label>`
        )
    }
    $("input[type=checkbox]").checkboxradio({ icon: false });

    // 上次查询选项
    loadCookieForm()
}

function setIptNextDay() {
    function foo(ipt_txt) {
        let val = ipt_txt.val()
        if (val.length > 0) {
            let datePart = val.slice(0, 8)
            datePart = dateStr2Date(datePart)
            datePart.setDate(datePart.getDate() + 1);
            datePart = date2DateStr(datePart)
            if (val.length === 10)
                datePart += val.slice(8, 10)
            ipt_txt.val(datePart)
        }
    }

    foo(txt_oriDateStart)
    foo(txt_oriDateEnd)
    foo(txt_endDateStart)
    foo(txt_endDateEnd)
}

function setIptPreDay() {
    function foo(ipt_txt) {
        let val = ipt_txt.val()
        if (val.length > 0) {
            let datePart = val.slice(0, 8)
            datePart = dateStr2Date(datePart)
            datePart.setDate(datePart.getDate() - 1);
            datePart = date2DateStr(datePart)
            if (val.length === 10)
                datePart += val.slice(8, 10)
            ipt_txt.val(datePart)
        }
    }

    foo(txt_oriDateStart)
    foo(txt_oriDateEnd)
    foo(txt_endDateStart)
    foo(txt_endDateEnd)
}

// 创建为了生成动画的leaflet地图
function initTmpMap(mapID) {
    let dom = $(`<div id="${mapID}"></div>`);
    container.append(dom[0]);
    dom.width(widMap);
    dom.height(heiMap);
    dom.addClass('hidden-position');
    let tmpMap = new LeafletMapMgr();
    tmpMap.init(mapID, default_mapOptions, default_tileApi, default_tileOption);
    return tmpMap
}


function setHeatMax(v) {
    flightMap.delayHeat.setHeatMax(v)
}

function render() {
    flightMap.render();
    layer_heatContour.prop('checked', true);
    layer_heatTransField.prop('checked', true);
    // layer_airportMarker.prop('checked', true);
    let dataTimeView = countHeatGrayData(dataOri);
    timeView.render(dataTimeView);
}

function renderHeatContour() {
    flightMap.heatContour.render();
    flightMap.heatContour.show();

    jq_ctrl_group.controlgroup('refresh')
    layer_heatContour.prop('checked', true);

    let dataTimeView = countHeatGrayData(dataOri);
    timeView.render(dataTimeView);
}

// function renderAirportMarker() {
//     console.log('render airport marker checking')
//     flightMap.airportMarker.render();
//     flightMap.airportMarker.show();
//     jq_ctrl_group.controlgroup('refresh')
// layer_airportMarker.prop('checked', true)
// }

function renderHeatTransField() {
    flightMap.heatTransField.render();
    flightMap.heatTransField.show();
    jq_ctrl_group.controlgroup('refresh')
    layer_heatTransField.prop('checked', true)
}

async function animHeat(segDataFlight) {
    let heatStyle = {
        radius: 20,
        opacity: 1,
        maxZoom: 8,
        minZoom: 3,
        max: 400,
    };

    let tmpMaps = [tmpMap0, tmpMap1],
        heatLayers = new Array(2),
        mapImgDatas = new Array(2),
        mapGradient,
        mapGrayDatas = new Array(2);

    heatLayers[0] = tmpMap0.addHeatmap('heatmap', segDataFlight[0], heatStyle);
    mapImgDatas[0] = heatLayers[0].getHeatCtx().getImageData(0, 0, widMap, heiMap);
    mapGradient = heatLayers[0].getHeatGradient();
    mapGrayDatas[0] = heatLayers[0].getHeatGrayData();

    let streamMapMgr = new StreamMapManager(widMap, heiMap);

    for (let i = 0, _i = 1; i < segDataFlight.length - 1; i++ , _i = 1 - i % 2) {
        if (!animating) break;
        console.log('anim hour: ', i, _i);

        tmpMaps[_i].layer('heatmap', null);
        heatLayers[_i] = tmpMaps[_i].addHeatmap('heatmap', segDataFlight[i + 1], heatStyle);
        mapImgDatas[_i] = heatLayers[_i].getHeatCtx().getImageData(0, 0, widMap, heiMap);
        mapGradient = heatLayers[1 - _i].getHeatGradient();
        mapGrayDatas[_i] = heatLayers[_i].getHeatGrayData();

        streamMapMgr.initialize(mapImgDatas[1 - _i], mapImgDatas[_i], mapGradient, mapGrayDatas[1 - _i], mapGrayDatas[_i]);

        for (let i = 0; i < 8 && animating; i++) {
            console.log('   anim frame ' + i);
            let res = streamMapMgr.update();
            flightMap.delayHeat.heatCtx.putImageData(res, 0, 0);
            await wait(1)
        }
    }
}

function animHour() {
    animating = false;
    console.log(segHourDataOri);
    animating = true;
    animHeat(segHourDataOri);
}

async function animDay() {
    if (!segDateDataOri) {
        console.log('segDateDataOri yet loading');
        return false
    }
    animating = false;

    console.log(segDateDataOri);

    animating = true;
    animHeat(segDateDataOri)
}

// 查询两个日期间的每天的所有数据
async function getSegDateDataOri(dateOri, dateEnd, zoom) {
    console.log('start getSegDateDataOri');

    if (dateOri.length !== 8 || dateEnd.length !== 8) return null;

    animDataLoading = true;

    dateOri = dateStr2Date(dateOri);
    dateEnd = dateStr2Date(dateEnd);
    if (Math.abs(dateOri - dateEnd) === 86400000) return;

    let queries = [];
    let iter = 0;
    while (dateOri - dateEnd !== 0) {
        dateOri.setDate(dateOri.getDate() + 1);
        let strDate = dateStr2Date(dateOri)
        queries.push(getDataHeatmap(iptAirport, strDate, zoom));

        iter++
    }

    let res = await Promise.all(queries);
    for (let i = 0; i < res.length; i++) {
        res[i] = FlightMap.packHeatmapData(res[i][0])
    }
    animDataLoading = false;

    segDateDataOri = res;
    return res
}

function stopAnimation() {
    animating = false;
    flightMap.delayHeat.heatLayer.redraw()
}


