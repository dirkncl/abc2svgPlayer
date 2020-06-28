//#javascript
// abcweb1-1.js file to include in html pages with abc2svg-1.js
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
// The tail of the tune list ("(all tunes)") may be set in a global
// javascript variable 'list_tail'.
//
// Copyright (C) 2019-2020 Jean-Francois Moine
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

// remove the menu button on print
window.onbeforeprint = function() {
   var	e = document.getElementById("dd")
	if (e)
		e.style.display = "none"
}
window.onafterprint = function() {
   var	e = document.getElementById("dd")
	if (e)
		e.style.display = "block"
}

    var user
if (typeof abc2svg == "undefined")
    var abc2svg = {}

// function called when abc2svg is fully loaded
function dom_loaded() {
    var	abc,
	new_page,
	playing,
	abcplay,

	tune_dur,			// scroll tune duration
	scroll_to,			// scroll timeout
	dt,				// scroll delta per timeout
	sY,				// current scroll Y

	page,				// document source
	errtxt = '',
	app = "abcweb1",
	playconf = {			// play arguments
		onend: function() {
			playing = false
		}
	},
	tune_lst,		// array of [tsfirst, voice_tb] per tune
	jsdir = document.currentScript ?
		    document.currentScript.src.match(/.*\//) :
		    (function() {
		     var s_a = document.getElementsByTagName('script')
			for (var k = 0; k < s_a.length; k++) {
				if (s_a[k].src.indexOf(app) >= 0)
					return s_a[k].src.match(/.*\//) || ''
			}
			return ""	// ??
	})()
// end of the variables of dom_loaded()

// -- abc2svg init argument
	user = {
		errmsg: function(msg, l, c) {	// get the errors
			errtxt += clean_txt(msg) + '\n'
		},

		// function called before SVG generation
		get_abcmodel: function(tsfirst, voice_tb) {
		    var	d, i, n, pf,
			s = tsfirst

			while (1) {
				if (s.tempo && !pf) {
					d = 0
					n = s.tempo_notes.length
					for (i = 0; i < n; i++)
						d += s.tempo_notes[i]
					pf = d * s.tempo / 60
				}
				if (!s.ts_next)
					break
				s = s.ts_next
			}
			if (!pf)
				pf = abc2svg.C.BLEN / 8	// default: Q:1/4=120
//				     abc2svg.C.BLEN / 4 * 120 / 60
			tune_dur = s.time / pf
		},

		img_out: function(str) {	// image output
			new_page += str
		},

		page_format: true		// define the non-page-breakable blocks
	} // user

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
	    var	d, ttop

		// if start, get the window parameters and delay the first scroll
		if (!old) {
			d = document.documentElement

			// time for scrolling one pixel
			dt = tune_dur / d.scrollHeight

			// start scrolling at this time (1/4 of the first screen)
			ttop = dt * d.clientHeight / 4
			document.getElementById("ss").style.display = "block"
			scroll_to = setTimeout(do_scroll, ttop * 1000, 1)

			// (in Android Browser, remove the address bar)
			window.scrollTo(0, 8)		// go to the top
			sY = 0
		} else {
			if (sY == window.pageYOffset) {	// no scroll -> finished
				document.getElementById("ss").style.display = "none"
				scroll_to = null
				return
			}
			sY = window.pageYOffset
			window.scrollTo(0, sY + 1)
			scroll_to = setTimeout(do_scroll, dt * 1000, 1)
		}
	} // do_scroll()

	// menu functions
	// click inside/outside of the menu button
	window.onmouseup = function(event) {
	    var	e = document.getElementById("dc")
		if (e) {
			if (event.target.className == "db")
				e.classList.toggle("show")
			else if (e.classList.contains("show"))
				e.classList.remove("show")
		}
	} // onmouseup()

	// source edit
	abc2svg.src_upd = function() {
		page = document.getElementById('ta').value
		abc2svg.get_sel()
	} // src_upd()

	abc2svg.src_edit = function() {
		// offer a textarea with the ABC source and 2 buttons
		document.body.innerHTML = '\
<textarea id="ta" rows="50" cols="80">' + page + '</textarea>\
<br/>\
<a href="#" onclick="abc2svg.src_upd()"> Apply </a> - \
<a href="#" onclick="abc2svg.get_sel()"> Cancel </a>'
	} // src_edit()

	// start/stop scrolling when no play
	abc2svg.st_scroll = function() {
		if (scroll_to) {
			clearTimeout(scroll_to)
			document.getElementById("ss").style.display = "none"
			scroll_to = null
		} else {
			scroll_to = setTimeout(do_scroll, 500, 0)	// scroll start
		}
	} // st_scroll()

	// function called on click in the music:
	//	start / stop playing
	abc2svg.playseq = function(evt) {
	    var	e, i, s,
		tunes = abc.tunes,	// list of the tunes created by the core
		svg = evt.target

		// initialize the play object
		if (!abcplay) {

			// if play-1.js is not loaded, don't come here anymore
			if (typeof AbcPlay == "undefined") {
				abc2svg.playseq = function(){}
				return
			}
			abcplay = AbcPlay(playconf)
		}

		// stop
		if (playing) {
			abcplay.stop()
			return
		}

		// search if click in a SVG image
		e = svg				// keep the clicked element
		while (svg.tagName != 'svg') {
			svg = svg.parentNode
			if (!svg)
				return
		}
		i = svg.getAttribute('class')
		if (!i)
			return
		i = i.match(/tune(\d+)/)
		if (!i)
			return
		i = i[1]			// tune number

		// if first time, get the tunes references
		// and generate the play data of all tunes
		if (tunes.length) {
			tune_lst = tunes.slice(0)	// (array copy)
			while (1) {
				s = tunes.shift()
				if (!s)
					break
				abcplay.add(s[0], s[1])
			}
		}

		// check if click on a music symbol
		// (this works when 'follow' is active)
		s = tune_lst[i][0]		// first symbol of the tune
		i = e.getAttribute('class')
		if (i)
			i = i.match(/abcr _(\d+)_/)
		if (i) {
			i = i[1]		// symbol offset in the source
			while (s && s.istart != i)
				s = s.ts_next
			if (!s) {		// fixme: error ?!
				alert("play bug: no such symbol in the tune")
				return
			}
		}

		playing = true
		abcplay.play(s, null)
	} // playseq()

	// function to load javascript files
	abc2svg.loadjs = function(fn, relay, onerror) {
	    var	s = document.createElement('script')
		if (/:\/\//.test(fn))
			s.src = fn		// absolute URL
		else
			s.src = jsdir + fn
		s.type = 'text/javascript'
		if (relay)
			s.onload = relay
		s.onerror = onerror || function() {
			alert('error loading ' + fn)
		}
		document.head.appendChild(s)
	} // loadjs()

	// build a list of the tunes
	abc2svg.get_sel = function() {
	    var	j, k,
		n = 0,
		i = 0,
		t = (typeof list_head == "undefined" ? "Tunes:" : list_head) + '<ul>\n'
		tt = typeof list_tail == "undefined" ? "(all tunes)" : list_tail

		window.onclick = null

		for (;;) {
			i = page.indexOf("\nX:", i)
			if (i < 0)
				break
			k = page.indexOf("\n", ++i)
			j = page.indexOf("\nT:", i)
			n++
			t += '<li><a \
style="cursor:pointer;color:blue;text-decoration:underline" \
onclick="abc2svg.do_render(\'' + page.slice(i, k) + '$\')">' +
				page.slice(i + 2, k).replace(/%.*/,'')
			if (j > 0 && j < i + 20) {
				k = page.indexOf("\n", j + 1)
				t += " " + page.slice(j + 3, k).replace(/%.*/,'')
				if (page[k + 1] == 'T' && page[k + 2] == ':') {
					j = k + 3
					k = page.indexOf("\n", j)
					t += " - " + page.slice(j, k).replace(/%.*/,'')
				}
			}
			t += '</a></li>\n'
			i = k
		}
		if (n <= 1) {
			abc2svg.do_render()
			return
		}
		t += '<li><a \
style="cursor:pointer;color:blue;text-decoration:underline" \
onclick="abc2svg.do_render(\'.*\')">' + tt + '</li>\n\
</ul>'

		document.body.innerHTML = t
		if (window.location.hash)
			window.location.hash = ''
	} // get_sel()

	// search/ask the tune to be rendered
	function render() {
	    var	select = window.location.hash.slice(1)		// after '#'

		// create styles for the menu
	   var	sty = document.createElement('style')
		sty.innerHTML = '\
.dd{position:fixed;top:0;bottom:0;right:0;height:40px;cursor:pointer;font-size:16px}\
#ss{display:none;background-color:red}\
.db{display:block;margin:5px; padding:5px;background-color:yellow}\
.db:hover,.db:focus{background-color:lightgreen}\
.dc{position:absolute;left:-70px;min-width:100px;display:none;background-color:yellow}\
.dc label{display:block;padding:0 5px 0 5px;margin:2px}\
.dc label:hover{outline:solid;outline-width:2px}\
.show{display:block}'
		document.head.appendChild(sty)

		// if no selection and many tunes, get the references of the tunes
		// and ask which one to display
		if (!select)
			abc2svg.get_sel()
		else
			abc2svg.do_render(decodeURIComponent(select))
	} // render()

	// replace the (previous) body by the music
	abc2svg.do_render = function(select) {

		// aweful hack: user.anno_stop must be defined before Abc creation
		// for being set later by follow() !
		if (typeof follow == "function")
			user.anno_stop = function(){}

		abc = new abc2svg.Abc(user)
		new_page = ""

		// initialize the play follow function
		if (typeof follow == "function")
			follow(abc, user, playconf)

		if (select) {
			abc.tosvg(app, "%%select " + select)
			window.location.hash = encodeURIComponent(select)
		}
		try {
			abc.tosvg(app, page)
		} catch (e) {
			alert("abc2svg javascript error: " + e.message +
				"\nStack:\n" + e.stack)
		}
		abc2svg.abc_end()	// close the page if %%pageheight
		if (errtxt) {
			new_page += '<pre style="background:#ff8080">' +
					errtxt + "</pre>\n"
			errtxt = ""
		}

		// add the menu
		new_page += '\
<div id="dd" class="dd">\
<label class="db">|||</label>\
<div id="dc" class="dc">\
<label id="edit" onclick="abc2svg.src_edit()">Source edit</label>\
<label id="list" onclick="abc2svg.get_sel()">Tune list</label>\
<label id="play" onclick="abc2svg.st_scroll()">Scroll</label>\
</div>\
</div>\
<label id="ss" class="dd" onclick="abc2svg.st_scroll()">Scroll<br/>stop</label>'

		// change the page
		try {
			document.body.innerHTML = new_page
		} catch (e) {
			alert("abc2svg bad generated SVG: " + e.message +
				"\nStack:\n" + e.stack)
			return
		}

		// prepare for play on click
		window.onclick = abc2svg.playseq

		// update the menu
		setTimeout(function() {

			// remove scroll in menu if play or not a big tune
			if (typeof AbcPlay != "undefined"
			 || document.documentElement.scrollHeight <= window.innerHeight)
				document.getElementById("play").style.display = "none"
		}, 500)
	} // render()

	// --- dom_loaded() main code ---

	// load the abc2svg core if not done by <script>
	if (!abc2svg.Abc) {
		abc2svg.loadjs("abc2svg-1.js", dom_loaded)
		return
	}

	// get the page content
	page = document.body.innerHTML

	// accept page formatting
	abc2svg.abc_end = function() {}

	// load the required modules, then render the music
	if (abc2svg.modules.load(page, render))
		render()
} // dom_loaded()

// wait for the scripts to be loaded
window.addEventListener("load", dom_loaded)
