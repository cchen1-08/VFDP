import os
import json
from collections import defaultdict
from .util import *
import re
from pprint import pprint
from json import JSONEncoder
from datetime import date, timedelta
from math import sqrt
from datetime import date, timedelta
from functools import reduce


class FlightFileController():
    """对于目前的json文件目录结构定义的管理类"""

    def __init__(self, root_path):
        self.root_path = root_path
        self.dir_data = os.path.join(self.root_path, 'static', 'data')
        self.dir_dataDelay = os.path.join(self.dir_data, 'delaydata')
        self.names_type_flight = {0: 'AResult', 1: 'DResult'}
        # self.airportsDelaydata = ['ZBAA', 'ZUUU', 'ZSSS', 'ZLXY',
        #                           'ZGGG', 'ZHCC', 'ZPPP', 'ZUCK', 'ZSPD', 'ZGSZ', 'ZSAM']
        self.airportsDelaydata = ['ZBAA', 'ZSSS','ZGGG','ZSPD']
        self.airportsWeather = ['ZBAA', 'ZBHH', 'ZBSJ', 'ZBTJ', 'ZBYN', 'ZGBH', 'ZGGG', 'ZGHA', 'ZGKL', 'ZGNN', 'ZGOW',
                                'ZGSZ', 'ZHCC', 'ZHHH', 'ZJHK', 'ZJSY', 'ZLLL', 'ZLXY',
                                'ZPPP', 'ZSAM', 'ZSFZ', 'ZSHC', 'ZSJN', 'ZSNB', 'ZSNJ', 'ZSOF', 'ZSPD', 'ZSQD', 'ZSSS',
                                'ZUCK', 'ZUGY', 'ZUUU', 'ZWSH', 'ZWWW', 'ZYCC', 'ZYHB', 'ZYTL', 'ZYTX']

        # D: 当前航班是否发生航班延误
        # Dde: 起飞延误等级
        # WDeS: 起飞时出发机场的能见度等级
        # WDeE: 起飞时目的机场的能见度等级
        # PreD: 本端机场前序航班延误差
        # Dr15: 本端机场前15~30分钟的延误率等级
        # Dr30: 本端机场前30~60分钟的延误率等级
        # Dr60: 本端机场前1小时~2小时的延误率等级
        # Wr15: 15~30分前本端延误的天气影响率等级
        # Wr30: 30分~60分前本端延误的天气影响率等级
        # Wr60: 1小时~2小时前本端延误的天气影响率等级
        self.bnNodes = ['D', 'Dde', 'WDeS', 'WDeE', 'PreD',
                        'Dr15', 'Dr30', 'Dr60', 'Wr15', 'Wr30', 'Wr60']
        self.bnModel = '[WDeS][WDeE][Wr15][Wr30][Wr60][PreD][Dde|WDeS:WDeE][Dr15|Wr15:Dr30][Dr30|Wr30:Dr60][Dr60|Wr60][D|Dde:Dr15:PreD]'

    def readFileDateRaw(self, airport, typeFlight, dateFlight):
        """
        读取指定日期文件，返回数据
        return:
            {'airport': airport,
            'typeFlight': typeFlight,
            'dateFlight': dateFlight,
            'content': content(文件内容)}
        """
        if not self.isDateFlightValid(dateFlight):
            return None

        url = os.path.join(self.dir_dataDelay, airport,
                           self.names_type_flight[typeFlight], dateFlight) + '.json'
        if not os.path.isfile(url):
            return None

        with open(url, 'r', encoding='utf-8')as f:
            content = json.load(f)

        return {'airport': airport, 'typeFlight': typeFlight,
                'dateFlight': dateFlight, 'content': content}

    def readFileDate(self, airport, typeFlight, dateFlight, timeRange=None):
        """
        读取指定日期文件，返回数据
        return:
            {'airport': airport,
            'typeFlight': typeFlight,
            'dateFlight': dateFlight,
            'content': content(文件内容)}
        """
        if not self.isDateFlightValid(dateFlight):
            return None

        if timeRange:
            timeStart, timeEnd = timeRange
            if timeStart > timeEnd:
                timeStart, timeEnd = timeEnd, timeStart

        url = os.path.join(self.dir_dataDelay, airport,
                           self.names_type_flight[typeFlight], dateFlight) + '.json'
        if not os.path.isfile(url):
            return None

        with open(url, 'r', encoding='utf-8')as f:
            content = json.load(f)
        if timeRange:
            # print('before filter',timeStart,timeEnd,len(content))
            content = filter(lambda x: timeStart <= x['schedH'] < timeEnd, content)
            content = list(content)
            # print('after filter',len(content))

        return {'airport': airport, 'typeFlight': typeFlight,
                'dateFlight': dateFlight, 'content': content}

    def readFolderTypeRaw(self, airport, typeFlight, dateFlight):
        """
        在类型(抵达、离开)文件夹中搜集数据，
        若指定date_flight则返回指定文件内容，若不指定则返回所有子文件内容
        因此本方法决定是否遍历某机场某类型下的所有文件
        return: list
        """
        if dateFlight:
            dates = [dateFlight]
        else:
            dates = self.getAvailableDates(airport, typeFlight)
        res = []
        for date_ in dates:
            _ = self.readFileDateRaw(airport, typeFlight, date_)
            if _:
                res.append(_)

        return res

    def readFolderType(self, airport, typeFlight, dateFlightRange=None):
        """
        在类型(抵达、离开)文件夹中搜集数据，
        若指定date_flight则返回指定文件内容，若不指定则返回所有子文件内容
        因此本方法决定是否遍历某机场某类型下的所有文件
        return: list
        """
        # 传入的日期字符串
        if not dateFlightRange is None and len(dateFlightRange) == 8:
            dateFlightRange = (dateFlightRange + '00', dateFlightRange + '24')

        # 一开始就没有传入日期的情况
        if dateFlightRange is None:
            dateFlights = self.getAvailableDates(airport, typeFlight)
            dateFlightRange = (dateFlights[0] + '00', dateFlights[-1] + '24')

        datetimeStart, datetimeEnd = dateFlightRange
        if not (self.isDatetimeFlightValid(datetimeStart)
                and self.isDatetimeFlightValid(datetimeEnd)):
            return None

        dateStart = datetimeStart[:8]
        dateEnd = datetimeEnd[:8]
        timeStart = int(datetimeStart[8:10])
        timeEnd = int(datetimeEnd[8:10])

        if dateStart == dateEnd:
            # print('same dateStart and dateEnd', dateStart, dateEnd)
            _ = self.readFileDate(airport, typeFlight, dateStart, [timeStart, timeEnd])
            if _ is not None:
                return [_, ]
            else:
                return []
        else:
            res = []

            # 加上第一天，开始时间给定，结束时间24点
            _ = self.readFileDate(airport, typeFlight, dateStart, timeRange=[timeStart, 24])
            if _ is not None:
                res.append(_)
            # 构造中间遍历的变量
            dateStart = date(int(dateStart[:4]), int(
                dateStart[4:6]), int(dateStart[6:8]))
            nextDay = dateStart + timedelta(days=1)
            nextDayStr = nextDay.strftime('%Y%m%d')
            # 遍历中间天
            while nextDayStr != dateEnd:
                _ = self.readFileDate(airport, typeFlight, nextDayStr)
                if _ is not None:
                    res.append(_)
                nextDay = nextDay + timedelta(days=1)
                nextDayStr = nextDay.strftime('%Y%m%d')
            # 加上末尾天，开始时间0点，结束时间给定
            _ = self.readFileDate(airport, typeFlight,
                                  dateEnd, timeRange=[timeEnd, 24])
            if _ is not None:
                res.append(_)
            return res

    def readFolderAirport(self, airport, dateFlightRange=None):
        """
        在机场文件夹中搜集数据，
        若指定type_flight，则在指定的类型文件夹中搜寻
        否则在抵达和离开两个文件夹中搜寻全部
        """
        results = []
        for type_ in [0, 1]:
            results.extend(self.readFolderType(airport, type_, dateFlightRange))
            # results.extend(self.readFolderTypeRaw(
            #     airport, type_, dateFlightRange))
        return results

    def readFolderRoot(self, airports, dateFlightRange=None):
        """
        从存放机场文件夹的根目录下开始搜集数据，
        若指定airport，则搜寻指定的机场文件夹
        否则搜寻全部
        """
        res = []
        for airport in airports:
            if not self.isAirportValid(airport):
                continue
            res.extend(self.readFolderAirport(
                airport, dateFlightRange))
        return res

    def isAirportValid(self, airport):
        """ 机场名检验，全大写英文字母，长度3~4"""
        pattern = r"[A-Z]{3,4}"
        match = re.match(pattern, airport)
        if match:
            return True
        else:
            return False

    def isDateFlightValid(self, dateFlight):
        """ 日期检验，yyyymmdd"""
        pattern = r"\d{4}[0-1][0-9][0-3][0-9]"
        try:
            match = re.match(pattern, dateFlight)
        except Exception as e:
            print(type(dateFlight), dateFlight)
            raise e
        if match:
            return True
        else:
            return False

    def isDatetimeFlightValid(self, datetimeFlight):
        pattern = r"\d{4}[0-1][0-9][0-3][0-9][0-2][0-9]"
        match = re.match(pattern, datetimeFlight)
        if match:
            return True
        else:
            return False

    def getAvailableDates(self, airport, typeFlight=None):
        if typeFlight:
            urls = [os.path.join(self.dir_dataDelay, airport, self.names_type_flight[typeFlight]), ]
        else:
            urls = [os.path.join(self.dir_dataDelay, airport, self.names_type_flight[1])]

        res = []
        for url in urls:
            if not os.path.isdir(url):
                return None
            for f in files(url):
                date_ = f.split(os.sep)[-1].split('.')[0]
                if not self.isDateFlightValid(date_):
                    continue
                res.append(date_)
        res = list(set(res))
        res.sort(key=lambda x: int(x))
        return res

    def getAvailableAirports(self):
        # url = os.path.join(self.root_path, 'static/data/delaydata')
        # res = []
        # for folder in child_folders(url):
        #     airport = folder.split('/')[-1]
        #     if not self.isAirportValid(airport):
        #         continue
        #     res.append(airport)
        # return res
        return self.airportsDelaydata

    def getDelayData(self, airports, dateFlightRange=None):
        """
        根据三层参数收集所有数据的入口方法
        """
        print('getDelayData', airports, dateFlightRange)

        if isinstance(airports, str):
            airports = [airports]
        if not airports:
            airports = self.getAvailableAirports()

        res = self.readFolderRoot(airports, dateFlightRange)

        print('lenOfDelayData', len(res))
        return res

    def getDataPoisson(self, dataFlights, airport, zoom):
        """调用poissonset脚本中的方法对单个航班日期文件(content)中航班的坐标点进行重新分布
        aiport: 核偏移的目标机场名称
        """

        if len(dataFlights) == 0: return dataFlights
        # 去掉非航班延误的条目
        dataFlights = list(filter(lambda x: x['isFlightDelay'], dataFlights))
        # 升序排，机场、延误时间
        dataFlights.sort(key=lambda x: (x['epTag'], x['flightDelay']))
        if len(dataFlights) == 0: return dataFlights

        def offsetCenter(source, target, step):
            vDir = [target[0] - source[0], target[1] - source[1]]
            lenVDir = sqrt(vDir[0] ** 2 + vDir[1] ** 2)
            vDir = [vDir[0] / lenVDir, vDir[1] / lenVDir]
            source = [source[0] + vDir[0] * step, source[1] + vDir[1] * step]
            return source

        from .poissonset import getRelatedPos
        ptsPoisson = getRelatedPos(os.path.join(self.dir_data, 'poissonset.json'))
        airportLoc = self.getAirportLocation(airport)
        print('airport:{}, location:{}'.format(airport, airportLoc))

        # zoom to scale
        zoomTable = {
            8: 0.010,
            7: 0.021,
            6: 0.034,
            5: 0.047,
        }
        try:
            scale = zoomTable[zoom]
        except KeyError:
            scale = 0.047
        print('zoom:{}, scale:{}'.format(zoom, scale))

        # step = sqrt((ptsPoisson[1][0] * scale)**2 +
        #             (ptsPoisson[1][1] * scale)**2)
        step = 15 * scale
        print('offset step', step)

        curDistriCenter = dataFlights[0]['epLoc']
        curPoissonOffsetID = 0
        curDelayLevel = self.segDelay(dataFlights[0]['tDelay'])

        # for i in range(1, len(dataFlights)):
        #     if dataFlights[i]['epTag'] == dataFlights[i - 1]['epTag']:
        #         curPoissonOffsetID += 1
        #     else:
        #         curPoissonOffsetID = 0

        #     dataFlights[i]['epLoc'][0] += ptsPoisson[curPoissonOffsetID][0] * scale
        #     dataFlights[i]['epLoc'][1] += ptsPoisson[curPoissonOffsetID][1] * scale
        #     dataFlights[i]['epLoc'][0] = round(dataFlights[i]['epLoc'][0], 3)
        #     dataFlights[i]['epLoc'][1] = round(dataFlights[i]['epLoc'][1], 3)

        for i in range(1, len(dataFlights)):
            # 相同机场的数据按照泊松分布
            delayLevel = self.segDelay(dataFlights[i]['tDelay'])
            if dataFlights[i]['epTag'] == dataFlights[i - 1]['epTag']:
                # 当延误满足某种变化，需要体现到分布中心的偏移
                if delayLevel == curDelayLevel:
                    curPoissonOffsetID += 1
                else:
                    curPoissonOffsetID = 0
                    curDistriCenter = offsetCenter(
                        curDistriCenter, airportLoc, step)
                    curDelayLevel = delayLevel

            # 不同机场的数据在新的机场坐标重新开始泊松分布
            else:
                curPoissonOffsetID = 0
                curDistriCenter = dataFlights[i]['epLoc']
                curDelayLevel = delayLevel

            # 机场点偏移
            dataFlights[i]['epLoc'] = [
                round(curDistriCenter[0] + ptsPoisson[curPoissonOffsetID][0] * scale, 3),
                round(curDistriCenter[1] + ptsPoisson[curPoissonOffsetID][1] * scale, 3)
            ]

        return dataFlights

    def isDelayAirport(self, airport, delay):
        if airport in ['ZBAA', 'ZGGG', 'ZSPD']:
            return delay > 1800
        elif airport in ['ZSSS', 'ZUUU', 'ZGSZ']:
            return delay > 1500
        elif airport in ['ZPPP', 'ZLXY', 'ZSHC', 'ZBTJ']:
            return delay > 1200
        else:
            return delay > 900

    def getAirportLocation(self, airport):
        url = os.path.join(self.dir_data, 'location.json')
        with open(url, 'r')as f:
            d = json.load(f)
            if airport in d:
                latlng = (d[airport][1], d[airport][0])  # 文件现在存的是经纬度，转成纬经度
                return latlng
            else:
                return None

    def getWeather(self, airport, _date, _time):
        """天气查询，获取某天某机场的能见度"""
        # print('get weather' ,airport, _date, _time)
        # region = airport[:2]
        url = os.path.join(self.dir_data, 'visibility', airport, _date + '.json')
        if not os.path.isfile(url):
            # airportSameRegion = self.airportsWeather[:]
            # airportSameRegion = filter(
            #     lambda x: region == x[:2], airportSameRegion)
            # locAirport = self.getAirportLocation(airport)
            # locAirports = [self.getAirportLocation(
            #     a) for a in airportSameRegion]
            # distAirports = [haversine(locAirport, l) for l in locAirports]
            # _=list(zip( airportSameRegion,distAirports ))
            # _.sort(  )

            # print(locAirports)
            # minD
            # minId

            # for i, d in enumerate(locAirports):

            # if airport[0]=='Z':
            #     print('weather file not exist:', airport, _date)
            return None

        with open(url, 'r', encoding='utf-8')as f:
            dict_vis = json.load(f)

        t = int((_time + 0.25) * 2) / 2  # 半小时采样
        t = float(t)

        try:
            return dict_vis[str(t)]
        except KeyError:
            if int(t) == 24:
                # 取后一天0点
                nextDay = date(int(_date[:4]), int(
                    _date[4:6]), int(_date[6:8]))
                nextDay += timedelta(days=1)
                nextDay = nextDay.strftime('%Y%m%d')

                return self.getWeather(airport, nextDay, 0)

            # 找到之前最近有记录的时间
            tBefore = t - 0.5
            while str(tBefore) not in dict_vis and t - tBefore < 2 and tBefore > 0:
                tBefore -= 0.5
            try:
                visBefore = dict_vis[str(tBefore)]
                return visBefore
            except KeyError:
                # 找到之后最近有记录的时间
                tAfter = t + 0.5
                while str(tAfter) not in dict_vis and tAfter - t < 2 and tAfter < 24:
                    tAfter += 0.5
                try:
                    visAfter = dict_vis[str(tAfter)]
                    return visAfter
                except KeyError:
                    print('weather not exist:', airport, _date, _time, t)
                    return None

    # ========================
    # BN stuff

    # def collectDataForBNTest(self, delayData, timeRange=(8, 22)):
    #     """
    #     从航班延误数据中判断某记录之前时间段是否有延误
    #     [本记录是否延误，前15分钟是否延误，前30分到前15分是否延误，前45分到前30分，前60分到前45分]
    #     """
    #     print('日期文件数:', len(delayData))
    #     results = []  # 保存所有结果元祖[delay,d15,d30,d45,d60]，所有元素是布尔类型

    #     for data_file in delayData:
    #         content = data_file['content']
    #         # 记录按时间逆序排序
    #         content.sort(key=lambda x: x['schedH'], reverse=True)

    #         # 正序遍历条目，即start降序
    #         for i, r_out in enumerate(content):
    #             # 当前记录信息和元组
    #             item = {
    #                 'start': r_out['schedH'],
    #                 'final': False,
    #                 'tup': [r_out['delayH'] > 900]+[False]*4
    #             }
    #             content[i] = item

    #             # 逆序从r_out的前一个元素向前逆序遍历，即时间升序
    #             for j in range(i)[::-1]:
    #                 r_in = content[j]
    #                 if r_in['final']:
    #                     break

    #                 deltaStart = r_in['start']-r_out['schedH']

    #                 if deltaStart > 1:
    #                     r_in['final'] = True
    #                 # elif deltaStart > 1.25:
    #                 #     r_in['tup'][6] = True
    #                 # elif deltaStart > 1:
    #                 #     r_in['tup'][5] = True
    #                 elif deltaStart > 0.75:  # [-60, -45)
    #                     r_in['tup'][4] = True
    #                 elif deltaStart > 0.5:   # [-45, -30)
    #                     r_in['tup'][3] = True
    #                 elif deltaStart > 0.25:  # [-30, -15)
    #                     r_in['tup'][2] = True
    #                 elif deltaStart > 0:     # [-15, 0)
    #                     r_in['tup'][1] = True
    #                 elif deltaStart == 0:
    #                     # print('相邻start相同的航班')
    #                     pass
    #                 else:
    #                     raise Exception('时间差错误：临时列表时间先于外层遍历')

    #         for item in content:
    #             if timeRange[0] <= item['start'] <= timeRange[1]:
    #                 results.append(item['tup'])
    #         del content
    #     # print('final tuples: ')
    #     # print('row, True, False')
    #     # rownames = ['delay', 'd15', 'd30', 'd45', 'd60']

    #     # cnts = [0]*5  # True 计数
    #     # for r in results:
    #     #     for idx, col in enumerate(r):
    #     #         if col:
    #     #             cnts[idx] += 1
    #     # for i in range(len(cnts)):
    #     #     print(rownames[i], cnts[i], len(results)-cnts[i])

    #     return results

    # def getProbFactors(self, delayData):
    #     from .bn import getProbFactors, model2network, bn_fit, tupls2RDataframe, displayFitted
    #     nodes = ['D', 'D15', 'D30', 'D45', 'D60']
    #     model = "[{n2}][{n3}][{n4}][{n5}][{n1}|{n2}:{n3}:{n4}:{n5}]".format(
    #         n1=nodes[0], n2=nodes[1], n3=nodes[2], n4=nodes[3], n5=nodes[4])
    #     network = model2network(model)

    #     id_targetNode = 0
    #     id_factorNodes = (1, 2, 3, 4)

    #     targetNode = nodes[id_targetNode]
    #     factorNodes = [nodes[i] for i in id_factorNodes]

    #     dataBN = self.collectDataForBNTest(delayData)
    #     df_delay = tupls2RDataframe(dataBN, nodes)
    #     fitted = bn_fit(network, df_delay)
    #     displayFitted(fitted)
    #     probFactors = getProbFactors(fitted, targetNode, factorNodes)
    #     return probFactors

    # def getPeriodProbFactors(self, delayData):
    #     """
    #     分别计算0~10, 0~20, 0~30天,... 10天递增航班数据中各要素对当前航班延误影响
    #     return: 长度为天数分段数的列表，每元素是列表，代表各个因素的概率值
    #     """
    #     from .bn import getProbFactors, model2network, bn_fit, tupls2RDataframe
    #     from copy import deepcopy

    #     nodes = ['D', 'D15', 'D30', 'D45', 'D60']
    #     model = "[{n2}][{n3}][{n4}][{n5}][{n1}|{n2}:{n3}:{n4}:{n5}]".format(
    #         n1=nodes[0], n2=nodes[1], n3=nodes[2], n4=nodes[3], n5=nodes[4])

    #     network = model2network(model)

    #     delayData.sort(key=lambda x: x['dateFlight'])    # 日期升序
    #     window_days = [i*10 for i in range(1, 10)]

    #     id_targetNode = 0
    #     id_factorNodes = (1, 2, 3, 4)

    #     targetNode = nodes[id_targetNode]
    #     factorNodes = [nodes[i] for i in id_factorNodes]
    #     result = []
    #     for d in window_days:
    #         window_delay_data = deepcopy(delayData[:d])
    #         delay_tuples = self.collectDataForBNTest(window_delay_data)
    #         df_delay = tupls2RDataframe(delay_tuples, nodes)
    #         fitted = bn_fit(network, df_delay)
    #         result.append(getProbFactors(fitted, targetNode, factorNodes))
    #     return result

    # ==================== BN new

    # [0,0.25), [0.25, 0.50), [0.50,0.75), [0.75,1.0]
    # 0,1,2,3
    def segProb(self, p):
        val = int(p * 4)
        return 3 if val == 4 else val

    def segVisi(self, v):
        """能见度分段"""
        if v < 800:
            return '0'
        elif v < 2000:
            return '1'
        elif v < 5000:
            return '2'
        else:
            return '3'

    def segDelay(self, d):
        if d < 900:
            return '0'
        elif d < 30 * 60:
            return '1'
        elif d < 60 * 60:
            return '2'
        elif d < 120 * 60:
            return '3'
        else:
            return '4'

    def segDelayDelta(self, d):
        if d >= 0:
            if d < 900:
                return '0'
            elif d < 1800:
                return '1'
            elif d < 3600:
                return '2'
            else:
                return '3'
        else:
            if d > -900:
                return '-0'
            elif d > -1800:
                return '-1'
            elif d > -3600:
                return '-2'
            else:
                return '-3'

    def collectDataForBN(self, airport):
        timeStart, timeEnd = 8, 22
        dataAll = self.getDelayData(airport, None)
        factors = ('isFlightDelay', 'tDelay', 'wthTakeDep', 'wthLandDep', 'preDelayDelta',
                   'rate_d15', 'rate_d30', 'rate_d60', 'rate_w15', 'rate_w30', 'rate_w60')
        results = []

        for dataDay in dataAll:
            airport = dataDay['airport']
            dateFlight = dataDay['dateFlight']
            content = dataDay['content']

            # 在时间段内，有天气数据
            content = filter(lambda x: timeStart <= x['schedH'] < timeEnd
                                       and x['wthTakeDep'] and x['wthLandDep'], content)
            content = list(content)

            for i, r in enumerate(content):
                # 计算率
                content[i]['rate_d15'] = r['cnt_d15'] / \
                                         r['cnt_p15'] if r['cnt_p15'] else 0
                content[i]['rate_d30'] = r['cnt_d30'] / \
                                         r['cnt_p30'] if r['cnt_p30'] else 0
                content[i]['rate_d60'] = r['cnt_d60'] / \
                                         r['cnt_p60'] if r['cnt_p60'] else 0
                content[i]['rate_w15'] = r['cnt_w15'] / \
                                         r['cnt_d15'] if r['cnt_d15'] else 0
                content[i]['rate_w30'] = r['cnt_w30'] / \
                                         r['cnt_d30'] if r['cnt_d30'] else 0
                content[i]['rate_w60'] = r['cnt_w60'] / \
                                         r['cnt_d60'] if r['cnt_d60'] else 0

                # 起飞延误时长等级
                f = factors[1]
                content[i][f] = self.segDelay(content[i][f])
                # 起飞时双端机场能见度等级
                for f in factors[2:4]:
                    content[i][f] = self.segVisi(content[i][f])
                # 前序机场延误时间差等级
                f = factors[4]
                content[i][f] = self.segDelayDelta(content[i][f])
                # 本端机场各率等级
                for f in factors[5:]:
                    content[i][f] = self.segProb(content[i][f])

                # del content[i]['cnt_d15']
                # del content[i]['cnt_d30']
                # del content[i]['cnt_d60']
                # del content[i]['cnt_p15']
                # del content[i]['cnt_p30']
                # del content[i]['cnt_p60']
                # del content[i]['cnt_w15']
                # del content[i]['cnt_w30']
                # del content[i]['cnt_w60']

                content[i]['isFlightDelay'] = 't' if r['isFlightDelay'] else 'f'

                # 按顺序添加bn数据字段，替换原始数据，这样content是列表的列表
                _new = []
                for key in factors:
                    _new.append(content[i][key])
                content[i] = _new

            results.append({'date': dateFlight, 'data': content})
        return results

    def prepareEvent(self, nodes):
        # 准备events，这里顺序按照node顺序来, bn模块返回对应顺序的概率值
        events = []

        # 起飞延误等级
        delayLevels = range(1, 5)
        for l in delayLevels:
            events.append('{}=="{}"'.format(nodes[1], l))

        # 能见度级别event
        wthLevels = range(4)
        for nodeWth in nodes[2:4]:
            for l in wthLevels:
                events.append('{}=="{}"'.format(nodeWth, l))

        # 前序航班延误差等级
        for l in ['-3', '-2', '-1', '-0', '0', '1', '2', '3']:
            events.append('{}=="{}"'.format(nodes[4], l))

        # 概率等级evevt
        probLevels = range(10)
        for nodeRate in nodes[5:]:
            for l in probLevels:
                events.append('{}=="{}"'.format(nodeRate, l))
        return events

    def getProbs(self, data, model, nodes):
        from .bn import fitModel, getProbFactors
        fitted = fitModel(data, model, nodes)

        evidence = '{}=="t"'.format(nodes[0])
        events = self.prepareEvent(nodes)
        probs = getProbFactors(fitted, events, evidence)
        print(len(probs))

        # sizeFactors = [4, 4, 4, 8, 10, 10, 10, 10, 10, 10]
        sizeFactors = [4, 4, 4, 8, 4, 4, 4, 4, 4, 4]
        print(sum(sizeFactors))

        startFactors = [0]
        for i in range(1, len(sizeFactors)):
            startFactors.append(startFactors[i - 1] + sizeFactors[i - 1])

        _probs = {}
        for i in range(len(startFactors)):
            _probs[nodes[i + 1]] = probs[startFactors[i]
                                         :startFactors[i] + sizeFactors[i]]
        return _probs

    def getPorbsAirport(self, airport):
        url = os.path.join(self.root_path, 'static', 'data', 'bnprobs.json')
        with open(url, 'r')as f:
            data = json.load(f)

        probs = data.get(airport, None)
        return probs

    def getProbsVisiUnder(self, airport):
        url = os.path.join(self.root_path, 'static', 'data',
                           'probsVisiUnder.json')
        with open(url, 'r')as f:
            data = json.load(f)
        probsVis = data.get(airport, None)
        return probsVis

    def entropyProbs(self, probsPeriod):
        # 3个时间段的延误率分布信息熵
        for node in self.bnNodes[-6:-3]:
            probsPeriod[node] = infoEntropy(probsPeriod[node])

        # 3个时间段的天气影响率分布相对熵
        kbEntropies = []
        nodesWth = self.bnNodes[-3:]
        kbEntropies.append(
            kullback(probsPeriod[nodesWth[0]], probsPeriod[nodesWth[1]]))
        kbEntropies.append(
            kullback(probsPeriod[nodesWth[1]], probsPeriod[nodesWth[2]]))
        kbEntropies.append(
            kullback(probsPeriod[nodesWth[2]], probsPeriod[nodesWth[0]]))

        for i, node in enumerate(nodesWth):
            probsPeriod[node] = kbEntropies[i]

        return probsPeriod
