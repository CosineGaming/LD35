var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, "", { preload: preload, create: create, update: update });

var marker;

var pathX = [];
var pathY = [];
var pathI = 0;
var pathStep;
var bmd;

function screenX(gameX)
{
	return Math.floor(game.width * gameX / 2);
}
function screenY(gameY)
{
	return Math.floor(game.height * gameY);
}

function preload()
{
	game.load.image("marker", "assets/marker.png");

	var spline = {"x":[0.4625, 0.578125, 0.7171875, 0.571875, 0.65, 0.47578125, 0.27734375, 0.35390625, 0.20078125, 0.38203125, 0.4625],"y":[0.12083333333333333, 0.29583333333333334, 0.33125, 0.4895833333333333, 0.7854166666666667, 0.6458333333333334, 0.8041666666666667, 0.46458333333333335, 0.3229166666666667, 0.27708333333333335, 0.12083333333333333],"speed":360};
	var step = 1.0 / Math.max(game.width, game.height);
	pathStep = Math.floor(Math.max(game.width, game.height) / spline.speed);
	alert(pathStep);
	for (var i=0; i<=1.0; i+=step)
	{
		pathX.push(game.math.catmullRomInterpolation(spline.x, i)*game.width);
		pathY.push(game.math.catmullRomInterpolation(spline.y, i)*game.height);
	}
}

function create()
{
	//game.world.setBounds(screenX(-1), 0, screenX(1), screenY(1));
	//game.camera.x = -screenX(-1);
	marker = game.add.sprite(0, 0, "marker");
	bmd = game.add.bitmapData(game.width, game.height);
	bmd.addToWorld();
	for (var i=0; i<pathX.length; ++i)
	{
		bmd.rect(pathX[i], pathY[i], 1, 1, "rgba(255,255,255,1)");
	}
}

function update()
{
	pathI += pathStep;
	if (pathI >= pathX.length)
	{
		pathI = 0;
	}
	marker.y = pathY[pathI];
	marker.x = game.input.x;
}
