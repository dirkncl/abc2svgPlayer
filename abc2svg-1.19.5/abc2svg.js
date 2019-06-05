var abc2svg = [];var tmp;
tmp = fs.readFileSync('core/license');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/abc2svg.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/deco.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/draw.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('font.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/format.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/front.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/music.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/parse.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/subs.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/svg.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/tune.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/lyrics.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/gchord.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/tail.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/modules.js');abc2svg.push(tmp);tmp=null;
tmp = fs.readFileSync('core/version.js');abc2svg.push(tmp);tmp='';
for(i=0;i<abc2svg.length;i++){tmp += abc2svg[i]}eval.apply( window, [tmp] )
