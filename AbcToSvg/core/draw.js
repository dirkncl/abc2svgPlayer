// abc2svg - draw.js - draw functions
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

// constants
var	STEM_MIN	= 16,	/* min stem height under beams */
	STEM_MIN2	= 14,	/* ... for notes with two beams */
	STEM_MIN3	= 12,	/* ... for notes with three beams */
	STEM_MIN4	= 10,	/* ... for notes with four beams */
	STEM_CH_MIN	= 14,	/* min stem height for chords under beams */
	STEM_CH_MIN2	= 10,	/* ... for notes with two beams */
	STEM_CH_MIN3	= 9,	/* ... for notes with three beams */
	STEM_CH_MIN4	= 9,	/* ... for notes with four beams */
	BEAM_DEPTH	= 3.2,	/* width of a beam stroke */
	BEAM_OFFSET	= .25,	/* pos of flat beam relative to staff line */
	BEAM_SHIFT	= 5,	/* shift of second and third beams */
	BEAM_STUB	= 8,	/* length of stub for flag under beam */ 
	SLUR_SLOPE	= .5,	/* max slope of a slur */
	GSTEM		= 15,	/* grace note stem length */
	GSTEM_XOFF	= 2.3	/* x offset for grace note stem */

    var cache

/* -- compute the best vertical offset for the beams -- */
function b_pos(grace, stem, nflags, b) {
	var	top, bot, d1, d2,
		shift = !grace ? BEAM_SHIFT : 3.5,
		depth = !grace ? BEAM_DEPTH : 1.8

	/* -- up/down shift needed to get k*6 -- */
	function rnd6(y) {
		var iy = Math.round((y + 12) / 6) * 6 - 12
		return iy - y
	} // rnd6()

	if (stem > 0) {
		bot = b - (nflags - 1) * shift - depth
		if (bot > 26)
			return 0
		top = b
	} else {
		top = b + (nflags - 1) * shift + depth
		if (top < -2)
			return 0
		bot = b
	}

	d1 = rnd6(top - BEAM_OFFSET);
	d2 = rnd6(bot + BEAM_OFFSET)
	return d1 * d1 > d2 * d2 ? d2 : d1
}

/* duplicate a note for beaming continuation */
function sym_dup(s) {
    var	m, note

	s = clone(s)
	s.invis = true
	delete s.extra;
	delete s.text
	delete s.a_gch
	delete s.a_ly
	delete s.a_dd;
	s.notes = clone(s.notes)
	for (m = 0; m <= s.nhd; m++) {
		note = s.notes[m] = clone(s.notes[m])
		delete note.a_dcn
	}
	return s
}

/* -- calculate a beam -- */
/* (the staves may be defined or not) */
var min_tb = [
	[STEM_MIN, STEM_MIN,
		STEM_MIN2, STEM_MIN3, STEM_MIN4, STEM_MIN4],
	[STEM_CH_MIN, STEM_CH_MIN,
		STEM_CH_MIN2, STEM_CH_MIN3, STEM_CH_MIN4, STEM_CH_MIN4]
]

// (possible hook)
Abc.prototype.calculate_beam = function(bm, s1) {
    var	s, s2, g, notes, nflags, st, v, two_staves, two_dir,
		x, y, ys, a, b, stem_err, max_stem_err,
		p_min, p_max, s_closest,
		stem_xoff, scale,
		visible, dy

	if (!s1.beam_st) {	/* beam from previous music line */
		s = sym_dup(s1);
		lkvsym(s, s1);
		lktsym(s, s1);
		s.x -= 12
		if (s.x > s1.prev.x + 12)
			s.x = s1.prev.x + 12;
		s.beam_st = true
		delete s.beam_end;
		s.tmp = true
		delete s.sls;
		s1 = s
	}

	/* search last note in beam */
	notes = nflags = 0;	/* set x positions, count notes and flags */
	two_staves = two_dir = false;
	st = s1.st;
	v = s1.v;
	stem_xoff = s1.grace ? GSTEM_XOFF : 3.5
	for (s2 = s1;  ;s2 = s2.next) {
		if (s2.type == C.NOTE) {
			if (s2.nflags > nflags)
				nflags = s2.nflags;
			notes++
			if (s2.st != st)
				two_staves = true
			if (s2.stem != s1.stem)
				two_dir = true
			if (!visible && !s2.invis
			 && (!s2.stemless || s2.trem2))
				visible = true
			if (s2.beam_end)
				break
		}
		if (!s2.next) {		/* beam towards next music line */
			for (; ; s2 = s2.prev) {
				if (s2.type == C.NOTE)
					break
			}
			s = sym_dup(s2);
			s.next = s2.next
			if (s.next)
				s.next.prev = s;
			s2.next = s;
			s.prev = s2;
			s.ts_next = s2.ts_next
			if (s.ts_next)
				s.ts_next.ts_prev = s;
			s2.ts_next = s;
			s.ts_prev = s2
			delete s.beam_st;
			s.beam_end = true;
			s.tmp = true
			delete s.sls;
			s.x += 12
			if (s.x < realwidth - 12)
				s.x = realwidth - 12;
			s2 = s;
			notes++
			break
		}
	}

	// at least, must have a visible note with a stem
	if (!visible)
		return false;

	bm.s2 = s2			/* (don't display the flags) */

	if (staff_tb[st].y == 0) {	/* staves not defined */
		if (two_staves)
			return false
	} else {			/* staves defined */
//		if (!two_staves && !s1.grace) {
		if (!two_staves) {
			bm.s1 = s1;	/* beam already calculated */
			bm.a = (s1.ys - s2.ys) / (s1.xs - s2.xs);
			bm.b = s1.ys - s1.xs * bm.a + staff_tb[st].y;
			bm.nflags = nflags
			return true
		}
	}

	s_closest = s1;
	p_min = 100;
	p_max = 0
	for (s = s1; ; s = s.next) {
		if (s.type != C.NOTE)
			continue
		if ((scale = s.p_v.scale) == 1)
			scale = staff_tb[s.st].staffscale
		if (s.stem >= 0) {
			x = stem_xoff + s.notes[0].shhd
			if (s.notes[s.nhd].pit > p_max) {
				p_max = s.notes[s.nhd].pit;
				s_closest = s
			}
		} else {
			x = -stem_xoff + s.notes[s.nhd].shhd
			if (s.notes[0].pit < p_min) {
				p_min = s.notes[0].pit;
				s_closest = s
			}
		}
		s.xs = s.x + x * scale;
		if (s == s2)
			break
	}

	// have flat beams on grace notes when asked
	if (s.grace && cfmt.flatbeams)
		a = 0

	// if a note inside the beam is the closest to the beam, the beam is flat
	else if (!two_dir
	      && notes >= 3
	      && s_closest != s1 && s_closest != s2)
		a = 0

	y = s1.ys + staff_tb[st].y
	if (a == undefined)
		a = (s2.ys + staff_tb[s2.st].y - y) / (s2.xs - s1.xs)

	if (a != 0)
		a = cfmt.beamslope * a /
			(cfmt.beamslope + Math.abs(a)) // max steepness for beam

	// pivot around the middle of the beam
	b = (y + s2.ys + staff_tb[s2.st].y) / 2 - a * (s2.xs + s1.xs) / 2

/*fixme: have a look again*/
	/* have room for the symbols in the staff */
	max_stem_err = 0;		/* check stem lengths */
	s = s1
	if (two_dir) {				/* 2 directions */
/*fixme: more to do*/
		ys = ((s1.grace ? 3.5 : BEAM_SHIFT) * (nflags - 1) +
			BEAM_DEPTH) * .5
		if (s1.stem != s2.stem && s1.nflags < s2.nflags)
			b += ys * s2.stem
		else
			b += ys * s1.stem
	} else if (!s1.grace) {		/* normal notes */
		var beam_h = BEAM_DEPTH + BEAM_SHIFT * (nflags - 1)
//--fixme: added for abc2svg
		while (s.ts_prev
		    && s.ts_prev.type == C.NOTE
		    && s.ts_prev.time == s.time
		    && s.ts_prev.x > s1.xs)
			s = s.ts_prev

		for (; s && s.time <= s2.time; s = s.ts_next) {
			if (s.type != C.NOTE
			 || s.invis
			 || (s.st != st
			  && s.v != v)) {
				continue
			}
			x = s.v == v ? s.xs : s.x;
			ys = a * x + b - staff_tb[s.st].y
			if (s.v == v) {
				stem_err = min_tb[s.nhd == 0 ? 0 : 1][s.nflags]
				if (s.stem > 0) {
					if (s.notes[s.nhd].pit > 26) {
						stem_err -= 2
						if (s.notes[s.nhd].pit > 28)
							stem_err -= 2
					}
					stem_err -= ys - 3 * (s.notes[s.nhd].pit - 18)
				} else {
					if (s.notes[0].pit < 18) {
						stem_err -= 2
						if (s.notes[0].pit < 16)
							stem_err -= 2
					}
					stem_err -= 3 * (s.notes[0].pit - 18) - ys
				}
				stem_err += BEAM_DEPTH + BEAM_SHIFT * (s.nflags - 1)
			} else {
/*fixme: KO when two_staves*/
				if (s1.stem > 0) {
					if (s.stem > 0) {
/*fixme: KO when the voice numbers are inverted*/
						if (s.ymn > ys + 4
						 || s.ymx < ys - beam_h - 2)
							continue
						if (s.v > v)
							stem_err = s.ymx - ys
						else
							stem_err = s.ymn + 8 - ys
					} else {
						stem_err = s.ymx - ys
					}
				} else {
					if (s.stem < 0) {
						if (s.ymx < ys - 4
						 || s.ymn > ys - beam_h - 2)
							continue
						if (s.v < v)
							stem_err = ys - s.ymn
						else
							stem_err = ys - s.ymx + 8
					} else {
						stem_err = ys - s.ymn
					}
				}
				stem_err += 2 + beam_h
			}
			if (stem_err > max_stem_err)
				max_stem_err = stem_err
		}
	} else {				/* grace notes */
		for ( ; ; s = s.next) {
			ys = a * s.xs + b - staff_tb[s.st].y;
			stem_err = GSTEM - 2
			if (s.stem > 0)
				stem_err -= ys - (3 * (s.notes[s.nhd].pit - 18))
			else
				stem_err += ys - (3 * (s.notes[0].pit - 18));
			stem_err += 3 * (s.nflags - 1)
			if (stem_err > max_stem_err)
				max_stem_err = stem_err
			if (s == s2)
				break
		}
	}

	if (max_stem_err > 0)		/* shift beam if stems too short */
		b += s1.stem * max_stem_err

	/* have room for the gracenotes, bars and clefs */
/*fixme: test*/
    if (!two_staves && !two_dir)
	for (s = s1.next; ; s = s.next) {
		switch (s.type) {
		case C.REST:		/* cannot move rests in multi-voices */
			g = s.ts_next
			if (!g || g.st != st
			 || (g.type != C.NOTE && g.type != C.REST))
				break
//fixme:too much vertical shift if some space above the note
//fixme:this does not fix rest under beam in second voice (ts_prev)
			/*fall thru*/
		case C.BAR:
			if (s.invis)
				break
			/*fall thru*/
		case C.CLEF:
			y = a * s.x + b
			if (s1.stem > 0) {
				y = s.ymx - y
					+ BEAM_DEPTH + BEAM_SHIFT * (nflags - 1)
					+ 2
				if (y > 0)
					b += y
			} else {
				y = s.ymn - y
					- BEAM_DEPTH - BEAM_SHIFT * (nflags - 1)
					- 2
				if (y < 0)
					b += y
			}
			break
		case C.GRACE:
			for (g = s.extra; g; g = g.next) {
				y = a * g.x + b
				if (s1.stem > 0) {
					y = g.ymx - y
						+ BEAM_DEPTH + BEAM_SHIFT * (nflags - 1)
						+ 2
					if (y > 0)
						b += y
				} else {
					y = g.ymn - y
						- BEAM_DEPTH - BEAM_SHIFT * (nflags - 1)
						- 2
					if (y < 0)
						b += y
				}
			}
			break
		}
		if (s == s2)
			break
	}

	if (a == 0)		/* shift flat beams onto staff lines */
		b += b_pos(s1.grace, s1.stem, nflags, b - staff_tb[st].y)

	/* adjust final stems and rests under beam */
	for (s = s1; ; s = s.next) {
		switch (s.type) {
		case C.NOTE:
			s.ys = a * s.xs + b - staff_tb[s.st].y
			if (s.stem > 0) {
				s.ymx = s.ys + 2.5
//fixme: hack
				if (s.ts_prev
				 && s.ts_prev.stem > 0
				 && s.ts_prev.st == s.st
				 && s.ts_prev.ymn < s.ymx
				 && s.ts_prev.x == s.x
				 && s.notes[0].shhd == 0) {
					s.ts_prev.x -= 3;	/* fix stem clash */
					s.ts_prev.xs -= 3
				}
			} else {
				s.ymn = s.ys - 2.5
			}
			break
		case C.REST:
			y = a * s.x + b - staff_tb[s.st].y
			dy = BEAM_DEPTH + BEAM_SHIFT * (nflags - 1)
				+ (s.head != C.FULL ? 4 : 9)
			if (s1.stem > 0) {
				y -= dy
				if (s1.multi == 0 && y > 12)
					y = 12
				if (s.y <= y)
					break
			} else {
				y += dy
				if (s1.multi == 0 && y < 12)
					y = 12
				if (s.y >= y)
					break
			}
			if (s.head != C.FULL)
				y = (((y + 3 + 12) / 6) | 0) * 6 - 12;
			s.y = y
			break
		}
		if (s == s2)
			break
	}

	/* save beam parameters */
	if (staff_tb[st].y == 0)	/* if staves not defined */
		return false
	bm.s1 = s1;
	bm.a = a;
	bm.b = b;
	bm.nflags = nflags
	return true
}

/* -- draw the beams for one word -- */
/* (the staves are defined) */
function draw_beams(bm) {
	var	s, i, beam_dir, shift, bshift, bstub, bh, da,
		k, k1, k2, x1,
		s1 = bm.s1,
		s2 = bm.s2

	/* -- draw a single beam -- */
	function draw_beam(x1, x2, dy, h, bm,
				 n) {		/* beam number (1..n) */
		var	y1, dy2,
			s = bm.s1,
			nflags = s.nflags

		if (s.ntrem)
			nflags -= s.ntrem
		if (s.trem2 && n > nflags) {
			if (s.dur >= C.BLEN / 2) {
				x1 = s.x + 6;
				x2 = bm.s2.x - 6
			} else if (s.dur < C.BLEN / 4) {
				x1 += 5;
				x2 -= 6
			}
		}

		y1 = bm.a * x1 + bm.b - dy;
		x2 -= x1;
	//--fixme: scale (bm.a already scaled!)
		x2 /= stv_g.scale;
		dy2 = bm.a * x2 * stv_g.scale;
		xypath(x1, y1, true);
		output += 'l' + x2.toFixed(1) + ' ' + (-dy2).toFixed(1) +
			'v' + h.toFixed(1) +
			'l' + (-x2).toFixed(1) + ' ' + dy2.toFixed(1) +
			'z"/>\n'
	} // draw_beam()

	anno_start(s1, 'beam')
/*fixme: KO if many staves with different scales*/
//	set_scale(s1)
	if (!s1.grace) {
		bshift = BEAM_SHIFT;
		bstub = BEAM_STUB;
		shift = .34;		/* (half width of the stem) */
		bh = BEAM_DEPTH
	} else {
		bshift = 3.5;
		bstub = 3.2;
		shift = .29;
		bh = 1.8
	}

/*fixme: quick hack for stubs at end of beam and different stem directions*/
	beam_dir = s1.stem
	if (s1.stem != s2.stem
	 && s1.nflags < s2.nflags)
		beam_dir = s2.stem
	if (beam_dir < 0)
		bh = -bh;

	/* make first beam over whole word and adjust the stem lengths */
	draw_beam(s1.xs - shift, s2.xs + shift, 0, bh, bm, 1);
	da = 0
	for (s = s1; ; s = s.next) {
		if (s.type == C.NOTE
		 && s.stem != beam_dir)
			s.ys = bm.a * s.xs + bm.b
				- staff_tb[s.st].y
				+ bshift * (s.nflags - 1) * s.stem
				- bh
		if (s == s2)
			break
	}

	if (s1.feathered_beam) {
		da = bshift / (s2.xs - s1.xs)
		if (s1.feathered_beam > 0) {
			da = -da;
			bshift = da * s1.xs
		} else {
			bshift = da * s2.xs
		}
		da = da * beam_dir
	}

	/* other beams with two or more flags */
	shift = 0
	for (i = 2; i <= bm.nflags; i++) {
		shift += bshift
		if (da != 0)
			bm.a += da
		for (s = s1; ; s = s.next) {
			if (s.type != C.NOTE
			 || s.nflags < i) {
				if (s == s2)
					break
				continue
			}
			if (s.trem1
			 && i > s.nflags - s.ntrem) {
				x1 = (s.dur >= C.BLEN / 2) ? s.x : s.xs;
				draw_beam(x1 - 5, x1 + 5,
					  (shift + 2.5) * beam_dir,
					  bh, bm, i)
				if (s == s2)
					break
				continue
			}
			k1 = s
			while (1) {
				if (s == s2)
					break
				k = s.next
				if (k.type == C.NOTE || k.type == C.REST) {
					if (k.trem1){
						if (k.nflags - k.ntrem < i)
							break
					} else if (k.nflags < i) {
						break
					}
				}
				if (k.beam_br1
				 || (k.beam_br2 && i > 2))
					break
				s = k
			}
			k2 = s
			while (k2.type != C.NOTE)
				k2 = k2.prev;
			x1 = k1.xs
			if (k1 == k2) {
				if (k1 == s1) {
					x1 += bstub
				} else if (k1 == s2) {
					x1 -= bstub
				} else if (k1.beam_br1
				        || (k1.beam_br2
					 && i > 2)) {
					x1 += bstub
				} else {
					k = k1.next
					while (k.type != C.NOTE)
						k = k.next
					if (k.beam_br1
					 || (k.beam_br2 && i > 2)) {
						x1 -= bstub
					} else {
						k1 = k1.prev
						while (k1.type != C.NOTE)
							k1 = k1.prev
						if (k1.nflags < k.nflags
						 || (k1.nflags == k.nflags
						  && k1.dots < k.dots))
							x1 += bstub
						else
							x1 -= bstub
					}
				}
			}
			draw_beam(x1, k2.xs,
				  shift * beam_dir,
				  bh, bm, i)
			if (s == s2)
				break
		}
	}
	if (s1.tmp)
		unlksym(s1)
	else if (s2.tmp)
		unlksym(s2)
	anno_stop(s1, 'beam')
}

/* -- draw the left side of the staves -- */
function draw_lstaff(x) {
//	if (cfmt.alignbars)
//		return
	var	i, j, yb, h,
		nst = cur_sy.nstaff,
		l = 0

	/* -- draw a system brace or bracket -- */
	function draw_sysbra(x, st, flag) {
		var i, st_end, yt, yb

		while (!cur_sy.st_print[st]) {
			if (cur_sy.staves[st].flags & flag)
				return
			st++
		}
		i = st_end = st
		while (1) {
			if (cur_sy.st_print[i])
				st_end = i
			if (cur_sy.staves[i].flags & flag)
				break
			i++
		}
		yt = staff_tb[st].y + staff_tb[st].topbar
					* staff_tb[st].staffscale;
		yb = staff_tb[st_end].y + staff_tb[st_end].botbar
					* staff_tb[st_end].staffscale
		if (flag & (CLOSE_BRACE | CLOSE_BRACE2))
			out_brace(x, yb, yt - yb)
		else
			out_bracket(x, yt, yt - yb)
	}

	for (i = 0; ; i++) {
		if (cur_sy.staves[i].flags & (OPEN_BRACE | OPEN_BRACKET))
			l++
		if (cur_sy.st_print[i])
			break
		if (cur_sy.staves[i].flags & (CLOSE_BRACE | CLOSE_BRACKET))
			l--
		if (i == nst)
			break
	}
	for (j = nst; j > i; j--) {
		if (cur_sy.st_print[j])
			break
	}
	if (i == j && l == 0)
		return
	yb = staff_tb[j].y + staff_tb[j].botbar * staff_tb[j].staffscale;
	h = staff_tb[i].y + staff_tb[i].topbar * staff_tb[i].staffscale - yb;
	xypath(x, yb);
	output += "v" + (-h).toFixed(1) + '"/>\n'
	for (i = 0; i <= nst; i++) {
		if (cur_sy.staves[i].flags & OPEN_BRACE)
			draw_sysbra(x, i, CLOSE_BRACE)
		if (cur_sy.staves[i].flags & OPEN_BRACKET)
			draw_sysbra(x, i, CLOSE_BRACKET)
		if (cur_sy.staves[i].flags & OPEN_BRACE2)
			draw_sysbra(x - 6, i, CLOSE_BRACE2)
		if (cur_sy.staves[i].flags & OPEN_BRACKET2)
			draw_sysbra(x - 6, i, CLOSE_BRACKET2)
	}
}

/* -- draw the time signature -- */
function draw_meter(s) {
	if (!s.a_meter)
		return
    var	dx, i, j, meter, x,
		st = s.st,
		p_staff = staff_tb[st],
		y = p_staff.y;

	// adjust the vertical offset according to the staff definition
	if (p_staff.stafflines != '|||||')
		y += (p_staff.topbar + p_staff.botbar) / 2 - 12	// bottom

	for (i = 0; i < s.a_meter.length; i++) {
		meter = s.a_meter[i];
		x = s.x + s.x_meter[i]

		if (meter.bot) {
			out_XYAB('\
<g transform="translate(X,Y)" text-anchor="middle">\n\
	<text y="-12">A</text>\n\
	<text>B</text>\n\
</g>\n', x, y + 6, m_gl(meter.top), m_gl(meter.bot))
		} else {
			out_XYAB('\
<text x="X" y="Y" text-anchor="middle">A</text>\n',
				x, y + 12, m_gl(meter.top))
		}
	}
}

    var	acc_nd = {}		// cache of the microtonal accidentals

/* -- draw an accidental -- */
function draw_acc(x, y, a) {
	if (typeof a != "number") {		// if microtone
	    var	c,
		n = a[0],
		d = a[1]

		if (cfmt.nedo) {
			n *= 12
			d *= cfmt.nedo
		}
		c = n + '_' + d
		a = acc_nd[c]
		if (!a) {
			a = abc2svg.rat(Math.abs(n), d)
			d = a[1]
			a = (n < 0 ? -a[0] : a[0]).toString()
			if (d != 1)
				a += '_' + d
			acc_nd[c] = a
		}
	}
	xygl(x, y, "acc" + a)
}

// memorize the helper/ledger lines
function set_hl(p_st, n, x, dx1, dx2) {
    var	i, hl

	if (n >= 0) {
		hl = p_st.hlu[n]
		if (!hl)
			hl = p_st.hlu[n] = []
	} else {
		hl = p_st.hld[-n]
		if (!hl)
			hl = p_st.hld[-n] = []
	}

	for (i = 0; i < hl.length; i++) {
		if (x >= hl[i][0])
			break
	}
	if (i == hl.length) {
		hl.push([x, dx1, dx2])
	} else if (x > hl[i][0]) {
		hl.splice(++i, 0, [x, dx1, dx2])
	} else {
		if (dx1 < hl[i][1])
			hl[i][1] = dx1
		if (dx2 > hl[i][2])
			hl[i][2] = dx2
	}
} // set_hl()

// draw helper lines
// (possible hook)
Abc.prototype.draw_hl = function(s) {
    var	i, j, n, note,
	hla = [],
	st = s.st,
	p_staff = staff_tb[st]

	// check if any helper line
	if (!p_staff.hll)
		return			// no helper line (no line)
	for (i = 0; i <= s.nhd; i++) {
		note = s.notes[i]
		if (!p_staff.hlmap[note.pit - p_staff.hll])
			hla.push([note.pit - 18,
				  note.shhd * stv_g.scale])
	}
	n = hla.length
	if (!n)
		return			// no

	// handle the helper lines out of the staff
    var	dx1, dx2, hl, shhd,hlp,
	stafflines = p_staff.stafflines,
	top = stafflines.length - 1,
	yu =  top,
	bot = p_staff.botline / 6,
	yl = bot,
	dx = s.grace ? 4 : hw_tb[s.head] * 1.3

	// get the x start and x stop of the intermediate helper lines
	note = s.notes[s.stem < 0 ? s.nhd : 0]
	shhd = note.shhd

	for (i = 0; i < hla.length; i++) {
		hlp = hla[i][0]
		dx1 = (hla[i][1] < shhd ? hla[i][1] : shhd) - dx
		dx2 = (hla[i][1] > shhd ? hla[i][1] : shhd) + dx
		if (hlp < bot * 2) {
			yl = ++hlp >> 1
			n--
		} else if (hlp > top * 2) {
			yu = hlp >> 1
			n--
		}
		set_hl(p_staff, hlp >> 1, s.x, dx1, dx2)
	}

	dx1 = shhd - dx
	dx2 = shhd + dx
	while (++yl < bot)
		set_hl(p_staff, yl,
			s.x, dx1, dx2)
	while (--yu > top)
		set_hl(p_staff, yu,
			s.x, dx1, dx2)
	if (!n)
		return			// no more helper lines

	// draw the helper lines inside the staff
	i = yl;
	j = yu
	while (i > bot && stafflines[i] == '-')
		i--
	while (j < top && stafflines[j] == '-')
		j++
	for ( ; i < j; i++) {
		if (stafflines[i] == '-')
			set_hl(p_staff, i, s.x, dx1, dx2)
	}
}

/* -- draw a key signature -- */
// (possible hook)
var	sharp_cl = new Int8Array([24, 9, 15, 21, 6, 12, 18]),
	flat_cl = new Int8Array([12, 18, 24, 9, 15, 21, 6]),
	sharp1 = new Int8Array([-9, 12, -9, -9, 12, -9]),
	sharp2 = new Int8Array([12, -9, 12, -9, 12, -9]),
	flat1 = new Int8Array([9, -12, 9, -12, 9, -12]),
	flat2 = new Int8Array([-12, 9, -12, 9, -12, 9])

Abc.prototype.draw_keysig = function(x, s) {
	if (s.k_none || s.k_play)
		return
	var	old_sf = s.k_old_sf,
		st = s.st,
		staffb = staff_tb[st].y,
		i, shift, p_seq,
		clef_ix = s.k_y_clef

	if (clef_ix & 1)
		clef_ix += 7;
	clef_ix /= 2
	while (clef_ix < 0)
		clef_ix += 7;
	clef_ix %= 7

	/* normal accidentals */
	if (!s.k_a_acc) {

		/* put neutrals if 'accidental cancel' */
		if (cfmt.cancelkey || s.k_sf == 0) {

			/* when flats to sharps, or sharps to flats, */
			if (s.k_sf == 0
			 || old_sf * s.k_sf < 0) {

				/* old sharps */
				shift = sharp_cl[clef_ix];
				p_seq = shift > 9 ? sharp1 : sharp2
				for (i = 0; i < old_sf; i++) {
					xygl(x, staffb + shift, "acc3");
					shift += p_seq[i];
					x += 5.5
				}

				/* old flats */
				shift = flat_cl[clef_ix];
				p_seq = shift < 18 ? flat1 : flat2
				for (i = 0; i > old_sf; i--) {
					xygl(x, staffb + shift, "acc3");
					shift += p_seq[-i];
					x += 5.5
				}
				if (s.k_sf != 0)
					x += 3		/* extra space */
			}
		}

		/* new sharps */
		if (s.k_sf > 0) {
			shift = sharp_cl[clef_ix];
			p_seq = shift > 9 ? sharp1 : sharp2
			for (i = 0; i < s.k_sf; i++) {
				xygl(x, staffb + shift, "acc1");
				shift += p_seq[i];
				x += 5.5
			}
			if (cfmt.cancelkey && i < old_sf) {
				x += 2
				for (; i < old_sf; i++) {
					xygl(x, staffb + shift, "acc3");
					shift += p_seq[i];
					x += 5.5
				}
			}
		}

		/* new flats */
		if (s.k_sf < 0) {
			shift = flat_cl[clef_ix];
			p_seq = shift < 18 ? flat1 : flat2
			for (i = 0; i > s.k_sf; i--) {
				xygl(x, staffb + shift, "acc-1");
				shift += p_seq[-i];
				x += 5.5
			}
			if (cfmt.cancelkey && i > old_sf) {
				x += 2
				for (; i > old_sf; i--) {
					xygl(x, staffb + shift, "acc3");
					shift += p_seq[-i];
					x += 5.5
				}
			}
		}
	} else if (s.k_a_acc.length) {

		/* explicit accidentals */
		var	acc,
			last_acc = s.k_a_acc[0].acc,
			last_shift = 100,
			s2 = {
				st: st,
				nhd: 0,
				notes: [{}]
			}

		for (i = 0; i < s.k_a_acc.length; i++) {
			acc = s.k_a_acc[i];
			shift = (s.k_y_clef	// clef shift
				+ acc.pit - 18) * 3
			if (i != 0
			 && (shift > last_shift + 18
			  || shift < last_shift - 18))
				x -= 5.5		// no clash
			else if (acc.acc != last_acc)
				x += 3;
			last_acc = acc.acc;
			s2.x = x
			s2.notes[0].pit = shift / 3 + 18;
			self.draw_hl(s2)
			last_shift = shift;
			draw_acc(x, staffb + shift, acc.acc)
			x += 5.5
		}
	}
}

/* -- convert the standard measure bars -- */
function bar_cnv(bar_type) {
	switch (bar_type) {
	case "[":
	case "[]":
		return ""			/* invisible */
	case "|:":
	case "|::":
	case "|:::":
		return "[" + bar_type		/* |::: -> [|::: */
	case ":|":
	case "::|":
	case ":::|":
		return bar_type + "]"		/* :..| -> :..|] */
	case "::":
		return cfmt.dblrepbar		/* :: -> double repeat bar */
	}
	return bar_type
}

/* -- draw a rest -- */
/* (the staves are defined) */
var rest_tb = [
	"r128", "r64", "r32", "r16", "r8",
	"r4",
	"r2", "r1", "r0", "r00"]

function draw_rest(s) {
    var	s2, i, j, x, y, yb, bx,
	p_staff = staff_tb[s.st]

	// if rest alone in the measure or measure repeat,
	// change the head and center
	if (s.dur_orig == s.p_v.meter.wmeasure
	 || (s.rep_nb && s.rep_nb >= 0)) {
		if (s.dur < C.BLEN * 2)
			s.nflags = -2		// semibreve / whole
		else if (s.dur < C.BLEN * 4)
			s.nflags = -3
		else
			s.nflags = -4;
		s.dots = 0;

		/* don't use next/prev: there is no bar in voice overlay */
		s2 = s.ts_next
//fix: there is a bar at end of line
//		while (s2 && s2.time != s.time + s.dur)
//			s2 = s2.ts_next;
//		x = s2 ? s2.x : realwidth;
		while (s2.time != s.time + s.dur)
			s2 = s2.ts_next
		x = s2.x
		s2 = s
		while (!s2.seqst)
			s2 = s2.ts_prev;
		s2 = s2.ts_prev;
		x = (x + s2.x) / 2

		/* center the associated decorations */
		if (s.a_dd)
			deco_update(s, x - s.x);
		s.x = x
	} else {
		x = s.x
		if (s.notes[0].shhd)
			x += s.notes[0].shhd * stv_g.scale
	}
	if (s.invis)
		return

	yb = p_staff.y			// bottom of staff

	if (s.rep_nb) {
		set_sscale(s.st);
		anno_start(s);
		if (p_staff.stafflines == '|||||')
			yb += 12
		else
			yb += (p_staff.topbar + p_staff.botbar) / 2
		if (s.rep_nb < 0) {
			xygl(x, yb, "srep")
		} else {
			xygl(x, yb, "mrep")
			if (s.rep_nb > 2 && s.v == cur_sy.top_voice) {
				set_font("annotation");
				if (gene.curfont.box) {
					gene.curfont.box = false;
					bx = true
				}	
				xy_str(x, yb + p_staff.topbar - 9,
					s.rep_nb.toString(), "c")
				if (bx)
					gene.curfont.box = true
			}
		}
		anno_stop(s)
		return
	}

	set_scale(s);
	anno_start(s);

	if (s.notes[0].color)
		set_color(s.notes[0].color);

	y = s.y;

	i = 5 - s.nflags		/* rest_tb index (5 = C_XFLAGS) */
	if (i == 7 && y == 12
	 && p_staff.stafflines.length <= 2)
		y -= 6				/* semibreve a bit lower */

	// draw the rest
	xygl(x, y + yb, s.notes[0].head || rest_tb[i])

	/* output ledger line(s) when greater than minim */
	if (i >= 6) {
		j = y / 6
		switch (i) {
		default:
			switch (p_staff.stafflines[j + 1]) {
			case '|':
			case '[':
				break
			default:
				xygl(x, y + 6 + yb, "hl1")
				break
			}
			if (i == 9) {			/* longa */
				y -= 6;
				j--
			}
			break
		case 7:					/* semibreve */
			y += 6;
			j++
		case 6:					/* minim */
			break
		}
		switch (p_staff.stafflines[j]) {
		case '|':
		case '[':
			break
		default:
			xygl(x, y + yb, "hl1")
			break
		}
	}
	if (s.dots) {
		x += 8;
		y += yb + 3
		for (i = 0; i < s.dots; i++) {
			xygl(x, y, "dot");
			x += 3.5
		}
	}
	set_color();
	anno_stop(s)
}

/* -- draw grace notes -- */
/* (the staves are defined) */
function draw_gracenotes(s) {
    var	yy, x0, y0, x1, y1, x2, y2, x3, y3, bet1, bet2, slur,
	dy1, dy2, g, last, note,
	bm = {}

	/* draw the notes */
//	bm.s2 = undefined			/* (draw flags) */
	for (g = s.extra; g; g = g.next) {
		if (g.beam_st && !g.beam_end) {
			if (self.calculate_beam(bm, g))
				draw_beams(bm)
		}
		anno_start(g);
		draw_note(g, !bm.s2)
		if (g == bm.s2)
			bm.s2 = null			/* (draw flags again) */
		anno_stop(g)
		if (g.sls || g.sl2)
			slur = true
		if (!g.next)
			break			/* (keep the last note) */
	}

	// if an acciaccatura, draw a bar 
	if (s.sappo) {
		g = s.extra
		if (!g.next) {			/* if one note */
			x1 = 9;
			y1 = g.stem > 0 ? 5 : -5
		} else {			/* many notes */
			x1 = (g.next.x - g.x) * .5 + 4;
			y1 = (g.ys + g.next.ys) * .5 - g.y
			if (g.stem > 0)
				y1 -= 1
			else
				y1 += 1
		}
		note = g.notes[g.stem < 0 ? 0 : g.nhd];
		out_acciac(x_head(g, note), y_head(g, note),
				x1, y1, g.stem > 0)
	}

	/* slur */
//fixme: have a full key symbol in voice
	if (s.p_v.ckey.k_bagpipe		/* no slur when bagpipe */
	 || !cfmt.graceslurs
	 || slur				// explicit slur
	 || s.tie_s				// some tie
	 || !s.next
	 || s.next.type != C.NOTE)
		return
	last = g
	if (((g.stem >= 0 || s.multi < 0) && g.notes[0].pit <= 28)
	 || g.notes[0].pit < 16) {		// slur below
		yy = 127
		for (g = s.extra; g; g = g.next) {
			if (g.y < yy) {
				yy = g.y;
				last = g
			}
		}
		x0 = last.x;
		y0 = last.y - 5
		if (s.extra != last) {
			x0 -= 4;
			y0 += 1
		}
		s = s.next;
		x3 = s.x - 1
		if (s.stem < 0 && s.nflags > -2)
			x3 -= 4;
		y3 = 3 * (s.notes[0].pit - 18) - 5;
		dy1 = (x3 - x0) * .4
		if (dy1 > 3)
			dy1 = 3;
		dy2 = dy1;
		bet1 = .2;
		bet2 = .8
		if (y0 > y3 + 7) {
			x0 = last.x - 1;
			y0 += .5;
			y3 += 6.5;
			x3 = s.x - 5.5;
			dy1 = (y0 - y3) * .8;
			dy2 = (y0 - y3) * .2;
			bet1 = 0
		} else if (y3 > y0 + 4) {
			y3 = y0 + 4;
			x0 = last.x + 2;
			y0 = last.y - 4
		}
	} else {				// slur above
		yy = -127
		for (g = s.extra; g; g = g.next) {
			if (g.y > yy) {
				yy = g.y;
				last = g
			}
		}
		x0 = last.x;
		y0 = last.y + 5
		if (s.extra != last) {
			x0 -= 4;
			y0 -= 1
		}
		s = s.next;
		x3 = s.x - 1
		if (s.stem >= 0 && s.nflags > -2)
			x3 -= 2;
		y3 = 3 * (s.notes[s.nhd].pit - 18) + 5;
		dy1 = (x0 - x3) * .4
		if (dy1 < -3)
			dy1 = -3;
		dy2 = dy1;
		bet1 = .2;
		bet2 = .8
		if (y0 < y3 - 7) {
			x0 = last.x - 1;
			y0 -= .5;
			y3 -= 6.5;
			x3 = s.x - 5.5;
			dy1 = (y0 - y3) * .8;
			dy2 = (y0 - y3) * .2;
			bet1 = 0
		} else if (y3 < y0 - 4) {
			y3 = y0 - 4;
			x0 = last.x + 2;
			y0 = last.y + 4
		}
	}

	x1 = bet1 * x3 + (1 - bet1) * x0 - x0;
	y1 = bet1 * y3 + (1 - bet1) * y0 - dy1 - y0;
	x2 = bet2 * x3 + (1 - bet2) * x0 - x0;
	y2 = bet2 * y3 + (1 - bet2) * y0 - dy2 - y0;

	anno_start(s, 'slur');
	xypath(x0, y0 + staff_tb[s.st].y);
	output += 'c' + x1.toFixed(1) + ' ' + (-y1).toFixed(1) +
		' ' + x2.toFixed(1) + ' ' + (-y2).toFixed(1) +
		' ' + (x3 - x0).toFixed(1) + ' ' + (-y3 + y0).toFixed(1) + '"/>\n';
	anno_stop(s, 'slur')
}

/* -- set the y offset of the dots -- */
function setdoty(s, y_tb) {
	var m, m1, y

	/* set the normal offsets */
	for (m = 0; m <= s.nhd; m++) {
		y = 3 * (s.notes[m].pit - 18)	/* note height on staff */
		if ((y % 6) == 0) {
			if (s.dot_low)
				y -= 3
			else
				y += 3
		}
		y_tb[m] = y
	}
	/* dispatch and recenter the dots in the staff spaces */
	for (m = 0; m < s.nhd; m++) {
		if (y_tb[m + 1] > y_tb[m])
			continue
		m1 = m
		while (m1 > 0) {
			if (y_tb[m1] > y_tb[m1 - 1] + 6)
				break
			m1--
		}
		if (3 * (s.notes[m1].pit - 18) - y_tb[m1]
				< y_tb[m + 1] - 3 * (s.notes[m + 1].pit - 18)) {
			while (m1 <= m)
				y_tb[m1++] -= 6
		} else {
			y_tb[m + 1] = y_tb[m] + 6
		}
	}
}

// get the x and y position of a note head
// (when the staves are defined)
function x_head(s, note) {
	return s.x + note.shhd * stv_g.scale
}
function y_head(s, note) {
	return staff_tb[s.st].y + 3 * (note.pit - 18)
}

/* -- draw m-th head with accidentals and dots -- */
/* (the staves are defined) */
// sets {x,y}_note
function draw_basic_note(x, s, m, y_tb) {
	var	i, p, yy, dotx, doty, inv,
		old_color = false,
		note = s.notes[m],
		staffb = staff_tb[s.st].y,	/* bottom of staff */
		y = 3 * (note.pit - 18),	/* note height on staff */
		shhd = note.shhd * stv_g.scale,
		x_note = x + shhd,
		y_note = y + staffb

//	/* special case for voice unison */
//	if (s.nohdi1 != undefined
//	 && m >= s.nohdi1 && m < s.nohdi2)
//		return

	var	elts = identify_note(s, note.dur),
		head = elts[0],
		dots = elts[1],
		nflags = elts[2]

	/* draw the head */
	if (note.invis) {
		;
	} else if (s.grace) {			// don't apply %%map to grace notes
		p = "ghd";
		x_note -= 4.5 * stv_g.scale
	} else if (note.map && note.map[0]) {
		i = s.head;
		p = note.map[0][i]		// heads
		if (!p)
			p = note.map[0][note.map[0].length - 1]
		i = p.indexOf('/')
		if (i >= 0) {			// stem dependant
			if (s.stem >= 0)
				p = p.slice(0, i)
			else
				p = p.slice(i + 1)
		}
	} else if (s.type == C.CUSTOS) {
		p = "custos"
	} else {
		switch (head) {
		case C.OVAL:
			p = "HD"
			break
		case C.OVALBARS:
			if (s.head != C.SQUARE) {
				p = "HDD"
				break
			}
			// fall thru
		case C.SQUARE:
			if (nflags > -4) {
				p = "breve"
			} else {
				p =  "longa"
				inv = s.stem > 0
			}

			/* don't display dots on last note of the tune */
			if (!tsnext && s.next
			 && s.next.type == C.BAR && !s.next.next)
				dots = 0
			x_note += 1
			break
		case C.EMPTY:
			p = "Hd"		// white note
			break
		default:			// black note
			p = "hd"
			break
		}
	}
	if (note.color != undefined)
		old_color = set_color(note.color)
	if (p) {
		if (inv) {
			g_open(x_note, y_note, 0, 1, -1);
			x_note = y_note = 0
		}
		if (!self.psxygl(x_note, y_note, p))
			xygl(x_note, y_note, p)
		if (inv)
			g_close()
	}

	/* draw the dots */
/*fixme: to see for grace notes*/
	if (dots) {
		dotx = x + (7.7 + s.xmx) * stv_g.scale
		if (y_tb[m] == undefined) {
			y_tb[m] = 3 * (s.notes[m].pit - 18)
			if ((s.notes[m].pit & 1) == 0)
				y_tb[m] += 3
		}
		doty = y_tb[m] + staffb
		i = (note.dur / 12) >> ((5 - nflags) - dots)
		while (dots-- > 0) {
			xygl(dotx, doty, (i & (1 << dots)) ? "dot" : "dot+")
			dotx += 3.5
		}
	}

	/* draw the accidental */
	if (note.acc) {
		x -= note.shac * stv_g.scale
		if (!s.grace) {
			draw_acc(x, y + staffb, note.acc)
		} else {
			g_open(x, y + staffb, 0, .75);
			draw_acc(0, 0, note.acc)
			g_close()
		}
	}
	if (old_color != false)
		set_color(old_color)
}

/* -- draw a note or a chord -- */
/* (the staves are defined) */
function draw_note(s,
		   fl) {		// draw flags
    var	s2, i, m, y, staffb, slen, c, nflags,
	x, y, note,
	y_tb = new Array(s.nhd + 1)

	if (s.dots)
		setdoty(s, y_tb)

	note = s.notes[s.stem < 0 ? s.nhd : 0];	// master note head
	x = x_head(s, note)
	staffb = staff_tb[s.st].y

	self.draw_hl(s)

	/* draw the stem and flags */
	y = y_head(s, note)
	if (!s.stemless) {
		slen = s.ys - s.y;
		nflags = s.nflags
		if (s.ntrem)
			nflags -= s.ntrem
		if (!fl || nflags <= 0) {	/* stem only */
			if (s.nflags > 0) {	/* (fix for PS low resolution) */
				if (s.stem >= 0)
					slen -= 1
				else
					slen += 1
			}
			out_stem(x, y, slen, s.grace)
		} else {				/* stem and flags */
			out_stem(x, y, slen, s.grace,
				 nflags, cfmt.straightflags)
		}
	} else if (s.xstem) {				/* cross-staff stem */
		s2 = s.ts_prev;
		slen = (s2.stem > 0 ? s2.y : s2.ys) - s.y;
		slen += staff_tb[s2.st].y - staffb;
		out_stem(x, y, slen)
	}

	/* draw the tremolo bars */
	if (fl && s.trem1) {
		var	ntrem = s.ntrem || 0,
			x1 = x;
		slen = 3 * (s.notes[s.stem > 0 ? s.nhd : 0].pit - 18)
		if (s.head == C.FULL || s.head == C.EMPTY) {
			x1 += (s.grace ? GSTEM_XOFF : 3.5) * s.stem
			if (s.stem > 0)
				slen += 6 + 5.4 * ntrem
			else
				slen -= 6 + 5.4
		} else {
			if (s.stem > 0)
				slen += 5 + 5.4 * ntrem
			else
				slen -= 5 + 5.4
		}
		slen /= s.p_v.scale;
		out_trem(x1, staffb + slen, ntrem)
	}

	/* draw the note heads */
	x = s.x
	for (m = 0; m <= s.nhd; m++)
		draw_basic_note(x, s, m, y_tb)
}

// find where to start a long decoration
function prev_scut(s) {
	while (s.prev) {
		s = s.prev
		if (s.rbstart)
			return s
	}

	/* return a symbol of any voice starting before the start of the voice */
	s = s.p_v.sym
	while (s.type != C.CLEF)
		s = s.ts_prev		/* search a main voice */
	if (s.next && s.next.type == C.KEY)
		s = s.next
	if (s.next && s.next.type == C.METER)
		return s.next
	return s
}

/* -- decide whether a slur goes up or down (same voice) -- */
function slur_direction(k1, k2) {
    var	s, some_upstem, low, dir

	// check if slur sequence in a multi-voice staff
	function slur_multi(s1, s2) {
//		while (1) {
//			if (s1.multi)		// if multi voice
//				//fixme: may change
//				return s1.multi
//			if (s1 == s2)
//				break
//			s1 = s1.next
//		}
		if (s1.multi)
			return s1.multi
		if (s2.multi)
			return s2.multi
		return 0
	} // slur_multi()

	if (k1.grace && k1.stem > 0)
		return -1

	dir = slur_multi(k1, k2)
	if (dir)
		return dir

	for (s = k1; ; s = s.next) {
		if (s.type == C.NOTE) {
			if (!s.stemless) {
				if (s.stem < 0)
					return 1
				some_upstem = true
			}
			if (s.notes[0].pit < 22)	/* if under middle staff */
				low = true
		}
//		if (s == k2)
		if (s.time == k2.time)		// (k2 may be a grace note)
			break
	}
	if (!some_upstem && !low)
		return 1
	return -1
}

/* -- output a slur / tie -- */
function slur_out(x1, y1, x2, y2, dir, height, dotted) {
	var	dx, dy, dz,
		alfa = .3,
		beta = .45;

	/* for wide flat slurs, make shape more square */
	dy = y2 - y1
	if (dy < 0)
		dy = -dy;
	dx = x2 - x1
	if (dx > 40. && dy / dx < .7) {
		alfa = .3 + .002 * (dx - 40.)
		if (alfa > .7)
			alfa = .7
	}

	/* alfa, beta, and height determine Bezier control points pp1,pp2
	 *
	 *           X====alfa===|===alfa=====X
	 *	    /		 |	       \
	 *	  pp1		 |	        pp2
	 *	  /	       height		 \
	 *	beta		 |		 beta
	 *      /		 |		   \
	 *    p1		 m		     p2
	 *
	 */

	var	mx = .5 * (x1 + x2),
		my = .5 * (y1 + y2),
		xx1 = mx + alfa * (x1 - mx),
		yy1 = my + alfa * (y1 - my) + height;
	xx1 = x1 + beta * (xx1 - x1);
	yy1 = y1 + beta * (yy1 - y1)

	var	xx2 = mx + alfa * (x2 - mx),
		yy2 = my + alfa * (y2 - my) + height;
	xx2 = x2 + beta * (xx2 - x2);
	yy2 = y2 + beta * (yy2 - y2);

//	dy = 1.6 * dir
	dy = 2 * dir;
	dz = .2 + .001 * dx
	if (dz > .6)
		dz = .6;
	dz *= dir
	dx *= .03
//	if (dx > 10.)
//		dx = 10.

//	var scale_y = stv_g.st < 0 ? stv_g.scale : 1
	var scale_y = 1			// (see set_dscale())
	if (!dotted)
		output += '<path d="M'
	else
		output += '<path class="stroke" stroke-dasharray="5,5" d="M';
	out_sxsy(x1, ' ', y1);
	output += 'c' +
		((xx1 - x1) / stv_g.scale).toFixed(1) + ' ' +
		((y1 - yy1) / scale_y).toFixed(1) + ' ' +
		((xx2 - x1) / stv_g.scale).toFixed(1) + ' ' +
		((y1 - yy2) / scale_y).toFixed(1) + ' ' +
		((x2 - x1) / stv_g.scale).toFixed(1) + ' ' +
		((y1 - y2) / scale_y).toFixed(1)

	if (!dotted)
		output += '\n\tv' +
			(-dz).toFixed(1) + 'c' +
			((xx2 - dx - x2) / stv_g.scale).toFixed(1) + ' ' +
			((y2 + dz - yy2 - dy) / scale_y).toFixed(1) + ' ' +
			((xx1 + dx - x2) / stv_g.scale).toFixed(1) + ' ' +
			((y2 + dz - yy1 - dy) / scale_y).toFixed(1) + ' ' +
			((x1 - x2) / stv_g.scale).toFixed(1) + ' ' +
			((y2 - y1) / scale_y).toFixed(1)
	output += '"/>\n'
}

// draw a slur between two chords / notes
/* (the staves are not yet defined) */
/* (delayed output) */
/* (not a pretty routine, this) */
function draw_slur(path,	// list of symbols under the slur
		not1,		// note if start on a note head
		sl) {		// ending variables: type, note, end on a note
    var	i,
	k, g, x1, y1, x2, y2, height, addy,
	a, y, z, h, dx, dy,
	ty = sl.ty,
	dir = (ty & 0x07) == C.SL_ABOVE ? 1 : -1,
	n = path.length,
	i1 = 0,
	i2 = n - 1,
	k1 = path[0],
	k2 = path[i2]

/*fixme: if two staves, may have upper or lower slur*/

	var	nn = 1,
		upstaff = k1.st,
		two_staves = false

	set_dscale(k1.st)

	for (i = 1; i < n; i++) {
		k = path[i]
		if (k.type == C.NOTE || k.type == C.REST) {
			nn++
			if (k.st != upstaff) {
				two_staves = true
				if (k.st < upstaff)
					upstaff = k.st
			}
		}
	}
/*fixme: KO when two staves*/
if (two_staves) error(2, k1, "*** multi-staves slurs not treated yet");

	/* fix endpoints */
	x1 = k1.x
	if (k1.notes && k1.notes[0].shhd)
		x1 += k1.notes[0].shhd;
	x2 = k2.x
	if (k2.notes)
		x2 += k2.notes[0].shhd

	if (not1) {					// start on a note
		y1 = 3 * (not1.pit - 18) + 2 * dir
		x1 += 3
	} else {					// start on a chord
		y1 = dir > 0 ? k1.ymx + 2 : k1.ymn - 2
		if (k1.type == C.NOTE) {
			if (dir > 0) {
				if (k1.stem > 0) {
					x1 += 5
					if (k1.beam_end
					 && k1.nflags >= -1	/* if with a stem */
//fixme: check if at end of tuplet
					 && !k1.in_tuplet) {
//					  || k1.ys > y1 - 3)) {
						if (k1.nflags > 0) {
							x1 += 2;
							y1 = k1.ys - 3
						} else {
							y1 = k1.ys - 6
						}
// don't clash with decorations
//					} else {
//						y1 = k1.ys + 3
					}
//				} else {
//					y1 = k1.y + 8
				}
			} else {
				if (k1.stem < 0) {
					x1 -= 1
					if (k2.grace) {
						y1 = k1.y - 8
					} else if (k1.beam_end
						&& k1.nflags >= -1
						&& (!k1.in_tuplet
						 || k1.ys < y1 + 3)) {
						if (k1.nflags > 0) {
							x1 += 2;
							y1 = k1.ys + 3
						} else {
							y1 = k1.ys + 6
						}
//					} else {
//						y1 = k1.ys - 3
					}
//				} else {
//					y1 = k1.y - 8
				}
			}
		}
	}

	if (sl.is_note) {				// end on a note
		y2 = 3 * (sl.note.pit - 18) + 2 * dir
		x2 -= 3
	} else {					// end on a chord
		y2 = dir > 0 ? k2.ymx + 2 : k2.ymn - 2
		if (k2.type == C.NOTE) {
			if (dir > 0) {
				if (k2.stem > 0) {
					x2 += 1
					if (k2.beam_st
					 && k2.nflags >= -1
					 && !k2.in_tuplet)
//						|| k2.ys > y2 - 3))
						y2 = k2.ys - 6
//					else
//						y2 = k2.ys + 3
//				} else {
//					y2 = k2.y + 8
				}
			} else {
				if (k2.stem < 0) {
					x2 -= 5
					if (k2.beam_st
					 && k2.nflags >= -1
					 && !k2.in_tuplet)
//						|| k2.ys < y2 + 3))
						y2 = k2.ys + 6
//					else
//						y2 = k2.ys - 3
//				} else {
//					y2 = k2.y - 8
				}
			}
		}
	}

	if (k1.type != C.NOTE) {
		y1 = y2 + 1.2 * dir;
		x1 = k1.x + k1.wr * .5
		if (x1 > x2 - 12)
			x1 = x2 - 12
	}

	if (k2.type != C.NOTE) {
		if (k1.type == C.NOTE)
			y2 = y1 + 1.2 * dir
		else
			y2 = y1
		if (k1 != k2)
			x2 = k2.x - k2.wl * .3
	}

	if (nn >= 3) {
		k = path[1]
		if (k.type != C.BAR
		 && k.x < x1 + 48) {
			if (dir > 0) {
				y = k.ymx - 2
				if (y1 < y)
					y1 = y
			} else {
				y = k.ymn + 2
				if (y1 > y)
					y1 = y
			}
		}
		k = path[i2 - 1]
		if (k.type != C.BAR
		 && k.x > x2 - 48) {
			if (dir > 0) {
				y = k.ymx - 2
				if (y2 < y)
					y2 = y
			} else {
				y = k.ymn + 2
				if (y2 > y)
					y2 = y
			}
		}
	}

	a = (y2 - y1) / (x2 - x1)		/* slur steepness */
	if (a > SLUR_SLOPE || a < -SLUR_SLOPE) {
		a = a > SLUR_SLOPE ? SLUR_SLOPE : -SLUR_SLOPE
		if (a * dir > 0)
			y1 = y2 - a * (x2 - x1)
		else
			y2 = y1 + a * (x2 - x1)
	}

	/* for big vertical jump, shift endpoints */
	y = y2 - y1
	if (y > 8)
		y = 8
	else if (y < -8)
		y = -8
	z = y
	if (z < 0)
		z = -z;
	dx = .5 * z;
	dy = .3 * y
	if (y * dir > 0) {
		x2 -= dx;
		y2 -= dy
	} else {
		x1 += dx;
		y1 += dy
	}

	/* special case for grace notes */
	if (k1.grace)
		x1 = k1.x - GSTEM_XOFF * .5
	if (k2.grace)
		x2 = k2.x + GSTEM_XOFF * 1.5;

	h = 0;
	a = (y2 - y1) / (x2 - x1)
	if (k1 != k2
	 && k1.v == k2.v) {
	    addy = y1 - a * x1
	    for (i = 1; i < i2; i++) {
		k = path[i]
		if (k.st != upstaff)
			continue
		switch (k.type) {
		case C.NOTE:
		case C.REST:
			if (dir > 0) {
				y = 3 * (k.notes[k.nhd].pit - 18) + 6
				if (y < k.ymx)
					y = k.ymx;
				y -= a * k.x + addy
				if (y > h)
					h = y
			} else {
				y = 3 * (k.notes[0].pit - 18) - 6
				if (y > k.ymn)
					y = k.ymn;
				y -= a * k.x + addy
				if (y < h)
					h = y
			}
			break
		case C.GRACE:
			for (g = k.extra; g; g = g.next) {
				if (dir > 0) {
					y = 3 * (g.notes[g.nhd].pit - 18) + 6
					if (y < g.ymx)
						y = g.ymx;
					y -= a * g.x + addy
					if (y > h)
						h = y
				} else {
					y = 3 * (g.notes[0].pit - 18) - 6
					if (y > g.ymn)
						y = g.ymn;
					y -= a * g.x + addy
					if (y < h)
						h = y
				}
			}
			break
		}
	    }
	    y1 += .45 * h;
	    y2 += .45 * h;
	    h *= .65
	}

	if (nn > 3)
		height = (.08 * (x2 - x1) + 12) * dir
	else
		height = (.03 * (x2 - x1) + 8) * dir
	if (dir > 0) {
		if (height < 3 * h)
			height = 3 * h
		if (height > 40)
			height = 40
	} else {
		if (height > 3 * h)
			height = 3 * h
		if (height < -40)
			height = -40
	}

	y = y2 - y1
	if (y < 0)
		y = -y
	if (dir > 0) {
		if (height < .8 * y)
			height = .8 * y
	} else {
		if (height > -.8 * y)
			height = -.8 * y
	}
	height *= cfmt.slurheight;

//	anno_start(k1_o, 'slur');
	slur_out(x1, y1, x2, y2, dir, height, ty & C.SL_DOTTED);
//	anno_stop(k1_o, 'slur');

	/* have room for other symbols */
	dx = x2 - x1;
	a = (y2 - y1) / dx;
/*fixme: it seems to work with .4, but why?*/
//	addy = y1 - a * x1 + .4 * height
//fixme: the following code seems better!
	addy = y1 - a * x1
	if (height > 0)
		addy += 4 * Math.sqrt(height) - 2
	else
		addy -= 4 * Math.sqrt(-height) - 2
	for (i = 0; i < i2; i++) {
		k = path[i]
		if (k.st != upstaff)
			continue
		y = a * k.x + addy
		if (k.ymx < y)
			k.ymx = y
		else if (k.ymn > y)
			k.ymn = y
		if (i == i2 - 1) {
			dx = x2
			if (k2.sl1)
				dx -= 5;
			y -= height / 3
		} else {
			dx = path[i + 1].x
		}
		if (i != 0)
			x1 = k.x
		else
			y -= height / 3
		dx -= x1;
		y_set(upstaff, dir > 0, x1, dx, y)
	}
}

/* -- draw the slurs between 2 symbols --*/
function draw_slurs(s, last) {
    var	gr1, i, m, note, sls, nsls

	// draw a slur knowing the start and stop elements
	function draw_sls(s,		// start symbol
			sl,		// stop note
			snote) {	// optional start note
	    var	k, v, i, dir,
		path = [],
		enote = sl.note,
		s2 = enote.s			// end of slur

		if (last && s2.time > last.time)
			return			// will be drawn next time

		// if the slur continues on the next music line,
		// stop it on the invisible bar at end of current line
		if (tsnext && s2.time >= tsnext.time) {
			s.p_v.sls.push(sl);		// continuation on next line
			s2 = s.p_v.s_next.prev		// one voice
			while (s2.next)
				s2 = s2.next;		// search the ending bar
			sl = Object.create(sl);		// new slur
			sl.note = {
				s: s2
			}
		}

		// set the slur position
		switch (sl.ty & 0x07) {
		case C.SL_ABOVE: dir = 1; break
		case C.SL_BELOW: dir = -1; break
		default:
			if (s.v != s2.v)
				dir = -1	// always above ?
			else
				dir = slur_direction(s, s2);
			sl.ty &= ~0x07;
			sl.ty |= dir > 0 ? C.SL_ABOVE : C.SL_BELOW
			break
		}

		// build the path of the symbols under the slur
		if (s.v == s2.v) {
			v = s.v
		} if (!cur_sy.voices[s.v] || !cur_sy.voices[s2.v]) {
			v = s.v > s2.v ? s.v : s2.v
		} else if (dir *			// if slur on first voice
			(cur_sy.voices[s.v].range <= cur_sy.voices[s2.v].range ?
				1 : -1) > 0)
			v = s.v
		else
			v = s2.v

		if (gr1				// if start on a grace note
		 && !(s2.grace			// and not end in the same
		   && s.v == s2.v		// grace note sequence
		   && s.time == s2.time)) {
			do {
				path.push(s);	// add all grace notes
				s = s.next
			} while (s);
			s = gr1.next
		} else {
			path.push(s);
			if (s.grace)
				s = s.next
			else
				s = s.ts_next
		}

		if (!s2.grace) {		// if end on a normal note
			while (s) {
				if (s.v == v)
					path.push(s)
				if (s == s2)
					break
				s = s.ts_next
			}
		} else if (s.grace) {		// if start/end in the same sequence
			while (1) {
//				if (s.v == v)
					path.push(s)
				if (s == s2)
					break
				s = s.next
			}
		} else {			// end on a grace note
			k = s2
			while (k.prev)
				k = k.prev	// .extra pointer
			while (1) {
				if (s.v == v)
					path.push(s)
				if (s.extra == k)
					break
				s = s.ts_next
			}
			s = k
			while (1) {
				path.push(s)
				if (s == s2)
					break
				s = s.next
			}
		}

		// if some nested slurs/tuplets, draw them
		for (i = 1; i < path.length - 1; i++) {
			s = path[i]
			if (s.sls || s.sl1)
				draw_slurs(s, last)
			if (s.tp)
				draw_tuplet(s)
		}
		draw_slur(path, snote, sl)
		return 1			// slur drawn, remove it
	} // draw_sls()

	// code of draw_slurs()
	while (1) {
		if (!s || s == last) {
			if (!gr1		// if end of grace notes
			 || !(s = gr1.next)	// return to normal notes
			 || s == last)
				break
			gr1 = null
		}
		if (s.type == C.GRACE) {	// if start of grace notes
			gr1 = s;		// continue in the grace note sequence
			s = s.extra
			continue
		}
		if (s.sls) {			// slurs from the chord
			sls = s.sls
			s.sls = null
			nsls = []
			for (i = 0; i < sls.length; i++) {
				if (!draw_sls(s, sls[i]))
					nsls.push(sls[i])
			}
			if (nsls.length)
				s.sls = nsls
		}
		if (s.sl1) {			// slurs from the note heads
			for (m = 0; m <= s.nhd; m++) {
				note = s.notes[m]
				if (note.sls) {
					sls = note.sls
					note.sls = null
					nsls = []
					for (i = 0; i < sls.length; i++) {
						if (!draw_sls(s, sls[i], note))
							nsls.push(sls[i])
					}
					if (nsls.length)
						note.sls = nsls
				}
			}
		}
		s = s.next
	}
}

/* -- draw a tuplet -- */
/* (the staves are not yet defined) */
/* (delayed output) */
/* See http://moinejf.free.fr/abcm2ps-doc/tuplets.xhtml
 * for the value of 'tp.f' */
function draw_tuplet(s1) {
    var	s2, s3, g, upstaff, nb_only, some_slur,
	x1, x2, y1, y2, xm, ym, a, s0, yy, yx, dy, a, dir, r,
	tp = s1.tp.shift()		// tuplet parameters

	if (!s1.tp.length)
		delete s1.tp		// last tuplet

	// treat the slurs and the nested tuplets
	upstaff = s1.st
	set_dscale(s1.st)
	for (s2 = s1; s2; s2 = s2.next) {
		if (s2.type != C.NOTE && s2.type != C.REST) {
			if (s2.type == C.GRACE) {
				for (g = s2.extra; g; g = g.next) {
					if (g.sls || g.sl1)
						draw_slurs(g)
				}
			}
			continue
		}
		if (s2.sls || s2.sl1)
			draw_slurs(s2)
		if (s2.st < upstaff)
			upstaff = s2.st
		if (s2.tp)
			draw_tuplet(s2)
		if (s2.tpe)
			break
	}

	if (s2)
		s2.tpe--

	if (tp.f[0] == 1)		// if 'when' == never
		return			// accept tuplets on many lines

	if (!s2) {
		error(1, s1, "No end of tuplet in this music line")
		return
	}

	dir = tp.f[3]				// 'where'
	if (!dir) {				// if auto
		s3 = s1
		while (s3.type != C.NOTE)
			s3 = s3.next
		dir = s3.stem > 0 ? C.SL_ABOVE : C.SL_BELOW
	}

	if (s1 == s2				// tuplet with 1 note (!)
	 || tp.f[1] == 2) {			// what == nothing
		nb_only = true
	} else if (tp.f[1] == 1) {			/* 'what' == slur */
		nb_only = true;
		draw_slur([s1, s2], null, {ty: dir})
	} else {

		/* search if a bracket is needed */
		if (tp.f[0] != 2		// if 'when' != always
		 && s1.type == C.NOTE && s2.type == C.NOTE) {
			nb_only = true
			for (s3 = s1; ; s3 = s3.next) {
				if (s3.type != C.NOTE
				 && s3.type != C.REST) {
					if (s3.type == C.GRACE
					 || s3.type == C.SPACE)
						continue
					nb_only = false
					break
				}
				if (s3 == s2)
					break
				if (s3.beam_end) {
					nb_only = false
					break
				}
			}
			if (nb_only
			 && !s1.beam_st
			 && !s1.beam_br1
			 && !s1.beam_br2) {
				for (s3 = s1.prev; s3; s3 = s3.prev) {
					if (s3.type == C.NOTE
					 || s3.type == C.REST) {
						if (s3.nflags >= s1.nflags)
							nb_only = false
						break
					}
				}
			}
			if (nb_only && !s2.beam_end) {
				for (s3 = s2.next; s3; s3 = s3.next) {
					if (s3.type == C.NOTE
					 || s3.type == C.REST) {
						if (!s3.beam_br1
						 && !s3.beam_br2
						 && s3.nflags >= s2.nflags)
							nb_only = false
						break
					}
				}
			}
		}
	}

	/* if number only, draw it */
	if (nb_only) {
		if (tp.f[2] == 1)		/* if 'which' == none */
			return
		xm = (s2.x + s1.x) / 2
		a = s2.x - s1.x			// width around the middle
		if (dir == C.SL_ABOVE)
			ym = y_get(upstaff, 1, xm - a / 2, a)
		else
			ym = y_get(upstaff, 0, xm - a / 2, a) - 8

		if (s1.stem * s2.stem > 0) {
			if (s1.stem > 0)
				xm += 1.5
			else
				xm -= 1.5
		}

		if (tp.f[2] == 0)		/* if 'which' == number */
			out_bnum(xm, ym, tp.p)
		else
			out_bnum(xm, ym, tp.p + ':' + tp.q)

		for (s3 = s1; ; s3 = s3.next) {
			if (s3.x >= xm)
				break
		}
		if (dir == C.SL_ABOVE) {
			ym += 12
			if (s3.ymx < ym)
				s3.ymx = ym;
			y_set(upstaff, true, xm - 3, 6, ym)
		} else {
			if (s3.ymn > ym)
				s3.ymn = ym;
			y_set(upstaff, false, xm - 3, 6, ym)
		}
		return
	}

	// here, what is square bracket

/*fixme: two staves not treated*/
/*fixme: to optimize*/

	// first, get the x offsets
	x1 = s1.x - 4

	// end the bracket according to the last note duration
	if (s2.dur > s2.prev.dur) {
		s3 = s2.next
		if (!s3	// maybe a note in an overlay voice
		 || s3.time != s2.time + s2.dur) {
			for (s3 = s2.ts_next; s3; s3 = s3.ts_next) {
				if (s3.seqst
				 && s3.time >= s2.time + s2.dur)
					break
			}
		}
//fixme: s3 cannot be null (bar at end of staff)
		x2 = s3 ? s3.x - s3.wl - 5 : realwidth - 6
	} else {
		x2 = s2.x + 4
		r = s2.stem >= 0 ? 0 : s2.nhd
		if (s2.notes[r].shhd > 0)
			x2 += s2.notes[r].shhd
		if (s2.st == upstaff
		 && s2.stem > 0)
			x2 += 3.5
	}

    // above
    if (dir == C.SL_ABOVE) {

	/* sole or upper voice: the bracket is above the staff */
	if (s1.st == s2.st) {
		y1 = y2 = staff_tb[upstaff].topbar + 2
	} else {
		y1 = s1.ymx;
		y2 = s2.ymx
	}

	if (s1.st == upstaff) {
		for (s3 = s1; !s3.dur; s3 = s3.next)
			;
		ym = y_get(upstaff, 1, s3.x - 4, 8)
		if (ym > y1)
			y1 = ym
		if (s1.stem > 0)
			x1 += 3
	}

	if (s2.st == upstaff) {
		for (s3 = s2; !s3.dur; s3 = s3.prev)
			;
		ym = y_get(upstaff, 1, s3.x - 4, 8)
		if (ym > y2)
			y2 = ym
	}

	xm = .5 * (x1 + x2);
	ym = .5 * (y1 + y2);

	a = (y2 - y1) / (x2 - x1);
	s0 = 3 * (s2.notes[s2.nhd].pit - s1.notes[s1.nhd].pit) / (x2 - x1)
	if (s0 > 0) {
		if (a < 0)
			a = 0
		else if (a > s0)
			a = s0
	} else {
		if (a > 0)
			a = 0
		else if (a < s0)
			a = s0
	}
	if (a * a < .1 * .1)
		a = 0

	/* shift up bracket if needed */
	dy = 0
	for (s3 = s1; ; s3 = s3.next) {
		if (!s3.dur			/* not a note or a rest */
		 || s3.st != upstaff) {
			if (s3 == s2)
				break
			continue
		}
		yy = ym + (s3.x - xm) * a;
		yx = y_get(upstaff, 1, s3.x - 4, 8) + 2
		if (yx - yy > dy)
			dy = yx - yy
		if (s3 == s2)
			break
	}

	ym += dy;
	y1 = ym + a * (x1 - xm);
	y2 = ym + a * (x2 - xm);

	/* shift the slurs / decorations */
	ym += 8
	for (s3 = s1; ; s3 = s3.next) {
		if (s3.st == upstaff) {
			yy = ym + (s3.x - xm) * a
			if (s3.ymx < yy)
				s3.ymx = yy
			if (s3 == s2)
				break
			y_set(upstaff, true, s3.x, s3.next.x - s3.x, yy)
		} else if (s3 == s2) {
			break
		}
	}

    // below
    } else {	/* lower voice of the staff: the bracket is below the staff */
/*fixme: think to all of that again..*/
	if (s1.stem < 0)
		x1 -= 2

	if (s1.st == upstaff) {
		for (s3 = s1; !s3.dur; s3 = s3.next)
			;
		y1 = y_get(upstaff, 0, s3.x - 4, 8)
	} else {
		y1 = 0
	}
	if (s2.st == upstaff) {
		for (s3 = s2; !s3.dur; s3 = s3.prev)
			;
		y2 = y_get(upstaff, 0, s3.x - 4, 8)
	} else {
		y2 = 0
	}

	xm = .5 * (x1 + x2);
	ym = .5 * (y1 + y2);

	a = (y2 - y1) / (x2 - x1);
	s0 = 3 * (s2.notes[0].pit - s1.notes[0].pit) / (x2 - x1)
	if (s0 > 0) {
		if (a < 0)
			a = 0
		else if (a > s0)
			a = s0
	} else {
		if (a > 0)
			a = 0
		else if (a < s0)
			a = s0
	}
	if (a * a < .1 * .1)
		a = 0

	/* shift down the bracket if needed */
	dy = 0
	for (s3 = s1; ; s3 = s3.next) {
		if (!s3.dur			/* not a note nor a rest */
		 || s3.st != upstaff) {
			if (s3 == s2)
				break
			continue
		}
		yy = ym + (s3.x - xm) * a;
		yx = y_get(upstaff, 0, s3.x - 4, 8)
		if (yx - yy < dy)
			dy = yx - yy
		if (s3 == s2)
			break
	}

	ym += dy - 8
	y1 = ym + a * (x1 - xm);
	y2 = ym + a * (x2 - xm);

	/* shift the slurs / decorations */
	ym -= 2
	for (s3 = s1; ; s3 = s3.next) {
		if (s3.st == upstaff) {
			if (s3 == s2)
				break
			yy = ym + (s3.x - xm) * a
			if (s3.ymn > yy)
				s3.ymn = yy;
			y_set(upstaff, false, s3.x, s3.next.x - s3.x, yy)
		}
		if (s3 == s2)
			break
	}
    } /* lower voice */

	if (tp.f[2] == 1) {			/* if 'which' == none */
		out_tubr(x1, y1 + 4, x2 - x1, y2 - y1, dir == C.SL_ABOVE);
		return
	}
	out_tubrn(x1, y1, x2 - x1, y2 - y1, dir == C.SL_ABOVE,
		tp.f[2] == 0 ? tp.p.toString() : tp.p + ':' +  tp.q);

	if (dir == C.SL_ABOVE)
		y_set(upstaff, true, xm - 3, 6, yy + 2)
	else
		y_set(upstaff, false, xm - 3, 6, yy)
}

/* -- draw the ties between two notes/chords -- */
function draw_note_ties(not1, job) {
    var	m, x1, x2, s, y, h, time,
	not2 = not1.tie_n,
	p = job == 2 ? not1.pit : not2.pit,
	dir = (not1.tie_ty & 0x07) == C.SL_ABOVE ? 1 : -1,
	s1 = not1.s,
	st = s1.st,
	s2 = not2.s,
	x2 = s2.x,
	sh = not1.shhd			// head shift

	for (m = 0; m < s1.nhd; m++)
		if (s1.notes[m] == not1)
			break
	if (dir > 0) {
		if (m < s1.nhd && p + 1 == s1.notes[m + 1].pit)
			if (s1.notes[m + 1].shhd > sh)
				sh = s1.notes[m + 1].shhd
	} else {
		if (m > 0 && p == s1.notes[m - 1].pit + 1)
			if (s1.notes[m - 1].shhd > sh)
				sh = s1.notes[m - 1].shhd
	}
	x1 = s1.x + sh // * .6

	if (job != 2) {
		for (m = 0; m < s2.nhd; m++)
			if (s2.notes[m] == not2)
				break
		sh = s2.notes[m].shhd
		if (dir > 0) {
			if (m < s2.nhd && p + 1 == s2.notes[m + 1].pit)
				if (s2.notes[m + 1].shhd < sh)
					sh = s2.notes[m + 1].shhd
		} else {
			if (m > 0 && p == s2.notes[m - 1].pit + 1)
				if (s2.notes[m - 1].shhd < sh)
					sh = s2.notes[m - 1].shhd
		}
		x2 += sh // * .6
	}

	switch (job) {
	case 0:
		p = (not1.pit & 1) ? not1.pit : not2.pit
		break
	case 3:				/* clef or staff change */
		dir = -dir
		// fall thru
	case 1:				/* no starting note */
		x1 = s1.x
		if (x1 > x2 - 20)
			x1 = x2 - 20
		p = not2.pit
		st = s2.st
		break
/*	case 2:				 * no ending note */
	default:
		if (s1 != s2) {
			x2 -= s2.wl
			if (s2.type == C.BAR)
				x2 += 5
		} else {
			time = s1.time + s1.dur
			for (s = s1.ts_next; s; s = s.ts_next)
//(fixme: must check if the staff continues??)
				if (s.time > time)
					break
			x2 = s ? s.x : realwidth
		}
		if (x2 < x1 + 16)
			x2 = x1 + 16
		break
	}
	if (x2 - x1 > 20) {
		x1 += 3.5
		x2 -= 3.5
	} else {
		x1 += 1.5
		x2 -= 1.5
	}

	if (s1.dots && !(not1.pit & 1)
	 && ((dir > 0 && !s1.dot_low)
	  || (dir < 0 && s1.dot_low)))
		x1 += 5

	y = staff_tb[st].y + 3 * (p - 18) + /* 1.0 * */ dir

	h = (.03 * (x2 - x1) + 16) * dir * cfmt.tieheight
//	anno_start(k1, 'slur')
	slur_out(x1, y, x2, y, dir, h, not1.tie_ty & C.SL_DOTTED)
//	anno_stop(k1, 'slur')
}

/* -- draw ties between neighboring notes/chords -- */
function draw_ties(k1, k2,
			job) {	// 0: normal
				// 1: no starting note
				// 2: no ending note
				// 3: no start for clef or staff change
    var	k3, i, j, not1, not3, time, pit, pit2,
	mhead3 = [],
	nh1 = k1.nhd

	/* half ties from last note in line or before new repeat */
	if (job == 2) {
		for (i = 0; i <= nh1; i++) {
			not1 = k1.notes[i]
			if (not1.tie_ty) {
				k3 = not1.tie_n
				not1.tie_n = { s: k2 || k1 }
				draw_note_ties(not1, job)
				not1.tie_n = k3
			}
		}
		return
	}

	// draw the ties or memorize the ones without ending
	for (i = 0; i <= nh1; i++) {
		not1 = k1.notes[i]
		if (!not1.tie_ty)
			continue
		if (!not1.s)
			not1.s = k1
		if (not1.tie_n)
			draw_note_ties(not1, job)
		else
			mhead3.push(not1)	/* no match */
	}

	/* if any bad tie, try an other voice of the same staff */
	if (!mhead3.length)
		return				/* no bad tie */

	time = k1.time + k1.dur
	k3 = k1.ts_next
	if (job != 1)
		job = 0
	while (k3 && k3.time < time)
		k3 = k3.ts_next
	while (k3 && k3.time == time) {
		if (k3.type != C.NOTE
		 || k3.st != k1.st) {
			k3 = k3.ts_next
			continue
		}
		for (i = mhead3.length; --i >= 0; ) {
			not1 = mhead3[i]
			pit = not1.opit || not1.pit
			for (j = k3.nhd; j >= 0; j--) {
				not3 = k3.notes[j]
				pit2 = not3.opit || not3.pit
				if (pit2 == pit) {
					not1.tie_n = not3
					if (!not3.s)
						not3.s = k3
					draw_note_ties(not1, job)
					mhead3.splice(i, 1)
					break
				}
			}
		}
		if (!mhead3.length)
			break
		k3 = k3.ts_next
	}

	if (mhead3.length)
		error(1, k1, "Bad tie")
}

/* -- draw all ties between neighboring notes -- */
function draw_all_ties(p_voice) {
    var s, s1, s2, clef_chg, time, x, dx, s_next, m

	function draw_ties_g(s1, s2, job) {
		if (s1.type == C.GRACE) {
			for (var g = s1.extra; g; g = g.next) {
				if (g.tie_s)
					draw_ties(g, s2, job)
			}
		} else {
			draw_ties(s1, s2, job)
		}
	} // draw_ties_g()

	/* search the start of ties */
//	clef_chg = false
	s_next = p_voice.sym
	set_color(s_next.color)
	while (1) {
		for (s1 = s_next; s1; s1 = s1.next) {
			if (s1.ti2			// if no tie start
			 && (s1 != s_next
			  || !s_next.prev)) {		// (at start of line)
				s = s1.ti2
				s.x = s1.x
				s2 = s.next
				s.next = s1
				s.st = s1.st
				s.time = s1.time - s.dur
				draw_ties(s, s1, 1)
				s.next = s2	// restore the linkage for play
			}
			if (s1.tie_s)
				break
		}
		if (!s1)
			break

		// check if the tied note is in this line
		s2 = s1.tie_s				// ending note of the tie
		if (s2.v == s1.v) {
			s_next = s2
			s = s1
			while (1) {
				if (!s.next) {
					s2 = s
					s = null
					break
				}
				s = s.next
				if (s == s2)
					break
			}
		} else {
			s_next = s1.next
			s = s1
			while (1) {
				if (!s.ts_next) {
					s = null
					break
				}
				s = s.ts_next
				if (s == s2)
					break
			}
			if (!s) {
				s2 = s1
				while (s2.next)
					s2 = s2.next
			}
		}

		if (!s) {				// end of line
			draw_ties_g(s1, s2, 2);
			break
		}

		// check if some clef changes (may occur in an other voice)
		time = s1.time + s.dur
		for (s = s1.ts_next; s != s2; s = s.ts_next) {
			if (s.st != s1.st)
				continue
			if (s.time > time)
				break
			if (s.type == C.CLEF) {
				clef_chg = true
				break
			}
		}

		/* ties with clef or staff change */
		if (clef_chg || s1.st != s2.st) {
			clef_chg = false;
			dx = (s2.x - s1.x) * .4;
			x = s2.x;
			s2.x -= dx
			if (s2.x > s1.x + 32.)
				s2.x = s1.x + 32.;
			draw_ties_g(s1, s2, 2);
			s2.x = x;
			x = s1.x;
			s1.x += dx
			if (s1.x < s2.x - 24.)
				s1.x = s2.x - 24.;
			draw_ties(s1, s2, 3);
			s1.x = x
			continue
		}
		draw_ties_g(s1, s2, s2.type == C.NOTE ? 0 : 2)
	}
}

/* -- draw the symbols near the notes -- */
/* (the staves are not yet defined) */
/* order:
 * - scaled
 *   - beams
 *   - decorations near the notes
 *   - measure bar numbers
 *   - decorations tied to the notes
 *   - tuplets and slurs
 * - not scaled
 *   - chord symbols
 *   - staff decorations
 *   - lyrics
 *   - measure numbers
 * The buffer output is delayed until the definition of the staff system
 */
function draw_sym_near() {
    var	p_voice, p_st, s, v, st, y, g, w, i, st, dx, top, bot,
	output_sav = output;

	output = ""

	/* calculate the beams but don't draw them (the staves are not yet defined) */
	for (v = 0; v < voice_tb.length; v++) {
		var	bm = {},
			first_note = true;

		p_voice = voice_tb[v]
		for (s = p_voice.sym; s; s = s.next) {
			switch (s.type) {
			case C.GRACE:
				for (g = s.extra; g; g = g.next) {
					if (g.beam_st && !g.beam_end)
						self.calculate_beam(bm, g)
				}
				break
			case C.NOTE:
				if ((s.beam_st && !s.beam_end)
				 || (first_note && !s.beam_st)) {
					first_note = false;
					self.calculate_beam(bm, s)
				}
				break
			}
		}
	}

	/* initialize the min/max vertical offsets */
	for (st = 0; st <= nstaff; st++) {
		p_st = staff_tb[st]
		if (!p_st.top) {
			p_st.top = new Float32Array(YSTEP);
			p_st.bot = new Float32Array(YSTEP)
		}
		for (i = 0; i < YSTEP; i++) {
			p_st.top[i] = 0;
			p_st.bot[i] = 24
		}
//		p_st.top.fill(0.);
//		p_st.bot.fill(24.)
	}

	set_tie_room();
	draw_deco_near()

	/* set the min/max vertical offsets */
	for (s = tsfirst; s; s = s.ts_next) {
		if (s.invis)
			continue
		switch (s.type) {
		case C.GRACE:
			for (g = s.extra; g; g = g.next) {
				y_set(s.st, true, g.x - 2, 4, g.ymx + 1);
				y_set(s.st, false, g.x - 2, 4, g.ymn - 1)
			}
			continue
		case C.MREST:
			y_set(s.st, true, s.x + 16, 32, s.ymx + 2)
			continue
		default:
			y_set(s.st, true, s.x - s.wl, s.wl + s.wr, s.ymx + 2);
			y_set(s.st, false, s.x - s.wl, s.wl + s.wr, s.ymn - 2)
			continue
		case C.NOTE:
			break
		}

		// (permit closer staves)
		if (s.stem > 0) {
			if (s.stemless) {
				dx = -5;
				w = 10
			} else if (s.beam_st) {
				dx = 3;
				w = s.beam_end ? 4 : 10
			} else {
				dx = -8;
				w = s.beam_end ? 11 : 16
			}
			y_set(s.st, true, s.x + dx, w, s.ymx);
			y_set(s.st, false, s.x - s.wl, s.wl + s.wr, s.ymn)
		} else {
			y_set(s.st, true, s.x - s.wl, s.wl + s.wr, s.ymx);
			if (s.stemless) {
				dx = -5;
				w = 10
			} else if (s.beam_st) {
				dx = -6;
				w = s.beam_end ? 4 : 10
			} else {
				dx = -8;
				w = s.beam_end ? 5 : 16
			}
			dx += s.notes[0].shhd;
			y_set(s.st, false, s.x + dx, w, s.ymn)
		}

		/* have room for the accidentals */
		if (s.notes[s.nhd].acc) {
			y = s.y + 8
			if (s.ymx < y)
				s.ymx = y;
			y_set(s.st, true, s.x, 0, y)
		}
		if (s.notes[0].acc) {
			y = s.y
			if (s.notes[0].acc == 1		// sharp
			 || s.notes[0].acc == 3)	// natural
				y -= 7
			else
				y -= 5
			if (s.ymn > y)
				s.ymn = y;
			y_set(s.st, false, s.x, 0, y)
		}
	}

	draw_deco_note()

	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v];
		s = p_voice.sym
		if (!s)
			continue
		set_color(s.color);
		st = p_voice.st;
//  if (st == undefined) {
//error(1, s, "BUG: no staff for voice " + p_voice.id)
//    continue
//  }

		// draw the slurs and tuplets
		for ( ; s; s = s.next) {
			if (s.tp)
				draw_tuplet(s)
			if (s.sls || s.sl1)
				draw_slurs(s)
		}
	}
	set_color()

	/* set the top and bottom out of the staves */
	for (st = 0; st <= nstaff; st++) {
		p_st = staff_tb[st];
		top = p_st.topbar + 2;
		bot = p_st.botbar - 2
/*fixme:should handle stafflines changes*/
		for (i = 0; i < YSTEP; i++) {
			if (top > p_st.top[i])
				p_st.top[i] = top
			if (bot < p_st.bot[i])
				p_st.bot[i] = bot
		}
	}

	if (cfmt.measurenb >= 0)
		draw_measnb();
	draw_deco_staff();

	/* if any lyric, draw them now as unscaled */
	set_dscale(-1)
//	set_sscale(-1)
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (p_voice.have_ly) {
			draw_all_lyrics()
			break
		}
	}

	set_dscale(-1);
	output = output_sav
}

/* -- draw the name/subname of the voices -- */
function draw_vname(indent, stl) {
    var	p_voice, n, st, v, a_p, p, y, name_type, h, h2,
	staff_d = []

	for (st = stl.length; st >= 0; st--) {
		if (stl[st])
			break
	}
	if (st < 0)
		return

	// check if full or sub names
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (!p_voice.sym || !cur_sy.voices[v])
			continue
		st = cur_sy.voices[v].st
		if (!stl[st])
			continue
		if (p_voice.new_name) {
			name_type = 2
			break
		}
		if (p_voice.snm)
			name_type = 1
	}
	if (!name_type)
		return
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (!p_voice.sym || !cur_sy.voices[v])
			continue
		st = cur_sy.voices[v].st
		if (!stl[st])
			continue
		if (p_voice.new_name)
			delete p_voice.new_name;
		p = name_type == 2 ? p_voice.nm : p_voice.snm
		if (!p)
			continue
		if (!staff_d[st])
			staff_d[st] = p
		else
			staff_d[st] += "\\n" + p
	}
	if (staff_d.length == 0)
		return
	set_font("voice");
	h = gene.curfont.size
	h2 = h / 2
	indent = -indent * .5			/* center */
	for (st = 0; st < staff_d.length; st++) {
		if (!staff_d[st])
			continue
		a_p = staff_d[st].split('\\n');
		y = staff_tb[st].y
			+ staff_tb[st].topbar * .5
				* staff_tb[st].staffscale
			+ h2 * (a_p.length - 2)

		// if instrument with 2 staves, center the voice name
		if ((cur_sy.staves[st].flags & OPEN_BRACE)
		 && (cur_sy.staves[st + 1].flags & CLOSE_BRACE)
		 && !staff_d[st + 1])
			y -= (staff_tb[st].y - staff_tb[st + 1].y) * .5
		for (n = 0; n < a_p.length; n++) {
			p = a_p[n];
			xy_str(indent, y, p, "c");
			y -= h
		}
	}
}

// -- set the y offset of the staves and return the height of the whole system --
function set_staff() {
var	s, i, st, prev_staff, v,
	y, staffsep, dy, maxsep, mbot, val, p_voice, p_staff,
	sy = cur_sy

	/* set the scale of the voices */
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (p_voice.scale != 1)
			p_voice.scale_str = 
				'transform="scale(' + p_voice.scale.toFixed(2) + ')"'
	}

	// search the top staff
	for (st = 0; st <= nstaff; st++) {
		if (gene.st_print[st])
			break
	}
	y = 0
	if (st > nstaff) {
		st--;			/* one staff, empty */
		p_staff = staff_tb[st]
	} else {
		p_staff = staff_tb[st]
		for (i = 0; i < YSTEP; i++) {
			val = p_staff.top[i]
			if (y < val)
				y = val
		}
	}

	/* draw the parts and tempo indications if any */
	y += draw_partempo(st, y)

	if (!gene.st_print[st])
		return y;

	/* set the vertical offset of the 1st staff */
	y *= p_staff.staffscale;
	staffsep = cfmt.staffsep * .5 +
			p_staff.topbar * p_staff.staffscale
	if (y < staffsep)
		y = staffsep
	if (y < p_staff.ann_top)	// absolute annotation
		y = p_staff.ann_top;
	p_staff.y = -y;

	/* set the offset of the other staves */
	prev_staff = st
	var sy_staff_prev = sy.staves[prev_staff]
	for (st++; st <= nstaff; st++) {
		if (!gene.st_print[st])
			continue
		p_staff = staff_tb[st]
		staffsep = sy_staff_prev.sep || cfmt.sysstaffsep;
		maxsep = sy_staff_prev.maxsep || cfmt.maxsysstaffsep;

		dy = 0
		if (p_staff.staffscale == staff_tb[prev_staff].staffscale) {
			for (i = 0; i < YSTEP; i++) {
				val = p_staff.top[i] -
						staff_tb[prev_staff].bot[i]
				if (dy < val)
					dy = val
			}
			dy *= p_staff.staffscale
		} else {
			for (i = 0; i < YSTEP; i++) {
				val = p_staff.top[i] * p_staff.staffscale
				  - staff_tb[prev_staff].bot[i]
					* staff_tb[prev_staff].staffscale
				if (dy < val)
					dy = val
			}
		}
		staffsep += p_staff.topbar * p_staff.staffscale
		if (dy < staffsep)
			dy = staffsep;
		maxsep += p_staff.topbar * p_staff.staffscale
		if (dy > maxsep)
			dy = maxsep;
		y += dy;
		p_staff.y = -y;

		prev_staff = st;
		while (1) {
			sy_staff_prev = sy.staves[prev_staff]
			if (sy_staff_prev)
				break
			sy = sy.next
		}
	}
	mbot = 0
	for (i = 0; i < YSTEP; i++) {
		val = staff_tb[prev_staff].bot[i]
		if (mbot > val)
			mbot = val
	}
	if (mbot > p_staff.ann_bot) 	// absolute annotation
		mbot = p_staff.ann_bot;
	mbot *= staff_tb[prev_staff].staffscale

	/* output the staff offsets */
	for (st = 0; st <= nstaff; st++) {
		p_staff = staff_tb[st];
		dy = p_staff.y
		if (p_staff.staffscale != 1) {
			p_staff.scale_str =
				'transform="translate(0,' +
					(posy - dy).toFixed(1) + ') ' +
				'scale(' + p_staff.staffscale.toFixed(2) + ')"'
		}
	}

	if (mbot == 0) {
		for (st = nstaff; st >= 0; st--) {
			if (gene.st_print[st])
				break
		}
		if (st < 0)		/* no symbol in this system ! */
			return y
	}
	dy = -mbot;
	staffsep = cfmt.staffsep * .5
	if (dy < staffsep)
		dy = staffsep;
	maxsep = cfmt.maxstaffsep * .5
	if (dy > maxsep)
		dy = maxsep;

	// return the height of the whole staff system
	return y + dy
}

/* -- draw the staff systems and the measure bars -- */
function draw_systems(indent) {
	var	s, s2, st, x, x2, res, sy,
		staves_bar, bar_force,
		xstaff = [],
		stl = [],		// all staves in the line
		bar_bot = [],
		bar_height = [],
		ba = [],		// bars [symbol, bottom, height]
		sb = [],
		thb = []

	/* -- set the bottom and height of the measure bars -- */
	function bar_set() {
		var	st, staffscale, top, bot,
			dy = 0

		for (st = 0; st <= cur_sy.nstaff; st++) {
			if (xstaff[st] < 0) {
				bar_bot[st] = bar_height[st] = 0
				continue
			}
			staffscale = staff_tb[st].staffscale;
			top = staff_tb[st].topbar * staffscale;
			bot = staff_tb[st].botbar * staffscale
			if (dy == 0)
				dy = staff_tb[st].y + top;
			bar_bot[st] = staff_tb[st].y + bot;
			bar_height[st] = dy - bar_bot[st];
			dy = (cur_sy.staves[st].flags & STOP_BAR) ?
					0 : bar_bot[st]
		}
	} // bar_set()

	/* -- draw a staff -- */
	function draw_staff(st, x1, x2) {
		var	w, ws, i, dy, ty,
			y = 0,
			ln = "",
			stafflines = staff_tb[st].stafflines,
			l = stafflines.length

		if (!/[\[|]/.test(stafflines))
			return				// no line
		w = x2 - x1;
		set_sscale(st);
		ws = w / stv_g.scale

		// check if default staff
		if (cache && cache.st_l == stafflines
		 && cache.st_ws == (ws | 0)) {
			xygl(x1, staff_tb[st].y, 'stdef' + cfmt.fullsvg)
			return
		}
		for (i = 0; i < l; i++, y -= 6) {
			if (stafflines[i] == '.')
				continue
			dy = 0
			for (; i < l; i++, y -= 6, dy -= 6) {
				switch (stafflines[i]) {
				case '.':
				case '-':
					continue
				case ty:
					ln += 'm-' + ws.toFixed(1) +
						' ' + dy +
						'h' + ws.toFixed(1);
					dy = 0
					continue
				}
				if (ty != undefined)
					ln += '"/>\n';
				ty = stafflines[i]
				ln += '<path class="' +
					(ty == '[' ? 'slthW' : 'slW') +
					'" d="m0 ' + y + 'h' + ws.toFixed(1);
				dy = 0
			}
			ln += '"/>'
		}
		y = staff_tb[st].y
		if (!cache
		 && w > get_lwidth() - 10) {
			cache = {
				st_l: stafflines,
				st_ws: ws | 0
			}
			i = 'stdef' + cfmt.fullsvg;
			if (ln.indexOf('<path', 1) < 0)
				glyphs[i] = ln.replace('path', 'path id="' + i + '"')
			else
				glyphs[i] = '<g id="' + i + '">\n' + ln + '\n</g>';
			xygl(x1, y, i)
			return
		}
		out_XYAB('<g transform="translate(X, Y)">\n' + ln + '\n</g>\n', x1, y)
	} // draw_staff()

	// draw a measure bar
	function draw_bar(s, bot, h) {
	    var	i, s2, yb, w,
		bar_type = s.bar_type,
		st = s.st,
		p_staff = staff_tb[st],
		x = s.x

		// don't put a line between the staves if there is no bar above
		if (st != 0
		 && s.ts_prev
//fixme: 's.ts_prev.st != st - 1' when floating voice in lower staff
//	 && (s.ts_prev.type != C.BAR || s.ts_prev.st != st - 1))
		 && s.ts_prev.type != C.BAR)
			h = p_staff.topbar * p_staff.staffscale;

		s.ymx = s.ymn + h;

		anno_start(s)
		if (s.color)
			set_color(s.color);

		// compute the middle vertical offset of the staff
		yb = p_staff.y + 12;
		if (p_staff.stafflines != '|||||')
			yb += (p_staff.topbar + p_staff.botbar) / 2 - 12 // bottom

		// if measure repeat, draw the '%' like glyphs
		if (s.bar_mrep) {
			set_sscale(st)
			if (s.bar_mrep == 1) {
				for (s2 = s.prev; s2.type != C.REST; s2 = s2.prev)
					;
				xygl(s2.x, yb, "mrep")
			} else {
				xygl(x, yb, "mrep2")
				if (s.v == cur_sy.top_voice)
					xy_str(x, yb + p_staff.topbar - 9,
						s.bar_mrep.toString(), "c")
			}
		}

		if (bar_type == '||:')
			bar_type = '[|:'

		for (i = bar_type.length; --i >= 0; ) {
			switch (bar_type[i]) {
			case "|":
				if (s.bar_dotted) {
					set_sscale(-1);
					w = (5 * p_staff.staffscale).toFixed(1);
					out_XYAB(
			'<path class="bW" stroke-dasharray="A,A" d="MX Yv-G"/>\n',
						x, bot, w, h)
				} else if (s.color) {
					out_XYAB('<path class="bW" d="MX Yv-F"/>\n',
						x, bot, h)
				} else {
					sb.push(new Float32Array([x, bot, h]))
				}
				break
			default:
//			case "[":
//			case "]":
				x -= 3;
				if (s.color)
					out_XYAB('<path class="bthW" d="MX Yv-F"/>\n',
						x + 1.5, bot, h)
				else
					thb.push(new Float32Array([x + 1.5, bot, h]))
				break
			case ":":
				x -= 2;
				set_sscale(st);
				xygl(x + 1, yb - 12, "rdots")
				break
			}
			x -= 3
		}
		set_color();
		anno_stop(s)
	} // draw_bar()

	// output all the bars
	function out_bars() {
	    var	i, b, bx,
		l = ba.length

		set_font("annotation");
		if (gene.curfont.box) {
			gene.curfont.box = false
			bx = true
		}
		for (i = 0; i < l; i++) {
			b = ba[i];		// symbol, bottom, height
			draw_bar(b[0], b[1], b[2])
		}
		if (bx)
			gene.curfont.box = true

		set_sscale(-1)
		l = sb.length
		if (l) {			// single bars [x, y, h]
			output += '<path class="bW" d="'
			for (i = 0; i < l; i++) {
				b = sb[i];
				out_XYAB('MX Yv-F', b[0], b[1], b[2])
			}
			output += '"/>\n'
		}

		l = thb.length
		if (l) {			// thick bars [x, y, h]
			output += '<path class="bthW" d="'
			for (i = 0; i < l; i++) {
				b = thb[i];
				out_XYAB('MX Yv-F', b[0], b[1], b[2])
			}
			output += '"/>\n'
		}
	} // out_bars()

	// ---- draw_systems() ----

	/* draw the staff, skipping the staff breaks */
	for (st = 0; st <= nstaff; st++) {
		xstaff[st] = !cur_sy.st_print[st] ? -1 : 0;
		stl[st] = cur_sy.st_print[st]	// staff in the line
	}
	bar_set();
	draw_lstaff(0)
	for (s = tsfirst; s; s = s.ts_next) {
		if (bar_force && s.time != bar_force) {
			bar_force = 0
			for (st = 0; st <= nstaff; st++) {
				if (!cur_sy.st_print[st])
					xstaff[st] = -1
			}
			bar_set()
		}
		switch (s.type) {
		case C.STAVES:
			staves_bar = s.ts_prev.type == C.BAR ? s.ts_prev.x : 0
		    if (!staves_bar) {
			for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
				if (s2.time != s.time)
					break
				switch (s2.type) {
				case C.BAR:
				case C.CLEF:
				case C.KEY:
				case C.METER:
					staves_bar = s2.x
					continue
				}
				break
			}
			if (!s2)
				staves_bar = realwidth;
		    }
			sy = s.sy
			for (st = 0; st <= nstaff; st++) {
				x = xstaff[st]
				if (x < 0) {		// no staff yet
					if (sy.st_print[st]) {
						xstaff[st] = staves_bar ?
							staves_bar : (s.x - s.wl - 2)
						stl[st] = true
					}
					continue
				}
				if (sy.st_print[st]	// if not staff stop
				 && sy.staves[st].stafflines ==
						cur_sy.staves[st].stafflines)
					continue
				if (staves_bar) {
					x2 = staves_bar;
					bar_force = s.time
				} else {
					x2 = s.x - s.wl - 2;
					xstaff[st] = -1
				}
				draw_staff(st, x, x2)
				if (sy.st_print[st])
					xstaff[st] = x2
			}
			cur_sy = sy;
			bar_set()
			continue
		case C.BAR:		// display the bars after the staves
			if (s.second || s.invis || !s.bar_type)
				break
			ba.push([s, bar_bot[s.st], bar_height[s.st]])
			break
		case C.STBRK:
			if (cur_sy.voices[s.v]
			 && cur_sy.voices[s.v].range == 0) {
				if (s.xmx > 14) {

					/* draw the left system if stbrk in all voices */
					var nv = 0
					for (var i = 0; i < voice_tb.length; i++) {
						if (cur_sy.voices[i]
						  && cur_sy.voices[i].range > 0)
							nv++
					}
					for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
						if (s2.type != C.STBRK)
							break
						nv--
					}
					if (nv == 0)
						draw_lstaff(s.x)
				}
			}
			st = s.st;
			x = xstaff[st]
			if (x >= 0) {
				s2 = s.prev
				if (!s2)
					break
				x2 = s2.type == C.BAR ?
					s2.x :
					s.x - s.xmx
				if (x >= x2)
					break
				draw_staff(st, x, x2)
				xstaff[st] = s.x
			}
			break
//		default:
//fixme:does not work for "%%staves K: M: $" */
//removed for K:/M: in empty staves
//			if (!cur_sy.st_print[st])
//				s.invis = true
//			break
		}
	}

	// draw the end of the staves
	for (st = 0; st <= nstaff; st++) {
		if (bar_force && !cur_sy.st_print[st])
			continue
		x = xstaff[st]
		if (x < 0 || x >= realwidth)
			continue
		draw_staff(st, x, realwidth)
	}

	// and the bars
	out_bars()

	draw_vname(indent, stl)

//	set_sscale(-1)
}

/* -- draw remaining symbols when the staves are defined -- */
// (possible hook)
Abc.prototype.draw_symbols = function(p_voice) {
	var	bm = {},
		s, g, x, y, st;

//	bm.s2 = undefined
	for (s = p_voice.sym; s; s = s.next) {
		if (s.invis) {
			switch (s.type) {
			case C.KEY:
				p_voice.ckey = s
			default:
				continue
			case C.NOTE:	// (beams may start on invisible notes)
				break
			}
		}
		st = s.st
		x = s.x;
		set_color(s.color)
		switch (s.type) {
		case C.NOTE:
//--fixme: recall set_scale if different staff
			set_scale(s)
			if (s.beam_st && !s.beam_end) {
				if (self.calculate_beam(bm, s))
					draw_beams(bm)
			}
			if (!s.invis) {
				anno_start(s);
				draw_note(s, !bm.s2);
				anno_stop(s)
			}
			if (s == bm.s2)
				bm.s2 = null
			break
		case C.REST:
			if (!staff_tb[st].topbar)
				break
			draw_rest(s);
			break
		case C.BAR:
			break			/* drawn in draw_systems */
		case C.CLEF:
			if (s.time >= staff_tb[st].clef.time)
				staff_tb[st].clef = s
			if (s.second
			 || !staff_tb[st].topbar)
				break
			set_color();
			set_sscale(st);
			anno_start(s);
			y = staff_tb[st].y
			if (s.clef_name)
				xygl(x, y + s.y, s.clef_name)
			else if (!s.clef_small)
				xygl(x, y + s.y, s.clef_type + "clef")
			else
				xygl(x, y + s.y, "s" + s.clef_type + "clef")
			if (s.clef_octave) {
/*fixme:break the compatibility and avoid strange numbers*/
				if (s.clef_octave > 0) {
					y += s.ymx - 10
					if (s.clef_small)
						y -= 1
				} else {
					y += s.ymn + 6
					if (s.clef_small)
						y += 1
				}
				xygl(x - 2, y, "oct")
			}
			anno_stop(s)
			break
		case C.METER:
			p_voice.meter = s
			if (s.second
			 || !staff_tb[s.st].topbar)
				break
			set_color();
			set_sscale(s.st);
			anno_start(s);
			draw_meter(s);
			anno_stop(s)
			break
		case C.KEY:
			p_voice.ckey = s
			if (s.second
			 || !staff_tb[s.st].topbar)
				break
			set_color();
			set_sscale(s.st);
			anno_start(s);
			self.draw_keysig(x, s);
			anno_stop(s)
			break
		case C.MREST:
			set_scale(s);
			x += 32;
			anno_start(s);
			xygl(x, staff_tb[s.st].y + 12, "mrest");
			out_XYAB('<text style="font:bold 15px serif"\n\
	x ="X" y="Y" text-anchor="middle">A</text>\n',
				x, staff_tb[s.st].y + 28, s.nmes);
			anno_stop(s)
			break
		case C.GRACE:
			set_scale(s);
			draw_gracenotes(s)
			break
		case C.SPACE:
		case C.STBRK:
			break			/* nothing */
		case C.CUSTOS:
			set_scale(s);
			draw_note(s, 0)
			break
		case C.BLOCK:			// no width
		case C.PART:
		case C.REMARK:
		case C.STAVES:
		case C.TEMPO:
			break
		default:
			error(2, s, "draw_symbols - Cannot draw symbol " + s.type)
			break
		}
	}
	set_scale(p_voice.sym);
}

/* -- draw all symbols -- */
function draw_all_sym() {
	var	p_voice, v,
		n = voice_tb.length

	// draw all the helper/ledger lines
	function draw_all_hl() {
	    var	st, p_st

		function hlud(hla, d) {
		    var	hl, hll, i, xp, dx2, x2,
			n = hla.length

			if (!n)
				return
			for (i = 0; i < n; i++) {	// for all lines
				hll = hla[i]
				if (!hll || !hll.length)
					continue
				xp = sx(hll[0][0])	// previous x
				output +=
				    '<path class="stroke" stroke-width="1" d="M' +
					xp.toFixed(1) + ' ' +
					sy(p_st.y + d * i).toFixed(1)
				dx2 = 0
				while (1) {
					hl = hll.shift()
					if (!hl)
						break
					x2 = sx(hl[0])
					output += 'm' +
						(x2 - xp + hl[1] - dx2).toFixed(1) +
						' 0h' + (-hl[1] + hl[2]).toFixed(1)
					xp = x2
					dx2 = hl[2]
				}
				output += '"/>\n'
			}
		} // hlud()

		for (st = 0; st <= nstaff; st++) {
			p_st = staff_tb[st]
			if (!p_st.hlu)
				continue	// (staff not yet displayed)
			set_sscale(st)
			hlud(p_st.hlu, 6)
			hlud(p_st.hld, -6)
		}
	} // draw_all_hl()

	for (v = 0; v < n; v++) {
		p_voice = voice_tb[v]
		if (p_voice.sym
		 && p_voice.sym.x != undefined) {
			self.draw_symbols(p_voice)
			draw_all_ties(p_voice);
// no need to reset the scale as in abcm2ps
			set_color()
		}
	}

	draw_all_deco();
	draw_all_hl()
	set_sscale(-1)				/* restore the scale */
}

/* -- set the tie directions for one voice -- */
function set_tie_dir(s) {
    var i, ntie, dir, sec, pit, ty

	for ( ; s; s = s.next) {
		if (!s.tie_s)
			continue

		/* if other voice, set the ties in opposite direction */
		if (s.multi != 0) {
			dir = s.multi > 0 ? C.SL_ABOVE : C.SL_BELOW
			for (i = 0; i <= s.nhd; i++) {
				ty = s.notes[i].tie_ty
				if (!((ty & 0x07) == C.SL_AUTO))
					continue
				s.notes[i].tie_ty = (ty & C.SL_DOTTED) | dir
			}
			continue
		}

		/* if one note, set the direction according to the stem */
		sec = ntie = 0;
		pit = 128
		for (i = 0; i <= s.nhd; i++) {
			if (s.notes[i].tie_ty) {
				ntie++
				if (pit < 128
				 && s.notes[i].pit <= pit + 1)
					sec++;
				pit = s.notes[i].pit
			}
		}
		if (ntie <= 1) {
			dir = s.stem < 0 ? C.SL_ABOVE : C.SL_BELOW
			for (i = 0; i <= s.nhd; i++) {
				ty = s.notes[i].tie_ty
				if (ty) {
					if ((ty & 0x07) == C.SL_AUTO)
						s.notes[i].tie_ty =
							(ty & C.SL_DOTTED) | dir
					break
				}
			}
			continue
		}
		if (sec == 0) {
			if (ntie & 1) {
/* in chords with an odd number of notes, the outer noteheads are paired off
 * center notes are tied according to their position in relation to the
 * center line */
				ntie = (ntie - 1) / 2;
				dir = C.SL_BELOW
				for (i = 0; i <= s.nhd; i++) {
					ty = s.notes[i].tie_ty
					if (!ty)
						continue
					if (ntie == 0) {	/* central tie */
						if (s.notes[i].pit >= 22)
							dir = C.SL_ABOVE
					}
					if ((ty & 0x07) == C.SL_AUTO)
						s.notes[i].tie_ty =
							(ty & C.SL_DOTTED) | dir
					if (ntie-- == 0)
						dir = C.SL_ABOVE
				}
				continue
			}
/* even number of notes, ties divided in opposite directions */
			ntie /= 2;
			dir = C.SL_BELOW
			for (i = 0; i <= s.nhd; i++) {
				ty = s.notes[i].tie_ty
				if (!ty)
					continue
				if ((ty & 0x07) == C.SL_AUTO)
					s.notes[i].tie_ty =
						(ty & C.SL_DOTTED) | dir
				if (--ntie == 0)
					dir = C.SL_ABOVE
			}
			continue
		}
/*fixme: treat more than one second */
/*		if (nsec == 1) {	*/
/* When a chord contains the interval of a second, tie those two notes in
 * opposition; then fill in the remaining notes of the chord accordingly */
			pit = 128
			for (i = 0; i <= s.nhd; i++) {
				if (s.notes[i].tie_ty) {
					if (pit < 128
					 && s.notes[i].pit <= pit + 1) {
						ntie = i
						break
					}
					pit = s.notes[i].pit
				}
			}
			dir = C.SL_BELOW
			for (i = 0; i <= s.nhd; i++) {
				ty = s.notes[i].tie_ty
				if (!ty)
					continue
				if (ntie == i)
					dir = C.SL_ABOVE
				if ((ty & 0x07) == C.SL_AUTO)
					s.notes[i].tie_ty =
						(ty & C.SL_DOTTED) | dir
			}
/*fixme..
			continue
		}
..*/
/* if a chord contains more than one pair of seconds, the pair farthest
 * from the center line receives the ties drawn in opposition */
	}
}

/* -- have room for the ties out of the staves -- */
function set_tie_room() {
	var p_voice, s, s2, v, dx, y, dy

	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v];
		s = p_voice.sym
		if (!s)
			continue
		s = s.next
		if (!s)
			continue
		set_tie_dir(s)
		for ( ; s; s = s.next) {
			if (!s.tie_s)
				continue
			if (s.notes[0].pit < 20
			 && s.notes[0].tie_ty
			 && (s.notes[0].tie_ty & 0x07) == C.SL_BELOW)
				;
			else if (s.notes[s.nhd].pit > 24
			      && s.notes[s.nhd].tie_ty
			      && (s.notes[s.nhd].tie_ty & 0x07) == C.SL_ABOVE)
				;
			else
				continue
			s2 = s.next
			while (s2 && s2.type != C.NOTE)
				s2 = s2.next
			if (s2) {
				if (s2.st != s.st)
					continue
				dx = s2.x - s.x - 10
			} else {
				dx = realwidth - s.x - 10
			}
			if (dx < 100)
				dy = 9
			else if (dx < 300)
				dy = 12
			else
				dy = 16
			if (s.notes[s.nhd].pit > 24) {
				y = 3 * (s.notes[s.nhd].pit - 18) + dy
				if (s.ymx < y)
					s.ymx = y
				if (s2 && s2.ymx < y)
					s2.ymx = y;
				y_set(s.st, true, s.x + 5, dx, y)
			}
			if (s.notes[0].pit < 20) {
				y = 3 * (s.notes[0].pit - 18) - dy
				if (s.ymn > y)
					s.ymn = y
				if (s2 && s2.ymn > y)
					s2.ymn = y;
				y_set(s.st, false, s.x + 5, dx, y)
			}
		}
	}
}
