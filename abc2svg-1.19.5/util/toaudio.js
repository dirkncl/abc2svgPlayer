// toaudio.js - audio generation
//
// Copyright (C) 2015-2019 Jean-Francois Moine
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

// ToAudio creation
function ToAudio() {

  var  C = abc2svg.C,

  scale = new Uint8Array([0, 2, 4, 5, 7, 9, 11]),  // note to pitch conversion

  a_e,        // event array

  p_time,        // last playing time
  abc_time,      // last ABC time
  play_factor;      // play time factor

// ToAudio
  return {

// clear the playing events and
// return the old ones as an array of Float32Array:
//  [0]: index of the note in the ABC source
//  [1]: time in seconds
//  [2]: if >= 0: MIDI instrument (MIDI GM number - 1)
//    else: MIDI control message
//  [3]: MIDI note pitch (with cents) / controller
//  [4]: duration        / controller value
//  [5]: volume (0..1)
//  [6]: voice number
    clear: function() {
  var a_pe = a_e;
  a_e = null
  return a_pe
    }, // clear()

// add playing events from the ABC model
    add: function(start,    // starting symbol
     voice_tb) {    // voice table
  var  kmaps = [],    // accidentals per voice from key signature
    cmaps = [],    // current accidental table
    map,      // map of the current voice - 10 octaves
    temper,      // temperament
    i, n, dt, d, v,
    top_v,      // top voice
    rep_st_s,    // start of sequence to be repeated
    rep_en_s,    // end ("|1")
    rep_nx_s,    // restart at end of repeat
    rep_st_transp,    // transposition at start of repeat sequence
    rep_st_map,    // and map
    rep_st_fac,    // and play factor
    transp,      // clef transposition per voice
    instr = [],    // instrument per voice
    s = start

  // set the accidentals, transpositions and instruments of the voices
  function set_voices() {
      var v, p_v, s, mi

    temper = voice_tb[0].temper;  // (set by the module temper.js)
    transp = new Int8Array(voice_tb.length)
    for (v = 0; v < voice_tb.length; v++) {
      p_v = voice_tb[v];

      mi = p_v.instr || 0
      if (p_v.midictl) {
        p_v.midictl.forEach(function(val, i) {
          switch(i) {
          case 0:    // bank MSB
            mi += val * 128 * 128
            break
          case 32:  // bank LSB
            mi += val * 128
            break
          default:  // generate a MIDI control
            a_e.push(new Float32Array([
              p_v.sym.istart,
              1,  // (time)
              -1,  // MIDI control
              i,
              val,
              1,
              v]))
          }
        })
      }
      instr[v] = mi;      // MIDI instrument

      s = p_v.clef;
      transp[v] = (!s.clef_octave || s.clef_oct_transp) ?
          0 : s.clef_octave

      kmaps[v] = new Float32Array(70);
      cmaps[v] = new Float32Array(70);
      p_v.key.v = v;
      key_map(p_v.key)
    }
  } // set_voices()

  // define the accidentals of a voice
  function key_map(s) {
      var i, bmap

      if (s.k_bagpipe) {
    // detune for just intonation in A (C is C#, F is F# and G is Gnat)
//    bmap = new Float32Array([100-13.7, -2, 2, 100-15.6, -31.2, 0, 3.9])
//    for (i = 0; i < 7; i++)
//      bmap[i] = (bmap[i] + 150.6) / 100 // 'A' bagpipe = 480Hz
//        // 150.6 = (Math.log2(480/440) - 1)*1200
    bmap = new Float32Array([2.37, 1.49, 1.53, 2.35, 1.19, 1.51, 1.55])
      } else {
    bmap = new Float32Array(7)
    switch (s.k_sf) {
    case 7: bmap[6] = 1
    case 6: bmap[2] = 1
    case 5: bmap[5] = 1
    case 4: bmap[1] = 1
    case 3: bmap[4] = 1
    case 2: bmap[0] = 1
    case 1: bmap[3] = 1; break
    case -7: bmap[3] = -1
    case -6: bmap[0] = -1
    case -5: bmap[4] = -1
    case -4: bmap[1] = -1
    case -3: bmap[5] = -1
    case -2: bmap[2] = -1
    case -1: bmap[6] = -1; break
    }
      }
      for (i = 0; i < 10; i++)
    kmaps[s.v].set(bmap, i * 7);
      cmaps[s.v].set(kmaps[s.v])
  } // key_map()

  // convert ABC pitch to MIDI index
  function pit2mid(s, i) {
    var  note = s.notes[i],
      p = note.pit + 19,  // pitch from C-1
      a = note.acc

    if (transp[s.v])
      p += transp[s.v]
    if (a) {
      if (a == 3)    // (3 = natural)
        a = 0
      else if (note.micro_n)
        a = (a < 0 ? -note.micro_n : note.micro_n) /
            note.micro_d * 2;
      map[p] = a
    } else {
      a = map[p]
    }
    p = ((p / 7) | 0) * 12 + scale[p % 7] + a
    if (!temper || a | 0 != a)  // if equal temperament or micro-tone
      return p
    return p + temper[p % 12]
  } // pit2mid()

  // handle the ties
  function do_tie(s, note, d) {
    var  n,
      end_time = s.time + s.dur,
      pit = note.pit,
      p = pit + 19,
      a = note.acc

    if (transp[s.v])
      p += transp[s.v]

    // search the end of the tie
    for (s = s.next; ; s = s.next) {
      if (!s)
        return d

      // skip if end of sequence to be repeated
      if (s == rep_en_s) {
        var v = s.v;
        s = rep_nx_s.ts_next
        while (s && s.v != v)
          s = s.ts_next
        if (!s)
          return d
        end_time = s.time
      }
      if (s.time != end_time)
        return d
      if (s.type == C.NOTE)
        break
    }
    n = s.notes.length
    for (i = 0; i < n; i++) {
      note = s.notes[i]
      if (note.pit == pit) {
        d += s.dur / play_factor;
        note.ti2 = true
        return note.ti1 ? do_tie(s, note, d) : d
      }
    }
    return d
  } // do_tie()

  // generate the grace notes
  function gen_grace(s) {
    var  g, i, n, t, d, s2,
      next = s.next

    // before beat
    if (s.sappo) {
      d = C.BLEN / 16
    } else if ((!next || next.type != C.NOTE)
      && s.prev && s.prev.type == C.NOTE) {
      d = s.prev.dur / 2

    // on beat
    } else {

      // keep the sound elements in time order
      next.ts_prev.ts_next = next.ts_next;
      next.ts_next.ts_prev = next.ts_prev;
      for (s2 = next.ts_next; s2; s2 = s2.ts_next) {
        if (s2.time != next.time) {
          next.ts_next = s2
          next.ts_prev = s2.ts_prev;
          next.ts_prev.ts_next = next;
          s2.ts_prev = next
          break
        }
      }

//      if (!next.dots)
//        d = next.dur / 2
//      else if (next.dots == 1)
//        d = next.dur / 3
//      else
//        d = next.dur * 2 / 7;
      d = next.dur / 12
      if (d & (d - 1) == 0)
        d = next.dur / 2  // no dot
      else
        d = next.dur / 3;
      next.time += d;
      next.dur -= d
    }
    n = 0
    for (g = s.extra; g; g = g.next)
      if (g.type == C.NOTE)
        n++;
    d /= n * play_factor;
    t = p_time
    for (g = s.extra; g; g = g.next) {
      if (g.type != C.NOTE)
        continue
      gen_notes(g, t, d);
      t += d
    }
  } // gen_grace()

  // generate the notes
  function gen_notes(s, t, d) {
    for (var i = 0; i <= s.nhd; i++) {
        var  note = s.notes[i]
      if (note.ti2)
        continue
      a_e.push(new Float32Array([
        s.istart,
        t,
        instr[s.v],
        pit2mid(s, i),
        note.ti1 ? do_tie(s, note, d) : d,
        1,
        s.v]))
    }
  } // gen_note()

  // add() main

  set_voices();      // initialize the voice parameters

  if (!a_e) {      // if first call
    a_e = []
    abc_time = rep_st_t = p_time = 0;
    play_factor = C.BLEN / 4 * 120 / 60  // default: Q:1/4=120
  } else if (s.time < abc_time) {
    abc_time = rep_st_t = s.time
  }

  // loop on the symbols
  while (s) {
//    if (s.type == C.TEMPO
//     && s.tempo) {
    if (s.tempo) {        // tempo change
      d = 0;
      n = s.tempo_notes.length
      for (i = 0; i < n; i++)
        d += s.tempo_notes[i];
      play_factor = d * s.tempo / 60
    }

    dt = s.time - abc_time
    if (dt > 0) {
      p_time += dt / play_factor;
      abc_time = s.time
    }

    if (s == rep_en_s) {      // repeat end
      s = rep_nx_s;
      abc_time = s.time
    }

    map = cmaps[s.v]
    switch (s.type) {
    case C.BAR:
//fixme: does not work if different measures per voice
      if (s.v != top_v)
        break

      // right repeat
      if (s.bar_type[0] == ':') {
        s.bar_type = '|' +
           s.bar_type.slice(1); // don't repeat again
        rep_nx_s = s    // repeat next
        if (!rep_en_s)    // if no "|1"
          rep_en_s = s  // repeat end
        if (rep_st_s) {    // if left repeat
          s = rep_st_s
          for (v = 0; v < voice_tb.length; v++) {
            cmaps[v].set(rep_st_map[v]);
            transp[v] = rep_st_transp[v]
          }
          play_factor = rep_st_fac;
        } else {      // back to start
          s = start;
          set_voices();
        }
        abc_time = s.time
        break
      }

      if (!s.invis) {
        for (v = 0; v < voice_tb.length; v++)
          cmaps[v].set(kmaps[v])
      }

      // left repeat
      if (s.bar_type[s.bar_type.length - 1] == ':') {
        rep_st_s = s;
        rep_en_s = null
        for (v = 0; v < voice_tb.length; v++) {
          if (!rep_st_map)
            rep_st_map = []
          if (!rep_st_map[v])
            rep_st_map[v] =
              new Float32Array(70)
          rep_st_map[v].set(cmaps[v]);
          if (!rep_st_transp)
            rep_st_transp = []
          rep_st_transp[v] = transp[v]
        }
        rep_st_fac = play_factor
        break

      // 1st time repeat
      } else if (s.text && s.text[0] == '1') {
        rep_en_s = s
      }
      break
    case C.CLEF:
      transp[s.v] = (!s.clef_octave || s.clef_oct_transp) ?
          0 : s.clef_octave
      break
    case C.GRACE:
      if (s.time == 0    // if before beat at start time
       && abc_time == 0) {
        dt = 0
        if (s.sappo)
          dt = C.BLEN / 16
        else if (!s.next || s.next.type != C.NOTE)
          dt = d / 2;
        abc_time -= dt
      }
      gen_grace(s)
      break
    case C.KEY:
      key_map(s)
      break
    case C.REST:
    case C.NOTE:
      d = s.dur
      if (s.next && s.next.type == C.GRACE) {
        dt = 0
        if (s.next.sappo)
          dt = C.BLEN / 16
        else if (!s.next.next || s.next.next.type != C.NOTE)
          dt = d / 2;
        s.next.time -= dt;
        d -= dt
      }
      d /= play_factor
      if (s.type == C.NOTE)
        gen_notes(s, p_time, d)
      else
        a_e.push(new Float32Array([
          s.istart,
          p_time,
          0,
          0,
          d,
          0,
          s.v]))
      break
    case C.STAVES:
      top_v = s.sy.top_voice
      break
    case C.BLOCK:
      if (s.subtype != "midictl")
        break
      a_e.push(new Float32Array([  // generate a MIDI control
        s.istart,
        p_time,
        -1,      // MIDI control
        s.ctrl,
        s.val,
        1,
        s.v]))
      break
    }
    s = s.ts_next
  }
    } // add()
  } // return
} // ToAudio

// nodejs
if (typeof module == 'object' && typeof exports == 'object')
  exports.ToAudio = ToAudio
