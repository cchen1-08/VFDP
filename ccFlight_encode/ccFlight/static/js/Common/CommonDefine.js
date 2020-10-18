/*
* @Author: Dawn
* @Date:   2017-05-11 18:47:51
* @Last Modified by:   Dawn
* @Last Modified time: 2017-05-12 17:21:43
*/
'use strict';

function CommonDef()
{
    // Map
    this.mapCenter = [38.7127, -97.0059];
    this.mapLevel = 5;
    this.mapWidth = 0;
    this.mapHeight = 0;

    // Heat
    this.radiusSize = 14;

    // Menu
    this.dbName = "AirQuality";

    this.colorTheme = [
        "#1f77b4",
        "#aec7e8",
        "#ff7f0e",
        "#ffbb78",
        "#2ca02c",
        "#98df8a",
        "#d62728",
        "#ff9896",
        "#9467bd",
        "#c5b0d5",
        "#1f77b4",
        "#aec7e8",
        "#ff7f0e",
        "#ffbb78",
        "#2ca02c",
        "#98df8a",
        "#d62728",
        "#ff9896",
        "#9467bd",
        "#c5b0d5"
    ];

    this.colorGradientNormal = {
            .4: "blue",
            .6: "cyan",
            .7: "lime",
            .8: "yellow",
            1: "red"
       };

    this.colorGradientAQIUSA = {
           0.15: "rgb(1,228,0)",
           0.30: "rgb(255,255,0)",
           0.45: "rgb(255,126,0)",
           0.60: "rgb(255,0,0)",
           0.75: "rgb(153,0,76)",
           1.0: "rgb(126,0,35)"
    };
}

var CommonDefine = new CommonDef();