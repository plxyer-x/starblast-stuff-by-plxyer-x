// ==UserScript==
// @name         see blank ECPs
// @version      1.0
// @namespace    tampermonkey
// @description  allows you to see other players' blank ECPs
// @author       plxyer-x
// @match        https://starblast.io/
// @license      hahahahahahahhehehehehahahahahahaha, no.
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    

    function modifyGameSource(src) {
        let modifiedSrc = src;

       
        modifiedSrc = modifiedSrc.replace(/"blank"\s*!==\s*this\.custom\.badge/g, '""!==this.custom.badge'); // [cite: 244, 245]

        
        modifiedSrc = modifiedSrc.replace(/case"star":.*?break;/g, `$&case"blank":t.fillStyle="hsla(200, 0%, 0%, 0)";break;`); //

      
        modifiedSrc = modifiedSrc.replace(
            /default:t\.fillStyle="hsl\(50,100%,70%\)",t\.fillText\("S",e\/2,i\/2\)/g,
            'case"blank":t.fillStyle="hsla(200, 0%, 0%, 1)";break;default:t.fillStyle="hsl(50,100%,70%)",t.fillText("S",e/2,i/2)'
        ); //

        return modifiedSrc;
    }

    function ClientLoader() {
        const url = 'https://starblast.io';
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                let src = xhr.responseText;

                src = modifyGameSource(src);

                document.open();
                document.write(src);
                document.close();
            }
        };
        xhr.send();
    }

    if (window.location.pathname === '/') { // [cite: 373]
        setTimeout(ClientLoader, 1);
    }

})();
