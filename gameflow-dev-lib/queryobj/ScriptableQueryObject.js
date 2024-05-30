(function (global, factory) {
    if(!global) return;
    let common = (typeof exports === 'object' && typeof module !== 'undefined'); // CommonJS
    common ? factory(exports) : factory( global.ScriptableQueryObject = { } ); //Universal
})(window || global || self || globalThis, function (exports) {

    // 全局方法
    const getQuery = function(any){
        if(any._queryId != undefined) any = any._queryId;
        return contexter.running.get(any);
    }

    const setCache = function(target, key, any){
        if(!(target instanceof contexter)) return setCache(getQuery(target), key, any);
        return target.cache.set(key, any);
    }

    const getCache = function(target, key){
        if(!(target instanceof contexter)) return getCache(getQuery(target), key);
        return target.cache.get(key);
    }

    const clearCache = function(target, key){
        if(!(target instanceof contexter)) return clearCache(getQuery(target), key);
        return target.cache.delete(key);
    }

    let explore = { };

    let json = { };
    json.string2obj = function(s){
        if(typeof(s) != 'string') return s;
        let temp = new Function(`return {${s}};`);
        return temp();
    }

    let shared = new Map();

    /**
     * 序列对象结构:
     * 此拓展在于对数据库符合格式的备注进行解释并生成运行时函数/变量 从而自定义任意技能流程
     * <br>流程可以概述为
     * <br>通过工具函数(全局或序列实例函数)返回某个变量a并保存
     * <br>将a传到另一个工具函数中实现某段逻辑, 返回某个变量b,
     * <br>将b传到另一个工具函数中实现某段逻辑, 返回某个变量c....
     * <br>可以选择是否需要保留返回的变量
     * <br>基本格式 #(函数标志|函数标志|...)完整函数名:返回名 参数1 参数2 ... 
     * <br>#(函数标志|函数标志|...)完整函数名:返回名 为第一块, 函数标志用以规定该函数是否可以后台循环, 是否被忽略等
     * <br>参数1 参数2 ... 为第二块，一行正确的备注只有这两块，参数由空格或换行分割，大小写敏感，中文不敏感
     * <br>详细格式参考skills.xml, 详细工具函数参考该脚本的jsdoc文档
     * @namespace ScriptableQueryObject
     * @property {string} color - 按钮的颜色，使用 CSS 颜色值表示
     */

    const __version = `0.1`;
    let ID = 0;

    let common = {};
    
    /**
     * 所有序列对象结构的父类
     * @memberof ScriptableQueryObject
     * @class
     */
    function contexter() { this.initialize(...arguments) };
    contexter.prototype.initialize = function(source){
        this.source = source;
        this.id = (ID++);
        this.query = new Map();
        this.cache = new Map();
        this.currentQueries = new Map();
        this.gccb = new Map();
        this.cache.set('id', this.source.id);
        this.cache.set('this', this);
        this.cache.set('exe', this.exec.bind(this));
    }
    contexter.prototype._splitArgs2List = function(){
        const spilter = '..';
        let args = [];
        let temp = [];
        Array.from(arguments).forEach((a)=>{
            if(a == spilter){
                args.push(temp);
                temp = [];
                return;
            }
            temp.push(a);
        })
        if(temp.length){
            args.push(temp);
        }
        return args;
    }
    contexter.prototype.exec = function(data){
        if(this.__gcing) return;
        if(!this._execMeetConditions(data)) return;
        let result;
        if(!Array.isArray(data.list)){
            let result;
            result = this._exec(data.list);
            return result;
        }
        data.list.forEach((d)=>{
            result = this._exec(d);
        })
        return result;
    }
    contexter.prototype._throw = function(m){
        throw new Error(`${m} ${this.constructor.name} ${this.source.id} ${this._execingName}`);
    }
    contexter.prototype._exec = function(data){
        this._execingName = data.name;
        if(!data.source){
            this._throw('data.source');
        }
        let args1 = data.args || [];
        let cache = this.cache;
        let args = [];
        args1.forEach((a)=>{
            if(typeof(a) == 'function'){
                if(a.as && a.as.Func){
                    args.push(this._a(a));
                    return;
                }
                args.push(this._a(a)());
                return;
            }
            args.push(a);
        })
        let result = this._a(data.source)(...args);
        let cacheName = data.cached;
        if(cacheName){
            result ? result.__cacheId = cacheName : null;
            cache.set(cacheName, result);
        }
        return result;
    }
    contexter.prototype.float = function(value, r){
        return value;
    }
    /**
     * 条件判定响应:最大执行次数, 执行频率, 类if的?!表达式,
     * @todo 类sendMessage的事件响应或  get/set响应
     * @param {object} data
     * @returns {any}
     */
    contexter.prototype._execMeetConditions = function(data){
        let f = data.flags;
        if(!f) return true;
        if(f.max != undefined && f.max <= 0) return;
        if(f.cycle != undefined && (f._cyclelog++) % f.cycle) return;
        let cons = f.cons;
        if(!cons){
            f.max--;
            return true;
        }
        let length = cons.length;
        for(let i=0; i<length; i++){
            let a = cons[i];
            let r = a;
            if(typeof(a) == 'function'){
                r = this._a(a)();
            }
            if(!r) return;
        }
        f.max--;
        return true;
    }
    contexter.prototype.sharelite = function(){
        if(!arguments[0]){
            this._sharelite = new Map();
            return;
        }
        this._sharelite = this._sharelite || new Map();
        let args = Array.from(arguments);
        // args.splice(0, 1);
        let name = args[0];
        let value = args[1];
        if(!value) return;
        args.splice(0, 1);
        args.splice(0, 1);
        this._sharelite.set(name, { value, scope:args });
        return this._sharelite;
    }

    
    contexter.prototype.getShareLite = function(name, filter){
        let target = this._sharelite;
        if(!target) return;
        let data = target.get(name);
        if(!data) return;
        if(filter && !filter(this, data)) return;
        return data;
    }
    /**
     * 特性collect
     * @param {contexter} instance 序列实例
     * @param {string} trait 特性名
     * @returns {undefined|object} 特性信息(计算公式和过滤)
     */
    // contexter.prototype._warmingGet = function(name, filter){
    //     let target = this._warming;
    //     if(!target) return;
    //     let data = target.get(name);
    //     if(!data) return;
    //     if(filter && !filter(this, data)) return;
    //     return data;
    // }
    contexter.prototype._gcSafe = function(){
        //safegc
        let destroy = this.query.get('destroy');
        if(destroy){
            destroy.push(this.slice('gc'));
            // console.log(`destroy query of ${this.source.id} auto-gc added`);
        }
        else{
            this.query.set('destroy', this._build('#gc'));
        }
    } 
    /**
     * 对应序列暂停
     * @param {number} value 时间
     * @returns {undefined}
     */
    contexter.prototype.pause = function(value){
        let query = this._execingQuery;
        if(!query) return;
        query.__pause = value;
    }
    contexter.prototype.updatePause = function(value){
        this.currentQueries.forEach((q)=>{
            // if(q.__pause > 0){
            //     q.__pause--;
            // }
            // for(let i = 0; i < q.__index; i++){
            //     let data = q[i];
            //     this.exec(data);
            // }
        })
    }
    /**
     * 开启一个序列
     * @param {string} name 序列名
     * @returns {undefined}
     */
    contexter.prototype.hook = function(name, reset = true, build = false, run = false){
        if(this.currentQueries.get(name)) return;
        if(name == 'destroy'){
            this.hookoff();
        }
        let target = this.query.get(name);
        if(build && !target){
            target = this.build(name);
        }
        if(!target) return;
        this.currentQueries.set(name, target);
        if(reset){
            this.resetQuery(target);
        }
        if(run){
            this.run(name);
        }
    }
    contexter.prototype.buildTest = function(){

    }
    contexter.prototype.setCache = function(context = this){
        if(!(context instanceof contexter)){
            // let args = Array.from(arguments);
            return this.setCache(getQuery(context), ...arguments);
        }
        let args = Array.from(arguments).slice(1, arguments.length-1);
        args.forEach((v, i)=>{
            if(!(i % 2)) return;
            context.cache.set(args[i+1], v);
        })
    }
    contexter.prototype.getCache = function(context = this, key){
        if(!(context instanceof contexter)){
            let args = Array.from(arguments);
            return this.getCache(getQuery(context), ...args.slice(1, args.length));
        }
        let result = context.cache.get(key);
        return result;
    }
    contexter.prototype.resetQuery = function(target){
        target.__index = 0;
        target.__pause = 0;
        target.hookingQuery = new Map();
    }
    /**
     * 关闭一个序列
     * @param {string} name 序列名
     * @returns {undefined}
     */
    contexter.prototype.hookoff = function(name){
        if(!name){
            this.currentQueries = new Map();
            return;
        }
        this.currentQueries.delete(name);
    }
    contexter.prototype.destroy = function(reset){
        this.hook('destroy', reset);
    }
    /**
     * 关闭一个序列
     * @param {string} name 序列名
     * @returns {undefined}
     */
    contexter.prototype.export = function(obj, key){
        let __export = this.cache.get('__export');
        if(!__export){
            this.cache.set('__export', {});
            return this.export(...arguments);
        }
        __export[key] = obj;
        return obj;
    } 
    /**
     * 关闭一个序列
     * @param {string} name 序列名
     * @returns {undefined}
     */
    contexter.prototype.import = function(any){
        let q = getQuery(any);
        if(!q) return;
        return q.cache.get('__export');
    } 
    /**
     * Description
     * @returns {any}
     */
    contexter.prototype.clearcache = function(key){
        Array.from(arguments).forEach((k)=>{
            this.cache.delete(k);
        })
    }   
    contexter.prototype.update = function(){
        this.currentQueries.forEach((q, name)=>{
            this.run(name, q);
        })
    }   
    contexter.prototype.run = function(name, query){
        if(this.__gcing) return;
        query = query || this.query.get(name);
        if(!query) return;
        query.hookingQuery.forEach((data, i)=>{
            this.exec(data);
            if(data.flags && data.flags.max <= 0){
                query.hookingQuery.delete(i);
            }
        })
        if(query.__pause > 0){
            query.__pause--;
            return;
        }
        let length = query.length;
        let start = query.__index;
        for(let i = start; i<length; i++){
            if(query.__pause) break;
            if(!this.currentQueries.get(name)) break;
            let data = query[i];
            this._execingQuery = query;
            this.exec(data);
            this._execingQuery = null;
            if(data.flags && data.flags.max > 0){
                query.hookingQuery.set(i, data);
            }
            query.__index++;
        }
    } 

    
    /**
     * 根据备注和正确格式创建一个序列
     * 通常用于combo等自定义序列
     * @param {string} name 序列名
     */
    contexter.prototype.build = function(name){
        let cached = this._buildFromPre(name);
        if(cached) return cached;
        let reg = new RegExp(`@${name}\n([^@]+)`, 'si');
        let list = reg.exec(this.source.note);
        if(!list) return;
        list = list[1];
        let query = this._build(list);
        if(query){
            this.query.set(name, query);
        }
        return query;
    }
    contexter.prototype._buildFromPre = function(name){
        let map = contexter.preComplied.get(`${this.constructor.name}${this.source.id}`);
        if(!map) return;
        let q = map.get(name);
        if(!q) return;
        // console.log(q);
        let nq = [];
        // let func = new Map();
        q.forEach((data)=>{
            let copyed = this._buildcopy(data);
            // this._buildcopy(newData, data, this);'
            nq.push(copyed);
        })
        // nq.forEach((data)=>{
        //     this._buildcopyfunction(data);
        // })
        this.query.set(name, nq);
        this.resetQuery(nq);
        return nq;
    }
    contexter.prototype._buildcopy = function(v){
        // if(typeof(v) == 'function'){
        //     // let v1 = v.bind(this);
        //     // console.log(v.caler);
        //     // if(v.as){
        //     //     v1.as = v.as;
        //     // }
        //     return v;
        // }
        // else if(['number', 'string', 'boolean', 'undefined'].indexOf(typeof v) >= 0){
        //     return v;
        // }
        if(Array.isArray(v)){
            let n = [];
            v.forEach((v1)=>{
                n.push(this._buildcopy(v1));
            })
            return n;
        }
        else if(typeof(v) == 'object'){
            let n = {};
            for(let i in v){
                n[i] = this._buildcopy(v[i]);
            }
            return n;
        }
        return v;
    }
    contexter.prototype._buildcopyfunction = function(d){
        if(typeof(v) == 'function'){
            d[i] = v.bind(this);
        }
        else if(Array.isArray(v)){
            v.forEach((v1)=>{
                this._buildcopyfunction(v1);
            })
        }
        else if(typeof(v) == 'object'){
            for(let i in v){
                this._buildcopyfunction(v[i]);
            }
        }
    }
    contexter.prototype._build = function(list){
        list = list.split(/#/).map((value)=>{
            value = value.trim();
            value = value.replace(/\（/gi, '(');
            value = value.replace(/\）/gi, ')');
            value = value.replace(/，/gi, ',');
            value = value.replace(/：/gi, ':');
            value = value.replace(/“|”/gi, '"');
            value = value.replace(/？/gi, '?');
            return value;
        }).filter(value=>value.length);
        let query = [];
        while(list.length){
            let value = list.shift();
            let obj = this.slice(value);
            if(obj && obj.list){
                query.push(obj);
            }
        }
        this.resetQuery(query);
        return query;
    }
    contexter.prototype._slice = function(value){
        let ca = value.match(/\{/g);
        let cb = value.match(/\}/g); 
        if(ca && cb && (ca.length != cb.length)){
            this._throw(`大括号和小括号数量必须相同! ${value}`);
        }  
        if(/=>.*\n/i.test(value)){
            let result = this._sliceSplitBlock(value);
            return result;
        }
        let result;
        if(!ca){
            result = value.split(/\s+/g);
        }
        else{
            result = this._sliceSplitBraces(value);
        }
        return result;
    }
    contexter.prototype._sliceSplitBlock = function(input){
        let re = /(=>.*)\n/i;
        // let name = re.exec(input)[1];
        let p = input.split(re);
        let pa = p[0];
        let name = p[1];
        let pb = p[2];
        pb = pb.replace(/\n\s*el/g, '\nelse');
        pb = pb.replace(/\n\s*ef/g, '\nelse if');
        let flags = this._slice(pa);
        let result = flags.concat([name, pb]);
        result = result.filter((v)=>{
            return /[^\s]/i.test(v);
        })
        result.start = flags.start || 0;
        return result;
    }
    contexter.prototype._sliceSplitBraces = function(input){
        let results = [];
        let braceCount = 0;
        let v1 = '';
        let blockBreak = false;
        let save = (i)=>{
            if(braceCount) return;
            let v2 = v1.trim();
            if(!v2) return;
            results.push(v2);
            v1 = '';
            return true;
        }
        for (let i = 0; i < input.length; i++) {
            if(blockBreak){
                break;
            }
            let v = input[i];
            if (v === '{') {
                save(i);
                v1 += v;
                braceCount++;
            } 
            else if (v === '}') {
                braceCount--;
                v1 += v;
                save(i);
            } 
            else {
                v1 += v;
            }
            
        }
        save();
        let count = 0;
        let startDone = false;
        let newResult = [];
        // if(blockBreak){
        //     let r = results.splice(results.length-1, 1);
        //     blockBreak = r[0] + input.slice(blockBreak, input.length);
        //     blockBreak = blockBreak.replace(/^=>/i, '');
        //     blockBreak = blockBreak.trim();
        // }
        for(let i=0; i<results.length; i++){
            let s = results[i];
            //block兼容，原生块保留所有字符
            // console.log(s);
            if(!/\{/i.test(s)){
                s = s.split(/\s+/i).map(s1=>{return s1.trim()}).filter(s1=>s1.length);
                newResult = newResult.concat(s);
            }
            else{
                newResult.push(s);
            }
            if(!startDone && /\{/i.test(s)){
                count++;
            }
            else{
                startDone = true;
            }
        }
        newResult.start = count;
        if(blockBreak){
            // newResult.push('=>');
            let body = input.slice(blockBreak, input.length);
            newResult.push(body);
        }
        return newResult;
    }
    // 指令编译
    contexter.prototype.slice = function(value){
        // 已编译过
        if(value && value.list){
            return value;
        }
        if(!value) return;
        value = value.trim();
        if(!value) return;
        // 注释
        if(/^0/i.test(value)) return;
        let result = this._slice(value);
        let start = result.start || 0;
        let flagList = result.slice(0, start);
        // 条件
        let flags = {};
        flagList.forEach((v)=>{
            this.warmFlags(v.replace(/\{|\}/g, ''), flags);
        })
        result = result.slice(start, result.length);
        let newResult = [];
        let temp = [];
        // 多个指令
        result.forEach((v)=>{
            if(/^\.\+/i.test(v)){
                newResult.push(temp);
                temp = [];
                return;
            }
            temp.push(v);
        })
        newResult.push(temp);
        let obj = { };
        let list = [];
        // 逐指令解释
        newResult.forEach((r)=>{
            list.push(this._sliceEx(r));
        })
        if(list.length <= 1){
            list = list[0];
        }
        let needFlags = (Object.entries(flags).length > 0);
        if(needFlags){
            Object.assign(obj, { flags });
        }
        Object.assign(obj, { list });
        return obj;
    }
    contexter.prototype._sliceEx = function(result){
        let entry = this.warmEntry(result[0]);
        if(!entry) return;
        let obj = entry;
        let args = result.slice(1, result.length);
        // 240517 BY 伪原生块 (new Function)
        if(entry.name == '=>') {
            let source = this.warmArg(result[1], 'block', true);
            // this._sliceAsBlock(args, entry);
            // obj = Object.assign({}, entry);
            obj = Object.assign(obj, {source});
        }
        else if(args.length){
            // 参数
            obj = Object.assign({}, entry);
            args = args.map((v)=>{
                let result = this._sliceArgs(v);
                return result;
            })
            Object.assign(obj, { args });
        }
        return obj;
    }
    contexter.prototype._sliceAsBlock = function(args, entry){
        let str = '';
        args.forEach((v)=>{
            str += v;
        })
        str = str.replace(/el\s*/g, 'else\t');
        str = str.replace(/ef\s*\(/g, 'else if(');
        let source = this.warmArg(str, 'block', true);
        Object.assign(entry, { source, name:'=>' });
        return entry;
    }
    contexter.prototype._sliceArgs = function(v){
        let sp = /^\{\./i.test(v);
        let a = v.replace(/^\{|\}$/g, '');
        a = a.trim();
        if(!sp){
            let a1 = this.warmArg(a, 'value');
            return a1;
        }
        let c = a.slice(0, 2)[1];
        if(c.trim){
            c = c.trim();
        }
        a = a.slice(2, a.length);
        a = a.trim();
        let a1 = a;
        if(!c || c == 'F'){
            a1 = this.warmArg(a, 'value', true);
            a1.as = a1.as || {Func:true};
        }
        else if(c == 'S'){
            a1 = a;
            // Dangerous 
            return this.slice(a1);
        }
        // else if(c == 'A'){
        //     a1 = a;
        // }
        // else if(c == 'J'){
        //     a1 = a;
        // }
        return a1;
    }
    contexter.prototype.warmFlags = function(v, flags){
        if(/^\?|^\!/.test(v)){
            let con = this.warmArg(v.replace(/^\?/, ''));
            flags.cons = flags.cons || [];
            flags.cons.push(con);
        }
        else if(/^\+/.test(v)){
            let max = this.warmArg(v.replace(/^\+/, ''));
            let n = Number(max);
            if(!n){
                flags.max = Infinity;
            }
            else{
                flags.max = n;
            }
        }
        else if(/^\%/.test(v)){
            let cycle = this.warmArg(v.replace(/^\%/, ''));
            flags.cycle = cycle;
            flags._cyclelog = 0;
        }
    }   
    contexter.prototype.warmEntry = function(value1){
        if(!value1) return;
        let entry1 = value1.split(/:/i);
        // let chaining = entry1[0].split(/\./i);
        let name = entry1[0];
        let cached = entry1[1];
        let entry = {name};
        if(name == '=>') {
            if(cached){
                entry.cached = cached;
            }
            return entry;
        }
        let source = this.warmArg(name, 'function');
        // 自己的方法
        if(!source){
            this._throw(`检查指令 ${value1}`);
        }
        entry = { source, name };
        if(cached){
            entry.cached = cached;
        }
        return entry;
    }
    /**
     * 核心: 定义参数获取规则，通常是一个函数
     * @param {string} a 任意字符串
     * @param {object} options={type:'value'} 类型和设置
     * @returns {function|string|number} 
     */
    contexter.prototype.warmArg = function(a, type = 'value', ignoreSimple = false){
        let vars = a.match(/(?<!\^)(\$[a-z\d]+)/gi);
        let global = /\^/.exec(a);
        if(!vars && !global && type == 'function'){
            return this[a];
        }
        if(!vars && !global && !ignoreSimple) return this.warmArgSimple(a);
        let args = JSON.parse(JSON.stringify(vars || []));
        let set = new Set();
        args.forEach((a)=>{
            set.add(a.trim());
        })
        args = Array.from(set);
        let fnList = JSON.parse(JSON.stringify(args));
        a = a.replace(/\^/g, '');
        let caler, log, _bound, result;
        _bound = 'dynamicValue';
        let t = type.toLowerCase();
        if(t == 'block'){
            log = `${a}`;
        }
        else if(t == 'value'){
            log = `let result = ${a}; 
            return result;`;
        }
        else if(t == 'function'){
            let callerFix = `
                let args = Array.from(arguments).slice(1, arguments.length);
                let any = ${a}(...args);
                return any;
            `
            let common = `
                let any = ${a}(...arguments);
                return any;
            `
            log = common;
            if(args.length){
                log = callerFix;
            }
            _bound = 'dynamicContext';
        }
        fnList.push(log);
        // console.log(log, this.source.id, this.constructor.name);
        caler = new Function(...fnList);
        result = this[_bound](args, caler);
        if(!result) return;
        let r = result;
        return r;
    }
    // 240520 TODO 不要频繁bind
    contexter.prototype._a = function(func){
        return func.bind(this);
    }
    contexter.prototype.dynamicContext = function(args, caler){
        let result = function(){
            // console.log(this.constructor.name + '  ' + this.source.id);
            let a = [];
            if(args[0]){
                let name = args[0];
                let cache = this.cache.get(name.replace(/\$/, ''));
                a.push(cache);
            }
            // console.log(this.source.id, this.constructor.name);
            let newArgs = Array.from(arguments);
            // console.log(this);
            a = a.concat(newArgs);
            return caler(...a);
        }
        result.caler = caler;
        return result;
    }
    contexter.prototype.dynamicValue = function(args, caler){
        let result = function(){
            // console.log(this.constructor.name + '  ' + this.source.id);
            let a = [];
            args.forEach((name)=>{
                let cache = this.cache.get(name.replace(/\$/, ''));
                a.push(cache);
            })
            // console.log(this);
            return caler(...a);
        }
        result.caler = caler;
        return result;
    }
    contexter.prototype.warmArgSimple = function(a){
        if(!a) return a;
        if(a.toLowerCase() == 'true') return true;
        if(a.toLowerCase() == 'false') return false;
        if(a.toLowerCase() == 'null') return null;
        if(a.toLowerCase() == 'undefined') return undefined;
        if(/^\s*0x/i.test(a)){
            return a;
        }
        if(!/[a-z]|[=<>]/i.test(a) && (/\d/i.test(a))){
            return eval(a);
        }
        let f = parseFloat(a);
        if(!isNaN(f)){
            return f;
        }
        return a.trim();
    }
    
    /**
     * 更加传入的参数获取一个值,
     * 参数长度大于1返回数组或一个Map
     * @returns {undefined}
     */
    contexter.prototype.value = function(){
        if(arguments.length<2){
            return arguments[0];
        }
        let array = Array.from(arguments);
        return array;
    }
    contexter.prototype.json = function(t2map){
        
    }
    /**
     * 获取对象.属性名
     * @param {object} obj 对象
     * @param {string} name 属性名
     * @returns {undefined} 值
     */
    contexter.prototype.prop = function(obj, name){
        return obj[name];
    }
    /**
     * 自定义函数
     * @deprecated
     * @param {string} a 缓存的函数名或函数体
     * @returns {undefined} 
     * 如果第一个参数是(a,b){...}这样的函数体则返回一个通过new Function生成的函数,
     * 如果第一个参数是函数的名字，后续参数则是这个函数的参数，返回执行后的结果
     */
    contexter.prototype.fn = function(){
        let value = arguments[0];
        let args = Array.from(arguments);
        args.splice(0, 1);
        if(typeof(value) == 'function'){
            let result = value(...args);
            return result;
        }
        this._throw(`未找到${value}`);
    }
    /**
     * 预编译一个临时函数
     * @returns {any}
     */
    contexter.prototype.prefn = function(){
        return new Function(...arguments);
    }
    // todo 连接不同备注的相同部分 精简
    contexter.prototype.concat = function(id){
        let CLASS = this.CLASS;
        if(!CLASS.const || !CLASS.const.database) return;
        let database = CLASS.const.database;
    }
    contexter.prototype.preComplieFn = function(){
        this.query.forEach((q)=>{
            let length = q.length;
            let removedCount = 0;
            for(let i=0; i<length; i++){
                let data = q[i - removedCount];
                if(!/^fn/i.test(data.name)) continue;
                let f = this.exec(data);
                if(typeof(f) == 'function'){
                    q.splice(i - removedCount, 1);
                    removedCount++;
                }
            }
        })
    }
    contexter.prototype.eval = function(e){
        // console.log(this.cache.get('action').s2);
        // return e();
    }
    // TODO 侦听而非逐帧判定
    contexter.prototype.listen = function(type, object, propname){
        if(object.hasOwnProperty(propname)) return;
        this.cache[propname + Date.now()]
        Object.defineProperty(object, propname, {
            get: function(){
                this.cache[propname + Date.now()];
            },
            set: function(v){
                
            }
        })
    }
    
    contexter.prototype._gccb = function(any, cb){
        if(!cb || !any) return;
        this.gccb.set(any, cb);
        return any;
    }
    /**
     * 回收，真正销毁序列对象
     * @param {any} any 
     * @returns {undefined}
     */
    contexter.prototype.gc = function(any){ 
        if(!any || any.length < 2){
            this.cache.forEach((any)=>{
                let cb = this.gccb.get(any);
                cb ? cb() : 0;
            })
            this.__gcing = true;
            this.CLASS.running.delete(this.id);
            contexter.running.delete(this.id);
            return;
        }
        this.cache.delete(any.__cacheId);
        let cb = this.gccb.get(any);
        this.gccb.delete(any);
        cb ? cb() : 0;
        return any;
    }
    contexter.prototype._test = function(){
        let name = 'test';
        this.hook(name, true, true, true);
        if(this.__gcing) return;
        return true;
    }
    /**
     * 调试，打印
     * @param {any} v
     * @returns {undefined}
     */
    contexter.prototype.log = function(){
        if(arguments.length > 1){
            console.group(`${this.constructor.name} ${this.source.id}`);
            Array.from(arguments).forEach((v)=>{
                console.log(v);
            })
            console.groupEnd();
        }
        else{
            console.log(...arguments);
        }
    }



    function Game_CharacterSkill() {
        this.initialize(...arguments);
    }
    Game_CharacterSkill.prototype = Object.create(Game_CharacterBase.prototype);
    Game_CharacterSkill.prototype.constructor = Game_CharacterSkill;
    
    Game_CharacterSkill.prototype.setupSprite = function(characterName){
        this._characterName = characterName;
        let sprite = new Sprite_Character(this);
        // sprite.removeAllChildren();
        return sprite;
    };


    let Game_CharacterSkill_update = Game_CharacterSkill.prototype.update;
    Game_CharacterSkill.prototype.update = function(){
        this.updateAnimation();
        this.updatePose();
    }
    
    Game_CharacterSkill.prototype.qSprite = function() {
        return QSprite.json[this.isQCharacter()] || null;
    };

    /**
     * 技能对象
     * @memberof ScriptableQueryObject
     * @extends contexter
     * @class 
     */
    function Skill() { this.initialize(...arguments) };
    Skill.prototype = Object.create(contexter.prototype);
    Skill.prototype.constructor = Skill;
    Skill.const = {
        dirRad:{
            6:0, 3:Math.PI*0.25, 2:Math.PI*0.5, 1:Math.PI*0.75, 4:Math.PI*1,
            7:Math.PI*1.25, 8:Math.PI*1.5, 9:Math.PI*1.75, 5:0, 0:0
        },
        database:()=>{
            return $dataSkills;
        }
    }
    Skill.prototype.setup = function(){
        this.cache.set('a', this._battler);
        this.cache.set('b', null);
        this.CLASS = Skill;
        this.build('life');
        this.build('destroy');
        this.build('trigger');
        this.build('damage');
        this.setting();
        this.hook('life');
        Skill.running.set(this.id, this);
        contexter.running.set(this.id, this);
        return this;
    }
    Skill.prototype.pay = function(type, value){
        type = type.toLowerCase();
        if(this._battler[type] < value) return;
        switch(type){
            case 'hp':{
                this._battler._hp -= value;
                break;
            }
            case 'tp':{
                this._battler._tp -= value;
                break;
            }
            case 'mp':{
                this._battler._mp -= value;
                break;
            }
        }
        return true;
    }
    /**
     * 开始销毁序列
     * @param {boolean} reset 重置序列的索引(重头开始)
     * @returns {any}
     */
    Skill.prototype.destroy = function(reset){
        this.hook('destroy', reset);
    }
    /**
     * 开始伤害序列
     * @param {boolean} reset 重置序列的索引(重头开始)
     * @returns {any}
     */
    Skill.prototype.damage = function(reset){
        this.hook('damage', reset);
    }
    Skill.prototype.setting = function(){
        this._gcSafe();
        this.query.get('trigger');
    }
    /**
     * 对象a和b之间的弧度
     * @param {object} a
     * @param {object} b
     * @returns {number} 弧度
     */
    Skill.prototype.radian2 = function(a, b){
        a = a.mapObject ? a.mapObject : a;
        b = b.mapObject ? b.mapObject : b;
        if(!a || !b) return;
        let ax = a._realX == undefined ? a.x : a._realX;
        let bx = b._realX == undefined ? b.x : b._realX;
        let ay = a._realY == undefined ? a.y : a._realY;
        let by = b._realY == undefined ? b.y : b._realY;
        let r = Math.atan2(ay - by, ax - bx);
        return r;
    }
    /**
     * 获取角色方向
     * @param {Game_Character|Game_Battler|Prefab} c 角色
     * @returns {number} 角色的方向
     */
    Skill.prototype.dir = function(c){
        c = c.mapObject;
        if(!c) return;
        return c._direction;
    }
    /**
     * 小键盘8方向转弧度
     * @param {number} dir 方向
     * @returns {number} 弧度
     */
    Skill.prototype.dir2Radian = function(dir){
        return Skill.const.dirRad[dir];
    }
    /**
     * 角度转弧度
     * @param {number} a 角度
     * @returns {number} 弧度
     */
    Skill.prototype.angle2Radian = function(a){
        return Math.PI * (a / 180);
    }
    /**
     * 创建一个碰撞器
     * @param {number} w 宽度
     * @param {number} h 长度
     * @param {number} x 水平坐标
     * @param {number} y 垂直坐标
     * @param {string} type 类型，默认矩形,rect
     * @returns {object} 碰撞器
     */
    Skill.prototype.collider = function(){
        let param = Array.from(arguments);
        // param.splice(param.length-1, 1);
        let c = UtilsExtend.matter.createFromParamsNoOffset(param, { mass:0.25 });
        // Matter.Body.setPosition(c, { x, y });
        this._gccb(c, this._removeCollider.bind(this, c));
        c.isSensor = true;
        c.label = 'skill';
        SceneManager._scene.addBody(c);
        return c;
    }
    Skill.prototype._removeCollider = function(collider){
        collider._removed = true;
        SceneManager._scene.removeBody(collider);
    }
    /**
     * 为碰撞器A应用一个力
     * @param {object} collider 碰撞器A
     * @param {number} value 力度
     * @param {number} radian 弧度
     * @param {boolean} rotate=true 是否根据弧度旋转
     * @param {string} type 类型，默认推力, push
     * @returns {object} 碰撞器A
     */
    Skill.prototype.force = function(collider, value, radian, rotate=true, type){
        if(!collider) return;
        radian = radian || 0;
        type = type || 'push';
        UtilsExtend.matter.Force(type, collider, radian, 0, value);
        if(rotate){
            Matter.Body.setAngle(collider, radian);
        }
        return collider;
    }
    /**
     * 为使用者加一个状态
     * @param {any} id
     * @param {any} target=this._battler 目标
     * @returns {any}
     */
    Skill.prototype.addState = function(id, target = this._battler){
        
        let add = target.gameObject.addState(id);
        return add;
    }
    /**
     * @param {any} collider
     * @param {any} radian
     * @param {any} type
     * @returns {undefined}
     */
    Skill.prototype.tween = function(collider, radian, type){
        
    }
    /**
     * @returns {undefined}
     */
    Skill._createSkillOjbectMap = function(){
        let skillObjectMap = SceneManager._scene._skillObjectMap;
        if(skillObjectMap) return skillObjectMap;
        let map = new Sprite();
        map.z = 100;
        // 单独的技能对象层
        SceneManager._scene._spriteset._tilemap.addChild(map);
        skillObjectMap = SceneManager._scene._skillObjectMap = map;
        return skillObjectMap;
    }
    /**
     * 生成一个精灵，如技能子弹的精灵
     * @param {object} collider 碰撞器
     * @param {string} name 精灵文件名
     * @returns {Sprite} 精灵
     */
    Skill.prototype.sprite = function(collider, name, dir){
        if(!collider || !name) return;
        let skillObjectMap = Skill._createSkillOjbectMap();
        let character = new Game_CharacterSkill();
        let mainSprite = character.setupSprite('&' + name);
        character._direction = dir || 2;
        skillObjectMap.addChild(mainSprite);
        character.clearPose();
        character._movespeed = 3;
        character._moveFrequency = 3;
        character.mainSprite = mainSprite;
        character.collider = collider;
        mainSprite.collider = collider;
        this._gccb(mainSprite, this._removeSprite.bind(this, mainSprite, collider));
        return mainSprite; 
    }
    Skill.prototype._removeSprite = function(s, c){
        if(s && s.parent){
            s.parent.removeChild(s);
        }
        this._removeCollider(c);
    }
    
    /**
     * 同步精灵和碰撞器
     * @param {Sprite} sprite 精灵
     * @param {string} type 类型，pos-位置
     * @param {boolean} rotate 是否同步旋转
     * @param {object=} collider 碰撞器
     * @returns {undefined}
     */
    Skill.prototype.sync = function(sprite, type, rotate, collider){
        if(!sprite) return;
        collider = collider || sprite.collider;
        if(type == 'pos'){
            UtilsExtend.matter.characterSyncBody(collider, sprite._character, -0.5, -1);
            if(rotate != undefined){
                sprite.rotation = collider.angle + rotate;
            }
        }
        // skill mapobject only update here
        sprite._character.update();
        // sprite.updatePosition();
    }
    // let Game_Map_update = Game_Map.prototype.update;
    // Game_Map.prototype.update = function(){
    //     Game_Map_update.call(this, ...arguments);
    //     if(Prefab.runningGroup.skill){
    //         Prefab.runningGroup.skill.forEach((v)=>{
    //             v.mapObject.update();
    //             v.update();
    //         })   
    //     }
    // }
    /**
     * 设置碰撞器A的位置
     * @param {object} collider 碰撞器A
     * @param {number} x 水平坐标
     * @param {number} y 垂直坐标
     * @returns {undefined}
     */
    Skill.prototype.pos = function(collider, x, y){
        Matter.Body.setPosition(collider, { x, y });
    }
    Skill.prototype.speed = function(collider, v = 0){
        Matter.Body.setSpeed(collider, v);
    }
    Skill.prototype.velocity = function(collider, x = 0, y = 0){
        Matter.Body.setVelocity(collider, {x, y});
    }
    /**
     * 把碰撞器A置于碰撞器B前
     * @param {object} collider 碰撞器A
     * @param {object} collider1 碰撞器B
     * @param {number} radian 弧度
     * @param {boolean} rotate 考虑弧度带来的旋转
     * @param {array} offset 偏移
     * @returns {undefined}
     */
    Skill.prototype.front = function(collider, collider1, radian, rotate, offset){
        if(!collider || !collider1) return;
        radian = radian || 0;
        offset = offset || [0, 0];
        let cr = Math.cos(radian);
        let sr = Math.sin(radian);
        let width = collider1.width;
        let height = collider1.height;
        let x = (width + offset[0]) * cr + collider1.position.x; 
        let y = (height + offset[1]) * sr + collider1.position.y;
        Matter.Body.setPosition(collider, { x, y });
        if(rotate){
            Matter.Body.setAngle(collider, radian);
        }
    }
    /**
     * Qsprite角色播放Qsprite动作
     * @param {Game_Character|Game_Battler} chara 角色
     * @param {string} name 动作名
     * @returns {undefined}
     */
    // Skill.prototype.pose = function(name, loop, chara = this._battler){
    //     chara = chara.mapObject;
    //     if(!name){
    //         chara.clearPose();
    //         return;
    //     }
    //     if(!chara) return;
    //     chara.playPose(name, undefined, undefined, loop, undefined);
    // }
    // Skill.prototype._gain = function(user, type, value){
    //     switch(type.toLowerCase()){
    //         case 'hp': return user.gainHp(value);
    //         case 'tp': return user.gainTp(value);
    //         case 'mp': return user.gainMp(value);
    //     }
    // }
    // /**
    //  * 获得血量，蓝量或TP
    //  * @returns {any}
    //  */
    // Skill.prototype.gain = function(){
    //     let user = this._battler;
    //     let values = Array.from(arguments);
    //     values.forEach((v, i)=>{
    //         if(i%2) return;
    //         this._gain(user, v, values[i+1] || 0);
    //     })
    // }
    
    /**
     * 获取碰撞体碰撞到的所有目标
     * @param {object} collider 碰撞体
     * @param {string} team 地图碰撞体组名，如敌人碰撞体组，队伍碰撞体组
     * @param {boolean} nomulti=true 忽略二次伤害
     * @param {boolean} noself=true 忽略施法者
     * @returns {Array} 目标
     */
    Skill.prototype.getTargets = function(collider, team, nomulti = true, noself = true){
        let targets;
        let bodies = [];
        let contexts = new Map();
        let group = Prefab.runningGroup[team];
        if(!group) return;
        this.baseFilter = this.baseFilter || new Map();
        if(noself){
            this.baseFilter.set(this._battler.prefab, true);
        }
        if(nomulti){
            let map = new Map();
            group.forEach((v, key)=>{
                if(this.baseFilter.get(v)) return;
                map.set(key, v);
            })
            group = map;
        }
        this._updateColliderFilterGroup(group, bodies, contexts);
        let result = Matter.Query.collidesWithContexting(collider, bodies, contexts);
        if(result.length > 0){
            targets = [];
            result.forEach((v)=>{
                if(!v) return;
                let prefab = v.contexts;
                targets.push(prefab.gameObject);
                this.baseFilter.set(prefab, true);
            })
        }
        this._targets = targets;
        // if(targets.length){
        //     this.damage();
        // }
        return targets;
    }
    /**
     * @param {Map|Array} group 源碰撞体数组A
     * @param {Array} bodies 目标碰撞体数组B
     * @param {Map} contexts 建立碰撞数据与碰撞体的映射
     * @returns {undefined}
     */
    Skill.prototype._updateColliderFilterGroup = function(group, bodies, contexts){
        if(!group) return;
        group.forEach((prefab)=>{
            // let fsm = prefab.getCache('fsm');
            // if(fsm.noDamages) return;
            let battleCollider = prefab.getCache('battle-collider');
            if(!battleCollider || prefab.gameObject.nodamage) return;
            bodies.push(battleCollider);
            contexts.set(battleCollider, prefab);
        })
    }
    /**
     * <非通用>
     * 获取角色的状态机
     * @param {Game_Battler|Game_Character|Prefab} a 角色
     * @returns {UtilsExtend.fsm} 状态机
     */
    Skill.prototype.fsm = function(a){
        let f = a.getCacheFromPrefab('fsm');
        return f;
    }
    Skill.prototype.farFumoAni = function(a){
        if(a instanceof Sprite){
            a = a._character;
        }
        let id = $gamePlayer.getFuMoGTAnimation(this.source.id, 'far');
        if(id){
            GT_Animation.ShowGTAniForCharacter(a, id);
        }
    }
    Skill.prototype.aoyieffect = function(targets){
        if(targets && targets.length){
            targets.forEach((t)=>{
                if(!t.mapObject) return;
                GT_Animation.ShowGTAniForCharacter(t.mapObject, 47, 0, -135);
            })
        }
        $gameScreen.startFlash([255, 0, 0, 128], 8);
        $gameScreen.startShake(5,5,10);
    }
    Skill.prototype.setdir = function(v, target = this._battler){
        target = target.mapObject;
        if(!target) return;
        target._direction = v;
    }
    Game_Temp.setAIstop = function(value){
        $gameTemp.allAIstop = value;
    }
    
    /**
     * <非通用>
     * 技能进入冷却
     * @param {number} time 冷却时间
     * @returns {undefined} 
     */
    Skill.prototype.cd = function(time){
        // console.log(time);
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if(!fsm) return;
        fsm.lockSkillFromAnySource('cd', this.source.id, {time});
    }
    /**
     * <非通用>
     * 获取某个角色的战斗判定碰撞器
     * @param {Game_Battler|Game_Character|Prefab} a 角色
     * @returns {object} 战斗碰撞器
     */
    Skill.prototype.battleCollider = function(a){
        a = a || this._battler;
        let c = a.getCacheFromPrefab('battle-collider');
        return c;
    }
    /**
     * <非通用>
     * 获取某个角色的移动碰撞器
     * @param {Game_Battler|Game_Character|Prefab} a 角色
     * @returns {object} 移动碰撞器
     */
    Skill.prototype.matter = function(a){
        a = a || this._battler;
        let c = a.getCacheFromPrefab('matter').collider;
        return c;
    }
    /**
     * <非通用>
     * 让使用者的状态机从施法状态中解放出来
     * @returns {undefined} 
     */
    Skill.prototype.free = function(){
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if(!fsm) return;
        fsm.currentState = fsm._preState || fsm.idle;
    }
    /**
     * <非通用>
     * 角色数据缓存
     * @param {Game_Battler|Game_Character} character 角色
     * @param {string} name 缓存名字
     * @returns {undefined} 任意缓存数据
     */
    Skill.prototype.getCache = function(character, name){
        if(!character) return;
        if(character instanceof contexter){
            return character.getCache(name);
        }
        return character.getCacheFromPrefab(name);
    }
    
    
    Skill.prototype.typeDir = function(type){
        type = type || 'gtdir';
        let obj = this._battler.mapObject;
        if(!obj) return;
        if(type == 'gtdir'){
            return Input.dir8 || obj._direction;
        }
    }
    Skill.prototype.typeRadian = function(type){
        if(type == 'gtdir'){
            return this.dir2Radian(Input.dir8 || $gamePlayer._direction);
        }
        else if(type == 'm' || type == 'mouse'){
            $gamePlayer.freshDirBeforeSkillType('mouse');
            return this.angle2Radian($gamePlayer._GTdeg - 90);
        }
    }
    Skill.prototype.getState = function(id){
        let s = State.running.get(this._battler._fakeStates[id]);
        return s;
    }
    Skill.prototype.combo1 = function(id){
        // console.log(id);
        if(TouchInput.isTriggered()){
            let fsm = this._battler.getCacheFromPrefab('fsm');
            if(!fsm) return;
            let skill = fsm.useSkill(id, true);
            return skill;
        }
    }
    Skill.prototype.playerAni = function(id){
        if($gamePlayer._direction == 2){
            GT_Animation.ShowGTAniForPlayer(id,10,-40);
        }
        if($gamePlayer._direction == 4){
            GT_Animation.ShowGTAniForPlayer(id,10,-46);
        }
        if($gamePlayer._direction == 6){
            GT_Animation.ShowGTAniForPlayer(id,-16,-46);
        }
        if($gamePlayer._direction == 8){
            GT_Animation.ShowGTAniForPlayer(id,-24,-52);
        }
    }
    Skill.prototype.animRemove = function(anim){
        if(!anim || !anim.parent) return;
        anim.parent.removeChild(state.anim);
    }
    // Skill.prototype.noDamages = function(value, add){
    //     let fsm = this._battler.getCacheFromPrefab('fsm');

    //     if(add){
    //         fsm.noDamages += value;
    //         return;
    //     }
    //     fsm.noDamages = value;
    // }
    Skill.prototype.correctFarAtk = function(){
        let name = `DD2-fuzhi-${$gamePlayer._FuMoPnow}_2x1`;
        return name;
    }
    Skill.prototype.freshDirBeforeSkill = function(){
        $gamePlayer.freshDirBeforeSkill();
    }
    Skill.prototype.unpress = function(name, time){
        let tTimes = Array.from(arguments).slice(2, arguments.length);
        if(!tTimes.length) return 0;
        let result = !(Input.pressingBehav(name));
        if(!result) return;
        let r = 0;
        tTimes.forEach((v, i)=>{
            if(time > v){
                r = i + 1;
            }
        })
        return r;
    }
    /**
     * 屏幕抖动
     * @returns {any}
     */
    Skill.prototype.shake = function(){
        $gameScreen.startShake(...arguments);
    }
    Skill.prototype.freeze = function(id = this.source.id, source){
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if(!fsm) return;
        fsm.lockSkillFromAnySource('freeze', id, source || this);
    }
    Skill.prototype.unfreeze = function(id, source){
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if(!fsm) return;
        fsm.unlockSkillFromAnySource('freeze', id, source || this);
    }
    /**
     * 使用技能
     * @param {number} id 技能ID
     * @param {boolean} destroy 销毁当前技能
     * @returns {Skill|undefined} 技能
     */
    Skill.prototype.useskill = function(id, destroy){
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if(!fsm) return;
        let skill = fsm.useSkill(id);
        if(destroy){
            this.destroy();
        }
        return skill;
    }
    /**
     * <非通用>
     * 为目标们应用技能效果
     * @param {array} targets 目标
     * @returns {object} 技能效果(Game_Action)
     */
    Skill.prototype.action = function(targets){
        this._action = null;
        if(!targets || !targets.length) return;
        let user = this._battler.gameObject;
        // console.log(user);
        let action = new Game_ActionAdvance(user, { query:this }); //battler
        action.setSkill(this.source.id);
        this.cache.set('action', action);
        targets.forEach((t)=>{
            action.beforeApply(t);
        })
        return action;
    }
    
    
    /**
     * 状态对象
     * @memberof ScriptableQueryObject
     * @extends contexter
     * @class 
     */
    function State() { this.initialize(...arguments) };
    State.prototype = Object.create(contexter.prototype);
    State.prototype.constructor = State;
    State.const = {
        traits:{
            // ATtacK power
            mhp: {code:21, dataId:0, value:0},
            // DEFense power
            mmp: {code:21, dataId:1, value:0},
            // ATtacK power
            atk: {code:21, dataId:2, value:0},
            // DEFense power
            def: {code:21, dataId:3, value:0},
            // Magic ATtack power
            mat: {code:21, dataId:4, value:0},
            // Magic DeFense power
            mdf: {code:21, dataId:5, value:0},
            // AGIlity
            agi: {code:21, dataId:6, value:0},
            // LUcK
            luk: {code:21, dataId:7, value:0},
            // HIT rate
            hit: {code:22, dataId:0, value:0},
            // EVAsion rate
            eva: {code:22, dataId:1, value:0},
            // CRItical rate
            cri: {code:22, dataId:2, value:0},
            // Critical EVasion rate
            cev: {code:22, dataId:3, value:0},
            // Magic EVasion rate
            mev: {code:22, dataId:4, value:0},
            // Magic ReFlection rate
            mrf: {code:22, dataId:5, value:0},
            // CouNTer attack rate
            cnt: {code:22, dataId:6, value:0},
            // Hp ReGeneration rate
            hrg: {code:22, dataId:7, value:0},
            // Mp ReGeneration rate
            mrg: {code:22, dataId:8, value:0},
            // Tp ReGeneration rate
            trg: {code:22, dataId:9, value:0},
            // TarGet Rate
            tgr: {code:23, dataId:0, value:0},
            // GuaRD effect rate
            grd: {code:23, dataId:1, value:0},
            // RECovery effect rate
            rec: {code:23, dataId:2, value:0},
            // PHArmacology
            pha: {code:23, dataId:3, value:0},
            // Mp Cost Rate
            mcr: {code:23, dataId:4, value:0},
            // Tp Charge Rate
            tcr: {code:23, dataId:5, value:0},
            // Physical Damage Rate
            pdr: {code:23, dataId:6, value:0},
            // Magic Damage Rate
            mdr: {code:23, dataId:7, value:0},
            // Floor Damage Rate
            fdr: {code:23, dataId:8, value:0},
            // EXperience Rate
            exr: {code:23, dataId:9, value:0},
        },
        traitsReverse:{},
        database:()=>{
            return $dataStates;
        }
    }
    for(let name in State.const.traits){
        let data = State.const.traits[name];
        State.const.traitsReverse[`${data.code}${data.dataId}`] = name;
    }
    // State.prototype.noDamages = function(value, add){
    //     let fsm = this._battler.getCacheFromPrefab('fsm');
    //     if(add){
    //         fsm.noDamages += value;
    //         return;
    //     }
    //     fsm.noDamages = value;
    // }
    State.prototype.spritedamage = function(target, action = this._action){
        if(!action) return;
        let data = action.applyList.get(target);
        let damageSprite = target.getCacheFromPrefab('damageSprite');
        if(damageSprite){
            damageSprite.setup(target, data.result);
        }
    }
    State.prototype.push = function(a, b, action){
        let meta = action.query.source.meta;
        if(!a || !a.prefab) return;
        if(!b || !b.prefab) return;
        let matter = b.getCacheFromPrefab('matter');
        Matter.Body.setSpeed(matter.collider, 0);
        let toughness1 = Number(meta.toughness) || 1;
        let toughness = a.processMeta('toughness') || 1;
        let force = toughness1 - toughness;
        let battleCollider = b.getCacheFromPrefab('battle-collider');
        let battleCollider1 = a.getCacheFromPrefab('battle-collider');
        // 从某个点对某个碰撞器应用推力
        let radian = Matter.Vector.angle(battleCollider1.position, battleCollider.position);
        UtilsExtend.matter.Force('push', matter.collider, radian, 0, force);
    }
    // State.prototype.pose = function(name, loop, chara = this._battler){
    //     chara = chara.mapObject;
    //     if(!name){
    //         chara.clearPose();
    //         return;
    //     }
    //     if(!chara) return;
    //     chara.playPose(name, undefined, undefined, loop, undefined);
    // }
    // 原生能力值拓展
    let Game_BattlerBase_traitsSum = Game_BattlerBase.prototype.traitsSum;
    Game_BattlerBase.prototype.sparam = function(id){
        let result = Game_BattlerBase_traitsSum.call(this, ...arguments);
        let name = State.const.traitsReverse[`23${id}`];
        let newResult = this._prepareParamCaler(name, result);
        return newResult;
    }
    let Game_BattlerBase_traitsPi = Game_BattlerBase.prototype.traitsPi;
    Game_BattlerBase.prototype.xparam = function(id){
        let result = Game_BattlerBase_traitsPi.call(this, ...arguments);
        let name = State.const.traitsReverse[`22${id}`];
        let newResult = this._prepareParamCaler(name, result);
        return newResult;
    }
    let Game_BattlerBase_param = Game_BattlerBase.prototype.param;
    Game_BattlerBase.prototype.param = function(id) {
        let result = Game_BattlerBase_param.call(this, ...arguments);
        let name = State.const.traitsReverse[`21${id}`];
        let newResult = this._prepareParamCaler(name, result);
        return newResult;
    }
    Game_BattlerBase.prototype._prepareParamCaler = function(name, result){
        if(!this[`param${name}`]) return result; 
        let q = getQuery(this);
        if(!q) return result;
        let data = q.flags.get(name);
        if(!data) return result; 
        q.cache.set('0', result);
        let newResult = data.caler();
        q.cache.delete('0');
        return newResult;
    }
    
    State.prototype.setup = function(){
        this.cache.set('count', 1);
        this.cache.set('a', this._battler);
        this.cache.set('b', this._subject);
        this.cache.set('action', this._action);
        this.CLASS = State;
        let test = this._test();
        if(!test) return;
        this.build('life');
        this.build('destroy');
        this.build('trigger');
        this.setting();
        this.hook('life');
        State.running.set(this.id, this);
        contexter.running.set(this.id, this);
        return this;
    }
    State.prototype.setting = function(){
        this._gcSafe();
        this.query.get('trigger');
    }
    State.prototype.addCount = function(value){
        this.cache.set('count', this.cache.get('count') + value);
        console.log(this.cache.get('count'));
        return this.cache.get('count');
    }
    State.prototype.addState = function(id, target = this._battler){
        let state = target.gameObject.addState(id);
        return state;
    }
    State.prototype.removeState = function(id, target = this._battler){
        // let remove;
        if(target._states.indexOf(id) >= 0){
            target.gameObject.removeState(id);
        }
        if(target._fakeStates[id]){
            let s = State.running.get(target._fakeStates[id]);
            s ? s.destroy() : null;
        }
        return remove;
    }
    
    /**
     * Battler 战斗者序列
     * @memberof ScriptableQueryObject
     * @class
     */
    function Battler() { this.initialize(...arguments) };
    Battler.prototype = Object.create(contexter.prototype);
    Battler.prototype.constructor = Battler;
    function Ene() { this.initialize(...arguments) };
    Ene.prototype = Object.create(Battler.prototype);
    Ene.prototype.constructor = Ene;
    // Ene.prototype.setup = function(){
    //     let s = Battler.prototype.setup.call(this, ...arguments);
    // }
    Battler.prototype.setup = function(){
        this.cache.set('a', this._battler);
        this.CLASS = Battler;
        let test = this._test();
        if(!test) return;
        this.build('life');
        this.build('sprite');
        this.build('destroy');
        this.build('damage');
        this.hook('life');
        this.battlerTemp = {};
        this.flags = new Map();
        Battler.running.set(this.id, this);
        contexter.running.set(this.id, this);
        return this;
    }
    Battler.prototype.trait = function(){
        let args = Array.from(arguments);
        let name = args[0];
        let formula = args[1];
        args.splice(0, 1);
        // let base = this.value(...args);
        Object.defineProperty(this._battler, name, {
            get: function(){
                if(name == 'spe' && this._actorId){
                    name;
                }
                return formula();
            }
        })
        // this._battler[name] = this.traitMake(name);
    }
    Battler.prototype.param = function(name, caler, type = '*'){
        this._battler[`param${name}`] = true;
        this.flags.set(name, { caler, type });
        return caler;
    }
    Battler.prototype.matter = function(){
        this.flags.set('matter', true);
    }
    Battler.prototype._onSprite = function(sprite){
        if(!sprite) return;
        this.cache.set('mysprite', sprite);
        this.hook('sprite', true);
    }
    Battler.prototype._onDamage = function(action, item){
        if(!sprite) return;
        this.cache.set('action', { action, item });
        this.hook('damage', true);
    }
    let Battler_gc = Battler.prototype.gc;
    Battler.prototype.gc = function(){
        let gc = Battler_gc.call(this, ...arguments);
        // 240522 死亡消除逻辑
        if(this.__gcing){
            this.gameObject.prefab.destroy();
            this.gameObject.mapObject.erase();
        }
        return gc;
    }

    // let Battler_hookoff = Battler.prototype.hookoff;
    // Battler.prototype.hookoff = function(name){
    //     Battler_hookoff.call(this, ...arguments);
    //     if(name.toLowerCase() == 'damage' && this.cache.get('action')){
    //         this.cache.delete('action');
    //     }
    // }
    Battler.prototype.sprite = function(name, obj, layer){
        if(!this.cache.get('mysprite')) return;
        let parent = this.cache.get('mysprite');
        if(!layer){
            parent.addChild(obj);
        }
        else if(layer == -1){
            let tilemap = parent.parent;
            if(!tilemap._characterEffector){
                tilemap.addChildAt(tilemap._characterEffector = new Sprite(), 1);
            }
            tilemap._characterEffector.addChild(obj);
        }
        if(name){
            parent[name] = obj;
        }
        return obj;
    }
    Game_Battler.prototype.updateBattlerQuery = function(){
        let q = this.getBattlerQuery();
        if(!q) return;
        q.update();
    }
    Game_Battler.prototype.getBattlerQuery = function(){
        let q = Battler.running.get(this._queryId);
        if(!q) return;
        return q;
    }

    function Game_ActionAdvance(){ this.initialize.apply(this, arguments) };
    Game_ActionAdvance.prototype = Object.create(Game_Action.prototype);
    Game_ActionAdvance.prototype.constructor = Game_ActionAdvance;
    Game_ActionAdvance.prototype.initialize = function(subject, data = { }) {
        this._forcing = true;
        this.setSubject(subject);
        this.clear();
        this.applyList = new Map();
        Object.assign(this, data);
    }
    // TODO action闭包GC
    Game_ActionAdvance.prototype.setSubject = function(subject){
        this._subject = subject;
    }
    Game_ActionAdvance.prototype.subject = function(){
        return this._subject;
    }
    Game_ActionAdvance.prototype.beforeApply = function(target, data){
        const result = target.result();
        this.subject().clearResult();
        result.clear();
        result.used = true;
        result.missed = result.used && Math.random() >= this.itemHit(target);
        result.evaded = !result.missed && Math.random() < this.itemEva(target);
        if(!result.isHit()) return;
        result.physical = this.isPhysical();
        result.drain = this.isDrain();
        if (this.item().damage.type > 0){
            result._damage = true;
            result.critical = Math.random() < this.itemCri(target);
        }
        let _result = JSON.parse(JSON.stringify(result));
        this.applyList.set(target, { result:_result, data });
    }
    Game_ActionAdvance.prototype.applyAll = function(type = 'all', effectfirst = true){
        this.applyList.forEach((data, target)=>{
            this.apply(target, data.result, ...arguments);
        })
    }
    Game_ActionAdvance.prototype.apply = function(target, result, type = 'all', effectfirst = true){
        if(!target) return;
        if(/all/i.test(type)){
            if(effectfirst){
                this.applyEffect(target, result);
                this.applyDamage(target, result);
            }
            else{
                this.applyDamage(target, result);
                this.applyEffect(target, result);
            }
        }
        else if(/effect/i.test(type)){
            this.applyEffect(target, result);
        }
        else if(/damage/i.test(type)){
            this.applyDamage(target, result);
        }
    }
    Game_ActionAdvance.prototype.applyEffect = function(target, result){
        for (const effect of this.item().effects) {
            this.applyItemEffect(target, effect);
        }
    }
    Game_ActionAdvance.prototype.applyDamage = function(target, result){
        
        const value = this.makeDamageValue(target, result.critical);
        // console.log(value);
        this.executeDamage(target, value);
        Object.assign(result, target.result());
    }
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        const item = this.item();
        const baseValue = this.evalDamageFormula(target);
        let value = baseValue * this.calcElementRate(target);
        if (this.isPhysical()) {
            value *= target.pdr;
        }
        if (this.isMagical()) {
            value *= target.mdr;
        }
        if (baseValue < 0) {
            value *= target.rec;
        }
        if (critical) {
            value = this.applyCritical(value);
        }
        value = this.applyVariance(value, item.damage.variance);
        value = this.applyGuard(value, target);
        value = Math.round(value);
        return value;
    }
    Game_ActionAdvance.prototype.applyCritical = function(damage) {
        return damage * (this.subject().crv || 2);
    }
    let Game_ActionAdvance_itemEffectAddNormalState = Game_ActionAdvance.prototype.itemEffectAddNormalState;
    Game_ActionAdvance.prototype.itemEffectAddNormalState = function(target, effect) {
        let id = effect.dataId;
        let isAtk = $dataStates[id].meta.atk;
        let data = { action:this };
        this.atkStates = this.atkStates || { };
        // once
        if(isAtk && this.atkStates[id]) return;
        if(isAtk){
            let state = this._subject.addState(id, data);
            this.atkStates[id] = true;
            return;
        }
        let chance = effect.value1;
        if (!this.isCertainHit()) {
            chance *= target.stateRate(effect.dataId);
            chance *= this.lukEffectRate(target);
        }
        if (Math.random() < chance) {
            target.addState(effect.dataId, data);
            this.makeSuccess(target);
        }
    }
    let Game_ActionAdvance_evalDamageFormula = Game_ActionAdvance.prototype.evalDamageFormula;
    Game_ActionAdvance.prototype.evalDamageFormula = function(target) {
        let query = this.query;
        if(!query) return 0; 
        const item = this.item();
        if(!item) return 0;
        let f = item.damage.formula;
        if(!/^:|^：/.test(f)){
            return Game_ActionAdvance_evalDamageFormula.call(this, ...arguments);
        }
        query.cache.set('b', target);
        const sign = [3, 4].includes(item.damage.type) ? -1 : 1;
        let a = query.warmArg(f.replace(/^:|^：/g, ''));
        const value = Math.max(query._a(a)(), 0) * sign;
        query.cache.delete('b');
        return isNaN(value) ? 0 : value;
    }
    let Game_Battler_initialize = Game_Battler.prototype.initialize;
    Game_Battler.prototype.initialize = function(){
        Game_Battler_initialize.call(this, ...arguments);
        this._fakeStates = { };
    }
    Game_Battler.prototype.updateFakeStates = function(){
        for(let id in this._fakeStates){
            let stateID = this._fakeStates[id];
            let state = State.running.get(stateID);
            if(!state){
                this._fakeStates[id] = null;
                delete this._fakeStates[id];
                continue;
            }
            state.update();
            if(state.__gcing){
                this._fakeStates[id] = null;
                delete this._fakeStates[id];
                continue;
            }
        }
    }
    let Game_Battler_addState = Game_Battler.prototype.addState;
    Game_Battler.prototype.addState = function(id, adddata = {}){
        let data = $dataStates[id];
        if(!data) return;
        if(/@life/i.test(data.note)){
            return this.addFakeState(id, adddata);
        }
        return Game_Battler_addState.call(this, ...arguments);
    }
    Game_Battler.prototype.addFakeState = function(id, data){
        let stateID = this._fakeStates[id];
        let refresh = (state)=>{
            let action = data.action;
            state._subject = (action ? action.subject() : this);
            state._action = action;
            state.cache.set('action', state._action);
            state.cache.set('b', state._subject);
        }
        if(stateID != undefined){
            let state = State.running.get(stateID);
            refresh(state);
            state.hook('trigger', true);
            return state;
        }
        let state = new State($dataStates[id]);
        state._battler = data.battler || this;
        refresh(state);
        let setup = state.setup();
        if(!setup) return;
        this._fakeStates[id] = state.id;
        return state;
    }

    
    
    
    function mixer() {}
    mixer.mix = function(_class, mixer){
        Object.assign(_class.prototype, mixer.prototype);
        for(let key in mixer){
            if(_class.prototype.hasOwnProperty(key)) continue;
            if(!mixer[key] || (!mixer[key].get && !mixer[key].set)) continue;
            Object.defineProperty(_class.prototype, key, mixer[key]);
        }
    }
    mixer.prototype.gain = function(type, value, c1, a = this._battler){
        // let args = Array.from(arguments).slice(1, arguments.length);
        switch(type.toLowerCase()){
            case 'hp': {
                a.gainHp(value); 
                break;
            }
            case 'tp': {
                a.gainTp(value); 
                break;
            }
            case 'mp': {
                a.gainMp(value); 
                break;
            }
        }
        if(c1){
            let damageSprite = a.getCacheFromPrefab('damageSprite');
            if(!damageSprite) return;
            let s = damageSprite.setuplite(value, c1);
            if(s){
                s.scale.x = s.scale.y = 0.5;
                s.alpha = 0.5;
            }
        }
    }
    mixer.prototype.collect = function(name, type = 'caler', target = this._battler){
        let stack = [];
        for(let i in target._fakeStates){
            let s = State.running.get(target._fakeStates[i]);
            let data = s.getShareLite(name);
            if(!data) continue;
            stack.push(data.value);
        }
        let l = stack.length;
        let index = 0;
        let result = 0;
        let t = type.toLocaleLowerCase();
        if(t == 'multi'){
            result = 1;
        }
        while(index < l){
            let v = stack[index];
            if(t == 'caler'){
                result += v();
            }
            else if(t == 'multi'){
                result *= v;
            }
            else if(t == 'value'){
                result += v;
            }
            else if(t == 'over'){
                result = v;
            }
            index++;
        }
        return result;
    }
    mixer.mix(Skill, mixer);
    mixer.mix(State, mixer);
    mixer.mix(Battler, mixer);

    function mz(){};
    mz.prototype.anim = function(id, setting, a = this._battler){
        if(typeof(Sprite_AnimationLite) != 'function') return;
        let lite = new Sprite_AnimationLite();
        let mysprite = getCache(a, 'mysprite');
        if(!mysprite) return;
        lite.setTarget(mysprite);
        lite.setup(id, json.string2obj(setting));
        lite.play();
        mysprite.addChild(lite);
        return lite;
    }
    
    mz.prototype.apply = function(target, type = 'all', effectfirst = true){
        let action = this.cache.get('action');
        if(!action) return;
        // console.warn(this.id);
        let data = action.applyList.get(target);
        if(!data || !data.result) return;
        action.apply(target, data.result, type, effectfirst);
    }
    mz.prototype.applyAll = function(type = 'all', effectfirst = true){
        let action = this.cache.get('action');
        if(!action) return;
        action.applyAll(...arguments);
    }
    mz._action = {
        get: function() { 
            return this.cache.get('action'); 
        },
        set: function(v) {
            this.cache.set('action', v);
        }
    }
    mixer.mix(Battler, mz);
    mixer.mix(Skill, mz);
    mixer.mix(State, mz);

    /**
     * MZARPG专属
     * @memberof ScriptableQueryObject
     * @class
     */
    function mzarpg() {  }
    mzarpg.prototype.spbuff = function(stateId, name){
        let target = this._battler;
        // let f = target._fakeStates;
        let elc = 0;
        let data = this.getShare(name);
        if(!data) return;
        data.forEach((state, state1)=>{
            let count = state1.cache.get('count');
            elc = Math.max(count, elc);
        })
        if(elc){
            let state = this.addState(stateId);
            if(state){
                state.cache.set('elc', elc);
                return state;
            }
        }
    }
    mzarpg.prototype.collectex = function(){

    }
    mzarpg.prototype.dirFix = function(v=false, a = this._battler){
        a = a.mapObject;
        if(!a) return;
        a.setDirectionFix(v);
    }
    mzarpg.prototype.skillEl = function(type = 0){
        // console.log($gamePlayer._FuMoPnowValue);
        if(!type) return $gamePlayer._FuMoPnowValue;
        else if(type == 1 && $gamePlayer._FuMoPtime){
            return $gamePlayer._FuMoPnowValue;
        }
        
        return 0;
    }
    /**
     * 获取A与B的距离
     * @param {any} a A
     * @param {any} b B
     * @returns {any} A与B的距离
     */
    mzarpg.prototype.distance = function(a, b){
        a = a.mapObject;
        if(!a) return 0;
        let x = Math.abs(a._realX - b._realX);
        let y = Math.abs(a._realY - b._realY);
        return Math.sqrt(x * x + y * y);
    }
    /**
     * 使用一个技能并自动朝向目标
     * @param {any} id 技能ID
     * @param {any} a 面向目标
     * @returns {any}
     */
    mzarpg.prototype.useSkill = function(id, a){
        this.turn2(a);
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if(!fsm) return;
        let skill = fsm.useSkill(id);
        if(skill){
            fsm.currentState = fsm.skiller;
        }
        return skill;
    }
    /**
     * 能否使用技能数组
     * @example #canUseSkill:can 1 2 3 4
     * @returns {any} 
     */
    mzarpg.prototype.canUseSkill = function(){
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if(!fsm) return;
        let result = false;
        Array.from(arguments).forEach((id)=>{
            result = fsm.canUseSkill(id);
        })
        return result;
    }
    mzarpg.prototype._move = function(a, b, type='toward'){
        const sx = a.deltaXFrom(b.x);
        const sy = a.deltaYFrom(b.y);
        type = type.toLocaleLowerCase();
        if (Math.abs(sx) > Math.abs(sy)) {
            if(type == 'toward'){
                return (sx > 0 ? 4 : 6);
            }
            else if(type == 'away'){
                return (sx > 0 ? 6 : 4);
            }
        } else if (sy !== 0) {
            if(type == 'toward'){
                return (sy > 0 ? 8 : 2);
            }
            else if(type == 'away'){
                return (sy > 0 ? 2 : 8);
            }
        }
    }
    /**
     * 移动
     * close 接近目标
     * away 远离目标
     * random 随机
     * @param {string} type='close' 移动类型
     * @param {Game_Battler} b 目标
     * @param {Game_Battler} a=this._battler 移动者
     * @returns {any}
     */
    mzarpg.prototype.move = function(type = 'close', b, a = this._battler){
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if(!fsm) return;
        if(fsm.currentState == fsm.skiller) return;
        fsm.currentState = fsm.walk;
        a = a.mapObject;
        if(!a) return;
        let t = type.toLocaleLowerCase();
        if(t == 'close'){
            let d = this._move(a, b, 'toward');
            a.moveStraight(d);
        }
        else if(t == 'away'){
            let d = this._move(a, b, 'away');
            a.moveStraight(d);
        }
        else if(t == 'random'){
            if(this.battlerTemp.moved) {
                this.battlerTemp.moved--;
                let d = this.battlerTemp.lastRandom;
                a.moveStraight(d);
                return;
            }
            let d = 2 + Math.randomInt(4) * 2;
            this.battlerTemp.lastRandom = d;
            // console.log(d);
            a.moveStraight(d);
            this.battlerTemp.moved = 10;
        }
        else if(t == 'round'){
            if(this.battlerTemp.moved && this.battlerTemp.lastround) {
                // console.log(this.battlerTemp.lastround.d);
                a.moveStraight(this.battlerTemp.lastround.d);
                this.battlerTemp.moved--;
                return;
            }
            let d;
            this.battlerTemp.lastround = this.battlerTemp.lastround || {type:'toward', d:0};
            if(this.battlerTemp.lastround.type == 'toward') {
                d = this._move(a, b, 'away');
                this.battlerTemp.lastround = {type:'away', d};
            }
            else if(this.battlerTemp.lastround == 'away') {
                d = this._move(a, b, 'toward');
                this.battlerTemp.lastround = {type:'toward', d};
            }
            if(!d) return;
            // a.moveStraight(d);
            this.battlerTemp.moved = 20;
        }
    }
    mzarpg.prototype.idle = function(){
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if(!fsm) return;
        if(fsm.currentState == fsm.skiller) return;
        fsm.currentState = fsm.idle;
        return true;
    }
    mzarpg.prototype.skilling = function(){
        let fsm = this._battler.getCacheFromPrefab('fsm');
        if(!fsm) return;
        if(fsm.currentState == fsm.skiller) return true;
    }
    mzarpg.prototype.turn2 = function(a){
        if(!a) return;
        let obj = this._battler.mapObject;
        if(!obj) return;
        obj.turnTowardCharacter(a);
        obj.poseDirectionFixOnly();
    }
    mzarpg.prototype.toaster = function(m){
        $.toaster({message:m});
    } 
    mzarpg.prototype.fumosimple = function(){

    }
    /**
     * 触发“水克火”的效果降低敌人速度时，该次攻击额外造成每层5%的伤害的前置处理
     * @param {any} t
     * @param {any} elcount
     * @returns {any}
     */
    mzarpg.prototype.saveElCount = function(t, elcount){
        let data = this._action.applyList.get(t);
        data.elcount = elcount;
        console.log(elcount);
    }
    mzarpg.prototype.maxElCount = function(){
        let c = 0;
        this._action.applyList.forEach((data) => {
            c = Math.max(data.elcount || 0, c);
        })
        return c;
    }
    mzarpg.prototype.hpshow = function(){
        let hp = this._battler.getCacheFromPrefab('hpbar');
        if(!hp) return;
        hp.renderablewait = -1;
        hp.renderable = true;
    }
    mzarpg.prototype.hphidden = function(v = 60){
        let hp = this._battler.getCacheFromPrefab('hpbar');
        if(!hp) return;
        hp.renderablewait = v;
        // hp.renderable = false;
    }
    /**
     * 触发“水克火”的效果降低敌人速度时，该次攻击额外造成每层5%的伤害的后置处理
     * @param {any} t
     * @param {any} base=0.05
     * @returns {any}
     */
    mzarpg.prototype.handled41 = function(t, base = 0.05){
        let data = this._action.applyList.get(t);
        let elc = data.elcount;
        if(!elc) return;
        this._action.query.cache.set('d41', base * elc);
    }
    function Sprite_Loot(){ this.initialize(...arguments) };
    Sprite_Loot.prototype = Object.create(PIXI.Sprite.prototype);
    Sprite_Loot.prototype.initialize = function(){
        PIXI.Sprite.call(this, ...arguments);
    }
    // TODO 轻量但直观的动画曲线
    Sprite_Loot.prototype.setup = function(info, mapObject){
        this.info = info;
        let x = mapObject.screenX();
        let y = mapObject.screenY();
        this.mapObject = mapObject;
        this.x = x;
        this.y = y - 48;
        let endPosition = { x: this.x + 20, y };
        let t2 = new TWEEN.Tween(this)
        .to(endPosition, info.lifetime / 60 * 1000)
        .easing(TWEEN.Easing[info.easing].Out)
        .onComplete(this.complete.bind(this));
        t2.start();
    }
    Sprite_Loot.prototype.complete = function(){
        if(this.mapObject._erased) {
            this.remove();
            return;
        }
        this.startTracing = true;
    }
    Sprite_Loot.prototype.update = function(){
        if(!this.startTracing) return;
        if(this.mapObject._erased) {
            this.remove();
            return;
        }
        let speed = 10;
        let x = this.mapObject.screenX();
        let y = this.mapObject.screenY();
        let y1 = y - this.y;
        let x1 = x - this.x;
        if(Math.abs(y1) + Math.abs(x1) < 10){
            this.complete1();
            return;
        }
        let r = Math.atan2(y1, x1);
        this.x += Math.cos(r) * speed;
        this.y += Math.sin(r) * speed;
    }
    Sprite_Loot.prototype.complete1 = function(){
        if(!this.mapObject.gameObject) return;
        let info = this.info;
        let b = this.mapObject.gameObject;
        if(info.isGold){
            $gameParty.gainGold(info.item, 1);
        }
        if(b instanceof Game_Actor){
            $gameParty.gainItem(info.item, 1);
        }
        // b.gainItem(info.item, 1);
        this.remove();
    }
    // 死亡掉落
    mzarpg.prototype.loot = function(){
        let newArgs = this._splitArgs2List(...arguments);
        let list = [];
        newArgs.forEach((l)=>{
            let info = this._loot(...l);
            if(!info) return;
            list.push(info);
            this._lootStart(info);
        })
        return list;
    }
    mzarpg.prototype._lootStart = function(info){
        let gen = function(bitmap, map, mapObject, info){
            let tex = PIXI.Texture.from(bitmap._image).clone();
            let sprite = new Sprite_Loot(tex);
            let frame = sprite.genFrame(info.item.iconIndex, tex);
            if(!frame) return;
            tex.frame = frame;
            map.addChild(sprite);
            sprite.setup(info, mapObject);
        }
        let map = Skill._createSkillOjbectMap();
        let bitmap = ImageManager.loadBitmapFromUrl('./img/system/IconSet.png');
        let mapObject = this._battler.mapObject;
        bitmap.addLoadListener((b)=>{
            for(let i=0; i<info.count; i++){
                gen(bitmap, map, mapObject, info);
            }
        })
    }
    mzarpg.prototype._loot = function(name, min=0, max=1, w1=0.05, lifetime=60, easing="Cubic"){
        let item = this._lootItem(name[0], name[1]);
        if(!item) return;
        let r = Math.random();
        if(r > w1) return;
        let count = Math.round(Math.random() * (max - min)) + min;
        let info = {item, lifetime, easing, count};
        if(count){
            return info;
        }
    }
    // TODO 常规金币
    mzarpg.prototype.lootGold = function(min=0, max=1, w1=0.05, iconIndex=1, part=10, lifetime=60, easing="Cubic"){
        let r = Math.random();
        if(r > w1) return;
        let item = {isGold:true, iconIndex};
        let count = Math.round(Math.random() * (max - min)) + min;
        count = Math.floor(count / part) + 1;
        let info = { item, lifetime, easing, count, part };
        
    }
    mzarpg.prototype._lootItem = function(c1, c2){
        let t = c1.toLocaleLowerCase();
        let id = Number(c2);
        if(t == 'w'){
            return $dataWeapons[id];
        }
        else if(t == 'a'){
            return $dataArmors[id];
        }
        else if(t == 'i'){
            return $dataItems[id];
        }
        else if(t == 's'){
            return $dataStates[id];
        }
    }
    mzarpg.prototype.pose = function(name, loop, chara = this._battler){
        chara = chara.mapObject;
        if(!name){
            chara.clearPose();
            return;
        }
        if(!chara) return;
        chara.playPose(name, undefined, undefined, loop, undefined);
    }
    
    mixer.mix(State, mzarpg);
    mixer.mix(Skill, mzarpg);
    mixer.mix(Battler, mzarpg);

    function quick(){};
    quick.prototype.addState = function(){
        this.gameObject.addState(...arguments);
    }
    quick.prototype.query = function(){
        return getQuery(this.gameObject);
    }
    quick.prototype.fakeStates = function(){
        let map = new Map();
        let ss = this.gameObject._fakeStates;
        for(let id in ss){
            map.set(id, getQuery(ss[id]));
        }
        return map;
    }
    mixer.mix(Game_Character, quick);

    // GC ========================================================
    
    common.simpleReset = function(){
        Skill.running = new Map();
        // Skill.ID = 0;
    }
    common.simpleLoad = function(){
        State.running = new Map();
        // State.ID = 0;
        // $gameActors._data.forEach((a)=>{
        //     if(!a) return;
        //     if(!a._fakeStates) return;
        //     for(let id in a._fakeStates){
        //         let info = a._fakeStates[id];
        //         while(info.items && info.items.length){
        //             a.addFakeState(id);
        //             info.items.shift();
        //         }
        //     }
        // })
    }
    
    contexter.running = new Map();
    Skill.running = new Map();
    State.running = new Map();
    Battler.running = new Map();
    let EV = new PIXI.DisplayObject.EventEmitter();
    EV.bodyContexting = {
        start: new Map(),
        active: new Map(),
        end: new Map(),
    }
    EV.on('collisionStart', (a, b)=>{
        // Matter.setSpeed(a, 0);
        // Matter.setSpeed(a, 0);
        Matter.Body.setSpeed(a, 0);
        Matter.Body.setSpeed(b, 0);
    })
    let gcSafe = function(){
        Skill.running.forEach((v)=>{
            v.update();
        })
        
        // EV.bodyContexting.start = new Map();
        // shared.forEach((m, k)=>{
        //     if(!m.size){
        //         shared.delete(k);
        //     }
        // })
    }
    let Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(){
        this.firstUpdate();
        Game_Map_update.call(this, ...arguments);
        gcSafe();
    }

    let Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(){
        EV.emit('gamemapsetup');
        this.gcSafeEx();
        Game_Map_setup.call(this, ...arguments);
        this._firstUpdate = false;
    }

    Game_Map.prototype.firstUpdate = function(){
        if(this._firstUpdate) return;
        EV.emit('gamemapfupdate');
        this._firstUpdate = true;
    }

    Game_Map.prototype.gcSafeEx = function(){
        Skill.running = new Map();
        let eneFix = function(s, i, map){
            if(s._battler instanceof Game_Enemy){
                map.delete(i);
            }
        }
        State.running.forEach(eneFix);
        Battler.running.forEach(eneFix);
        contexter.running.forEach(eneFix);
    }
    

    // 指令预编译
    contexter.preComplied = new Map();
    const preCompliedFix = function(base){
        console.log('指令预编译处理...');
        let temp;
        if(base == $dataSkills){
            temp = new Skill({});
        }
        else if(base == $dataStates){
            temp = new State({});
        }
        else if(base == $dataActors){
            temp = new Battler({});
        }
        else if(base == $dataEnemies){
            temp = new Ene({});
        }
        if(!temp) return;
        base.forEach((data)=>{
            preCompliedFixTest(data, temp);
        })
        console.log(contexter.preComplied);
        console.log('成功');
    }

    const preCompliedFixTest = function(data, temp = new Battler({})){
        if(!data) return;
        let all = data.note.match(/@.+\n([^@]+)@end/gi);
        if(!all || !all.length) return;
        let name = temp.constructor.name;
        let id = data.id;
        let cache = new Map();
        contexter.preComplied.set(`${name}${id}`, cache);
        let ignore = false;
        all.forEach((d)=>{
            if(ignore) return;
            let list = /@(.+)\n([^@]+)@end/.exec(d);
            if(!list || !list[2]) return;
            let qname = list[1].trim();
            let content = list[2];
            if(qname.toLocaleLowerCase() == 'deprecated'){
                ignore = true;
                return;
            }
            temp.source = data;
            let q = temp._build(content);
            if(q){
                cache.set(qname, q);
            }
        })
        return cache;
    }

    let Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function(){
        // preCompliedFixTest($dataSkills[63], new Skill({}));
        preCompliedFix($dataActors);
        preCompliedFix($dataSkills);
        preCompliedFix($dataStates);
        preCompliedFix($dataEnemies);
        return Scene_Boot_start.call(this, ...arguments);
    }

    

    // 导出
    exports.Skill = Skill;
    exports.State = State;
    exports.contexter = contexter;
    exports.Battler = Battler;
    exports.Ene = Ene;
    exports.__version = __version;
    exports.common = common;
    exports.preCompliedFix = preCompliedFix;
    exports.json = json;
    exports.explore = explore;
    exports.shared = shared;
    exports.getQuery = getQuery;
    exports.getCache = getCache;
    exports.setCache = setCache;
    exports.clearCache = clearCache;
    exports.EV = EV;

    /**
     * Description
     * @deprecated
     * @param {any} name
     * @param {any} any
     * @returns {any}
     */
    contexter.prototype.share = function(name, any){
        let map = shared.get(name);
        if(!map){
            shared.set(name, new Map());
            return this.share(...arguments);
        }
        let data = map.get(this);
        if(!data){
            data = new Map();
        }
        data.set(name, any);
        this.__shared = this.__shared || {};
        this.__shared[name] = true;
        map.set(this, data);
    }
    contexter.prototype.getShare = function(name, filter){
        if(filter){
            let map = new Map();
            shared.get(name).forEach((data, key)=>{
                if(!filter(data, key)) return;
                map.set(key, data);
            })
            return map;
        }
        return shared.get(name);
    }

});