var d = dispatcher('start', 'end');
d.on('end', function() {console.log('end')});
d.on('end.end1.end11', function() {console.log('end11')});
d.on('end.end1.end12', function() {console.log('end12')});
d.on('end.end1', function() {console.log('end1')});
d.on('end.end2.end21', function() {console.log('end21')});
d.on('end.end2', function() {console.log('end2')});
d.call('end');
/**
 * end
 * end1
 * end11
 * end12
 * end2
 * end21
 */
d.call('end.end1');
/**
 * end1
 * end11
 * end12
 */

d.on('start.start2.start22', function() {console.log('start22')});
d.on('start', function() {console.log('start')});
d.on('start.start1.start11', function() {console.log('start11')});
d.on('start.start1.start12', function() {console.log('start12')});
d.on('start.start1', function() {console.log('start1')});
d.on('start.start2.start21', function() {console.log('start21')});
d.call('start');