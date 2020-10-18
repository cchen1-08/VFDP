/*
* @Author: Dawn, dawn.chli@gmail.com
* @Date:   2017-05-11 18:01:21
* @Last Modified by:   Dawn
* @Last Modified time: 2017-05-12 17:27:37
*/
'use strict';

function GCommonFuncUtl() {

    var gSpinnerLoading = null;

    this.DoRemoveLoadAnim = (divName) => {
        if (gSpinnerLoading)
            gSpinnerLoading.stop();
    };

    this.DoStartLoadAnim = (divName) => {
        var opts = {
            lines: 15 // The number of lines to draw
            , length: 17 // The length of each line
            , width: 14 // The line thickness
            , radius: 42 // The radius of the inner circle
            , scale: 1 // Scales overall size of the spinner
            , corners: 1 // Corner roundness (0..1)
            , color: '#000' // #rgb or #rrggbb or array of colors
            , opacity: 0.3 // Opacity of the lines
            , rotate: 0 // The rotation offset
            , direction: 1 // 1: clockwise, -1: counterclockwise
            , speed: 1 // Rounds per second
            , trail: 60 // Afterglow percentage
            , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
            , zIndex: 2e9 // The z-index (defaults to 2000000000)
            , className: 'spinner' // The CSS class to assign to the spinner
            , top: '35%' // Top position relative to parent
            , left: '50%' // Left position relative to parent
            , shadow: false // Whether to render a shadow
            , hwaccel: false // Whether to use hardware acceleration
            , position: 'absolute' // Element positioning
        };
        var target = document.getElementById(divName);
        gSpinnerLoading = new Spinner(opts).spin(target);
    }
}

var GCommonFuncUtility = new GCommonFuncUtl();