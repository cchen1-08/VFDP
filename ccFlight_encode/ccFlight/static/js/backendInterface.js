"use strict";

function getBnProbs() {
    return $.get('/bnprobs')
}

function getAirports() {
    return $.get('/airportsAll')
}

function getAvailableDates(airport) {
    return $.get('/availableDates', {
        airport: airport
    })
}

function getDataHeatmapTwo(airports, oriDatetimeRange, endDatetimeRange, zoom) {
    console.log(airports, oriDatetimeRange, endDatetimeRange, zoom);
    return $.get('/heatTrans/data/heatmapTwo', {
        airports: airports.toString(),
        oriDatetimeRange: oriDatetimeRange.toString(),
        endDatetimeRange: endDatetimeRange.toString(),
        zoom: zoom.toString(),
    })
}

function getDataHeatmap(airports, datetimeRange, zoom) {
    console.log("getDataHeatmap", airports, datetimeRange, zoom);
    return $.get('/heatTrans/data/heatmap', {
        airports: airports.toString(),
        datetimeRange: datetimeRange.toString(),
        zoom: zoom.toString(),
    })
}
