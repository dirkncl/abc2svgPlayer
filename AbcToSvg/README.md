<style>
p{margin-left:.5cm;max-width:21cm}
li{margin-left:.5cm;max-width:20cm}
li p{margin-left:0}
</style>
## abc2svg

**abc2svg** is a set of Javascript files for handling
 [ABC music notation](http://abcnotation.com/). This includes
editing, displaying, printing, playing the music files and
converting them to other formats such as ABC and MEI notations.

The **abc2svg** core is based on the
[abcm2ps](https://github.com/leesavide/abcm2ps) C code
which requires compilation on every operating system. 
The **abc2svg** scripts can run in any system with no compilation on
any platform that contains an internet browser. This includes Windows,
Apple, and Unix-like systems (Linux, BSD...) as well as portable devices
such as cell phones and iPads.

A description of the ABC parameters that relate to both abcm2ps
and abc2svg can be found [here][1].

[1]: http://moinejf.free.fr/abcm2ps-doc/index.html "abc2svg documentation"

### 1. Web browser usage

#### 1.1 Rendering ABC files from a local or remote source

After accessing ABC files with a web browser either from a local or web
source, you can render or play the music without much preparation.
One approach uses [bookmarklets](https://en.wikipedia.org/wiki/Bookmarklet).

A bookmarklet is the same as a normal bookmark in a web browser.
Its title (or name) is anything you want to use to identify it and its URL
(or location or address) is javascript code starting by `javascript:`.
First, create a bookmark from this page adding it to your library of
bookmarks. Next, edit this mark changing the title and the URL. (Details
for editing a bookmark are specific for each browser. To get instructions,
search on the internet the name of the browser and keywords such as
'bookmarklet' and 'javascript in url'). To edit the URL, extract
the javascript code
by right clicking on one of the bookmarklets below and selecting
copy url. Then, paste this code into the URL of your new bookmark
in your library.

To use a abc2svg bookmarklet, first load an ABC file into your
browser either from a web site of from a file on your system.
Once you see the textual abc code, click on the bookmarklet
that you created. After a slight delay depending upon the
complexity of the abc code, it should be replaced by a music
representation or a list of the contents of the ABC file. Here
are two bookmarklets that you can try.

This
<a href="javascript:(function(){var%20s,n=3,d=document,b=d.body;d.head.innerHTML='&lt;style&gt;\nsvg{display:block};@media print{body{margin:0;padding:0;border:0}}\n&lt;/style&gt;\n';b.innerHTML='\n%25abc-2.2\n%25%3c!--\n'+b.textContent+'%25--%3e\n';function%20f(u){s=d.createElement('script');s.src='http://moinejf.free.fr/js/'+u;s.onload=function(){if(--n==0)dom_loaded()};d.head.appendChild(s)};f('abcweb-1.js');f('snd-1.js');f('follow-1.js')})()"
title="Copy me">first abc2svg bookmarklet</a>
renders all the music it finds in the page currently displayed.  
Once the music is displayed, clicking inside a tune starts playing it
from the beginning.
Clicking on a particular note or rest starts playing from that point.  
To print or convert the music to a PDF file,
simply click on the 'Print' button of the web browser.
(If the 'Print' button does not appear on your browser menu,
try right clicking on the web page.)

Alternatively, if your source contains many tunes, you can
use this
<a href="javascript:(function(){var%20s,n=3,d=document,b=d.body;d.head.innerHTML='&lt;style&gt;\nsvg{display:block};@media print{body{margin:0;padding:0;border:0}}\n&lt;/style&gt\n';b.innerHTML='\n%25abc-2.2\n%25%3c!--\n'+b.textContent+'%25--%3e\n';function%20f(u){s=d.createElement('script');s.src='http://moinejf.free.fr/js/'+u;s.onload=function(){if(--n==0)dom_loaded()};d.head.appendChild(s)};f('abcweb1-1.js');f('snd-1.js');f('follow-1.js')})()"
title="Copy me">second bookmarklet</a>.
The browser will list the titles of the tunes. Click on one of the titles
to view the music representation.
Playing and printing work in the same manner as above.  
The generated pages contain a yellow menu in the top right corner which permits
you to return to the tune list or to modify the music. With this last option,
you can adjust the page size before printing, correct the ABC syntax or
do some transposition.
Note that these changes stay only with the browser and are not saved
to your system.

If you want to experiment with these bookmarklets, here are some raw ABC files:

- [from my site](http://moinejf.free.fr/abc/agora.abc "agora.abc")
- [from Cranford Publications][2]

[2]: http://www.cranfordpub.com/tunes/abcs/NatalieBlueprint.txt "Blueprint"

#### 1.2 Writing, playing and printing music with the abc2svg editor

The [abc2svg editor][3]
is another example of what can be done with **abc2svg**.

[3]: http://moinejf.free.fr/js/edit-1.xhtml "ABC editor based on abc2svg"

If you are unfamiliar with ABC music notation, just copy this ABC sequence below
and paste it into the text area of the editor.

	X:1
	T:C scale
	M:C
	L:1/4
	K:C
	CDEF|GABc|

If your ABC files contain `%%abc-include`, then you must:

  - load the ABC file using the browse button,
  - click the include file name button,
  - and load the include file using the same previous browse button.  

Only one included file is allowed.

If you have a US keyboard, its behaviour can be changed for easier music
entering by one of these bookmarklets:
<a href="javascript:(function(){if(typeof%20abc2svg.loadjs=='function'){abc2svg.loadjs('abckbd-1.js')}else{alert('use%20with%20abc2svg%20editor')}})()"
title="Copy me">keyboard 1</a>
and
<a href="javascript:(function(){if(typeof%20abc2svg.loadjs=='function'){abc2svg.loadjs('abckbd2-1.js')}else{alert('use%20with%20abc2svg%20editor')}})()"
title="Copy me">keyboard 2</a>.

#### 1.3 Publishing music on your web pages

To insert music in your web pages, you just have to insert the lines

	<script src="http://moinejf.free.fr/js/abcweb-1.js"></script>
	<script src="http://moinejf.free.fr/js/snd-1.js"></script>
	<script src="http://moinejf.free.fr/js/follow-1.js"></script>

in the HTML &lt;head&gt; and put the music as
ABC sequences in the &lt;body&gt;.

[This example][4] demonstrates how to do it.
(Note that the paths are relative - see why below.)

[4]: http://moinejf.free.fr/abcm2ps-doc/tabac.xhtml "J'ai du bon tabac"

As it is apparent, HTML and ABC can be mixed in the same html file.
Both are rendered in the order you defined them.

You may also have noticed this CSS about SVG elements:  
`        svg { display: block }`

This permits to have the music on separate vertical areas.  
Without this CSS, the music is in-lined as in [this other example][5].

[5]: http://moinejf.free.fr/abcm2ps-doc/dansou-i.html "Tune index example"

In the above examples, all the ABC music is generated (displayed
and ready to be played) by means of the script **abcweb-1.js**.  
If there is a large collection of tunes, it may be preferable to
link to the other script, **abcweb1-1.js**, which permits you
to select particular tune(s). Without an explicit
selection (see below), a list of the tunes is displayed, and,
after a tune has been selected, the whole page is replaced by the music.
(The HTML code, if any, is not displayed.)
A menu on the top right corner of the screen
permits to get the tune list again. Here is [a real example][6].

[6]: http://moinejf.free.fr/abc/boyvin-2-2.html "J. Boyvin organ tunes"

As you may note in the menu, the edition of the ABC content is proposed.
This permits, for example, to transpose the tunes.
This edition is done inside the browser, so, your changes will be lost
after leaving the page.

When accessing such pages, an external selection of the tunes
can be accomplished by adding the character '`#`' in the URL
followed by a [regular expression][7]
to be applied to the tune headers.
For instance, here is the ['Duo' de J. Boyvin][8].

[7]: https://en.wikibooks.org/wiki/Regular_Expressions "Regular expressions"
[8]: http://moinejf.free.fr/abc/boyvin-2-2.html#T:Duo "Duo"

In the first example ("J'ai du bon tabac"), you saw that care
should be taken with regard to the special XML characters
'&lt;', '&gt;' and '&amp;' by enclosing
the ABC sequences inside XML comments.
In the case you put ABC in a HTML file
(not a XHTML file), the third abc2svg script **abcweb2-1.js**,
following a bit the ABC standard 2.3, searches the music
only in the elements of the class `abc`.
As you may see in the source of [this psaume][9],
the ABC code is contained in a `<script>` element, so that it is
not changed by the web browser. This is explained in section 4.3
following the description of **abcweb2-1.js**.

[9]: http://dz.tugdual.free.fr/psaumes/psaume-32.html "Psaume 32"

#### 1.4 Installing abc2svg on your system or on your server

The **abc2svg** package on my server is still being tuned
which could change its behaviour at any unknown time; so you may
prefer to install and run it from your own system. 

There are many ways to install abc2svg:

- [Guido Gonzato's page](http://abcplus.sourceforge.net/#abc2svg)  
  Guido maintains a ZIP archive of the abc2vg scripts after
  each release of a new version (many thanks, Guido!).  
  You can just download and unzip this archive. **abc2svg** should
  run immediately in your machine without connecting to my site.  
  In the same page, you can also find some binaries for the fastest
  javascript interpreter (QuickJS - see below).

- tarball  
  From the timeline in the [chisel repository][13], you can get a tarball
  any version of the abc2svg source and install it in your system.  
  The abc2svg scripts must then be built from the raw source files
  described in the section 'Build' below.  
  The disadvantage of this approach is that if you want
  to use an other or newer version you need to download a new tarball.

[13]: https://chiselapp.com/user/moinejf/repository/abc2svg/timeline)

- fossil clone  
  If you can get the fossil program (one binary) for your system,
  you may clone the chisel repository by  
  `        fossil clone https://chiselapp.com/user/moinejf/repository/abc2svg abc2svg.fossil`  
  `        fossil open abc2svg.fossil`  
  and get the abc2svg source files containing the last changes
  between the official versions. Updating your files is done by  
  `        fossil pull`  
  `        fossil update`  
  Building the scripts is done in the same way as with a tarball.  
  The repository is presently over 23Mb.

  For those unfamiliar with [fossil][14], it is an integrated
  software management system similar to [git](https://git-scm.com/).  
  Chisel acts like a repository similar to [github](https://github.com/).

[14]: https://fossil-scm.org/home/doc/trunk/www/index.wiki

- npm  
  The scripts may be installed from the `npm` repository by:  
  `        npm install abc2svg`  
  They are ready to run (web and shell with nodejs).
  I upload a new npm version about once a month.

Using bookmarklets with a local installation does not work directly
(because of a cross-domain security hole), but it is possible by running
a local HTTP server (you will also have to change the location
of the scripts in the bookmarklet code).

If you have write access on a remote server, you may put there
the abc2svg scripts. There is no automatic process to do that.
You will have to
[look at my site](http://moinejf.free.fr/js/ "all abc2svg scripts")
to determine the files that need to be copied.

In addition, you have to set the correct location of the abc2svg scripts
in your pages. As a trick, I put the abc2svg scripts in a folder
at the same level as the HTML files:

`        <script src="../js/abcweb-1.js"></script>`

This allows the generation of the music to run either locally
or remotely.

### 2. Automatic creation of music sheets

#### 2.1 abc2svg shell scripts

As you have seen, printing the music can be done easily with any web browser.
You can automate the process of creating music sheets
with **abc2svg** using shell scripts running a Javascript interpreter.

The interfaces to the various scripts are different. Below you will
find various scripts that I had to built.

- `abcqjs` with `qjs` [QuickJS by Fabrice Bellard and Charlie Gordon][10]
- `abcjs24` with `js24` (Mozilla JavaScript shell - Spidermonkey)
- `abcjs52` with `js52` (Mozilla JavaScript shell - Spidermonkey)
- `abcjs60` with `js60` (Mozilla JavaScript shell - Spidermonkey)
- `abcjsc` with `jsc-1` (webkitgtk2)
- `abcv8` with `d8` (Google libv8)
- `abcnode` with `node` (nodeJS without module)
- `abc2svg` with `node` (nodeJS with modules)

[10]: https://bellard.org/quickjs/

Each script gets the abc2svg options and ABC files from the command line
and sends the generated file to `stdout` and possible errors to `stderr`.  
The general syntax of the command line is:  
`        script [script.js] [options] ABC_file [[options] ABC_file]* [options]`
with:

- `script.js` is an optional backend script.  
  It defaults to `tohtml.js` (HTML+SVG)
- `options` are the ABC options.  
  For compatibility, the last options are moved before the last ABC file.

#### 2.2 Backend scripts

By default, the shell scripts generate (HTML+SVG) files.  
This output may be modified by backend scripts. These ones must appear
immediately following the name of the shell script.  
They are:

- `toabc.js`  
  This script returns the (selected) ABC tunes from the ABC source file  
  applying transposition.  
  The resulting file does not contain the formatting parameters.  
  Example:  
  `        abcqjs toabc.js my_file.abc --select X:2 > tune_2.abc`

- `toabw.js`  
  This script outputs an Abiword file (ABW+SVG) that can be read by some
  word processors (abiword, libreoffice...). The word processor allows
  you to convert the file to many other formats from a command line.  
  The abc2svg music font (`abc2svf.woff` or `abc2svg.ttf`) must be installed
  in the local system for displaying and/or converting the .abw file.  
  Example:  
  `        abcv8 toabw.js my_file.abc > my_file.abw`

- `tomei.js`  
  This script outputs the music as a [MEI](https://music-encoding.org/) file.  
  Note, only one tune may be translated from ABC to MEI (multi-tunes ABC
  generates bad MEI).

- `toodt.js`  
  This script creates an Open Document (ODT+SVG) which can be read by most
  word processors (abiword, libreoffice...).  
  It runs only with the shell script `abc2svg` and asks for the npm module
  `jszip` to be installed.  
  The output ODT document may be specified in the command line argument
  after `-o` (default `abc.odt`).  
  Example:  
  `        abc2svg toodt.js my_file.abc -o my_file.odt`

- `toparam.js`  
  This script just outputs the abc2svg parameters.

#### 2.3 PDF generation

`abctopdf` is a shell script which converts ABC to PDF using one of the
previous shell scripts and, either a chrome/chromium compatible web browser,
or the program [weasyprint](https://weasyprint.org/) or
the program `rsvg-convert`.

With `rsvg-convert`, the used music font must be installed and defined by
`%%musicfont <fontname>`.

Note also that, with `weasyprint` or `rsvg-convert`, the paper size is
forced to A4. Instructions for changing this size may be found in the
script source.

The output PDF document may be specified by the command line argument `-o`
(default `abc.pdf`).

Example:  
`        abctopdf my_file.abc -o my_file.pdf`

### 3. Build

The abc2svg scripts which are used to render the music
either by a web browser or by a shell script must be built from
the source files you got by tarball or fossil clone.

Quoting [Douglas Crockford](https://www.crockford.com/jsmin.html),
minification is a process that removes comments and unnecessary whitespace from
JavaScript files. It typically reduces file size by half, resulting in
faster downloads.

If you can run one of the tools [ninja](https://ninja-build.org/)
or [samurai](https://github.com/michaelforney/samurai), you can build
the scripts

- without minification  
  This is useful for debugging purposes and the scripts are more human friendly.

  `        NOMIN=1 samu -v`

   or

  `        NOMIN=1`  
  `        export NOMIN`  
  `        ninja -v`

- in a standard way with minification  
  In this case, you need one of the tools
  [JSMin](https://www.crockford.com/jsmin.html) or
 `uglifyjs` which comes with nodeJS.

  `        samu -v`

If you also want to change or add music glyphs, you may edit the source
file `font/abc2svg.sfd`.
In this case, you will need both `base64` and `fontforge`, and run

`        samu -v font.js`

If you cannot or don't want to install `ninja` or `samurai`, you may build
the abc2svg files by the shell script `./build`.
(This script must be run by a Posix compatible shell.)

### 4. Inside the code of abc2svg

#### 4.1 Core and modules

`abc2svg-1.js` is the **abc2svg** core.  
It contains the ABC parser and the SVG generation engine.
It is needed for all music rendering. It is automatically loaded
by the web scripts and the shell scripts.  
If you want to use the core with your own scripts,
its API is described in the [wiki][11].

[11]: https://chiselapp.com/user/moinejf/repository/abc2svg/wiki?name=interface-1

The core does not handle all the abc2svg commands/parameters.
Some of them are treated by modules.
A module is a script which is loaded in the browser or in the JS interpreter
when the command it treats is seen in the ABC flow.  
Detailed information about the modules may be found in the [wiki][12].

[12]: https://chiselapp.com/user/moinejf/repository/abc2svg/wiki?name=modules

#### 4.2 Internal information

- The music is displayed as SVG images. There is one image per
  music line / text block.  
  If you want to move these images to some other files,
  each one must contain the full CSS and defs. For that, insert  
  `        %%fullsvg x`  
  in the ABC file before rendering (see the
  [fullsvg documentation](http://moinejf.free.fr/abcm2ps-doc/fullsvg.xhtml)
  for more information).

- Playing uses the HTML5 audio and/or the midi APIs.  
  For audio, abc2svg uses a sound font (format SF2) which is splitted
  per instrument. This sound font is stored in the subdirectory `Scc1t2/`.
  Each instrument file is a base64 encoded javascript array.

- The names of the abc2svg scripts have a suffix which is the version of
  the core interface (actually '`-1`').

#### 4.3 More about the web scripts

Here are the scripts which are used in a web context:

- `abcweb-1.js`  
  This script replaces the ABC or MEI sequences found in the (X)HTML file
  by SVG images of the music (the ABC sequences start on `X:` or `%abc`
  at start of line, and stop on any ML tag - see below for MEI).  
  When a ABC sequence contains the characters '<', '>' or '&',
  it must be enclosed in a XML comment (inside the sequence as a comment).  
  See the
  [%%beginml documentation](http://moinejf.free.fr/abcm2ps-doc/beginml.xhtml)
  for an example.  
  Playing and highlighting the played notes may be offered loading
  the scripts `snd-1.js` and `follow-1.js` (see below).

- `abcweb1-1.js`  
  This script replaces all the page body by music as SVG images.  
  As with abcweb-1.js, the music sequences start on `X:` or `%abc`
  at start of line, stop on any ML tag, a XML comment must be used
  when there are special XML characters, and playing is possible.  
  When there are many tunes in the file, the script displays a list
  of the tunes. The list step may be bypassed when the URL of the file
  contains a regular expression in the 'hash' value ('#' followed by
  a string at the end of the URL).
  This string does a
  [%%select](http://moinejf.free.fr/abcm2ps-doc/select.xhtml).  
  When one or many tunes are displayed, a menu in the top/right corner
  offers to go back to the tune list or to modify the ABC source.
  
- `abcweb2-1.js`  
  With this script, the ABC sequences are searched in the HTML elements
  that have a class `abc`. The other HTML elements are rendered normally.  
  Compared with the previous script abcweb1-1.js,
  the special XML characters can be replaced by
  their XML counterparts ('&amp;lt;', '&amp;gt;' or '&amp;amp;').  
  When the element with the class `abc` is a &lt;script&gt;
  and when the file is a HTML file (not XHTML),
  the characters '<', '>' or '&', as well as '--', can be kept as they are
  in the ABC sequence.
  The type of the &lt;script&gt; element should be
  ["text/vnd.abc"](https://www.iana.org/assignments/media-types/text/vnd.abc)
  so that the ABC sequence could also be automatically
  handled by some extension in the web browsers (but no one is known yet!).  
  Otherwise, as previously, when the file is a XHTML file, the ABC sequence
  must be enclosed in XML comments (%&lt;![CDATA[ .. %]]&gt;).  
  Tune selection and playing work like with the previous script.  
  See [this file](http://moinejf.free.fr/abcm2ps-doc/multicol.xhtml)
  for an example.

- `snd-1.js`  
  This script may be used with `abcweb{,1,2}-1.js` to play the rendered
  ABC music.  

- `follow-1.js`  
  This script may be used after `snd-1.js`
  to highlight the notes while playing.  
  With `abcweb{,1,2}-1.js`, this script also permits to start playing
  anywhere in the music.  

- `abcdoc-1.js`  
  This script is mainly used for ABC documentation.
  It lets the ABC source sequences in the page before the SVG images.  
  See the source of
  [abcm2ps/abc2svg features](http://moinejf.free.fr/abcm2ps-doc/features.xhtml)
  for an example.

### 5. MEI support

As an experimental feature, an extented core `mei2svg-1.js` may be generated.
This one may handle both the ABC and
[MEI](https://music-encoding.org/ "Music Encoding Initiative")
notations.

In browser mode, the script `abcweb-1.js` loads either `abc2svg-1.js` or
`mei2svg-1.js` after checking if `<mei` exists in the page (see
[this tune](http://moinejf.free.fr/abc/Czerny_op603_6.html)
for an example).

In shell mode, the script `abcqjs` also loads the right abc2svg core
according to the source file extension (`.abc` or `.mei`).

[Jean-François Moine](http://moinejf.free.fr)
