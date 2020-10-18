/*
* @Author: Dawn, dawn.chli@gmail.com
* @Date:   2017-05-10 21:48:19
* @Last Modified by:   Dawn
* @Last Modified time: 2017-05-12 17:28:02
*/
function MathFuncUtl(){

    this.GetRandomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    this.RectinRectArray = function(rect, rectArray){
    	var index = new Array(0);
    	for (var i = 0; i < rectArray.length; i++) {
    		if( this.DoOverlap( rect[3], rect[5], rect[4], rect[6], 
    			rectArray[i][3], rectArray[i][5], rectArray[i][4], rectArray[i][6] ) )
    		{
    			//console.log( "RectA:" + rect[3] + "_" + rect[5] + "_" + rect[4] + "_" + rect[6] );
    			//console.log( "RectB:" + rectArray[i][3] + "_" + rectArray[i][5] + "_" + rectArray[i][4] + "_" + rectArray[i][6] );
    			index.push(i);
    		}
    	};
    	return index;
    }

    this.DoOverlap = function(firx1, firy1, firx2, firy2, secx1, secy1, secx2, secy2)
	{
	    return !(secx1 > firx2 || 
         		 secx2 < firx1 || 
         		 secy1 > firy2 ||
         		 secy2 < firy1);
	}
}

var MathFuncUtility = new MathFuncUtl();