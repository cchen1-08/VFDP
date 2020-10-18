import os
from math import radians, cos, sin, asin, sqrt, atan, tan, acos,log2


def haversine(latlng1, latlng2):  # 经度1，纬度1，经度2，纬度2 （十进制度数）
    """ 
    Calculate the great circle distance between two points  
    on the earth (specified in decimal degrees) 
    """
    latA, lonA = latlng1
    latB, lonB = latlng2

    ra = 6378140  # radius of equator: meter
    rb = 6356755  # radius of polar: meter
    flatten = (ra - rb) / ra  # Partial rate of the earth
    # change angle to radians
    radLatA = radians(latA)
    radLonA = radians(lonA)
    radLatB = radians(latB)
    radLonB = radians(lonB)

    pA = atan(rb / ra * tan(radLatA))
    pB = atan(rb / ra * tan(radLatB))
    x = acos(sin(pA) * sin(pB) + cos(pA) * cos(pB) * cos(radLonA - radLonB))
    c1 = (sin(x) - x) * (sin(pA) + sin(pB))**2 / cos(x / 2)**2
    c2 = (sin(x) + x) * (sin(pA) - sin(pB))**2 / sin(x / 2)**2
    dr = flatten / 8 * (c1 - c2)
    distance = ra * (x + dr)
    return distance


def files(root):
    for cur_path, child_folders, child_files in os.walk(root, topdown=False):
        for filename in child_files:
            yield os.path.join(cur_path, filename)


def child_files(root):
    for name in os.listdir(root):
        name = os.path.join(root, name)
        if os.path.isfile(name):
            yield name


def child_folders(root):
    for name in os.listdir(root):
        name = os.path.join(root, name)
        if os.path.isdir(name):
            yield name


def kullback(p, q):
    s = 0
    if len(p) != len(q):
        return None
    for i, ep in enumerate(p):
        ep = 10e-10 if ep == 0 else ep
        eq = q[i]
        eq = 10e-10 if eq == 0 else eq
        s += ep*log2(ep/eq)
    return s


def infoEntropy(p):
    s = 0
    for e in p:
        if not e:
            e = 10e-10
        s += -e*log2(e)
    return s
