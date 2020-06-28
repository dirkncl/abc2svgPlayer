//var sfuPath = "../abc2svg/Scc1t2";
var sfuPath = "../../soundfonts/Scc1t2";
var edt;
imports('editor/edit.css');
(sty=document.createElement("style")).textContent='::-webkit-scrollbar {width: 5px;height: 0px;}::-webkit-scrollbar-track {-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);border-radius: 10px;}::-webkit-scrollbar-thumb {border-radius: 3px;-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.5);}',document.head.appendChild(sty)
edt = fs.readFileSync('editor/edit.js');
edt = edt.replace(/[-]@MAJOR@/ig,"")
edt = "var sfuPath = sfuPath || null;"+edt;
edt=edt.replace('onend: endplay','sfu:sfuPath,onend: endplay')
edt = edt.replace('window.addEventListener("load", edit_init)','');
edt = edt+'setTimeout(edit_init, 500)';
console.log(edt)
eval.apply(null,[edt])
imports('editExt.js');
