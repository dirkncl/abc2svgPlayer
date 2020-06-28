// abc2svg - tune.js - tune generation
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

var	par_sy,		// current staff system for parse
	cur_sy,		// current staff system for generation
	voice_tb,
	curvoice,
	staves_found,
	vover,		// voice overlay
	tsfirst

/* apply the %%voice options of the current voice */
function voice_filter() {
    var	opt

	function vfilt(opts, opt) {
	    var	i,
		sel = new RegExp(opt)

		if (sel.test(curvoice.id)
		 || sel.test(curvoice.nm)) {
			for (i = 0; i < opts.length; i++)
				self.do_pscom(opts[i])
		}
	}

	// global
	if (parse.voice_opts)
	    for (opt in parse.voice_opts) {
		if (parse.voice_opts.hasOwnProperty(opt))
			vfilt(parse.voice_opts[opt], opt)
	}

	// tune
	if (parse.tune_v_opts)
	    for (opt in parse.tune_v_opts) {
		if (parse.tune_v_opts.hasOwnProperty(opt))
			vfilt(parse.tune_v_opts[opt], opt)
	}
}

/* -- link a ABC symbol into the current voice -- */
function sym_link(s) {
	if (!s.fname)
		set_ref(s)
		parse.last_sym = s;
		s.prev = curvoice.last_sym
		if (curvoice.last_sym)
			curvoice.last_sym.next = s
		else
			curvoice.sym = s;
		curvoice.last_sym = s
	s.v = curvoice.v;
	s.p_v = curvoice;
	s.st = curvoice.cst;
	s.time = curvoice.time
	if (s.dur && !s.grace)
		curvoice.time += s.dur;
	s.pos = curvoice.pos
	if (curvoice.second)
		s.second = true
	if (curvoice.floating)
		s.floating = true
	if (curvoice.eoln) {
		s.soln = true
		curvoice.eoln = false
	}
}

/* -- add a new symbol in a voice -- */
function sym_add(p_voice, type) {
	var	s = {
			type:type,
			dur:0
		},
		s2,
		p_voice2 = curvoice;

	curvoice = p_voice;
	sym_link(s);
	curvoice = p_voice2;
	s2 = s.prev
	if (!s2)
		s2 = s.next
	if (s2) {
		s.fname = s2.fname;
		s.istart = s2.istart;
		s.iend = s2.iend
	}
	return s
}

/* -- sort all symbols by time and vertical sequence -- */
// weight of the symbols !! depends on the symbol type !!
var w_tb = new Uint8Array([
	4,	// bar
	1,	// clef
	8,	// custos
	0,	// (free)
	3,	// grace
	5,	// key
	6,	// meter
	9,	// mrest
	9,	// note
	0,	// part
	9,	// rest
	3,	// space
	0,	// staves
	7,	// stbrk
	0,	// tempo
	0,	// (free)
	0,	// block
	0	// remark
])

function sort_all() {
    var	s, s2, p_voice, v, time, w, wmin, ir, multi,
	prev, nb, ir2, v2, fl, new_sy,
	nv = voice_tb.length,
	vtb = [],
	vn = [],			// voice indexed by range
	sy = cur_sy

	for (v = 0; v < nv; v++)
		vtb.push(voice_tb[v].sym)

	// set the first symbol
	ir2 = nv
	multi = -1
	for (v = 0; v < nv; v++) {
		if (!sy.voices[v])
			continue
		ir = sy.voices[v].range
		if (ir < ir2)
			ir2 = ir
		vn[ir] = v
		multi++
	}
	v = vn[ir2]
	tsfirst = prev = vtb[v]
	if (!tsfirst)
		return				// no music
	vtb[v] = tsfirst.next
	prev.seqst = true
	fl = !w_tb[prev.type] || tsfirst.type == tsfirst.next

	// loop on the symbols of all voices
	while (1) {
		if (new_sy && fl) {
			sy = new_sy;
			new_sy = null;
			multi = -1;
			vn = []
			for (v = 0; v < nv; v++) {
				if (!sy.voices[v])
					continue
				ir = sy.voices[v].range
				vn[ir] = v;
				multi++
			}
		}

		/* search the min time and symbol weight */
		wmin = time = 1000000				/* big int */
		for (ir = 0; ir < nv; ir++) {
			v = vn[ir]
			if (v == undefined)
				break
			s = vtb[v]
			if (!s || s.time > time)
				continue
			w = w_tb[s.type]
			if (s.time < time) {
				time = s.time;
				wmin = w
			} else if (w < wmin) {
				wmin = w
			}
		}

		if (wmin > 127)
			break			// done

		/* link the vertical sequence */
		for (ir = 0; ir < nv; ir++) {
			v = vn[ir]
			if (v == undefined)
				break
			s = vtb[v]
			if (!s || s.time != time
			 || w_tb[s.type] != wmin)
				continue
			if (s.type == C.STAVES) {
				new_sy = s.sy;

				// set all voices of previous and next staff systems
				// as reachable
				for (ir2 = 0; ir2 < nv; ir2++) {
					if (vn[ir2] == undefined)
						break
				}
				for (v2 = 0; v2 < nv; v2++) {
					if (!new_sy.voices[v2]
					 || sy.voices[v2])
						continue
					vn[ir2++] = v2
				}
			}
			if (fl) {
				fl = 0;
				s.seqst = true
			}
			s.ts_prev = prev
			prev.ts_next = s
			prev = s

			vtb[v] = s.next
		}
		fl = wmin		/* start a new sequence if some width */
	}
}

// adjust some voice elements
function voice_adj(sys_chg) {
	var p_voice, s, s2, v

	// set the duration of the notes under a feathered beam
	function set_feathered_beam(s1) {
		var	s, s2, t, d, b, i, a,
			d = s1.dur,
			n = 1

		/* search the end of the beam */
		for (s = s1; s; s = s.next) {
			if (s.beam_end || !s.next)
				break
			n++
		}
		if (n <= 1) {
			delete s1.feathered_beam
			return
		}
		s2 = s;
		b = d / 2;		/* smallest note duration */
		a = d / (n - 1);	/* delta duration */
		t = s1.time
		if (s1.feathered_beam > 0) {	/* !beam-accel! */
			for (s = s1, i = n - 1;
			     s != s2;
			     s = s.next, i--) {
				d = ((a * i) | 0) + b;
				s.dur = d;
				s.time = t;
				t += d
			}
		} else {				/* !beam-rall! */
			for (s = s1, i = 0;
			     s != s2;
			     s = s.next, i++) {
				d = ((a * i) | 0) + b;
				s.dur = d;
				s.time = t;
				t += d
			}
		}
		s.dur = s.time + s.dur - t;
		s.time = t
	} // end set_feathered_beam()

	// if Q: from tune header, put it at start of the music
	// (after the staff system)
	s = glovar.tempo
	if (s && staves_found <= 0) {	// && !s.invis) {	- play problem
					//fixme: which play problem?
		v = par_sy.top_voice;
		p_voice = voice_tb[v];
		if (p_voice.sym
		 && p_voice.sym.type != C.TEMPO
		 && (!p_voice.sym.next
		  || p_voice.sym.next.type != C.TEMPO)) {
			s = clone(s);
			s.v = v;
			s.p_v = p_voice;
			s.st = p_voice.st;
			s.time = 0;
			s.prev = p_voice.sym
			s.next = p_voice.sym.next
			if (s.next)
				s.next.prev = s
			p_voice.sym.next = s
		}
	}

	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (!sys_chg			// if not %%score
		 && p_voice.sls.length) {	// and no end of slur
			while (1) {
			    var	sl = p_voice.sls.shift()

				if (!sl)
					break
				s = sl.note.s
				for (s2 = s.next; s2; s2 = s2.next) {
					if (s2.bar_type && s2.bar_type[0] == ':')
						break
				}
				if (s2) {
					if (!s.sls)
						s.sls = []
					s.sls.push({
						ty: sl.ty,
						note: {s: s2}
					})
				} else {
					syntax(1, "Lack of ending slur(s)")
				}
			}
		}
		for (s = p_voice.sym; s; s = s.next) {
			if (s.time >= staves_found)
				break
		}
		for ( ; s; s = s.next) {
			switch (s.type) {
			case C.GRACE:
				// with w_tb[C.BAR] = 2,
				// the grace notes go after the bar;
				// if before a bar, change the grace time
				if (s.next && s.next.type == C.BAR)
					s.time--

				if (!cfmt.graceword)
					continue
				for (s2 = s.next; s2; s2 = s2.next) {
					switch (s2.type) {
					case C.SPACE:
						continue
					case C.NOTE:
						if (!s2.a_ly)
							break
						s.a_ly = s2.a_ly;
						s2.a_ly = null
						break
					}
					break
				}
				continue
			}

			if (s.feathered_beam)
				set_feathered_beam(s)
		}
	}
}

/* -- duplicate the voices as required -- */
function dupl_voice() {
	var	p_voice, p_voice2, s, s2, g, g2, v, i,
		nv = voice_tb.length

	for (v = 0; v < nv; v++) {
		p_voice = voice_tb[v];
		p_voice2 = p_voice.clone
		if (!p_voice2)
			continue
		p_voice.clone = null
		for (s = p_voice.sym; s; s = s.next) {
//fixme: there may be other symbols before the %%staves at this same time
			if (s.time >= staves_found)
				break
		}
		p_voice2.clef = clone(p_voice.clef);
		curvoice = p_voice2
		for ( ; s; s = s.next) {
			if (s.type == C.STAVES)
				continue
			s2 = clone(s)
			if (s.notes) {
				s2.notes = []
				for (i = 0; i <= s.nhd; i++)
					s2.notes.push(clone(s.notes[i]))
			}
			sym_link(s2)
//			s2.time = s.time
			if (p_voice2.second)
				s2.second = true
			else
				delete s2.second
			if (p_voice2.floating)
				s2.floating = true
			else
				delete s2.floating
			delete s2.a_ly;
			g = s2.extra
			if (!g)
				continue
			g2 = clone(g);
			s2.extra = g2;
			s2 = g2;
			s2.v = p_voice2.v;
			s2.p_v = p_voice2;
			s2.st = p_voice2.st
			for (g = g.next; g; g = g.next) {
				g2 = clone(g)
				if (g.notes) {
					g2.notes = []
					for (i = 0; i <= g.nhd; i++)
						g2.notes.push(clone(g.notes[i]))
				}
				s2.next = g2;
				g2.prev = s2;
				s2 = g2;
				s2.v = p_voice2.v;
				s2.p_v = p_voice2;
				s2.st = p_voice2.st
			}
		}
	}
}

/* -- create a new staff system -- */
function new_syst(init) {
	var	st, v,
		sy_new = {
			voices: [],
			staves: [],
			top_voice: 0
		}

	if (init) {				/* first staff system */
		cur_sy = par_sy = sy_new
		return
	}

	// update the previous system
	for (v = 0; v < voice_tb.length; v++) {
	    if (par_sy.voices[v]) {
		st = par_sy.voices[v].st
		var	sy_staff = par_sy.staves[st],
			p_voice = voice_tb[v]

		if (p_voice.staffnonote != undefined)
			sy_staff.staffnonote = p_voice.staffnonote
		if (p_voice.staffscale)
			sy_staff.staffscale = p_voice.staffscale;
	    }
	}
	for (st = 0; st < par_sy.staves.length; st++) {
		sy_new.staves[st] = clone(par_sy.staves[st]);
		sy_new.staves[st].flags = 0
	}
	par_sy.next = sy_new;
	par_sy = sy_new
}

/* -- set the bar numbers -- */
// (possible hook)
Abc.prototype.set_bar_num = function() {
	var	s, s2, tim, bar_time, bar_num, rep_dtime,
		v = cur_sy.top_voice,
		wmeasure = voice_tb[v].meter.wmeasure,
		bar_rep = gene.nbar

	/* don't count a bar at start of line */
	for (s = tsfirst; ; s = s.ts_next) {
		if (!s)
			return
		switch (s.type) {
		case C.METER:
			wmeasure = s.wmeasure
		case C.CLEF:
		case C.KEY:
		case C.STBRK:
			continue
		case C.BAR:
			if (s.bar_num) {
				gene.nbar = s.bar_num	/* (%%setbarnb) */
				break
			}
			if (s.text			// if repeat bar
			 && !cfmt.contbarnb) {
				if (s.text[0] == '1') {
					bar_rep = gene.nbar
				} else {
					gene.nbar = bar_rep; /* restart bar numbering */
					s.bar_num = gene.nbar
				}
			}
			break
		}
		break
	}

	// at start of tune, check for an anacrusis
	bar_time = s.time + wmeasure
	if (s.time == 0) {
		for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
			if (s2.type == C.BAR && s2.time) {
				if (s2.time < bar_time) {	// if anacrusis
					s = s2;
					bar_time = s.time + wmeasure
				}
				break
			}
		}
	}

	// set the measure number on the top bars
	bar_num = gene.nbar

	for ( ; s; s = s.ts_next) {
		switch (s.type) {
		case C.METER:
			wmeasure = s.wmeasure
			if (s.time < bar_time)
				bar_time = s.time + wmeasure
			break
		case C.MREST:
			bar_num += s.nmes - 1
			while (s.ts_next
			    && s.ts_next.type != C.BAR)
				s = s.ts_next
			break
		case C.BAR:
			if (s.time < bar_time) {	// incomplete measure
				if (s.text && s.text[0] == '1') {
					bar_rep = bar_num;
					rep_dtime = bar_time - s.time
				}
				break
			}

			/* check if any repeat bar at this time */
			tim = s.time;
			s2 = s
			do {
				if (s2.dur)
					break
				if (s2.type == C.BAR && s2.text)	// if repeat bar
					break
				s2 = s2.next
			} while (s2 && s2.time == tim);

			if (s.bar_num)
				bar_num = s.bar_num	// (%%setbarnb)
			else
				bar_num++

			if (s2 && s2.type == C.BAR && s2.text) {
				if (s2.text[0] == '1') {
					rep_dtime = 0;
					bar_rep = bar_num
				} else {			// restart bar numbering
					if (!cfmt.contbarnb)
						bar_num = bar_rep
					if (rep_dtime) {	// [1 inside measure
						if (cfmt.contbarnb)
							bar_num--;
						bar_time = tim + rep_dtime
						break
					}
				}
			}
			s.bar_num = bar_num;
			bar_time = tim + wmeasure

			// skip the bars of the other voices
			while (s.ts_next
			    && !s.ts_next.seqst)
				s = s.ts_next
			break
		}
	}
	if (cfmt.measurenb < 0)		/* if no display of measure bar */
		gene.nbar = bar_num	/* update in case of more music to come */
}

// note mapping
// %%map map_name note [print [note_head]] [param]*
function get_map(text) {
	if (!text)
		return

    var	i, note, notes, map, tmp, ns, ty,
	a = text.split(/\s+/)

	if (a.length < 3) {
		syntax(1, not_enough_p)
		return
	}
	ns = a[1]
	if (ns[0] == '*' || ns.indexOf("all") == 0) {
		ns = 'all'
	} else {
		if (ns.indexOf("octave,") == 0	// remove the octave part
		 || ns.indexOf("key,") == 0) {
			ty = ns[0]
			ns = ns.split(',')[1]
			ns = ns.replace(/[,']*/, '').toUpperCase(); //'
//		} else {
//			ty = ''
		}
		if (ty == 'k') {
			ns = ty + ntb.indexOf(ns)
		} else {
			tmp = new scanBuf;
			tmp.buffer = ns
			note = parse_acc_pit(tmp)
			if (!note) {
				syntax(1, "Bad note in %%map")
				return
			}
			if (ty == 'o')
				ns = ty + (abc2svg.pab40(note.pit,
						 note.acc) % 40).toString()
			else
				ns = abc2svg.pab40(note.pit, note.acc).toString()
		}
	}

	notes = maps[a[0]]
	if (!notes)
		maps[a[0]] = notes = {}
	map = notes[ns]
	if (!map)
		notes[ns] = map = []

	// try the optional 'print' and 'heads' parameters
	a.shift()
	a.shift()
	if (!a.length)
		return
	a = info_split(a.join(' '))
	i = 0
	if (a[0].indexOf('=') < 0) {
		if (a[0][0] != '*') {
			tmp = new scanBuf;		// print
			tmp.buffer = a[0];
			map[1] = parse_acc_pit(tmp)
		}
		if (!a[1])
			return
		i++
		if (a[1].indexOf('=') < 0) {
			map[0] = a[1].split(',')	// heads
			i++
		}
	}

	for (; i < a.length; i++) {
		switch (a[i]) {
		case "heads=":
			if (!a[++i]) {
				syntax(1, not_enough_p)
				break
			}
			map[0] = a[i].split(',')
			break
		case "print=":
		case "play=":
			if (!a[++i]) {
				syntax(1, not_enough_p)
				break
			}
			tmp = new scanBuf;
			tmp.buffer = a[i];
			note = parse_acc_pit(tmp)
			if (a[i - 1][1] == 'r')
				map[1] = note
			else
				map[3] = note
			break
		case "color=":
			if (!a[++i]) {
				syntax(1, not_enough_p)
				break
			}
			map[2] = a[i]
			break
		}
	}
}

// set the transposition in the previous or first key signature
function set_transp() {
    var	s, transp, sndtran

	if (curvoice.ckey.k_bagpipe || curvoice.ckey.k_drum)
		return

	if (cfmt.transp && curvoice.transp)	// if %%transpose and score=
		syntax(0, "Mix of old and new transposition syntaxes");


	if (cfmt.transp != undefined
	 || curvoice.transp != undefined
	 || curvoice.shift != undefined)
		transp = (cfmt.transp || 0) +	 // %%transpose
			(curvoice.transp || 0) + // score= / sound= / instrument=
			(curvoice.shift || 0)	 // shift=
	if (curvoice.sndtran != undefined
	 || curvoice.sndsh != undefined)
		sndtran = (curvoice.sndtran || 0) +
			(curvoice.sndsh || 0)
	if (transp == undefined) {
		if (sndtran == undefined)
			return
	} else {
		curvoice.vtransp = transp
	}

	if (is_voice_sig()) {			// if no symbol yet
		curvoice.key = s = clone(curvoice.okey)
	} else {
		s = curvoice.last_sym
		while (1) {	// set the transposition in the previous K:
			if (s.type == C.KEY)
				break
			s = s.prev
			if (!s) {
				s = curvoice.ckey
				break
			}
		}
	}
	if (transp != undefined)
		s.k_transp = transp
	if (sndtran != undefined)
		s.k_sndtran = sndtran
	curvoice.ckey = clone(s)
	if (curvoice.key.k_none)
		s.k_sf = 0
}

/* transpose a note / chord */
function note_transp(s, sk, note) {
    var	ak, an, d, b40,
	n = note.pit,
	a = note.acc

	if (!a && sk.k_a_acc)			// if accidental list
		a = sk.k_map[(n + 19) % 7]	// invisible accidental

	b40 = abc2svg.pab40(n, a) + sk.k_transp	// base-40 transposition

	note.pit = abc2svg.b40p(b40)		// new pitch

	if (!a) {				// if no old accidental
		if (!sk.k_a_acc			// if no accidental list
		 && !sk.k_none)			// and normal key
			return			// same accidental (in the key)
	}

	an = abc2svg.b40a(b40)			// new accidental
	if (a) {
		if (sk.k_a_acc) {		// if accidental list
			ak = sk.k_map[(note.pit + 19) % 7]
			if (ak == an)
				an = 0		// accidental in the key
		}
		if (!an)
			an = 3
	} else if (sk.k_none) {			// if no key
		if (acc_same_pitch(s, note.pit)) // and accidental from previous notes
			return			// no change
	} else if (sk.k_a_acc) {		// if accidental list
		if (acc_same_pitch(s, note.pit)) // and accidental from previous notes
			return			// no change
		ak = sk.k_map[(note.pit + 19) % 7]
		if (ak)
			an = 3		// natural
	} else {
		return			// same accidental (in the key)
	}
	note.acc = an
}

// adjust the pitches according to the transposition(s)
function pit_adj() {
    var	i, p_v, s, sk, g,
	nv = voice_tb.length

	// map a note
	// The 'map' in the note is an array of
	//	[0] array of heads (glyph names)
	//	[1] print (note)
	//	[2] color
	//	[3] play (note)
	function note_map(note) {
	    var nn,
		map = note.map

		if (!map)
			return
		if (map[1]) {			// if print map
			note.pit = map[1].pit
			note.acc = map[1].acc
		}
		if (map[2])			// if color
			note.color = map[2]
		nn = map[3]
		if (nn)				// if play map
			note.midi = pit2mid(nn.pit + 19, nn.acc)
	} // note_map()

	while (--nv >= 0) {
		p_v = voice_tb[nv]
		if (p_v.vtransp == undefined)
			continue	// no transposition in this voice
		if (p_v.key.k_transp) {
			sk = p_v.key
			key_transp(sk)
		} else {
			sk = null
		}
		s = p_v.sym
		while (s) {

			// search a transposing key signature
			if (!sk) {
				for (; s; s = s.next) {
					if (s.type == C.KEY
					 && s.k_transp)
						break
				}
			}

			// transpose
			for (; s; s = s.next) {
				switch (s.type) {
				case C.GRACE:
					for (g = s.extra; g; g = g.next) {
						for (i = 0; i <= g.nhd; i++)
							note_transp(g, sk, g.notes[i])
					}
					continue
				case C.NOTE:
					for (i = 0; i <= s.nhd; i++)
						note_transp(s, sk, s.notes[i])
					continue
				case C.KEY:
					if (sk)
						s.k_sf = sk.k_sf
					key_transp(s)
					if (!s.k_transp) // end of transposition
						break
					sk = s
				default:
					continue
				}
				break
			}
			sk = null
		}
	}

	nv = voice_tb.length
	while (--nv >= 0) {
		p_v = voice_tb[nv]
		if (p_v.map == undefined)
			continue		// no map in this voice
		for (s = p_v.sym; s; s = s.next) {
			switch (s.type) {
			case C.GRACE:
				for (g = s.extra; g; g = g.next) {
					for (i = 0; i <= g.nhd; i++)
						note_map(g.notes[i])
				}
				break
			case C.NOTE:
				for (i = 0; i <= s.nhd; i++)
					note_map(s.notes[i])
				break
			}
		}
	}
} // pit_adj()

// get a abcm2ps/abcMIDI compatible transposition value as a base-40 interval
// The value may be
// - [+|-]<number of semitones>[s|f]
// - <note1>[<note2>]  % <note2> default is 'c'
function get_transp(param) {
	if (param[0] == '0')
		return 0
	if ("123456789-+".indexOf(param[0]) >= 0) {	// by semi-tone
	    var	val = parseInt(param)
		if (isNaN(val) || val < -36 || val > 36) {
//fixme: no source reference...
			syntax(1, errs.bad_transp)
			return
		}
		val += 36
		return (((val / 12) | 0) - 3) * 40 +
			(param.slice(-1) == 'b' ?
					abc2svg.ifb40 :
					abc2svg.isb40)[val % 12]
	}
	// return undefined
} // get_transp()

/* -- process a pseudo-comment (%% or I:) -- */
// (possible hook)
Abc.prototype.do_pscom = function(text) {
    var	h1, val, s, cmd, param, n, k, b

	cmd = text.match(/(\w|-)+/)
	if (!cmd)
		return
	cmd = cmd[0];

	// ignore the command if the voice is ignored,
	// but not if %%score/%%staves!
	if (curvoice && curvoice.ignore) {
		switch (cmd) {
		case "staves":
		case "score":
			break
		default:
			return
		}
	}

	param = text.replace(cmd, '').trim()

	if (param.slice(-5) == ' lock') {
		fmt_lock[cmd] = true;
		param = param.slice(0, -5).trim()
	} else if (fmt_lock[cmd]) {
		return
	}

	switch (cmd) {
	case "center":
		if (parse.state >= 2) {
			s = new_block("text");
			s.text = param
			s.opt = 'c'
			return
		}
		write_text(param, 'c')
		return
	case "clef":
		if (parse.state >= 2) {
			if (parse.state == 2)
				goto_tune();
			s = new_clef(param)
			if (s)
				get_clef(s)
		}
		return
	case "deco":
		deco_add(param)
		return
	case "linebreak":
		set_linebreak(param)
		return
	case "map":
		get_map(param)
		return
	case "maxsysstaffsep":
		if (parse.state == 3) {
			val = get_unit(param)
			if (isNaN(val)) {
				syntax(1, errs.bad_val, "%%maxsysstaffsep")
				return
			}
			par_sy.voices[curvoice.v].maxsep = val
			return
		}
		break
	case "multicol":
		if (parse.state >= 2) {
			if (parse.state == 2)
				goto_tune()
			curvoice = voice_tb[0]
			s = new_block("mc_" + param)
			break
		}
		switch (param) {
		case "start":
			multicol = {
				maxy: 0,
				lmarg: cfmt.leftmargin,
				rmarg: cfmt.rightmargin
			}
			break
		case "new":
			if (!multicol) {
				syntax(1, "%%multicol new without start")
				break
			}
			if (posy > multicol.maxy)
				multicol.maxy = posy;
			cfmt.leftmargin = multicol.lmarg;
			cfmt.rightmargin = multicol.rmarg;
			img.chg = true;
			set_page();
			posy = 0
			break
		case "end":
			if (!multicol) {
				syntax(1, "%%multicol end without start")
				break
			}
			if (posy < multicol.maxy)
				posy = multicol.maxy;
			cfmt.leftmargin = multicol.lmarg;
			cfmt.rightmargin = multicol.rmarg;
			multicol = undefined;
			blk_flush();
			img.chg = true;
			set_page()
			break
		default:
			syntax(1, "Unknown keyword '$1' in %%multicol", param)
			break
		}
		return
	case "ottava":
		if (parse.state != 3) {
			if (parse.state != 2)
				return
			goto_tune()
		}
		n = parseInt(param)
		if (isNaN(n) || n < -2 || n > 2) {
			syntax(1, errs.bad_val, "%%ottava")
			return
		}
		glovar.ottava = true;
		parse.ottava.push(n)
		return
	case "repbra":
		if (parse.state >= 2) {
			if (parse.state == 2)
				goto_tune();
			curvoice.norepbra = !get_bool(param)
		}
		return
	case "repeat":
		if (parse.state != 3)
			return
		if (!curvoice.last_sym) {
			syntax(1, "%%repeat cannot start a tune")
			return
		}
		if (!param.length) {
			n = 1;
			k = 1
		} else {
			b = param.split(/\s+/);
			n = parseInt(b[0]);
			k = parseInt(b[1])
			if (isNaN(n) || n < 1
			 || (curvoice.last_sym.type == C.BAR
			  && n > 2)) {
				syntax(1, "Incorrect 1st value in %%repeat")
				return
			}
			if (isNaN(k)) {
				k = 1
			} else {
				if (k < 1) {
					syntax(1, "Incorrect 2nd value in %%repeat")
					return
				}
			}
		}
		parse.repeat_n = curvoice.last_sym.type == C.BAR ? n : -n;
		parse.repeat_k = k
		return
	case "sep":
		var	h2, len, values, lwidth;

		set_page();
		lwidth = img.width - img.lm - img.rm;
		h1 = h2 = len = 0
		if (param) {
			values = param.split(/\s+/);
			h1 = get_unit(values[0])
			if (values[1]) {
				h2 = get_unit(values[1])
				if (values[2])
					len = get_unit(values[2])
			}
			if (isNaN(h1) || isNaN(h2) || isNaN(len)) {
				syntax(1, errs.bad_val, "%%sep")
				return
			}
		}
		if (h1 < 1)
			h1 = 14
		if (h2 < 1)
			h2 = h1
		if (len < 1)
			len = 90
		if (parse.state >= 2) {
			s = new_block(cmd);
			s.x = (lwidth - len) / 2 / cfmt.scale;
			s.l = len / cfmt.scale;
			s.sk1 = h1;
			s.sk2 = h2
			return
		}
		vskip(h1);
		output += '<path class="stroke"\n\td="M';
		out_sxsy((lwidth - len) / 2 / cfmt.scale, ' ', 0);
		output += 'h' + (len / cfmt.scale).toFixed(1) + '"/>\n';
		vskip(h2);
		blk_flush()
		return
	case "setbarnb":
		val = parseInt(param)
		if (isNaN(val) || val < 1) {
			syntax(1, "Bad %%setbarnb value")
			break
		}
		if (parse.state == 2)
			goto_tune()
		glovar.new_nbar = val
		return
	case "staff":
		if (parse.state != 3) {
			if (parse.state != 2)
				return
			goto_tune()
		}
		val = parseInt(param)
		if (isNaN(val)) {
			syntax(1, "Bad %%staff value '$1'", param)
			return
		}
		var st
		if (param[0] == '+' || param[0] == '-')
			st = curvoice.cst + val
		else
			st = val - 1
		if (st < 0 || st > nstaff) {
			syntax(1, "Bad %%staff number $1 (cur $2, max $3)",
					st, curvoice.cst, nstaff)
			return
		}
		delete curvoice.floating;
		curvoice.cst = st
		return
	case "staffbreak":
		if (parse.state != 3) {
			if (parse.state != 2)
				return
			goto_tune()
		}
		s = {
			type: C.STBRK,
			dur:0
		}
		if (param.slice(-1) == 'f') {
			s.stbrk_forced = true
			param = param.replace(/\sf$/, '')
		}
		if (param) {
			val = get_unit(param)
			if (isNaN(val)) {
				syntax(1, errs.bad_val, "%%staffbreak")
				return
			}
			s.xmx = val
		} else {
			s.xmx = 14
		}
		sym_link(s)
		return
	case "stafflines":
	case "staffscale":
	case "staffnonote":
		set_v_param(cmd, param)
		return
	case "staves":
	case "score":
		if (parse.state == 0)
			return
		if (parse.scores && parse.scores.length > 0) {
			text = parse.scores.shift();
			cmd = text.match(/([^\s]+)\s*(.*)/);
			get_staves(cmd[1], cmd[2])
		} else {
			get_staves(cmd, param)
		}
		return
	case "sysstaffsep":
//--fixme: may be global
		if (parse.state == 3) {
			val = get_unit(param)
			if (isNaN(val)) {
				syntax(1, errs.bad_val, "%%sysstaffsep")
				return
			}
			par_sy.voices[curvoice.v].sep = val
			return
		}
		break
	case "text":
		if (parse.state >= 2) {
			s = new_block(cmd);
			s.text = param
			s.opt = cfmt.textoption
			return
		}
		write_text(param, cfmt.textoption)
		return
	case "transpose":		// (abcm2ps compatibility)
		if (cfmt.sound)
			return
		val = get_transp(param)
		switch (parse.state) {
		case 0:
			cfmt.transp = 0
			// fall thru
		case 1:
		case 2:
			if (val == undefined)
				syntax(1, errs.bad_transp)
			else
				cfmt.transp = (cfmt.transp || 0) + val
			return
		}
		if (val == undefined) {		// accept note interval
			val = get_interval(param)
			if (val == undefined) {
				syntax(1, errs.bad_transp)
				return
			}
		}
		for (s = curvoice.last_sym; s; s = s.prev) {
			switch (s.type) {
			case C.NOTE:		// insert a key
				s = clone(curvoice.okey);
				s.k_old_sf = curvoice.ckey.k_sf;
				sym_link(s)
				break
			case C.KEY:
				break
			default:
				continue
			}
			break
		}
		curvoice.transp = val
		return
	case "tune":
//fixme: to do
		return
	case "user":
		set_user(param)
		return
	case "voicecolor":
		if (parse.state != 3) {
			if (parse.state != 2)
				return
			goto_tune()
		}
		curvoice.color = param
		return
	case "vskip":
		val = get_unit(param)
		if (isNaN(val)) {
			syntax(1, errs.bad_val, "%%vskip")
			return
		}
		if (val < 0) {
			syntax(1, "%%vskip cannot be negative")
			return
		}
		if (parse.state >= 2) {
			s = new_block(cmd);
			s.sk = val
			return
		}
		vskip(val);
		return
	case "newpage":
	case "leftmargin":
	case "rightmargin":
	case "pagescale":
	case "pagewidth":
	case "printmargin":
	case "scale":
	case "staffwidth":
		if (parse.state >= 2) {
			s = new_block(cmd);
			s.param = param
			return
		}
		if (cmd == "newpage") {
			blk_flush()
			blkdiv = 2	// start the next SVG in a new page
			return
		}
		break
	}
	self.set_format(cmd, param)
}

// treat the %%beginxxx / %%endxxx sequences
// (possible hook)
Abc.prototype.do_begin_end = function(type,
			opt,
			text) {
	var i, j, action, s

	switch (type) {
	case "js":
		js_inject(text)
		break
	case "ml":
		if (parse.state >= 2) {
			s = new_block(type);
			s.text = text
		} else {
			blk_flush()
			if (user.img_out)
				user.img_out(text)
		}
		break
	case "svg":
		j = 0
		while (1) {
			i = text.indexOf('<style', j)
			if (i < 0)
				break
			i = text.indexOf('>', i)
			j = text.indexOf('</style>', i)
			if (j < 0) {
				syntax(1, "No </style> in %%beginsvg sequence")
				break
			}
			style += text.slice(i + 1, j).replace(/\s+$/, '')
		}
		j = 0
		while (1) {
			i = text.indexOf('<defs>\n', j)
			if (i < 0)
				break
			j = text.indexOf('</defs>', i)
			if (j < 0) {
				syntax(1, "No </defs> in %%beginsvg sequence")
				break
			}
			defs_add(text.slice(i + 6, j))
		}
		break
	case "text":
		action = get_textopt(opt);
		if (!action)
			action = cfmt.textoption
		if (text.indexOf('\\') >= 0)	// convert the escape sequences
			text = cnv_escape(text)

		if (parse.state >= 2) {
			s = new_block(type);
			s.text = text
			s.opt = action
			break
		}
		write_text(text, action)
		break
	}
}

/* -- generate a piece of tune -- */
function generate(in_mc) {
    var s, v, p_voice;

	if (parse.tp) {
		syntax(1, "No end of tuplet")
		s = parse.tps
		if (s)
			delete s.tp
		delete parse.tp
	}

	if (vover) {
		syntax(1, "No end of voice overlay");
		get_vover(vover.bar ? '|' : ')')
	}

	if (!voice_tb.length)
		return
	voice_adj();
	dupl_voice();
	sort_all()			/* define the time / vertical sequences */
	if (!tsfirst)
		return
	self.set_bar_num()
	pit_adj()

	if (info.P)
		tsfirst.parts = info.P	// for play

	// give the parser result to the application
	if (user.get_abcmodel)
		user.get_abcmodel(tsfirst, voice_tb, abc2svg.sym_name, info)

	if (user.img_out)		// if SVG generation
		self.output_music()

	if (tsfirst)		// if non void, keep tune data for upper layers
		tunes.push([tsfirst, voice_tb, info])

	// if inside multicol, reset the parser
	if (!in_mc)
		return
	voice_tb = Object.create(voice_tb)
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v];
		p_voice.time = 0;
		p_voice.sym = p_voice.last_sym = null;
//		p_voice.st = cur_sy.voices[v].st;
//		p_voice.second = cur_sy.voices[v].second;
//		p_voice.clef.time = 0;
		delete p_voice.have_ly;
		p_voice.sls = [];
		p_voice.hy_st = 0;
		delete p_voice.bar_start
	}
	staves_found = 0			// (for compress/dup the voices)
}

// transpose a key
//fixme: transpose of the accidental list is not done
function key_transp(sk) {
	if (sk.k_a_acc || sk.k_none)		// same displayed key
		return
    var	d,
	k_b40 = sk.k_b40,
	n_b40 = (k_b40 + 200 + sk.k_transp) % 40

	d = abc2svg.b40k[n_b40] - n_b40
	if (d) {
		if (sk.k_transp > 0)
			sk.k_transp += d
		else
			sk.k_transp -= d
		n_b40 += d
	}
	sk.k_b40 = n_b40

   var sf = abc2svg.b40sf[n_b40]
	sk.k_old_sf = sk.k_sf
	sk.k_sf = sf
	sk.k_map = abc2svg.keys[sf + 7]	// map of the notes with accidentals
}

/*
 * for transpose purpose, check if a pitch is already in the measure or
 * if it is tied from a previous note, and return the associated accidental
 */
function acc_same_pitch(s, pit) {
    var	i,
	time = s.time

	for (s = s.prev; s; s = s.prev) {
		switch (s.type) {
		case C.BAR:
			if (s.time < time)
				return //undefined // no same pitch
			while (1) {
				s = s.prev
				if (!s)
					return //undefined
				if (s.type == C.NOTE) {
					if (s.time + s.dur == time)
						break
					return //undefined
				}
				if (s.time < time)
					return //undefined
			}
			for (i = 0; i <= s.nhd; i++) {
				if (s.notes[i].pit == pit
				 && s.notes[i].tie_ty)
					return s.notes[i].acc
			}
			return //undefined
		case C.NOTE:
			for (i = 0; i <= s.nhd; i++) {
				if (s.notes[i].pit == pit)
					return s.notes[i].acc
			}
			break
		}
	}
	return //undefined
}

/* -- get staves definition (%%staves / %%score) -- */
function get_staves(cmd, parm) {
	var	s, p_voice, p_voice2, i, flags, v, vid,
		st, range,
		a_vf = parse_staves(parm) // array of [vid, flags]

	if (!a_vf)
		return

	if (voice_tb.length) {
		voice_adj(true);
		dupl_voice()
	}

	/* create a new staff system */
	var	maxtime = 0,
		no_sym = true

	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (p_voice.time > maxtime)
			maxtime = p_voice.time
		if (p_voice.sym)
			no_sym = false
	}
	if (no_sym				/* if first %%staves */
	 || (maxtime == 0 && staves_found < 0)) {
		par_sy.staves = []
		par_sy.voices = []
	} else {

		/*
		 * create a new staff system and
		 * link the 'staves' symbol in a voice which is seen from
		 * the previous system - see sort_all
		 */
		for (v = 0; v < par_sy.voices.length; v++) {
			if (par_sy.voices[v]) {
				curvoice = voice_tb[v]
				break
			}
		}
		curvoice.time = maxtime;
		s = {
			type: C.STAVES,
			dur: 0
		}

		sym_link(s);		// link the staves in this voice
		par_sy.nstaff = nstaff;
		new_syst();
		s.sy = par_sy
	}

	staves_found = maxtime

	/* initialize the (old) voices */
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		delete p_voice.second
		delete p_voice.ignore
		delete p_voice.floating
	}
	range = 0
	for (i = 0; i < a_vf.length; i++) {
		vid = a_vf[i][0];
		p_voice = new_voice(vid);
		p_voice.time = maxtime;
		v = p_voice.v
		if (i == 0)
			par_sy.top_voice = p_voice.v

		// if the voice is already here, clone it
		if (par_sy.voices[v]) {
			p_voice2 = clone(p_voice);
//			p_voice2.id += "_c"		// for tests
			par_sy.voices[voice_tb.length] = clone(par_sy.voices[v]);
			v = voice_tb.length;
			p_voice2.v = v;
			p_voice2.sym = p_voice2.last_sym = null;
			p_voice2.time = maxtime;
			voice_tb.push(p_voice2)
			delete p_voice2.clone
			while (p_voice.clone)
				p_voice = p_voice.clone;
			p_voice.clone = p_voice2;
			p_voice = p_voice2
		} else {
			par_sy.voices[v] = {}
		}
		a_vf[i][0] = p_voice;
		par_sy.voices[v].range = range++
	}

	/* change the behavior from %%staves to %%score */
	if (cmd[1] == 't') {				/* if %%staves */
		for (i = 0; i < a_vf.length; i++) {
			flags = a_vf[i][1]
			if (!(flags & (OPEN_BRACE | OPEN_BRACE2)))
				continue
			if ((flags & (OPEN_BRACE | CLOSE_BRACE))
					== (OPEN_BRACE | CLOSE_BRACE)
			 || (flags & (OPEN_BRACE2 | CLOSE_BRACE2))
					== (OPEN_BRACE2 | CLOSE_BRACE2))
				continue
			if (a_vf[i + 1][1] != 0)
				continue
			if ((flags & OPEN_PARENTH)
			 || (a_vf[i + 2][1] & OPEN_PARENTH))
				continue

			/* {a b c} -> {a *b c} */
			if (a_vf[i + 2][1] & (CLOSE_BRACE | CLOSE_BRACE2)) {
				a_vf[i + 1][1] |= FL_VOICE

			/* {a b c d} -> {(a b) (c d)} */
			} else if (a_vf[i + 2][1] == 0
				&& (a_vf[i + 3][1]
					& (CLOSE_BRACE | CLOSE_BRACE2))) {
				a_vf[i][1] |= OPEN_PARENTH;
				a_vf[i + 1][1] |= CLOSE_PARENTH;
				a_vf[i + 2][1] |= OPEN_PARENTH;
				a_vf[i + 3][1] |= CLOSE_PARENTH
			}
		}
	}

	/* set the staff system */
	st = -1
	for (i = 0; i < a_vf.length; i++) {
		flags = a_vf[i][1]
		if ((flags & (OPEN_PARENTH | CLOSE_PARENTH))
				== (OPEN_PARENTH | CLOSE_PARENTH)) {
			flags &= ~(OPEN_PARENTH | CLOSE_PARENTH);
			a_vf[i][1] = flags
		}
		p_voice = a_vf[i][0]
		if (flags & FL_VOICE) {
			p_voice.floating = true;
			p_voice.second = true
		} else {
			st++;
			if (!par_sy.staves[st]) {
				par_sy.staves[st] = {
					stafflines: '|||||',
					staffscale: 1
				}
			}
			par_sy.staves[st].flags = 0
		}
		v = p_voice.v;
		p_voice.st = p_voice.cst =
				par_sy.voices[v].st = st;
		par_sy.staves[st].flags |= flags
		if (flags & OPEN_PARENTH) {
			p_voice2 = p_voice
			while (i < a_vf.length - 1) {
				p_voice = a_vf[++i][0];
				v = p_voice.v
				if (a_vf[i][1] & MASTER_VOICE) {
					p_voice2.second = true
					p_voice2 = p_voice
				} else {
					p_voice.second = true;
				}
				p_voice.st = p_voice.cst
						= par_sy.voices[v].st
						= st
				if (a_vf[i][1] & CLOSE_PARENTH)
					break
			}
			par_sy.staves[st].flags |= a_vf[i][1]
		}
	}
	if (st < 0)
		st = 0
	par_sy.nstaff = nstaff = st

	/* change the behaviour of '|' in %%score */
	if (cmd[1] == 'c') {				/* if %%score */
		for (st = 0; st < nstaff; st++)
			par_sy.staves[st].flags ^= STOP_BAR
	}

	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (!par_sy.voices[v])
			continue
		par_sy.voices[v].second = p_voice.second;
		st = p_voice.st
		if (st > 0 && !p_voice.norepbra
		 && !(par_sy.staves[st - 1].flags & STOP_BAR))
			p_voice.norepbra = true
	}

	curvoice = parse.state >= 2 ? voice_tb[par_sy.top_voice] : null
}

	// get a voice or create a clone of the current voice
	function clone_voice(id) {
		var v, p_voice

		for (v = 0; v < voice_tb.length; v++) {
			p_voice = voice_tb[v]
			if (p_voice.id == id)
				return p_voice		// found
		}
		p_voice = clone(curvoice);
		p_voice.v = voice_tb.length;
		p_voice.id = id;
		p_voice.sym = p_voice.last_sym = null;

		p_voice.key = clone(curvoice.key)

		delete p_voice.nm
		delete p_voice.snm
		delete p_voice.new_name
		delete p_voice.lyric_restart
		delete p_voice.lyric_cont
		delete p_voice.ly_a_h;
		delete p_voice.sym_restart
		delete p_voice.sym_cont
		delete p_voice.have_ly
		delete p_voice.tie_s

		voice_tb.push(p_voice)
		return p_voice
	} // clone_voice()

/* -- get a voice overlay -- */
function get_vover(type) {
    var	p_voice2, p_voice3, range, s, time, v, v2, v3,
	line = parse.line

	/* treat the end of overlay */
	if (type == '|'
	 || type == ')')  {
		if (!curvoice.last_note) {
			syntax(1, errs.nonote_vo)
			return
		}
		curvoice.last_note.beam_end = true
		if (!vover) {
			syntax(1, "Erroneous end of voice overlay")
			return
		}
		if (curvoice.time != vover.p_voice.time) {
			syntax(1, "Wrong duration in voice overlay");
			if (curvoice.time > vover.p_voice.time)
				vover.p_voice.time = curvoice.time
		}
		curvoice = vover.p_voice;
		vover = null
		return
	}

	/* treat the full overlay start */
	if (type == '(') {
		if (vover) {
			syntax(1, "Voice overlay already started")
			return
		}
		vover = {
			p_voice: curvoice,
			time: curvoice.time
		}
		return
	}

	/* (here is treated a new overlay - '&') */
	/* create the extra voice if not done yet */
	if (!curvoice.last_note) {
		syntax(1, errs.nonote_vo)
		return
	}
	curvoice.last_note.beam_end = true;
	p_voice2 = curvoice.voice_down
	if (!p_voice2) {
		p_voice2 = clone_voice(curvoice.id + 'o');
		curvoice.voice_down = p_voice2;
		p_voice2.time = 0;
		p_voice2.second = true;
		v2 = p_voice2.v;
		par_sy.voices[v2] = {
			st: curvoice.st,
			second: true
		}
		var f_clone = curvoice.clone != undefined ? 1 : 0;
		range = par_sy.voices[curvoice.v].range
		for (v = 0; v < par_sy.voices.length; v++) {
			if (par_sy.voices[v]
			 && par_sy.voices[v].range > range)
				par_sy.voices[v].range += f_clone + 1
		}
		par_sy.voices[v2].range = range + 1
		if (f_clone) {
			p_voice3 = clone_voice(p_voice2.id + 'c');
			p_voice3.second = true;
			v3 = p_voice3.v;
			par_sy.voices[v3] = {
				second: true,
				range: range + 2
			}
			p_voice2.clone = p_voice3
		}
	}
	p_voice2.ulen = curvoice.ulen
	p_voice2.dur_fact = curvoice.dur_fact

	if (!vover) {				/* first '&' in a measure */
		vover = {
			bar: true,
			p_voice: curvoice
		}
		time = p_voice2.time
		for (s = curvoice.last_sym; /*s*/; s = s.prev) {
			if (s.type == C.BAR
			 || s.time <= time)	/* (if start of tune) */
				break
		}
		vover.time = s.time
	} else {
		if (curvoice != vover.p_voice
		 && curvoice.time != vover.p_voice.time) {
			syntax(1, "Wrong duration in voice overlay")
			if (curvoice.time > vover.p_voice.time)
				vover.p_voice.time = curvoice.time
		}
	}
	p_voice2.time = vover.time;
	curvoice = p_voice2

	// add a bar at start of the measure overlay
	// (needed for sort_all() in case of spaces - 'y')
	if (vover.bar) {
		sym_link({
			type: C.BAR,
			bar_type: type,
			dur: 0,
			multi: 0
		})
	}
}

// check if a clef, key or time signature may go at start of the current voice
function is_voice_sig() {
	var s

//	if (!curvoice.sym)
//		return true	// new voice (may appear in the middle of a tune)
	if (curvoice.time != 0)
		return false
	for (s = curvoice.last_sym; s; s = s.prev)
		if (w_tb[s.type] != 0)
			return false
	return true
}

// treat a clef found in the tune body
function get_clef(s) {
	if (is_voice_sig()) {
		curvoice.clef = s
		return
	}

	// clef change
	sym_link(s);
	s.clef_small = true

	// move the clef before a (not right repeat) bar
    var	s2 = s.prev
	if (s2 && s2.type == C.BAR
	 && s2.bar_type[0] != ':') {
		s.next = s2
		s.prev = s2.prev
		if (s.prev)
			s.prev.next = s
		s2.prev = s
		s2.next = null
		curvoice.last_sym = s2
		if (s.soln) {
			delete s.soln
			curvoice.eoln = true
		}
	}
}

// treat K: (kp = key signature + parameters)
function get_key(parm) {
	var	v, p_voice, s, transp, sndtran,
//		[s_key, a] = new_key(parm)	// KO with nodejs
		a = new_key(parm),
		s_key = a[0];

	a = a[1]

	switch (parse.state) {
	case 1:				// in tune header (first K:)
		if (s_key.k_sf == undefined && !s_key.k_a_acc) { // empty K:
			s_key.k_sf = 0;
			s_key.k_none = true
			s_key.k_map = abc2svg.keys[7]
		}
		for (v = 0; v < voice_tb.length; v++) {
			p_voice = voice_tb[v];
			p_voice.key = clone(s_key);
			p_voice.okey = clone(s_key);
			p_voice.ckey = clone(s_key)
		}
		parse.ckey = s_key
		if (a.length)
			memo_kv_parm('*', a)
		if (!glovar.ulen)
			glovar.ulen = C.BLEN / 8;
		parse.state = 2;		// in tune header after K:
		return
	case 2:					// K: at start of tune body
		goto_tune(true)
		break
	}
	if (a.length)
		set_kv_parm(a)

	if (!curvoice.ckey.k_bagpipe && !curvoice.ckey.k_drum
	 && (cfmt.transp != undefined
	  || curvoice.transp != undefined
	  || curvoice.shift != undefined))
	    transp = (cfmt.transp || 0) +
		(curvoice.transp || 0) +
		(curvoice.shift || 0)
	if (curvoice.sndtran != undefined
	 || curvoice.sndsh != undefined)
		sndtran = (curvoice.sndtran || 0) +
			(curvoice.sndsh || 0)

	if (s_key.k_sf == undefined) {
		if (!s_key.k_a_acc
		 && transp == undefined) {
			if (sndtran == undefined)
				return		// not a key signature
			s_key.k_play = true	// play only
		}
		s_key.k_sf = curvoice.okey.k_sf
	}

	curvoice.okey = clone(s_key)
	if (transp != undefined) {
		curvoice.vtransp = transp;
		s_key.k_transp = transp
	}
	if (sndtran != undefined)
		s_key.k_sndtran = sndtran

	s_key.k_old_sf = curvoice.ckey.k_sf;	// memorize the key changes
	if (!s_key.k_b40)
		s_key.k_b40 = curvoice.ckey.k_b40

	curvoice.ckey = s_key

	if (is_voice_sig()) {
		curvoice.key = clone(s_key)
		if (s_key.k_none)
			curvoice.key.k_sf = 0
	} else {
		sym_link(s_key)			// (don't move the key)
	}
}

// get / create a new voice
function new_voice(id) {
	var	p_voice, v, p_v_sav,
		n = voice_tb.length

	// if first explicit voice and no music, replace the default V:1
	if (n == 1
	 && voice_tb[0].default) {
		delete voice_tb[0].default
		if (voice_tb[0].time == 0) {
			p_voice = voice_tb[0];
			p_voice.id = id
			if (cfmt.transp	// != undefined
			 && parse.state >= 2) {
				p_v_sav = curvoice;
				curvoice = p_voice;
				set_transp();
				curvoice = p_v_sav
			}
			return p_voice		// default voice
		}
	}
	for (v = 0; v < n; v++) {
		p_voice = voice_tb[v]
		if (p_voice.id == id)
			return p_voice		// old voice
	}

	p_voice = {
		v: v,
		id: id,
		time: 0,
		new: true,
		pos: {
			dyn: 0,
			gch: 0,
			gst: 0,
			orn: 0,
			stm: 0,
			voc: 0,
			vol: 0
		},
		scale: 1,
//		st: 0,
//		cst: 0,
		ulen: glovar.ulen,
		dur_fact: 1,
		key: clone(parse.ckey),		// key at start of tune (parse / gene)
		ckey: clone(parse.ckey),	// current key (parse / gene)
		okey: clone(parse.ckey),	// key without transposition (parse)
		meter: clone(glovar.meter),
		wmeasure: glovar.meter.wmeasure,
		clef: {
			type: C.CLEF,
			clef_auto: true,
			clef_type: "a",		// auto
			time: 0
		},
		acc: [],		// accidentals of the measure (parse)
		sls: [],		// slurs - used in parsing and in generation
		hy_st: 0
	}

	voice_tb.push(p_voice);

//	par_sy.voices[v] = {
//		range: -1
//	}

	return p_voice
}

// this function is called at program start and on end of tune
function init_tune() {
	nstaff = -1;
	voice_tb = [];
	curvoice = null;
	new_syst(true);
	staves_found = -1;
	gene = {}
	a_de = []			// remove old decorations
}

// treat V: with many voices
function do_cloning(vs) {
    var	i, eol,
	file = parse.file,
	start = parse.eol + 1,		// next line after V:
	bol = start

	// search the end of the music to be cloned
	while (1) {
		eol = file.indexOf('\n', bol)
		if (eol < 0) {
			eol = 0
			break
		}

		// stop on comment, or information field
		if (/%.*|\n.*|.:.|\[.:/.test(file.slice(eol + 1, eol + 4)))
			break
		bol = eol + 1
	}

	// insert the music sequence in each voice
	include++;
	tosvg(parse.fname, file, start, eol)	// first voice
	for (i = 0; i < vs.length; i++) {
		get_voice(vs[i]);
		tosvg(parse.fname, file, start, eol)
	}
	include--
}

// treat a 'V:' info
function get_voice(parm) {
    var	v, vs,
	a = info_split(parm),
	vid = a.shift()

	if (!vid)
		return				// empty V:

	if (vid.indexOf(',') > 0) {		// if many voices
		vs = vid.split(',');
		vid = vs.shift()
	}

	if (parse.state < 2) {
		if (a.length)
			memo_kv_parm(vid, a)
		if (vid != '*' && parse.state == 1)
			curvoice = new_voice(vid)
		return
	}

	if (vid == '*') {
		syntax(1, "Cannot have V:* in tune body")
		return
	}
	curvoice = new_voice(vid);
	set_kv_parm(a)
	if (parse.state == 2)			// if first voice
		goto_tune();
	set_transp();

	v = curvoice.v
	if (curvoice.new) {			// if new voice
		delete curvoice.new
		if (staves_found < 0) {		// if no %%score/%%staves
			curvoice.st = curvoice.cst = ++nstaff;
			par_sy.nstaff = nstaff;
			par_sy.voices[v] = {
				st: nstaff,
				range: v
			}
			par_sy.staves[nstaff] = {
				stafflines: curvoice.stafflines || "|||||",
				staffscale: 1
			}
		}
	}

	if (!curvoice.filtered
	 && par_sy.voices[v]
	 && (parse.voice_opts
	  || parse.tune_v_opts)) {
		curvoice.filtered = true;
		voice_filter()
	}

	if (vs)
		do_cloning(vs)
}

// change state from 'tune header after K:' to 'in tune body'
// curvoice is defined when called from get_voice()
function goto_tune(is_K) {
	var	v, p_voice,
		s = {
			type: C.STAVES,
			dur: 0,
			sy: par_sy
		}

	set_page();
	write_heading();
	reset_gen();
	if (glovar.new_nbar) {
		gene.nbar = glovar.new_nbar	// measure numbering
		glovar.new_nbar = 0
	} else {
		gene.nbar = 1
	}

	parse.state = 3;			// in tune body

	// if no voice yet, create the default voice
	if (!voice_tb.length) {
		get_voice("1");
		curvoice.clef.istart = curvoice.key.istart;
		curvoice.clef.iend = curvoice.key.iend;
//		nstaff = 0;
		curvoice.default = true
	} else if (!curvoice) {
		curvoice = voice_tb[staves_found < 0 ? 0 : par_sy.top_voice]
	}

	if (!curvoice.init && !is_K) {
		set_kv_parm([])
		set_transp()
	}

	// update some voice parameters
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v];
		p_voice.ulen = glovar.ulen
		if (p_voice.ckey.k_bagpipe
		 && !p_voice.pos.stm) {
			p_voice.pos = clone(p_voice.pos);
			p_voice.pos.stm = C.SL_BELOW
		}
	}

	// initialize the voices when no %%staves/score	
	if (staves_found < 0) {
		nstaff = voice_tb.length - 1
		for (v = 0; v <= nstaff; v++) {
			p_voice = voice_tb[v];
			delete p_voice.new;		// old voice
			p_voice.st = p_voice.cst = v;
			par_sy.voices[v] = {
				st: v,
				range: v
			}
			par_sy.staves[v] = {
				stafflines: p_voice.stafflines || "|||||",
				staffscale: 1
			}
		}
		par_sy.nstaff = nstaff
	}

	// link the first %%score in the top voice
	p_voice = curvoice;
	curvoice = voice_tb[par_sy.top_voice];
	sym_link(s)
	curvoice = p_voice
}
