// 2018/03/09 陈骏杰 创建
// 从main script 接收热力图数据，调用计算热力图变化场的方法，返回场
importScripts('StreamMapManager_new.js', 'Common/LabelingBlobs.js', 'Common/MatlabFuncUtility.js')

// 接收到输入后计算，计算完发送结果回main script
onmessage = function (e) {
    this.console.log('Worker: input data received from main script.');

    let widthMap = e.data.widthMap,
        heightMap = e.data.heightMap,
        mapImageData0 = e.data.mapImageData0,
        mapImageData1 = e.data.mapImageData1,
        mapGradient = e.data.mapGradient,
        mapGrayData0 = e.data.mapGrayData0,
        mapGrayData1 = e.data.mapGrayData1;

    let streamMapMgr = new StreamMapManager_new(widthMap, heightMap, mapImageData0, mapImageData1, mapGradient, mapGrayData0, mapGrayData1);

    // ====================
    // 耗时操作
    let field;
    for (let index = 0; index < streamMapMgr.updateMaxDeta; index++) {
        streamMapMgr.update();
        if (index === streamMapMgr.updateMaxDeta - 1) {
            field = streamMapMgr.getAverageU();
        }
    }
    // ====================

    postMessage({
        field: field
    });
}