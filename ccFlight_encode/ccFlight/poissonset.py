import json
import numpy as np
import math


def distance(pt1, pt2):
    vector1 = np.mat(pt1)
    vector2 = np.mat(pt2)
    return math.sqrt((vector1 - vector2) * (vector1 - vector2).T)


def getRelatedPos(pathPoisson):
    with open(pathPoisson, 'r', encoding='utf-8') as f:
        data = json.load(f)

    pts = [[0, 0, 0], ]
    ptCenter = (480, 250)
    for pt in data:
        pt = (pt['cx'], pt['cy'])
        dist = distance(ptCenter, pt)
        pts.append([round(pt[0] - ptCenter[0], 3),
                    round(pt[1] - ptCenter[1], 3), dist])
    pts.sort(key=lambda x: x[2])
    for pt in pts:
        pt[2] = round(pt[2], 3)
    return pts


# 目前在FlightFilesController.py中实现，因为和数据结构耦合比较大，且需要原地修改数据
def poissonProcess(ori_data, relate_pos):
    """ori_data: list, 每个元素是字典, 有cx,cy,val 三个字段"""
    ori_data.sort(key=lambda x: (x['cx'], x['val']))
    count = 0
    # 计数有多少个属于同一类，然后依次加泊松值
    ty = 0
    # 统计有多少类
    for i in range(len(ori_data) - 1):
        if ori_data[i]["cx"] == ori_data[i + 1]["cx"]:
            ori_data[i]["cx"] = round(
                ori_data[i]["cx"] + relate_pos[count][0] * 0.05, 3)
            ori_data[i]["cy"] = round(
                ori_data[i]["cy"] + relate_pos[count][1] * 0.05, 3)
            count += 1
        else:
            ori_data[i]["cx"] = round(
                ori_data[i]["cx"] + relate_pos[count][0] * 0.05, 3)
            ori_data[i]["cy"] = round(
                ori_data[i]["cy"] + relate_pos[count][1] * 0.05, 3)
            count = 0
            ty += 1
    return ori_data


if __name__ == '__main__':
    relate_pos = getRelatedPos('/poissonset.json')
    pathFlight = ''
    with open(pathFlight, 'r') as f:
        dataFlight = json.load(f)
    flightPoissoneted = poissonProcess(dataFlight, relate_pos)
    pathOpt = ''
    with open(pathOpt, 'w')as f:
        json.dump(flightPoissoneted, f)

        # for i in range(len(flight)-1):
        #     if(flight[i]["cx"]==flight[i+1]["cx"]):
        #         flight[i]["cx"] = flight[i]["cx"] + relate_pos[count][0]*0.05
        #         flight[i]["cy"] = flight[i]["cy"] + relate_pos[count][1]*0.05
        #         count += 1
        #     else:
        #         flight[i]["cx"] = flight[i]["cx"] + relate_pos[count][0]*0.05
        #         flight[i]["cy"] = flight[i]["cy"] + relate_pos[count][1]*0.05
        #         count = 0
        #         ty += 1
        # fl = open('dep_zsss.json', 'w')
        # fl.write((json.dumps(flight, ensure_ascii=False)))
        # fl.close()
