// Generated code -- CC0 -- No Rights Reserved -- http://www.redblobgames.com/grids/hexagons/
"use strict";



function Point(x, y) {
    return {x: x, y: y};
}




function Hex(q, r, s) {
    if (Math.round(q + r + s) !== 0) throw "q + r + s must be 0";
    return {q: q, r: r, s: s};
}

function hex_add(a, b)
{
    return Hex(a.q + b.q, a.r + b.r, a.s + b.s);
}

function hex_subtract(a, b)
{
    return Hex(a.q - b.q, a.r - b.r, a.s - b.s);
}

function hex_scale(a, k)
{
    return Hex(a.q * k, a.r * k, a.s * k);
}

function hex_rotate_left(a)
{
    return Hex(-a.s, -a.q, -a.r);
}

function hex_rotate_right(a)
{
    return Hex(-a.r, -a.s, -a.q);
}

var hex_directions = [Hex(1, 0, -1), Hex(1, -1, 0), Hex(0, -1, 1), Hex(-1, 0, 1), Hex(-1, 1, 0), Hex(0, 1, -1)];
function hex_direction(direction)
{
    return hex_directions[direction];
}

function hex_neighbor(hex, direction)
{
    return hex_add(hex, hex_direction(direction));
}

var hex_diagonals = [Hex(2, -1, -1), Hex(1, -2, 1), Hex(-1, -1, 2), Hex(-2, 1, 1), Hex(-1, 2, -1), Hex(1, 1, -2)];
function hex_diagonal_neighbor(hex, direction)
{
    return hex_add(hex, hex_diagonals[direction]);
}

function hex_length(hex)
{
    return (Math.abs(hex.q) + Math.abs(hex.r) + Math.abs(hex.s)) / 2;
}

function hex_distance(a, b)
{
    return hex_length(hex_subtract(a, b));
}

function hex_round(h)
{
    var qi = Math.round(h.q);
    var ri = Math.round(h.r);
    var si = Math.round(h.s);
    var q_diff = Math.abs(qi - h.q);
    var r_diff = Math.abs(ri - h.r);
    var s_diff = Math.abs(si - h.s);
    if (q_diff > r_diff && q_diff > s_diff)
    {
        qi = -ri - si;
    }
    else
        if (r_diff > s_diff)
        {
            ri = -qi - si;
        }
        else
        {
            si = -qi - ri;
        }
    return Hex(qi, ri, si);
}

function hex_lerp(a, b, t)
{
    return Hex(a.q * (1.0 - t) + b.q * t, a.r * (1.0 - t) + b.r * t, a.s * (1.0 - t) + b.s * t);
}

function hex_linedraw(a, b)
{
    var N = hex_distance(a, b);
    var a_nudge = Hex(a.q + 1e-06, a.r + 1e-06, a.s - 2e-06);
    var b_nudge = Hex(b.q + 1e-06, b.r + 1e-06, b.s - 2e-06);
    var results = [];
    var step = 1.0 / Math.max(N, 1);
    for (var i = 0; i <= N; i++)
    {
        results.push(hex_round(hex_lerp(a_nudge, b_nudge, step * i)));
    }
    return results;
}




function OffsetCoord(col, row) {
    return {col: col, row: row};
}

var EVEN = 1;
var ODD = -1;
function qoffset_from_cube(offset, h)
{
    var col = h.q;
    var row = h.r + (h.q + offset * (h.q & 1)) / 2;
    if (offset !== EVEN && offset !== ODD)
    {
        throw "offset must be EVEN (+1) or ODD (-1)";
    }
    return OffsetCoord(col, row);
}

function qoffset_to_cube(offset, h)
{
    var q = h.col;
    var r = h.row - (h.col + offset * (h.col & 1)) / 2;
    var s = -q - r;
    if (offset !== EVEN && offset !== ODD)
    {
        throw "offset must be EVEN (+1) or ODD (-1)";
    }
    return Hex(q, r, s);
}

function roffset_from_cube(offset, h)
{
    var col = h.q + (h.r + offset * (h.r & 1)) / 2;
    var row = h.r;
    if (offset !== EVEN && offset !== ODD)
    {
        throw "offset must be EVEN (+1) or ODD (-1)";
    }
    return OffsetCoord(col, row);
}

function roffset_to_cube(offset, h)
{
    var q = h.col - (h.row + offset * (h.row & 1)) / 2;
    var r = h.row;
    var s = -q - r;
    if (offset !== EVEN && offset !== ODD)
    {
        throw "offset must be EVEN (+1) or ODD (-1)";
    }
    return Hex(q, r, s);
}




function DoubledCoord(col, row) {
    return {col: col, row: row};
}

function qdoubled_from_cube(h)
{
    var col = h.q;
    var row = 2 * h.r + h.q;
    return DoubledCoord(col, row);
}

function qdoubled_to_cube(h)
{
    var q = h.col;
    var r = (h.row - h.col) / 2;
    var s = -q - r;
    return Hex(q, r, s);
}

function rdoubled_from_cube(h)
{
    var col = 2 * h.q + h.r;
    var row = h.r;
    return DoubledCoord(col, row);
}

function rdoubled_to_cube(h)
{
    var q = (h.col - h.row) / 2;
    var r = h.row;
    var s = -q - r;
    return Hex(q, r, s);
}




function Orientation(f0, f1, f2, f3, b0, b1, b2, b3, start_angle) {
    return {f0: f0, f1: f1, f2: f2, f3: f3, b0: b0, b1: b1, b2: b2, b3: b3, start_angle: start_angle};
}




function Layout(orientation, size, origin) {
    return {orientation: orientation, size: size, origin: origin};
}

var layout_pointy = Orientation(Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0, Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0, 0.5);
var layout_flat = Orientation(3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0), 2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0, 0.0);
function hex_to_pixel(layout, h)
{
    var M = layout.orientation;
    var size = layout.size;
    var origin = layout.origin;
    var x = (M.f0 * h.q + M.f1 * h.r) * size.x;
    var y = (M.f2 * h.q + M.f3 * h.r) * size.y;
    return Point(x + origin.x, y + origin.y);
}

function pixel_to_hex(layout, p)
{
    var M = layout.orientation;
    var size = layout.size;
    var origin = layout.origin;
    var pt = Point((p.x - origin.x) / size.x, (p.y - origin.y) / size.y);
    var q = M.b0 * pt.x + M.b1 * pt.y;
    var r = M.b2 * pt.x + M.b3 * pt.y;
    return Hex(q, r, -q - r);
}

function hex_corner_offset(layout, corner)
{
    var M = layout.orientation;
    var size = layout.size;
    var angle = 2.0 * Math.PI * (M.start_angle - corner) / 6.0;
    return Point(size.x * Math.cos(angle), size.y * Math.sin(angle));
}

function polygon_corners(layout, h)
{
    var corners = [];
    var center = hex_to_pixel(layout, h);
    for (var i = 0; i < 6; i++)
    {
        var offset = hex_corner_offset(layout, i);
        corners.push(Point(center.x + offset.x, center.y + offset.y));
    }
    return corners;
}




// Tests

function complain(name) {
    console.log("FAIL", name);
}

function equal_hex(name, a, b)
{
    if (!(a.q === b.q && a.s === b.s && a.r === b.r))
    {
        complain(name);
    }
}

function equal_offsetcoord(name, a, b)
{
    if (!(a.col === b.col && a.row === b.row))
    {
        complain(name);
    }
}

function equal_doubledcoord(name, a, b)
{
    if (!(a.col === b.col && a.row === b.row))
    {
        complain(name);
    }
}

function equal_int(name, a, b)
{
    if (!(a === b))
    {
        complain(name);
    }
}

function equal_hex_array(name, a, b)
{
    equal_int(name, a.length, b.length);
    for (var i = 0; i < a.length; i++)
    {
        equal_hex(name, a[i], b[i]);
    }
}

function test_hex_arithmetic()
{
    equal_hex("hex_add", Hex(4, -10, 6), hex_add(Hex(1, -3, 2), Hex(3, -7, 4)));
    equal_hex("hex_subtract", Hex(-2, 4, -2), hex_subtract(Hex(1, -3, 2), Hex(3, -7, 4)));
}

function test_hex_direction()
{
    equal_hex("hex_direction", Hex(0, -1, 1), hex_direction(2));
}

function test_hex_neighbor()
{
    equal_hex("hex_neighbor", Hex(1, -3, 2), hex_neighbor(Hex(1, -2, 1), 2));
}

function test_hex_diagonal()
{
    equal_hex("hex_diagonal", Hex(-1, -1, 2), hex_diagonal_neighbor(Hex(1, -2, 1), 3));
}

function test_hex_distance()
{
    equal_int("hex_distance", 7, hex_distance(Hex(3, -7, 4), Hex(0, 0, 0)));
}

function test_hex_rotate_right()
{
    equal_hex("hex_rotate_right", hex_rotate_right(Hex(1, -3, 2)), Hex(3, -2, -1));
}

function test_hex_rotate_left()
{
    equal_hex("hex_rotate_left", hex_rotate_left(Hex(1, -3, 2)), Hex(-2, -1, 3));
}

function test_hex_round()
{
    var a = Hex(0.0, 0.0, 0.0);
    var b = Hex(1.0, -1.0, 0.0);
    var c = Hex(0.0, -1.0, 1.0);
    equal_hex("hex_round 1", Hex(5, -10, 5), hex_round(hex_lerp(Hex(0.0, 0.0, 0.0), Hex(10.0, -20.0, 10.0), 0.5)));
    equal_hex("hex_round 2", hex_round(a), hex_round(hex_lerp(a, b, 0.499)));
    equal_hex("hex_round 3", hex_round(b), hex_round(hex_lerp(a, b, 0.501)));
    equal_hex("hex_round 4", hex_round(a), hex_round(Hex(a.q * 0.4 + b.q * 0.3 + c.q * 0.3, a.r * 0.4 + b.r * 0.3 + c.r * 0.3, a.s * 0.4 + b.s * 0.3 + c.s * 0.3)));
    equal_hex("hex_round 5", hex_round(c), hex_round(Hex(a.q * 0.3 + b.q * 0.3 + c.q * 0.4, a.r * 0.3 + b.r * 0.3 + c.r * 0.4, a.s * 0.3 + b.s * 0.3 + c.s * 0.4)));
}

function test_hex_linedraw()
{
    equal_hex_array("hex_linedraw", [Hex(0, 0, 0), Hex(0, -1, 1), Hex(0, -2, 2), Hex(1, -3, 2), Hex(1, -4, 3), Hex(1, -5, 4)], hex_linedraw(Hex(0, 0, 0), Hex(1, -5, 4)));
}

function test_layout()
{
    var h = Hex(3, 4, -7);
    var flat = Layout(layout_flat, Point(10.0, 15.0), Point(35.0, 71.0));
    equal_hex("layout", h, hex_round(pixel_to_hex(flat, hex_to_pixel(flat, h))));
    var pointy = Layout(layout_pointy, Point(10.0, 15.0), Point(35.0, 71.0));
    equal_hex("layout", h, hex_round(pixel_to_hex(pointy, hex_to_pixel(pointy, h))));
}

function test_offset_roundtrip()
{
    var a = Hex(3, 4, -7);
    var b = OffsetCoord(1, -3);
    equal_hex("conversion_roundtrip even-q", a, qoffset_to_cube(EVEN, qoffset_from_cube(EVEN, a)));
    equal_offsetcoord("conversion_roundtrip even-q", b, qoffset_from_cube(EVEN, qoffset_to_cube(EVEN, b)));
    equal_hex("conversion_roundtrip odd-q", a, qoffset_to_cube(ODD, qoffset_from_cube(ODD, a)));
    equal_offsetcoord("conversion_roundtrip odd-q", b, qoffset_from_cube(ODD, qoffset_to_cube(ODD, b)));
    equal_hex("conversion_roundtrip even-r", a, roffset_to_cube(EVEN, roffset_from_cube(EVEN, a)));
    equal_offsetcoord("conversion_roundtrip even-r", b, roffset_from_cube(EVEN, roffset_to_cube(EVEN, b)));
    equal_hex("conversion_roundtrip odd-r", a, roffset_to_cube(ODD, roffset_from_cube(ODD, a)));
    equal_offsetcoord("conversion_roundtrip odd-r", b, roffset_from_cube(ODD, roffset_to_cube(ODD, b)));
}

function test_offset_from_cube()
{
    equal_offsetcoord("offset_from_cube even-q", OffsetCoord(1, 3), qoffset_from_cube(EVEN, Hex(1, 2, -3)));
    equal_offsetcoord("offset_from_cube odd-q", OffsetCoord(1, 2), qoffset_from_cube(ODD, Hex(1, 2, -3)));
}

function test_offset_to_cube()
{
    equal_hex("offset_to_cube even-", Hex(1, 2, -3), qoffset_to_cube(EVEN, OffsetCoord(1, 3)));
    equal_hex("offset_to_cube odd-q", Hex(1, 2, -3), qoffset_to_cube(ODD, OffsetCoord(1, 2)));
}

function test_doubled_roundtrip()
{
    var a = Hex(3, 4, -7);
    var b = DoubledCoord(1, -3);
    equal_hex("conversion_roundtrip doubled-q", a, qdoubled_to_cube(qdoubled_from_cube(a)));
    equal_doubledcoord("conversion_roundtrip doubled-q", b, qdoubled_from_cube(qdoubled_to_cube(b)));
    equal_hex("conversion_roundtrip doubled-r", a, rdoubled_to_cube(rdoubled_from_cube(a)));
    equal_doubledcoord("conversion_roundtrip doubled-r", b, rdoubled_from_cube(rdoubled_to_cube(b)));
}

function test_doubled_from_cube()
{
    equal_doubledcoord("doubled_from_cube doubled-q", DoubledCoord(1, 5), qdoubled_from_cube(Hex(1, 2, -3)));
    equal_doubledcoord("doubled_from_cube doubled-r", DoubledCoord(4, 2), rdoubled_from_cube(Hex(1, 2, -3)));
}

function test_doubled_to_cube()
{
    equal_hex("doubled_to_cube doubled-q", Hex(1, 2, -3), qdoubled_to_cube(DoubledCoord(1, 5)));
    equal_hex("doubled_to_cube doubled-r", Hex(1, 2, -3), rdoubled_to_cube(DoubledCoord(4, 2)));
}

function test_all()
{
    test_hex_arithmetic();
    test_hex_direction();
    test_hex_neighbor();
    test_hex_diagonal();
    test_hex_distance();
    test_hex_rotate_right();
    test_hex_rotate_left();
    test_hex_round();
    test_hex_linedraw();
    test_layout();
    test_offset_roundtrip();
    test_offset_from_cube();
    test_offset_to_cube();
    test_doubled_roundtrip();
    test_doubled_from_cube();
    test_doubled_to_cube();
}



test_all()

// Exports for node/browserify modules:

exports.Point = Point;

exports.Hex = Hex;
exports.hex_add = hex_add;
exports.hex_subtract = hex_subtract;
exports.hex_scale = hex_scale;
exports.hex_rotate_left = hex_rotate_left;
exports.hex_rotate_right = hex_rotate_right;
exports.hex_directions = hex_directions;
exports.hex_direction = hex_direction;
exports.hex_neighbor = hex_neighbor;
exports.hex_diagonals = hex_diagonals;
exports.hex_diagonal_neighbor = hex_diagonal_neighbor;
exports.hex_length = hex_length;
exports.hex_distance = hex_distance;
exports.hex_round = hex_round;
exports.hex_lerp = hex_lerp;
exports.hex_linedraw = hex_linedraw;

exports.OffsetCoord = OffsetCoord;
exports.EVEN = EVEN;
exports.ODD = ODD;
exports.qoffset_from_cube = qoffset_from_cube;
exports.qoffset_to_cube = qoffset_to_cube;
exports.roffset_from_cube = roffset_from_cube;
exports.roffset_to_cube = roffset_to_cube;

exports.DoubledCoord = DoubledCoord;
exports.qdoubled_from_cube = qdoubled_from_cube;
exports.qdoubled_to_cube = qdoubled_to_cube;
exports.rdoubled_from_cube = rdoubled_from_cube;
exports.rdoubled_to_cube = rdoubled_to_cube;

exports.Orientation = Orientation;

exports.Layout = Layout;
exports.layout_pointy = layout_pointy;
exports.layout_flat = layout_flat;
exports.hex_to_pixel = hex_to_pixel;
exports.pixel_to_hex = pixel_to_hex;
exports.hex_corner_offset = hex_corner_offset;
exports.polygon_corners = polygon_corners;

