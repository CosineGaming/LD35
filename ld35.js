var container = null;
var game = null;
var size = null;
var aspectExtra;

var paper;
var paperObject;
var foldLine = [[0,0],[0,0]];
var foldLineObject;

function initialize()
{

    container = document.getElementById("game");
    container.setAttribute("tabindex", 0)
    container.addEventListener("mousedown", mouseDown);
    container.addEventListener("mouseup", mouseUp);
    container.addEventListener("mousemove", hovered);
    container.addEventListener("keyup", pressed);
    container.focus();
	container.style.backgroundColor = "#000";

    game = SVG("game");
	resize();
	window.onresize = resizeCallback;

	paper = [[16,16], [112,16], [112,112], [16,112]];
	paperObject = game.polygon(paper).fill("#FFF");
	foldLineObject = game.line([[0, 0], [0, 0]]).stroke({color:"#F00", width: 0.5});
    var gridStyle = { color: "#BBB", width: 0.2 };
    for (var i=0; i<=128; i+=8)
    {
        game.line(i, 0, i, 128).stroke(gridStyle);
        game.line(0, i, 128, i).stroke(gridStyle);
    }

}

function mouseDown(e)
{
	foldLine[0] = [Math.round(gameX(e.clientX)/8)*8, Math.round(gameY(e.clientY)/8)*8];
	e.preventDefault();
	hovered(e);
}
function mouseUp(e)
{
	foldLine[1][0] = Math.round(gameX(e.clientX)/8)*8;
	foldLine[1][1] = Math.round(gameY(e.clientY)/8)*8;
	var m = slope(foldLine); // Slope
	var b = foldLine[0][1] - m*foldLine[0][0]; // Equation for y-intercept
	var firstPoint = paper[0];
	for (var i=0; i<paper.length; ++i)
	{
		var nextPoint;
		if (i != paper.length-1)
			nextPoint = paper[i+1]
		else
			nextPoint = firstPoint;
		var n = slope([paper[i], nextPoint]);
		var x;
		var y;
		if (n != null)
		{
			var c = paper[i][1] - n*paper[i][0];
			if (m != null)
			{
				x = (c-b)/(m-n); // Equation for intersection of a line
				y = m*x+b;
			}
			else
			{
				x = foldLine[0][0];
				y = n*x+c;
			}
		}
		else if (m != null)
		{
			x = paper[i][0]; // Vertical line: x is any point on it
			y = m*x+b;
		}
		// Checks if the intersect is within the bounds of the line
		var intersected = (x >= Math.min(nextPoint[0], paper[i][0]) && x <= Math.max(nextPoint[0], paper[i][0]) &&
			y >= Math.min(nextPoint[1], paper[i][1]) && y <= Math.max(nextPoint[1], paper[i][1]));
		if (intersected)
		{
			game.circle(3).move(x, y).fill("#0F0");
			paper.splice(i+1, 0, [x, y]);
		}
		var newX;
		var newY;
		if (m != null)
		{
			if (paper[i][1] < m*paper[i][0]+b)
			{
				// Algorithm for reflecting point across line
				var d = (paper[i][0] + (paper[i][1]-b)*m)/(1 + m*m);
				newX = 2*d - paper[i][0];
				newY = 2*d*m - paper[i][1] + 2*b;
				paper[i] = [newX, newY];
			}
		}
		if (intersected)
		{
			++i;
		}
	}
	redraw();
}
function hovered(e)
{
	if (e.buttons)
	{
		foldLine[1] = [gameX(e.clientX), gameY(e.clientY)];
		redraw();
	}
}

function pressed(e)
{

}

function redraw()
{

	foldLineObject.plot(foldLine);
	paperObject.plot(paper);

}

function slope(line)
{
	var dx = line[1][0] - line[0][0];
    if (dx == 0)
        return null;
    else
        return (line[1][1] - line[0][1]) / dx;
}

function collideLine()
{

}

function gameX(windowX)
{
    return (windowX - window.innerWidth / 2) / size * 128 + 64;
}
function gameY(windowY)
{
    return windowY / size * 128;
}

function resize()
{
    size = Math.min(window.innerWidth, window.innerHeight);
	aspectExtra = (window.innerWidth - window.innerHeight) / 2; // TODO: Make axis independent
	//game.viewbox(-aspectExtra,128+aspectExtra,128,128);
	game.viewbox(0,0,128,128);
    container.style.width = window.innerWidth + "px";
    container.style.height = window.innerHeight + "px";
}

function resizeCallback()
{
	if (resizeTimer)
	{
		clearTimeout(resizeTimer);
	}
	resizeTimer = setTimeout(resize, 250);
}

onload = initialize;
