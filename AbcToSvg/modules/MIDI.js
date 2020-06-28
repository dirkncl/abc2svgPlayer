// MIDI.js - module to handle the %%MIDI parameters
//
// Copyright (C) 2019-2020 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%MIDI" appears in a ABC source.
//
// Parameters (see abcMIDI for details)
//	%%MIDI channel n
//	%%MIDI program [channel] n
//	%%MIDI control k v
//	%%MIDI drummap ABC_note MIDI_pitch
//	%%MIDI tuningsystem comma53

// Using %%MIDI drummap creates a voicemap named "MIDIdrum".
// This name must be used if some print map is required:
//	%%MIDI drummap g 42
//	%%map MIDIdrum g heads=x
// A same effect may be done by
//	%%percmap g 42 x
// but this is not abcMIDI compatible!

abc2svg.MIDI = {

    // parse %%MIDI commands
    do_midi: function(parm) {

    // convert a ABC note to b40 (string)
    function abc_b40(p) {
    var	pit,
	acc = 0,
	i = 0

	switch (p[0]) {
	case '^':
		if (p[++i] == '^') {
			acc = 2
			i++
		} else {
			acc = 1
		}
		break
	case '=':
		i++
		break
	case '_':
		if (p[++i] == '_') {
			acc = -2
			i++
		} else {
			acc = -1
		}
		break
	}
	pit = 'CDEFGABcdefgab'.indexOf(p[i++]) + 16
	if (pit < 16)
		return
	while (p[i] == "'") {
		pit += 7
		i++
	}
	while (p[i] == ",") {
		pit -= 7
		i++
	}
	return abc2svg.pab40(pit, acc).toString()
    } // abc_b40()

	function mid_pit(p) {
	    var	b40,
		pit = p
		p = (pit / 12) | 0		// octave
		pit = pit % 12;			// in octave
		b40 = p * 40 + abc2svg.isb40[pit] + 2
		return {
			pit: abc2svg.b40p(b40),
			acc: abc2svg.b40a(b40)
		}
	}

    // do_midi()
    var	n, v, s, maps,
	o, q, n, qs,
	a = parm.split(/\s+/),
	curvoice = this.get_curvoice()

	if (curvoice) {
		if (curvoice.ignore)
			return
		if (curvoice.chn == undefined)
			curvoice.chn = curvoice.v < 9 ?
					curvoice.v :
					curvoice.v + 1
	}
	switch (a[1]) {
	case "channel":
		v = parseInt(a[2])
		if (isNaN(v) || v <= 0 || v > 16) {
			this.syntax(1, this.errs.bad_val, "%%MIDI channel")
			break
		}
		if (--v != 9) {			// channel range 1..16 => 0..15
			if (this.parse.state == 3) {
				s = this.new_block("midichn");
				s.play = true
				s.chn = v
			} else {
				this.set_v_param("channel", v)
			}
			break
		}

		// channel 10 is bank 128
		abc2svg.MIDI.do_midi.call(this, "MIDI control 0 1")	// MSB bank
		abc2svg.MIDI.do_midi.call(this, "MIDI control 32 0")	// LSB bank
		break
	case "drummap":
//fixme: should have a 'MIDIdrum' per voice?
		n = abc_b40(a[2])
		v = Number(a[3])
		if (!n || !v) {
			this.syntax(1, this.errs.bad_val, "%%MIDI drummap")
			break
		}
		maps = this.get_maps()
		if (!maps.MIDIdrum)
			maps.MIDIdrum = {}
		if (!maps.MIDIdrum[n])
			maps.MIDIdrum[n] = []
		maps.MIDIdrum[n][3] = mid_pit(v)
		this.set_v_param("mididrum", "MIDIdrum")
		break
	case "program":
		if (a[3] != undefined) {	// with a channel
			abc2svg.MIDI.do_midi.call(this, "MIDI channel " + a[2])
			v = a[3]
		} else {
			v = a[2];
		}
		v = parseInt(v)
		if (isNaN(v) || v < 0 || v > 127) {
			this.syntax(1, this.errs.bad_val, "%%MIDI program")
			break
		}
		if (this.parse.state == 3) {
			s = this.new_block("midiprog");
			s.play = true
			s.instr = v
		} else {
			this.set_v_param("instr", v)
		}
		break
	case "control":
		n = parseInt(a[2])
		if (isNaN(n) || n < 0 || n > 127) {
			this.syntax(1, "Bad controller number in %%MIDI")
			break
		}
		v = parseInt(a[3])
		if (isNaN(v) || v < 0 || v > 127) {
			this.syntax(1, "Bad controller value in %%MIDI")
			break
		}
		if (this.parse.state == 3) {
			s = this.new_block("midictl");
			s.play = true
			s.ctrl = n;
			s.val = v
		} else {
			this.set_v_param("midictl", a[2] + ' ' + a[3])
		}
		break
	case "temperamentequal":
		n = parseInt(a[2])
		if (isNaN(n) || n < 7 || n > 127) {
			this.syntax(1, errs.bad_val, "%%MIDI " + a[2])
			return
		}

		// define the Turkish accidentals (53-TET)
		if (n == 53) {
			s = this.get_glyphs()

// #1
			s.acc12_53 = '<text id="acc12_53" x="-1">&#xe282;</text>'

// #2
			s.acc24_53 = '<text id="acc24_53" x="-1">&#xe282;\
	<tspan x="0" y="-10" style="font-size:8px">2</tspan></text>'

// #3
			s.acc36_53 = '<text id="acc36_53" x="-1">&#xe262;\
	<tspan x="0" y="-10" style="font-size:8px">3</tspan></text>'

// #4
			s.acc48_53 = '<text id="acc48_53" x="-1">&#xe262;</text>'

// #5
			s.acc60_53 = '<g id="acc60_53">\n\
	<text style="font-size:1.2em" x="-1">&#xe282;</text>\n\
	<path class="stroke" stroke-width="1.6" d="M-2 1.5l7 -3"/>\n\
</g>'

// b5
			s["acc-60_53"] = '<text id="acc-60_53" x="-1">&#xe260;</text>'

// b4
			s["acc-48_53"] = '<g id="acc-48_53">\n\
	<text x="-1">&#xe260;</text>\n\
	<path class="stroke" stroke-width="1" d="M-3 -5.5l5 -2"/>\n\
</g>'

// b3
			s["acc-36_53"] = '<g id="acc-36_53">\n\
	<text x="-1">&#xe260;\
		<tspan x="0" y="-10" style="font-size:8px">3</tspan></text>\n\
	<path class="stroke" stroke-width="1" d="M-3 -5.5l5 -2"/>\n\
</g>'

// b2
			s["acc-24_53"] = '<text id="acc-24_53" x="-2">&#xe280;\
	<tspan x="0" y="-10" style="font-size:8px">2</tspan></text>'

// b1
			s["acc-12_53"] = '<text id="acc-12_53" x="-2">&#xe280;</text>'
		}

		// define the detune values
		q = 7.019550008653874	// Math.log(3/2)/Math.log(2) * 12
					// = just intonation fifth
		o = 12			// octave
		this.cfmt().nedo = n	// octave divider
		qs = ((n * q / o + .5) | 0) * o / n	// new fifth

		s = new Float32Array(12)
		this.cfmt().temper = s	// detune in cents / 12-TET
		s[0] = 0			// C
		s[2] = 2 * qs - o		// D
		s[4] = 4 * qs - 2 * o		// E
		s[5] = -qs + o			// F
		s[7] = qs			// G
		s[9] = 3 * qs - o		// A
		s[11] = 5 * qs - 2 * o		// B
		break
	}
    }, // do_midi()

    // set the MIDI parameters in the current voice
    set_vp: function(of, a) {
    var	i, item,
	curvoice = this.get_curvoice()

	for (i = 0; i < a.length; i++) {
		switch (a[i]) {
		case "channel=":		// %%MIDI channel
			curvoice.chn = a[++i]
			break
		case "instr=":			// %%MIDI program
			curvoice.instr = a[++i]
			break
		case "midictl=":		// %%MIDI control
			if (!curvoice.midictl)
				curvoice.midictl = []
			item = a[++i].split(' ');
			curvoice.midictl[item[0]] = Number(item[1])
			break
		case "mididrum=":		// %%MIDI drummap note midipitch
			if (!curvoice.map)
				curvoice.map = {}
			curvoice.map = a[++i]
			break
		}
	}
	of(a)
    }, // set_vp()

    do_pscom: function(of, text) {
	if (text.slice(0, 5) == "MIDI ")
		abc2svg.MIDI.do_midi.call(this, text)
	else
		of(text)
    },

    set_hooks: function(abc) {
	abc.do_pscom = abc2svg.MIDI.do_pscom.bind(abc, abc.do_pscom);
	abc.set_vp = abc2svg.MIDI.set_vp.bind(abc, abc.set_vp)
    }
} // MIDI

abc2svg.modules.hooks.push(abc2svg.MIDI.set_hooks);

// the module is loaded
abc2svg.modules.MIDI.loaded = true
