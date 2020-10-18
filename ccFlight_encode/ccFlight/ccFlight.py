from flask import Flask, render_template, jsonify, request
from .util import infoEntropy
from copy import deepcopy
import json
import os
from collections import  defaultdict
from .FlightFilesController import FlightFileController

app = Flask(__name__)
ffilec = FlightFileController(app.root_path)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/vecDrawTest')
def route_vectorDrawDemo():
    return render_template('vecDrawTest.html')


@app.route('/heatTrans/data/heatmap')
def heatTrans_data_heatmap():
    airports = request.args.get('airports')
    datetimeRange = request.args.get('datetimeRange')
    zoom = int(request.args.get('zoom'))

    airports = airports.split(',') if ',' in airports else [airports, ]

    if ',' in datetimeRange:
        datetimeRange = datetimeRange.split(',')

    dataRes = []

    # 涉及到的所有机场名称列表, 一个机场只出现一次
    epLocs=defaultdict(int)
    for airport in airports:
        epLocs[airport]+=1

    for datum in ffilec.getDelayData(airports, datetimeRange):
        airport = datum['airport']
        dataFlights = datum['content']
        dataFlights = ffilec.getDataPoisson(dataFlights, airport, zoom)
        dataRes.extend(dataFlights)
        for r in dataFlights:
            epLocs[r['epTag']]+=1

    for airport in epLocs:
        epLocs[airport] = ffilec.getAirportLocation(airport)

    return jsonify([dataRes, epLocs])


@app.route('/heatTrans/data/heatmapTwo')
def heatTrans_data_heatmapTwo():
    """
    热力图数据
    返回两个日期文件经过泊松处理过后的数据
    """
    airports = request.args.get('airports')
    oriDatetimeRange = request.args.get('oriDatetimeRange')
    endDatetimeRange = request.args.get('endDatetimeRange')

    airports = airports.split(',') if ',' in airports else [airports, ]

    if ',' in oriDatetimeRange:
        oriDatetimeRange = oriDatetimeRange.split(',')

    if ',' in endDatetimeRange:
        endDatetimeRange = endDatetimeRange.split(',')

    zoom = int(request.args.get('zoom'))

    epLocs = defaultdict(int)
    for airport in airports:
        epLocs[airport] += 1

    # 有多个机场多个日期的数据，对单个数据(content)，根据其机场，进行核的泊松分布和偏移
    # 返回flat的延误条目数组，每个条目的坐标值做了修改
    dataOri = []
    for datum in ffilec.getDelayData(airports, oriDatetimeRange):
        airport = datum['airport']
        dataFlights = datum['content']
        for r in dataFlights:
            epLocs[r['epTag']]+=1
        dataFlights = ffilec.getDataPoisson(dataFlights, airport, zoom)
        dataOri.extend(dataFlights)

    dataEnd = []
    for datum in ffilec.getDelayData(airports, endDatetimeRange):
        airport = datum['airport']
        dataFlights = datum['content']
        for r in dataFlights:
            epLocs[r['epTag']]+=1
        dataFlights = ffilec.getDataPoisson(dataFlights, airport, zoom)
        dataEnd.extend(dataFlights)

    for airport in epLocs:
        epLocs[airport] = ffilec.getAirportLocation(airport)

    return jsonify([dataOri, dataEnd, epLocs])


@app.route('/heatTrans/data/circos/<airport>')
def heatTrans_data_circos(airport):
    latLng = ffilec.getAirportLocation(airport)
    probs = ffilec.getPorbsAirport(airport)
    probs = [ffilec.entropyProbs(probsPeriod) for probsPeriod in probs]

    probsVisiUnder = ffilec.getProbsVisiUnder(airport)
    for i, _ in enumerate(probsVisiUnder):
        probsVisiUnder[i]['g'] = infoEntropy(_['g'])
        probsVisiUnder[i]['b'] = infoEntropy(_['b'])

    return jsonify([probs, probsVisiUnder, latLng])


@app.route('/delayData')
def delayData():
    """
    获取本地文件，航班延误数据。
    3个参数都是可选的
    若有日期参数则查找指定日期的文件，若无日期参数则查找全部日期的文件（其他字段类似）
    return: {stat:str, data:list=>{date:str,content:list}}
    """
    airport = request.args.get('airport')
    date_flight = request.args.get('date_flight')

    data = ffilec.getDelayData(
        airport, date_flight)

    return jsonify(data)


@app.route('/airportsAll')
def airportsAll():
    # 从文件系统中读取机场文件夹
    airports = ffilec.getAvailableAirports()
    return jsonify(airports)


@app.route('/availableDates')
def availableDates():
    """
    从文件系统中找到某机场某类型(离开、抵达)的所有日期文件名
    """
    airport = request.args.get('airport')
    type_flight = request.args.get('type_flight', None)

    airport = str(airport)
    if type_flight:
        type_flight = int(type_flight)

    list_dates = ffilec.getAvailableDates(airport, type_flight)
    return jsonify(list_dates)


@app.route('/airportLocation/<airport>/')
def airportLocation(airport):
    return ffilec.getAirportLocation(airport)


@app.route('/bnprobs')
def bnprobs():
    with open(os.path.join(app.root_path, 'static', 'data', 'bnprobs.json'), 'r')as f:
        data = json.load(f)
    return jsonify(data)
