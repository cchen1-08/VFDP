/*
 * @Author: Dawn, dawn.chli@gmail.com
 * @Date:   2017-05-11 16:55:40
 * @Last Modified by:   Dawn
 * @Last Modified time: 2017-05-12 17:28:05
 */

// 2018/03/09 为了参数能传到worker中，修改本脚本的参数
'use strict';

function StreamMapManager() {
    let gThat = undefined;

    let imgWidth;
    let imgHeight;
    let imgLength;
    let imgPixelLength;
    let imgSrc;
    let imgDataSrc;
    let imgDataTmp;
    let imgTar;
    let imgDataTar;

    let imgMySrcData;
    let imgMyTarData;

    let optimizedRects = [];
    let mapGradient;

    let tao;
    let lambda;

    let ux;
    let uy;
    let src;
    let temp_s;
    let tar;

    let nx;
    let ny;

    let srcLab;
    let tarLab;

    let grayDataSrc;
    let grayDataTar;

    let isCalSeed = true;
    let streamLineShow = false;
    let isHybridMode = true;

    this.updateMaxDeta = 8;
    this.updateDetaTag = 0;

    let resultUx = [];
    let resultUy = [];
    let averageUx = [];
    let averageUy = [];

    this.getAverageU = function () {
        averageUx = average(resultUx);
        averageUy = average(resultUy);

        return {
            ux: averageUx,
            uy: averageUy
        };
    };

    function average(result) {
        let com = [];
        for (let arrindex = 0; arrindex < result[0].length; arrindex++) {
            let sum = 0;
            for (let index = 0; index < result.length; index++) {
                sum += result[index][arrindex];
            }
            com.push(sum / 3)
        }
        return com
    }


    // this.init = function (w, h, mapCtx0, mapCtx1, mapGrad, mapGrayData0, mapGrayData1) {
    this.init = function (w, h, mapImageData0, mapImageData1, mapGrad, mapGrayData0, mapGrayData1) {
        gThat = this;

        //     imgSrc = mapCtx0;
        //     imgTar = mapCtx1;
        imgSrc = mapImageData0;
        imgTar = mapImageData1;
        mapGradient = mapGrad;
        grayDataSrc = mapGrayData0;
        grayDataTar = mapGrayData1;

        imgWidth = w;
        imgHeight = h;
        imgPixelLength = imgWidth * imgHeight; //获得的是需要计算的像素的总数
        imgLength = imgWidth * imgHeight * 4; //获得的是RGBA的值的数量

        imgMySrcData = new Array(imgLength);
        imgMyTarData = new Array(imgLength);

        gThat.catchDataFromMapContext();

        ux = new Array(imgPixelLength);
        uy = new Array(imgPixelLength);
        src = new Array(imgPixelLength);
        tar = new Array(imgPixelLength);
        resultUx = [];
        resultUy = [];

        srcLab = new Array(imgPixelLength);
        tarLab = new Array(imgPixelLength);

        nx = imgWidth;
        ny = imgHeight;

        // Morphing Algorithm Init
        tao = 0.2;
        lambda = 0.4;
    };

    this.update = function () {
        //if ( this.updateDetaTag <= this.updateMaxDeta ) {
        let itVal = this.updateDetaTag % this.updateMaxDeta;
        // console.log(itVal)
        this.smoothMorphing(itVal);
        this.updateDetaTag++;
        //};
    };

    this.catchDataFromMapContext = function () {
        // imgDataSrc = imgSrc.getImageData(0, 0, imgWidth, imgHeight);
        // imgDataTar = imgTar.getImageData(0, 0, imgWidth, imgHeight);
        imgDataSrc = imgSrc;
        imgDataTar = imgTar;

        for (let i = 0; i < imgLength; i++) {
            imgMySrcData[i] = imgDataSrc.data[i];
            imgMyTarData[i] = imgDataTar.data[i];
        }
    };

    this.smoothMorphing = function (itVal) {
        if (itVal === 0) {
            // For partly linear blending
            // imgDataTmp = imgSrc.getImageData(0, 0, imgWidth, imgHeight);
            imgDataTmp = imgSrc;

            for (let i = 0; i < imgPixelLength; i++) {
                ux[i] = 0;
                uy[i] = 0;
                src[i] = grayDataSrc[i] / 255.0;
                tar[i] = grayDataTar[i] / 255.0;
            }

            // Cal seed
            if (isCalSeed) {
                this.SeedForSrcAndTar();
            }

            temp_s = src;
        }

        var curItCnt = itVal;
        // console.log(curItCnt)
        itVal = itVal / this.updateMaxDeta;
        console.log("curItl=" + itVal);

        optimizedRects = new Array(1);
        optimizedRects[0] = new MyRectangle();
        optimizedRects[0].init(0, 0, imgWidth, imgHeight);

        var rsGradientX = MatlabFuncUtility.GradientRectanglesX(temp_s, nx, ny, optimizedRects);
        var rsGradientY = MatlabFuncUtility.GradientRectanglesY(temp_s, nx, ny, optimizedRects);

        var kx = new Array(tar.length);
        var ky = new Array(tar.length);
        var tmp, index_k;
        for (let k = 0; k < optimizedRects.length; k++) {
            for (let j = optimizedRects[k].x1; j < optimizedRects[k].x2; j++) {
                for (let i = optimizedRects[k].y1; i < optimizedRects[k].y2; i++) {
                    index_k = i * nx + j;
                    tmp = (tar[index_k] - temp_s[index_k]) / (rsGradientX[index_k] * rsGradientX[index_k] + rsGradientY[index_k] * rsGradientY[index_k] + lambda);
                    kx[index_k] = tmp * rsGradientX[index_k];
                    ky[index_k] = tmp * rsGradientY[index_k];
                }
            }
        }

        var arrowCnt = 0;
        var lineCount = 0;
        for (let k = 0; k < optimizedRects.length; k++) {
            var arrowTagArr = new Array(optimizedRects[k].y2);
            for (let arrIndexY = 0; arrIndexY < arrowTagArr.length; arrIndexY++) {
                arrowTagArr[arrIndexY] = new Array(optimizedRects[k].x2);
                for (let arrIndexX = 0; arrIndexX < arrowTagArr[arrIndexY].length; arrIndexX++) {
                    arrowTagArr[arrIndexY][arrIndexX] = 0;
                }
            }

            var isIncre = false;
            var isEnhanced = true;
            for (let j = optimizedRects[k].x1; j < optimizedRects[k].x2; j++) {
                for (let i = optimizedRects[k].y1; i < optimizedRects[k].y2; i++) {
                    index_k = i * nx + j;
                    ux[index_k] = ux[index_k] + kx[index_k];
                    uy[index_k] = uy[index_k] + ky[index_k];
                }
            }
        }
        resultUx.push(ux);
        resultUy.push(uy);
        temp_s = MatlabFuncUtility.MovePixelsRectanglesEx(temp_s, nx, ny, ux, uy, optimizedRects);

        var newValue = 0;
        for (var i = 0; i < imgPixelLength; i++) {
            if (isHybridMode == true) {
                var psi = 0.6;
                var param = Math.pow(itVal, psi);
                newValue = Math.floor((temp_s[i] * (1 - param) + tar[i] * param) * 255.0);
            } else {
                newValue = Math.floor(temp_s[i] * 255.0);
            }

            // Color
            imgDataTmp.data[i * 4] = mapGradient[newValue * 4];
            imgDataTmp.data[i * 4 + 1] = mapGradient[newValue * 4 + 1];
            imgDataTmp.data[i * 4 + 2] = mapGradient[newValue * 4 + 2];
            imgDataTmp.data[i * 4 + 3] = imgMySrcData[i * 4 + 3] * (1 - itVal) + imgMyTarData[i * 4 + 3] * itVal;

            // Gray
            // imgDataTmp.data[i*4+0] = newValue;
            // imgDataTmp.data[i*4+1] = newValue;
            // imgDataTmp.data[i*4+2] = newValue;
            // imgDataTmp.data[i*4+3] = 255.0;
        }

        // Test For Labeling
        // for( var i=0; i<imgPixelLength ;i++ )
        // {
        //     imgDataTmp.data[i*4+0] = srcLab[i] * 32+125;
        //     imgDataTmp.data[i*4+1] = srcLab[i] * 32+125;
        //     imgDataTmp.data[i*4+2] = srcLab[i] * 32+125;
        //     imgDataTmp.data[i*4+3] = 255.0;
        // }

        // imgSrc.putImageData(imgDataTmp,0,0);

        // Save each sub-frames
        //Canvas2Image.saveAsPNG(heatMap._canvas);
    }

    // Rect were caled in this function
    this.SeedForSrcAndTar = function () {
        var groMinLab = [];
        var groLab = [];
        var labCnt = 0;

        var groMinLabTar = [];
        var groLabTar = [];
        var labCntTar = 0;

        var paramLabelingBlob = {
            width: imgWidth,
            height: imgHeight,
            srcdata: src,
            data: undefined,
            label: srcLab,
            groupMinLab: groMinLab,
            groupLab: groLab,
            curLabCnt: labCnt
        };

        // Labeling Blobs for src
        LabelingBlobs(paramLabelingBlob);

        var paramLabelingBlobTar = {
            width: imgWidth,
            height: imgHeight,
            srcdata: tar,
            data: undefined,
            label: tarLab,
            groupMinLab: groMinLabTar,
            groupLab: groLabTar,
            curLabCnt: labCntTar
        };

        LabelingBlobs(paramLabelingBlobTar);

        //
        var finalGroupSrcCnt = 0;
        var finalGroupTarCnt = 0;

        for (var i = 0; i < paramLabelingBlob.groupMinLab.length; i++) {
            if ((paramLabelingBlob.groupMinLab[i] + 1) > finalGroupSrcCnt) {
                finalGroupSrcCnt = (paramLabelingBlob.groupMinLab[i] + 1);
            }
        }

        for (var i = 0; i < paramLabelingBlobTar.groupMinLab.length; i++) {
            if ((paramLabelingBlobTar.groupMinLab[i] + 1) > finalGroupTarCnt) {
                finalGroupTarCnt = (paramLabelingBlobTar.groupMinLab[i] + 1);
            }
        }

        // 0: index
        // 1: highest density value
        // 2: sum density value
        // 3: minx
        // 4: maxx
        // 5: miny
        // 6: maxy
        var highestPixelInfoSrc = new Array(finalGroupSrcCnt * 8);
        var highestPixelInfoTar = new Array(finalGroupTarCnt * 8);

        // First: Index; Second: Value
        for (var i = 0; i < finalGroupSrcCnt; i++) {
            highestPixelInfoSrc[i * 8 + 0] = 0;
            highestPixelInfoSrc[i * 8 + 1] = 0;
            highestPixelInfoSrc[i * 8 + 2] = 0;
            highestPixelInfoSrc[i * 8 + 3] = imgWidth;
            highestPixelInfoSrc[i * 8 + 4] = 0;
            highestPixelInfoSrc[i * 8 + 5] = imgHeight;
            highestPixelInfoSrc[i * 8 + 6] = 0;
            highestPixelInfoSrc[i * 8 + 7] = undefined;
        }

        for (var i = 0; i < finalGroupTarCnt; i++) {
            highestPixelInfoTar[i * 8 + 0] = 0;
            highestPixelInfoTar[i * 8 + 1] = 0;
            highestPixelInfoTar[i * 8 + 2] = 0;
            highestPixelInfoTar[i * 8 + 3] = imgWidth;
            highestPixelInfoTar[i * 8 + 4] = 0;
            highestPixelInfoTar[i * 8 + 5] = imgHeight;
            highestPixelInfoTar[i * 8 + 6] = 0;
            highestPixelInfoTar[i * 8 + 7] = undefined;

        }

        var index = 0;
        for (var i = 0; i < imgHeight; i++)
            for (var j = 0; j < imgWidth; j++) {
                if (paramLabelingBlob.label[index] >= 0) {
                    if (j < highestPixelInfoSrc[paramLabelingBlob.label[index] * 8 + 3])
                        highestPixelInfoSrc[paramLabelingBlob.label[index] * 8 + 3] = j;
                    if (j > highestPixelInfoSrc[paramLabelingBlob.label[index] * 8 + 4])
                        highestPixelInfoSrc[paramLabelingBlob.label[index] * 8 + 4] = j;
                    if (i < highestPixelInfoSrc[paramLabelingBlob.label[index] * 8 + 5])
                        highestPixelInfoSrc[paramLabelingBlob.label[index] * 8 + 5] = i;
                    if (i > highestPixelInfoSrc[paramLabelingBlob.label[index] * 8 + 6])
                        highestPixelInfoSrc[paramLabelingBlob.label[index] * 8 + 6] = i;

                    if (highestPixelInfoSrc[paramLabelingBlob.label[index] * 8 + 1] < src[index]) {
                        highestPixelInfoSrc[paramLabelingBlob.label[index] * 8 + 0] = index;
                        highestPixelInfoSrc[paramLabelingBlob.label[index] * 8 + 1] = src[index];
                    }

                    if (src[index] > 0.4)
                        highestPixelInfoSrc[paramLabelingBlob.label[index] * 8 + 2] += 1; //src[index];
                }

                if (paramLabelingBlobTar.label[index] >= 0) {
                    if (j < highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 3])
                        highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 3] = j;
                    if (j > highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 4])
                        highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 4] = j;
                    if (i < highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 5])
                        highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 5] = i;
                    if (i > highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 6])
                        highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 6] = i;

                    if (highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 1] < tar[index]) {
                        highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 0] = index;
                        highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 1] = tar[index];
                    }

                    if (tar[index] > 0.4)
                        highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 2] += 1; //tar[index];
                }
                index++;
            }

        // Highest pixels from src to tar
        for (let i = 0; i < finalGroupSrcCnt; i++) {
            tar[highestPixelInfoSrc[i * 8]] = highestPixelInfoSrc[i * 8 + 1];
        }

        // Highest pixels from tar to src
        for (let i = 0; i < finalGroupTarCnt; i++) {
            src[highestPixelInfoTar[i * 8]] = highestPixelInfoTar[i * 8 + 1];
        }
    }
}