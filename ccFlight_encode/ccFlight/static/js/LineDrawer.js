class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;

    }

    // 归一化
    unify() {
        let norm = this.norm();
        this.x /= norm;
        this.y /= norm;
    }

    // 向量加法
    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    // 向量与实数乘法
    mul(s) {
        return new Vector(this.x * s, this.y * s);
    }

    norm() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    clone() {
        return new Vector(this.x, this.y);
    }
}

class LineDrawer {
    constructor(ctx) {
        this.ctx = ctx;
    }

    drawLine(start, end, color, width) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.moveTo(start[0], start[1]);
        this.ctx.lineTo(end[0], end[1]);

        // this.ctx.moveTo(start[0] * PIXEL_RATIO, start[1] * PIXEL_RATIO);
        // this.ctx.lineTo(end[0] * PIXEL_RATIO, end[1] * PIXEL_RATIO);

        this.ctx.stroke();
    };

    drawVector(start, vec, lineSize = 1.5, color) {
        // 将一个带有起点的向量划分成小段，每段可以上独立的颜色，来达到渐变效果
        // start: 向量起点
        // v: 2D向量，Vector类
        // lineSize:
        // color: 该向量颜色范围

        let length = vec.norm();

        let seg_length = 1; // 每段长度
        let seg_cnt = Math.floor(length / seg_length); // 拆分成 length/seg_length 段
        // let seg_remain = length % seg_length;

        vec.unify(); // 归一化
        let dx = seg_length * vec.x,
            dy = seg_length * vec.y;

        // 构造多段路径
        let path = [
            [start[0], start[1]]    // 向量的起点
        ];
        for (let i = 0; i < seg_cnt; i++) {
            path.push([path[i][0] + dx, path[i][1] + dy]);
        }
        let col = color(length);
        color.range([col, col]);    // 确定小段的颜色

        this.drawLineSegments(path, lineSize, color);
    };


    drawLineSegments(path, line_size, color) {
        // check
        if (path.length < 2) {
            console.warn('LineDrawer line length < 2');
            return false;
        }

        // 调整d3 color的值域
        if (color.range().length === 2) {
            color.domain([1, path.length - 1]);
        } else if (color.range().length === 3) {
            let oldDomain = color.domain();
            let percentMid = (oldDomain[1] - oldDomain[0]) / (oldDomain[2] - oldDomain[0]);
            color.domain([1, path.length * percentMid, path.length - 1]);
        } else {
            console.warn('range of d3 color scale not 2 or 3');
            return false;
        }

        let last_p, point, col,
            alphaOfSeg = d3.scaleLinear().domain([1, path.length - 1]).range([.0, 1.0]);// 起点透明度0，终点透明度1
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineCap = (i === path.length - 1) ? 'round' : 'butt';

            // i 当前线段终止点
            last_p = path[i - 1];
            point = path[i];

            // 画线段(last_p, point)
            col = color(i).toString();
            col = 'rgba(' + col.slice(4, col.length - 1) + ',' + alphaOfSeg(i) + ')';
            // col = 'rgba(' + col.slice(4, col.length - 1) + ',1';

            this.drawLine(last_p, point, col, line_size);
        }
    }

    // never used or tested
    // drawVectorChain(start_p, vectors, width = 1, per_mid = .5) {
    //     // 绘制一串首尾相连的向量，渐变: 头->尾，红->黄->绿
    //     // start_p: 向量链的起点
    //     // vectors: 向量列表，Vector类
    //     // width: 绘制线段的宽度
    //     // per_mid: 渐变中间色(黄)的比例位置，头0，尾100%
    //
    //     let total_length = 0,
    //         acum_length = [0];
    //
    //     for (let i = 0; i < vectors.length; i++) {
    //         total_length += vectors[i].norm();
    //         acum_length.push(total_length);
    //     }
    //     let valMidYellow = per_mid * total_length;
    //
    //     let color = d3.scaleLinear()
    //         .domain([0, valMidYellow, total_length])
    //         .range(['red', 'yellow', 'green'])
    //         .interpolate(d3.interpolateRgb);
    //
    //     let start = start_p,
    //         vec, seg_color;
    //     // 遍历向量段
    //     for (let i = 0; i < vectors.length; i++) {
    //         vec = vectors[i];
    //
    //         // 该段颜色范围d3 scaleLinear
    //         let seg_len_range = [acum_length[i], acum_length[i + 1]];
    //         if (seg_len_range[1] < valMidYellow || seg_len_range[0] > valMidYellow) {
    //             seg_color = d3.scaleLinear()
    //                 .domain([seg_len_range[0], seg_len_range[1]])
    //                 .range([color(seg_len_range[0]), color(seg_len_range[1])]);
    //         } else {
    //             seg_color = d3.scaleLinear().domain([seg_len_range[0], valMidYellow, seg_len_range[1]])
    //                 .range([color(seg_len_range[0]), color(valMidYellow), color(seg_len_range[1])]);
    //         }
    //         this.drawVector(start, vec.clone(), width, seg_color);
    //         start[0] += vec.x;
    //         start[1] += vec.y;
    //     }
    // };
}
