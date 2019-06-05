//#javascript
// abcemb1-1.js file to include in html pages with abc2svg-1.js
//
// This script either:
// - builds a list of the tunes when there is no selection or
// - displays the selected tune.
//
// When the tune is displayed, if playing is not enabled,
// scrolling the music may be done by clicking/taping
// on the 'start scrolling' button.
//
// The header of the tune list ("Tunes:") may be set in a global
// javascript variable 'list_head'.
//
// Copyright (C) 2019 Jean-Francois Moine
//
// This file is part of abc2svg.
//
// abc2svg is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with abc2svg.  If not, see <http://www.gnu.org/licenses/>.

window.onerror = function(msg, url, line) {
  if (typeof msg == 'string')
    alert("window error: " + msg +
      "\nURL: " + url +
      "\nLine: " + line)
  else if (typeof msg == 'object')
    alert("window error: " + msg.type + ' ' + msg.target.src)
  else
    alert("window error: " + msg)
  return false
}

// function called when abc2svg is fully loaded
function dom_loaded() {
var  errtxt = '',
  app = "abcemb",
  new_page = '',
  playing,
  abcplay,

  scr_div,      // scroll status
  tune_dur,      // scroll tune duration
  scroll_to,      // scroll timeout
  dt,        // scroll delta per timeout
  scolor = "lightgreen",    // scroll start button color
  stxt = "start<br/>scrolling",  // associated text
  sY,        // current scroll Y

  page,        // document source
  src,        // source indexes [start, end]
  pe,        // playing events
  glop,        // global sequence for play
  jsdir = (function() {
    var scrs = document.getElementsByTagName('script')
    for (var i = 0; i < scrs.length; i++) {
      var a = scrs[i].src.match(/(.*?\/)abc2svg-.\.js/)
      if (a)
        return a[1]
    }
  })(),

// -- abc2svg init argument
    user = {
  errmsg: function(msg, l, c) {  // get the errors
    errtxt += clean_txt(msg) + '\n'
  },

  // function called before SVG generation
  get_abcmodel: function(tsfirst, voice_tb) {
      var  d, i, n, pf,
    s = tsfirst

    while (1) {
      if (s.tempo && !pf) {
        d = 0;
        n = s.tempo_notes.length
        for (i = 0; i < n; i++)
          d += s.tempo_notes[i];
        pf = d * s.tempo / 60
      }
      if (!s.ts_next)
        break
      s = s.ts_next
    }
    if (!pf)
      pf = abc2svg.C.BLEN / 8;  // default: Q:1/4=120
//           abc2svg.C.BLEN / 4 * 120 / 60
    tune_dur = s.time / pf
  },

  img_out: function(str) {  // image output
    new_page += str
  },

  page_format: true    // define the non-page-breakable blocks
    };

// play arguments
    playconf = {
  onend: function() {
    playing = false
  }
    }

// replace <>& by XML character references
function clean_txt(txt) {
  return txt.replace(/<|>|&.*?;|&/g, function(c) {
    switch (c) {
    case '<': return "&lt;"
    case '>': return "&gt;"
    case '&': return "&amp;"
    }
    return c
  })
}

// scroll the displayed music
function do_scroll(old) {

  // if start, get the window parameters and delay the first scroll
  if (!old) {
      var d = document.documentElement;

    // time for scrolling one pixel
    dt = tune_dur / d.scrollHeight

    // start scrolling at this time (1/4 of the first screen)
      var  ttop = dt * d.clientHeight / 4
    if (scr_div) {
      scr_div.style.background = "red";
      scr_div.innerHTML = "stop<br/>scrolling"
    }
    scroll_to = setTimeout(do_scroll, ttop * 1000, 1)

    // (in Android Browser, remove the address bar)
    window.scrollTo(0, 8);    // go to the top
    sY = 0;
  } else {
    if (sY == window.pageYOffset) {  // no scroll -> finished
      if (scr_div) {
        scr_div.style.background = scolor;
        scr_div.innerHTML = stxt
      }
      scroll_to = null
      return
    }
    sY = window.pageYOffset;
    window.scrollTo(0, sY + 1);
    scroll_to = setTimeout(do_scroll, dt * 1000, 1)
  }
}

// start/stop scrolling when no play
function st_scroll() {
  if (scroll_to) {
    clearTimeout(scroll_to);
    scr_div.style.background = scolor;
    scr_div.innerHTML = stxt;
    scroll_to = null
  } else {
    scroll_to = setTimeout(do_scroll, 500, 0)  // scroll start
  }
}

// function called on click in the music:
//  start / stop playing and scrolling
abc2svg.playseq = function() {
    var  outputs

  if (!abcplay) {        // if first time
    if (typeof AbcPlay == "undefined") {  // as play-1.js not loaded
      abc2svg.playseq = function(){}  // don't come here anymore
      return
    }
    delete user.img_out;    // stop SVG generation
    user.get_abcmodel = function(tsfirst, voice_tb) {
      abcplay.add(tsfirst, voice_tb)
    }
    abcplay = AbcPlay(playconf)
  }

  // stop
  if (playing) {
    if (scroll_to) {      // if scrolling active
      clearTimeout(scroll_to);  // stop it
      scroll_to = null
    }
    abcplay.stop();
    return
  }

  playing = true
  if (!pe) {      // if no playing event
    var abc = new abc2svg.Abc(user);

    abcplay.clear();
    abc.tosvg("play", "%%play")
    try {
      if (glop)
        abc.tosvg(app, page, glop[0], glop[1])
      abc.tosvg(app, page, src[0], src[1])
    } catch(e) {
      alert(e.message + '\nabc2svg tosvg bug - stack:\n' + e.stack);
      playing = false;
      pe = null
      return
    }
    pe = abcplay.clear()    // keep the playing events
  }
  if (document.documentElement.scrollHeight > window.innerHeight)
    scroll_to = setTimeout(do_scroll, 500, 0);  // scroll start
  abcplay.play(0, 100000, pe)
} // playseq()

// function to load javascript files
  abc2svg.loadjs = function(fn, relay, onerror) {
    var s = document.createElement('script');
    if (/:\/\//.test(fn))
      s.src = fn    // absolute URL
    else
      s.src = jsdir + fn;
    s.type = 'text/javascript'
    if (relay)
      s.onload = relay;
    s.onerror = onerror || function() {
      alert('error loading ' + fn)
    }
    document.head.appendChild(s)
  } // loadjs()

// build a list of the tunes
function get_sel() {
    var  j, k,
  n = 0,
  i = 0,
  t = (typeof list_head == "undefined" ? "Tunes:" : list_head) + '<ul>\n'

  // --- get_sel() main ---
  for (;;) {
    i = page.indexOf("\nX:", i)
    if (i < 0)
      break
    j = page.indexOf("\nT:", i)
    if (j < 0)
      break
    n++;
    t += '<li><a href="?#' + page.slice(i + 1, j) + '">';
    k = page.indexOf("\n", j + 1);
    t += page.slice(j + 3, k)
    if (page[k + 1] == 'T' && page[k + 2] == ':') {
      j = k + 3;
      k = page.indexOf("\n", j)
      if (k > 0)
        t += " - " + page.slice(j, k)
    }
    t += '</a></li>\n';
    i = k
  }
  if (n <= 1)
    return true;

  t += '</ul>';

  document.body.innerHTML = t
//  return false
} // get_sel()

function render() {

  // search the ABC tunes,
  // replace them by SVG images with play on click
    var  i = 0, j, k, res, abc,
  re = /\n%abc|\nX:/g,
  re_stop = /\nX:|\n<|\n%.begin/g,
  select = window.location.hash.slice(1)    // after '#'

  // if no selection and many tunes, get the references of the tunes
  // and ask which one to display
  if (!select
   && !get_sel())
    return

  select = page.search(decodeURIComponent(select))
  if (select < 0) {      // tune not found
    if (!get_sel())
      return
    select = 0      // only one tune
  }  

  // aweful hack: user.anno_stop must be defined before Abc creation
  // for being set later by follow() !
  if (typeof follow == "function")
    user.anno_stop = function(){};

  abc = new abc2svg.Abc(user)

  // initialize the play follow function
  if (typeof follow == "function")
    follow(abc, user, playconf)

  for (;;) {

    // get the start of a ABC sequence
    res = re.exec(page)
    if (!res)
      break
    j = re.lastIndex - res[0].length;
    new_page += page.slice(i, j);

    // get the end of the ABC sequence
    // including the %%beginxxx/%%endxxx sequences
    re_stop.lastIndex = ++j
    while (1) {
      res = re_stop.exec(page)
      if (!res || res[0][1] != "%")
        break
      k = page.indexOf(res[0].replace("begin", "end"),
          re_stop.lastIndex)
      if (k < 0)
        break
      re_stop.lastIndex = k
    }
    if (!res || k < 0)
      k = page.length
    else
      k = re_stop.lastIndex - 2;

      // selection
      if (!select || page[j] != 'X' || (select >= j && select < k)) {
    try {

    // clicking on the music plays this tune
        if (page[j] == 'X') {
      new_page += '<div onclick="abc2svg.playseq()">\n';
      src = [j, k]
        } else if (!glop) {
      glop = [j, k]
        }
      abc.tosvg(app, page, j, k)
    } catch (e) {
      alert("abc2svg javascript error: " + e.message +
        "\nStack:\n" + e.stack)
    }
    abc2svg.abc_end()    // close the page if %%pageheight
    if (errtxt) {
      i = page.indexOf("\n", j);
      i = page.indexOf("\n", i + 1);
      alert("Errors in\n" +
        page.slice(j, i) +
        "\n...\n\n" + errtxt);
      errtxt = ""
    }
    if (page[j] == 'X')
      new_page += '</div>\n'
      } // selection

    i = k
    if (i >= page.length)
      break
    if (page[i] == 'X')
      i--;
    re.lastIndex = i
  }

  // change the page
  try {
    document.body.innerHTML = new_page + page.slice(i)
  } catch (e) {
    alert("abc2svg bad generated SVG: " + e.message +
      "\nStack:\n" + e.stack)
    return
  }

  // if no playing stuff and big tune,
  // put a button to start/stop scrolling the rendering area
  setTimeout(function() {
      if (typeof AbcPlay == "undefined") {  // play-1.js not loaded
    if (document.documentElement.scrollHeight > window.innerHeight) {
      scr_div = document.createElement("div");
      scr_div.style.position = "fixed";
      scr_div.style.top = 0;
      scr_div.style.bottom = 0;
      scr_div.style.right = 0;
      scr_div.style.height = "40px";
      scr_div.style.padding = "5px";
      scr_div.style.cursor = "pointer";
      scr_div.style.background = scolor;
      scr_div.innerHTML = stxt;
      scr_div.addEventListener("click", st_scroll);
      document.body.appendChild(scr_div)
    }
      }
  }, 500)
} // render()

  // --- abcemb() main code ---

  // get the page content
  page = document.body.innerHTML;

  // accept page formatting
  abc2svg.abc_end = function() {}

  // load the required modules, then render the music
  if (abc2svg.modules.load(page, render))
    render()
} // dom_loaded()

// wait for the scripts to be loaded
window.addEventListener("load", function() {setTimeout(dom_loaded, 500)})
