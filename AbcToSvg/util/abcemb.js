//#javascript
// abcemb-1.js file to include in html pages with abc2svg-1.js
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
var	errtxt = '',
	new_page = '',
	playing,
	abcplay,
	page,				// document source
	a_src = [],			// index: #sequence,
					//	value: [start_idx, end_idx]
	a_pe = [],			// index: #sequence, value: playing events
	glop,				// global sequence for play
	old_gm,
	jsdir = document.currentScript ?
		    document.currentScript.src.match(/.*\//) :
		    (function() {
		     var s_a = document.getElementsByTagName('script')
			for (var k = 0; k < s_a.length; k++) {
				if (s_a[k].src.indexOf('abcemb-') >= 0)
					return s_a[k].src.match(/.*\//) || ''
			}
			return ""	// ??
	})(),

// play arguments
    playconf = {
	onend: function() {
		playing = false
	}
    }

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

function endplay() {
	playing = false
}

// function called on click on the music
abc2svg.playseq = function(seq) {
    var	outputs

	if (!abcplay) {
		if (typeof AbcPlay == "undefined") { // as play-1.js not loaded,
			abc2svg.playseq = function(){}	// don't come here anymore
			return
		}
		abcplay = AbcPlay(playconf);
	}
	if (playing) {
		abcplay.stop();
		return
	}
	playing = true
	if (!a_pe[seq]) {		// if no playing event
		var abc = new abc2svg.Abc(user);

		abcplay.clear();
		abc.tosvg("play", "%%play")
		try {
			if (glop)
				abc.tosvg("abcemb", page, glop[0], glop[1]);
			abc.tosvg("abcemb" + seq, page, a_src[seq][0], a_src[seq][1])
		} catch(e) {
			alert(e.message + '\nabc2svg tosvg bug - stack:\n' + e.stack);
			playing = false;
			a_pe[seq] = null
			return
		}
		a_pe[seq] = abcplay.clear()	// keep the playing events
	}
	abcplay.play(0, 100000, a_pe[seq])
}

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
    var	i = 0, j, k, res, abc,
		seq = 0,
		re = /\n%abc|\nX:/g,
		re_stop = /\nX:|\n<|\n%.begin/g,
		select = window.location.hash.slice(1);

	// aweful hack: user.anno_stop must be defined before Abc creation
	// for being set later by follow() !
	if (typeof follow == "function")
		user.anno_stop = function(){};

	abc = new abc2svg.Abc(user)

	// handle MEI files
	j = page.indexOf("<mei ")
	if (j >= 0) {
		k = page.indexOf("</mei>") + 6
		abc.mei2mus(page.slice(j, k))
		document.body.innerHTML = new_page
		// no play yet
		return
	}

	// initialize the play follow function
	if (typeof follow == "function")
		follow(abc, user, playconf)

	// check if a selection
	if (select) {
		select = decodeURIComponent(select);
		select = page.search(select)
		if (select < 0)
			select = 0
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

	    // selection
	    if (!select || page[j] != 'X' || (select >= j && select < k)) {

		// clicking on the music plays this tune
		if (page[j] == 'X') {
			new_page += '<div onclick="abc2svg.playseq(' +
					a_src.length + ')">\n';
			a_src.push([j, k])
		} else if (!glop) {
			glop = [j, k]
		}

		try {
			abc.tosvg('abcemb', page, j, k)
		} catch (e) {
			alert("abc2svg javascript error: " + e.message +
				"\nStack:\n" + e.stack)
		}
		if (errtxt) {
			new_page += '<pre style="background:#ff8080">' +
					errtxt + "</pre>\n";
			errtxt = ""
		}
		abc2svg.abc_end()		// close the page if %%pageheight
		if (page[j] == 'X')
			new_page += '</div>\n'
	    } // selection

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

	// prepare for playing
	delete user.img_out;		// stop SVG generation
	old_gm = user.get_abcmodel;
	user.get_abcmodel = function(tsfirst, voice_tb, music_types, info) {
			if (old_gm)
				old_gm(tsfirst, voice_tb, music_types, info);
			abcplay.add(tsfirst, voice_tb)
		}
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
window.addEventListener("load", function() {setTimeout(dom_loaded, 500)})
