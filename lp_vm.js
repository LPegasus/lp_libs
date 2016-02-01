!function () {
    'use strict';
    var ArrProto = new Array(), ObjProto = new Object(), DOC = document.documentElement, BODY = document.body, HEAD = document.head;
    var vmContainers = {}, me = {}, DOMfragment = document.createDocumentFragment(), propBindSyntax = "cc-",
        envCfg = {
            propBindRegex: new RegExp(propBindSyntax + ".+"),
            exprReg: /\{\{.+\}\}/i,
            exprStartEdge: "{{",
            exprEndEdge: "}}",
            strReplaceRegex: /(['"])(\\\1|.)+?\1/g,
            propBindSyntax: propBindSyntax
        };
    vmContainers.push = function (_vm) {
        if (vmContainers[_vm.$id]) { console.warn(_vm.$id + " already exists."); return false; }
        else { vmContainers[_vm.$id] = _vm; return _vm; }
    }
    
    //存放基本方法
    var utilFn = {
        extend: function (tar) {
            var res = {}, libs;
            if (libs = this.lp || this.lpegasus) {
                return libs.extend(true, tar, ArrProto.slice.call(arguments, 1));
            } else {
                ArrProto.slice.call(arguments, 1)
                    .forEach(function (d, i) {
                        var props = Object.keys(d), prop, _i;
                        for (_i = 0; prop = props[i++];) {
                            res[prop] = (typeof d[prop]).toLowerCase() == 'object' ?
                                utilFn.copyObject(d[prop]) : d[prop];
                        }
                    });
                return res;
            }
        },
        memo: function (fn) {
            var c = {};
            return function () {
                var args = ArrProto.slice.call(arguments),
                    cprop = args.reduce(function (pre, cur) {
                        return (pre + "-") + ((typeof cur).toLowerCase() == 'object' ?
                            JSON.stringify(cur, function (k, v) {
                                if ((typeof v).toLowerCase() == 'function') {
                                    return v.toString();
                                } else {
                                    return v;
                                }
                            }) : (cur ? cur.toString() : ''));
                    }, '');
                return cprop in c ? c[cprop] : c[cprop] = fn.apply(this, args);
            }
        },
        copyObject: function (tar) {
            return utilFn.extend({}, tar);
        },
        fn2Value: function (f, ctx) {
            return (typeof f).toLowerCase() === 'function' ? f.apply(ctx, ArrProto.slice.call(arguments, 2)) : f;
        },
        flattenObjAttr: function (obj, prefix, res) {
            var props, prop, i;
            res = res || [];
            prefix = prefix || '';
            props = Object.keys(obj);
            for (i = 0; prop = props[i++];) {
                if ((typeof obj[prop]).toLowerCase() == 'object' && ObjProto.toString.call(obj[prop]).indexOf('RegExp') == -1) {
                    utilFn.flattenObjAttr(obj[prop], prefix + "." + prop, res);
                } else if ((typeof obj[prop]).toLowerCase() != 'function') {
                    res.push(prefix + '.' + prop);
                }
            }
            return res;
        },
        subArray: function (arr, start, end) {
            return arr.filter(function (d, i) {
                return i >= start && i <= end;
            });
        },
        getAttrByPath: function (obj, path) {
            var props = path.split('.').slice(1), curObj = obj, i = -1;
            if (!props.length) return { path: path, value: undefined };
            while (curObj = curObj[props[++i]]) { }
            return { path: path, value: eval('obj.' + utilFn.subArray(props, 0, i).join('.')) };
        }
    }


    function VM(opts) {
        var _vm = this;
        var $skipArray = ['$watchCenter', '$id', '$range', '$watch', '$unwatch', '$skipArray', '$expr', '$leaves'],//不追踪
            props = Object.getOwnPropertyNames(opts);
            
        //以$开头的默认忽略追踪
        props.forEach(function (name) {
            if (name[0] === '$') $skipArray.push(name);
        });

        if (opts['skipArray'] && opts['skipArray'].length > 0) {
            $skipArray = $skipArray.concat(opts['skipArray']);
        }

        props.forEach(function (name) {
            if ($skipArray.indexOf(name) == -1) {
                if (name === 'range') {
                    _vm.$range = opts[name];
                }
                _vm[name] = opts[name];
            }
        });

        this.$watchCenter = {};
        this.$watchCenter.$bind = function (_prop, _fn) {
            if (!this[_prop]) this[_prop] = [];
            this[_prop].push(_fn);
        }
        this.$skipArray = $skipArray;
        this.$id = 'vm_' + (new Date()).valueOf();//ID
        delete this.range;
        this.$leaves = utilFn.flattenObjAttr(opts);

        scanDom(this.$range);
        initViewUpdate(_vm);
        delete this.$leaves;
        
        
        /**
         * @Desc 获得表达式分词结果对象
         * @param  {expression} input
         */
        function getExpr(input) {
            var value = input, filters;

            var escapeExpr = value.replace(envCfg.strReplaceRegex, function (str) {
                return Array(str.length).join('1');
            });

            //获得filter表达式起始位置
            var idx = escapeExpr.replace('||', 'åå').indexOf('|');
            if (idx > -1) {
                filters = value.slice(idx).trim();
                value = value.slice(0, idx);
            }
            return { type: 'expr', filters: filters, expr: value };
        }
        
        /**
         * @Desc 扫描节点里的属性 
         * @param  {DOMELEMENT} tag
         * @return {Array} {name:xxx, value:xxx}
         */
        function scanTag(tag) {
            if (!tag || !tag.attributes) return null;
            var res = ArrProto.filter.call(ArrProto.slice.call(tag.attributes), function (d) {
                return envCfg.propBindRegex.test(d.name);
            }).map(function (d) {
                return { name: d.name, value: d.value };
            });
            if (!res.length) return null;
            return ArrProto.slice.call(res);
        }
        
        /**
         * 扫描<TAG></TAG>节点
         * {node: Node, bindAttr: Array}
         */
        function scanNode(obj, watchCenter) {
            var attrs;
            if (obj.bindAttr) {
                attrs = obj.bindAttr;
            } else {
                attrs = scanTag(obj).bindAttr;
            }
            if (!attrs) return null;
            attrs.forEach(function (attr) {
                var _prop = attr.value, _name = attr.name, _noprefixname = _name.replace(envCfg.propBindSyntax, '');
                if (!watchCenter[_prop]) watchCenter[_prop] = [];
                watchCenter[_prop].push(function () {
                    obj.node.setAttribute(_noprefixname, this[_prop]);
                }.bind(_vm));
                obj.node.removeAttribute(_name);
            });
        }


        function scanTEXT(node, watchCenter) {
            /**
             * 每个token的数据结构为
             * type: text 直接输出字符串， expr 表达式
             * expr: 当type为text时，为字符串内容，当type为expr时为表达式
             * filters: 过滤器管道表达式
             */
            var tokens = [], start = 0, stop = -1;
            var contentReg = /[^\s\b\r\n]+/;
            var text = node.data.toString();
            do {
                stop = text.indexOf(envCfg.exprStartEdge, start);
                if (stop < 0) break;

                if (stop > start && contentReg.test(text.substring(start, stop))) {
                    //获取左边字符串
                    tokens.push({ type: 'text', expr: text.substring(start, stop) });
                }
                
                //获取表达式
                start = stop + envCfg.exprStartEdge.length;
                stop = text.indexOf(envCfg.exprEndEdge, start + 1);
                if (stop < 0) throw new SyntaxError('Expression is invalid. Please check your edge tokens.');
                tokens.push(getExpr(text.substring(start, stop)));

                start = stop + envCfg.exprStartEdge.length;
            } while (1);
            //获得最右侧非表达式文本
            text = text.slice(start);
            if (text && contentReg.test(text)) {
                tokens.push({
                    type: 'text', expr: text
                });
            }
            
            //通过tokens创建回调函数
            var funcString = '', needUpdateProps = [];//这些数据更新时，需要更新对应DOM
            var funcVar = "var" + props.filter(function (d) {
                return _vm.$skipArray.indexOf(d) < 0;
            }).reduce(function (prev, curv, i) {
                return (prev + ", " + curv + " = this." + curv);
            }, '').substring(1) + ";";
            tokens.forEach(function (token) {
                if (token.type == 'text') {
                    funcString += ('+"' + token.expr + '"');
                } else if (token.type == 'expr') {
                    if (!_vm.$expr) _vm.$expr = [];
                    var _tmp = token.expr.replace(envCfg.strReplaceRegex, function (d) { return ""; });
                    var _props = _tmp.match(/\w[\w\d\.]*/g);
                    if (_props && _props.length > 0) {
                        for (var _i = 0, _prop; _prop = _props[_i++];) {
                            needUpdateProps.push(_prop);//数据名
                        }
                    }
                    var _idx = _vm.$expr.push(
                        Function("$filters", funcVar + " return this.$execFilters((" + token.expr + "), $filters);").bind(_vm, token.filters)
                        ) - 1;
                    funcString += ('+ this.$expr[' + _idx + '](' + _idx + ')');
                }
            });

            needUpdateProps.filter(function (d, i, arr) {//去重复
                return arr.slice(i + 1).indexOf(d) == -1;
            }).forEach(function (d) {
                watchCenter.$bind(d, Function('_node', funcVar + '_node.data = ' + funcString.substring(1) + ";").bind(_vm, node));
            });

        }

        function scanDom(range) {
            var allNodes = [];
            getNodes(range);//扫描range获得所有需要绑定的节点=>allNodes
            
            allNodes.forEach(function (node) {
                //如果是text节点
                if (node.node.nodeType === DOC.TEXT_NODE) {
                    scanTEXT(node.node, _vm.$watchCenter);
                }
                else if (node.bindAttr) {
                    scanNode(node, _vm.$watchCenter);
                }
            });
            
            /**
             * @Desc 获取elm下所有节点
             * @param  {Node} elm
             */
            function getNodes(elm) {
                var attrMap = null;
                if (elm.childNodes.length) {
                    var i = 0, curNode = null;
                    for (; curNode = elm.childNodes[i++];) {
                        if ('script,noscript'.indexOf(curNode.nodeName.toLowerCase()) > -1) {//
                            continue;
                        }
                        generateBindAttr(curNode, allNodes);
                    }
                } else {
                    generateBindAttr(elm, allNodes);
                }

                function generateBindAttr(el, collection) {
                    attrMap = scanTag(el);
                    if ((el.nodeType === DOC.TEXT_NODE && envCfg.exprReg.test(el.data)) ||
                        el.nodeType === DOC.ELEMENT_NODE && attrMap) {
                        collection.push({ node: el, bindAttr: attrMap });
                    }
                    if ((el.nodeType === DOC.ELEMENT_NODE || el.nodeType === DOC.DOCUMENT_NODE) && el.childNodes.length) {
                        getNodes(curNode, allNodes);
                    }
                }
            }
        }
    }

    VM.prototype.$unwatch = function (item) {
        ObjProto.hasOwnProperty(item) && this.$skipArray.push(item);
        return this;
    }

    VM.prototype.$watch = function (propname, callback) {
        var _fn = callback.bind(this);
        if (!this.$watchCenter[propname]) this.$watchCenter[propname] = [];
        this.$watchCenter[propname].push(_fn);
        return this;
    }

    VM.prototype.$execFilters = function (input, filters) {
        if (!filters || !filters.length) return input;
        var res = String(input), _this = this;
        for (var i = 0, filter; filter = VM.prototype.filters[i++];) {
            if (!filter) continue;
            res = filter.call(_this, res);
        }
        return res;
    }
    
    
    /**
     * 初始化数据更新的所有同步事件
     * @param  {VM} VM
     * @return void
     */
    function initViewUpdate(_vm) {
        var i = 0, prop/*property全名*/, fatherProp/*原子属性的父节点名称*/, fatherObj/*原子属性父节点对象*/, _modelValue ={}/*存放数据*/;
        for (; prop = _vm.$leaves[i++];) {
            _modelValue[prop] = {new: eval('_vm' + prop)};
            _modelValue[prop].old = _modelValue[prop].new;
            fatherProp = prop.substring(0, prop.lastIndexOf('.')) || '';//获取父对象的property路径
            fatherObj = utilFn.getAttrByPath(_vm, fatherProp);
            bindUpdateView(fatherObj, prop, _vm);
        }

        function bindUpdateView(obj, prop, vm) {
            var subprop = prop.substring(prop.lastIndexOf('.') + 1), watchCenter = vm.$watchCenter;
            if (!subprop) return;
            Object.defineProperty(obj.value, subprop, {
                get: function () {
                    return this.new;
                }.bind(_modelValue[prop]),
                set: function (v) {
                    this.old = this.new;
                    this.new = v;
                    if (watchCenter[prop.substring(1)] && watchCenter[prop.substring(1)].length) {
                        watchCenter[prop.substring(1)].forEach(function (_fn) {
                            _fn();
                        });
                    }
                }.bind(_modelValue[prop]),
                enumerable: true,
                configurable: true
            });
            obj.value[subprop] = _modelValue[prop].new;
        }
        
        /*
        //获取所有数据字段
        var props = Object.getOwnPropertyNames(_vm).filter(function (d) {
            return _vm.$skipArray.indexOf(d) == -1;
        }), $modelValue = {};

        for (var i = 0, prop; prop = props[i++];) {
            +function (_p) {
                +function () {
                    if ((typeof _vm[_p]).toLowerCase().indexOf('object') == -1) {
                        $modelValue[_p] = { new: _vm[_p], old: _vm[_p] };
                    } else {
                        $modelValue[_p] = { new: utilFn.copyObject(_vm[_p]), old: utilFn.copyObject(_vm[_p]) };
                    }
                    
                    if ('object'.indexOf((typeof _vm[_p]).toLowerCase()) == -1) {
                        /*Object.defineProperty(_vm, _p, {
                            get: function () {
                                return this.new;
                            }.bind($modelValue[_p]),
                            set: function (v) {
                                this.old = this.new;
                                this.new = v;
                                if (_vm.$watchCenter[_p] && _vm.$watchCenter[_p].length) {
                                    _vm.$watchCenter[_p].forEach(function (_fn) {
                                        _fn();
                                    });
                                }
                            }.bind($modelValue[_p]),
                            enumerable: true,
                            configurable: true
                        });
                        _vm[_p] = $modelValue[_p].new;
                        bindUpdateView(_vm, _p, _vm, $modelValue);
                    }else{
                        bindUpdateView(_vm[_p], )
                    }
                } ();
            } (prop);
        }*/
        return void 0;
    }

    
    /**
     * opts.range 扫描范围
     * opts.id ID
     * opts.skipArray
     */
    me.define = function (opts) {
        //range合法性检查
        if (opts.range.nodeType != DOC.ELEMENT_NODE && opts.range.nodeType != DOC.DOCUMENT_NODE) {
            return undefined;
        }
        var _vm = new VM(opts);
        vmContainers.push(_vm);

        return _vm;
    }
    if (typeof define === "function" && define.amd) define(me); else if (typeof module === "object" && module.exports) module.exports = me;
    this.lp_vm = me;
}.call(this);