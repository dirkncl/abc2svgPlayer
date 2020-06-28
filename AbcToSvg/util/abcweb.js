//#javascript
// abcweb-1.js file to include in html pages
//
// Copyright (C) 2014-2020 Jean-Francois Moine
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

    var user
if (typeof abc2svg == "undefined")
    var abc2svg = {}

// function called when abc2svg is fully loaded
function dom_loaded() {
var	abc,
	errtxt = '',
	app = "abcweb",
	new_page = '',
	playing,
	abcplay,
	playconf = {
		onend: function() {
			playing = false
		}
	},
	page,				// document source
	a_src = [],			// index: #sequence,
					//	value: [start_idx, end_idx]
	glop,				// global sequence for play
	old_gm,
	tune_lst,		// array of [tsfirst, voice_tb] per tune
	jsdir = document.currentScript ?
		    document.currentScript.src.match(/.*\//) :
		    (function() {
		     var s_a = document.getElementsByTagName('script')
			for (var k = 0; k < s_a.length; k++) {
				if (s_a[k].src.indexOf('abcweb-') >= 0)
					return s_a[k].src.match(/.*\//) || ''
			}
			return ""	// ??
	})()

// -- abc2svg init argument
    user = {
	errmsg: function(msg, l, c) {	// get the errors
		errtxt += clean_txt(msg) + '\n'
	},
	img_out: function(str) {	// image output
		new_page += str
	},
	page_format: true		// define the non-page-breakable blocks
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

	// function called on click on the music
	abc2svg.playseq = function(evt) {
	    var	i,
		tunes = abc.tunes,	// list of the tunes created by the core
		svg = evt.target,
		e = svg			// keep the clicked element

		// search if click in a SVG image
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
		i = i[1]		// tune number

		// initialize the play object
		if (!abcplay) {
			if (typeof AbcPlay == "undefined") { // as play-1.js not loaded,
				abc2svg.playseq = function(){}	// don't come here anymore
				return
			}
			abcplay = AbcPlay(playconf);
		}

		// if first time, get the tunes references
		// and generate the play data of all tunes
		if (tunes.length) {
			tune_lst = tunes.slice(0)	// (array copy)
			while (1) {
				t = tunes.shift()
				if (!t)
					break
				abcplay.add(t[0], t[1])
			}
		}

		// check if click on a music symbol
		// (this works when 'follow' is active)
		s = tune_lst[i][0]		// first symbol of the tune
		i = e.getAttribute('class')
		if (i)
			i = i.match(/abcr _(\d+)_/)
		if (playing) {
			abcplay.stop();
			if (!i)
				return
		}
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
		var s = document.createElement('script');
		if (/:\/\//.test(fn))
			s.src = fn		// absolute URL
		else
			s.src = jsdir + fn;
		s.type = 'text/javascript'
		if (relay)
			s.onload = relay;
		s.onerror = onerror || function() {
			alert('error loading ' + fn)
		}
		document.head.appendChild(s)
	}

function render() {

	// search the ABC tunes,
	// replace them by SVG images with play on click
    var	i = 0, j, k, res,
		re = /\n%abc|\nX:/g,
		re_stop = /\nX:|\n<|\n%.begin/g

	// aweful hack: user.anno_stop must be defined before Abc creation
	// for being set later by follow() !
	if (typeof follow == "function")
		user.anno_stop = function(){};

	abc = new abc2svg.Abc(user)

	// initialize the play follow function
	if (typeof follow == "function")
		follow(abc, user, playconf)

	// handle MEI files
	j = page.indexOf("<mei ")
	if (j >= 0) {
		k = page.indexOf("</mei>") + 6
		abc.mei2mus(page.slice(j, k))
		document.body.innerHTML = new_page
		return
	}

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

		try {
			abc.tosvg(app, page, j, k)
		} catch (e) {
			alert("abc2svg javascript error: " + e.message +
				"\nStack:\n" + e.stack)
		}
		abc2svg.abc_end()		// close the page if %%pageheight
		if (errtxt) {
			new_page += '<pre style="background:#ff8080">' +
					errtxt + "</pre>\n";
			errtxt = ""
		}

		i = k
		if (i >= page.length)
			break
		if (page[i] == 'X')
			i--
		re.lastIndex = i
	}

	// change the page
	try {
		document.body.innerHTML = new_page + page.slice(i)
	} catch (e) {
		alert("abc2svg bad generated SVG: " + e.message +
			"\nStack:\n" + e.stack)
	}

	// prepare for play on click
	window.onclick = abc2svg.playseq
} // render()

	// --- dom_loaded() main code ---

	// get the page content
	page = document.body.innerHTML

	// load the abc2svg core if not done by <script>
	if (!abc2svg.Abc) {
		abc2svg.loadjs(page.indexOf("<mei ") >= 0 ?
					"mei2svg-1.js" :
					"abc2svg-1.js",
						dom_loaded)
		return
	}

	// accept page formatting
	abc2svg.abc_end = function() {}

	// load the required modules, then render the music
	if (abc2svg.modules.load(page, render))
		render()
} // dom_loaded()

// wait for the scripts to be loaded
window.addEventListener("load", dom_loaded)
