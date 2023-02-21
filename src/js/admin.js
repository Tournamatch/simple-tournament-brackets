(function () {
    'use strict';

    document.addEventListener("DOMContentLoaded",function(){
        const unsecuredCopyToClipboard = (text) => { const textArea = document.createElement("textarea"); textArea.value=text; document.body.appendChild(textArea); textArea.focus();textArea.select(); try{document.execCommand('copy')}catch(err){console.error('Unable to copy to clipboard',err)}document.body.removeChild(textArea)};

        let copyableCodes = document.getElementsByClassName("stb-shortcode");
        Array.prototype.forEach.call(copyableCodes, (code) => {
            code.addEventListener("click", () => {
                let content = code.innerText;
                if (window.isSecureContext && navigator.clipboard) {
                    navigator.clipboard.writeText(content);
                } else {
                    unsecuredCopyToClipboard(content);
                }
            });
        }, false);
    });

})();