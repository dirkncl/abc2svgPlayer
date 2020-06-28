var abc_web;
var sfuPath = "../../soundfonts/Scc1t2";
abc_web = fs.readFileSync('util/abcweb.js');
abc_web = "var sfuPath = sfuPath || null;"+abc_web;
abc_web = abc_web.replace("playconf = {","playconf = {sfu:sfuPath,");
abc_web = abc_web.replace(/abcweb[-]/ig,"abcweb");
abc_web = abc_web.replace(/[-][1]/ig,"");
//abc_web = abc_web.replace('window.addEventListener("load", dom_loaded)','setTimeout(dom_loaded, 500)')
//abc_web = abc_web.replace('window.addEventListener("load", dom_loaded)','');
//abc_web = abc_web+'setTimeout(dom_loaded, 500)';
eval.apply(null,[abc_web])
