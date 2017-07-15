onmessage = function (e) {

    var data = e.data;
    var pixel = 0;
    for (var x = 0; x < data.imageData.width; x++ , pixel += 4, data.x0 += data.scale) {
        var n = multisample(data.x0, data.y0, 4, data.iterations, data.scale);
        data.imageData.data[pixel] = n < data.iterations ? Math.floor(255.0 * (n / (data.iterations - 1.0))) : 0;
        data.imageData.data[pixel + 3] = 255;
    }

    postMessage(data.imageData);
}

function iterate(Cr, Ci, escapeRadius, maxIterations) {
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

function multisample(Cr, Ci, escapeRadius, maxIterations, scale) {
    var n = iterate(Cr, Ci, escapeRadius, maxIterations);
    n += iterate(Cr + scale / 2, Ci, escapeRadius, maxIterations);
    n += iterate(Cr + scale / 2, Ci + scale / 2, escapeRadius, maxIterations);
    n += iterate(Cr, Ci + scale / 2, escapeRadius, maxIterations);
    return n / 4;
}