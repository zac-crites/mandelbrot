function Mandlebrot(canvas) {
    var _context = canvas.getContext("2d");

    this.iterations = 500;
    this.scale = 2.5 / Math.min(_context.canvas.width, _context.canvas.height);
    this.offsetX = -.5;
    this.offsetY = 0;
    this.isRendering = false;

    var nextRenderY = 0;
    this.render = () => {
        if (this.isRendering)
        {
            nextRenderY = 0;
            return;
        }
        this.isRendering = true;

        nextRenderY = 0;
        var self = this;

        var running = 0;
        var threads = navigator.hardwareConcurrency || 8;
        for (var i = 0; i < threads; i++) {
            var worker = new Worker("iterationworker.js");
            PostData(nextRenderY++, worker);
            running++;

            worker.onmessage = function (e) {

                _context.putImageData(e.data, 0, this.y);

                if (nextRenderY < canvas.height) {
                    PostData(nextRenderY++, this);
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

function Display(set) {
    var menu = document.getElementById("mainmenu");
    var iterationsDisplay = document.getElementById("iterationsDisplay");
    var xDisplay = document.getElementById("xOffsetDisplay");
    var yDisplay = document.getElementById("yOffsetDisplay");
    var scaleDisplay = document.getElementById("scaleDisplay");
    var renderbutton = document.getElementById("renderbutton");

    renderbutton.onclick = () => {
        this.commit();
        set.render();
    }

    this.commit = () => {
        var iterations = parseInt(iterationsDisplay.value);
        if (!isNaN(iterations))
            set.iterations = iterations;

        var offsetX = parseFloat( xDisplay.value );
        if (!isNaN(offsetX))
            set.offsetX = offsetX;

        var offsetY = parseFloat( yDisplay.value );
        if (!isNaN(offsetY))
            set.offsetY = offsetY;

        var zoom = parseFloat( scaleDisplay.value );
        if (!isNaN(zoom))
            set.scale = zoom;
    }

    this.update = () => {
        xDisplay.value = set.offsetX;
        yDisplay.value = set.offsetY;
        scaleDisplay.value = set.scale;
        iterationsDisplay.value = set.iterations;
    }

    this.toggle = () => {
        this.update();
        menu.style.display = (menu.style.display === "block") ? "none" : "block";
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

    var hud = new Display(set);
    hud.update();
    var dragStartX;
    var dragStartY;
    var controldiv = document.getElementById("mouseevents");

    window.onkeydown = (e) => {
        if (e.keyCode === 77)
            hud.toggle();
    }

    controldiv.ontouchstart = controldiv.onmousedown = (e) => {
        if (set.isRendering)
            return;

        if( e.shiftKey ) {
            hud.commit();
            set.scale *= 2;
            hud.update();
            set.render();
        }

        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }

    controldiv.ontouchmove = controldiv.onmousemove = (e) => {
        if (dragStartX === undefined || dragStartY === undefined )
            return;
        selectionContext.clearRect(0, 0, mousecontrols.width, mousecontrols.height);
        selectionContext.strokeRect(dragStartX - .5, dragStartY - .5, e.clientX - dragStartX, e.clientY - dragStartY);
    }

    controldiv.ontouchend = controldiv.onmouseup = (e) => {
        mousecontrols.getContext("2d").clearRect(0, 0, mousecontrols.width, mousecontrols.height);

        if (dragStartX === undefined|| dragStartY === undefined )
            return;

        if( dragStartX === e.clientX || dragStartY === e.clientY || set.isRendering )
        {
            dragStartX = dragStartY = undefined;
            return;
        }

        hud.commit();

        var x1 = (canvas.width / mousecontrols.width) * (dragStartX - mousecontrols.width / 2) * set.scale + set.offsetX;
        var x2 = (canvas.width / mousecontrols.width) * (e.clientX - mousecontrols.width / 2) * set.scale + set.offsetX;
        var y1 = (canvas.height / mousecontrols.height) * (dragStartY - mousecontrols.height / 2) * set.scale + set.offsetY;
        var y2 = (canvas.height / mousecontrols.height) * (e.clientY - mousecontrols.height / 2) * set.scale + set.offsetY;

        set.scale = Math.max(Math.abs(x1 - x2) / canvas.width, Math.abs(y1 - y2) / canvas.height);
        set.offsetX = (x1 + x2) / 2;
        set.offsetY = (y1 + y2) / 2;

        hud.update();
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