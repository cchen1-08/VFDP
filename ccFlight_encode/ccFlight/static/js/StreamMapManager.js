/*
 * @Author: Dawn, dawn.chli@gmail.com
 * @Date:   2017-05-11 16:55:40
 * @Last Modified by:   Dawn
 * @Last Modified time: 2017-05-12 17:28:05
 */

// 2018/03/09 为了参数能传到worker中，修改本脚本的参数
// 2018/11/18 改成ES6 class
'use strict';

class StreamMapManager {
    constructor(w, h) {
        this.imgWidth = w;
        this.imgHeight = h;
        this.imgPixelLength = w * h;
        this.imgLength = this.imgPixelLength * 4;

        this.imgDataSrc = null;
        this.imgDataTar = null;
        this.mapGradient = null;
        this.grayDataSrc = null;
        this.grayDataTar = null;

        this.imgMySrcData = new Array(this.imgLength);
        this.imgMyTarData = new Array(this.imgLength);

        this.optimizedRects = [];

        this.ux = new Array(this.imgPixelLength);
        this.uy = new Array(this.imgPixelLength);

        this.src = new Array(this.imgPixelLength);
        this.tar = new Array(this.imgPixelLength);

        this.srcLab = new Array(this.imgPixelLength);
        this.tarLab = new Array(this.imgPixelLength);

        this.imgDataTmp;
        this.temp_s;

        this.nx = w;
        this.ny = h;

        this.isCalSeed = false;
        this.streamLineShow = false;
        this.isHybridMode = true;

        this.updateMaxDeta = 8;
        this.updateDetaTag = 0;

        this.tao = 0.2;
        this.lambda = 0.4;

        this.resultUx = [];
        this.resultUy = [];
    }

    initialize(mapImageData0, mapImageData1, mapGrad, mapGrayData0, mapGrayData1) {
        this.imgDataSrc = mapImageData0;
        this.imgDataTar = mapImageData1;
        this.mapGradient = mapGrad;
        this.grayDataSrc = mapGrayData0;
        this.grayDataTar = mapGrayData1;

        for (let i = 0; i < this.imgLength; i++) {
            this.imgMySrcData[i] = this.imgDataSrc.data[i];
            this.imgMyTarData[i] = this.imgDataTar.data[i];
        }

        this.optimizedRects = [];

        this.imgDataTmp = null
        this.temp_s = null;

        this.nx = this.imgWidth;
        this.ny = this.imgHeight;

        this.updateDetaTag = 0;

        this.resultUx = [];
        this.resultUy = [];
    }

    getAverageU() {
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

        return {
            ux: average(this.resultUx),
            uy: average(this.resultUy)
        };
    };

    update() {
        //if ( this.updateDetaTag <= this.updateMaxDeta ) {
        let itVal = this.updateDetaTag % this.updateMaxDeta;
        // console.log(itVal)
        let res = this.smoothMorphing(itVal);
        this.updateDetaTag++;
        return res
        //};
    };

    updateNoImg() {
        let itVal = this.updateDetaTag % this.updateMaxDeta;
        this.smoothMorphingNoImg(itVal);
        this.updateDetaTag++;
    };

    smoothMorphing(itVal) {
        if (itVal === 0) {
            this.imgDataTmp = this.imgDataSrc;
            for (let i = 0; i < this.imgPixelLength; i++) {
                this.ux[i] = 0;
                this.uy[i] = 0;
                this.src[i] = this.grayDataSrc[i] / 255;
                this.tar[i] = this.grayDataTar[i] / 255;
            }

            // Cal seed
            if (this.isCalSeed) this.SeedForSrcAndTar();
            this.temp_s = this.src;
        }

        itVal /= this.updateMaxDeta;

        this.optimizedRects = [new MyRectangle()];
        this.optimizedRects[0].init(0, 0, this.imgWidth, this.imgHeight);

        let rsGradientX = MatlabFuncUtility.GradientRectanglesX(this.temp_s, this.nx, this.ny, this.optimizedRects);
        let rsGradientY = MatlabFuncUtility.GradientRectanglesY(this.temp_s, this.nx, this.ny, this.optimizedRects);

        let kx = new Array(this.imgPixelLength);
        let ky = new Array(this.imgPixelLength);
        let tmp, index_k;
        for (let k = 0; k < this.optimizedRects.length; k++) {
            for (let j = this.optimizedRects[k].x1; j < this.optimizedRects[k].x2; j++) {
                for (let i = this.optimizedRects[k].y1; i < this.optimizedRects[k].y2; i++) {
                    index_k = i * this.nx + j;
                    tmp = (this.tar[index_k] - this.temp_s[index_k]) / (rsGradientX[index_k] * rsGradientX[index_k] + rsGradientY[index_k] * rsGradientY[index_k] + this.lambda);
                    kx[index_k] = tmp * rsGradientX[index_k];
                    ky[index_k] = tmp * rsGradientY[index_k];
                }
            }
        }

        for (let k = 0; k < this.optimizedRects.length; k++) {
            let arrowTagArr = new Array(this.optimizedRects[k].y2);
            for (let arrIndexY = 0; arrIndexY < arrowTagArr.length; arrIndexY++) {
                arrowTagArr[arrIndexY] = new Array(this.optimizedRects[k].x2);
                for (let arrIndexX = 0; arrIndexX < arrowTagArr[arrIndexY].length; arrIndexX++) {
                    arrowTagArr[arrIndexY][arrIndexX] = 0;
                }
            }

            for (let j = this.optimizedRects[k].x1; j < this.optimizedRects[k].x2; j++) {
                for (let i = this.optimizedRects[k].y1; i < this.optimizedRects[k].y2; i++) {
                    index_k = i * this.nx + j;
                    this.ux[index_k] += kx[index_k];
                    this.uy[index_k] += ky[index_k];
                }
            }
        }
        this.temp_s = MatlabFuncUtility.MovePixelsRectanglesEx(this.temp_s, this.nx, this.ny, this.ux, this.uy, this.optimizedRects);

        let newValue = 0;
        for (let i = 0; i < this.imgPixelLength; i++) {
            if (this.isHybridMode) {
                let psi = 0.6;
                let param = Math.pow(itVal, psi);
                newValue = Math.floor((this.temp_s[i] * (1 - param) + this.tar[i] * param) * 255.0);
            } else {
                newValue = Math.floor(this.temp_s[i] * 255.0);
            }

            // Color
            this.imgDataTmp.data[i * 4] = this.mapGradient[newValue * 4];
            this.imgDataTmp.data[i * 4 + 1] = this.mapGradient[newValue * 4 + 1];
            this.imgDataTmp.data[i * 4 + 2] = this.mapGradient[newValue * 4 + 2];
            this.imgDataTmp.data[i * 4 + 3] = this.imgMySrcData[i * 4 + 3] * (1 - itVal) + this.imgMyTarData[i * 4 + 3] * itVal;
        }
        // imgSrc.putImageData(this.imgDataTmp,0,0);
        return this.imgDataTmp
    };

    smoothMorphingNoImg(itVal) {
        if (itVal === 0) {
            for (let i = 0; i < this.imgPixelLength; i++) {
                this.ux[i] = 0;
                this.uy[i] = 0;
                this.src[i] = this.grayDataSrc[i] / 255;
                this.tar[i] = this.grayDataTar[i] / 255;
            }

            // Cal seed
            if (this.isCalSeed) this.SeedForSrcAndTar();
            this.temp_s = this.src;
        }

        itVal /= this.updateMaxDeta;

        this.optimizedRects = [new MyRectangle()];
        this.optimizedRects[0].init(0, 0, this.imgWidth, this.imgHeight);

        let rsGradientX = MatlabFuncUtility.GradientRectanglesX(this.temp_s, this.nx, this.ny, this.optimizedRects);
        let rsGradientY = MatlabFuncUtility.GradientRectanglesY(this.temp_s, this.nx, this.ny, this.optimizedRects);

        let kx = new Array(this.imgPixelLength);
        let ky = new Array(this.imgPixelLength);
        let tmp, index_k;
        for (let k = 0; k < this.optimizedRects.length; k++) {
            for (let j = this.optimizedRects[k].x1; j < this.optimizedRects[k].x2; j++) {
                for (let i = this.optimizedRects[k].y1; i < this.optimizedRects[k].y2; i++) {
                    index_k = i * this.nx + j;
                    tmp = (this.tar[index_k] - this.temp_s[index_k]) / (rsGradientX[index_k] * rsGradientX[index_k] + rsGradientY[index_k] * rsGradientY[index_k] + this.lambda);
                    kx[index_k] = tmp * rsGradientX[index_k];
                    ky[index_k] = tmp * rsGradientY[index_k];
                }
            }
        }

        for (let k = 0; k < this.optimizedRects.length; k++) {
            let arrowTagArr = new Array(this.optimizedRects[k].y2);
            for (let arrIndexY = 0; arrIndexY < arrowTagArr.length; arrIndexY++) {
                arrowTagArr[arrIndexY] = new Array(this.optimizedRects[k].x2);
                for (let arrIndexX = 0; arrIndexX < arrowTagArr[arrIndexY].length; arrIndexX++) {
                    arrowTagArr[arrIndexY][arrIndexX] = 0;
                }
            }

            for (let j = this.optimizedRects[k].x1; j < this.optimizedRects[k].x2; j++) {
                for (let i = this.optimizedRects[k].y1; i < this.optimizedRects[k].y2; i++) {
                    index_k = i * this.nx + j;
                    this.ux[index_k] += kx[index_k];
                    this.uy[index_k] += ky[index_k];
                }
            }
        }
        this.resultUx.push(this.ux);
        this.resultUy.push(this.uy);
        this.temp_s = MatlabFuncUtility.MovePixelsRectanglesEx(this.temp_s, this.nx, this.ny, this.ux, this.uy, this.optimizedRects);
    };

    // Rect were caled in this function
    SeedForSrcAndTar() {
        let groMinLab = [];
        let groLab = [];
        let labCnt = 0;

        let groMinLabTar = [];
        let groLabTar = [];
        let labCntTar = 0;

        let paramLabelingBlob = {
            width: this.imgWidth,
            height: this.imgHeight,
            srcdata: this.src,
            data: undefined,
            label: this.srcLab,
            groupMinLab: groMinLab,
            groupLab: groLab,
            curLabCnt: labCnt
        };

        // Labeling Blobs for src
        LabelingBlobs(paramLabelingBlob);

        let paramLabelingBlobTar = {
            width: this.imgWidth,
            height: this.imgHeight,
            srcdata: this.tar,
            data: undefined,
            label: this.tarLab,
            groupMinLab: groMinLabTar,
            groupLab: groLabTar,
            curLabCnt: labCntTar
        };

        LabelingBlobs(paramLabelingBlobTar);

        //
        let finalGroupSrcCnt = 0;
        let finalGroupTarCnt = 0;

        for (let i = 0; i < paramLabelingBlob.groupMinLab.length; i++) {
            if ((paramLabelingBlob.groupMinLab[i] + 1) > finalGroupSrcCnt) {
                finalGroupSrcCnt = (paramLabelingBlob.groupMinLab[i] + 1);
            }
        }
        // console.log(paramLabelingBlob)

        for (let i = 0; i < paramLabelingBlobTar.groupMinLab.length; i++) {
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
        let highestPixelInfoSrc = new Array(finalGroupSrcCnt * 8);
        let highestPixelInfoTar = new Array(finalGroupTarCnt * 8);

        // First: Index; Second: Value
        for (let i = 0; i < finalGroupSrcCnt; i++) {
            highestPixelInfoSrc[i * 8] = 0;
            highestPixelInfoSrc[i * 8 + 1] = 0;
            highestPixelInfoSrc[i * 8 + 2] = 0;
            highestPixelInfoSrc[i * 8 + 3] = this.imgWidth;
            highestPixelInfoSrc[i * 8 + 4] = 0;
            highestPixelInfoSrc[i * 8 + 5] = this.imgHeight;
            highestPixelInfoSrc[i * 8 + 6] = 0;
            highestPixelInfoSrc[i * 8 + 7] = undefined;
        }

        for (let i = 0; i < finalGroupTarCnt; i++) {
            highestPixelInfoTar[i * 8] = 0;
            highestPixelInfoTar[i * 8 + 1] = 0;
            highestPixelInfoTar[i * 8 + 2] = 0;
            highestPixelInfoTar[i * 8 + 3] = this.imgWidth;
            highestPixelInfoTar[i * 8 + 4] = 0;
            highestPixelInfoTar[i * 8 + 5] = this.imgHeight;
            highestPixelInfoTar[i * 8 + 6] = 0;
            highestPixelInfoTar[i * 8 + 7] = undefined;

        }

        let index = 0;
        for (let i = 0; i < this.imgHeight; i++)
            for (let j = 0; j < this.imgWidth; j++) {
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
                        highestPixelInfoSrc[paramLabelingBlob.label[index] * 8] = index;
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

                    if (highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 1] < this.tar[index]) {
                        highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8] = index;
                        highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 1] = this.tar[index];
                    }

                    if (tar[index] > 0.4)
                        highestPixelInfoTar[paramLabelingBlobTar.label[index] * 8 + 2] += 1; //tar[index];
                }
                index++;
            }

        // Highest pixels from src to tar
        for (let i = 0; i < finalGroupSrcCnt; i++) {
            this.tar[highestPixelInfoSrc[i * 8]] = highestPixelInfoSrc[i * 8 + 1];
        }
        // console.log(highestPixelInfoSrc)
        // Highest pixels from tar to src
        for (let i = 0; i < finalGroupTarCnt; i++) {
            this.src[highestPixelInfoTar[i * 8]] = highestPixelInfoTar[i * 8 + 1];
        }
    }
}