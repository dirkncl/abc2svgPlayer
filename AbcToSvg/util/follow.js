// follow-1.js - file to include in html pages after
//	abcweb{,1,2}-1.js and snd-1.js.
//	This script permits to follow the notes while playing.
// Scrolling the music may be disabled setting 'no_scroll' in the window object.
//
// Copyright (C) 2015-2020 Jean-Francois Moine
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

// init
function follow(abc, user, playconf) {
var	ref = [],
	keep_types = {
		note: true,
		rest: true
	}

user.anno_stop = function(type, start, stop, x, y, w, h) {
	if (!keep_types[type])
		return
	ref[start] = stop;		// keep the source reference

	// create a rectangle
	abc.out_svg('<rect class="abcr _' + start + '_" x="');
	abc.out_sxsy(x, '" y="', y);
	abc.out_svg('" width="' + w.toFixed(2) +
		'" height="' + h.toFixed(2) + '"/>\n')
}

	playconf.onnote = function(i, on) {
		var elts = document.getElementsByClassName('_' + i + '_')
		if (elts && elts[0]) {
			elts[0].style.fillOpacity = on ? 0.4 : 0

			// scroll for the element to be in the screen
			if (on && !window.no_scroll) {
			    var	b = elts[0].getBoundingClientRect()
				if (b.top < 0)
					window.scrollTo(0, window.scrollY +
								b.top - 40)
				else if (b.bottom > window.innerHeight)
					window.scrollTo(0, window.scrollY +
								b.bottom -
							window.innerHeight + 40)
			}
		}
	}

	// create the style of the rectangles
	var sty = document.createElement("style");
	sty.innerHTML = ".abcr {fill: #d00000; fill-opacity: 0; z-index: 15}";
	document.head.appendChild(sty)
} // follow()
