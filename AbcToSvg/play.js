imports('util/play.js');
imports('util/toaudio.js');
imports('util/toaudio5.js');
//imports('util/midi.js');
var m = fs.readFileSync('util/midi.js');
m = m.replace('dt_set()',"");
eval.apply(null,[m]);

imports('util/sf2-parser.js');
imports('util/tomidi5.js');