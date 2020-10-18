import json
import datetime
import os
import re


def readFlightFile(file):
    try:
        f = open(file, 'r', encoding='utf-8')
        data = f.read().strip()
        f.close()
    except UnicodeDecodeError:
        print('UnicodeDecodeError: utf-8 fail, now trying latin')
        f = open(file, 'r', encoding='latin')
        data = f.read().strip()
        f.close()

    data = data[data.index('{'):-1]
    data = json.loads(data)
    return data


def writeJson(file, data):
    with open(file, 'w', encoding='utf-8')as f:
        json.dump(data, f)


class FlightDataParser:
    def __init__(self, coverSave=False):
        # coverSave 重新处理并覆盖已经存在的结果文件
        self.coverSave = coverSave

    @staticmethod
    def trantime(timeStamp):
        curhour = int(datetime.datetime.fromtimestamp(
            timeStamp).strftime("%H"))
        curmin = round(int(datetime.datetime.fromtimestamp(
            timeStamp).strftime("%M")) / 60, 3)
        cursec = round(int(datetime.datetime.fromtimestamp(
            timeStamp).strftime("%S")) / 60, 3)

        return curhour + curmin + cursec

    @staticmethod
    def datesearch(timeStamp):
        return datetime.datetime.fromtimestamp(timeStamp).strftime("%m-%d")

    def processDateFolder(self, flightType, folder):
        print('=' * 4 + 'FlightType: {}, Date: {}'.format(flightType,
                                                          os.path.split(folder)[-1]))

        checker = re.compile(r'^(\d{4})(\d{2})(\d{2})$')
        m = checker.match(os.path.split(folder)[-1])
        target_date = '{}-{}'.format(m[2], m[3])

        files = os.listdir(folder)
        data = []
        for file in files:
            # file: 航班txt
            print('Flight: {}'.format(file))
            filePath = os.path.join(folder, file)
            try:
                data.append(self.delaycal(filePath, target_date, flightType))
            except Exception:
                pass

        return data

    def processFlightTypeFolder(self, flightType, folderSrc, folderRes):
        # 处理离港或到港文件夹
        # print('=' * 8 + 'type: DEP')
        print('=' * 8 + 'type: {}'.format(flightType))

        checker = re.compile(r'^20\d{6}$')

        foldersDate = os.listdir(folderSrc)
        for folder in foldersDate:
            if not checker.match(folder):
                continue

            # folder: 日期文件夹
            folderPath = os.path.join(folderSrc, folder)
            pathSave = os.path.join(folderRes, folder) + '.json'

            # 跳过已经有结果日期输出文件的日期文件夹
            if not self.coverSave and os.path.isfile(pathSave):
                print(
                    'date folder {} already exist and not coverSave, ignore'.format(folderPath))
                continue

            data = self.processDateFolder(flightType, folderPath)
            writeJson(pathSave, data)

    def processAirportFolder(self, folderAirport):
        print('=' * 12 + 'Airport: {}'.format(folderAirport))

        pathDep = os.path.join(folderAirport, 'DEP')
        pathResult = os.path.join(folderAirport, 'DResult')
        if not os.path.isdir(pathResult):
            os.mkdir(pathResult)
        self.processFlightTypeFolder('dep', pathDep, pathResult)

        pathArr = os.path.join(folderAirport, 'ARR')
        pathResult = os.path.join(folderAirport, 'AResult')
        if not os.path.isdir(pathResult):
            os.mkdir(pathResult)

        self.processFlightTypeFolder('arr', pathArr, pathResult)

    def processAll(self):
        checker = re.compile(r'^[A-Z]{4}$')

        foldersAirport = os.listdir('.')
        for folder in foldersAirport:
            if not checker.match(folder):
                continue
            # folderPath = os.path.join('./', folder)
            folderPath = folder
            self.processAirportFolder(folderPath)

    def processAirport(self, names):
        if names is None:
            self.processAll()
        else:
            if isinstance(names, str):
                names = [names, ]
            for name in names:
                folderPath = name
                if os.path.isdir(folderPath):
                    self.processAirportFolder(folderPath)
                else:
                    print('{} not exist'.format(name))

    def delaycal(self, file, target_date, flightType):
        data = readFlightFile(file)
        flightnum = os.path.splitext(os.path.split(file)[-1])[0]

        t = []
        for key in data['flights']:
            t = data['flights'][key]['activityLog']['flights']
        # print(t)
        for i in range(len(t)):
            if self.datesearch(t[i]['takeoffTimes']['scheduled']) == target_date:
                series = i
                destag = t[series]['destination']['icao']
                despos = t[series]['destination']['coord']
                oritag = t[series]['origin']['icao']
                oripos = t[series]['origin']['coord']
                takeofftime = t[series]['takeoffTimes']
                landtime = t[series]['landingTimes']
                # t[series]['destination']['terminal'] = t[series]['destination'].get(
                #     'terminal', 'unknown')
                # terminal = t[series]['destination']['terminal']
                stime = takeofftime['scheduled']
                atime = takeofftime['actual']
                slime = landtime['scheduled']
                alime = landtime['actual']
                if None in [stime, atime, slime, alime]:
                    pass
                else:
                    tstart = self.trantime(stime)
                    tend = self.trantime(atime)
                    lstart = self.trantime(slime)
                    lend = self.trantime(alime)
                    tdelta = atime - stime
                    ldelta = alime - slime

                    if flightType == 'arr':
                        endpointLoc = oripos
                        endpointTag = oritag
                    elif flightType == 'dep':
                        endpointLoc = despos
                        endpointTag = destag
                    else:
                        raise Exception('flightType not arr or dep : {}'.format(flightType))

                    # return flightnum, despos[0], despos[1], tstart, tdelta, 'dep'
                    # return {'name': flightnum, 'cx': despos[0], 'cy': despos[1], 'start': tstart, 'delay': tdelta,'target':target,'fc': 'dep'}
                    # return {'name': flightnum, 'cx': oripos[0], 'cy': oripos[1], 'start': tstart, 'lstart': lstart, 'sdelay': tdelta, 'ldelay': ldelta,
                    #         'orient': orient, 'fc': 'arr'}
                    return {'name': flightnum,
                            'endpointLoc': endpointLoc, 'endpointTag': endpointTag,
                            'tStart': tstart, 'lStart': lstart, 'tDelay': tdelta, 'lDelay': ldelta,
                            'fc': flightType}
                    # print([tstart, tend, tdelta, ldelta, lstart, lend, despos, oripos, terminal, target])
            else:
                pass


if __name__ == '__main__':
    parser = FlightDataParser(coverSave=True)
    parser.processAirport('ZLXY')
