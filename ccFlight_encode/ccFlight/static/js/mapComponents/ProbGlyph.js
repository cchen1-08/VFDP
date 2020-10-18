"use strict";

class ProbGlyph extends IBaseComponent {
    constructor(flightMap, options) {
        super(flightMap, options, ProbGlyph.defaultOptions);

        this.svg = d3.select(this.mapMgr.mapInstance.getPanes().overlayPane)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('class', 'probGlyph');
        this.g = this.svg.append("g")
            .attr("class", "leaflet-zoom-hide")
            .attr('fill-opacity', this.options.fillOpacity);
    }

    hide() {
        this.svg.style('visibility', 'hidden')
        this.changed('hide')
    }

    show() {
        this.svg.style('visibility', 'visible')
        this.changed('show')
    }

    rectiftDrag(vecMove) {
        this.svg.style('left', -vecMove[0])
            .style('top', -vecMove[1]);
    }

    clear() {
        this.g.selectAll('*').remove();
    }

    // cc的bn概率处理
    // 包装数据
    packPartPosition(partition, dataOri) {
        let partPosition = [];
        for (let i = 0, li = partition.length / 8; i < li; i++) {
            if (partition[i * 8] !== 0) {
                let corner1 = this.mapMgr.containerPointToLatLng(
                    [partition[i * 8 + 3], partition[i * 8 + 5]]);

                let corner2 = this.mapMgr.containerPointToLatLng(
                    [partition[i * 8 + 4], partition[i * 8 + 6]]);

                let bounds = L.latLngBounds(corner1, corner2);
                let bounds_list = [];

                for (let flight of dataOri) {
                    if (bounds.contains(flight.epLoc)) {
                        bounds_list.push(flight)
                    }
                }
                partPosition.push(bounds_list)
            }
        }
        return partPosition
    }

    /*
        @ partition: 光流计算输出的
        @ dataOri: 前一时刻数据
     */
    render(partition, dataOri, bnprobs) {
        console.log('ProbGlyph render');
        this.clear();
        let partPosition = this.packPartPosition(partition, dataOri);
        this._render(bnprobs, partPosition)
    }


    // 方案1: 局部减全局差值,正右,负左,值映射到arc半径
    drawArc1(root, dayStatistic, minVal, maxVal) {
        let scaleRadius = d3.scaleLinear().domain([minVal, maxVal]).range([2, 50]),
            arcWidth = 2;

        let option = {};    // 绘制arc的参数
        let val, absVal, arcColor;
        dayStatistic.forEach(e => {
            val = e[0];
            absVal = e[3];
            option.innerRadius = scaleRadius(absVal);
            option.outerRadius = option.innerRadius + arcWidth;
            // 正右 左负
            if (val >= 0) {
                option.startAngle = 0;
                option.endAngle = Math.PI;
            } else {
                option.startAngle = Math.PI;
                option.endAngle = Math.PI * 2;
            }
            // 按照矩阵中的行列查找对应颜色
            arcColor = this.lookupColor(e[1], e[2]);
            root.append('path')
                .attr('d', d3.arc()(option))
                .attr('fill', arcColor);
        })
    }

    // 方案2: 与方案1不同的是不映射到绝对值,而是映射排序,arc是相邻的
    drawArc2(root, dayStatistic) {
        let curRadius = 2,
            arcWidth = 2.5,
            arcColor;
        let option = {};
        let val, e;
        for (let i = dayStatistic.length - 1; i >= 0; i--) {
            e = dayStatistic[i];
            val = e[0];
            option.innerRadius = curRadius;
            option.outerRadius = option.innerRadius + arcWidth;
            curRadius += arcWidth;
            if (val >= 0) {
                option.startAngle = 0;
                option.endAngle = Math.PI;
            } else {
                option.startAngle = Math.PI;
                option.endAngle = Math.PI * 2;
            }
            arcColor = this.lookupColor(e[1], e[2]);
            root.append('path')
                .attr('d', d3.arc()(option))
                .attr('fill', arcColor);
        }
    }

    // // 方案3: 映射总共4*2*4=32个值到圆环上, 局部和全局各16个
    // // 从右上角顺时针开始的扇形分别是Dde,Dr15,Dr30,Dr60
    // drawArc3(root, dayStatisticArr, impact_prob) {
    //     let arc = d3.arc();
    //     let option = {};
    //     let arcColor;
    //     let arcWidth = 1;
    //     let angleRange4_global = {
    //         Dde: [0, Math.PI / 2],
    //         Dr15: [Math.PI / 2, Math.PI],
    //         Dr30: [Math.PI, Math.PI * 1.5],
    //         Dr60: [Math.PI * 1.5, Math.PI * 2],
    //     };
    //     let angleOffset = Math.PI / 6;
    //     let angleRange4_local = {
    //         Dde: [0, Math.PI / 2],
    //         Dr15: [Math.PI / 2, Math.PI],
    //         Dr30: [Math.PI, Math.PI * 1.5],
    //         Dr60: [Math.PI * 1.5, Math.PI * 2],
    //     };
    //     for (let k in angleRange4_local) {
    //         angleRange4_local[k][0] += angleOffset;
    //         angleRange4_local[k][1] -= angleOffset
    //     }
    //
    //     let scaleRadius = d3.scaleSqrt().domain([0, 1]).range([0, 30]);
    //
    //     // 全局
    //     for (let k in angleRange4_global) {
    //         for (let i in impact_prob[k]) {
    //             let val = impact_prob[k][i];
    //             arcColor = this.lookupColor(k, i);
    //             option.startAngle = angleRange4_global[k][0];
    //             option.endAngle = angleRange4_global[k][1];
    //             option.innerRadius = scaleRadius(val);
    //             option.outerRadius = option.innerRadius + arcWidth;
    //             root.append("path")
    //                 .attr('d', arc(option))
    //                 .attr('fill', arcColor);
    //         }
    //     }
    //     // 局部背景
    //     // for (let k in angleRange4_local) {
    //     //     option.startAngle = angleRange4_local[k][0]
    //     //     option.endAngle = angleRange4_local[k][1]
    //     //     option.innerRadius = 0
    //     //     option.outerRadius = scaleRadius(1)
    //     //     root.append("path")
    //     //         .attr('d', arc(option))
    //     //         .attr('fill', 'white');
    //     // }
    //
    //     // 局部
    //     dayStatisticArr.forEach(e => {
    //         const val = e[3];
    //         arcColor = this.lookupColor(e[1], e[2]);
    //         option.startAngle = angleRange4_local[e[1]][0];
    //         option.endAngle = angleRange4_local[e[1]][1];
    //         option.innerRadius = scaleRadius(val);
    //         option.outerRadius = option.innerRadius + arcWidth;
    //         root.append("path")
    //             .attr('d', arc(option))
    //             .attr('fill', arcColor);
    //     });
    //
    //     // 单位圆
    //     option.startAngle = 0;
    //     option.endAngle = Math.PI * 2;
    //     option.innerRadius = scaleRadius(1);
    //     option.outerRadius = option.innerRadius + 0.3;
    //     root.append("path")
    //         .attr('d', arc(option))
    //         .attr('fill', 'black')
    // }
    //
    // drawArc4(root, dayStatisticMat, impact_prob) {
    //     let arc = d3.arc();
    //     let option = {};
    //     let arcColor;
    //     let val;
    //     let angleRange4_global = {
    //         Dde: [0, Math.PI / 2],
    //         Dr15: [Math.PI / 2, Math.PI],
    //         Dr30: [Math.PI, Math.PI * 1.5],
    //         Dr60: [Math.PI * 1.5, Math.PI * 2],
    //     };
    //     let angleOffset = Math.PI / 4;
    //     for (let k in angleRange4_global) {
    //         angleRange4_global[k][1] - angleOffset
    //     }
    //     let angleRange4_local = {
    //         Dde: [0, Math.PI / 2],
    //         Dr15: [Math.PI / 2, Math.PI],
    //         Dr30: [Math.PI, Math.PI * 1.5],
    //         Dr60: [Math.PI * 1.5, Math.PI * 2],
    //     };
    //     for (let k in angleRange4_local) {
    //         angleRange4_local[k][0] += angleOffset
    //     }
    //
    //     let scaleRadius = d3.scaleLinear().domain([0, 1]).range([0, 30]);
    //
    //     // 全局
    //     let curRadius;
    //     for (let k in angleRange4_global) {
    //         curRadius = 0;
    //         for (let i in impact_prob[k]) {
    //             val = impact_prob[k][i];
    //             arcColor = this.lookupColor(k, i);
    //             option.startAngle = angleRange4_global[k][0];
    //             option.endAngle = angleRange4_global[k][1];
    //             option.innerRadius = curRadius;
    //             curRadius += scaleRadius(val);
    //             option.outerRadius = curRadius;
    //             root.append("path")
    //                 .attr('d', arc(option))
    //                 .attr('fill', arcColor);
    //         }
    //     }
    //
    //     // 局部
    //     for (let k in angleRange4_local) {
    //         curRadius = 0;
    //         for (let i in dayStatisticMat[k]) {
    //             val = dayStatisticMat[k][i];
    //             arcColor = this.lookupColor(k, i);
    //             option.startAngle = angleRange4_local[k][0];
    //             option.endAngle = angleRange4_local[k][1];
    //             option.innerRadius = curRadius;
    //             curRadius += scaleRadius(val);
    //             option.outerRadius = curRadius;
    //             root.append("path")
    //                 .attr('d', arc(option))
    //                 .attr('fill', arcColor);
    //         }
    //     }
    //
    //     // 单位圆
    //     option.startAngle = 0;
    //     option.endAngle = Math.PI * 2;
    //     option.innerRadius = scaleRadius(1);
    //     option.outerRadius = option.innerRadius + 0.3;
    //     root.append("path")
    //         .attr('d', arc(option))
    //         .attr('fill', 'black')
    // }

    aver(array1, array2) {
        let arr_key = _.keys(array1);
        let aver_result = [];
        for (const key_element of arr_key) {
            aver_result[key_element] = [];
            for (let i = 0; i < array1[key_element].length; i++) {
                const arr_element = (array1[key_element][i] + array2[key_element][i]) / 2;
                aver_result[key_element].push(arr_element)
            }
        }
        return aver_result
    }

    _render(bnprobs, partPosition) {
        let airport_info = _.values(bnprobs),   // underscore.js
            airport_name = _.keys(bnprobs);

        let glyphData = [];

        // 遍历区域
        for (const flights of partPosition) {
            if (flights.length <= 10) continue;

            // 区域内所有航班的机场, 组成包围盒
            let locAllAirports = [];
            for (let flight of flights) {
                locAllAirports.push(flight.epLoc)
            }

            // 包围盒经纬度往外扩1个单位
            let regionBounds = L.latLngBounds(locAllAirports);
            let bMax = regionBounds.getNorthEast(),
                bMin = regionBounds.getSouthWest();
            bMin = L.latLng(bMin.lat - 1, bMin.lng - 1);
            bMax = L.latLng(bMax.lat + 1, bMax.lng + 1);
            regionBounds = L.latLngBounds(bMin, bMax);

            // 判断并存储属于本区域的机场(重要机场)
            flights.region = [];
            for (let airport in mainAirports) {
                if (airportLoc.hasOwnProperty(airport)) {
                    let loc = airportLoc[airport];
                    if (regionBounds.contains(loc)) {
                        flights.region.push(airport)
                    }
                }
            }

            // 获取本区域的impact_prob
            let impact_prob;
            if (flights.region.length === 1) {
                // L.rectangle(regionBounds, {
                //     color: 'blue'
                // }).addTo(this.mapMgr.mapInstance)
                let airport = flights.region[0];
                impact_prob = airport_info[_.indexOf(airport_name, airport)][2]

            } else if (flights.region.length === 2) {
                // L.rectangle(regionBounds, {
                //     color: 'green'
                // }).addTo(this.mapMgr.mapInstance)
                let airport1 = flights.region[0],
                    airport2 = flights.region[1];
                let impact_prob1 = airport_info[_.indexOf(airport_name, airport1)][2];
                let impact_prob2 = airport_info[_.indexOf(airport_name, airport2)][2];
                impact_prob = this.aver(impact_prob1, impact_prob2)

            } else {
                // 区域内没有重要机场, 跳过该区域
                // console.log(regionBounds, element)
                // L.rectangle(regionBounds, {
                //     color: 'red'
                // }).addTo(this.mapMgr.mapInstance)
                continue
            }


            // 初始化矩阵
            let dayStatisticMat = {
                Dde: [0, 0, 0, 0], // 等级从1~4,减1作为索引
                Dr15: [0, 0, 0, 0],
                Dr30: [0, 0, 0, 0],
                Dr60: [0, 0, 0, 0],
            };

            // 遍历本区域航班, 统计局部概率
            for (let flight of flights) {
                dayStatisticMat.Dde[segDelay(flight.flightDelay) - 1]++;
                dayStatisticMat.Dr15[flight.cnt_p15 > 0 ? segRate(flight.cnt_d15 / flight.cnt_p15) : 0]++;
                dayStatisticMat.Dr30[flight.cnt_p30 > 0 ? segRate(flight.cnt_d30 / flight.cnt_p30) : 0]++;
                dayStatisticMat.Dr60[flight.cnt_p60 > 0 ? segRate(flight.cnt_d60 / flight.cnt_p60) : 0]++;
            }

            // 归一化, 矩阵所有值除以航班数
            for (let k in dayStatisticMat) {
                for (let i in dayStatisticMat[k]) {
                    if (dayStatisticMat[k].hasOwnProperty(i))
                        dayStatisticMat[k][i] /= flights.length
                }
            }
            // console.log('局部矩阵', dayStatisticMat)

            // 4*4 矩阵转成队列 16
            let dayStatisticArr = [];
            for (let row in dayStatisticMat) {
                for (let col in dayStatisticMat[row]) {
                    if (dayStatisticMat[row].hasOwnProperty(col)) {
                        let val = dayStatisticMat[row][col];
                        dayStatisticArr.push([val, row, col, Math.abs(val)])   // [原值,行序号,列序号,绝对值]
                    }
                }
            }
            dayStatisticArr.sort((a, b) => b[3] - a[3]);    // 按绝对值排序
            // console.log('局部队列', dayStatisticArr)

            // 差值矩阵: 局部减全局差值的矩阵
            let dayStatisticDiffMat = {
                Dde: [0, 0, 0, 0], // 等级从1~4,减1作为索引
                Dr15: [0, 0, 0, 0],
                Dr30: [0, 0, 0, 0],
                Dr60: [0, 0, 0, 0],
            };
            for (let row in dayStatisticMat) {
                for (let col in dayStatisticMat[row]) {
                    if (dayStatisticMat[row].hasOwnProperty(col)) {
                        let val = dayStatisticMat[row][col];
                        val -= impact_prob[row][col]; // 计算差值
                        dayStatisticDiffMat[row][col] = val;
                    }
                }
            }
            // console.log('局部差值矩阵', dayStatisticDiffMat)

            // 差值矩阵转为差值队列
            let dayStatisticDiffArr = [];
            for (let row in dayStatisticDiffMat) {
                for (let col in dayStatisticDiffMat[row]) {
                    if (dayStatisticDiffMat[row].hasOwnProperty(col)) {
                        let val = dayStatisticDiffMat[row][col];
                        dayStatisticDiffArr.push([val, row, col, Math.abs(val)])    // [原值,行序号,列序号,绝对值]
                    }
                }
            }
            // 按照绝对值降序排序
            // dayStatisticDiffArr.sort((a, b) => b[3] - a[3])
            // dayStatisticDiffArr = dayStatisticDiffArr.slice(0, 8) // 取排序后前8个

            // console.log('局部差值队列', dayStatisticDiffArr)

            // 统计差值队列中绝对值的最大最小值
            let [maxVal, minVal] = maxMinValOfArray(dayStatisticDiffArr, (v) => v[3]);

            // 绘制

            // 本区域的第一个机场为主要机场, 获取其屏幕像素坐标, 作为本区域中心像素坐标
            // 此坐标仅用于确定绘制glyph的位置
            let region_center = this.mapMgr.latLngToContainerPoint(
                mainAirports[flights.region[0]]
            );

            // 当前区域glyph的根位置元素
            let locationContainer = this.g.append("g")
                .attr("transform", `translate(${region_center.x}, ${region_center.y})`);
            this.drawArc1(locationContainer, dayStatisticDiffArr, minVal, maxVal);
            // this.drawArc2(locationContainer, dayStatisticDiffArr);
            // this.drawArc3(locationContainer, dayStatisticArr, impact_prob)
            // this.drawArc4(locationContainer, dayStatisticMat, impact_prob)

            // glyph所在的地理坐标和绘制好的svg中的g元素
            glyphData.push({
                loc: t,
                glyph: locationContainer.clone(true),
            })

        }
        this.changed('rendered', {
            glyphData: glyphData
        })
    }
}

ProbGlyph.defaultOptions = {
    fillOpacity: 1,
};
