define('main', [ 'game', 'images' ], function(Game, images) {
	document.body.classList.add('with-background-carbon');
	this.game = new Game({
		board: '.Game',
		image: images[0],
		size: { x:3, y:3 }
	}).shuffle();
});

