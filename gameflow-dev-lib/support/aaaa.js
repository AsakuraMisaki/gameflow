
(function (global, factory) {
    if(!global) return;
    let common = (typeof exports === 'object' && typeof module !== 'undefined'); // CommonJS
    common ? factory(exports) : factory( global.ScriptableProxy = { } ); //Universal
})(window || global || self || globalThis, function (exports) {
    function Em(){};

    
    
    function createObservableProxy(obj, e) {
        return new Proxy(obj, {
            get(target, prop, receiver) {
                const value = Reflect.get(target, prop, receiver);
                if (typeof value === 'object' && value !== null) {
                    return createObservableProxy(value, callback); // 递归代理
                }
                return value;
            },
            set(target, prop, value, receiver) {
                const oldValue = target[prop];
                const result = Reflect.set(target, prop, value, receiver);
                if (oldValue !== value) {
                    // callback ? callback(target, prop, oldValue, value) : null;
                    e ? e.emit(`~${prop}`, oldValue, value, target, prop) : null;
                }
                return result;
            }
        });
    }

    //#[ui_block]
    {
        // let info = createObservableProxy({});
        // let sprite = new PIXI.Sprite();
        // pixilink(sprite, info);
        // //#less code ui edit meta
        // let anime = createObservableProxy({});
        // anime.move = {
        //     x: 0,
        //     y: 10,
        //     duration: 1000,
        //     tween: "Linear.None",
        //     loop: Infinity
        // }
        // let cut = createObservableProxy({});
        // cut.icon = {
        //     index: 3,
        //     url: 'IconSet',
        //     path: 'system',
        // }
        
        // // sprite.link(info);
        // pixilink(sprite, info);
        // //#pixi create sandbox 沙箱
        // {
        //     // auto refresh
    
        //     let anime = createObservableProxy({});
        //     // GC dangerous
        //     createObservableProxyBind(sprite, 'width', anime, 'width');

        //     let display = createObservableProxy({});

        //     createObservableProxyBind(sprite, 'layout', display, 'layout');
        //     // sprite.bind('width', anime, 'width');
        //     // sandbox.init().add(anime);
        // }
    }

    function flysand(){
        // let spriteA = PIXI.Sprite(PIXI.Texture.from('./img/system/IconSet.png'));
        // let spriteB = PIXI.Sprite(PIXI.Texture.from('./img/system/IconSet.png'));
        // let frame = spriteB.genFrame(2);
        // spriteB.frame = frame;
        
    }

    function pixilink(display, obj){
        return createObservableProxy(obj, display.ev);
    }

    function defaultProxyCB (target, prop, oldValue, value){
        console.log(target, `Property ${prop} changed from ${oldValue} to ${value}`);
    } 

    exports.createObservableProxy = createObservableProxy;
    exports.defaultProxyCB = defaultProxyCB;
    exports.Em = Em;

    
})