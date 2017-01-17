'use strict'
function dispatcher(...args) {
  let i = 0; const len = args.length;
  const evts = {};
  for(; i < len; i++) {
    let evtname = typeof args[i] === 'string' ?
      args[i] :
      typeof args[i] === 'function' ? evts[args[i]()] : false;
    if(!evtname) throw new Error('Invalid parameters');
    evts[evtname] = function() {};
    evts[evtname].$evts = {};
  }
  return new Dispatcher(evts);
}

function Dispatcher(e) {
  Object.defineProperties(this, {
    $evts: {
      writable: true, enumerable: false, configurable: false, value: e
    },
    $unreg: {
      writable: true, enumerable: false, configurable: false, value: []
    }
  });
}

dispatcher.prototype = Dispatcher.prototype = {
  constructor: Dispatcher,
  on: function(types, func) {
    if(types + '' !== types || types + '' === '')
      throw new Error('Event name must be a string type param.');
    const names = types.split('.');
    if(!this.$evts.hasOwnProperty(names[0])) {
      throw new Error(`Dispatcher has no event's name of ${names[0]}`);
    }
    if(names.length === 1) {
      this.$unreg.push(register(this, func, names[0]));
    }
    else {
      let i = 1;
      let parent = this.$evts[names[0]];
      let curname;
      while(curname = names[i++]) {
        if (!names[i]) {
          this.$unreg.push(register(parent, func, curname));
          break;
        }
        if (!parent.$evts[curname]) {
          parent.$evts[curname] = function() {};
          parent.$evts[curname].$evts = {};
        }
        parent = parent.$evts[curname];
      }
    }
  },
  call: function(type, ctx, ...args) {
    const funcs = getFunc(this, type);
    funcs.forEach((f) => f.call(ctx, ...args));
  },
  apply: function(type, ctx, args) {
    const funcs = getFunc(this, type);
    funcs.forEach((f) => f.apply(ctx, args));
  },
  distroy: function(undefined) {
    this.$unreg.forEach((d) => d());
    this.$evts = undefined;
    this.$unreg = undefined;
  }
}

function register(obj, func, name) {
  let _;
  if (!obj.$evts) obj.$evts = {};
  else if (obj.$evts[name] && obj.$evts[name].$evts) {
    _ = obj.$evts[name].$evts;
  }
  obj.$evts[name] = func;
  obj.$evts[name].$evts = _ || {};
  return () => {
    obj.$evts[name] === undefined;
  }
}

function getFunc(obj, type) {
  const names = type.split('.');
  let i = 0
  let cur = obj;
  let curname;
  while(curname = names[i++]) {
    cur = cur.$evts[curname];
  }
  const res = [cur];
  appendChildrenFunc(cur.$evts, res);
  return res;

  function appendChildrenFunc(parent, res) {
    if (!parent) return;
    const keys = Object.keys(parent);
    keys.forEach(key => {
      if (typeof parent[key] === 'function') { 
        res.push(parent[key]);
        if (parent[key].$evts) {
          appendChildrenFunc(parent[key].$evts, res);
        }
      }
    });
    return res;
  }
}

export default dispatcher;
