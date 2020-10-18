/*
* @Author: Dawn, dawn.chli@gmail.com
* @Date:   2017-05-10 21:48:19
* @Last Modified by:   Dawn
* @Last Modified time: 2017-05-12 17:28:01
*/
function MyRectangle() {
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
    this.init = function (_x1, _y1, _x2, _y2) {
        this.x1 = _x1;
        this.y1 = _y1;
        this.x2 = _x2;
        this.y2 = _y2;
    }
}

function MatlabFuncUtl() {

    this.DemonCoreOperationX = function (data0, data1, gx, gy, lambda) {
        var newData = new Array(data0.length);
        for (var i = 0; i < data0.length; i++) {
            newData[i] = (data0[i] - data1[i]) / (gx[i] * gx[i] + gy[i] * gy[i] + lambda) * gx[i];
        }
        return newData;
    }

    this.DemonCoreOperationY = function (data0, data1, gx, gy, lambda) {
        var newData = new Array(data0.length);
        for (var i = 0; i < data0.length; i++) {
            newData[i] = (data0[i] - data1[i]) / (gx[i] * gx[i] + gy[i] * gy[i] + lambda) * gy[i];
        }
        return newData;
    }

    this.Norm = function (data) {
        var sumVal = 0;
        for (var i = 0; i < data.length; i++) {
            sumVal += data[i] * data[i];
        }
        return Math.sqrt(sumVal);
    }

    this.NormSubOfTwo = function (data0, data1) {
        var sumVal = 0;
        for (var i = 0; i < data0.length; i++) {
            var subVal = data0[i] - data1[i];
            sumVal += subVal * subVal;
        }
        return Math.sqrt(sumVal);
    }

    this.DotMulti = function (data0, data1) {
        var newData = new Array(data0.length);
        for (var i = 0; i < data0.length; i++) {
            newData[i] = data0[i] * data1[i];
        }
        return newData;
    }

    this.DotMultiWithParam = function (data0, data1, param) {
        var newData = new Array(data0.length);
        for (var i = 0; i < data0.length; i++) {
            newData[i] = param * data0[i] * data1[i];
        }
        return newData;
    }

    this.SubOfTwoDotMultiWithSame = function (data0, data1) {
        var newData = new Array(data0.length);
        for (var i = 0; i < data0.length; i++) {
            newData[i] = (data0[i] - data1[i]) * (data0[i] - data1[i]);
        }
        return newData;
    }

    this.SumY = function (data, w, h) {
        var newData = new Array(w);
        var index = 0;
        for (var i = 0; i < w; i++) {
            newData[i] = 0;
            for (var j = 0; j < h; j++) {
                index = j * w + i;
                newData[i] += data[index];
            }
        }
        return newData;
    }

    // Along x's direction
    this.SumSingleX = function (data) {
        var newData = 0;
        for (var i = 0; i < data.length; i++) {
            newData += data[i];
        }
        return newData;
    }

    this.MovePixels = function (mat, w, h, dirX, dirY) {
        var newMatrix = new Array(w * h);
        var index = 0;
        var indexTar = 0;
        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                newMatrix[index] = mat[index];
                index++;
            }
        }

        var newX = 0;
        var newY = 0;
        index = 0;
        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                newX = j - Math.round(dirX[index]);
                newY = i - Math.round(dirY[index]);

                if (newX < w && newX >= 0 && newY < h && newY >= 0) {
                    indexTar = newY * w + newX;
                    newMatrix[indexTar] = mat[index];
                }
                index++;
            }
        }

        return newMatrix;
    }

    this.MovePixelsEx = function (mat, w, h, dirX, dirY) {
        var newMatrix = new Array(w * h);
        var index = 0;
        var indexTar = 0;
        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                newMatrix[index] = mat[index];
                index++;
            }
        }

        var newX = 0;
        var newY = 0;
        var indexTar00 = 0;
        var indexTar01 = 0;
        var indexTar10 = 0;
        var indexTar11 = 0;
        var param00 = 0;
        var param01 = 0;
        var param10 = 0;
        var param11 = 0;
        var newMinX;
        var newMaxX;
        var newAlphaX;
        var newMinY;
        var newMaxY;
        var newAlphaY;
        index = 0;
        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                if (dirX[index] == 0 && dirY[index] == 0) {
                    continue;
                }

                newMinX = j + Math.floor(-dirX[index]);
                newMaxX = newMinX + 1;
                newAlphaX = j - dirX[index] - newMinX;

                newMinY = i + Math.floor(-dirY[index]);
                newMaxY = newMinY + 1;
                newAlphaY = i - dirY[index] - newMinY;

                param00 = (1 - newAlphaX) * (1 - newAlphaY);
                param01 = newAlphaX * (1 - newAlphaY);
                param10 = (1 - newAlphaX) * newAlphaY;
                param11 = newAlphaX * newAlphaY;

                //LCH TODO 边界处理
                if (newMaxX < w && newMinX >= 0 && newMaxY < h && newMinY >= 0) {
                    indexTar00 = newMinY * w + newMinX;
                    indexTar01 = newMinY * w + newMaxX;
                    indexTar10 = newMaxY * w + newMinX;
                    indexTar11 = newMaxY * w + newMaxX;
                    //newMatrix[ index ] = param00*mat[indexTar00] + param01*mat[indexTar01] + param10*mat[indexTar10] + param11*mat[indexTar11];
                    newMatrix[indexTar00] = newMatrix[indexTar00] * (1 - param00) + param00 * mat[index];
                    newMatrix[indexTar01] = newMatrix[indexTar01] * (1 - param01) + param01 * mat[index];
                    newMatrix[indexTar10] = newMatrix[indexTar10] * (1 - param10) + param10 * mat[index];
                    newMatrix[indexTar11] = newMatrix[indexTar11] * (1 - param11) + param11 * mat[index];
                }

                index++;
            }
        }

        return newMatrix;
    }

    this.MovePixelsRectanglesEx = function (mat, w, h, dirX, dirY, rects) {
        var newMatrix = new Array(w * h);
        var index = 0;
        var indexTar = 0;
        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                newMatrix[index] = mat[index];
                index++;
            }
        }

        var newX = 0;
        var newY = 0;
        var indexTar00 = 0;
        var indexTar01 = 0;
        var indexTar10 = 0;
        var indexTar11 = 0;
        var param00 = 0;
        var param01 = 0;
        var param10 = 0;
        var param11 = 0;
        var newMinX;
        var newMaxX;
        var newAlphaX;
        var newMinY;
        var newMaxY;
        var newAlphaY;
        index = 0;
        for (var k = 0; k < rects.length; k++) {
            for (var j = rects[k].x1; j < rects[k].x2; j++) {
                for (var i = rects[k].y1; i < rects[k].y2; i++) {
                    index = i * w + j;

                    if (dirX[index] == 0 && dirY[index] == 0) {
                        continue;
                    }

                    newMinX = j + Math.floor(-dirX[index]);
                    newMaxX = newMinX + 1;
                    newAlphaX = j - dirX[index] - newMinX;

                    newMinY = i + Math.floor(-dirY[index]);
                    newMaxY = newMinY + 1;
                    newAlphaY = i - dirY[index] - newMinY;

                    param00 = (1 - newAlphaX) * (1 - newAlphaY);
                    param01 = newAlphaX * (1 - newAlphaY);
                    param10 = (1 - newAlphaX) * newAlphaY;
                    param11 = newAlphaX * newAlphaY;

                    //LCH TODO 边界处理
                    if (newMaxX < w && newMinX >= 0 && newMaxY < h && newMinY >= 0) {
                        indexTar00 = newMinY * w + newMinX;
                        indexTar01 = newMinY * w + newMaxX;
                        indexTar10 = newMaxY * w + newMinX;
                        indexTar11 = newMaxY * w + newMaxX;
                        //newMatrix[ index ] = param00*mat[indexTar00] + param01*mat[indexTar01] + param10*mat[indexTar10] + param11*mat[indexTar11];
                        newMatrix[indexTar00] = newMatrix[indexTar00] * (1 - param00) + param00 * mat[index];
                        newMatrix[indexTar01] = newMatrix[indexTar01] * (1 - param01) + param01 * mat[index];
                        newMatrix[indexTar10] = newMatrix[indexTar10] * (1 - param10) + param10 * mat[index];
                        newMatrix[indexTar11] = newMatrix[indexTar11] * (1 - param11) + param11 * mat[index];
                    }
                }
            }
        }

        return newMatrix;
    }

    this.Sub = function (data0, data1) {
        var newData = new Array(data0.length);
        for (var i = 0; i < data0.length; i++) {
            newData[i] = (data0[i] - data1[i]);
        }
        return newData;
    }

    this.Sum = function (data0, data1) {
        var newData = new Array(data0.length);
        for (var i = 0; i < data0.length; i++) {
            newData[i] = (data0[i] + data1[i]);
        }
        return newData;
    }

    this.GradientX = function (matrix, w, h) {
        var newMatrix = new Array(w * h);
        var index = 0;
        var indexLeft = 0;
        var indexRight = 0;
        for (var j = 0; j < w; j++) {
            for (var i = 0; i < h; i++) {
                if (j == 0) {
                    indexLeft = index;
                    indexRight = index + 1;
                    newMatrix[index] = matrix[indexRight] - matrix[indexLeft];
                }
                else if (j == w - 1) {
                    indexLeft = index - 1;
                    indexRight = index;
                    newMatrix[index] = matrix[indexRight] - matrix[indexLeft];
                }
                else {
                    indexLeft = index - 1;
                    indexRight = index + 1;
                    newMatrix[index] = (matrix[indexRight] - matrix[indexLeft]) * 0.5;
                }
                index++;
            }
        }
        return newMatrix;
    }

    this.GradientY = function (matrix, w, h) {
        var newMatrix = new Array(w * h);
        var index = 0;
        var indexUp = 0;
        var indexDown = 0;
        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                if (i == 0) {
                    indexUp = index;
                    indexDown = index + w;
                    newMatrix[index] = matrix[indexDown] - matrix[indexUp];
                }
                else if (i == h - 1) {
                    indexUp = index - w;
                    indexDown = index;
                    newMatrix[index] = matrix[indexDown] - matrix[indexUp];
                }
                else {
                    indexUp = index - w;
                    indexDown = index + w;
                    newMatrix[index] = (matrix[indexDown] - matrix[indexUp]) * 0.5;
                }
                index++;
            }
        }
        return newMatrix;
    }

    this.GradientRectanglesX = function (matrix, w, h, rects) {
        var newMatrix = new Array(w * h);
        var index = 0;
        var indexLeft = 0;
        var indexRight = 0;
        for (var k = 0; k < rects.length; k++) {
            for (var j = rects[k].x1; j < rects[k].x2; j++) {
                for (var i = rects[k].y1; i < rects[k].y2; i++) {
                    index = i * w + j;
                    newMatrix[index] = 0;
                    if (j == 0) {
                        indexLeft = index;
                        indexRight = index + 1;
                        newMatrix[index] = matrix[indexRight] - matrix[indexLeft];
                    }
                    else if (j == w - 1) {
                        indexLeft = index - 1;
                        indexRight = index;
                        newMatrix[index] = matrix[indexRight] - matrix[indexLeft];
                    }
                    else {
                        indexLeft = index - 1;
                        indexRight = index + 1;
                        newMatrix[index] = (matrix[indexRight] - matrix[indexLeft]) * 0.5;
                    }
                }
            }
        }
        return newMatrix;
    }

    this.GradientRectanglesY = function (matrix, w, h, rects) {
        var newMatrix = new Array(w * h);
        var index = 0;
        var indexUp = 0;
        var indexDown = 0;
        for (var k = 0; k < rects.length; k++) {
            for (var i = rects[k].y1; i < rects[k].y2; i++) {
                for (var j = rects[k].x1; j < rects[k].x2; j++) {
                    index = i * w + j;
                    newMatrix[index] = 0;
                    if (i == 0) {
                        indexUp = index;
                        indexDown = index + w;
                        newMatrix[index] = matrix[indexDown] - matrix[indexUp];
                    }
                    else if (i == h - 1) {
                        indexUp = index - w;
                        indexDown = index;
                        newMatrix[index] = matrix[indexDown] - matrix[indexUp];
                    }
                    else {
                        indexUp = index - w;
                        indexDown = index + w;
                        newMatrix[index] = (matrix[indexDown] - matrix[indexUp]) * 0.5;
                    }
                }
            }
        }
        return newMatrix;
    }

    // Additive Operation Separate
    this.Aos1 = function (ux, uy, Ax, Ay, tao, w, h) {
        var N = h;
        var M = w;
        var alf = new Array(w * h);
        var gram = new Array(w * (h - 1));
        var beta = new Array(w * (h - 1));
        for (var i = 0; i < alf.length; i++) {
            alf[i] = 0;
        }

        for (var i = 0; i < gram.length; i++) {
            gram[i] = 0;
            beta[i] = 0;
        }

        // alf(i,:)=(1+4.*tao).*ones(1,M);
        var index = 0;
        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                alf[index] = (1 + 4 * tao);
                index++;
            }
        }

        index = 0;
        for (var i = 0; i < (h - 1); i++) {
            for (var j = 0; j < w; j++) {
                gram[index] = (-2 * tao);
                beta[index] = (-2 * tao);
                index++;
            }
        }

        index = 0;
        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                //dx=ux+tao*Ax;
                //dy=uy+tao*Ay;
                ux[index] = ux[index] + tao * Ax[index];
                uy[index] = uy[index] + tao * Ay[index];
                index++;
            }
        }

        var mulObj = new MultiObj();

        for (var j = 0; j < M; j++) {
            var subAlf = new Array(N);
            var subBeta = new Array(N - 1);
            var subGram = new Array(N - 1);
            var subDx = new Array(N);
            var subDy = new Array(N);

            for (var i = 0; i < N; i++) {
                var indexSub0 = i * M + j;
                subAlf[i] = alf[indexSub0];
                subDx[i] = ux[indexSub0];
                subDy[i] = uy[indexSub0];
            }

            for (var i = 0; i < (N - 1); i++) {
                var indexSub1 = i * M + j;
                subBeta[i] = beta[indexSub1];
                subGram[i] = gram[indexSub1];
            }

            var rsSubUx = this.Thomas(subAlf, subBeta, subGram, subDx, h);
            var rsSubUy = this.Thomas(subAlf, subBeta, subGram, subDy, h);
            for (var i = 0; i < N; i++) {
                var indexSub2 = i * M + j;
                ux[indexSub2] = rsSubUx[i];
                uy[indexSub2] = rsSubUy[i];
            }
        }

        mulObj.obj1 = ux;
        mulObj.obj2 = uy;
        return mulObj;
    }

    this.Thomas = function (alf, beta, gram, d, h) {
        var N = h;
        var m = new Array(N);
        var l = new Array(N - 1);
        for (var j = 0; j < N; j++) m[j] = 0;
        m[0] = alf[0];

        for (var i = 0; i < (N - 1); i++) {
            l[i] = 0;
            l[i] = gram[i] / m[i];
            m[i + 1] = alf[i + 1] - l[i] * beta[i];
        }

        var y = new Array(N);
        for (var j = 0; j < N; j++) y[j] = 0;
        y[0] = d[0];

        for (var i = 1; i < N; i++) {
            y[i] = d[i] - l[i - 1] * y[i - 1];
        }

        var u = new Array(N);
        for (var j = 0; j < N; j++) u[j] = 0;
        u[N - 1] = y[N - 1] / m[N - 1];
        for (var i = N - 2; i >= 0; i--) {
            u[i] = (y[i] - beta[i] * u[i + 1]) / m[i];
        }

        return u;
    }

    this.RevMatrix = function (data, w, h) {
        var newMatrix = new Array(h * w);
        var index = 0;
        var index2 = 0;
        for (var i = 0; i < w; i++) {
            for (var j = 0; j < h; j++) {
                index = j * w + i;
                index2 = i * h + j;
                newMatrix[index2] = data[index];
            }
        }
        return newMatrix;
    }
}

function MultiObj() {
    this.obj1 = undefined;
    this.obj2 = undefined;
}

var MatlabFuncUtility = new MatlabFuncUtl();