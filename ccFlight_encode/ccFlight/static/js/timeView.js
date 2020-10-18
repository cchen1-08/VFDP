"use strict"

class TimeView {
    constructor(domID, width, height) {
        //绘制时序图
        let dom = document.getElementById(domID)
        setDomSize(dom, width, height);

        this.margin = {top: 5, bottom: 5, left: 5, right: 80};
        this.innerWidth = widTimeView - this.margin.left - this.margin.right
        this.innerHeight = heiTimeView - this.margin.top - this.margin.bottom;
        // let dataset = [2.5, 2.1, 1.7];

        this.svg = d3.select('#timeView')
            .append('svg')
            .attr("width", widTimeView).attr("height", heiTimeView);

        this.g = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.gBars = this.g.append("g")



        // 像素0为白色, 其id为0; [1, 256]分割为8段, id为[1,8]
        // 传入的数组抛弃了为0的像素, 所以数组中序号[0,7]对应[1,8], 调用时要+1
        this.z = d3.scaleLinear().domain([0, 8]).range(["#ffffff", "#3c607d"]);
        this.x = d3.scaleBand()  //为x坐标轴定义一个线性比例尺
            .domain(d3.range(24))
            .range([0, this.innerWidth])
            .padding(0.1);
        this.y = d3.scaleLinear()
            .range([0, this.innerHeight]);

        this.xAxis = this.g.append("g")
            .attr("transform", `translate(${this.margin.left},${this.innerHeight / 2})`)
        // this.g.append("g")
        //     .attr("transform", `translate(${this.margin.left},0)`)
        //     .call(d3.axisLeft(this.y));

        this.legend = this.svg.append('g')
            .attr("transform", `translate(${widTimeView - 35}, 10)`)
            .attr('class', 'legend');

        this.legend.selectAll("rect")
            .data(d3.range(1, 9).reverse()).enter().append("rect")
            .attr('y', (d, i) => i * 15)
            // .attr("transform", (d, i) => `translate(0, ${5 + i * 17})`)
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", this.z);
    }

    render(data) {
        this.clear();

        // 统计最大值
        let valMax = -1;
        for (let group of data) {
            for (let i = group.length - 2; i >= 0; i--) {
                group[i] += group[i + 1]
            }
            valMax = Math.max(valMax, group[0]);
        }
        this.y.domain([0, valMax]);

        this.xAxis.call(d3.axisBottom(this.x));

        // data bar
        this.gBars
            .attr('transform', `translate(${this.margin.left}, 0)`)
            .selectAll(".foo").data(data).enter()
            .append("g")
            .attr('transform', (d, i) => `translate(${this.x(i)}, 0)`)
            .selectAll('rect')
            .data(d => d).enter()
            .append('rect')
            .attr('y', d => (this.innerHeight - this.y(d)) / 2)
            .attr('width', 30)
            .attr('height', this.y)
            .attr('fill', (d, i) => this.z(i + 1));
    }

    clear() {
        this.gBars.selectAll("*").remove();
    }
}
