"""BB monogram variants — staggered/offset layouts."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import math, os

FONTS = "/Users/jonathankrywicki/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/737b41ef-898f-4501-a97d-73cd81a1496c/bac370a3-d81b-4df4-bd3c-44de844593a9/skills/canvas-design/canvas-fonts"
OUT = "/Users/jonathankrywicki/Claude/barmibuddy/logo-concepts"

BG       = (8, 9, 13)
PURPLE   = (124, 58, 237)
PURPLE_L = (167, 139, 250)
PURPLE_D = (76, 29, 149)
ORANGE   = (251, 146, 60)
ORANGE_D = (234, 88, 12)
SKY      = (14, 165, 233)
WHITE    = (255, 255, 255)
INK      = (16, 18, 26)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i]-a[i])*t) for i in range(3))

def gradient_fill(size, c1, c2, angle_deg=135):
    w, h = size
    img = Image.new("RGB", (w, h), c1)
    px = img.load()
    a = math.radians(angle_deg)
    dx, dy = math.cos(a), math.sin(a)
    projs = [i*dx + j*dy for i in (0, w) for j in (0, h)]
    pmin, pmax = min(projs), max(projs)
    for y in range(h):
        for x in range(w):
            t = ((x*dx + y*dy) - pmin) / (pmax - pmin)
            px[x, y] = lerp(c1, c2, t)
    return img

def shield_points(cx, cy, w, h):
    return [
        (cx - w/2,        cy - h/2),
        (cx + w/2,        cy - h/2),
        (cx + w/2,        cy - h/2 + h*0.18),
        (cx + w/2*0.92,   cy + h*0.18),
        (cx + w/2*0.55,   cy + h/2*0.85),
        (cx,              cy + h/2),
        (cx - w/2*0.55,   cy + h/2*0.85),
        (cx - w/2*0.92,   cy + h*0.18),
        (cx - w/2,        cy - h/2 + h*0.18),
    ]

def b_outer(ox, oy, h, w, lean):
    top = oy - h/2; bot = oy + h/2
    left = ox - w/2; right = ox + w/2; mid = oy
    steps = 36
    pts = [(left, top)]
    ry_t = (mid - top)/2; cx_t = right - ry_t; cy_t = top + ry_t
    pts.append((cx_t, top))
    for i in range(steps+1):
        a = -math.pi/2 + i*math.pi/steps
        pts.append((cx_t + math.cos(a)*ry_t, cy_t + math.sin(a)*ry_t))
    ry_b = (bot - mid)/2; cx_b = right - ry_b; cy_b = mid + ry_b
    pts.append((cx_b, mid))
    for i in range(steps+1):
        a = -math.pi/2 + i*math.pi/steps
        pts.append((cx_b + math.cos(a)*ry_b, cy_b + math.sin(a)*ry_b))
    pts.append((left, bot))
    return [(x + (oy - y)*lean, y) for (x,y) in pts]

def b_inner(ox, oy, h, w, stroke, lean, top_half=True):
    top = oy - h/2; bot = oy + h/2
    left = ox - w/2; right = ox + w/2; mid = oy
    steps = 28
    if top_half:
        y1, y2 = top + stroke, mid - stroke*0.30
    else:
        y1, y2 = mid + stroke*0.30, bot - stroke
    ry = (y2 - y1)/2
    cx_c = right - stroke - ry; cy_c = (y1 + y2)/2
    pts = [(left + stroke, y1), (cx_c, y1)]
    for i in range(steps+1):
        a = -math.pi/2 + i*math.pi/steps
        pts.append((cx_c + math.cos(a)*ry, cy_c + math.sin(a)*ry))
    pts.append((left + stroke, y2))
    return [(x + (oy - y)*lean, y) for (x,y) in pts]

def make_bb(size, layout="stacked-diag", lean=0.16):
    """
    layouts:
      stacked-diag : left B higher-left, right B lower-right (diagonal stagger)
      stacked-rev  : left B lower-left, right B higher-right (counter-diagonal)
      stacked-tight: bigger overlap, B's interlocked
      stacked-mono : single column, one above the other
      stacked-mirror: B's mirrored — left B is reversed
      stacked-tilt : B's at slight rotations
    Returns RGBA layer with gradient + outline + shadow.
    """
    h = size
    w = size * 0.55
    stroke = size * 0.22

    # determine canvas size based on layout
    if layout == "stacked-mono":
        img_w = int(w + 200)
        img_h = int(h * 1.7 + 200)
    else:
        img_w = int(w * 2.2 + 240)
        img_h = int(h * 1.55 + 200)

    fill_mask = Image.new("L", (img_w, img_h), 0)
    fd = ImageDraw.Draw(fill_mask)
    outline_layer = Image.new("RGBA", (img_w, img_h), (0,0,0,0))
    od = ImageDraw.Draw(outline_layer)

    # define center coords per layout
    if layout == "stacked-diag":
        # left B up-left, right B down-right
        c1 = (img_w*0.40, img_h*0.36)
        c2 = (img_w*0.62, img_h*0.64)
        leans = (lean, lean)
    elif layout == "stacked-rev":
        c1 = (img_w*0.40, img_h*0.64)
        c2 = (img_w*0.62, img_h*0.36)
        leans = (lean, lean)
    elif layout == "stacked-tight":
        c1 = (img_w*0.42, img_h*0.40)
        c2 = (img_w*0.58, img_h*0.60)
        leans = (lean*1.3, lean*1.3)
    elif layout == "stacked-mono":
        c1 = (img_w*0.50, img_h*0.30)
        c2 = (img_w*0.50, img_h*0.70)
        leans = (lean, lean)
    elif layout == "stacked-mirror":
        c1 = (img_w*0.40, img_h*0.40)
        c2 = (img_w*0.62, img_h*0.60)
        leans = (-lean, lean)  # mirror lean
    elif layout == "stacked-stagger-tall":
        # two B's, second much taller / bolder offset
        c1 = (img_w*0.38, img_h*0.42)
        c2 = (img_w*0.65, img_h*0.58)
        leans = (lean*0.5, lean*1.5)
    else:
        c1 = (img_w*0.40, img_h*0.50)
        c2 = (img_w*0.60, img_h*0.50)
        leans = (lean, lean)

    # special handling for mirror — render second B with negative lean by flipping
    centers = [(c1, leans[0], False), (c2, leans[1], False)]
    if layout == "stacked-mirror":
        centers = [(c1, lean, True), (c2, lean, False)]  # first B mirrored
    if layout == "stacked-stagger-tall":
        # second B is bigger — handle separately
        h1, w1, s1 = h*0.85, w*0.85, stroke*0.85
        h2, w2, s2 = h*1.05, w*1.05, stroke*1.05
        configs = [(c1, lean, h1, w1, s1, False), (c2, lean, h2, w2, s2, False)]
    else:
        h1, w1, s1 = h, w, stroke
        configs = [(c[0], c[1], h, w, stroke, c[2]) for c in centers]

    # draw B fills into mask
    for (cx, cy), L, hh, ww, ss, mirror in configs:
        outer = b_outer(cx, cy, hh, ww, L)
        if mirror:
            outer = [(2*cx - x, y) for (x,y) in outer]
        fd.polygon(outer, fill=255)

    for (cx, cy), L, hh, ww, ss, mirror in configs:
        ti = b_inner(cx, cy, hh, ww, ss, L, True)
        bi = b_inner(cx, cy, hh, ww, ss, L, False)
        if mirror:
            ti = [(2*cx - x, y) for (x,y) in ti]
            bi = [(2*cx - x, y) for (x,y) in bi]
        fd.polygon(ti, fill=0)
        fd.polygon(bi, fill=0)

    # gradient
    grad = gradient_fill((img_w, img_h), ORANGE, PURPLE_L, 120).convert("RGBA")
    grad.putalpha(fill_mask)

    # outlines
    for (cx, cy), L, hh, ww, ss, mirror in configs:
        outer = b_outer(cx, cy, hh, ww, L)
        ti = b_inner(cx, cy, hh, ww, ss, L, True)
        bi = b_inner(cx, cy, hh, ww, ss, L, False)
        if mirror:
            outer = [(2*cx - x, y) for (x,y) in outer]
            ti = [(2*cx - x, y) for (x,y) in ti]
            bi = [(2*cx - x, y) for (x,y) in bi]
        od.line(outer + [outer[0]], fill=INK, width=10)
        od.line(ti + [ti[0]], fill=INK, width=6)
        od.line(bi + [bi[0]], fill=INK, width=6)

    final = Image.alpha_composite(grad, outline_layer)
    return final

def render_panel(path, layouts, W=2400, H=1800):
    """Grid of BB variants on a shield each."""
    base = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(base)
    for i in range(0, W, 80):
        d.line([(i,0),(i,H)], fill=(14,16,24), width=1)
    for j in range(0, H, 80):
        d.line([(0,j),(W,j)], fill=(14,16,24), width=1)

    cols = 3
    rows = math.ceil(len(layouts) / cols)
    cw = W / cols
    ch = (H - 200) / rows  # leave header room

    try:
        font_h = ImageFont.truetype(os.path.join(FONTS, "BigShoulders-Bold.ttf"), 64)
        font_label = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Bold.ttf"), 22)
        font_sub = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Regular.ttf"), 18)
    except:
        font_h = font_label = font_sub = ImageFont.load_default()

    # header
    d.text((60, 50), "BB MONOGRAM — STAGGERED VARIANTS", font=font_h, fill=WHITE)
    d.text((60, 130), "LOCKER-ROOM  MYTHOS  ·  CONCEPT  02b  ·  SIX OPTIONS", font=font_sub, fill=(120,130,160))

    for idx, (key, label) in enumerate(layouts):
        r = idx // cols
        c = idx % cols
        cx = c * cw + cw/2
        cy = 200 + r * ch + ch/2 - 40

        # shield
        sw, sh = 540, 620
        smask = Image.new("L", (W,H), 0)
        smd = ImageDraw.Draw(smask)
        smd.polygon(shield_points(cx, cy, sw, sh), fill=255)
        # shadow
        shadow = Image.new("RGBA", (W,H), (0,0,0,0))
        shd = ImageDraw.Draw(shadow)
        shd.polygon([(x, y+25) for (x,y) in shield_points(cx, cy, sw, sh)], fill=(0,0,0,180))
        shadow = shadow.filter(ImageFilter.GaussianBlur(28))
        base.paste(shadow, (0,0), shadow)
        # gradient
        grad = gradient_fill((W,H), PURPLE_D, PURPLE, 100)
        base.paste(grad, (0,0), smask)
        d2 = ImageDraw.Draw(base)
        # piping
        pts_out = shield_points(cx, cy, sw + 18, sh + 18)
        d2.line(pts_out + [pts_out[0]], fill=INK, width=12)
        pts = shield_points(cx, cy, sw, sh)
        d2.line(pts + [pts[0]], fill=SKY, width=6)

        # BB
        bb = make_bb(280, layout=key)
        bx = int(cx - bb.size[0]/2)
        by = int(cy - bb.size[1]/2)
        base.paste(bb, (bx, by), bb)

        # label
        d2 = ImageDraw.Draw(base)
        lbl_y = cy + sh/2 + 30
        tw = d2.textlength(label, font=font_label)
        d2.text((cx - tw/2, lbl_y), label, font=font_label, fill=WHITE)
        keylabel = f"VAR  0{idx+1}"
        tw2 = d2.textlength(keylabel, font=font_sub)
        d2.text((cx - tw2/2, lbl_y + 36), keylabel, font=font_sub, fill=(120,130,160))

    base.save(path, "PNG")

if __name__ == "__main__":
    layouts = [
        ("stacked-diag",         "DIAGONAL  ↘"),
        ("stacked-rev",          "COUNTER  ↗"),
        ("stacked-tight",        "INTERLOCK"),
        ("stacked-mono",         "STACKED  COLUMN"),
        ("stacked-mirror",       "MIRRORED"),
        ("stacked-stagger-tall", "BIG-LITTLE"),
    ]
    render_panel(os.path.join(OUT, "concept-02b-bb-variants.png"), layouts)
    print("variants done")
