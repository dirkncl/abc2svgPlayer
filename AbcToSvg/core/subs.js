// abc2svg - subs.js - text output
//
// Copyright (C) 2014-2020 Jean-Francois Moine
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

// width of characters according to the font type
// these tables were created from the font 'Liberation'

// serif
  var
    sw_tb = new Float32Array([
	.000,.000,.000,.000,.000,.000,.000,.000,	// 00
	.000,.000,.000,.000,.000,.000,.000,.000,
	.000,.000,.000,.000,.000,.000,.000,.000,	// 10
	.000,.000,.000,.000,.000,.000,.000,.000,
	.250,.333,.408,.500,.500,.833,.778,.333,	// 20
	.333,.333,.500,.564,.250,.564,.250,.278,
	.500,.500,.500,.500,.500,.500,.500,.500,	// 30
	.500,.500,.278,.278,.564,.564,.564,.444,
	.921,.722,.667,.667,.722,.611,.556,.722,	// 40
	.722,.333,.389,.722,.611,.889,.722,.722,
	.556,.722,.667,.556,.611,.722,.722,.944,	// 50
	.722,.722,.611,.333,.278,.333,.469,.500,
	.333,.444,.500,.444,.500,.444,.333,.500,	// 60
	.500,.278,.278,.500,.278,.778,.500,.500,
	.500,.500,.333,.389,.278,.500,.500,.722,	// 70
	.500,.500,.444,.480,.200,.480,.541,.500]),
// sans-serif
    ssw_tb = new Float32Array([
	.000,.000,.000,.000,.000,.000,.000,.000,	// 00
	.000,.000,.000,.000,.000,.000,.000,.000,
	.000,.000,.000,.000,.000,.000,.000,.000,	// 10
	.000,.000,.000,.000,.000,.000,.000,.000,
	.278,.278,.355,.556,.556,.889,.667,.191,	// 20
	.333,.333,.389,.584,.278,.333,.278,.278,
	.556,.556,.556,.556,.556,.556,.556,.556,	// 30
	.556,.556,.278,.278,.584,.584,.584,.556,
       1.015,.667,.667,.722,.722,.667,.611,.778,	// 40
	.722,.278,.500,.667,.556,.833,.722,.778,
	.667,.778,.722,.667,.611,.722,.667,.944,	// 50
	.667,.667,.611,.278,.278,.278,.469,.556,
	.333,.556,.556,.500,.556,.556,.278,.556,	// 60
	.556,.222,.222,.500,.222,.833,.556,.556,
	.556,.556,.333,.500,.278,.556,.500,.722,	// 70
	.500,.500,.500,.334,.260,.334,.584,.512]),

    cw_tb = sw_tb				// current width table

/* -- return the character width -- */
function cwid(c) {
	var i = c.charCodeAt(0)		// utf-16

	if (i >= 0x80) {		// if not ASCII
		if (i >= 0x300 && i < 0x370)
			return 0;	// combining diacritical mark
		i = 0x61		// 'a'
	}
	return cw_tb[i]
}
// return the character width with the current font
function cwidf(c) {
	return cwid(c) * gene.curfont.swfac
}

// estimate the width and height of a string ..
var strwh = typeof document != "undefined" ?

    // .. by the browser
    (function(el) {
	el.style.position = 'absolute';
	el.style.top = '-1000px';
	el.style.padding = '0';
	document.body.appendChild(el)

	return function(str) {
	    var	c,
		font = gene.curfont,
		h = font.size,
		w = 0,
		n = str.length,
		i0 = 0,
		i = 0

		el.style.font = style_font(font).slice(5);

		str = str.replace(/<|>|&[^&]*?;|&|  /g, function(c){
			switch (c) {
			case '<': return "&lt;"
			case '>': return "&gt;"
			case '&': return "&amp;"
			case "  ": return '  '	// space + nbspace
			}
			return c		// &xxx;
		})

		while (1) {
			i = str.indexOf('$', i)
			if (i < 0)
				break
			c = str[i + 1]
			if (c == '0') {
				font = gene.deffont
			} else if (c >= '1' && c <= '9') {
				font = get_font("u" + c)
			} else {
				i++
				continue
			}
			el.innerHTML = str.slice(i0, i);
			w += el.clientWidth
//fixme: bad result if space(s) at end of string
			if (font.size > h)
				h = font.size;

			el.style.font = style_font(font).slice(5);
			i += 2;
			i0 = i
		}
		el.innerHTML = str.slice(i0);
		w += el.clientWidth;

		gene.curfont = font
		return [w, h]
	}
    })(document.createElement('div')) :

    // .. by internal tables
    function(str) {
    var	font = gene.curfont,
	swfac = font.swfac,
	h = font.size,
	w = 0,
	i, j, c,
	n = str.length

	for (i = 0; i < n; i++) {
		c = str[i]
		switch (c) {
		case '$':
			c = str[i + 1]
			if (c == '0') {
				font = gene.deffont
			} else if (c >= '1' && c <= '9') {
				font = get_font("u" + c)
			} else {
				c = '$'
				break
			}
			i++;
			swfac = font.swfac
			if (font.size > h)
				h = font.size
			continue
		case '&':
			j = str.indexOf(';', i)
			if (j > 0 && j - i < 10) {
				i = j;
				c = 'a'		// XML character reference
			}
			break
		}
		w += cwid(c) * swfac
	}
	gene.curfont = font
	return [w, h]
}

// set the default and current font
function set_font(xxx) {
	if (typeof xxx == "string")
		xxx = get_font(xxx);
	cw_tb = xxx.name.slice(0, 4) == 'sans' ? ssw_tb : sw_tb;
	gene.curfont = gene.deffont = xxx
}

// output a string handling the font changes
function out_str(str) {
	var	n_font,
		o_font = gene.curfont,
		c_font = o_font;

	output += str.replace(/<|>|&[^&]*?;|&|  |\$./g, function(c){
			switch (c) {
			case '<': return "&lt;"
			case '>': return "&gt;"
			case '&':
				 return "&amp;"
			case '  ':
				return '  '		// space + nbspace
			default:
				if (c[0] != '$')
					break
				if (c[1] == '0')
					n_font = gene.deffont
				else if (c[1] >= '1' && c[1] <= '9')
					n_font = get_font("u" + c[1])
				else
					break
				c = ''
				if (n_font == c_font)
					return c
				if (c_font != o_font)
					c = "</tspan>";
				c_font = n_font
				if (c_font == o_font)
					return c
				return c + '<tspan\n\tclass="' +
						font_class(n_font) + '">'
			}
			return c		// &xxx;
		})
	if (c_font != o_font) {
		output += "</tspan>";
		gene.curfont = c_font	// keep current font for next paragraph
	}
}

// output a string, handling the font changes
// the action is:
//	'c' align center
//	'r' align right
//	'j' justify - w is the line width
//	otherwise align left
function xy_str(x, y, str,
		action,		// default: align left
		w,		// needed for justify
		wh) {		// optional [width, height]
	if (!wh)
		wh = strwh(str);

	output += '<text class="' + font_class(gene.curfont)
	if (action != 'j' && str.length > 5
	 && gene.curfont.wadj)
		output += '" lengthAdjust="' + gene.curfont.wadj +
			'" textLength="' + wh[0].toFixed(1);
	output += '" x="';
	out_sxsy(x, '" y="', y + wh[1] * .2)	// a bit upper for the descent
	switch (action) {
	case 'c':
		x -= wh[0] / 2;
		output += '" text-anchor="middle">'
		break
	case 'j':
		output += '" textLength="' + w.toFixed(1) + '">'
		break
	case 'r':
		x -= wh[0];
		output += '" text-anchor="end">'
		break
	default:
		output += '">'
		break
	}
	out_str(str);
	output += "</text>\n"

	if (!w && gene.curfont.box) {
// not in the SVG documentation,
// but this works for almost all browsers but firefox
//		output += '<g style="outline: solid black;\
//			outline-width: 1px">\n';
//	//	xy_str(x, y, str, action, w);
//		output += '</g>\n'
		output += '<rect class="stroke" x="';
		out_sxsy(x - 2, '" y="', y + wh[1] + 1);
		output += '" width="' + (wh[0] + 4).toFixed(1) +
			'" height="' + (wh[1] + 2).toFixed(1) +
			'"/>\n'
	}
}

/* -- move trailing "The" to front, set to uppercase letters or add xref -- */
function trim_title(title, is_subtitle) {
	var i

	if (cfmt.titletrim) {
		i = title.lastIndexOf(", ")
		if (i < 0 || title[i + 2] < 'A' || title[i + 2] > 'Z') {
			i = 0
		} else if (cfmt.titletrim == true) {	// compatibility
			if (i < title.length - 7
			 || title.indexOf(' ', i + 3) >= 0)
				i = 0
		} else {
			if (i < title.length - cfmt.titletrim - 2)
				i = 0
		}
		if (i)
			title = title.slice(i + 2).trim() + ' ' + title.slice(0, i)
	}
	if (!is_subtitle
	 && cfmt.writefields.indexOf('X') >= 0)
		title = info.X + '.  ' + title
	if (cfmt.titlecaps)
		return title.toUpperCase()
	return title
}

// return the width of the music line
function get_lwidth() {
	return (img.width - img.lm - img.rm
					- 2)	// for bar thickness at eol
			/ cfmt.scale
}

// header generation functions
function write_title(title, is_subtitle) {
    var	h, wh

	if (!title)
		return
	set_page();
	title = trim_title(title, is_subtitle)
	if (is_subtitle) {
		set_font("subtitle");
		h = cfmt.subtitlespace
	} else {
		set_font("title");
		h = cfmt.titlespace
	}
	wh = strwh(title);
	vskip(wh[1] + h)
	if (cfmt.titleleft)
		xy_str(0, 0, title, null, null, wh)
	else
		xy_str(get_lwidth() / 2, 0, title, "c", null, wh)
}

/* -- output a header format '111 (222)' -- */
function put_inf2r(x, y, str1, str2, action) {
	if (!str1) {
		if (!str2)
			return
		str1 = str2;
		str2 = null
	}
	if (!str2)
		xy_str(x, y, str1, action)
	else
		xy_str(x, y, str1 + ' (' + str2 + ')', action)
}

/* -- write a text block (%%begintext / %%text / %%center) -- */
function write_text(text, action) {
	if (action == 's')
		return				// skip
	set_font("text");
	set_page();
    var	wh, font,
	strlw = get_lwidth(),
		sz = gene.curfont.size,
		lineskip = sz * cfmt.lineskipfac,
		parskip = sz * cfmt.parskipfac,
		i, j, x, words, w, k, ww, str;

	switch (action) {
	default:
//	case 'c':
//	case 'r':
		switch (action) {
		case 'c': x = strlw / 2; break
		case 'r': x = strlw; break
		default: x = 0; break
		}
		j = 0
		font = gene.curfont
		while (1) {
			i = text.indexOf('\n', j)
			if (i < 0) {
				str = text.slice(j);
				wh = strwh(str);
				gene.curfont = font;
				vskip(wh[1]  * cfmt.lineskipfac);
				xy_str(x, 0, str, action, null, wh);
				font = gene.curfont
				break
			}
			if (i == j) {			// new paragraph
				vskip(parskip);
				blk_flush()
				use_font(gene.curfont)
				while (text[i + 1] == '\n') {
					vskip(lineskip);
					i++
				}
				if (i == text.length)
					break
			} else {
				str = text.slice(j, i);
				wh = strwh(str);
				gene.curfont = font;
				vskip(wh[1]  * cfmt.lineskipfac);
				xy_str(x, 0, str, action, null, wh);
				font = gene.curfont
			}
			j = i + 1
		}
		vskip(parskip);
		blk_flush()
		break
	case 'f':
	case 'j':
		j = 0
		while (1) {
			i = text.indexOf('\n\n', j)
			if (i < 0)
				words = text.slice(j)
			else
				words = text.slice(j, i);
			words = words.split(/\s+/);
			w = k = 0
			font = gene.curfont
			for (j = 0; j < words.length; j++) {
				ww = strwh(words[j])[0];
				w += ww
				if (w >= strlw) {
					str = words.slice(k, j).join(' ');
					gene.curfont = font;
					wh = strwh(str);
					gene.curfont = font;
					vskip(wh[1]  * cfmt.lineskipfac);
					xy_str(0, 0, str, action, strlw, wh);
					font = gene.curfont;
					k = j;
					w = ww
				}
				w += cwidf(' ')
			}
			if (w != 0) {			// last line
				str = words.slice(k).join(' ');
				gene.curfont = font;
				wh = strwh(str);
				gene.curfont = font;
				vskip(wh[1]  * cfmt.lineskipfac);
				xy_str(0, 0, str, null, null, wh)
			}
			vskip(parskip);
			blk_flush()
			if (i < 0)
				break
			while (text[i + 2] == '\n') {
				vskip(lineskip);
				i++
			}
			if (i == text.length)
				break
			use_font(gene.curfont);
			j = i + 2
		}
		break
	}
}

/* -- output the words after tune -- */
function put_words(words) {
    var	p, i, j, nw, w, lw, x1, x2, i1, i2, do_flush,
	maxn = 0,			// max number of characters per line
	n = 1				// number of verses

	// output a line of words after tune
	function put_wline(p, x) {
		var i = 0, j, k

		if (p[i] == '$' && p[i +  1] >= '0' && p[i + 1] <= '9')
			i += 2;
		k = 0;
		j = i
		if ((p[i] >= '0' && p[i] <= '9') || p[i + 1] == '.') {
			while (i < p.length) {
				i++
				if (p[i] == ' '
				 || p[i - 1] == ':'
				 || p[i - 1] == '.')
					break
			}
			k = i
			while (p[i] == ' ')
				i++
		}

		if (k != 0)
			xy_str(x, 0, p.slice(j, k), 'r')
		if (i < p.length)
			xy_str(x + 5, 0, p.slice(i), 'l')
	} // put_wline()

	set_font("words")
	vskip(cfmt.wordsspace)
	svg_flush()

	// estimate the width of the lines
	words = words.split('\n')
	nw = words.length
	for (i = 0; i < nw; i++) {
		p = words[i]
		if (!p) {
			while (i + 1 < nw && !words[i + 1])
				i++
			n++
		} else if (p.length > maxn) {
			maxn = p.length
		}
	}

	w = get_lwidth() / 2		// half line width
	lw = maxn * cwidf('a')		// max line width
	i1 = i2 = 0
	if (lw < w) {			// if 2 columns
		j = n >> 1
		for (i = 0; i < nw; i++) {
			p = words[i]
			if (!p) {
				if (--j <= 0)
					i1 = i
				while (i + 1 < nw && !words[i + 1])
					i++
				if (j <= 0) {
					i2 = i + 1
					break
				}
			}
		}
		n >>= 1
	}
	if (i2) {
		x1 = (w - lw) / 2 + 10
		x2 = x1 + w
	} else {				// one column
		x2 = w - lw / 2 + 10
	}

	do_flush = true
	for (i = 0; i < i1 || i2 < nw; i++, i2++) {
		vskip(cfmt.lineskipfac * gene.curfont.size)
		if (i < i1) {
			p = words[i]
			if (p)
				put_wline(p, x1)
			else
				use_font(gene.curfont)
		}
		if (i2 < nw) {
			p = words[i2]
			if (p) {
				put_wline(p, x2)
			} else {


				if (--n == 0) {
					if (i < i1) {
						n++
					} else if (i2 < nw - 1) {

						// center the last verse
						x2 = w - lw / 2 + 10
						svg_flush()
					}
				}
			}
		}

		if (!words[i + 1] && !words[i2 + 1]) {
			if (do_flush) {
				svg_flush()
				do_flush = false
			}
		} else {
			do_flush = true
		}
	}
}

/* -- output history -- */
function put_history() {
	var	i, j, c, str, font, h, w, wh, head,
		names = cfmt.infoname.split("\n"),
		n = names.length

	for (i = 0; i < n; i++) {
		c = names[i][0]
		if (cfmt.writefields.indexOf(c) < 0)
			continue
		str = info[c]
		if (!str)
			continue
		if (!font) {
			font = true;
			set_font("history");
			vskip(cfmt.textspace);
			h = gene.curfont.size * cfmt.lineskipfac
		}
		head = names[i].slice(2)
		if (head[0] == '"')
			head = head.slice(1, -1);
		vskip(h);
		wh = strwh(head);
		xy_str(0, 0, head, null, null, wh);
		w = wh[0];
		str = str.split('\n');
		xy_str(w, 0, str[0])
		for (j = 1; j < str.length; j++) {
			vskip(h);
			xy_str(w, 0, str[j])
		}
		vskip(h * .3);
		use_font(gene.curfont)
	}
}

/* -- write heading with format -- */
var info_font_init = {
	A: "info",
	C: "composer",
	O: "composer",
	P: "parts",
	Q: "tempo",
	R: "info",
	T: "title",
	X: "title"
}
function write_headform(lwidth) {
	var	c, font, font_name, align, x, y, sz,
		info_val = {},
		info_font = clone(info_font_init),
		info_sz = {
			A: cfmt.infospace,
			C: cfmt.composerspace,
			O: cfmt.composerspace,
			R: cfmt.infospace
		},
		info_nb = {}

	// compress the format
	var	fmt = "",
		p = cfmt.titleformat,
		j = 0,
		i = 0

	while (1) {
		while (p[i] == ' ')
			i++
		if (i >= p.length)
			break
		c = p[i++]
		if (c < 'A' || c > 'Z') {
			if (c == '+') {
				if (fmt.length == 0
				 || fmt.slice(-1) == '+')
					continue
				fmt = fmt.slice(0, -1) + '+'
			} else if (c == ',') {
				if (fmt.slice(-1) == '+')
					fmt = fmt.slice(0, -1) + 'l'
				fmt += '\n'
			}
			continue
		}
		if (!info_val[c]) {
			if (!info[c])
				continue
			info_val[c] = info[c].split('\n');
			info_nb[c] = 1
		} else {
			info_nb[c]++
		}
		fmt += c
		switch (p[i]) {
		case '-':
			fmt += 'l'
			i++
			break
		case '0':
			fmt += 'c'
			i++
			break
		case '1':
			fmt += 'r'
			i++
			break
		default:
			fmt += 'c'
			break
		}
	}
	if (fmt.slice(-1) == '+')
		fmt = fmt.slice(0, -1) + 'l';
	fmt += '\n'

	// loop on the blocks
	var	ya = {
			l: cfmt.titlespace,
			c: cfmt.titlespace,
			r: cfmt.titlespace
		},
		xa = {
			l: 0,
			c: lwidth * .5,
			r: lwidth
		},
		yb = {},
		str;
	p = fmt;
	i = 0
	while (1) {

		// get the y offset of the top text
		yb.l = yb.c = yb.r = y = 0;
		j = i
		while (1) {
			c = p[j++]
			if (c == '\n')
				break
			align = p[j++]
			if (align == '+')
				align = p[j + 1]
			else if (yb[align] != 0)
				continue
			str = info_val[c]
			if (!str)
				continue
			font_name = info_font[c]
			if (!font_name)
				font_name = "history";
			font = get_font(font_name);
			sz = font.size * 1.1
			if (info_sz[c])
				sz += info_sz[c]
			if (y < sz)
				y = sz;
			yb[align] = sz
		}
		ya.l += y - yb.l;
		ya.c += y - yb.c;
		ya.r += y - yb.r
		while (1) {
			c = p[i++]
			if (c == '\n')
				break
			align = p[i++]
			if (info_val[c].length == 0)
				continue
			str = info_val[c].shift()
			if (align == '+') {
				info_nb[c]--;
				c = p[i++];
				align = p[i++]
				if (info_val[c].length > 0) {
					if (str)
						str += ' ' + info_val[c].shift()
					else
						str = ' ' + info_val[c].shift()
				}
			}
			font_name = info_font[c]
			if (!font_name)
				font_name = "history";
			font = get_font(font_name);
			sz = font.size * 1.1
			if (info_sz[c])
				sz += info_sz[c];
			set_font(font);
			x = xa[align];
			y = ya[align] + sz

			if (c == 'Q') {			/* special case for tempo */
				self.set_width(glovar.tempo)
				if (!glovar.tempo.invis) {
					if (align != 'l') {
						tempo_build(glovar.tempo)
						w = glovar.tempo.tempo_wh[0]

						if (align == 'c')
							w *= .5;
						x -= w
					}
					writempo(glovar.tempo, x, -y)
				}
			} else if (str) {
				xy_str(x, -y, str, align)
			}

			if (c == 'T') {
				font_name = info_font.T = "subtitle";
				info_sz.T = cfmt.subtitlespace
			}
			if (info_nb[c] <= 1) {
				if (c == 'T') {
					font = get_font(font_name);
					sz = font.size * 1.1
					if (info_sz[c])
						sz += info_sz[c];
					set_font(font)
				}
				while (info_val[c].length > 0) {
					y += sz;
					str = info_val[c].shift();
					xy_str(x, -y, str, align)
				}
			}
			info_nb[c]--;
			ya[align] = y
		}
		if (ya.c > ya.l)
			ya.l = ya.c
		if (ya.r > ya.l)
			ya.l = ya.r
		if (i >= fmt.length)
			break
		ya.c = ya.r = ya.l
	}
	vskip(ya.l)
}

/* -- output the tune heading -- */
function write_heading() {
	var	i, j, area, composer, origin, rhythm, down1, down2,
		lwidth = get_lwidth()

	vskip(cfmt.topspace)

	if (cfmt.titleformat) {
		write_headform(lwidth);
		vskip(cfmt.musicspace)
		return
	}

	/* titles */
	if (info.T
	 && cfmt.writefields.indexOf('T') >= 0) {
		i = 0
		while (1) {
			j = info.T.indexOf("\n", i)
			if (j < 0) {
				write_title(info.T.substring(i), i != 0)
				break
			}
			write_title(info.T.slice(i, j), i != 0);
			i = j + 1
		}
	}

	/* rhythm, composer, origin */
//	down1 = cfmt.composerspace + gene.curfont.size
	down1 = down2 = 0
	if (parse.ckey.k_bagpipe
	 && !cfmt.infoline
	 && cfmt.writefields.indexOf('R') >= 0)
		rhythm = info.R
	if (rhythm) {
		set_font("composer");
		xy_str(0, -cfmt.composerspace, rhythm);
		down1 = cfmt.composerspace
	}
	area = info.A
	if (cfmt.writefields.indexOf('C') >= 0)
		composer = info.C
	if (cfmt.writefields.indexOf('O') >= 0)
		origin = info.O
	if (composer || origin || cfmt.infoline) {
		var xcomp, align;

		set_font("composer");
		vskip(cfmt.composerspace)
		if (cfmt.aligncomposer < 0) {
			xcomp = 0;
			align = ' '
		} else if (cfmt.aligncomposer == 0) {
			xcomp = lwidth * .5;
			align = 'c'
		} else {
			xcomp = lwidth;
			align = 'r'
		}
		down2 = down1
		if (composer || origin) {
			if (cfmt.aligncomposer >= 0
			 && down1 != down2)
				vskip(down1 - down2);
			i = 0
			while (1) {
				vskip(gene.curfont.size)
				if (composer)
					j = composer.indexOf("\n", i)
				else
					j = -1
				if (j < 0) {
					put_inf2r(xcomp, 0,
						composer ? composer.substring(i) : null,
						origin,
						align)
					break
				}
				xy_str(xcomp, 0, composer.slice(i, j), align);
				down1 += gene.curfont.size;
				i = j + 1
			}
			if (down2 > down1)
				vskip(down2 - down1)
		}

		rhythm = rhythm ? null : info.R
		if ((rhythm || area) && cfmt.infoline) {

			/* if only one of rhythm or area then do not use ()'s
			 * otherwise output 'rhythm (area)' */
			set_font("info");
			vskip(gene.curfont.size + cfmt.infospace);
			put_inf2r(lwidth, 0, rhythm, area, 'r');
			down1 += gene.curfont.size + cfmt.infospace
		}
//		down2 = 0
	} else {
		down2 = cfmt.composerspace
	}

	/* parts */
	if (info.P
	 && cfmt.writefields.indexOf('P') >= 0) {
		set_font("parts");
		down1 = cfmt.partsspace + gene.curfont.size - down1
		if (down1 > 0)
			down2 += down1
		if (down2 > .01)
			vskip(down2);
		xy_str(0, 0, info.P);
		down2 = 0
	}
	vskip(down2 + cfmt.musicspace)
}
