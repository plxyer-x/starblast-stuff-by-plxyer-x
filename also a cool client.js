// ==UserScript==
// @name          starblast self ship tag
// @version       1.0
// @description   a script that gives you a self ship tag
// @author        plxyer-x
// @match         https://starblast.io/
// @grant         none
// @license       haahhahahaahhaahahahaahhaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// @run-at        document-start
// ==/UserScript==

'use strict';
if (localStorage.getItem('selftag') == null) localStorage.setItem('selftag', 'true');

let Client = new (class {
    log(msg) {
        console.log(`[Client] ${msg}`);
    }
    error(msg) {
        console.error(`[Client] [Error] ${msg}`);
    }
    checkgame() {
        return '/' == window.location.pathname && 'welcome' != Object.values(window.module.exports.settings).find(e => e && e.mode).mode.id && 'https://starblast.io/#' != window.location.href;
    }
})();

async function ClientLoader() {
    document.open();
    document.write(
        `<title>Loading...</title><style>.wrapper{position:fixed;z-index:100;top:0;left:0;width:100%;height:100%;background:#001019;display:flex;justify-content:center;align-items:center}.loading,.loading-container{height:100px;position:relative;width:100px;border-radius:100%}.loading-container{margin:40px auto}.loading{border:4px solid transparent;border-color:transparent hsla(200,72%,61%,.7) transparent hsla(200,72%,61%,.7);-webkit-animation:rotate-loading 1.5s linear 0s infinite normal;animation:rotate-loading 1.5s linear 0s infinite normal;transform-origin:50% 50%}</style><div class=wrapper><div class=loading-container><div class=loading></div><div id=loading-text>loading...</div></div></div>`
    );
    window.onbeforeunload = null;
    document.close();

    var url = 'https://starblast.io';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);

    xhr.onreadystatechange = async function () {
        if (xhr.readyState === 4) {
            try {
                var src = xhr.responseText;
                if (src == undefined) {
                    Client.log(`Src fetch failed, loading original game.`);
                    document.open();
                    document.write(xhr.responseText);
                    document.close();
                    return;
                }

                let prevSrc = src;
                Client.checkSrcChange = function (msg) {
                    if (src == prevSrc) console.error(`failed to modify game at ${msg}`);
                    prevSrc = src;
                };

                Client.log(`Modifying game source to inject "Self Ship Tag"...`);

                src = src.replace(
                    /shake:\{[^{}]*\},/,
                    '$&selftag:{name:"Self Ship Tag",value:!0,skipauto:!0,filter:"default,app,mobile"},'
                );
                Client.checkSrcChange('Inject Self Ship Tag Setting');

                document.open();
                document.write(src);
                document.close();
                Client.log('Document loaded');

                setTimeout(function () {
                    (function () {
                        let ShipTagObject, tagUpdateFunc;

                        for (let prop in window) {
                            try {
                                let proto = window[prop].prototype;
                                if (null != proto) {
                                    for (let method in proto) {
                                        let func = proto[method];

                                        if ('function' == typeof func && func.toString().match(/([^,]+)("hsla\(180,100%,75%,\.75\)")/)) {
                                            let hue_access_path;

                                            (ShipTagObject = prop),
                                                (proto[(tagUpdateFunc = Object.keys(proto).find(p => 'function' == typeof proto[p] && (hue_access_path = (proto[p].toString().match(/===(\w+\.[^,]+)\.hue/) || [])[1])))] = Function(
                                                    'return ' + proto[tagUpdateFunc].toString().replace(/(\.id)/, '$1, this.selfShip = this.shipid == ' + hue_access_path + '.id')
                                                )()),
                                                (proto[method] = Function('return ' + func.toString().replace(/([^,]+)("hsla\(180,100%,75%,\.75\)")/, "$1 this.selfShip ? 'hsla(180,100%,75%,\.75)' : $2"))());
                                        }
                                    }
                                }
                            } catch (e) {}
                        }

                        let sceneProto = Object.getPrototypeOf(Object.values(Object.values(window.module.exports.settings).find(e => e && e.mode)).find(e => e && e.background));
                        let SceneConstructor = sceneProto.constructor;
                        let sceneProto_c = SceneConstructor.prototype;
                        let sceneConstructorString = SceneConstructor.toString();

                        let hue_var = sceneConstructorString.match(/(\w+)\.hue/)[1];
                        let add_func = sceneConstructorString.match(/(\w+)\.add\(/)[1];
                        let tag_mesh_prop = sceneConstructorString.match(/chat_bubble\.(\w+)/)[1];

                        ((SceneConstructor = Function(
                            'return ' + sceneConstructorString.replace(/}$/, ', this.welcome || (this.ship_tag = new ' + ShipTagObject + '(Math.floor(360 * 0)), this.' + add_func + '.add(this.ship_tag.' + tag_mesh_prop + '))}')
                        )()).prototype = sceneProto_c),
                            (SceneConstructor.prototype.constructor = SceneConstructor),
                            (sceneProto.constructor = SceneConstructor),

                            (SceneConstructor.prototype.updateShipTag = function () {
                                if (null != this.ship_tag) {
                                    if (!this.shipKey) {
                                        this.shipKey = Object.keys(this).find(e => this[e] && this[e].ships);
                                        let e = this[this.shipKey];
                                        this.statusKey = Object.keys(e).find(t => e[t] && e[t].status);
                                    }
                                    let hueObj = this[hue_var];
                                    let playerStatus = this[this.shipKey][this.statusKey];

                                    this.ship_tag[tagUpdateFunc](hueObj, hueObj.names.get(playerStatus.status.id), playerStatus.status, playerStatus.instance);

                                    let tagPosition = this.ship_tag[tag_mesh_prop].position;
                                    tagPosition.x = playerStatus.status.x;
                                    tagPosition.y = playerStatus.status.y - 2 - playerStatus.type.radius;
                                    tagPosition.z = 1;

                                    (this.ship_tag[tag_mesh_prop].visible = 'true' == localStorage.getItem('selftag') && playerStatus.status.alive && !playerStatus.status.guided);
                                }
                            });

                        let render_method = Object.keys(sceneProto_c).find(p => 'function' == typeof sceneProto_c[p] && sceneProto_c[p].toString().includes('render'));
                        SceneConstructor.prototype[render_method] = Function('return ' + SceneConstructor.prototype[render_method].toString().replace(/(\w+\.render)/, 'this.updateShipTag(), $1'))();

                        let translate_func = function (...e) {
                            return window.module.exports.translate(...e);
                        };

                        for (let prop in window) {
                            try {
                                let proto = window[prop].prototype;
                                if ('function' == typeof proto.refused) {
                                    for (let method in proto) {
                                        let func = proto[method];
                                        if ('function' == typeof func && func.toString().includes('new Scene')) {
                                            proto[method] = Function('Scene', 't', 'return ' + func.toString())(SceneConstructor, translate_func);
                                        }
                                    }
                                }
                            } catch (e) {}
                        }
                    })();
                }, 1100);

            } catch (error) {
                Client.error(`Client error during patching: ${error.message}`);
                document.open();
                document.write(xhr.responseText);
                document.close();
            }
        }
    };
    xhr.send();
}

if (window.location.pathname == '/') {
    setTimeout(ClientLoader, 1);
}
