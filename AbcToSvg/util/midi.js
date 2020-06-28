//#javascript
// Set the MIDI pitches in the notes
//
// Copyright (C) 2015-2020 Jean-Francois Moine
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

// Usage:
//	// Create a AbcMIDI object
//	var abcmidi = AbcMIDI()
//
//	// Define a get_abcmodel() callback function
//	// This one is called by abc2svg after ABC parsing 
//	user.get_abcmodel = my_midi_callback
//
//	// In this function
//	function my_midi_callback(tsfirst, voice_tb, music_types, info) {
//
//		// set the MIDI pitches
//		abcmidi.add(tsfirst, voice_tb);
//
//		// The MIDI pitches are stored in the notes
//		//	s.notes[i].midi
//	}

// AbcMIDI creation
function AbcMIDI() {
    var	C = abc2svg.C

	return {					// returned object
	  // add MIDI pitches
	  add: function(s,				// starting symbol
			voice_tb) {			// voice table
	    var p_v, s,
		temper = voice_tb[0].temper,		// (set by the module temper.js)
		v = voice_tb.length

		// initialize the clefs and keys
		while (--v >= 0) {
			p_v = voice_tb[v]
			if (!p_v.sym)
				continue
			if (p_v.key.k_bagpipe)
	// detune in cents for just intonation in A
	//  C    ^C     D    _E     E     F    ^F     G    _A     A    _B     B
	// 15.3 -14.0  -2.0 -10.0   1.9  13.3 -16.0 -31.8 -12.0   0.0  11.4   3.8
	// (C is ^C,			F is ^F and G is =G)
	// 86				 84
	// temp = [100-14, -14, -2, -10, 2, 100-16, -16, -32, -12, 0, 11, 4]
	// but 'A' bagpipe = 480Hz => raise Math.log2(480/440)*1200 = 151
				temper = new Float32Array([
	2.37, 1.37, 1.49, 1.41, 1.53, 2.35, 1.35, 1.19, 1.39, 1.51, 1.62, 1.55
				])

			s = p_v.clef
			vloop(p_v.sym,
				p_v.key.k_sndtran || 0,
				s.clef_octave && !s.clef_oct_transp ?
					(s.clef_octave / 7 * 40) : 0)
		}

	    function vloop(s, sndtran, ctrans) {
		var	i, g, note, dm

		function dm_set() {
			dm = abc2svg.b40m(sndtran + ctrans + 122) - 36
		}

		function midi_set(note) {
			note.midi += dm
		}

		dt_set()
		while (s) {
			switch (s.type) {
			case C.CLEF:
				ctrans = (s.clef_octave && !s.clef_oct_transp) ?
						(s.clef_octave / 7 * 40) : 0
				dm_set()
				break
			case C.KEY:
				if (s.k_sndtran != undefined) {
					sndtran = s.k_sndtran
					dm_set()
				}
				break
			case C.GRACE:
				if (dm)
				    for (g = s.extra; g; g = g.next) {
					for (i = 0; i <= g.nhd; i++)
						midi_set(g.notes[i])
				    }
				break
			case C.NOTE:
				if (dm)
				    for (i = 0; i <= s.nhd; i++)
					midi_set(s.notes[i])
				break
			}
			s = s.next
		}
	    } // vloop()
	  } // add()
	} // returned object
} // end AbcMidi
