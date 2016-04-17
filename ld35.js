var container = null;
var game = null;
var size = null;
var aspectExtra;
var resizeTimer;

var papers = [];
var paperGroup;
var paperObjects = [];
var options = [];
var optionGroup;
var optionObjects = [];
var gridGroup;
var foldLine = [[0,0],[0,0]];
var foldLineObject;

var mode = "line";

function initialize()
{

    container = document.getElementById("game");
    container.setAttribute("tabindex", 0)
    container.addEventListener("mousedown", mouseDown);
    container.addEventListener("mouseup", mouseUp);
    container.addEventListener("mousemove", hovered);
    container.addEventListener("keyup", pressed);
    container.focus();
	container.style.backgroundColor = "#00010f";

    game = SVG("game");
	resize();
	window.onresize = resizeCallback;

	papers.push([[16,16], [112,16], [112,112], [16,112]]);
	paperGroup = game.group().fill("#fff");
	paperObjects.push(paperGroup.polygon(papers[0]));
	optionGroup = game.group().fill("#fff");
	foldLineObject = game.line([[0, 0], [0, 0]]).stroke({color:"#f698ec", width: 0.5});
    var gridStyle = { color: "#bbb", width: 0.2 };
	gridGroup = game.group()
    for (var i=0; i<=128; i+=8)
    {
        gridGroup.line(i, 0, i, 128).stroke(gridStyle);
        gridGroup.line(0, i, 128, i).stroke(gridStyle);
    }

}

function mouseDown(e)
{
	if (mode == "line")
	{
		foldLine[0] = [Math.round(gameX(e.clientX)/8)*8, Math.round(gameY(e.clientY)/8)*8];
		e.preventDefault();
		hovered(e);
	}
}
function hovered(e)
{
	if (mode == "line")
	{
		if (e.buttons)
		{
			foldLine[1] = [gameX(e.clientX), gameY(e.clientY)];
			foldLineObject.plot(foldLine);
		}
	}
	else if (mode == "pick")
	{
		pick(e);
	}
	else
	{
		alert("Mode not specified!");
	}
}
function mouseUp(e)
{

	if (mode == "line")
	{
		foldLine[1][0] = Math.round(gameX(e.clientX)/8)*8;
		foldLine[1][1] = Math.round(gameY(e.clientY)/8)*8;
		split();
		mode = "pick";
		foldLineObject.plot(foldLine);
	}
	else if (mode == "pick")
	{
		fold(pick(e));
		colorLayers();
		mode = "line";
	}
	else
	{
		alert("Mode not set by default!")
	}

}

function split()
{

	// Fold each layer of the paper
	for (var layer=0; layer<papers.length; ++layer)
	{
		var paper = papers[layer];
		var intersections = 0;
		var option = [];
		var firstPoint = paper[0];
		var m = slope(foldLine);
		var b = yIntercept(m, foldLine[0]);
		var paperUp;
		var epsilon = 0.001;
		if (m != null)
		{
			paperUp = firstPoint[1] + epsilon > m*firstPoint[0]+b;
			// Lands directly on the line.
			while (Math.abs(paper[1][1] - m*paper[1][0]+b) < epsilon)
			{
				if (Math.abs(paper[1][1] - m*paper[1][0]+b) < epsilon)
					paperUp = false;
				else
					paperUp = true;
			}
		}
		else
		{
			paperUp = firstPoint[0] - epsilon < foldLine[0][0];
			// Lands directly on the line.
			if (paperUp && firstPoint[0] + epsilon > foldLine[0][0])
			{
				if (Math.abs(paper[1][0] - foldLine[0][0]) < epsilon)
					paperUp = false;
				else
					paperUp = true;
			}
		}
		for (var i=0; i<paper.length; ++i)
		{
			var nextPoint;
			if (i != paper.length-1)
				nextPoint = paper[i+1]
			else
				nextPoint = firstPoint;
			intersection = intersect([paper[i], nextPoint], foldLine);
			var x = intersection[0];
			var y = intersection[1];
			// Checks if the intersect is within the bounds of both line segments
			var intersected = (
				x >= Math.min(nextPoint[0], paper[i][0]) && x <= Math.max(nextPoint[0], paper[i][0]) &&
				y >= Math.min(nextPoint[1], paper[i][1]) && y <= Math.max(nextPoint[1], paper[i][1]) &&
				x >= Math.min(foldLine[0][0], foldLine[1][0]) && x <= Math.max(foldLine[0][0], foldLine[1][0]) &&
				y >= Math.min(foldLine[0][1], foldLine[1][1]) && y <= Math.max(foldLine[0][1], foldLine[1][1]));
			// (intersection[0] != nextPoint[0] || intersection[1] != nextPoint[1])) &&
			// (intersection[0] != paper[i][0] || intersection[1] != paper[i][1]
			if ((intersections == 1 && paperUp) || (intersections != 1 && !paperUp))
			{
				option.push(paper[i]);
				paper.splice(i--, 1);
			}
			if (intersected)
			{
				game.circle(3).move(x, y).fill("#0f0");
				//if (((intersection[0] != nextPoint[0] || intersection[1] != nextPoint[1])) &&
				//	(intersection[0] != paper[i][0] || intersection[1] != paper[i][1]))
				{
					paper.splice(++i, 0, intersection);
					option.push(intersection);
				}
				++intersections;
			}
		}
		if (paper.length <= 2)
		{
			paperObjects[layer].remove();
			paperObjects.splice(layer, 1);
			papers.splice(layer--, 1);
		}
		else
		{
			paperObjects[layer].plot(paper);
		}
		if (option.length > 2)
		{
			optionObjects.push(optionGroup.polygon(option));
			options.push(option);
		}

	}
	paperGroup.fill("#00f");

}

// Returns true if paper section is selected, false if option section
function pick(e)
{

	// The piece containing paper[0] is by default the bottom layer
	// Determine if this corner is above or below the line, in order to map mouse position to layer
	var m = slope(foldLine);
	var b = yIntercept(m, foldLine[0]);
	var mouseUp;
	if (m != null)
		mouseUp = gameY(e.clientY) > m*gameX(e.clientX)+b;
	else
		mouseUp = gameX(e.clientX) < foldLine[0][0];
	if (mouseUp)
	{
		colorLayers(true);
		optionGroup.fill("#fff");
		return true;
	}
	else
	{
		colorLayers(false);
		optionGroup.fill("#f698ec");
		return false;
	}

}

function fold(paperSelected)
{
	var m = slope(foldLine);
	var b = yIntercept(m, foldLine[0]); // Equation for y-intercept
	var pieces;
	if (paperSelected)
		pieces = papers;
	else
		pieces = options;
	for (var layer=0; layer<pieces.length; ++layer)
	{
		var piece = pieces[layer];
		for (var i=0; i<piece.length; ++i)
		{
			if (m != null)
			{
				// Algorithm for reflecting point across line
				var d = (piece[i][0] + (piece[i][1]-b)*m)/(1 + m*m);
				var newX = 2*d - piece[i][0];
				var newY = 2*d*m - piece[i][1] + 2*b;
				piece[i] = [newX, newY];
			}
			else
			{
				// Vertical line, just slide over
				piece[i] = [-piece[i][0]+2*foldLine[0][0], piece[i][1]];
			}
		}
	}
	for (var layer=0; layer<options.length; ++layer)
	{
		var entry = (!paperSelected)*papers.length + paperSelected*layer;
		papers.splice(entry, 0, options[layer]);
		paperObjects.splice(entry, 0, optionObjects[layer]);
		paperGroup.add(paperObjects[entry]);
	}
	for (var layer=0; layer<paperObjects.length; ++layer)
	{
		paperObjects[layer].plot(papers[layer]);
	}
	options = [];
	optionObjects = [];
}

function colorLayers(highlight)
{
	for (var layer=0; layer<paperObjects.length; ++layer)
	{
		var color;
		if (highlight)
		{
			color = "#f698ec";
		}
		else
		{
			var per = 15;
			var grey = 255-layer*per;
			color = {r: grey, g: grey, b: grey};
		}
		paperObjects[layer].fill(new SVG.Color(color));
		paperObjects[layer].remove();
		paperGroup.add(paperObjects[layer]);
	}
}

function intersect(line1, line2)
{
	var m = slope(line2); // Slope
	var b = yIntercept(m, line2[0]); // Equation for y-intercept
	var n = slope(line1);
	var x;
	var y;
	if (n != null)
	{
		var c = yIntercept(n, line1[0]);
		if (m != null)
		{
			x = (c-b)/(m-n); // Equation for intersection of a line
			y = m*x+b;
		}
		else
		{
			x = line2[0][0];
			y = n*x+c;
		}
	}
	else if (m != null)
	{
		x = line1[0][0]; // Vertical line: x is any point on it
		y = m*x+b;
	}
	return [x, y];
}

function yIntercept(m, point)
{
	return point[1] - m*point[0];
}

function pressed(e)
{

}

function slope(line)
{
	var dx = line[1][0] - line[0][0];
    if (dx == 0)
        return null;
    else
        return (line[1][1] - line[0][1]) / dx;
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
	aspectExtra = (window.innerWidth - window.innerHeight) / 2; // TODO: Make axis-independent
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
