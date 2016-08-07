/**
 * @author LPegasus
 * @datetime 2015-11-01
 * @email pegusas1@hotmail.com
 * @license MIT
 */
'use strict';
//queue().defer(function(..., callback){},...).defer(func2).defer(func3).await(function(){})
!function () {
  var slice = Array.prototype.slice;
  var toString = Object.prototype.toString;

  function lp_queue(mode) {
    var tasks = [],		//Task queue.
      async = true,	//Async or sync.
      errResult = [],
      fired = 0,	//Number of tasks which has been fired.
      finished = 0,	//Number of finished tasks.
      summeryFunc = function () { console.log('Queue Finished;') },	//When every task has been finished, execute summary function.
      hasError = false,	//Any task is occurred an error. In sync mode, it will interupt the queue popline.
      result = [];	//Store the tasks' result and will be imported into the summary function.
    if (mode === false) async = false;


    //Execute a task.
    function fire() {
      if (tasks.length === finished && finished > 0) {
        return summeryFunc.apply(null, [{ 'res': result, 'errRes': errResult, 'allSuccess': !hasError }]);
      }
      if (fired < tasks.length) {
        var t = tasks[fired];
        var fn = t[0],
          params = slice.call(t, 1);
        if (async === false) {	//If queue mode is sync, then the tasks will get the preious tasks result as an arg.
          params.push(result);
        }
        params.push(callback(fired));
        fn.apply(null, params);
        fired++;
      }
    }

		/**
		 * Inversion of control.
		 * @param  {[Number]}   i [index of task]
		 * @return {Function}   [callback function]
		 */
    function callback(i) {
      return function (err, res) {
        if (err != null) {//
          hasError = true;
          //tasks.push([err, {'erridx': i}]);
          errResult[i] = err();
        } else {
          result[i] = res();
        }
        if (!hasError || async === true)
          finished++;
        else {
          finished = tasks.length;
        }
        fire();
      }
    }

    var queue = {
      defer: function () {
        if (!hasError || async === true) {
          tasks.push(arguments);
          if (async) {
            fire();
          } else if (fired === 0) {
            fire();
          }
        }
        return this;
      },
      summary: function (f) {//Rollup func.
        summeryFunc = f;
      }
    }
    queue.version = "1.0.0";
    return queue;
  }
  if (typeof define === "function" && define.amd) define(function () { return lp_queue; });
  else if (typeof module === "object" && module.exports) module.exports = lp_queue;
  else window.lp_queue = lp_queue;
} ();