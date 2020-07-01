var abc_web;
var sfuPath = "../../soundfonts/Scc1t2";
abc_web = fs.readFileSync('util/abcweb1.js');
abc_web = "var sfuPath = sfuPath || null;"+abc_web;
abc_web = abc_web.replace("playconf = {","playconf = {\nsfu:sfuPath,");
abc_web = abc_web.replace(/abcweb1[-]/ig,"abcweb1");
abc_web = abc_web.replace(/[-][1]/ig,"");
//abc_web = abc_web.replace('window.addEventListener("load", dom_loaded)','setTimeout(dom_loaded, 500)')
//abc_web = abc_web.replace('window.addEventListener("load", dom_loaded)','');
//abc_web = abc_web+'setTimeout(dom_loaded, 500)';
eval.apply(null,[abc_web])
