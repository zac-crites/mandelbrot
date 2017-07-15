function Mandlebrot(canvas) {
    var _context = canvas.getContext("2d");

    this.iterations = 500;
    this.scale = 2.5 / Math.min(_context.canvas.width, _context.canvas.height);
    this.offsetX = -.5;
    this.offsetY = 0;
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
                y0: self.offsetY + (y - (_context.canvas.height / 2)) * self.scale,
                x0: self.offsetX - (_context.canvas.width / 2) * self.scale,
                scale: self.scale,
                imageData: _context.getImageData(0, y, _context.canvas.width, 1),
                iterations: self.iterations
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
    var controldiv = document.getElementById("mouseevents");

    controldiv.ontouchstart = controldiv.onmousedown = (e) => {
       if (set.isRendering)
           return;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }

    controldiv.ontouchmove = controldiv.onmousemove = (e) => {
        if (dragStartX === undefined)
            return;
        selectionContext.clearRect(0, 0, mousecontrols.width, mousecontrols.height);
        selectionContext.strokeRect(dragStartX - .5, dragStartY - .5, e.clientX - dragStartX, e.clientY - dragStartY);
    }

    controldiv.ontouchend = controldiv.onmouseup = (e) => {
        mousecontrols.getContext("2d").clearRect(0, 0, mousecontrols.width, mousecontrols.height);

        if (dragStartX === undefined || set.isRendering)
            return;

        var x1 = (canvas.width / mousecontrols.width) * (dragStartX - mousecontrols.width / 2) * set.scale + set.offsetX;
        var x2 = (canvas.width / mousecontrols.width) * (e.clientX - mousecontrols.width / 2) * set.scale + set.offsetX;
        var y1 = (canvas.height / mousecontrols.height) * (dragStartY - mousecontrols.height / 2) * set.scale + set.offsetY;
        var y2 = (canvas.height / mousecontrols.height) * (e.clientY - mousecontrols.height / 2) * set.scale + set.offsetY;

        set.scale = Math.max(Math.abs(x1 - x2) / canvas.width, Math.abs(y1 - y2) / canvas.height);
        set.offsetX = (x1 + x2) / 2;
        set.offsetY = (y1 + y2) / 2;
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