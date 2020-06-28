// abc2svg - abc2svg.js
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

// define the abc2svg object is not yet done
if (typeof abc2svg == "undefined")
	var abc2svg = {};

// constants
abc2svg.C = {
	BLEN: 1536,

	// symbol types
	BAR: 0,
	CLEF: 1,
	CUSTOS: 2,
	GRACE: 4,
	KEY: 5,
	METER: 6,
	MREST: 7,
	NOTE: 8,
	PART: 9,
	REST: 10,
	SPACE: 11,
	STAVES: 12,
	STBRK: 13,
	TEMPO: 14,
	BLOCK: 16,
	REMARK: 17,

	// note heads
	FULL: 0,
	EMPTY: 1,
	OVAL: 2,
	OVALBARS: 3,
	SQUARE: 4,

	// slur/tie types (3 + 1 bits)
	SL_ABOVE: 0x01,
	SL_BELOW: 0x02,
	SL_AUTO: 0x03,
	SL_HIDDEN: 0x04,
	SL_DOTTED: 0x08		// (modifier bit)
    };

// !! tied to the symbol types in abc2svg.js !!
abc2svg.sym_name = ['bar', 'clef', 'custos', '', 'grace',
		'key', 'meter', 'Zrest', 'note', 'part',
		'rest', 'yspace', 'staves', 'Break', 'tempo',
		'', 'block', 'remark']

	// key table - index = number of accidentals + 7
abc2svg.keys = [
	new Int8Array([-1,-1,-1,-1,-1,-1,-1 ]),	// 7 flat signs
	new Int8Array([-1,-1,-1, 0,-1,-1,-1 ]),	// 6 flat signs
	new Int8Array([ 0,-1,-1, 0,-1,-1,-1 ]),	// 5 flat signs
	new Int8Array([ 0,-1,-1, 0, 0,-1,-1 ]),	// 4 flat signs
	new Int8Array([ 0, 0,-1, 0, 0,-1,-1 ]),	// 3 flat signs
	new Int8Array([ 0, 0,-1, 0, 0, 0,-1 ]),	// 2 flat signs
	new Int8Array([ 0, 0, 0, 0, 0, 0,-1 ]),	// 1 flat signs
	new Int8Array([ 0, 0, 0, 0, 0, 0, 0 ]),	// no accidental
	new Int8Array([ 0, 0, 0, 1, 0, 0, 0 ]),	// 1 sharp signs
	new Int8Array([ 1, 0, 0, 1, 0, 0, 0 ]),	// 2 sharp signs
	new Int8Array([ 1, 0, 0, 1, 1, 0, 0 ]),	// 3 sharp signs
	new Int8Array([ 1, 1, 0, 1, 1, 0, 0 ]),	// 4 sharp signs
	new Int8Array([ 1, 1, 0, 1, 1, 1, 0 ]),	// 5 sharp signs
	new Int8Array([ 1, 1, 1, 1, 1, 1, 0 ]),	// 6 sharp signs
	new Int8Array([ 1, 1, 1, 1, 1, 1, 1 ])	// 7 sharp signs
]

// base-40 representation of musical pitch
// (http://www.ccarh.org/publications/reprints/base40/)
abc2svg.p_b40 = new Int8Array(			// staff pitch to base-40
//		  C  D   E   F   G   A   B
		[ 2, 8, 14, 19, 25, 31, 37 ])
abc2svg.b40_p = new Int8Array(			// base-40 to staff pitch
//		       C		 D
		[0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1,
//	      E		     F		       G
	2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4,
//	      A			B
	5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6 ])
abc2svg.b40_a = new Int8Array(			// base-40 to accidental
//		         C		     D
		[-2, -1, 0, 1, 2, 0, -2, -1, 0, 1, 2, 0,
//		E		 F		     G
	-2, -1, 0, 1, 2, -2, -1, 0, 1, 2, 0, -2, -1, 0, 1, 2, 0,
//		A		    B
	-2, -1, 0, 1, 2, 0, -2, -1, 0, 1, 2 ])
abc2svg.b40_m = new Int8Array(			// base-40 to midi
//			 C		   D
		[-2, -1, 0, 1, 2, 0, 0, 1, 2, 3, 4, 0,
//	      E		     F		       G
	2, 3, 4, 5, 6, 3, 4, 5, 6, 7, 0, 5, 6, 7, 8, 9, 0,
//	      A			    B
	7, 8, 9, 10, 11, 0, 9, 10, 11, 12, 13 ])
abc2svg.b40k =  new Int8Array(		// base-40 interval to possible transposition
//		        C		  D
		[36, 1, 2, 3, 8, 2, 2, 7, 8,13,14, 2,
//		    37
//	       E	      F		        G
	 8,13,14,19,20,13,14,19,20,25, 2,19,24,25,30,31, 2,
//					    20
//	       A		 B
	25,30,31,36,37, 2,31,36,37,38, 3 ])
//				    2
abc2svg.b40sf = new Int8Array(		// base-40 interval to key signature
//		        C		   D
		[-2,-7, 0, 7, 2, 88, 0,-5, 2,-3, 4, 88,
//	       E	      F		        G
	 2,-3, 4,-1, 6,-3, 4,-1, 6, 1,88,-1,-6, 1,-4, 3,88,
//	       A		 B
	 1,-4, 3,-2, 5,88, 3,-2, 5, 0, 7 ])
abc2svg.isb40 = new Int8Array(		// interval with sharp to base-40 interval
	[0, 1, 6,11,12,17,18,23,28,29,34,35])
abc2svg.ifb40 = new Int8Array(		// interval with flat to base-40 interval
	[0, 5, 6,11,12,17,22,23,28,29,34,39])

abc2svg.pab40 = function(p, a) {
	p += 19				// staff pitch from C-1
   var	b40 = ((p / 7) | 0) * 40 + abc2svg.p_b40[p % 7]
	if (a && a != 3)		// if some accidental, but not natural
		b40 += a
	return b40
} // pit2b40()
abc2svg.b40p = function(b) {
	return ((b / 40) | 0) * 7 + abc2svg.b40_p[b % 40] - 19
} // b40p()
abc2svg.b40a = function(b) {
	return abc2svg.b40_a[b % 40]
} // b40a()
abc2svg.b40m = function(b) {
	return ((b / 40) | 0) * 12 + abc2svg.b40_m[b % 40]
} // b40m()

// simplify a rational number n/d
abc2svg.rat = function(n, d) {
    var	a, t,
	n0 = 0,
	d1 = 0,
	n1 = 1,
	d0 = 1
	while (1) {
		if (d == 0)
			break
		t = d
		a = (n / d) | 0
		d = n % d
		n = t
		t = n0 + a * n1
		n0 = n1
		n1 = t
		t = d0 + a * d1
		d0 = d1
		d1 = t
	}
	return [n1, d1]
} // rat()

// compare pitches
// This function is used to sort the note pitches
abc2svg.pitcmp = function(n1, n2) { return n1.pit - n2.pit }

// start of the Abc object
abc2svg.Abc = function(user) {
	"use strict";

    // constants
    var	C = abc2svg.C;

	// mask some unsafe functions
    var	require = empty_function,
	system = empty_function,
	write = empty_function,
	XMLHttpRequest = empty_function;

// -- constants --

// staff system
var	OPEN_BRACE = 0x01,
	CLOSE_BRACE = 0x02,
	OPEN_BRACKET = 0x04,
	CLOSE_BRACKET = 0x08,
	OPEN_PARENTH = 0x10,
	CLOSE_PARENTH = 0x20,
	STOP_BAR = 0x40,
	FL_VOICE = 0x80,
	OPEN_BRACE2 = 0x0100,
	CLOSE_BRACE2 = 0x0200,
	OPEN_BRACKET2 = 0x0400,
	CLOSE_BRACKET2 = 0x0800,
	MASTER_VOICE = 0x1000,

	IN = 96,		// resolution 96 PPI
	CM = 37.8,		// 1 inch = 2.54 centimeter
	YSTEP = 256		/* number of steps for y offsets */

// error texts
var errs = {
	bad_char: "Bad character '$1'",
	bad_grace: "Bad character in grace note sequence",
	bad_transp: "Bad transpose value",
	bad_val: "Bad value in $1",
	bar_grace: "Cannot have a bar in grace notes",
	ignored: "$1: inside tune - ignored",
	misplaced: "Misplaced '$1' in %%score",
	must_note: "!$1! must be on a note",
	must_note_rest: "!$1! must be on a note or a rest",
	nonote_vo: "No note in voice overlay",
	not_ascii: "Not an ASCII character",
	not_enough_n: 'Not enough notes/rests for %%repeat',
	not_enough_m: 'Not enough measures for %%repeat',
	not_enough_p: "Not enough parameters in %%map",
	not_in_tune: "Cannot have '$1' inside a tune",
	notransp: "Cannot transpose with a temperament"
}

    var	self = this,				// needed for modules
	glovar = {
		meter: {
			type: C.METER,		// meter in tune header
			wmeasure: 1,		// no M:
			a_meter: []		// default: none
		},
	},
	info = {},			// information fields
	parse = {
		ctx: {},
		prefix: '%',
		state: 0,
		ottava: [],
		line: new scanBuf
	},
	tunes = [],		// first time symbol and voice array per tune for playing
	psvg			// PostScript

// utilities
function clone(obj, lvl) {
	if (!obj)
		return obj
	var tmp = new obj.constructor
	for (var k in obj)
	    if (obj.hasOwnProperty(k)) {
		if (lvl && typeof obj[k] != "number")
			tmp[k] = clone(obj[k], lvl - 1)
		else
			tmp[k] = obj[k]
	    }
	return tmp
}

function errbld(sev, txt, fn, idx) {
	var i, j, l, c, h

	if (user.errbld) {
		switch (sev) {
		case 0: sev = "warn"; break
		case 1: sev = "error"; break
		default: sev= "fatal"; break
		}
		user.errbld(sev, txt, fn, idx)
		return
	}
	if (idx != undefined && idx >= 0) {
		i = l = 0
		while (1) {
			j = parse.file.indexOf('\n', i)
			if (j < 0 || j > idx)
				break
			l++;
			i = j + 1
		}
		c = idx - i
	}
	h = ""
	if (fn) {
		h = fn
		if (l)
			h += ":" + (l + 1) + ":" + (c + 1);
		h += " "
	}
	switch (sev) {
	case 0: h += "Warning: "; break
	case 1: h += "Error: "; break
	default: h += "Internal bug: "; break
	}
	user.errmsg(h + txt, l, c)
}

function error(sev, s, msg, a1, a2, a3, a4) {
	var i, j, regex, tmp

	if (!sev && cfmt.quiet)
		return
	if (user.textrans) {
		tmp = user.textrans[msg]
		if (tmp)
			msg = tmp
	}
	if (arguments.length > 3)
		msg = msg.replace(/\$./g, function(a) {
			switch (a) {
			case '$1': return a1
			case '$2': return a2
			case '$3': return a3
			default  : return a4
			}
		})
	if (s && s.fname)
		errbld(sev, msg, s.fname, s.istart)
	else
		errbld(sev, msg)
}

// scanning functions
function scanBuf() {
//	this.buffer = buffer
	this.index = 0;

	scanBuf.prototype.char = function() {
		return this.buffer[this.index]
	}
	scanBuf.prototype.next_char = function() {
		return this.buffer[++this.index]
	}
	scanBuf.prototype.get_int = function() {
		var	val = 0,
			c = this.buffer[this.index]
		while (c >= '0' && c <= '9') {
			val = val * 10 + Number(c);
			c = this.next_char()
		}
		return val
	}
}

function syntax(sev, msg, a1, a2, a3, a4) {
    var	s = {
		fname: parse.fname,
		istart: parse.istart + parse.line.index
	}

	error(sev, s, msg, a1, a2, a3, a4)
}

// inject javascript code
function js_inject(js) {
	if (!/eval *\(|Function|setTimeout|setInterval/.test(js))
		eval('"use strict";\n' + js)
	else
		syntax(1, "Unsecure code")
}
