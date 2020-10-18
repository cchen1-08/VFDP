/*
 (c) 2014, Vladimir Agafonkin
 simpleheat, a tiny JavaScript library for drawing heatmaps with Canvas
 https://github.com/mourner/simpleheat
*/
!function () {
    "use strict";

    function t(i) {
        return this instanceof t ? (this._canvas = i = "string" == typeof i ? document.getElementById(i) : i, this._ctx = i.getContext("2d"), this._width = i.width, this._height = i.height, this._max = 1, void this.clear()) : new t(i)
    }

    t.prototype = {
        defaultRadius: 25,
        defaultGradient: {
            .4: "blue",
            .6: "cyan",
            .7: "lime",
            .8: "yellow",
            1: "red"
        },
        data: function (t, i) {
            return this._data = t, this
        },
        max: function (t) {
            return this._max = t, this
        },
        add: function (t) {
            return this._data.push(t), this
        },
        clear: function () {
            return this._data = [], this
        },
        radius: function (t, i) {
            // LCH
            i = i || 15;
            var a = this._circle = document.createElement("canvas"),
                s = a.getContext("2d"),
                e = this._r = t + i;
            a.width = a.height = 2 * e;
            s.shadowOffsetX = s.shadowOffsetY = 200;
            s.shadowBlur = i;
            s.shadowColor = "black";
            s.beginPath();
            s.arc(e - 200, e - 200, t, 0, 2 * Math.PI, !0);
            s.closePath();
            s.fill();

            // Small kernel
            var a2 = this._circle2 = document.createElement("canvas"),
                s2 = a2.getContext("2d"),
                e2 = this._r2 = t / 2 + i;
            a2.width = a2.height = 2 * e2;
            s2.shadowOffsetX = s2.shadowOffsetY = 200;
            s2.shadowBlur = i;
            s2.shadowColor = "black";
            s2.beginPath();
            s2.arc(e2 - 200, e2 - 200, t / 2, 0, 2 * Math.PI, !0);
            s2.closePath();
            s2.fill();

            // 
            var a3 = this._circle3 = document.createElement("canvas"),
                s3 = a3.getContext("2d"),
                e3 = this._r3 = t / 4 + i;
            a3.width = a3.height = 2 * e3;
            s3.shadowOffsetX = s3.shadowOffsetY = 200;
            s3.shadowBlur = i;
            s3.shadowColor = "black";
            s3.beginPath();
            s3.arc(e3 - 200, e3 - 200, t / 4, 0, 2 * Math.PI, !0);
            s3.closePath();
            s3.fill();

            var a4 = this._circle4 = document.createElement("canvas"),
                s4 = a4.getContext("2d"),
                e4 = this._r4 = t / 8 + i;
            a4.width = a4.height = 2 * e4;
            s4.shadowOffsetX = s4.shadowOffsetY = 200;
            s4.shadowBlur = i;
            s4.shadowColor = "black";
            s4.beginPath();
            s4.arc(e4 - 200, e4 - 200, t / 8, 0, 2 * Math.PI, !0);
            s4.closePath();
            s4.fill();

            return this;
        },
        gradient: function (t) {
            var i = document.createElement("canvas"),
                a = i.getContext("2d"),
                s = a.createLinearGradient(0, 0, 0, 256);
            i.width = 1, i.height = 256;
            for (var e in t) s.addColorStop(e, t[e]);
            return a.fillStyle = s, a.fillRect(0, 0, 1, 256), this._grad = a.getImageData(0, 0, 1, 256).data, this
        },

        //LCH
        getGradient: function () {
            return this._grad;
        },
        getGrayData: function () {
            return this._grayData;
        },
        getColCtx: function () {
            return this._ctx;
        },

        draw: function (t) {
            this._circle || this.radius(this.defaultRadius), this._grad || this.gradient(this.defaultGradient);
            var i = this._ctx;
            i.clearRect(0, 0, this._width, this._height);

            for (var a, s = 0, e = this._data.length; e > s; s++) {
                a = this._data[s];
                i.globalAlpha = Math.max(a[2] / this._max, t || .05);

                // Flickr
                if (a[3] == undefined) {
                    i.drawImage(this._circle, a[0] - this._r, a[1] - this._r);
                } else {
                    if (a[3] > 150)
                        i.drawImage(this._circle, a[0] - this._r, a[1] - this._r);
                    else if (a[3] <= 150 && a[3] > 100)
                        i.drawImage(this._circle2, a[0] - this._r2, a[1] - this._r2);
                    else if (a[3] <= 100 && a[3] > 50)
                        i.drawImage(this._circle3, a[0] - this._r3, a[1] - this._r3);
                    else
                        i.drawImage(this._circle4, a[0] - this._r4, a[1] - this._r4);
                }
            }

            var n = i.getImageData(0, 0, this._width, this._height);

            // LCH add data
            var grayLen = n.data.length / 4;
            this._grayData = new Array(grayLen);
            for (var k = 0; k < grayLen; k++) {
                this._grayData[k] = n.data[k * 4 + 3];
            }

            return this._colorize(n.data, this._grad), i.putImageData(n, 0, 0), this
        },
        _colorize: function (t, i) {
            for (var a, e = 3, s = t.length; s > e; e += 4) {
                // Colorful
                a = 4 * t[e];
                t[e - 3] = i[a];
                t[e - 2] = i[a + 1];//t[e];//
                t[e - 1] = i[a + 2];

                // Gray
                /*
                a = 4 * t[e];
                t[e - 3] = i[a];
                t[e - 2] = i[a];//t[e];//
                t[e - 1] = i[a];
                */
            }
        }
    }, window.simpleheat = t
}();
