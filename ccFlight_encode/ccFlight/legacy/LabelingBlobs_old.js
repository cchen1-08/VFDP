/*
 * @Author: Dawn, dawn.chli@gmail.com
 * @Date:   2017-05-10 21:48:19
 * @Last Modified by:   Dawn
 * @Last Modified time: 2017-05-12 17:28:04
 */

// 2018/03/09 陈骏杰 因为把SteamMapManager.js放在worker中运行，且其调用本脚本的本方法，
// 不能在worker中访问到window全局对象
// 将本脚本完全暴露到WorkerGenHeatMapField.js

// (function () {

var souroundIndex;

// Following the code in http://www.cnblogs.com/ronny/p/img_aly_01.html
// Matlab: bwlabel
function InitLabeling(imgData) {
    souroundIndex = new Array(10);
    souroundIndex[0] = -1;
    souroundIndex[1] = 0;
    souroundIndex[2] = 0;
    souroundIndex[3] = -1;
    souroundIndex[4] = +1;
    souroundIndex[5] = 0;
    souroundIndex[6] = 0;
    souroundIndex[7] = +1;
    souroundIndex[8] = 0;
    souroundIndex[9] = 0;

    imgData.data = new Array(imgData.srcdata.length);
    imgData.groupLab = new Array(0);

    for (let i = 0; i < imgData.srcdata.length; i++) {
        if (imgData.srcdata[i] > 0.45)
            imgData.data[i] = 1;
        else
            imgData.data[i] = 0;
        imgData.label[i] = -1;
    }
}

function BoundaryCheck(imgData, x, y) {
    return !(x < 0 || x >= imgData.width || y < 0 || y >= imgData.height)
}

function SurroundSumVal(imgData, idx, idy) {
    let sumVal = 0;
    for (let i = 0; i < 4; i++) {
        var newIdx = idx + souroundIndex[i * 2 + 0];
        var newIdy = idy + souroundIndex[i * 2 + 1];
        var newIndex = newIdy * imgData.width + newIdx;
        if (BoundaryCheck(imgData, newIdx, newIdy)) {
            if (imgData.label[newIndex] >= 0) {
                sumVal++;
            }
        }
    }
    return sumVal
}

function SurroundMinVal(imgData, idx, idy) {
    var minLabVal = 9999999;
    for (var i = 0; i < 4; i++) {
        var newIdx = idx + souroundIndex[i * 2 + 0];
        var newIdy = idy + souroundIndex[i * 2 + 1];
        var newIndex = newIdy * imgData.width + newIdx;
        if (BoundaryCheck(imgData, newIdx, newIdy)) {
            if (imgData.label[newIndex] >= 0 && imgData.label[newIndex] < minLabVal) {
                minLabVal = imgData.label[newIndex];
            }
        }
    }
    return minLabVal
}

function HasEleInVector(groupVec, ele) {
    for (let i = 0; i < groupVec.length; i++) {
        if (groupVec[i] == ele)
            return true;
    }
    return false
}

function SurroundNewEquivalence(imgData, labVal, idx, idy) {
    var groupVec = imgData.groupLab[labVal];

    for (let i = 0; i < 5; i++) {
        var newIdx = idx + souroundIndex[i * 2 + 0];
        var newIdy = idy + souroundIndex[i * 2 + 1];
        var newIndex = newIdy * imgData.width + newIdx;
        if (BoundaryCheck(imgData, newIdx, newIdy)) {
            if (imgData.label[newIndex] >= 0) {
                if (!HasEleInVector(groupVec, imgData.label[newIndex])) {
                    groupVec.push(imgData.label[newIndex]);
                }

                var neiGroupVec = imgData.groupLab[imgData.label[newIndex]];
                if (!HasEleInVector(neiGroupVec, labVal)) {
                    neiGroupVec.push(labVal);
                }
            }
        }
    }
}

function FirstPass(imgData) {
    var index = 0;
    for (var i = 0; i < imgData.height; i++) {
        for (var j = 0; j < imgData.width; j++) {
            if (imgData.data[index] > 0) {
                if (SurroundSumVal(imgData, j, i) == 0) {
                    var newVec = new Array(0);
                    imgData.groupLab.push(newVec);

                    imgData.label[index] = imgData.curLabCnt;
                    imgData.curLabCnt++;
                } else {
                    imgData.label[index] = SurroundMinVal(imgData, j, i);
                }

                SurroundNewEquivalence(imgData, imgData.label[index], j, i);
            }
            index++;
        }
    }
}

function SecondPass(imgData) {
    imgData.groupMinLab = new Array(imgData.curLabCnt);
    for (var i = 0; i < imgData.groupMinLab.length; i++) {
        imgData.groupMinLab[i] = -1;
    }

    var index = 0;
    for (var i = 0; i < imgData.groupLab.length; i++) {
        for (var j = 0; j < imgData.groupLab[i].length; j++) {
            var subItem = imgData.groupLab[i][j];
            if (imgData.groupMinLab[subItem] != -1 && imgData.groupMinLab[subItem] < i) {
                imgData.groupMinLab[i] = imgData.groupMinLab[subItem];
            }
        }

        if (imgData.groupMinLab[i] == -1) {
            imgData.groupMinLab[i] = i;
        }
    }

    index = 0;
    for (var i = 0; i < imgData.height; i++) {
        for (var j = 0; j < imgData.width; j++) {
            if (imgData.label[index] >= 0) {
                imgData.label[index] = imgData.groupMinLab[imgData.label[index]];
            }
            index++;
        }
    }


}

function PrintData(imgData) {
    console.log("---------------------------------------");
    var index = 0;
    for (var i = 0; i < imgData.height; i++) {
        var strPerLine = "";
        for (var j = 0; j < imgData.width; j++) {
            strPerLine += imgData.data[index] + "\t";
            index++;
        }
        console.log(strPerLine);
    }
}

function PrintLabel(imgData) {
    console.log("========================================");
    var index = 0;
    for (var i = 0; i < imgData.height; i++) {
        var strPerLine = "";
        for (var j = 0; j < imgData.width; j++) {
            strPerLine += imgData.label[index] + "\t";
            index++;
        }
        console.log(strPerLine);
        console.log("----------------------------------------");
    }
}


// 2018/03/09 陈骏杰
function LabelingBlobs(imgData) {
    InitLabeling(imgData);
    //PrintData(imgData);
    FirstPass(imgData);
    SecondPass(imgData);
    //PrintLabel(imgData);
}

// Public API.
// window.LabelingBlobs = LabelingBlobs;

// }).call(this);