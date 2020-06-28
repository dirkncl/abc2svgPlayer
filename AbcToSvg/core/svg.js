// abc2svg - svg.js - svg functions
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

var	output = "",		// output buffer
	style = '\
\n.stroke{stroke:currentColor;fill:none}\
\n.bW{stroke:currentColor;fill:none;stroke-width:1}\
\n.bthW{stroke:currentColor;fill:none;stroke-width:3}\
\n.slW{stroke:currentColor;fill:none;stroke-width:.7}\
\n.slthW{stroke:currentColor;fill:none;stroke-width:1.5}\
\n.sW{stroke:currentColor;fill:none;stroke-width:.7}',
	font_style = '',
	posx = cfmt.leftmargin / cfmt.scale,	// default x offset of the images
	posy = 0,		// y offset in the block
	img = {			// image
		width: cfmt.pagewidth,	// width
		lm: cfmt.leftmargin,	// left and right margins
		rm: cfmt.rightmargin
//		chg: false
	},
	defined_glyph = {},
	defs = '',
	fulldefs = '',		// unreferenced defs as <filter>
	stv_g = {		/* staff/voice graphic parameters */
		scale: 1,
		dy: 0,
		st: -1,
		v: -1,
		g: 0
//		color: undefined
	},
	blkdiv = 1		// block of contiguous SVGs
				// -1: block started
				//  0: no block
				//  1: start a block
				//  2: start a new page

// glyphs in music font
var tgls = {
 "mtr ": {x:0, y:0, c:"\u0020"},	// space
  brace: {x:0, y:0, c:"\ue000"},
  hl: {x:-4, y:0, c:"\ue022"},
  hl1: {x:-6, y:0, c:"\ue023"},
//  hl2: {x:-6, y:0, c:"\ue023"},		// (unused)
  ghl: {x:-4, y:0, c:"\ue024"},
  lphr: {x:0, y:24, c:"\ue030"},
  mphr: {x:0, y:24, c:"\ue038"},
  sphr: {x:0, y:27, c:"\ue039"},
  rdots: {x:-1, y:0, c:"\ue043"},	// repeat dots
  dsgn: {x:-4, y:-4, c:"\ue045"},	// D.S.
  dcap: {x:-4, y:-4, c:"\ue046"},	// D.C.
  sgno: {x:-6, y:0, c:"\ue047"},	// segno
  coda: {x:-12, y:-6, c:"\ue048"},
  tclef: {x:-8, y:0, c:"\ue050"},
  cclef: {x:-8, y:0, c:"\ue05c"},
  bclef: {x:-8, y:0, c:"\ue062"},
  pclef: {x:-6, y:0, c:"\ue069"},
  spclef: {x:-6, y:0, c:"\ue069"},
  stclef: {x:-8, y:0, c:"\ue07a"},
  scclef: {x:-8, y:0, c:"\ue07b"},
  sbclef: {x:-7, y:0, c:"\ue07c"},
  oct: {x:0, y:2, c:"\ue07d"},		// 8 for clefs
  mtr0: {x:0, y:0, c:"\ue080"},		// meters
  mtr1: {x:0, y:0, c:"\ue081"},
  mtr2: {x:0, y:0, c:"\ue082"},
  mtr3: {x:0, y:0, c:"\ue083"},
  mtr4: {x:0, y:0, c:"\ue084"},
  mtr5: {x:0, y:0, c:"\ue085"},
  mtr6: {x:0, y:0, c:"\ue086"},
  mtr7: {x:0, y:0, c:"\ue087"},
  mtr8: {x:0, y:0, c:"\ue088"},
  mtr9: {x:0, y:0, c:"\ue089"},
  mtrC: {x:0, y:0, c:"\ue08a"},		// common time (4/4)
//  "mtrC|": {x:0, y:0, c:"\ue08b"},	// cut time (2/2) (unused)
  "mtr+":  {x:0, y:0, c:"\ue08c"},
  "mtr(":  {x:0, y:0, c:"\ue094"},
  "mtr)":  {x:0, y:0, c:"\ue095"},
  HDD: {x:-7, y:0, c:"\ue0a0"},
  breve: {x:-7, y:0, c:"\ue0a1"},
  HD: {x:-5.2, y:0, c:"\ue0a2"},
  Hd: {x:-3.8, y:0, c:"\ue0a3"},
  hd: {x:-3.7, y:0, c:"\ue0a4"},
  ghd: {x:2, y:0, c:"\ue0a4", sc:.66},	// grace note head
  pshhd: {x:-3.7, y:0, c:"\ue0a9"},
  pfthd: {x:-3.7, y:0, c:"\ue0b3"},
  x: {x:-3.7, y:0, c:"\ue0a9"},		// 'x' note head
  "circle-x": {x:-3.7, y:0, c:"\ue0b3"}, // 'circle-x' note head
  srep: {x:-5, y:0, c:"\ue101"},
  "dot+": {x:-5, y:0, sc:.7, c:"\ue101"},
  diamond: {x:-4, y:0, c:"\ue1b9"},
  triangle: {x:-4, y:0, c:"\ue1bb"},
  dot: {x:-2, y:0, c:"\ue1e7"},
  flu1: {x:-.3, y:0, c:"\ue240"},	// flags
  fld1: {x:-.3, y:0, c:"\ue241"},
  flu2: {x:-.3, y:0, c:"\ue242"},
  fld2: {x:-.3, y:0, c:"\ue243"},
  flu3: {x:-.3, y:3.5, c:"\ue244"},
  fld3: {x:-.3, y:-4, c:"\ue245"},
  flu4: {x:-.3, y:8, c:"\ue246"},
  fld4: {x:-.3, y:-9, c:"\ue247"},
  flu5: {x:-.3, y:12.5, c:"\ue248"},
  fld5: {x:-.3, y:-14, c:"\ue249"},
 "acc-1": {x:-1, y:0, c:"\ue260"},	// flat
  acc3: {x:-1, y:0, c:"\ue261"},	// natural
  acc1: {x:-2, y:0, c:"\ue262"},	// sharp
  acc2: {x:-3, y:0, c:"\ue263"},	// double sharp
 "acc-2": {x:-3, y:0, c:"\ue264"},	// double flat
 "acc-1_2": {x:-2, y:0, c:"\ue280"},	// quarter-tone flat
 "acc-3_2": {x:-3, y:0, c:"\ue281"},	// three-quarter-tones flat
  acc1_2: {x:-1, y:0, c:"\ue282"},	// quarter-tone sharp
  acc3_2: {x:-3, y:0, c:"\ue283"},	// three-quarter-tones sharp
  accent: {x:-3, y:0, c:"\ue4a0"},
  stc: {x:-1, y:-2, c:"\ue4a2"},	// staccato
  emb: {x:-4, y:-2, c:"\ue4a4"},
  wedge: {x:-1, y:0, c:"\ue4a8"},
  marcato: {x:-3, y:0, c:"\ue4ac"},
  hld: {x:-7, y:0, c:"\ue4c0"},		// fermata
  brth: {x:0, y:0, c:"\ue4ce"},
  r00: {x:-1.5, y:0, c:"\ue4e1"},
  r0: {x:-1.5, y:0, c:"\ue4e2"},
  r1: {x:-3.5, y:-6, c:"\ue4e3"},
  r2: {x:-3.2, y:0, c:"\ue4e4"},
  r4: {x:-3, y:0, c:"\ue4e5"},
  r8: {x:-3, y:0, c:"\ue4e6"},
  r16: {x:-4, y:0, c:"\ue4e7"},
  r32: {x:-4, y:0, c:"\ue4e8"},
  r64: {x:-4, y:0, c:"\ue4e9"},
  r128: {x:-4, y:0, c:"\ue4ea"},
  mrest: {x:-10, y:0, c:"\ue4ee"},
  mrep: {x:-6, y:0, c:"\ue500"},
  mrep2: {x:-9, y:0, c:"\ue501"},
  p: {x:-4, y:-6, c:"\ue520"},
  f: {x:-4, y:-6, c:"\ue522"},
  pppp: {x:-4, y:-6, c:"\ue529"},
  ppp: {x:-4, y:-6, c:"\ue52a"},
  pp: {x:-4, y:-6, c:"\ue52b"},
  mp: {x:-4, y:-6, c:"\ue52c"},
  mf: {x:-4, y:-6, c:"\ue52d"},
  ff: {x:-4, y:-6, c:"\ue52f"},
  fff: {x:-4, y:-6, c:"\ue530"},
  ffff: {x:-4, y:-6, c:"\ue531"},
  sfz: {x:-4, y:-6, c:"\ue539"},
  trl: {x:-4, y:-4, c:"\ue566"},	// trill
  turn: {x:-5, y:-4, c:"\ue567"},
  turnx: {x:-5, y:-4, c:"\ue569"},
  umrd: {x:-7, y:-2, c:"\ue56c"},
  lmrd: {x:-7, y:-2, c:"\ue56d"},
  dplus: {x:-4, y:10, c:"\ue582"},	// plus
  sld: {x:-8, y:12, c:"\ue5d0"},	// slide
  grm: {x:-2, y:0, c:"\ue5e2"},		// grace mark
  dnb: {x:-4, y:0, c:"\ue610"},		// down bow
  upb: {x:-3, y:0, c:"\ue612"},		// up bow
  opend: {x:-2, y:0, c:"\ue614"},	// harmonic
  roll: {x:0, y:0, c:"\ue618"},
  thumb: {x:0, y:0, c:"\ue624"},
  snap: {x:-2, y:0, c:"\ue630"},
  ped: {x:-10, y:0, c:"\ue650"},
  pedoff: {x:-5, y:0, c:"\ue655"},
// "mtro.": {x:0, y:0, c:"\ue910"},	// (unused)
  mtro:   {x:0, y:0, c:"\ue911"},		// tempus perfectum
// "mtro|": {x:0, y:0, c:"\ue912"},	// (unused)
// "mtrc.": {x:0, y:0, c:"\ue914"},	// (unused)
  mtrc:   {x:0, y:0, c:"\ue915"},	// tempus imperfectum
// "mtrc|": {x:0, y:0, c:"\ue918"},	// (unused)
 "mtr.":  {x:0, y:0, c:"\ue920"},	// prolatione perfecta
 "mtr|":  {x:0, y:0, c:"\ue925"},	// (twice as fast)
  longa: {x:-3.7, y:0, c:"\ue95d"},
  custos: {x:-4, y:3, c:"\uea02"},
  ltr: {x:2, y:6, c:"\ueaa4"}		// long trill element
}

// glyphs to put in <defs>
var glyphs = {
}

// convert a meter string to a SmuFL encoded string
function m_gl(s) {
	return s.replace(/[Cco]\||[co]\.|./g,
		function(e) {
		    var	m = tgls["mtr" + e]
//fixme: !! no m.x nor m.y yet !!
//			if (!m.x && !m.y)
				return m.c
//			return '<tspan dx="'+ m.x.toFixed(1) +
//				'" dy="' + m.y.toFixed(1) +
//				'">' +
//				m.c + '</tspan>'
		})
}

// mark a glyph as used and add it in <defs>
function def_use(gl) {
	var	i, j, g

	if (defined_glyph[gl])
		return
	defined_glyph[gl] = true;
	g = glyphs[gl]
	if (!g) {
//throw new Error("unknown glyph: " + gl)
		error(1, null, "Unknown glyph: '$1'", gl)
		return	// fixme: the xlink is set
	}
	j = 0
	while (1) {
		i = g.indexOf('xlink:href="#', j)
		if (i < 0)
			break
		i += 13;
		j = g.indexOf('"', i);
		def_use(g.slice(i, j))
	}
	defs += '\n' + g
}

// add user defs from %%beginsvg
function defs_add(text) {
	var	i, j, gl, tag, is,
		ie = 0

	// remove XML comments
	text = text.replace(/<!--.*?-->/g, '')

	while (1) {
		is = text.indexOf('<', ie);
		if (is < 0)
			break
		i = text.indexOf('id="', is)
		if (i < 0)
			break
		i += 4;
		j = text.indexOf('"', i);
		if (j < 0)
			break
		gl = text.slice(i, j);
		ie = text.indexOf('>', j);
		if (ie < 0)
			break
		if (text[ie - 1] == '/') {
			ie++
		} else {
			i = text.indexOf(' ', is);
			if (i < 0)
				break
			tag = text.slice(is + 1, i);
			ie = text.indexOf('</' + tag + '>', ie)
			if (ie < 0)
				break
			ie += 3 + tag.length
		}
		if (text.substr(is, 7) == '<filter')
			fulldefs += '\n' + text.slice(is, ie)
		else
			glyphs[gl] = text.slice(is, ie)
	}
}

// output the stop/start of a graphic sequence
function set_g() {

	// close the previous sequence
	if (stv_g.started) {
		stv_g.started = false;
		output += "</g>\n"
	}

	// check if new sequence needed
	if (stv_g.scale == 1 && !stv_g.color)
		return

	// open the new sequence
	output += '<g '
	if (stv_g.scale != 1) {
		if (stv_g.st < 0)
			output += voice_tb[stv_g.v].scale_str
		else if (stv_g.v < 0)
			output += staff_tb[stv_g.st].scale_str
		else
			output += 'transform="translate(0,' +
					(posy - stv_g.dy).toFixed(1) +
				') scale(' + stv_g.scale.toFixed(2) + ')"'
	}
	if (stv_g.color) {
		if (stv_g.scale != 1)
			output += ' ';
		output += 'color="' + stv_g.color +
			'" fill="' + stv_g.color + '"'
	}
	output += ">\n";
	stv_g.started = true
}

/* set the color */
function set_color(color) {
	if (color == stv_g.color)
		return undefined	// same color
	var	old_color = stv_g.color;
	stv_g.color = color;
	set_g()
	return old_color
}

/* -- set the staff scale (only) -- */
function set_sscale(st) {
	var	new_scale, dy

	if (st != stv_g.st && stv_g.scale != 1)
		stv_g.scale = 0;
	new_scale = st >= 0 ? staff_tb[st].staffscale : 1
	if (st >= 0 && new_scale != 1)
		dy = staff_tb[st].y
	else
		dy = posy
	if (new_scale == stv_g.scale && dy == stv_g.dy)
		return
	stv_g.scale = new_scale;
	stv_g.dy = dy;
	stv_g.st = st;
	stv_g.v = -1;
	set_g()
}

/* -- set the voice or staff scale -- */
function set_scale(s) {
    var	new_dy,
	new_scale = s.p_v.scale

	if (new_scale == 1) {
		set_sscale(s.st)
		return
	}
	new_dy = posy
	if (staff_tb[s.st].staffscale != 1) {
		new_scale *= staff_tb[s.st].staffscale;
		new_dy = staff_tb[s.st].y
	}
	if (new_scale == stv_g.scale && stv_g.dy == posy)
		return
	stv_g.scale = new_scale;
	stv_g.dy = new_dy;
	stv_g.st = staff_tb[s.st].staffscale == 1 ? -1 : s.st;
	stv_g.v = s.v;
	set_g()
}

// -- set the staff output buffer and scale when delayed output
function set_dscale(st, no_scale) {
	if (output) {
		if (stv_g.st < 0) {
			staff_tb[0].output += output
		} else if (stv_g.scale == 1) {
			staff_tb[stv_g.st].output += output
		} else {
			staff_tb[stv_g.st].sc_out += output
		}
		output = ""
	}
	if (st < 0)
		stv_g.scale = 1
	else
		stv_g.scale = no_scale ? 1 : staff_tb[st].staffscale;
	stv_g.st = st;
	stv_g.dy = 0
}

// update the y offsets of delayed output
function delayed_update() {
	var st, new_out, text

	for (st = 0; st <= nstaff; st++) {
		if (staff_tb[st].sc_out) {
			output += '<g ' + staff_tb[st].scale_str + '>\n' +
				staff_tb[st].sc_out + '</g>\n';
			staff_tb[st].sc_out = ""
		}
		if (!staff_tb[st].output)
			continue
		output += '<g transform="translate(0,' +
				(-staff_tb[st].y).toFixed(1) +
				')">\n' +
			staff_tb[st].output +
			'</g>\n';
		staff_tb[st].output = ""
	}
}

// output the annotations
function anno_out(s, t, f) {
	if (s.istart == undefined)
		return
	var	type = s.type,
		h = s.ymx - s.ymn + 4,
		wl = s.wl || 2,
		wr = s.wr || 2

	if (s.grace)
		type = C.GRACE

	f(t || abc2svg.sym_name[type], s.istart, s.iend,
		s.x - wl - 2, staff_tb[s.st].y + s.ymn + h - 2,
		wl + wr + 4, h, s);
}

function a_start(s, t) {
	anno_out(s, t, user.anno_start)
}
function a_stop(s, t) {
	anno_out(s, t, user.anno_stop)
}
function empty_function() {
}
var	anno_start = user.anno_start ? a_start : empty_function,
	anno_stop = user.anno_stop ? a_stop : empty_function

// output a string with x, y, a and b
// In the string,
//	X and Y are replaced by scaled x and y
//	A and B are replaced by a and b as string
//	F and G are replaced by a and b as float
function out_XYAB(str, x, y, a, b) {
	x = sx(x);
	y = sy(y);
	output += str.replace(/X|Y|A|B|F|G/g, function(c) {
		switch (c) {
		case 'X': return x.toFixed(1)
		case 'Y': return y.toFixed(1)
		case 'A': return a
		case 'B': return b
		case 'F': return a.toFixed(1)
//		case 'G':
		default: return b.toFixed(1)
		}
		})
}

// open / close containers
function g_open(x, y, rot, sx, sy) {
	out_XYAB('<g transform="translate(X,Y', x, y);
	if (rot)
		output += ') rotate(' + rot.toFixed(2)
	if (sx) {
		if (sy)
			output += ') scale(' + sx.toFixed(2) +
						', ' + sy.toFixed(2)
		else
			output += ') scale(' + sx.toFixed(2)
	}
	output += ')">\n';
	stv_g.g++
}
function g_close() {
	stv_g.g--;
	output += '</g>\n'
}

// external SVG string
Abc.prototype.out_svg = function(str) { output += str }

// exported functions for the annotation
function sx(x) {
	if (stv_g.g)
		return x
	return (x + posx) / stv_g.scale
}
Abc.prototype.sx = sx
function sy(y) {
	if (stv_g.g)
		return -y
	if (stv_g.scale == 1)
		return posy - y
	if (stv_g.v >= 0)
		return (stv_g.dy - y) / voice_tb[stv_g.v].scale
	return stv_g.dy - y	// staff scale only
}
Abc.prototype.sy = sy;
Abc.prototype.sh = function(h) {
	if (stv_g.st < 0)
		return h / stv_g.scale
	return h
}
// for absolute X,Y coordinates
Abc.prototype.ax = function(x) { return x + posx }
Abc.prototype.ay = function(y) {
	if (stv_g.st < 0)
		return posy - y
	return posy + (stv_g.dy - y) * stv_g.scale - stv_g.dy
}
Abc.prototype.ah = function(h) {
	if (stv_g.st < 0)
		return h
	return h * stv_g.scale
}
// output scaled (x + <sep> + y)
function out_sxsy(x, sep, y) {
	x = sx(x);
	y = sy(y);
	output += x.toFixed(1) + sep + y.toFixed(1)
}
Abc.prototype.out_sxsy = out_sxsy

// define the start of a path
function xypath(x, y, fill) {
	if (fill)
		out_XYAB('<path d="mX Y', x, y)
	else
		out_XYAB('<path class="stroke" d="mX Y', x, y)
}
Abc.prototype.xypath = xypath

// output a glyph
function xygl(x, y, gl) {
// (avoid ps<->js loop)
//	if (psxygl(x, y, gl))
//		return
	if (glyphs[gl]) {
		def_use(gl)
		out_XYAB('<use x="X" y="Y" xlink:href="#A"/>\n', x, y, gl)
	} else {
	    var	tgl = tgls[gl]
		if (tgl) {
			x += tgl.x * stv_g.scale;
			y -= tgl.y
			if (tgl.sc)
				out_XYAB('<text transform="translate(X,Y) scale(A)">B</text>\n',
					x, y, tgl.sc, tgl.c);
			else
				out_XYAB('<text x="X" y="Y">A</text>\n', x, y, tgl.c)
		} else {
			error(1, null, 'no definition of $1', gl)
		}
	}
}
// - specific functions -
// gua gda (acciaccatura)
function out_acciac(x, y, dx, dy, up) {
	if (up) {
		x -= 1;
		y += 4
	} else {
		x -= 5;
		y -= 4
	}
	out_XYAB('<path class="stroke" d="mX YlF G"/>\n',
		x, y, dx, -dy)
}
// tuplet value - the staves are not defined
function out_bnum(x, y, str) {
	out_XYAB('<text style="font:italic 12px serif"\n\
	x="X" y="Y" text-anchor="middle">A</text>\n',
		x, y, str.toString())
}
// staff system brace
function out_brace(x, y, h) {
//fixme: '-6' depends on the scale
	x += posx - 6;
	y = posy - y;
	h /= 24;
	output += '<text transform="translate(' +
				x.toFixed(1) + ',' + y.toFixed(1) +
			') scale(2.5,' + h.toFixed(2) +
			')">' + tgls.brace.c + '</text>\n'
}

// staff system bracket
function out_bracket(x, y, h) {
	x += posx - 5;
	y = posy - y - 3;
	h += 2;
	output += '<path d="m' + x.toFixed(1) + ' ' + y.toFixed(1) + '\n\
	c10.5 1 12 -4.5 12 -3.5c0 1 -3.5 5.5 -8.5 5.5\n\
	v' + h.toFixed(1) + '\n\
	c5 0 8.5 4.5 8.5 5.5c0 1 -1.5 -4.5 -12 -3.5"/>\n'
}
// hyphen
function out_hyph(x, y, w) {
	var	n, a_y,
		d = 25 + ((w / 20) | 0) * 3

	if (w > 15.)
		n = ((w - 15) / d) | 0
	else
		n = 0;
	x += (w - d * n - 5) / 2;
	out_XYAB('<path class="stroke" stroke-width="1.2"\n\
	stroke-dasharray="5,A"\n\
	d="mX YhB"/>\n',
		x, y + 6,		// set the line a bit upper
		Math.round((d - 5) / stv_g.scale), d * n + 5)
}
// stem [and flags]
function out_stem(x, y, h, grace,
		  nflags, straight) {	// optional
//fixme: dx KO with half note or longa
	var	dx = grace ? GSTEM_XOFF : 3.5,
		slen = -h

	if (h < 0)
		dx = -dx;		// down
	x += dx * stv_g.scale
	if (stv_g.v >= 0)
		slen /= voice_tb[stv_g.v].scale;
	out_XYAB('<path class="sW" d="mX YvF"/>\n',	// stem
		x, y, slen)
	if (!nflags)
		return

	y += h
	if (h > 0) {				// up
		if (!straight) {
			if (!grace) {
				xygl(x, y, "flu" + nflags)
				return
			} else {		// grace
				output += '<path d="'
				if (nflags == 1) {
					out_XYAB('MX Yc0.6 3.4 5.6 3.8 3 10\n\
	1.2 -4.4 -1.4 -7 -3 -7\n', x, y)
				} else {
					while (--nflags >= 0) {
						out_XYAB('MX Yc1 3.2 5.6 2.8 3.2 8\n\
	1.4 -4.8 -2.4 -5.4 -3.2 -5.2\n', x, y);
						y -= 3.5
					}
				}
			}
		} else {			// straight
			output += '<path d="'
			if (!grace) {
				while (--nflags >= 0) {
					out_XYAB('MX Yl7 3.2 0 3.2 -7 -3.2z\n',
						x, y);
					y -= 5.4
				}
			} else {		// grace
				while (--nflags >= 0) {
					out_XYAB('MX Yl3 1.5 0 2 -3 -1.5z\n',
						x, y);
					y -= 3
				}
			}
		}
	} else {				// down
		if (!straight) {
			if (!grace) {
				xygl(x, y, "fld" + nflags)
				return
			} else {		// grace
				output += '<path d="'
				if (nflags == 1) {
					out_XYAB('MX Yc0.6 -3.4 5.6 -3.8 3 -10\n\
	1.2 4.4 -1.4 7 -3 7\n', x, y)
				} else {
					while (--nflags >= 0) {
						out_XYAB('MX Yc1 -3.2 5.6 -2.8 3.2 -8\n\
	1.4 4.8 -2.4 5.4 -3.2 5.2\n', x, y);
						y += 3.5
					}
				}
			}
		} else {			// straight
			output += '<path d="'
			if (!grace) {
				while (--nflags >= 0) {
					out_XYAB('MX Yl7 -3.2 0 -3.2 -7 3.2z\n',
						x, y);
					y += 5.4
				}
//			} else {		// grace
//--fixme: error?
			}
		}
	}
	output += '"/>\n'
}
// tremolo
function out_trem(x, y, ntrem) {
	out_XYAB('<path d="mX Y\n\t', x - 4.5, y)
	while (1) {
		output += 'l9 -3v3l-9 3z'
		if (--ntrem <= 0)
			break
		output += 'm0 5.4'
	}
	output += '"/>\n'
}
// tuplet bracket - the staves are not defined
function out_tubr(x, y, dx, dy, up) {
	var	h = up ? -3 : 3;

	y += h;
	dx /= stv_g.scale;
	output += '<path class="stroke" d="m';
	out_sxsy(x, ' ', y);
	output += 'v' + h.toFixed(1) +
		'l' + dx.toFixed(1) + ' ' + (-dy).toFixed(1) +
		'v' + (-h).toFixed() + '"/>\n'
}
// tuplet bracket with number - the staves are not defined
function out_tubrn(x, y, dx, dy, up, str) {
    var	sw = str.length * 10,
	h = up ? -3 : 3;

	out_XYAB('<text style="font:italic 12px serif"\n\
	x="X" y="Y" text-anchor="middle">A</text>\n',
		x + dx / 2, y + dy / 2, str);
	dx /= stv_g.scale
	if (!up)
		y += 6;
	output += '<path class="stroke" d="m';
	out_sxsy(x, ' ', y);
	output += 'v' + h.toFixed(1) +
		'm' + dx.toFixed(1) + ' ' + (-dy).toFixed(1) +
		'v' + (-h).toFixed(1) + '"/>\n' +
		'<path class="stroke" stroke-dasharray="' +
		((dx - sw) / 2).toFixed(1) + ' ' + sw.toFixed(1) +
		'" d="m';
	out_sxsy(x, ' ', y - h);
	output += 'l' + dx.toFixed(1) + ' ' + (-dy).toFixed(1) + '"/>\n'

}
// underscore line
function out_wln(x, y, w) {
	out_XYAB('<path class="stroke" stroke-width="0.8" d="mX YhF"/>\n',
		x, y + 3, w)
}

// decorations with string
var deco_str_style = {
crdc:	{
		dx: 0,
		dy: 5,
		style: 'font:italic 14px serif'
	},
dacs:	{
		dx: 0,
		dy: 3,
		style: 'font:16px serif',
		anchor: ' text-anchor="middle"'
	},
fng:	{
		dx: 0,
		dy: 1,
		style: 'font-family:Bookman; font-size:8px',
		anchor: ' text-anchor="middle"'
	},
pf:	{
		dx: 0,
		dy: 5,
		style: 'font:italic bold 16px serif'
	},
'@':	{
		dx: 0,
		dy: 5,
		style: 'font: 12px sans-serif'
	}
}

function out_deco_str(x, y, name, str) {
	var	a, f,
		a_deco = deco_str_style[name]

	if (!a_deco) {
		xygl(x, y, name)
		return
	}
	x += a_deco.dx;
	y += a_deco.dy;
	if (!a_deco.def) {
		style += "\n." + name + " {" + a_deco.style + "}";
		a_deco.def = true
	}
	out_XYAB('<text x="X" y="Y" class="A"B>', x, y,
		name, a_deco.anchor || "");
	set_font("annotation");
	out_str(str);
	output += '</text>\n'
}

function out_arp(x, y, val) {
	g_open(x, y, 270);
	x = 0;
	val = Math.ceil(val / 6)
	while (--val >= 0) {
		xygl(x, 6, "ltr");
		x += 6
	}
	g_close()
}
function out_cresc(x, y, val, defl) {
	x += val;
	val = -val;
	out_XYAB('<path class="stroke"\n\
	d="mX YlA ', x, y + 5, val)
	if (defl.nost)
		output += '-2.2m0 -3.6l' + (-val).toFixed(1) + ' -2.2"/>\n'
	else
		output += '-4l' + (-val).toFixed(1) + ' -4"/>\n'

}
function out_dim(x, y, val, defl) {
	out_XYAB('<path class="stroke"\n\
	d="mX YlA ', x, y + 5, val)
	if (defl.noen)
		output += '-2.2m0 -3.6l' + (-val).toFixed(1) + ' -2.2"/>\n'
	else
		output += '-4l' + (-val).toFixed(1) + ' -4"/>\n'
}
function out_ltr(x, y, val) {
	y += 4;
	val = Math.ceil(val / 6)
	while (--val >= 0) {
		xygl(x, y, "ltr");
		x += 6
	}
}
function out_lped(x, y, val, defl) {
	y += 4;
	if (!defl.nost)
		xygl(x, y, "ped");
	if (!defl.noen)
		xygl(x + val + 6, y, "pedoff")
}
function out_8va(x, y, val, defl) {
	if (!defl.nost) {
		out_XYAB('<text x="X" y="Y" \
style="font:italic bold 12px serif">8\
<tspan dy="-4" style="font-size:10px">va</tspan></text>\n',
			x - 8, y);
		x += 12;
		val -= 12
	} else {
		val -= 5
	}
	y += 6;
	out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
		x, y, val)
	if (!defl.noen)
		out_XYAB('<path class="stroke" d="mX Yv6"/>\n', x + val, y)
}
function out_8vb(x, y, val, defl) {
	if (!defl.nost) {
		out_XYAB('<text x="X" y="Y" \
style="font:italic bold 12px serif">8\
<tspan dy="-4" style="font-size:10px">vb</tspan></text>\n',
			x - 8, y);
		x += 4;
		val -= 4
	} else {
		val -= 5
	}
//	y -= 2;
	out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
		x, y, val)
	if (!defl.noen)
		out_XYAB('<path class="stroke" d="mX Yv-6"/>\n', x + val, y)
}
function out_15ma(x, y, val, defl) {
	if (!defl.nost) {
		out_XYAB('<text x="X" y="Y" \
style="font:italic bold 12px serif">15\
<tspan dy="-4" style="font-size:10px">ma</tspan></text>\n',
			x - 10, y);
		x += 20;
		val -= 20
	} else {
		val -= 5
	}
	y += 6;
	out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
		x, y, val)
	if (!defl.noen)
		out_XYAB('<path class="stroke" d="mX Yv6"/>\n', x + val, y)
}
function out_15mb(x, y, val, defl) {
	if (!defl.nost) {
		out_XYAB('<text x="X" y="Y" \
style="font:italic bold 12px serif">15\
<tspan dy="-4" style="font-size:10px">mb</tspan></text>\n',
			x - 10, y);
		x += 7;
		val -= 7
	} else {
		val -= 5
	}
//	y -= 2;
	out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
		x, y, val)
	if (!defl.noen)
		out_XYAB('<path class="stroke" d="mX Yv-6"/>\n', x + val, y)
}
var deco_val_tb = {
	arp:	out_arp,
	cresc:	out_cresc,
	dim:	out_dim,
	ltr:	out_ltr,
	lped:	out_lped,
	"8va":	out_8va,
	"8vb":	out_8vb,
	"15ma":	out_15ma,
	"15mb": out_15mb
}

function out_deco_val(x, y, name, val, defl) {
	if (deco_val_tb[name])
		deco_val_tb[name](x, y, val, defl)
	else
		error(1, null, "No function for decoration '$1'", name)
}

function out_glisq(x2, y2, de) {
	var	de1 = de.start,
		x1 = de1.x,
		y1 = de1.y + staff_tb[de1.st].y,
		ar = Math.atan2(y1 - y2, x2 - x1),
		a = ar / Math.PI * 180,
		len = (x2 - x1) / Math.cos(ar);

	g_open(x1, y1, a);
	x1 = de1.s.dots ? 13 + de1.s.xmx : 8;
	len = (len - x1 - 6) / 6 | 0
	if (len < 1)
		len = 1
	while (--len >= 0) {
		xygl(x1, 0, "ltr");
		x1 += 6
	}
	g_close()
}

function out_gliss(x2, y2, de) {
	var	de1 = de.start,
		x1 = de1.x,
		y1 = de1.y + staff_tb[de1.st].y,
		ar = -Math.atan2(y2 - y1, x2 - x1),
		a = ar / Math.PI * 180,
		len = (x2 - x1) / Math.cos(ar);

	g_open(x1, y1, a);
	x1 = de1.s.dots ? 13 + de1.s.xmx : 8;
	len -= x1 + 8;
	xypath(x1, 0);
	output += 'h' + len.toFixed(1) + '" stroke-width="1"/>\n';
	g_close()
}

var deco_l_tb = {
	glisq: out_glisq,
	gliss: out_gliss
}

function out_deco_long(x, y, de) {
	var	name = de.dd.glyph

	if (deco_l_tb[name])
		deco_l_tb[name](x, y, de)
	else
		error(1, null, "No function for decoration '$1'", name)
}

// return a tempo note
function tempo_note(s, dur) {
    var	p,
	elts = identify_note(s, dur)

	switch (elts[0]) {		// head
	case C.OVAL:
		p = "\ueca2"
		break
	case C.EMPTY:
		p = "\ueca3"
		break
	default:
		switch (elts[2]) {	// flags
		case 2:
			p = "\ueca9"
			break
		case 1:
			p = "\ueca7"
			break
		default:
			p = "\ueca5"
			break
		}
		break
	}
	if (elts[1])			// dot
		p += '<tspan dx=".1em">\uecb7</tspan>'
	return p
} // tempo_note()

// build the tempo string
function tempo_build(s) {
    var	i, j, bx, p, wh, dy,
	w = 0,
	str = []

	if (s.tempo_str)	// already done
		return

	// the music font must be defined
	if (!cfmt.musicfont.used)
		get_font("music")

	set_font("tempo")
	if (s.tempo_str1) {
		str.push(s.tempo_str1)
		w += strwh(s.tempo_str1)[0]
	}
	if (s.tempo_notes) {
		dy = ' dy="-.05em"'			// notes a bit higher
		for (i = 0; i < s.tempo_notes.length; i++) {
			p = tempo_note(s, s.tempo_notes[i])
			str.push('<tspan\nclass="' +
					font_class(cfmt.musicfont) +
				'" style="font-size:' +
				(gene.curfont.size * 1.3).toFixed(1) + 'px"' +
				dy + '>' +
				p + '</tspan>')
			j = p.length > 1 ? 2 : 1	// (note and optional dot)
			w += j * gene.curfont.swfac
			dy = ''
		}
		str.push('<tspan dy=".065em">=</tspan>')
		w += cwidf('=')
		if (s.tempo_ca) {
			str.push(s.tempo_ca)
			w += strwh(s.tempo_ca)[0]
			j = s.tempo_ca.length + 1
		}
		if (s.tempo) {			// with a number of beats per minute
			str.push(s.tempo)
			w += strwh(s.tempo.toString())[0]
		} else {			// with a beat as a note
			p = tempo_note(s, s.new_beat)
			str.push('<tspan\nclass="' +
					font_class(cfmt.musicfont) +
				'" style="font-size:' +
				(gene.curfont.size * 1.3).toFixed(1) +
				'px" dy="-.05em">' +
				p + '</tspan>')
			j = p.length > 1 ? 2 : 1
			w += j * gene.curfont.swfac
			dy = 'y'
		}
	}
	if (s.tempo_str2) {
		if (dy)
			str.push('<tspan\n\tdy=".065em">' +
					s.tempo_str2 + '</tspan>')
		else
			str.push(s.tempo_str2)
		w += strwh(s.tempo_str2)[0]
	}

	// build the string
	s.tempo_str = str.join(' ')
	w += cwidf(' ') * (str.length - 1)
	s.tempo_wh = [w, 13.0]		// (the height is not used)
	if (dy)
		s.tempo_dy = dy
} // tempo_build()

// output a tempo
function writempo(s, x, y) {
    var	bx

	set_font("tempo")
	if (gene.curfont.box) {
		gene.curfont.box = false
		bx = x
	}

//fixme: xy_str() cannot be used because <tspan> in s.tempo_str
//fixme: then there cannot be font changes by "$n" in the Q: texts
	output += '<text class="' + font_class(gene.curfont) +
		'" x="'
	out_sxsy(x, '" y="', y + gene.curfont.size * .2)
	output += '">' + s.tempo_str + '</text>\n'

	if (bx) {
		gene.curfont.box = true
		bh = gene.curfont.size + 4;
		output += '<rect class="stroke" x="'
		out_sxsy(bx - 2, '" y="', y + bh - 1)
		output += '" width="' + (s.tempo_wh[0] + 2).toFixed(1) +
			'" height="' + bh.toFixed(1) +
			'"/>\n'
	}

	// don't display anymore
	s.invis = true
} // writempo()

// update the vertical offset
function vskip(h) {
	posy += h
}

// create the SVG image of the block
function svg_flush() {
	if (multicol || !output || !user.img_out || posy == 0)
		return

    var	i, font,
	head = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
	xmlns:xlink="http://www.w3.org/1999/xlink"\n\
	color="',
	g = ''

	if (cfmt.fgcolor)
		head += cfmt.fgcolor + '" fill="' + cfmt.fgcolor + '"'
	else
		head += 'black"';
	head += ' stroke-width=".7"'

	if (cfmt.bgcolor)
		head += ' style="background-color: ' + cfmt.bgcolor + '"';

	font = get_font("music")
	head += ' class="' + font_class(font) +
		' tune' + tunes.length + '"\n'	// tune index for play

	posy *= cfmt.scale
	if (user.imagesize) {
		head += user.imagesize +
			' viewBox="0 0 ' + img.width.toFixed(0) + ' ' +
			 posy.toFixed(0) + '">\n'
	} else {
		head += ' width="' + img.width.toFixed(0) +
			'px" height="' + posy.toFixed(0) + 'px">\n'
	}

	if (style || font_style)
		head += '<style>\n.' +
				font_class(font) +	// for fill color
					' text,tspan{fill:currentColor}' +
			font_style + style +
			'\n</style>\n'

	defs += fulldefs
	if (defs)
		head += '<defs>' + defs + '\n</defs>\n'

	// if %%pagescale != 1, do a global scale
	// (with a container: transform scale in <svg> does not work
	//	the same in all browsers)
	// the class is used to know that the container is global
	if (cfmt.scale != 1) {
		head += '<g class="g" transform="scale(' +
			cfmt.scale.toFixed(2) + ')">\n';
		g = '</g>\n'
	}

	if (psvg)			// if PostScript support
		psvg.ps_flush(true);	// + setg(0)

	// start a block if needed
	if (blkdiv > 0) {
		user.img_out(blkdiv == 1 ?
			'<div class="nobrk">' :
			'<div class="nobrk newpage">')
		blkdiv = -1		// block started
	}
	user.img_out(head + output + g + "</svg>");
	output = ""

	font_style = ''
	if (cfmt.fullsvg) {
		defined_glyph = {}
		for (i = 0; i < font_tb.length; i++)
			font_tb[i].used = false
	} else {
		style = '';
		fulldefs = ''
	}
	defs = '';
	posy = 0
}

// mark the end of a <div> block
function blk_flush() {
	svg_flush()
	if (blkdiv < 0 && (!parse.state || cfmt.splittune)) {
		user.img_out('</div>')
		blkdiv = 0
	}
}
Abc.prototype.blk_flush = blk_flush
