
window.onerror = function(msg, url, line) {
  if(typeof msg == "string") alert("window error: " + msg + "\nURL: " + url + "\nLine: " + line);
  else if(typeof msg == "object") alert("window error: " + msg.type + " " + msg.target.src);
  else alert("window error: " + msg);
  return false
};
var abc_images, abc_fname = ["noname.abc", ""],
  abc, srcend, elt_ref = {},
  selx = [0, 0],
  selx_sav = [],
  play = {},
  pop, texts = {
    bad_nb: "Bad line number",
    fn: "File name: ",
    load: "Please, load the included file "
  },
  jsdir = document.currentScript ? document.currentScript.src.match(/.*\//) : function() {
    var scrs = document.getElementsByTagName("script");
    return scrs[scrs.length - 1].src.match(/.*\//) || ""
  }();
var user = {
    read_file: function(fn) {
      elt_ref["s" + srcidx].style.display = "inline";
      return elt_ref.src1.value
    },
    errmsg: function(msg, l, c) {
      msg = clean_txt(msg);
      if(l) elt_ref.diverr.innerHTML += '<b onclick="gotoabc(' + l + "," + c + ')" style="cursor: pointer; display: inline-block">' + msg + "</b><br/>\n";
      else elt_ref.diverr.innerHTML += msg + "<br/>\n"
    },
    my_img_out: function(str) {
      abc_images += str
    },
    anno_stop: function(type, start, stop, x, y, w, h) {
      if(["beam", "slur", "tuplet"].indexOf(type) >= 0) return;
      srcend[start] = stop;
      abc.out_svg('<rect class="abcr _' + start + '_" x="');
      abc.out_sxsy(x, '" y="', y);
      abc.out_svg('" width="' + w.toFixed(2) + '" height="' + abc.sh(h).toFixed(2) + '"/>\n')
    },
    page_format: true
  },
  srcidx = 0;

function storage(t, k, v) {
  try {
    t = t ? localStorage : sessionStorage;
    if(!t) return;
    if(v) t.setItem(k, v);
    else if(v === 0) t.removeItem(k);
    else return t.getItem(k)
  } catch (e) {}
}

function clean_txt(txt) {
  return txt.replace(/<|>|&.*?;|&/g, function(c) {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;"
    }
    return c
  })
}

function loadlang(lang, no_memo) {
  abc2svg.loadjs("edit-" + lang + ".js", function() {
    loadtxt()
  });
  abc2svg.loadjs("err-" + lang + ".js");
  if(!no_memo) storage(true, "lang", lang == "en" ? 0 : lang)
}

function popshow(area, visible) {
  var e = document.getElementById(area);
  if(pop) {
    if(pop == e) visible = false;
    else pop.style.visibility = "hidden"
  }
  e.style.visibility = visible ? "visible" : "hidden";
  pop = visible ? e : null
}
////////////////////////////////////////////
//////////////////////////////////////////
function LoadTune(file){
  var LoadTuneContent;
  var f = new XMLHttpRequest();
  abc_fname[srcidx]=file;
  f.open("GET", file, false);
  f.overrideMimeType('text/plain; charset=UTF-8');
  f.onreadystatechange = function (){
    LoadTuneContent=f.responseText;
    proses(LoadTuneContent);
    PlayTune(-1)
  }
  f.send();
}

function proses(data){
  var i,
      j,
      sl,
      content=data,
      s=srcidx==0?"source":"src1";
  elt_ref[s].value = content;
  elt_ref["s" + srcidx].value = abc_fname[srcidx];
  src_change()
}
/////////////////////////////////////////////
////////////////////////////////////////////

function loadtune() {
  var files = document.getElementById("abcfile").files;
  abc_fname[srcidx] = files[0].name;
  var reader = new FileReader;
  reader.onloadend = function(evt) {
    var i, j, sl, content = evt.target.result,
      s = srcidx == 0 ? "source" : "src1";
    elt_ref[s].value = content;
    elt_ref["s" + srcidx].value = abc_fname[srcidx];
    src_change()
  };
  reader.readAsText(files[0], "UTF-8")
}

function selsrc(idx) {
  if(idx == srcidx) return;
  var o = srcidx ? "src" + srcidx : "source",
    n = idx ? "src" + idx : "source";
  elt_ref[o].style.display = "none";
  elt_ref[n].style.display = "inline";
  elt_ref["s" + srcidx].style.backgroundColor = "#ffd0d0";
  elt_ref["s" + idx].style.backgroundColor = "#80ff80";
  srcidx = idx
}

function render() {
  var i, j, content = elt_ref.source.value;
  play.a_pe = null;
  if(!content) return;
  i = content.indexOf("%%abc-include ");
  if(i >= 0) {
    var sl = elt_ref.s1;
    if(!sl.value) {
      sl.style.display = "inline";
      j = content.indexOf("\n", i);
      sl.value = content.slice(i + 14, j);
      selsrc(1);
      alert(texts.load + sl.value);
      return
    }
  }
  elt_ref.diverr.innerHTML = "";
  render2()
}

function render2() {
  var content = elt_ref.source.value;
  if(!abc2svg.modules.load(content + elt_ref.src1.value, render2)) return;
  user.img_out = user.my_img_out;
  user.get_abcmodel = null;
  abc = new abc2svg.Abc(user);
  abc_images = "";
  abc.tosvg("edit", "%%bgcolor white");
  srcend = [];
  try {
    abc.tosvg(abc_fname[0], content)
  } catch (e) {
    alert(e.message + "\nabc2svg tosvg bug - stack:\n" + e.stack);
    return
  }
  try {
    elt_ref.target.innerHTML = abc_images
  } catch (e) {
    alert(e.message + "\nabc2svg image bug - abort");
    return
  }
  document.getElementById("er").style.display = elt_ref.diverr.innerHTML ? "inline" : "none"
}

function gotoabc(l, c) {
  var s = elt_ref.source,
    idx = 0;
  selsrc(0);
  while(--l >= 0) {
    idx = s.value.indexOf("\n", idx) + 1;
    if(idx <= 0) {
      alert(texts.bad_nb);
      idx = s.value.length - 1;
      c = 0;
      break
    }
  }
  c = Number(c) + idx;
  s.focus();
  s.setSelectionRange(c, srcend[c] || c + 1)
}

function svgsel(evt) {
  var elt = evt.target,
    cl = elt.getAttribute("class"),
    ctxMenu = document.getElementById("ctxMenu");
  play.loop = false;
  evt.stopImmediatePropagation();
  evt.preventDefault();
  if(ctxMenu && ctxMenu.style.display == "block") {
    ctxMenu.style.display = "none";
    return false
  }
  if(play.playing && !play.stop) {
    play.stop = -1;
    play.abcplay.stop();
    return false
  }
  if(cl && cl.substr(0, 4) == "abcr") setsel(0, Number(cl.slice(6, -1)));
  else setsel(0, 0);
  setsel(1, 0)
}

function setsel(idx, v, seltxt) {
  var i, elts, s, old_v = selx[idx];
  if(v == old_v) return;
  if(old_v) {
    elts = document.getElementsByClassName("_" + old_v + "_");
    i = elts.length;
    while(--i >= 0) elts[i].style.fillOpacity = 0
  }
  if(v) {
    elts = document.getElementsByClassName("_" + v + "_");
    i = elts.length;
    while(--i >= 0) elts[i].style.fillOpacity = .4
  }
  selx[idx] = v;
  if(idx != 0 || seltxt || !v) return;
  s = elt_ref.source;
  selsrc(0);
  s.setSelectionRange(v, srcend[v]);
  s.blur();
  s.focus()
}

function seltxt(evt) {
  var s, elts, e = 0,
    elt = elt_ref.source,
    start = elt.selectionStart,
    end = elt.selectionEnd;
  play.loop = false;
  if(!start || end == elt.value.length) return;
  if(srcend) {
    srcend.forEach(function(ie, is) {
      if(!s) {
        if(is >= start) s = is
      } else if(ie <= end) {
        e = is
      }
    })
  }
  if(!s) return;
  if(selx[0] != s) setsel(0, s, true);
  if(selx[1] != e) setsel(1, e);
  elts = document.getElementsByClassName("_" + s + "_");
  if(elts[0]) elts[0].scrollIntoView()
}

function saveas() {
  var s = srcidx == 0 ? "source" : "src1",
    source = elt_ref[s].value,
    uriContent = "data:text/plain;charset=utf-8," + encodeURIComponent(source),
    link = document.createElement("a");
  elt_ref["s" + srcidx].value = link.download = abc_fname[srcidx] = prompt(texts.fn, abc_fname[srcidx]);
  link.innerHTML = "Hidden Link";
  link.href = uriContent;
  link.target = "_blank";
  link.onclick = destroyClickedElement;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click()
}

function destroyClickedElement(evt) {
  document.body.removeChild(evt.target)
}

function setfont() {
  var fs = document.getElementById("fontsize").value.toString();
  elt_ref.source.style.fontSize = elt_ref.src1.style.fontSize = fs + "px";
  storage(true, "fontsz", fs == "14" ? 0 : fs)
}

function set_sfu(v) {
  play.abcplay.set_sfu(v);
  storage(true, "sfu", v == "Scc1t2" ? 0 : v)
}

function set_speed(iv) {
  var spvl = document.getElementById("spvl"),
    v = Math.pow(3, (iv - 10) * .1);
  play.abcplay.set_speed(v);
  spvl.innerHTML = v
}

function set_vol(v) {
  var gvl = document.getElementById("gvl");
  gvl.innerHTML = v.toFixed(2);
  play.abcplay.set_vol(v);
  storage(true, "volume", v == .7 ? 0 : v.toFixed(2))
}

function notehlight(i, on) {
  if(play.stop) {
    if(on) {
      if(play.stop < 0) play.stop = i;
      return
    }
    if(i == selx[1]) return
  }
  var elts = document.getElementsByClassName("_" + i + "_");
  if(elts && elts[0]) elts[0].style.fillOpacity = on ? .4 : 0
}

function endplay() {
  if(play.loop) {
    play.abcplay.play(play.si, play.ei, play.a_pe);
    return
  }
  play.playing = false;
  setsel(0, selx_sav[0]);
  setsel(1, selx_sav[1])
}
///////////////////////////////////
////////////////////////////////////
function PlayTune(what) {
  if(play.playing) {
    if(!play.stop) {
      play.stop = -1;
      play.abcplay.stop()
    }
    return
  }

  function get_se(si) {
    var i, s, tim, sih = 1e6,
      pa = play.a_pe,
      ci = 0;
    if(si <= pa[0][0]) return 0;
    if(si >= pa[pa.length - 1][0]) return pa.length;
    i = pa.length;
    while(--i > 0) {
      s = pa[i][0];
      if(s < si) continue;
      if(s == si) {
        ci = i;
        break
      }
      if(s < sih) {
        ci = i;
        sih = s
      }
    }
    if(ci < pa.length) {
      tim = pa[ci][1];
      while(--ci >= 0) {
        if(pa[ci][1] != tim) break
      }
    }
    return ci + 1
  }

  function get_ee(si) {
    var i, s, tim, sil = 0,
      pa = play.a_pe,
      ci = 0;
    if(si <= pa[0][0]) return 0;
    if(si >= pa[pa.length - 1][0]) return pa.length;
    for(i = 0; i < pa.length; i++) {
      s = pa[i][0];
      if(s > si) continue;
      if(s == si) {
        ci = i;
        break
      }
      if(s > sil) {
        ci = i;
        sil = s
      }
    }
    if(ci > 0) {
      tim = pa[ci++][1];
      for(; ci < pa.length; ci++) {
        if(pa[ci][1] != tim) break
      }
    }
    return ci
  }

  function play_start(si, ei) {
    selx_sav[0] = selx[0];
    selx_sav[1] = selx[1];
    setsel(0, 0);
    setsel(1, 0);
    play.stop = 0;
    play.abcplay.play(si, ei, play.a_pe)
  }
  var abc, i, si, ei, elt, tim, s = elt_ref.source.value,
    ctxMenu = document.getElementById("ctxMenu");
  ctxMenu.style.display = "none";
  play.playing = true;
  if(!play.a_pe) {
    user.img_out = null;
    user.get_abcmodel = play.abcplay.add;
    abc = new abc2svg.Abc(user);
    play.abcplay.clear();
    abc.tosvg("play", "%%play");
    try {
      abc.tosvg(abc_fname[0], s)
    } catch (e) {
      alert(e.message + "\nabc2svg tosvg bug - stack:\n" + e.stack);
      play.playing = false;
      play.a_pe = null;
      return
    }
    play.a_pe = play.abcplay.clear();
    play.si = play.ei = play.stop = 0;
    play.loop = false
  }
  if(what < 0) {
    play.loop = false;
    play.si = 0;
    play.ei = play.a_pe.length;
    play_start(play.si, play.ei);
    return
  }
  if(what == 2 && play.loop) {
    play_start(play.si, play.ei);
    return
  }
  if(what == 3 && play.stop > 0) {
    play_start(get_se(play.stop), play.ei);
    return
  }
  if(what != 0 && selx[0] && selx[1]) {
    si = get_se(selx[0]);
    ei = get_ee(selx[1])
  } 
  else if(what != 0 && selx[0]) {
    si = get_se(selx[0]);
    i = s.indexOf("\nX:", selx[0]);
    ei = i < 0 ? play.a_pe.length : get_ee(i)
  } 
  else if(what != 0 && selx[1]) {
    i = s.lastIndexOf("\nX:", selx[1]);
    si = i < 0 ? 0 : get_se(i);
    ei = get_ee(selx[1])
  } else {
    elt = play.svg.getElementsByClassName("abcr");
    i = elt ? Number(elt[0].getAttribute("class").slice(6, -1)) : 0;
    si = ei = 0;
    if(s[0] == "X" && s[1] == ":") si = 1;
    while(1) {
      ei = s.indexOf("\nX:", ei);
      if(ei < 0 || ei > i) break;
      si = s.indexOf("\nK:", ++ei);
      if(si < 0) break;
      ei = si
    }
    if(si <= 0) {
      play.playing = false;
      return
    }
    si = get_se(si);
    ei = ei < 0 ? play.a_pe.length : get_ee(ei)
  }
  if(what != 3) {
    play.si = si;
    play.ei = ei;
    play.loop = what == 2
  }
  play_start(si, ei)
}
///////////////////////////////////
////////////////////////////////////
function play_tune(what) {
  if(play.playing) {
    if(!play.stop) {
      play.stop = -1;
      play.abcplay.stop()
    }
    return
  }

  function get_se(si) {
    var i, s, tim, sih = 1e6,
      pa = play.a_pe,
      ci = 0;
    if(si <= pa[0][0]) return 0;
    if(si >= pa[pa.length - 1][0]) return pa.length;
    i = pa.length;
    while(--i > 0) {
      s = pa[i][0];
      if(s < si) continue;
      if(s == si) {
        ci = i;
        break
      }
      if(s < sih) {
        ci = i;
        sih = s
      }
    }
    if(ci < pa.length) {
      tim = pa[ci][1];
      while(--ci >= 0) {
        if(pa[ci][1] != tim) break
      }
    }
    return ci + 1
  }

  function get_ee(si) {
    var i, s, tim, sil = 0,
      pa = play.a_pe,
      ci = 0;
    if(si <= pa[0][0]) return 0;
    if(si >= pa[pa.length - 1][0]) return pa.length;
    for(i = 0; i < pa.length; i++) {
      s = pa[i][0];
      if(s > si) continue;
      if(s == si) {
        ci = i;
        break
      }
      if(s > sil) {
        ci = i;
        sil = s
      }
    }
    if(ci > 0) {
      tim = pa[ci++][1];
      for(; ci < pa.length; ci++) {
        if(pa[ci][1] != tim) break
      }
    }
    return ci
  }

  function play_start(si, ei) {
    selx_sav[0] = selx[0];
    selx_sav[1] = selx[1];
    setsel(0, 0);
    setsel(1, 0);
    play.stop = 0;
    play.abcplay.play(si, ei, play.a_pe)
  }
  var abc, i, si, ei, elt, tim, s = elt_ref.source.value,
    ctxMenu = document.getElementById("ctxMenu");
  ctxMenu.style.display = "none";
  play.playing = true;
  if(!play.a_pe) {
    user.img_out = null;
    user.get_abcmodel = play.abcplay.add;
    abc = new abc2svg.Abc(user);
    play.abcplay.clear();
    abc.tosvg("play", "%%play");
    try {
      abc.tosvg(abc_fname[0], s)
    } catch (e) {
      alert(e.message + "\nabc2svg tosvg bug - stack:\n" + e.stack);
      play.playing = false;
      play.a_pe = null;
      return
    }
    play.a_pe = play.abcplay.clear();
    play.si = play.ei = play.stop = 0;
    play.loop = false
  }
  if(what < 0) {
    play.loop = false;
    play.si = 0;
    play.ei = play.a_pe.length;
    play_start(play.si, play.ei);
    return
  }
  if(what == 2 && play.loop) {
    play_start(play.si, play.ei);
    return
  }
  if(what == 3 && play.stop > 0) {
    play_start(get_se(play.stop), play.ei);
    return
  }
  if(what != 0 && selx[0] && selx[1]) {
    si = get_se(selx[0]);
    ei = get_ee(selx[1])
  } else if(what != 0 && selx[0]) {
    si = get_se(selx[0]);
    i = s.indexOf("\nX:", selx[0]);
    ei = i < 0 ? play.a_pe.length : get_ee(i)
  } else if(what != 0 && selx[1]) {
    i = s.lastIndexOf("\nX:", selx[1]);
    si = i < 0 ? 0 : get_se(i);
    ei = get_ee(selx[1])
  } else {
    elt = play.svg.getElementsByClassName("abcr");
    i = elt ? Number(elt[0].getAttribute("class").slice(6, -1)) : 0;
    si = ei = 0;
    if(s[0] == "X" && s[1] == ":") si = 1;
    while(1) {
      ei = s.indexOf("\nX:", ei);
      if(ei < 0 || ei > i) break;
      si = s.indexOf("\nK:", ++ei);
      if(si < 0) break;
      ei = si
    }
    if(si <= 0) {
      play.playing = false;
      return
    }
    si = get_se(si);
    ei = ei < 0 ? play.a_pe.length : get_ee(ei)
  }
  if(what != 3) {
    play.si = si;
    play.ei = ei;
    play.loop = what == 2
  }
  play_start(si, ei)
}

function edit_init() {
  if(typeof abc2svg != "object" || !abc2svg.modules) {
    setTimeout(edit_init, 500);
    return
  }
  abc2svg.loadjs = function(fn, relay, onerror) {
    var s = document.createElement("script");
    if(/:\/\//.test(fn)) s.src = fn;
    else s.src = jsdir + fn;
    s.type = "text/javascript";
    if(relay) s.onload = relay;
    s.onerror = onerror || function() {
      alert("error loading " + fn)
    };
    document.head.appendChild(s)
  };

  function set_pref() {
    var v = storage(true, "fontsz");
    if(v) {
      elt_ref.source.style.fontSize = elt_ref.src1.style.fontSize = v + "px";
      document.getElementById("fontsize").value = Number(v)
    }
    v = storage(true, "lang");
    if(v) loadlang(v, true)
  }
  document.getElementById("abc2svg").innerHTML = "abc2svg-" + abc2svg.version + " (" + abc2svg.vdate + ")";
  var a = ["diverr", "source", "src1", "s0", "s1", "target"];
  for(var i = 0; i < a.length; i++) {
    var e = a[i];
    elt_ref[e] = document.getElementById(e)
  }
  document.getElementById("saveas").onclick = saveas;
  elt_ref.s0.onclick = function() {
    selsrc(0)
  };
  elt_ref.s1.onclick = function() {
    selsrc(1)
  };
  elt_ref.target.onclick = svgsel;
  elt_ref.source.onselect = seltxt;
  window.onbeforeprint = function() {
    selx_sav[0] = selx[0];
    selx_sav[1] = selx[1];
    setsel(0, 0);
    setsel(1, 0)
  };
  window.onafterprint = function() {
    setsel(0, selx_sav[0]);
    setsel(1, selx_sav[1])
  };
  if(window.AudioContext || window.webkitAudioContext || navigator.requestMIDIAccess) {
    abc2svg.loadjs("play-1.src.js", function() {
      play.abcplay = AbcPlay({
        onend: endplay,
        onnote: notehlight
      });
      document.getElementById("playdiv1").style.display = document.getElementById("playdiv3").style.display = document.getElementById("playdiv4").style.display = "list-item";
      document.getElementById("sfu").value = play.abcplay.set_sfu();
      document.getElementById("gvol").setAttribute("value", play.abcplay.set_vol() * 10);
      document.getElementById("gvl").setAttribute("value", (play.abcplay.set_vol() * 10).toFixed(2))
    });
    
    var e = elt_ref.target;
    e.oncontextmenu = function(evt) {
      var x, y, elt = evt.target,
        cl = elt.getAttribute("class");
      evt.stopImmediatePropagation();
      evt.preventDefault();
      if(cl && cl.substr(0, 4) == "abcr") {
        setsel(1, Number(cl.slice(6, -1)));
        return false
      }
      while(elt.tagName != "svg") {
        elt = elt.parentNode
      }
      play.svg = elt;
      var ctxMenu = document.getElementById("ctxMenu");
      ctxMenu.style.display = "block";
      x = evt.pageX - elt_ref.target.parentNode.offsetLeft + elt_ref.target.parentNode.scrollLeft;
      y = evt.pageY + elt_ref.target.parentNode.scrollTop;
      ctxMenu.style.left = x - 30 + "px";
      ctxMenu.style.top = y - 10 + "px";
      return false
    }
    
  }
  set_pref()
}

function drag_over(evt) {
  evt.stopImmediatePropagation();
  evt.preventDefault()
}

function dropped(evt) {
  evt.stopImmediatePropagation();
  evt.preventDefault();
  var data = evt.dataTransfer.getData("text");
  if(data) {
    evt.target.value = data;
    src_change();
    return
  }
  data = evt.dataTransfer.files;
  if(data.length != 0) {
    var reader = new FileReader;
    reader.onload = function(evt) {
      elt_ref.source.value = evt.target.result;
      src_change()
    };
    reader.readAsText(data[0], "UTF-8");
    return
  }
}
var timer;

function src_change() {
  clearTimeout(timer);
  if(!play.playing) timer = setTimeout(render, 2e3)
}
setTimeout(edit_init, 500);
//////////////////////////////
//////////////////////////////

window.onload=(function Target(){
  //soundSource=1; 
  
  var tgt=document.createElement('div');
  tgt.style.display="none";
  tgt.id='target';
  tgt.innerHTML= ''+
      '<svg xmlns="http://www.w3.org/2000/svg"'+
	    '  xmlns:xlink="http://www.w3.org/1999/xlink"'+
	    '  xml:space="preserve"'+
	    '  width="8.3in" height="2in" viewBox="0 0 595 144">'+
      '  <title></title>'+
      '  <text x="250" y="100" font-family="serif" font-size="12"></text>'+
      '</svg>';
  document.getElementById('dright').appendChild(tgt);    
})  
var hStaff=document.createElement('center');
hStaff.setAttribute('id','hideStaff');
document.body.appendChild(hStaff);
var btnHS=document.createElement('button');
btnHS.setAttribute('id','HS');
btnHS.innerHTML='Hide Staff';
document.getElementById('hideStaff').appendChild(btnHS);

document.getElementById('HS').addEventListener('click',function(){
  (document.getElementById('target').style.display=='block')? (
    document.getElementById('target').style.display="none",
    document.getElementById('HS').innerHTML="Show Staff"   
  ):(
  document.getElementById('target').style.display="block",
  document.getElementById('HS').innerHTML="Hide Staff" 
  )
},false);
/*
var sndSrc=document.createElement('center');
sndSrc.setAttribute('id','SoundSource');
document.body.appendChild(sndSrc);
var btnsndSrc=document.createElement('button');
btnsndSrc.setAttribute('id','btnSND');
btnsndSrc.innerHTML='select sound';
document.getElementById('SoundSource').appendChild(btnsndSrc);
document.getElementById('btnSND').addEventListener('click',function(){
  (soundSource)? (
    soundSource=1,
    document.getElementById('btnSND').innerHTML="sf2"
  ):(
  soundSource=0,
  document.getElementById('btnSND').innerHTML="Midi" 
  
  )
},false);
*/


var ctr=document.createElement('center');
ctr.setAttribute('id','btnHolder');
document.body.appendChild(ctr);
var btn=document.createElement('button');
btn.setAttribute('id','linkHolder');
btn.innerHTML='<span style="color:red">Play :</span>'
document.getElementById('btnHolder').appendChild(btn);
var ls=window.location.search;
var fileIn="";
fileIn = decodeURIComponent(ls).replace(/\+/g, " ").replace('?','');
if(fileIn.indexOf('&')!=-1) {
  fileIn=fileIn.split('&');
  fileIn[1]="";
  fileIn=fileIn[0];
};
var a=document.createElement('a');
a.setAttribute('id','urlHolder');
if(fileIn!="") {
  a.href="javascript:LoadTune('"+fileIn+"');document.getElementById('target').style.display='block'";
};
var Fn=fileIn.substring(fileIn.lastIndexOf('/')+1);
a.innerHTML='  ' + Fn.replace('.abc','');
a.setAttribute('style','display:');
a.setAttribute('style','textDecoration:none');
a.title="click here to play";
document.getElementById('linkHolder').appendChild(a);
document.getElementById("urlHolder").addEventListener("click",function(){document.getElementById("target").style.display="block"},false);
