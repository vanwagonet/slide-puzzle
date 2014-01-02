define('game', [ 'require', 'prefix' ], function(require) {
	'use strict';
	var prefix = require('prefix'),

		win = window, doc = document, body = doc.body,
		FIND = 'querySelector', FINDALL = 'querySelectorAll',
		TRANSFORM = prefix.cssom(body.style, 'transform'),
		CSSTRANSFORM = prefix.toDash(TRANSFORM),

		setTimeout = win.setTimeout,
		requestAnimationFrame =
			win[prefix.js(win, 'requestAnimationFrame')] ||
			function(fn) { return setTimeout(fn, 13); };

	// Private
	function encode(str) {
		return (''+str)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&#34;').replace(/'/g, '&#39;')
			.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function setup(game, img, width, height) {
		width = game.size.width || width, height = game.size.height || height;

		var cols = game.size.x, rows = game.size.y, c, r,
			pwidth = Math.floor(width / cols), pheight = Math.floor(height / rows),
			board = game.board, html = '';

		game.size = { x:cols, y:rows, width:width, height:height };
		game.empty = { x:cols-1, y:rows-1, div:null };

		for (r = 0; r < rows; ++r) {
			for (c = 0; c < cols; ++c) {
				html += '<div class="Game-piece" style="' + encode(
					'width:' + pwidth + 'px;height:' + pheight + 'px;' +
					'background-image:url("' + encodeURI(img) + '");' +
					'background-position:' + (-c*pwidth) + 'px ' + (-r*pheight) + 'px;' +
					CSSTRANSFORM + ':translate(' + (c*pwidth) + 'px,' + (r*pheight) + 'px);') +
					'" data-correct-position="' + c + ',' + r +
					'" data-position="' + c + ',' + r +
					'"></div>';
			}
		}

		board.innerHTML = html;
		board.style.width = Math.floor(width) + 'px';
		board.style.height = Math.floor(height) + 'px';
		board.classList.remove('is-loading');

		game.empty.div = board[FIND]('.Game-piece[data-position="' + game.empty.x + ',' + game.empty.y + '"]');
		game.empty.div.classList.add('is-empty');
	}

	function load(game, img, opts) {
		var board = game.board, loader = new Image;
		game.isLoading = true;
		game.onLoad = [];
		board.classList.add('is-loading');
		while (board.lastChild) { board.removeChild(board.lastChild); }

		loader.onload = function() {
			setup(game, img, loader.naturalWidth, loader.naturalHeight);
			body.removeChild(loader);
			loader = null;
			while (game.onLoad.length) { game.onLoad.shift()(); } // execute all onload
		};
		// TODO loader.onerror = ;
		loader.className = 'ImgLoader';
		loader.src = img;
		body.appendChild(loader);
	}

	function shuffle(game, iterations) {
		var wait = 50, board = game.board, empty = game.empty, prev,
			xx = game.size.x - 1, yy = game.size.y - 1,
			pieces = [].map.call(board[FINDALL]('.Game-piece'), function(div) {
					var position = div.getAttribute('data-position').split(',');
					return { div:div, x:+position[0], y:+position[1] };
				});
		board.classList.add('is-shuffling');

		function next() {
			if (--iterations < 0) {
				board.classList.remove('is-shuffling');
				return;
			}

			var moves = [], x = empty.x, y = empty.y, move, piece;
			if (x < xx && prev !== 2) { moves.push({ x:x+1, y:y, prev:1 }); }
			if (x > 0  && prev !== 1) { moves.push({ x:x-1, y:y, prev:2 }); }
			if (y < yy && prev !== 4) { moves.push({ x:x, y:y+1, prev:3 }); }
			if (y > 0  && prev !== 3) { moves.push({ x:x, y:y-1, prev:4 }); }
			if (!moves.length) {
				iterations = 0;
				return next();
			}
			move = moves[Math.floor(Math.random() * moves.length)];
			prev = move.prev;
			piece = pieces.filter(function(piece) {
					return piece.x === move.x && piece.y === move.y;
				})[0];
			piece.x = x;
			piece.y = y;
			onClick(game, { target:piece.div, type:'shuffle' });

			setTimeout(next, wait);
		}

		requestAnimationFrame(next);
		return game;
	}

	function check(game) {
		var board = game.board,
			pieces = [].filter.call(board[FINDALL]('.Game-piece'), function(div) {
					return div.getAttribute('data-position') !== div.getAttribute('data-correct-position');
				});
		function reveal() {
			board.classList.add('is-solved');
			board[FIND]('.Game-piece.is-empty').classList.remove('is-empty');
		}
		if (!pieces.length) {
			game.isSolved = true;
			setTimeout(reveal, 300);
		}
	}

	function onClick(game, evt) {
		if (game.isSolved || !evt.target.classList.contains('Game-piece')) { return; }

		var piece = evt.target, empty = game.empty,
			position = piece.getAttribute('data-position').split(','),
			x = +position[0], y = +position[1],
			dx = Math.abs(empty.x - x), dy = Math.abs(empty.y - y),
			adjacent = (!dx && 1 === dy) || (!dy && 1 === dx),
			estyle = empty.div.style, pstyle = piece.style,
			translate = pstyle[TRANSFORM];
		if (!adjacent) { return; }

		piece.setAttribute('data-position', empty.x + ',' + empty.y);
		empty.div.setAttribute('data-position', (empty.x = x) + ',' + (empty.y = y));
		pstyle[TRANSFORM] = estyle[TRANSFORM];
		estyle[TRANSFORM] = translate;

		if ('shuffle' !== evt.type) { check(game); }
	}



	// Public
	function Game(opts) {
		if (!(this instanceof Game)) { return new Game(opts); }
		opts = opts || {};
		var game = this, size = opts.size || {};
		game.board = opts.board;
		if ('string' === typeof game.board) {
			game.board = doc[FIND](game.board);
		}
		if (!game.board || 1 !== game.board.nodeType) {
			game.board = doc.createElement('div');
		}
		game.board.classList.add('Game');
		game.board.addEventListener('click', onClick.bind(game, game), false);
		game.size = {
			x:size.x || 3,
			y:size.y || 3
		};
		if (opts.image) { game.load(opts.image); }
		return game;
	}

	Game.prototype = {
		board: null, // element div.Game
		image: null, // url to image location
		size: null,
		isLoading: false,
		onLoad: null, // array of deferred functions
		isSolved: false,
		load: function(url) {
			load(this, this.image = url);
			return this;
		},
		shuffle: function(iterations) {
			if (!iterations) { iterations = this.size.x * this.size.y * 4; }
			if (this.isLoading) {
				this.onLoad.push(shuffle.bind(this, this, iterations));
			} else {
				shuffle(this, iterations);
			}
			return this;
		}
	};

	return Game;
});

