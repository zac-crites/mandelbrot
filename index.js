function Mandlebrot(canvas) {
    var ITERATIONS = 500;
    var _context = canvas.getContext("2d");

    this.Scale = 2.5 / Math.min(_context.canvas.width, _context.canvas.height);
    this.OffsetX = -.5;
    this.OffsetY = 0;
    this.isRendering = false;

    this.render = () => {
        if (this.isRendering)
            return;
        this.isRendering = true;

        var y = 0;
        var self = this;

        var running = 0;
        for (var i = 0; i < 8; i++) {
            var worker = new Worker("iterationworker.js");
            PostData(y++, worker);
            running++;

            worker.onmessage = function (e) {

                _context.putImageData(e.data, 0, this.y);

                if (y < canvas.height) {
                    PostData(y++, this);
                }
                else {
                    this.terminate();
                    if (--running === 0)
                        self.isRendering = false;
                }
            }
        }

        function PostData(y, worker) {
            worker.y = y;
            worker.postMessage({
                y0: self.OffsetY + (y - (_context.canvas.height / 2)) * self.Scale,
                x0: self.OffsetX - (_context.canvas.width / 2) * self.Scale,
                scale: self.Scale,
                imageData: _context.getImageData(0, y, _context.canvas.width, 1),
                iterations: ITERATIONS
            });
        }
    }
}

window.onload = function () {

    var canvas = document.getElementById("fractalcanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var mousecontrols = document.getElementById("controlcanvas");
    mousecontrols.width = window.innerWidth;
    mousecontrols.height = window.innerHeight;
    var selectionContext = mousecontrols.getContext("2d");
    selectionContext.strokeStyle = "#FF0000";
    selectionContext.setLineDash([2, 4]);

    var set = new Mandlebrot(canvas);
    set.render();

    var dragStartX;
    var dragStartY;

    window.onmousedown = (e) => {
        if (set.isRendering)
            return;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }

    window.onmousemove = (e) => {
        if (dragStartX === undefined)
            return;
        selectionContext.clearRect(0, 0, mousecontrols.width, mousecontrols.height);
        selectionContext.strokeRect(dragStartX - .5, dragStartY - .5, e.clientX - dragStartX, e.clientY - dragStartY);
    }

    window.onmouseup = (e) => {
        mousecontrols.getContext("2d").clearRect(0, 0, mousecontrols.width, mousecontrols.height);

        if (dragStartX === undefined || set.isRendering)
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
    }

    window.onresize = function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        mousecontrols.width = window.innerWidth;
        mousecontrols.height = window.innerHeight;
        selectionContext.strokeStyle = "#FF0000";
        selectionContext.setLineDash([2, 4]);
        set.render();
    }
}