// grid3.js - module to insert a manual chord grid
//
// Copyright (C) 2020 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%begingrid" appears in a ABC source.
//
// Parameters
//	%%begingrid
//		list of chords, measure bars ('|') and ':' for repeat
//	%%endgrid
//	%%gridfont font_name size (default: 'serif 16')

abc2svg.grid3 = {

// generate the grid
    block_gen: function(of, s) {
	if (s.subtype != "grid") {
		of(s)
		return
	}

    var	abc = this,
	cfmt = abc.cfmt(),
	img = abc.get_img(),
	txt = s.text,
	font, font_cl, cls, w,
	ln, i,
	lines = [],
	cl = [],
	bars = [],
	cells = [],
	nr = 0,			// number of rows
	nc = 0,			// number of columns
	wc = 0			// width of a cell

	// generate the grid
	function build_grid() {
	    var	i, k, l, line, bl, bar, w, hr, x0, x, y, yl, cl, cell,
		lc = '',
		path = '<path class="stroke" stroke-width="1" d="M',
		sf = '" style="font-size:' + (font.size * .72).toFixed(1) + 'px'
						// small font

		function build_ch(cl, x, y, n) {
			return '<text class="' + cl + '" x="' +
				x.toFixed(1) + '" y="' + y.toFixed(1) + '">' +
					cell[n] + '</text>\n'
		} // build_ch()

		function build_cell(cell, x, y, yl, hr) {
		    var	line

			if (cell.length > 1) {
				line = path +
					(x - wc / 2).toFixed(1) + ' ' +
					yl.toFixed(1) + 'l' +
					wc.toFixed(1) + ' -' + hr.toFixed(1) +
					'"/>\n'
				if (cell[1]) {
				    line += path +
					(x - wc / 2).toFixed(1) + ' ' +
					(yl - hr).toFixed(1) + 'l' +
					(wc / 2).toFixed(1) + ' ' + (hr / 2).toFixed(1) +
						'"/>\n' +
					build_ch(cls + sf, x - wc / 3, y, 0) +
					build_ch(cls + sf, x, y - hr * .32, 1)
				} else {
					line += build_ch(cls + sf,
						x - wc * .2, y - hr / 4, 0)
				}
				if (cell.length >= 3) {
				  if (cell[3]) {
				    line += path +
					x.toFixed(1) + ' ' +
					(yl - hr / 2).toFixed(1) + 'l' +
					(wc / 2).toFixed(1) + ' ' + (hr / 2).toFixed(1) +
						'"/>\n' +
					build_ch(cls + sf, x, y + hr * .3, 2) +
					build_ch(cls + sf, x + wc / 3, y, 3)
				  } else {
					line += build_ch(cls + sf,
						x + wc * .2, y + hr / 4, 2)
				  }
				}
			} else {
				line = build_ch(cls, x, y, 0)
			}
			return line
		} // build_cell()

		// -- build_grid() --

		// build the content of the cells
		hr = font.size * 2.1
		if (wc < hr * 1.4)
			wc = hr * 1.4			// cell width
		w = wc * nc				// grid width

		// generate the cells
		yl = 3
		y = 3 - font.size * .7
		x0 = (img.width / cfmt.scale - w) / 2
		while (1) {
			cl = cells.shift()
			if (!cl)
				break
			y += hr
			yl += hr
			x = x0 + wc / 2
			while (1) {
				cell = cl.shift()
				if (!cell)
					break
				lc += build_cell(cell, x, y, yl, hr)
				x += wc
			}
		}

		// draw the lines
		line = '<path class="stroke" d="\n'
		y = 3
		for (i = 0; i <= nr; i++) {
			line += 'M' + x0.toFixed(1) + ' ' + y.toFixed(1) +
				'h' + w.toFixed(1)+ '\n'
			y += hr
		}
		x = x0
		for (i = 0; i <= nc; i++) {
			line += 'M' + x.toFixed(1) + ' 3v' + (hr * nr).toFixed(1) + '\n'
			x += wc
		}
		line += '"/>\n'

		// insert the cells
		line += lc

		// show the repeat signs
		y = 3 - font.size * .7
		while (1) {
			bl = bars.shift()
			if (!bl)
				break
			x = x0
			y += hr
			while (1) {
				bar = bl.shift()
				if (!bar)
					break
				if (bar[0] == ':')
					line += '<text class="' + cls + '" x="' +
						(x - 5).toFixed(1) +
						'" y="' + y.toFixed(1) +
						'" style="font-weight:bold;font-size:' +
						(font.size * 1.6).toFixed(1) +
						'px">:</text>\n'
				if (bar.slice(-1) == ':')
					line += '<text class="' + cls + '" x="' +
						(x + 5).toFixed(1) +
						'" y="' + y.toFixed(1) +
						'" style="font-weight:bold;font-size:' +
						(font.size * 1.6).toFixed(1) +
						'px">:</text>\n'
				x += wc
			}
		}
		abc.out_svg(line)
		abc.vskip(hr * nr + 6)
	} // build_grid()

	// ----- block_gen ----

	// set the text style
	if (!cfmt.gridfont)
		abc.param_set_font("gridfont", "serif 16")
	font = abc.get_font('grid')
	font_cl = abc.font_class(font)
	cls = font_cl + " mid"
	abc.add_style("\n.mid {text-anchor:middle}")
	abc.set_font('grid')		// (for strwh())

	// scan the grid content
	txt = txt.split('\n')
	while (1) {
		ln = txt.shift()	// line
		if (!ln)
			break

		// extract the bars and the chords
		ln = ln.match(/[|:]+|[^|:\s]+/g)
		bars[nr] = []
		cells[nr] = []
		i = -1
		while (1) {
			cl = ln.shift()
			if (!cl)
				break
			if (cl.match(/[:|]+/)) {
				bars[nr][++i] = cl
				cells[nr][i] = []
			} else {
				if (!cells[nr][i]) {	// if starting '|' is missing
					bars[nr][++i] = '|'
					cells[nr][i] = []
				}
				if (cl == '-')
					cl = ''
				cells[nr][i].push(cl)
			}
		}
		if (cells[nr][i].length)
			bars[nr][++i] = '|'	// mussing ending bar
		else
			cells[nr][i] = null	// keep just the measure bar

		if (i > nc)
			nc = i

		i = 0
		while (1) {
			cl = cells[nr][i++]
			if (!cl)
				break
			if (cl.length == 2) {
				cl[2] = cl[1]	// "| A B |" => "|A - B|"
				cl[1] = ''
			}
			w = abc.strwh(cl.join(''))[0]
			if (w > wc)
				wc = w
		}
		nr++
	}
	wc += abc.strwh('  ')[0]

	// build the grid and insert it in the music
	abc.blk_flush()
	build_grid()
	abc.blk_flush()
    }, // block_gen()

// handle %%begingrid
    do_begin_end: function(of, type, opt, txt) {
	if (type != "grid") {
		of(type, opt, txt)
	} else if (this.parse.state >= 2) {
		s = this.new_block(type)
		s.text = txt
	} else {
		abc2svg.grid3.block_gen.call(this, null, {
						subtype: type,
						text: txt
						})
	}
    }, // do_begin_end()

    set_hooks: function(abc) {
	abc.block_gen = abc2svg.grid3.block_gen.bind(abc, abc.block_gen)
	abc.do_begin_end = abc2svg.grid3.do_begin_end.bind(abc, abc.do_begin_end)
    }
} // grid3

abc2svg.modules.hooks.push(abc2svg.grid3.set_hooks)

// the module is loaded
abc2svg.modules.begingrid.loaded = true
