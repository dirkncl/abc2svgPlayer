// abc2svg - gchord.js - chord symbols
//
// Copyright (C) 2014-2019 Jean-Francois Moine
//
// This file is part of abc2svg-core.
//
// abc2svg-core is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg-core is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

// -- parse a chord symbol / annotation --
// the result is added in the global variable a_gch
// 'type' may be a single '"' or a string '"xxx"' created by U:
function parse_gchord(type) {
	var	c, text, gch, x_abs, y_abs, type,
		i, istart, iend,
		ann_font = get_font("annotation"),
		h_ann = ann_font.size,
		line = parse.line

	function get_float() {
		var txt = ''

		while (1) {
			c = text[i++]
			if ("1234567890.-".indexOf(c) < 0)
				return parseFloat(txt)
			txt += c
		}
	} // get_float()

	istart = parse.bol + line.index
	if (type.length > 1) {			// U:
		text = type.slice(1, -1);
		iend = istart + 1
	} else {
		text = ""
		while (1) {
			c = line.next_char()
			if (!c) {
				syntax(1, "No end of guitar chord")
				return
			}
			if (c == '"')
				break
			if (c == '\\') {
				text += c;
				c = line.next_char()
			}
			text += c
		}
		iend = parse.bol + line.index + 1
	}

	if (curvoice.pos.gch == C.SL_HIDDEN)
		return

	if (ann_font.box)
		h_ann += 3;
	i = 0;
	type = 'g'
	while (1) {
		c = text[i]
		if (!c)
			break
		gch = {
			text: "",
			istart: istart,
			iend: iend,
			font: ann_font
		}
		switch (c) {
		case '@':
			type = c;
			i++;
			x_abs = get_float()
			if (c != ',') {
				syntax(1, "',' lacking in annotation '@x,y'");
				y_abs = 0
			} else {
				y_abs = get_float()
				if (c != ' ')
					i--
			}
			gch.x = x_abs;
			gch.y = y_abs - h_ann / 2
			break
		case '^':
		case '_':
		case '<':
		case '>':
			i++;
			type = c
			break
		default:
			switch (type) {
			case 'g':
				gch.font = get_font("gchord")
				break
			case '@':
				gch.x = x_abs;
				y_abs -= h_ann;
				gch.y = y_abs - h_ann / 2
				break
			}
			break
		}
		gch.type = type
		while (1) {
			c = text[i]
			if (!c)
				break
			switch (c) {
			case '\\':
				c = text[++i]
				if (!c || c == 'n')
					break
				gch.text += '\\'
			default:
				gch.text += c;
				i++
				continue
			case '&':			/* skip "&xxx;" */
				while (1) {
					gch.text += c;
					c = text[++i]
					switch (c) {
					default:
						continue
					case ';':
					case undefined:
					case '\\':
						break
					}
					break
				}
				if (c == ';') {
					i++;
					gch.text += c
					continue
				}
				break
			case ';':
				break
			}
			i++
			break
		}
		if (!a_gch)
			a_gch = []
		a_gch.push(gch)
	}
}

// transpose a chord symbol
var	note_names = "CDEFGAB",
	acc_name = ["bb", "b", "", "#", "##"]

	function gch_tr1(p, transp) {
	    var	i, o, n, a, ip, b40,
		csa = p.split('/')

		for (i = 0; i < csa.length; i++) {	// main and optional bass
			p = csa[i];
			o = p.search(/[ABCDEFG]/);
			if (o < 0)
				continue		// strange chord symbol!
			ip = o + 1
			a = 0
			while (p[ip] == '#') {
				a++;
				ip++
			}
			while (p[ip] == 'b') {
				a--;
				ip++
			}
			n = note_names.indexOf(p[o]) + 16
			b40 = (abc2svg.pab40(n, a) + transp + 200) % 40
			b40 = abc2svg.b40k[b40]
			csa[i] = p.slice(0, o) +
					note_names[abc2svg.b40_p[b40]] +
					acc_name[abc2svg.b40_a[b40] + 2] +
					p.slice(ip)
		}
		return csa.join('/')
	} // gch_tr1

function gch_transp(s) {
    var	gch,
	i = s.a_gch.length

	while (--i >= 0) {
		gch = s.a_gch[i]
		if (gch.type == 'g')
			gch.text = gch_tr1(gch.text, curvoice.vtransp)
	}
}

// -- build the chord indications / annotations --
// (possible hook)
Abc.prototype.gch_build = function(s) {

	/* split the chord indications / annotations
	 * and initialize their vertical offsets */
	var	gch, wh, xspc, ix,
		pos = curvoice.pos.gch == C.SL_BELOW ? -1 : 1,
		y_above = 0,
		y_below = 0,
		y_left = 0,
		y_right = 0,
		GCHPRE = .4;		// portion of chord before note

	s.a_gch = a_gch;
	a_gch = null

	if (curvoice.vtransp)
		gch_transp(s)

	// change the accidentals in the chord symbols,
	// convert the escape sequences in annotations, and
	// set the offsets
	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix]
		if (gch.type == 'g') {
			if (cfmt.chordnames) {
				gch.otext = gch.text;	// save for %%diagram
				gch.text = gch.text.replace(/A|B|C|D|E|F|G/g,
					function(c){return cfmt.chordnames[c]})
				if (cfmt.chordnames.B == 'H')
					gch.text = gch.text.replace(/Hb/g, 'Bb')
			}
			gch.text = gch.text.replace(/##|#|=|bb|b|  /g,
				function(x) {
					switch (x) {
					case '##': return "&#x1d12a;"
					case '#': return "\u266f"
					case '=': return "\u266e"
					case 'b': return "\u266d"
					case '  ': return '  '
					}
					return "&#x1d12b;"
				});
		} else {
			if (gch.type == '@'
			 && !user.anno_start && !user.anno_stop) {
				gch.wh = [0, 0]
				continue		/* no width */
			}
		}

		/* set the offsets and widths */
		set_font(gch.font);
		wh = strwh(gch.text);
		gch.wh = wh
		if (gch.font.box)
			wh[1] += 4
		switch (gch.type) {
		case '@':
			break
		case '^':			/* above */
			xspc = wh[0] * GCHPRE
			if (xspc > 8)
				xspc = 8;
			gch.x = -xspc;
			y_above -= wh[1];
			gch.y = y_above
			break
		case '_':			/* below */
			xspc = wh[0] * GCHPRE
			if (xspc > 8)
				xspc = 8;
			gch.x = -xspc;
			y_below -= wh[1];
			gch.y = y_below
			break
		case '<':			/* left */
			gch.x = -(wh[0] + 6);
			y_left -= wh[1];
			gch.y = y_left + wh[1] / 2
			break
		case '>':			/* right */
			gch.x = 6;
			y_right -= wh[1];
			gch.y = y_right + wh[1] / 2
			break
		default:			// chord symbol
			xspc = wh[0] * GCHPRE
			if (xspc > 8)
				xspc = 8;
			gch.x = -xspc;
			if (pos < 0) {		/* below */
				y_below -= wh[1];
				gch.y = y_below
			} else {
				y_above -= wh[1];
				gch.y = y_above
			}
			break
		}
	}

	/* move upwards the top and middle texts */
	y_left /= 2;
	y_right /= 2
	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix]
		switch (gch.type) {
		case '^':			/* above */
			gch.y -= y_above
			break
		case '<':			/* left */
			gch.y -= y_left
			break
		case '>':			/* right */
			gch.y -= y_right
			break
		case 'g':			// chord symbol
			if (pos > 0)
				gch.y -= y_above
			break
		}
	}
}

// -- draw the chord symbols and annotations
// (the staves are not yet defined)
// (unscaled delayed output)
// (possible hook)
Abc.prototype.draw_gchord = function(s, gchy_min, gchy_max) {
    var	gch, text, ix, x, y, y2, hbox, h, y_above, y_below,

	// adjust the vertical offset according to the chord symbols
	w = 0,
		yav = s.dur ?
			(((s.notes[s.nhd].pit + s.notes[0].pit) >> 1) - 18) * 3 :
			12		// fixed offset on measure bars

	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix]
		if (gch.wh[0] > w)
			w = gch.wh[0]
	}
	y_above = y_get(s.st, 1, s.x - 3, w);
	y_below = y_get(s.st, 0, s.x - 3, w)
	if (y_above < gchy_max)
		y_above = gchy_max
	if (y_below > gchy_min)
		y_below = gchy_min;

	set_dscale(s.st);
	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix];
		use_font(gch.font);
		set_font(gch.font);
		h = gch.font.size;
		hbox = gch.font.box ? 2 : 0;
		w = gch.wh[0];
		x = s.x + gch.x;
		text = gch.text
		switch (gch.type) {
		case '_':			/* below */
			y = gch.y + y_below;
			y_set(s.st, 0, x, w, y - hbox)
			break
		case '^':			/* above */
			y = gch.y + y_above + hbox;
			y_set(s.st, 1, x, w, y + h + hbox)
			break
		case '<':			/* left */
/*fixme: what symbol space?*/
			if (s.notes[0].acc)
				x -= s.notes[0].shac;
			y = gch.y + yav - h / 2
			break
		case '>':			/* right */
			if (s.xmx)
				x += s.xmx
			if (s.dots)
				x += 1.5 + 3.5 * s.dots;
			y = gch.y + yav - h / 2
			break
		default:			// chord symbol
			if (gch.y >= 0) {
				y = gch.y + y_above + hbox;
				y_set(s.st, true, x, w, y + h + hbox)
			} else {
				y = gch.y + y_below;
				y_set(s.st, false, x, w, y - hbox)
			}
			break
		case '@':			/* absolute */
			y = gch.y + yav
			if (y > 0) {
				y2 = y + h
				if (y2 > staff_tb[s.st].ann_top)
					staff_tb[s.st].ann_top = y2
			} else {
				if (y < staff_tb[s.st].ann_bot)
					staff_tb[s.st].ann_bot = y
			}
			break
		}
		if (user.anno_start)
			user.anno_start("annot", gch.istart, gch.iend,
				x - 2, y + h + 2, w + 4, h + 4, s)
		xy_str(x, y, text, null, null, gch.wh)
		if (user.anno_stop)
			user.anno_stop("annot", gch.istart, gch.iend,
				x - 2, y + h + 2, w + 4, h + 4, s)
	}
}
