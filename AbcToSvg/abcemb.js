var abc_emb;
var sfuPath = "../../soundfonts/Scc1t2";
abc_emb = fs.readFileSync('util/abcemb.js');
abc_emb = "var sfuPath = sfuPath || null;"+abc_emb;
abc_emb = abc_emb.replace("playconf = {","playconf = {sfu:sfuPath,");
abc_emb = abc_emb.replace(/abcemb[-]/ig,"abcemb");
abc_emb = abc_emb.replace(/[-][1]/ig,"");
abc_emb = abc_emb.replace('window.addEventListener("load", function() {setTimeout(dom_loaded, 500)})','setTimeout(dom_loaded, 500)')
//console.log(abc_emb);
eval.apply(null,[abc_emb])