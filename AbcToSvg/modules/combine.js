// combine.js - module to add a combine chord line
//
// Copyright (C) 2018-2019 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%voicecombine" appears in a ABC source.
//
// Parameters
//	%%voicecombine n	'n' is the combine level

abc2svg.combine = {

    // function called at start of the generation when multi-voices
    comb_v: function() {
    var	C = abc2svg.C,
	delsym = []		// deleted symbols for slurs and ties

    // check if voice combine may occur
    function may_combine(s) {
    var	nhd2,
	s2 = s.ts_next

	if (!s2 || (s2.type != C.NOTE && s2.type != C.REST))
		return false
	if (s2.v == s.v
	 || s2.st != s.st
	 || s2.time != s.time
	 || s2.dur != s.dur)
		return false
	if (s.combine <= 0
	 && s2.type != s.type)
		return false
//	if (s2.a_dd) { //fixme: should check the double decorations
//		return false
//	}
	if (s.a_gch && s2.a_gch)
		return false
	if (s.type == C.REST) {
		if (s.type == s2.type && s.invis && !s2.invis)
			return false
		return true
	}
	if (s2.a_ly)
		return false
	if (s2.beam_st != s.beam_st
	 || s2.beam_end != s.beam_end)
		return false;
	nhd2 = s2.nhd
	if (s.combine <= 1
	 && s.notes[0].pit <= s2.notes[nhd2].pit + 1)
		return false
	return true
    } // may_combine()

    // combine two notes
    function combine_notes(s, s2) {
    var	nhd, type, m;

	for (m = 0; m <= s2.nhd; m++)	// change the container of the notes
		s2.notes[m].s = s
	Array.prototype.push.apply(s.notes, s2.notes);
	s.nhd = nhd = s.notes.length - 1;
	s.notes.sort(abc2svg.pitcmp)	// sort the notes by pitch

	if (s.combine >= 3) {		// remove unison heads
		for (m = nhd; m > 0; m--) {
			if (s.notes[m].pit == s.notes[m - 1].pit
			 && s.notes[m].acc == s.notes[m - 1].acc)
				s.notes.splice(m, 1)
		}
		s.nhd = nhd = s.notes.length - 1
	}

	s.ymx = 3 * (s.notes[nhd].pit - 18) + 4;
	s.ymn = 3 * (s.notes[0].pit - 18) - 4;

	// force the tie directions
	type = s.notes[0].tie_ty
	if ((type & 0x07) == C.SL_AUTO)
		s.notes[0].tie_ty = C.SL_BELOW | (type & C.SL_DOTTED);
	type = s.notes[nhd].tie_ty
	if ((type & 0x07) == C.SL_AUTO)
		s.notes[nhd].tie_ty = C.SL_ABOVE | (type & C.SL_DOTTED)
} // combine_notes()

// combine 2 voices
function do_combine(s) {
	var s2, nhd, nhd2, type

	while (1) {
		nhd = s.nhd;
		s2 = s.ts_next;
		nhd2 = s2.nhd
		if (s.type != s2.type) {	// if note and rest
			if (s2.type != C.REST) {
				s2 = s;
				s = s2.ts_next
			}
		} else if (s.type == C.REST) {
			if (s.invis
			 && !s2.invis)
				delete s.invis
		} else {
			combine_notes.call(this, s, s2)
			if (s2.tie_s)
				s.tie_s = s2.tie_s
		}

		if (s2.sls) {
			if (s.sls)
				Array.prototype.push.apply(s.sls, s2.sls)
			else
				s.sls = s2.sls
		}
		if (s2.sl1)
			s.sl1 = true
		if (s2.a_gch)
			s.a_gch = s2.a_gch
		if (s2.a_dd) {
			if (!s.a_dd)
				s.a_dd = s2.a_dd
			else
				Array.prototype.push.apply(s.a_dd, s2.a_dd)
		}

		// memorize the deleted symbol: it may support slur or tie endings
		delsym.push({s: s2, r: s});

		this.unlksym(s2)			// remove the next symbol

		// there may be more voices
		if (s.in_tuplet || !may_combine.call(this, s))
			break
	}
} // do_combine()

    // replace tie endings
    function tie_repl(s) {
    var	s1 = s.tie_s,
	i = delsym.length

	while (--i >= 0) {
		if (delsym[i].s == s1) {
			s.tie_s = delsym[i].r
			break
		}
	}
    } // tie_repl()

	// code of comb_v()
	var s, s2, g, i, r

	for (s = this.get_tsfirst(); s; s = s.ts_next) {
		switch (s.type) {
		case C.REST:
			if (s.combine == undefined || s.combine < 0)
				continue
			if (may_combine.call(this, s))
				do_combine.call(this, s)
			continue
		default:
			continue
		case C.NOTE:
			if (s.combine == undefined || s.combine <= 0)
				continue
			break
		}

		if (!s.beam_st)
			continue
		if (s.beam_end) {
			if (may_combine.call(this, s))
				do_combine.call(this, s)
			continue
		}

		s2 = s
		while (1) {
			if (!may_combine.call(this, s2)) {
				s2 = null
				break
			}
//fixme: may have rests in beam
			if (s2.beam_end)
				break
			do {
				s2 = s2.next
			} while (s2.type != C.NOTE && s2.type != C.REST)
		}
		if (!s2)
			continue
		s2 = s
		while (1) {
			do_combine.call(this, s2)
//fixme: may have rests in beam
			if (s2.beam_end)
				break
			do {
				s2 = s2.next
			} while (s2.type != C.NOTE && s2.type != C.REST)
		}
	}

	// replace the tie endings
	for (s = this.get_tsfirst(); s; s = s.ts_next) {
		if (s.tie_s)
			tie_repl(s)
	}
    }, // comb_v()

    do_pscom: function(of, text) {
	if (text.slice(0, 13) == "voicecombine ")
		this.set_v_param("combine", text.split(/[ \t]/)[1])
	else
		of(text)
    },

    new_note: function(of, gr, tp) {
    var curvoice = this.get_curvoice()
    var s = of(gr, tp)
	if (s && s.notes && curvoice.combine != undefined)
		s.combine = curvoice.combine
	return s
    },

    set_stem_dir: function(of) {
	of();
	abc2svg.combine.comb_v.call(this)
    },

    // set the combine parameter in the current voice
    set_vp: function(of, a) {
    var	i,
	curvoice = this.get_curvoice()

	for (i = 0; i < a.length; i++) {
		if (a[i] == "combine=") {	// %%voicecombine
			curvoice.combine = a[i + 1]
			break
		}
	}
	of(a)
    },

    set_hooks: function(abc) {
	abc.do_pscom = abc2svg.combine.do_pscom.bind(abc, abc.do_pscom);
	abc.new_note = abc2svg.combine.new_note.bind(abc, abc.new_note);
	abc.set_stem_dir = abc2svg.combine.set_stem_dir.bind(abc, abc.set_stem_dir);
	abc.set_vp = abc2svg.combine.set_vp.bind(abc, abc.set_vp)
    }
} // combine

abc2svg.modules.hooks.push(abc2svg.combine.set_hooks);

// the module is loaded
abc2svg.modules.voicecombine.loaded = true
