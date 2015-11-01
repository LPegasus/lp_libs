!function () {
	var globe = this,
		fn = {},
		DOC = this.document,
		HTML = DOC.documentElement,
		HEAD = DOC.head,
		isIE = !!window.VBArray,
		W3C = !!window.dispatchEvent,
		_lp = globe.lp,
		moduleClass = 'LP' + (new Date - 0),
		arrProto = Array.prototype,	//Original static funcs of Array class
		objProto = Object.prototype;//Original static funcs of Object class
	function lp_libs() {
		this.version = '0.0.1';
	}
	function noop() {}

	/*
	判断是否是类数组对象,若为true 把arg格式化成Array以继承Array方法
	*/
	function isArrayLike(arg){
		if (getType(arg) === 'object' && arg.length >= 0 && isFinite(arg.length)
			&& Math.floor(arg.length)===arg.length){
			var i = -1;
			while(++i < arg.length){
				if (!(i.toString() in arg)){
					return false;
				}
			}
			return true;
			arg = arrProto.slice(arg, 0);
		}
		
		return false;
	}
	fn.isArrayLike = isArrayLike;
	
	/*
	判断是否是Array对象
	*/
	function isArray(arg){
		if (Array.isArray){
			return Array.isArray(arg);
		}else{
			return objProto.toString.call(arg) === '[object Array]';
		}
	}
	fn.isArray = isArray;
	
	/*
	输入1，10 返回 ［1，2，3，4，5，6，7，8，9，10］
	输入a，d 返回 [a,b,c,d]
	*/
	function range(min, max){
		var a = [], i = min;
		if ('number'===getType(min) && 'number' === getType(max)){
			for (;i<=max;a.push(i++)) {};
		}else if ('string'===getType(min) && 'string'===getType(max) && min.length===1 && 1===max.length){
			min = min.charCodeAt(0);
			max = max.charCodeAt(0);
			for (i=min;i<=max;a.push(String.fromCharCode(i++))){}
		}
		return a;
	}
	fn.range = range;
	
	function getElementPosition(elm){
		var curElm = elm,
			position = {top:elm.offsetTop,left:elm.offsetLeft};
		while(curElm = curElm.offsetParent){
			position.top += curElm.offsetTop;
			position.left += curElm.offsetLeft;
		}
		return position;
	}
	fn.getElementPosition = getElementPosition;
	
	var types = {};//Get the type of an object. Return lowercase of the type name.
	"Boolean,Number,String,Function,Array,Date,RegExp,Object,Error"
		.replace(/[^, ]+/g, function(d){types['[object ' + d + ']'] = d.toLowerCase(); return void 0;});
	function getType (o) {
		if (o == null) return String(o);
		return typeof o === 'object' || typeof o === 'function' ?
					types[objProto.toString.call(o)] || 'object'
					: typeof o;
	}
	fn.getType = getType;
	
	//原型链继承
	function inherit(obj){
		if (obj === undefined) return void 0;
		if (Object.create)
			return Object.create(obj);
		else{
			noop.prototype === obj;
			var res = new noop();
			delete noop.prototype;
			return res;
		}
	}
	fn.inherit = inherit;
	
	//只克隆自有属性，继承的一概忽略。
	/*
	@param deep 深度克隆
	@resourceArr 要复制的对象数组
	@target 原对象
	*/
	function extend(_deep, _tar, _arr){
		var args = arguments,
			target, deep, resourceArr, l = 0, field, props, clone;
		if (args.length === 1 && typeof args === 'object'){
			args = args[0];
			target = args.target || {};
			deep = !!args.deep;
			if (typeof args.resourceArr !== 'object' 
				|| typeof args.resourceArr !== 'function'){
				resourceArr = typeof args.resourceArr === 'function' ? args.resourceArr() : args.resourceArr;
			}else{
				console.error('resourceArr should be an object or a function with an object return.');
				return target;
			}
			resourceArr = arrProto.slice.call([].concat(args.resourceArr));
		}else{
			if (typeof args[l] === 'boolean')
				deep = args[l++];
			target = args[l++] || {};
			resourceArr = arrProto.slice.call(args,l,args.length) || [];
		}
		resourceArr.forEach(function(d){
		 	props = Object.getOwnPropertyNames(d);
			for (field in props){
				field = props[field];
				clone = d[field];
				if (clone === target){//循环引用检测
					continue;
				}
				else if (typeof clone === 'object' || typeof clone === 'function')
				{
					if (deep){
						target[field] = fn.extend(deep, {}, clone);	
					}else{
						target[field] = clone;
					}
				}else{
					Object.defineProperty(target, field, Object.getOwnPropertyDescriptor(d, field));
				}
			}
		});
		return target;
	}
	fn.extend = extend;

	/*获得当前执行的脚本名称
	@param base 上下文
	*/
	function getCurrentScript(base) {
	    // 参考 https://github.com/samyk/jiagra/blob/master/jiagra.js
	    var stack;
	    try {
	        a.b.c(); //强制报错,以便捕获e.stack
	    } catch (e) { //safari的错误对象只有line,sourceId,sourceURL
	        stack = e.stack;
	        if (!stack && window.opera) {
	            //opera 9没有e.stack,但有e.Backtrace,但不能直接取得,需要对e对象转字符串进行抽取
	            stack = (String(e).match(/of linked script \S+/g) || []).join(" ");
	        }
	    }
	    if (stack) {
	        /**e.stack最后一行在所有支持的浏览器大致如下:
	        /*tack = stack.split(/[@ ]/g).pop(); //取得最后一行,最后一个空格或@之后的部分
	        stack = stack[0] === "(" ? stack.slice(1, -1) : stack.replace(/\s/, ""); //去掉换行符
	        return stack.replace(/(:\d+)?:\d+$/i, ""); //去掉行号与或许存在的出错字符起始位置*/
	        var idx = NaN;
	        var tmp = stack.split(/[\n@]/g);
	        tmp.some(function(d,i){if (d.indexOf('getCurrentScript') > -1)
	        	{idx = i;return true;}
	        	else return false;
	        });
	        var mc = tmp[idx + 1].match(/[^\/]+.js/i);
	        return (mc && mc.length) ? mc[0] : "anonymous";
	    }
		console.warn('Can not locate current script.');
	}
	fn.getCurrentScript = getCurrentScript;
	
	/* domReady */
	var readyList = [];
	function domReady(_fn){
		if (getType(_fn) !== 'function'){return};
		if (readyList){	//在ready之后把readyList赋值为null则为false
			readyList.push(_fn);
		}else{
			_fn();
		}
	}
	function fireReady(){
		for(var i=0, _fn; _fn = readyList[i++];){
			_fn();
		}
		readyList = null;
		fireReady = noop;
	}
	function tryScroll(){
		try{
			DOC.documentElement.doScroll('left');
			fireReady();
		} catch(e){
			setTimeout(tryScroll, 50);
		}
	}

	var ready = W3C?"DOMContentLoaded":"readystatechange", readyFn;

	if (!DOC.readyState){		//兼容firefox3.6之前版本用
		var readyState = DOC.readyState = DOC.body ? "complete":"loading";	
	}
	if (DOC.readyState === 'complete'){		//DOM已生成
		fireReady();
	} else {//DOM未生成则绑定监听(DOMContentLoaded或readystatechange)事件
		DOC.addEventListener(ready, function(){
			if (W3C || DOC.readyState === 'complete'){	//若支持DOMContentLoaded或DOM已生成直接执行脚本
				fireReady();
				if (readyState){	//若是firefox3.6之前版本
					DOC.readyState = 'complete';
				}
			}
		});
		if (HTML.doScroll){
			try{//跨域报错
				if (self === parent){
					tryScroll();
				}
			} catch(e){
				tryScroll();
			}
		}
	}
	fn.domReady = domReady;
	
	function isFunction(obj){
		return getType(obj) === 'function';
	}
	fn.isFunction = isFunction;
	
	//去重复
	function distinct(_arr){
		var res = [];
		loop: for (var i = 0, n = _arr.length;i<n;++i){
			for (var x = i + 1; x < n; ++x){
				if (_arr[x] === _arr[i])
					continue loop;
			}
			res.push(_arr[i]);
		}
		return res;
	}
	fn.distinct = distinct;
	
	//字符串重复拼接
	function repeat(str,n){
		var s = str, res = '';
		while(n > 0){
			if (n % 2 == 1){
				res += s;
			}
			if (n == 1) break;
			s+=s;
			n=n>>1;
		}
		return res;
	}
	fn.repeat = repeat;
	
	/*
	** 发布订阅器
	** 默认的委托方法this都为订阅者
	** trigger触发可带穿参
	*/
	var EVENTCENTER = {};
	
	/*
	** 创建订阅的事件
	** @param _me 需要订阅的对象（可选）
	** @param _id 事件名（必须）
	** @param _fn 事件绑定的方法（必须）
	只传事件名和方法，则只声明方法；
	只传targets和事件名则绑定事件；
	若传object，则解析obj；
	*/
	function bind(_me, _id, _fn){
		var opts, e;
		if (arguments.length === 1 && getType(arguments[0]) === 'object'){
			_me = opts.targets;
			_id = opts.name;
			_fn = opts.event;
		}
		e = EVENTCENTER;
		//创建发布的事件
		if (_fn === undefined && isFunction(_id)){
			_id = _me; _fn = _id; _me = null;
		}else if (_fn === undefined && getType(_id) === 'string'){
			_fn = null;
		}
		if(!_id){
			console.warn('bindEvents input params error!;');
			return;
		}
		if (_me && !isArray(_me)){
			_me = [].concat(_me);
		}
		function _events(__id, __fn, __me){
			this.listeners = [];
			this.actor = _fn;
			if (!!__me && __me.length > 0){
				this.listeners = distinct(this.listeners.concat(__me));
			}
		}
		if (!e[_id] && _fn){
			e[_id] = new _events(_id, _fn, _me);
		} else if(e[_id] && _me){
			!!_me && distinct(e['listeners'].concat(_me));
		}
		return _me;
	}
	fn.bind = bind;
	
	//扩展数组原型方法
	function contains(o){
		return arrProto.indexOf.call(this, o) >= 0;
	}
	if (!arrProto.contains)
		Array.prototype.contains = contains;
	
	function remove(delegate){
		var arr = this, index = [];
		if (isFunction(delegate)){
			arrProto.splice
		} 
	}
	
	/*
	** 触发订阅事件
	** @param _id 事件注册的名字
	** @param exceptDelegate 过滤掉不需要的订阅者
	** @return 执行了事件的对象 (class:Array)
	*/
	function trigger(_id, exceptDelegate){
		var e = EVENTCENTER[_id], args = arrProto.slice.call(arguments, 1);
		if (!isFunction(exceptDelegate)){
			exceptDelegate = function(){return false;};
		} else {
			args.shift();
		}
		if (!e) return;
		var listeners = e.listeners;
		return listeners.filter(function(d,i,arr){
			if (!exceptDelegate.call(d)){
				e.actor.apply(d, args);
				return true;
			}
			return false;
		});
	}
	fn.trigger = trigger;
	
	/*
	** 放弃订阅
	** @param _me 订阅过的
	** @param _id 事件名
	** @return 被注销掉的对象(class:Array)
	*/
	function unbind(_me, _id){
		var e = EVENTCENTER[_id];
		if (!e) return;
		if (!isArray(_me))
			_me = [].concat(_me);
		return arrProto.filter.call(_me, function(d){
			var idx = arrProto.indexOf.call(e.listeners, d);
			if (idx >= 0){
				e.listeners.splice(idx,1);
				return true;  
			}else{
				return false;
			}
		});
	}
	fn.unbind = unbind;

	/**
	 * 扁平化数组
	 * @param  {[Array, ArrayLike]} arr   [原数组]
	 * @param  {Number} depth [深度]
	 * @return {Array}       [结果数组]
	 */
	function flatten(arr, depth){
		/**
		 * 参考自array-flatten.js 扩充对类数组对象的支持
		 * @param  {[Array]} array  [description]
		 * @param  {[Array]} result [description]
		 * @param  {[Number]} dep    [description]
		 * @return {[Array]}        [description]
		 */
		function _flattenWithDepth(array, result, dep){
			for (var i = 0; i <= array.length - 1; ++i) {
				var v = array[i];
				if ((isArray(v) || isArrayLike(v)) && dep >= 0){
					_flattenWithDepth(v, result, --dep);
				}else{
					result.push(v);
				}
			};
			return result;
		}
		/**
		 * 未指定深度的扁平化速度更快
		 * @param  {[Array]} array  [description]
		 * @param  {[Array]} result [description]
		 * @return {[Array]}        [description]
		 */
		function _flattenAll(array, result){
			for (var i = 0; i <= array.length - 1; ++i) {
				var v = array[i];
				if (isArrayLike(v) || isArray(v)) {
					_flattenAll(v, result);
				}else{
					result.push(v);
				}
			}
			return result;
		}
		if (!isNaN(depth) && depth > 0){
			return _flattenWithDepth(arr, [], depth);
		}else{
			return _flattenAll(arr, []);
		}
	}
	fn.flatten = flatten;

	
	lp_libs.prototype = fn;
	if (typeof define === 'function' && define.amd){
		define(function(){
			return new lp_libs();
		});
	} else if(typeof module === 'object' && module.exports) module.exports = lp_libs;
	else {
		globe.lp = _lp ? _lp: globe.lpegasus = new lp_libs();
	}
}();

/*

 */