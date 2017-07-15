function Mandlebrot(canvas) {

    var ITERATIONS = 300;
    var _context = canvas.getContext("2d");

    this.Scale = 2.5 / Math.min(_context.canvas.width, _context.canvas.height);
    this.OffsetX = -.5;
    this.OffsetY = 0;

    var iterate = (Cr, Ci, escapeRadius, maxIterations) => {
        var Zr = 0;
        var Zi = 0;
        var Tr = 0;
        var Ti = 0;
        var n = 0;

        while (n++ < maxIterations && (Tr + Ti) < escapeRadius) {
            Zi = 2 * (Zr * Zi) + Ci;
            Zr = Tr - Ti + Cr;
            Tr = Zr * Zr;
            Ti = Zi * Zi;
        }

        return n;
    }

    var multisample = (Cr, Ci, escapeRadius, maxIterations) => {
        var n = iterate(Cr + this.Scale / 2, Ci, 4, ITERATIONS);
        n += iterate(Cr + this.Scale / 2, Ci, 4, ITERATIONS);
        n += iterate(Cr + this.Scale / 2, Ci + this.Scale / 2, 4, ITERATIONS);
        n += iterate(Cr, Ci + this.Scale / 2, 4, ITERATIONS);
        return n / 4;
    }

    var drawLine = (y) => {
        var yOff = y * _context.canvas.width;
        var imgData = _context.getImageData(0, y, _context.canvas.width, 1);
        var y0 = this.OffsetY + (y - (_context.canvas.height / 2)) * this.Scale;
        var x0 = this.OffsetX - (_context.canvas.width / 2) * this.Scale;

        var pixel = 0;
        for (var x = 0; x < _context.canvas.width; x++ , pixel += 4, x0 += this.Scale) {

            var n = multisample(x0, y0, 4, ITERATIONS);
            imgData.data[pixel] = n < ITERATIONS ? Math.floor(255.0 * (n / (ITERATIONS - 1.0))) : 0;
            imgData.data[pixel + 3] = 255;
        }

        _context.putImageData(imgData, 0, y);

        if (y < _context.canvas.height) {
            drawLine(y + 1);
        }
    }

    this.render = () => {
        drawLine(0);
    }
}

window.onload = function () {

    var canvas = document.getElementById("fractalcanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var mousecontrols = document.getElementById("controlcanvas");
    mousecontrols.width = window.innerWidth;
    mousecontrols.height = window.innerHeight;

    var set = new Mandlebrot(canvas);
    set.render();

    var dragStartX;
    var dragStartY;

    window.onmousedown = (e) => {
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }

    window.onmousemove = (e) => {
        if (dragStartX === undefined)
            return;
        var c = mousecontrols.getContext("2d");
        c.clearRect(0, 0, mousecontrols.width, mousecontrols.height);
        c.strokeStyle = "#FF0000";
        c.lineWidth = 1;
        c.strokeRect(dragStartX, dragStartY, e.clientX - dragStartX, e.clientY - dragStartY);
    }

    window.onmouseup = (e) => {
        if (dragStartX === undefined)
            return;
        var x1 = (canvas.width / mousecontrols.width) * (dragStartX - mousecontrols.width / 2) * set.Scale + set.OffsetX;
        var x2 = (canvas.width / mousecontrols.width) * (e.clientX - mousecontrols.width / 2) * set.Scale + set.OffsetX;
        var y1 = (canvas.height / mousecontrols.height) * (dragStartY - mousecontrols.height / 2) * set.Scale + set.OffsetY;
        var y2 = (canvas.height / mousecontrols.height) * (e.clientY - mousecontrols.height / 2) * set.Scale + set.OffsetY;

        set.Scale = Math.max(Math.abs(x1 - x2) / canvas.width, Math.abs(y1 - y2) / canvas.height);
        set.OffsetX = (x1 + x2) / 2;
        set.OffsetY = (y1 + y2) / 2;
        set.render();

        dragStartX = dragStartY = undefined;
        mousecontrols.getContext("2d").clearRect(0, 0, mousecontrols.width, mousecontrols.height);
    }

    window.onresize = function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        mousecontrols.width = window.innerWidth;
        mousecontrols.height = window.innerHeight;

        set.render();
    }
}