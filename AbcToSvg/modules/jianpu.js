// jianpu.js - module to output jiănpŭ (简谱) music sheets
//
// Copyright (C) 2020 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%jianpu" appears in a ABC source.
//
// Parameters (none)
//	%%jianpu 1

abc2svg.jianpu = {

  k_tb: [ "Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F",
	  "C",
	  "G", "D", "A", "E", "B", "F#", "C#" ],
  cde2fcg: new Int8Array([0, 2, 4, -1, 1, 3, 5]),
  cgd2cde: new Int8Array([0, -4, -1, -5, -2, -6, -3,
			  0, -4, -1, -5, -2, -6, -3, 0]),
  acc2: new Int8Array([-2, -1, 3, 1, 2]),
  acc_tb: ["\ue264", "\ue260", , "\ue262", "\ue263", "\ue261"],

// change %%staves and %%score
  do_pscom: function(of, p) {
	switch (p.match(/\w+/)[0]) {
	case 'staves':
	case 'score':
		p = p.replace(/\(|\)/g, '')
		break
	}
	of(p)
  },

// adjust some symbols before the generation
  output_music: function(of) {
    var	C = abc2svg.C,
	abc = this,
	cur_sy = abc.get_cur_sy(),
	voice_tb = abc.get_voice_tb()

	if (!abc.cfmt().jianpu) {
		of()
		return
	}

	// output the key and time signatures
	function set_head() {
	    var	tsfirst = abc.get_tsfirst(),
		p_v = voice_tb[0],
		mt = p_v.meter.a_meter[0],
		sk = p_v.key,
		s = {
			type: C.BLOCK,
			subtype: "text",
			dur: 0,
			v: 0,
			p_v: p_v,
			st: 0,
			seqst: true,
			text: (sk.k_mode + 1) + "=" +
				(abc2svg.jianpu.k_tb[sk.k_sf + 7 +
					abc2svg.jianpu.cde2fcg[sk.k_mode]])
		},
		s2 = voice_tb[0].sym

		if (mt)
			s.text += ' ' + (mt.bot ? (mt.top + '/' + mt.bot) : mt.top)

		s2.prev = s
		s.next = s2
		voice_tb[0].sym = s
		tsfirst.ts_prev = s
		s.ts_next = tsfirst
		abc.set_tsfirst(s)
	} // set head()

	// expand a long note/rest
	function slice(s) {
	    var	n, s2, s3

		if (s.dur >= C.BLEN)
			n = 3 
		else if (s.dur == C.BLEN / 2)
			n = 1
		else
			n = 2
		while (--n >= 0) {
			s2 = {
				type: C.REST,
				v: s.v,
				p_v: s.p_v,
				st: s.st,
				dur: C.BLEN / 4,
				dur_orig: C.BLEN / 4,
				stem: 0,
				multi: 0,
				nhd: 0,
				notes: [{
					pit: s.notes[0].pit,
					jn: 8
				}],
				xmx: 0,
				noplay: true,
				time: s.time + C.BLEN / 4,
				prev: s,
				next: s.next
			}
			s.next = s2
			if (s2.next)
				s2.next.prev = s2

			if (!s.ts_next) {
				s.ts_next = s2
				if (s.soln)
					s.soln = false
				s2.ts_prev = s
				s2.seqst = true
			} else {
			    for (s3 = s.ts_next; s3; s3 = s3.ts_next) {
				if (s3.time < s2.time)
					continue
				if (s3.time > s2.time) {
					s2.seqst = true
					s3 = s3.ts_prev
				}
				s2.ts_next = s3.ts_next
				s2.ts_prev = s3
				if (s2.ts_next)
					s2.ts_next.ts_prev = s2
				s3.ts_next = s2
				break
			    }
			}

			s = s2
		}
	} // slice()

	function set_sym(p_v) {
	    var s, s2, note, pit, nn, p, a, m, i,
		sf = p_v.key.k_sf
		delta = abc2svg.jianpu.cgd2cde[sf + 7] - 2

		p_v.key.k_a_acc = []	// no accidental

		// no (visible) clef
		p_v.clef.invis = true

		// scan the voice
		for (s = p_v.sym; s; s = s.next) {
			s.st = p_v.st
			switch (s.type) {
			case C.CLEF:
				s.invis = true
//				continue
			default:
				continue
			case C.KEY:
				delta = abc2svg.jianpu.cgd2cde[s.k_sf + 7] - 2
				s.a_gch = [{
					type: '@',
					font: abc.get_font("annotation"),
					wh: [10, 10],
					x: -5,
					y: 30,
					text: (s.k_mode + 1) + "=" +
						(abc2svg.jianpu.k_tb[s.k_sf + 7 +
							abc2svg.jianpu.cde2fcg[s.k_mode]])
				}]
				continue
			case C.REST:
				if (s.notes[0].jn)
					continue
				s.notes[0].jn = 0
				if (s.dur >= C.BLEN / 2)
					slice(s)
				continue
			case C.NOTE:			// change the notes
				break
			}

			s.stem = -1
			s.stemless = true

			for (m = 0; m <= s.nhd; m++) {
				note = s.notes[m]

				// note head
				p = note.pit
				pit = p + delta
				note.jn = ((pit + 77) % 7) + 1	// note number

				// set a fixed offset to the note for the decorations
				note.pit = 25			// "e"

				note.jo = (pit / 7) | 0	// octave number

				// accidentals
				a = note.acc
				if (a) {
					nn = abc2svg.jianpu.cde2fcg[(p + 5 + 16 * 7) % 7] - sf
					if (a != 3)
						nn += a * 7
					nn = ((((nn + 1 + 21) / 7) | 0) + 2 - 3 + 32 * 5) % 5
					note.acc = abc2svg.jianpu.acc2[nn]
				}

				// set the slurs and ties up
				if (s.sls) {
					for (i = 0; i < s.sls.length; i++)
						s.sls[i].ty = C.SL_ABOVE
				}
				if (note.sls) {
					for (i = 0; i < note.sls.length; i++)
						note.sls[i].ty = C.SL_ABOVE
				}
				if (note.tie_ty)
					note.tie_ty = C.SL_ABOVE

				// change the long notes
				if (s.dur >= C.BLEN / 2)
					slice(s)
			}

			// replace the staccato dot
			if (s.a_dd) {
				for (i = 0; i < s.a_dd.length; i++) {
					if (s.a_dd[i].glyph == "stc") {
						abc.deco_cnv(["gstc"], s)
						s.a_dd[i] = s.a_dd.pop()
					}
				}
			}
		}
	} // set_sym()

	// -- output_music --

	set_head()

	for (v = 0; v < voice_tb.length; v++)
		set_sym(voice_tb[v])

	of()
  }, // output_music()

  draw_symbols: function(of, p_voice) {
    var	i, m, nl, note, s, s2, x, y,
	C = abc2svg.C,
	abc = this,
	dot = "\ue1e7",
	staff_tb = abc.get_staff_tb(),
	out_svg = abc.out_svg,
	out_sxsy = abc.out_sxsy,
	xypath = abc.xypath

	if (!abc.cfmt().jianpu) {
		of(p_voice)
		return
	}

	// draw the duration lines under the notes
	function draw_dur(s1, y, s2, n, nl) {
	    var s, s3

		xypath(s1.x - 3, y + 5)
		out_svg('h' + (s2.x - s1.x + 8).toFixed(1) + '"/>\n')	// "
		y -= 2.5
		while (++n <= nl) {
			s = s1
			while (1) {
				if (s.nflags && s.nflags >= n) {
					s3 = s
					while (s != s2) {
						if (s.next.beam_br1
						 || (s.next.beam_br2 && n > 2)
						 || (s.next.nflags
						  && s.next.nflags < n))
							break
						s = s.next
					}
					draw_dur(s3, y, s, n, nl)
				}
				if (s == s2)
					break
				s = s.next
			}
		}
	} // draw_dur()

	function out_mus(x, y, p) {
		out_svg('<text x="')
		out_sxsy(x, '" y="', y)
		out_svg('">' + p + '</text>\n')
	} // out_txt()

	function out_txt(x, y, p) {
		out_svg('<text class="bn" x="')
		out_sxsy(x, '" y="', y)
		out_svg('">' + p + '</text>\n')
	} // out_txt()

	function draw_hd(s, x, y) {
	    var	m, note, ym

		for (m = 0; m <= s.nhd; m++) {
			note = s.notes[m]
			out_txt(x - 3.5, y + 8, "01234567-"[note.jn])
			if (note.acc)
				out_mus(x - 12, y + 12,
					abc2svg.jianpu.acc_tb[note.acc + 2])
			if (note.jo > 2) {
				out_mus(x - 1, y + 22, dot)
				if (note.jo > 3) {
					y += 3
					out_mus(x - 1, y + 22, dot)
				}
			} else if (note.jo < 2) {
				ym = y + 4
				if (m == 0 && s.nflags > 0)
					ym -= 2.5 * s.nflags
				out_mus(x - 1, ym, dot)
			}
			y += 20
		}
	} // draw_hd()

	// -- draw_symbols --

	for (s = p_voice.sym; s; s = s.next) {
		if (s.invis)
			continue
		switch (s.type) {
		case C.METER:
			abc.draw_meter(s)
			break
		case C.NOTE:
		case C.REST:
			x = s.x
			y = staff_tb[s.st].y
			draw_hd(s, x, y)

			if (s.nflags >= 0 && s.dots)
				out_mus(x + 8, y + 13, dot)
			if (s.nflags > 0) {
//fixme: ko with rests because no beam_st /_end
				if (s.beam_st || s.type == C.REST) {
					nl = s.nflags
					s2 = s
					while (1) {
						if (s2.nflags && s2.nflags > nl)
							nl = s2.nflags
						if (s2.beam_end)
							break
						if (!s2.next
						 || !s2.next.nflags
						 || s2.next.nflags <= 0)
							break
						s2 = s2.next
					}
					draw_dur(s, y, s2, 1, nl)
				}
			}
			break
		}
	}
  }, // draw_symbols()

// set some parameters
    set_fmt: function(of, cmd, param) {
	if (cmd == "jianpu") {
	    var	cfmt = this.cfmt()

		cfmt.jianpu = true
		cfmt.staffsep = 20
		cfmt.sysstaffsep = 14
		this.set_v_param("stafflines", "...")
		cfmt.tuplets = [0, 1, 0, 1]	// [auto, slur, number, above]
		return
	}
	of(cmd, param)
    }, // set_fmt()

// adjust some values
    set_pitch: function(of, last_s) {
	of(last_s)
	if (!last_s
	 || !this.cfmt().jianpu)
		return			// first time

    var	C = abc2svg.C
	
	for (var s = this.get_tsfirst(); s; s = s.ts_next) {
		switch (s.type) {

		// draw the key signature only in the first voice
		// and not at start of the staff
		case C.KEY:
			if (s.prev.type == C.CLEF
			 || s.v != 0)
				s.a_gch = null
			break

		// adjust the vertical spacing above the note heads
		case C.NOTE:
			s.ymx = 20 * s.nhd + 22
			if (s.notes[s.nhd].jo > 2) {
				s.ymx += 3
				if (s.notes[s.nhd].jo > 3)
					s.ymx += 2
			}
			break
		}
	}
    }, // set_pitch()

// set the width of some symbols
    set_width: function(of, s) {
	of(s)
	if (!this.cfmt().jianpu)
		return

    var	w, m, note,
	C = abc2svg.C

	switch (s.type) {
	case C.CLEF:
	case C.KEY:
//	case C.METER:
		s.wl = s.wr = 0
		break
	case C.NOTE:
		for (m = 0; m <= s.nhd; m++) {
			note = s.notes[m]
			if (note.acc && s.wl < 14)	// room for the accidental
				s.wl = 14
		}
		break
	}
    }, // set_width()

    set_hooks: function(abc) {
	abc.do_pscom = abc2svg.jianpu.do_pscom.bind(abc, abc.do_pscom)
	abc.draw_symbols = abc2svg.jianpu.draw_symbols.bind(abc, abc.draw_symbols)
	abc.output_music = abc2svg.jianpu.output_music.bind(abc, abc.output_music)
	abc.set_format = abc2svg.jianpu.set_fmt.bind(abc, abc.set_format)
	abc.set_pitch = abc2svg.jianpu.set_pitch.bind(abc, abc.set_pitch)
	abc.set_width = abc2svg.jianpu.set_width.bind(abc, abc.set_width)

	// big staccato dot
	abc.get_glyphs().gstc = '<circle id="gstc" cx="0" cy="-3" r="2"/>'
	abc.get_decos().gstc = "0 gstc 5 1 1"

	abc.add_style("\n.bn {font-family:sans-serif; font-size:15px}")
    } // set_hooks()
} // jianpu

abc2svg.modules.hooks.push(abc2svg.jianpu.set_hooks)

// the module is loaded
abc2svg.modules.jianpu.loaded = true
