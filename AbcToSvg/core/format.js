// abc2svg - format.js - formatting functions
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

var	font_tb = [],
	font_st = {},	// font style => font_tb index for incomplete user fonts
	font_scale_tb = {
		serif: 1,
		serifBold: 1,
		'sans-serif': 1,
		'sans-serifBold': 1,
		Palatino: 1.1,
		monospace: 1.35
	},
	fmt_lock = {}

var cfmt = {
	annotationfont: {name: "sans-serif", size: 12 },
	aligncomposer: 1,
	beamslope: .4,			// max slope of a beam
//	botmargin: .7 * IN,		// != 1.8 * CM,
	breaklimit: .7,
	breakoneoln: true,
	cancelkey: true,
	composerfont: { name: "serif", style: "italic", size: 14 },
	composerspace: 6,
//	contbarnb: false,
	dblrepbar: ':][:',
	decoerr: true,
	dynalign: true,
	footerfont: { name: "serif", size: 16 },
	fullsvg: '',
	gchordfont: { name: "sans-serif", size: 12 },
	gracespace: new Float32Array([4, 8, 11]), // left, inside, right
	graceslurs: true,
	headerfont: { name: "serif", size: 16 },
	historyfont: { name: "serif", size: 16 },
	hyphencont: true,
	indent: 0,
	infofont: {name: "serif", style: "italic", size: 14 },
	infoname: 'R "Rhythm: "\n\
B "Book: "\n\
S "Source: "\n\
D "Discography: "\n\
N "Notes: "\n\
Z "Transcription: "\n\
H "History: "',
	infospace: 0,
	keywarn: true,
	leftmargin: 1.4 * CM,
	lineskipfac: 1.1,
	linewarn: true,
	maxshrink: .65,		// nice scores
	maxstaffsep: 2000,
	maxsysstaffsep: 2000,
	measurefont: {name: "serif", style: "italic", size: 10},
	measurenb: -1,
	musicfont: {name: "music", src: musicfont, size: 24},
	musicspace: 6,
//	notespacingfactor: 1.33
	partsfont: {name: "serif", size: 15},
	parskipfac: .4,
	partsspace: 8,
//	pageheight: 29.7 * CM,
	pagewidth: 21 * CM,
	printmargin: 0,
	rightmargin: 1.4 * CM,
	rbdbstop: true,
	rbmax: 4,
	rbmin: 2,
	repeatfont: {name: "serif", size: 13},
	scale: 1,
	slurheight: 1.0,
	staffsep: 46,
	stemheight: 21,			// one octave
	stretchlast: .25,
	stretchstaff: true,
	subtitlefont: {name: "serif", size: 16},
	subtitlespace: 3,
	sysstaffsep: 34,
	tempofont: {name: "serif", weight: "bold", size: 12},
	textfont: {name: "serif", size: 16},
//	textoption: undefined,
	textspace: 14,
	tieheight: 1.0,
	titlefont: {name: "serif", size: 20},
//	titleleft: false,
	titlespace: 6,
	titletrim: true,
//	transp: 0,			// global transpose
//	topmargin: .7 * IN,
	topspace: 22,
	tuplets: [0, 0, 0, 0],
	vocalfont: {name: "serif", weight: "bold", size: 13},
	vocalspace: 10,
	voicefont: {name: "serif", weight: "bold", size: 13},
//	voicescale: 1,
	writefields: "CMOPQsTWw",
	wordsfont: {name: "serif", size: 16},
	wordsspace: 5
}

function get_bool(param) {
	return !param || !/^(0|n|f)/i.test(param) // accept void as true !
}

// %%font <font> [<encoding>] [<scale>]
function get_font_scale(param) {
    var	i, font,
	a = info_split(param)	// a[0] = font name

	if (a.length <= 1)
		return
	var scale = parseFloat(a[a.length - 1])

	if (isNaN(scale) || scale <= 0.5) {
		syntax(1, "Bad scale value in %%font")
		return
	}
	font_scale_tb[a[0]] = scale
}

// set the width factor of a font
function set_font_fac(font) {
    var scale = font_scale_tb[font.name]

	if (!scale)
		scale = 1.1;
	font.swfac = font.size * scale
}

// %%xxxfont fontname|* [encoding] [size|*]
function param_set_font(xxxfont, p) {
    var	font, n, a

	// "setfont-<n>" goes to "u<n>font"
	if (xxxfont[xxxfont.length - 2] == '-') {
		n = xxxfont[xxxfont.length - 1]
		if (n < '1' || n > '9')
			return
		xxxfont = "u" + n + "font"
	}

	// create a new font
	font = cfmt[xxxfont];
	if (!font) {			// set-font-<n> or new element
		font = {}
	} else {
		font = {
			name: font.name,
			size: font.size,
			box: font.box
		}
	}
	cfmt[xxxfont] = font;

	// fill the values
	a = p.match(/\s+(no)?box(\s|$)/)
	if (a) {				// if box
		if (a[1])
			font.box = false	// nobox
		else
			font.box = true;
		p = p.replace(a[0], a[2])
	}

	a = p.match(/\s+class=(.*?)(\s|$)/)
	if (a) {
		font.class = a[1];
		p = p.replace(a[0], a[2])
	}
	a = p.match(/\s+wadj=(.*?)(\s|$)/)
	if (a) {
	    if (typeof document == "undefined")	// useless if in browser
		switch (a[1]) {
		case 'none':
			font.wadj = ''
			break
		case 'space':
			font.wadj = 'spacing'
			break
		case 'glyph':
			font.wadj = 'spacingAndGlyphs'
			break
		default:
			syntax(1, errs.bad_val, "%%" + xxxfont)
			break
		}
		p = p.replace(a[0], a[2])
	}

	// the font size is the last item
	a = p.match(/\s+([0-9.]+|\*)$/)
	if (a) {
		if (a[1] != "*")
			font.size = Number(a[1])
		p = p.replace(a[0], "")
	}

	a = p.match(/[- ]?[nN]ormal/)
	if (a) {
		font.normal = true
		p = p.replace(a[0], '')
	}

	a = p.match(/[- ]?[bB]old/)
	if (a) {
		font.weight = "bold"
		p = p.replace(a[0], '')
	}
	a = p.match(/[- ]?[iI]talic/)
	if (a) {
		font.style = "italic"
		p = p.replace(a[0], '')
	}
	a = p.match(/[- ]?[oO]blique/)
	if (a) {
		font.style = "oblique"
		p = p.replace(a[0], '')
	}
	if (font.size)
		set_font_fac(font)
	else
		font.swfac = 0
	switch (p) {
	case "":
	case "*": return
	case "Times-Roman":
	case "Times":	p = "serif"; break
	case "Helvetica": p = "sans-serif"; break
	case "Courier": p = "monospace"; break
	}

	// accept url(...) as the font name
	if (p[3] == '(') {
		font.src = p
		font.fid = font_tb.length
		font_tb.push(font)
		p = 'ft' + font.fid
	}
	font.name = p
}

// get a length with a unit - return the number of pixels
function get_unit(param) {
    var	v = param.toLowerCase().match(/([\d.]+)(.*)/)

	v[1] = Number(v[1])
	switch (v[2]) {
	case "cm":
		return v[1] * CM
	case "in":
		return v[1] * IN
	case "pt":		// paper point in 1/72 inch
		return v[1] * .75
	case "px":		// screen pixel in 1/96 inch
	case "":
		return v[1]
	}
	return NaN
}

// set the infoname
function set_infoname(param) {
//fixme: check syntax: '<letter> ["string"]'
	var	tmp = cfmt.infoname.split("\n"),
		letter = param[0]

	for (var i = 0; i < tmp.length; i++) {
		var infoname = tmp[i]
		if (infoname[0] != letter)
			continue
		if (param.length == 1)
			tmp.splice(i, 1)
		else
			tmp[i] = param
		cfmt.infoname = tmp.join('\n')
		return
	}
	cfmt.infoname += "\n" + param
}

// get the text option
var textopt = {
	align: 'j',
	center: 'c',
	fill: 'f',
	justify: 'j',
	ragged: 'f',
	right: 'r',
	skip: 's'
}
function get_textopt(param) {
	return textopt[param]
}

/* -- position of a voice element -- */
var posval = {
	above: C.SL_ABOVE,
	auto: 0,		// !! not C.SL_AUTO !!
	below: C.SL_BELOW,
	down: C.SL_BELOW,
	hidden: C.SL_HIDDEN,
	opposite: C.SL_HIDDEN,
	under: C.SL_BELOW,
	up: C.SL_ABOVE
}

/* -- set the position of elements in a voice -- */
function set_pos(k, v) {		// keyword, value
	k = k.slice(0, 3)
	if (k == "ste")
		k = "stm"
	set_v_param("pos", k + ' ' + v)
}

// set/unset the fields to write
function set_writefields(parm) {
	var	c, i,
		a = parm.split(/\s+/)

	if (get_bool(a[1])) {
		for (i = 0; i < a[0].length; i++) {	// set
			c = a[0][i]
			if (cfmt.writefields.indexOf(c) < 0)
				cfmt.writefields += c
		}
	} else {
		for (i = 0; i < a[0].length; i++) {	// unset
			c = a[0][i]
			if (cfmt.writefields.indexOf(c) >= 0)
				cfmt.writefields = cfmt.writefields.replace(c, '')
		}
	}
}

// set a voice specific parameter
function set_v_param(k, v) {
	k = [k + '=', v]
	if (curvoice)
		set_kv_parm(k)
	else
		memo_kv_parm('*', k)
}

function set_page() {
	if (!img.chg)
		return
	img.chg = false;
	img.lm = cfmt.leftmargin - cfmt.printmargin
	if (img.lm < 0)
		img.lm = 0;
	img.rm = cfmt.rightmargin - cfmt.printmargin
	if (img.rm < 0)
		img.rm = 0;
	img.width = cfmt.pagewidth - 2 * cfmt.printmargin

	// must have 100pt at least as the staff width
	if (img.width - img.lm - img.rm < 100) {
		error(0, undefined, "Bad staff width");
		img.width = img.lm + img.rm + 150
	}
	set_posx()
} // set_page()

// set a format parameter
// (possible hook)
Abc.prototype.set_format = function(cmd, param) {
	var f, f2, v, i

//fixme: should check the type and limits of the parameter values
	if (/.+font(-[\d])?$/.test(cmd)) {
		param_set_font(cmd, param)
		return
	}

	switch (cmd) {
	case "aligncomposer":
	case "barsperstaff":
	case "infoline":
	case "measurenb":
	case "rbmax":
	case "rbmin":
	case "shiftunison":
		v = parseInt(param)
		if (isNaN(v)) {
			syntax(1, "Bad integer value");
			break
		}
		cfmt[cmd] = v
		break
	case "bgcolor":
	case "fgcolor":
	case "dblrepbar":
	case "titleformat":
		cfmt[cmd] = param
		break
	case "beamslope":
	case "breaklimit":			// float values
	case "lineskipfac":
	case "maxshrink":
	case "pagescale":
	case "parskipfac":
	case "scale":
	case "slurheight":
	case "stemheight":
	case "stretchlast":
	case "tieheight":
		f = parseFloat(param)
		if (isNaN(f)) {
			syntax(1, errs.bad_val, '%%' + cmd)
			break
		}
		switch (cmd) {
		case "scale":			// old scale
			f /= .75
		case "pagescale":
			cmd = "scale";
			img.chg = true
			break
		}
		cfmt[cmd] = f
		break
	case "annotationbox":
	case "gchordbox":
	case "measurebox":
	case "partsbox":
		cfmt[cmd.replace("box", "font")]	// font
			.box = get_bool(param)
		break
	case "bstemdown":
	case "breakoneoln":
	case "cancelkey":
	case "contbarnb":
	case "custos":
	case "decoerr":
	case "dynalign":
	case "flatbeams":
	case "graceslurs":
	case "graceword":
	case "hyphencont":
	case "keywarn":
	case "linewarn":
	case "quiet":
	case "rbdbstop":
	case "singleline":
	case "squarebreve":
	case "splittune":
	case "straightflags":
	case "stretchstaff":
	case "timewarn":
	case "titlecaps":
	case "titleleft":
		cfmt[cmd] = get_bool(param)
		break
	case "chordnames":
		v = param.split(',')
		cfmt.chordnames = {}
		for (i = 0; i < v.length; i++)
			cfmt.chordnames['CDEFGAB'[i]] = v[i]
		break
	case "composerspace":
	case "indent":
	case "infospace":
	case "maxstaffsep":
	case "maxsysstaffsep":
	case "musicspace":
	case "partsspace":
	case "staffsep":
	case "subtitlespace":
	case "sysstaffsep":
	case "textspace":
	case "titlespace":
	case "topspace":
	case "vocalspace":
	case "wordsspace":
		f = get_unit(param)	// normally, unit in points - 72 DPI accepted
		if (isNaN(f))
			syntax(1, errs.bad_val, '%%' + cmd)
		else
			cfmt[cmd] = f
		break
	case "print-leftmargin":	// to remove
		syntax(0, "$1 is deprecated - use %%printmargin instead", '%%' + cmd)
		cmd = "printmargin"
		// fall thru
	case "printmargin":
//	case "botmargin":
	case "leftmargin":
//	case "pageheight":
	case "pagewidth":
	case "rightmargin":
//	case "topmargin":
		f = get_unit(param)	// normally unit in cm or in - 96 DPI
		if (isNaN(f)) {
			syntax(1, errs.bad_val, '%%' + cmd)
			break
		}
		cfmt[cmd] = f;
		img.chg = true
		break
	case "concert-score":
		if (cfmt.sound != "play")
			cfmt.sound = "concert"
		break
	case "writefields":
		set_writefields(param)
		break
	case "dynamic":
	case "gchord":
	case "gstemdir":
	case "ornament":
	case "stemdir":
	case "vocal":
	case "volume":
		set_pos(cmd, param)
		break
	case "font":
		get_font_scale(param)
		break
	case "fullsvg":
		if (parse.state != 0) {
			syntax(1, errs.not_in_tune, "%%fullsvg")
			break
		}
//fixme: should check only alpha, num and '_' characters
		cfmt[cmd] = param
		break
	case "gracespace":
		v = param.split(/\s+/)
		for (i = 0; i < 3; i++)
			if (isNaN(Number(v[i]))) {
				syntax(1, errs.bad_val, "%%gracespace")
				break
			}
		for (i = 0; i < 3; i++)
			cfmt[cmd][i] = Number(v[i])
		break
	case "tuplets":
		cfmt[cmd] = param.split(/\s+/);
		v = cfmt[cmd][3]
		if (v			// if 'where'
		 && (posval[v]))	// translate the keyword
			cfmt[cmd][3] = posval[v]
		break
	case "infoname":
		set_infoname(param)
		break
	case "notespacingfactor":
		f = parseFloat(param)
		if (isNaN(f) || f < 1 || f > 2) {
			syntax(1, errs.bad_val, "%%" + cmd)
			break
		}
		i = 5;				// index of crotchet
		f2 = space_tb[i]
		for ( ; --i >= 0; ) {
			f2 /= f;
			space_tb[i] = f2
		}
		i = 5;
		f2 = space_tb[i]
		for ( ; ++i < space_tb.length; ) {
			f2 *= f;
			space_tb[i] = f2
		}
		break
	case "play":
		cfmt.sound = "play"		// without clef
		break
	case "pos":
		cmd = param.split(/\s+/);
		set_pos(cmd[0], cmd[1])
		break
	case "sounding-score":
		if (cfmt.sound != "play")
			cfmt.sound = "sounding"
		break
	case "staffwidth":
		v = get_unit(param)
		if (isNaN(v)) {
			syntax(1, errs.bad_val, '%%' + cmd)
			break
		}
		if (v < 100) {
			syntax(1, "%%staffwidth too small")
			break
		}
		v = cfmt.pagewidth - v - cfmt.leftmargin
		if (v < 2) {
			syntax(1, "%%staffwidth too big")
			break
		}
		cfmt.rightmargin = v;
		img.chg = true
		break
	case "textoption":
		cfmt[cmd] = get_textopt(param)
		break
	case "titletrim":
		v = Number(param)
		if (isNaN(v))
			cfmt[cmd] = get_bool(param)
		else
			cfmt[cmd] = v
		break
	case "combinevoices":
		syntax(1, "%%combinevoices is deprecated - use %%voicecombine instead")
		break
	case "voicemap":
		set_v_param("map", param)
		break
	case "voicescale":
		set_v_param("scale", param)
		break
	default:		// memorize all global commands
		if (parse.state == 0)		// (needed for modules)
			cfmt[cmd] = param
		break
	}
}

// font stuff

// build a font style
function st_font(font) {
    var	n = font.name,
	r = ""

	if (font.weight)
		r += font.weight + " "
	if (font.style)
		r += font.style + " "
	if (n.indexOf('"') < 0 && n.indexOf(' ') > 0)
		n = '"' + n + '"'
	return r + font.size.toFixed(1) + 'px ' + n
}
function style_font(font) {
	return 'font:' + st_font(font)
}
Abc.prototype.style_font = style_font

// build a font class
function font_class(font) {
	if (font.class)
		return 'f' + font.fid + cfmt.fullsvg + ' ' + font.class
	return 'f' + font.fid + cfmt.fullsvg
}

// use the font
function use_font(font) {
	if (!font.used) {
		font.used = true;
		if (font.fid == undefined) {	// if default font
			font.fid = font_tb.length
			font_tb.push(font)
			if (!font.swfac)
				set_font_fac(font)
		}
		font_style += "\n.f" + font.fid + cfmt.fullsvg +
			"{" + style_font(font) + "}"
		if (font.src)
			font_style += "\n@font-face{\n\
 font-family:" + font.name + ";\n\
 src:" + font.src + "}"
	}
}

// get the font of the 'xxxfont' parameter
function get_font(fn) {
    var	font, font2, fid, st

	fn += "font"
	font = cfmt[fn]
	if (!font) {
		syntax(1, "Unknown font $1", '$' + fn[1]);
		return gene.curfont
	}

	if (!font.name || !font.size) {		// if incomplete user font
		font2 = Object.create(gene.curfont)
		if (font.name)
			font2.name = font.name
		if (font.normal) {
			if (font2.weight)	// !! don't use delete !!
				font2.weight = null
			if (font2.style)
				font2.style = null
		} else {
			if (font.weight)
				font2.weight = font.weight
			if (font.style)
				font2.style = font.style
		}
		if (font.class)
			font2.class = font.class
		if (font.size)
			font2.size = font.size
		st = st_font(font2)
		fid = font_st[st]
		if (fid != undefined)
			return font_tb[fid]
		font_st[st] = font_tb.length	// will be the font id
		font2.fid = font2.used = undefined
		font = font2
	}
	use_font(font)
	return font
}
