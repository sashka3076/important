/*************************************************************************
 * 
 * CANVASFLIP CONFIDENTIAL
 * __________________
 * 
 *  Copyright (C) CanvasFlip Solutions Private Limited
 *  All Rights Reserved.
 *  Proprietary and confidential.
 * 
 * NOTICE: All information contained herein is, and remains the property of
 * CanvasFlip Solutions Private Limited. The intellectual and technical concepts
 * contained herein are proprietary to CanvasFlip Solutions Private Limited
 * and may be covered by Patents, patents in process, and are protected copyright law.
 * Dissemination of this information or reproduction of this material via any medium
 * is strictly forbidden unless prior written permission is obtained from
 * CanvasFlip Solutions Private Limited.
 **************************************************************************/

var loadingDiv = null;

function CFInspectShowLoading() {
    if (loadingDiv == null) {
        //append loadingDiv if not present
        loadingDiv = window.document.createElement('div');
        loadingDiv.id = "cfInspectorLoader";
        document.getElementsByTagName('body')[0].appendChild(loadingDiv);

        var innerDiv1 = document.createElement('div');
        var innerDiv2 = document.createElement('div');
        innerDiv2.innerHTML = "Loading Visual Inspector<br>Please Wait...";

        innerDiv1.appendChild(innerDiv2);
        loadingDiv.appendChild(innerDiv1);
    }

    if (loadingDiv != null) {
        //show loading
        loadingDiv.style.display = "block";
    }
}

function CFInspectHideLoading() {
    if (loadingDiv != null) {
        loadingDiv.style.display = "none";
    }
}

window.addEventListener("firefox-review-url", function (event) {
    try {
        chrome.runtime.sendMessage(event.detail);
    } catch (e) {

    }
}, false);