// abc2svg - tolead.js - convert ABC to lead sheet
//
// Copyright (C) 2014-2018 Jean-Francois Moine
//
// This file is part of abc2svg.
//
// abc2svg is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with abc2svg.  If not, see <http://www.gnu.org/licenses/>.

function lead(tsfirst, voice_tb, music_types, info) {
    var  C = abc2svg.C
  s, beat, cur_beat, i,
  line = '';

  function get_beat(s) {
    if (s.a_meter[0].top[0] == 'C' || !s.a_meter[0].bot) {
      beat = C.BLEN / 4
    } else {
      beat = C.BLEN / s.a_meter[0].bot[0] |0
      if (isNaN(beat)) {
        abc2svg.print('** Cannot get the beat')
        return
      }
      if (s.a_meter[0].bot[0] == 8
       && s.a_meter[0].top[0] % 3 == 0)
        beat = C.BLEN / 8 * 3
    }
  } // get_beat()

  abc2svg.print('-- ' + info.T + ' --');

  // get the beat
  get_beat(voice_tb[0].meter)
  if (beat == undefined)
    return

  // treat only the first voice
  cur_beat = 0
  for (s = voice_tb[0].sym; s; s = s.next) {
    while (s.time > cur_beat) {
      line += '/ ';
      cur_beat += beat
    }
    switch (s.type) {
    case C.NOTE:
    case C.REST:
      if (s.a_gch) {    // search a chord symbol
        for (i = 0; i < s.a_gch.length; i++) {
          if (s.a_gch[i].type == 'g') {
            line += s.a_gch[i].text + ' ';
            cur_beat = s.time + beat
            break
          }
        }
      }
      break
    case C.BAR:
      if (s.eoln) {
        if (s.bar_type == '::')
          line += ':|\n|: '
        else
          line += s.bar_type +'\n'
      } else {
        if (s.bar_type == '::')
          line += ':|: '
        else
          line += s.bar_type + ' '
      }
      cur_beat = s.time  // re-synchronize
      break
    case C.METER:
      get_beat(s)
      break
    }
  }
  abc2svg.print(line)
}

// -- local functions
abc2svg.abort = function(e) {
  abc2svg.abc_end()
  abc2svg.print(e.message + "\n*** Abort ***\n" + e.stack);
  abc2svg.quit()
}

abc2svg.abc_init = function() {
  user.get_abcmodel = lead
}
abc2svg.abc_end = function() {
  if (user.errtxt)
    abc2svg.print("Errors:\n" + user.errtxt)
}
