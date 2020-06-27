var sfuPath = "../abc2svg/Scc1t2";
imports('editor/edit.css');
//imports('editor/editExt.css');
(sty=document.createElement("style")).textContent='::-webkit-scrollbar {width: 5px;height: 0px;}::-webkit-scrollbar-track {-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);border-radius: 10px;}::-webkit-scrollbar-thumb {border-radius: 3px;-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.5);}',document.head.appendChild(sty)
imports('editor/editExt.js');
imports('editor/edit.js');
