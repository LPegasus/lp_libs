'use strict'
define(['lp_libs'], function(lp){
    var noop = function(){};
    var workerArray = [];
    var Work = function(url, postData, listener, onerr, params){
        if (url && postData && 'function' === lp.getType(listener))
        {
            var wk = new Worker(url);
            wk.onmessage = function(e){
                listener.apply(this, [e].concat(params));
            }.bind(this);
            wk.onerror = onerr || noop;
            this.status = 'open';
            this.worker = wk;
            this.createTime = +new Date();
            this.fire = function(){
                if (this.status !== 'open') return;
                this.status = 'fired';
                this.worker.postMessage(postData);
                return this;
            }
            this.close = function(){
                this.worker.terminate();
                this.status = 'closed';
                return this;
            }
        }
    }
    
    function defineTask(tasks){
        if (!lp.isArray(tasks) && lp.getType(tasks) === 'object'){
            tasks = [tasks];
        }
        tasks.forEach(function(task, i){
            var workUrl = task.url;
            var postData = task.poster;
            var listenFn = task.listener;
            var wk = new Work(workUrl, postData, listenFn);
            if (!wk) return;
            workerArray.push(wk);
        });
        return workerArray;
    }
    
    defineTask.clear = function(){
        var i = workerArray.length, d;
        for(;d=workerArray[--i];){
            if (d.status==='closed'){
                workerArray.splice(i, 1);
            }
        }
    }
    
    defineTask.terminateAll = function(){
        workerArray.forEach(function(d){
            if (d && d.worker.status !== 'closed'){
                d.worker.terminate();
                d.worker.status = 'closed';
            }
        });
        this.clear();
    }
    return defineTask;
});