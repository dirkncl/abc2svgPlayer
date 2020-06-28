// mdnn.js - module to output Modernised Diatonic Numerical Notation
// (https://medium.com/@info_70544/the-case-for-numerical-music-notation-part-1-introduction-and-history-5f1543ca8a95)
//
// Copyright (C) 2020 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%mdnn" appears in a ABC source.
//
// Parameters
//	(none)
//
//fixme:nsk
// - Non Standard Key signature - other way to display the accidentals on key change

// polyfill
if (typeof Object.assign !== 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target === null || target === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource !== null && nextSource !== undefined) { 
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

abc2svg.mdnn = {

  cde2fcg: new Int8Array([0, 2, 4, -1, 1, 3, 5]),
  cgd2cde: new Int8Array([0, -4, -1, -5, -2, -6, -3,
			  0, -4, -1, -5, -2, -6, -3, 0]),
  acc_tb: ["aff", "af", "n", "s", "ss"],

  glyphs: {
	n1: '<text id="n1" class="bn" x="-1.5" y="16">1</text>',
	n2: '<text id="n2" class="bn" x="-1.5" y="16">2</text>',
	n3: '<text id="n3" class="bn" x="-1.5" y="16">3</text>',
	n4: '<text id="n4" class="bn" x="-1.5" y="16">4</text>',
	n5: '<text id="n5" class="bn" x="-1.5" y="16">5</text>',
	n6: '<text id="n6" class="bn" x="-1.5" y="16">6</text>',
	n7: '<text id="n7" class="bn" x="-1.5" y="16">7</text>',
	nq: '<text id="nq" class="bn" x="8" y="16">\'</text>',
	nc: '<text id="nc" class="bn" x="8" y="16">,</text>',
	nh: '<path id="nh" class="stroke" d="m3.5 0l-7.2 0 0 -6.2 7.2 0"/>',
	nw: '<path id="nw" class="stroke" d="m6 -5l-7.2 0 0 -6.2 7.2 0 0 6.2"/>',
	aff: '<text id="aff" class="music" x="-8" y="11">&#xe264;</text>',
	af: '<text id="af" class="music" x="-8" y="11">&#xe260;</text>',
	nn: '<text id="nn" class="music" x="-8" y="11">&#xe261;</text>',
	ns: '<text id="ns" class="music" x="-8" y="11">&#xe262;</text>',
	nss: '<text id="nss" class="music" x="-8" y="11">&#xe263;</text>'
  }, //glyphs

  decos: {
	n1: "9 n1 0 0 0",
	n2: "9 n2 0 0 0",
	n3: "9 n3 0 0 0",
	n4: "9 n4 0 0 0",
	n5: "9 n5 0 0 0",
	n6: "9 n6 0 0 0",
	n7: "9 n7 0 0 0",
	q: "0 nq 0 0 0",
	c: "0 nc 0 0 0",
	h: "0 nh 0 0 0",
	w: "0 nw 0 0 0",
	aff: "0 aff 0 0 0",
	af: "0 af 0 0 0",
	n: "0 nn 0 0 0",
	s: "0 ns 0 0 0",
	ss: "0 nss 0 0 0"
  }, // decos

  // change the voices into MDNN
//fixme: actually, one voice only
  output_music: function(of) {
    var	C = abc2svg.C,
	abc = this,
	cfmt = abc.cfmt(),
	cur_sy = abc.get_cur_sy(),
	voice_tb = abc.get_voice_tb(),
	sf = voice_tb[0].key.k_sf,
	delta = abc2svg.mdnn.cgd2cde[sf + 7] - 2
    var s, s2, note, pit, nn, p, a, i,
	prev_oct = -10

	if (!cfmt.mdnn) {
		of()
		return
	}

	voice_tb[0].key.k_a_acc = []	// no accidental
	voice_tb[0].clef.invis = true	// no (visible) clef
	cur_sy.staves[0].stafflines = "..." // empty staff

	// scan the first voice of the tune
	for (s = voice_tb[0].sym; s; s = s.next) {
		switch (s.type) {
		case C.CLEF:
			s.invis = true
			continue
		case C.KEY:
//fixme:nsk
//			s.k_a_acc = []		// don't display the accidentals
			sf = s.k_sf
			delta = abc2svg.mdnn.cgd2cde[sf + 7] - 2
			nn = sf - s.k_old_sf	// delta accidentals
//fixme:nsk
//			if (!nn) {
//				s.k_old_sf = s.k_sf = 0 // don't display the accidentals
//				continue
//			}

//fixme:comment if nsk
			// display normal accidentals
			s.k_old_sf = 0
			s.k_sf = nn
			continue

//fixme:nsk
//			// display '[' <accidentals ']'
//			s2 = s
//// other solution
////			s2 = {
////				type: C.SPACE,
////				v: s.v,
////				p_v: s.p_v,
////				st: s.st,
////				dur: 0,
////				seqst: true,
////				invis: true,
////				time: s.time,
////				prev: s,
////				ts_prev: s,
////				next: s.next,
////				ts_next: s.ts_next
////			}
////			s.next = s2
////			s.ts_next = s2
////			if (s2.next)
////				s2.next.prev = s2
////			if (s2.ts_next)
////				s2.ts_next.ts_prev = s2
//			abc.set_font("annotation")
//			s2.a_gch = []
//			s2.a_gch[0] = {
//				type: '@',
//				font: abc.get_font("annotation"),
//				wh: [10,10],
//				y: -6,
////				text: '[' + (nn > 0 ?
////		"\u266f\u266f\u266f\u266f\u266f\u266f".slice(0, nn) :
////		"\u266d\u266d\u266d\u266d\u266d\u266d".slice(0, -nn)) +
////					']'
//				text: '[' + (nn > 0 ?
//					nn + '\u266f' : (-nn) + '\u266d') +
//					']'
//			}
//			s2.width = abc.strwh(s2.a_gch[0].text + ' ')[0]
//			s2.a_gch[0].x = -s2.width / 2
//			s = s2
//			continue
		default:
			continue
		case C.NOTE:			// change the notes
			break
		}
		note = s.notes[0]

		// note head
		p = note.pit
		pit = p + delta
		nn = ((pit + 77) % 7) + 1	// note number
		if (!note.a_dcn)
			note.a_dcn = []
		note.a_dcn.push('n' + nn)

		// display the note as C5 with stem up
		note.pit = 23			// 'c'
		s.stem = 1

		// octave
		nn = (pit / 7) | 0
		if (nn > prev_oct) {
			if (prev_oct != -10) {
				if (!note.a_dcn)
					note.a_dcn = []
				note.a_dcn.push('q')
			}
			prev_oct = nn
		} else if (nn < prev_oct) {
			if (!note.a_dcn)
				note.a_dcn = []
			note.a_dcn.push('c')
			prev_oct = nn
		}

		// half and whole notes
		if (s.dur >= C.BLEN / 2) {
			if (!note.a_dcn)
				note.a_dcn = []
			note.a_dcn.push(s.dur >= C.BLEN ? 'w' : 'h')
		}

		// accidentals
		a = note.acc
		if (a) {
			note.acc = 0
			if (!note.a_dcn)
				note.a_dcn = []
			nn = abc2svg.mdnn.cde2fcg[(p + 5 + 16 * 7) % 7] - sf
			if (a != 3)
				nn += a * 7
			nn = ((((nn + 1 + 21) / 7) | 0) + 2 - 3 + 32 * 5) % 5
			note.a_dcn.push(abc2svg.mdnn.acc_tb[nn])
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
		if (note.tie_ty != undefined)
			note.tie_ty = C.SL_ABOVE
	}

	of()
  }, // output_music()

  set_fmt: function(of, cmd, param) {
	if (cmd == "mdnn")
		this.cfmt().mdnn = true
	else
		of(cmd, param)
  }, // set_fmt()

// don't display the key signature at start of staff
    set_pitch: function(of, last_s) {
	of(last_s)
	if (!last_s				// first time
	 || !this.cfmt().mdnn)
		return

    var	C = abc2svg.C,
	s = this.get_tsfirst()

	if (s && s.next && s.next.type == C.KEY)
//fixme:nsk
		s.next.k_a_acc = []
//		s.next.a_gch = null
    }, // set_pitch()

    set_hooks: function(abc) {
	abc.output_music = abc2svg.mdnn.output_music.bind(abc, abc.output_music)
	abc.set_format = abc2svg.mdnn.set_fmt.bind(abc, abc.set_format)
	abc.set_pitch = abc2svg.mdnn.set_pitch.bind(abc, abc.set_pitch)

	Object.assign(abc.get_glyphs(), abc2svg.mdnn.glyphs)
	Object.assign(abc.get_decos(), abc2svg.mdnn.decos)
	abc.add_style("\n.bn {font-family:sans-serif; font-size:15px}")
    }
} // mdnn

abc2svg.modules.hooks.push(abc2svg.mdnn.set_hooks)

// the module is loaded
abc2svg.modules.mdnn.loaded = true
