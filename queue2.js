; (function (exportFn) {
    var toString = Object.prototype.toString;
    var setNextTick = requestAnimationFrame || setTimeout;

    function once(fn) {
        var done = false;
        return function () {
            if (!done) {
                done = true;
                return fn.apply(null, arguments);
            }
            else return undefined;
        }
    }

    function q(fn, opts) {
        var defer = new Defer(opts);
        fn.call(fn, defer.resolve, defer.reject);
        return defer.promise;
    }

    q.defer = function () {
        return new Defer(opts);
    }

    function Defer(opts) {
        opts = opts || {};
        this.promise = new Promise(opts);
        this.resolve = _factoryExec_.call(this, 'resolve');
        this.reject = _factoryExec_.call(this, 'reject');
    }

    function _factoryExec_(name) {
        var me = this;
        return function () {
            var arg = arguments;
            var promise = me.promise;
            var result;
            var callback;
            if (callback = promise.tasks[name + 'Callback'].shift()) {
                if (!callback) {
                    return;
                } else {
                    result = callback.apply(null, arguments);
                    if (result && result.toString() === '[LP Promise]') {
                        result.tasks = promise.tasks;
                        return;
                    } else {
                        me[name](result);
                    }
                }
            }
        }
    }


    function Promise(opts) {
        this.lastResult;    //存放上一个then方法的返回值
        this.status = '';
        this.tasks = {
            resolveCallback: [], rejectCallback: []
        }
        this.timeout = isNaN(opts.timeout) ? null : parseInt(opts.timeout);
        this.hasError;
        this.errorCallback;
    }

    Promise.prototype.parallel = function (successes, errors) {
        successes = (successes || []).filter(function (d) {
            return 'funciton' === typeof d;
        });
        errors = (errors || []).filter(function (d) {
            return 'function' === typeof d;
        });
        if (successes.length) {
            this.tasks.resolveCallback.push(successes.map(function (f) { return once(f); }));
        }
        if (errors.length) {
            this.tasks.rejectCallback.push(errors.map(function (f) { return once(f); }));
        }
        return this;
    }

    Promise.prototype.then = function (success, error) {
        if ('function' === typeof success)
            this.tasks.resolveCallback.push(once(success));
        if ('function' === typeof error)
            this.tasks.rejectCallback.push(once(error));
        return this;
    }
    
    Promise.prototype.error = function (err) {
        if (typeof err === 'function') this.errorCallback = err;
        return this;
    }

    Promise.prototype.toString = function () { return '[LP Promise]'; }

    exportFn(q);
})(typeof define === 'function' && define.amd ? define
    : ('object' === typeof module && module.exports ? function (d) { module.exports = d; }
        : function (d) { this.q = d; })
    );