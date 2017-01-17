function* Generator(next) {
  setTimeout(next, 1000);
  console.log(yield 1);

  setTimeout(next, 1000);
  console.log(yield 2);

  setTimeout(next, 1000);
  console.log(yield 3);
  return 'finished';
}

function process(f) {
  var g;
  var s;
  g = f(function () {
    if (!s.done) {
      s = g.next(s && s.value + 1 || undefined);
      console.log(s);
    }
  });
  s = g.next();
  console.log(s);
}

process(Generator);

var imgs = ['http://img4.duitang.com/uploads/item/201602/12/20160212170910_Ge4Px.jpeg', 'http://cdn.duitang.com/uploads/item/201509/05/20150905145913_sy8jT.jpeg', 'http://img3.duitang.com/uploads/item/201602/12/20160212164438_j4Ytr.thumb.700_0.jpeg'];

function* ajax(opts) {
  opts = opts || {};
  var req = new XMLHttpRequest();
  req.timeout = opts.timeout || 3000;
  req.open(opts.method || 'GET', opts.url || 'http://cdn.duitang.com/uploads/item/201509/05/20150905145913_sy8jT.jpeg', true);
  req.onreadystatechange = function (res) {
    if (res.currentTarget.readyState === 4 && res.currentTarget.status === 200) {
      console.log('finished');
    }
  }
  req.send();
}

function exec(f) {
  var gen = f(exec);
  function exec() {
    var res = arguments[0];
    if (!gen.done) {
      if (!res) {
        gen.next();
      } else if (typeof res.then === 'function') {
        res.then(function (r) {
          gen.next(r);
        });
      } else if (typeof res.next === 'function') {
        gen.next(exec(res));
      } else if (typeof res === 'function') {
        gen.next(res());
      } else {
        gen.next(res);
      }
    } else {
      debugger;
      return res;
    }
  }
  return exec;
}

function* test(exec) {
  var i = 0;
  while (++i <= 10) {
    console.log('input: ' + i);
    var v = yield exec(double(i));
    console.log('output: ' + v);
    console.log('output: 0x' + v.toString(16));
  }
}

function double(i) {
  return new Promise(function (r) {
    setTimeout(function () {
      r(i * 2);
    }, 500);
  });
}

function* toString16(c) {
  setTimeout()
  yield c.toString(16);
}
