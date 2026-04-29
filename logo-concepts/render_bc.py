"""BB options B (flat colour, no outline) and C (single unified outline)."""
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
SKY_L    = (125, 211, 252)
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
    steps = 40
    pts = [(left, top), (right - (mid-top)/2, top)]
    ry_t = (mid - top)/2; cx_t = right - ry_t; cy_t = top + ry_t
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
    steps = 32
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

def lightning_bolt(cx, cy, scale=1.0):
    s = scale
    return [
        (cx - 360*s, cy + 320*s),
        (cx + 100*s, cy +  60*s),
        (cx -  40*s, cy +  20*s),
        (cx + 360*s, cy - 320*s),
        (cx -  60*s, cy -  60*s),
        (cx + 100*s, cy -  20*s),
    ]

# ---------- Option B: solid flats, no outline ----------
def make_bb_optB(size, lean=0.16):
    h = size; w = size * 0.55; stroke = size * 0.22
    pad = max(40, int(size * 0.18))
    img_w = int(w * 2.2 + pad*2)
    img_h = int(h * 1.55 + pad*2)
    c1 = (img_w*0.40, img_h*0.36)  # back B (upper-left)
    c2 = (img_w*0.62, img_h*0.64)  # front B (lower-right)

    def fill_b(center, color, target):
        ox, oy = center
        m = Image.new("L", (img_w, img_h), 0)
        md = ImageDraw.Draw(m)
        md.polygon(b_outer(ox, oy, h, w, lean), fill=255)
        md.polygon(b_inner(ox, oy, h, w, stroke, lean, True), fill=0)
        md.polygon(b_inner(ox, oy, h, w, stroke, lean, False), fill=0)
        layer = Image.new("RGBA", (img_w, img_h), color + (255,))
        layer.putalpha(m)
        return Image.alpha_composite(target, layer)

    layer = Image.new("RGBA", (img_w, img_h), (0,0,0,0))
    # back first (sky), then front (orange) — front naturally covers
    layer = fill_b(c1, SKY, layer)
    layer = fill_b(c2, ORANGE, layer)
    return layer

# ---------- Option C: single unified outline ----------
def make_bb_optC(size, lean=0.16):
    h = size; w = size * 0.55; stroke = size * 0.22
    pad = max(60, int(size * 0.22))
    img_w = int(w * 2.2 + pad*2)
    img_h = int(h * 1.55 + pad*2)
    c1 = (img_w*0.40, img_h*0.36)
    c2 = (img_w*0.62, img_h*0.64)

    # Build masks
    back_outer = Image.new("L", (img_w, img_h), 0)
    bod = ImageDraw.Draw(back_outer)
    bod.polygon(b_outer(*c1, h, w, lean), fill=255)
    front_outer = Image.new("L", (img_w, img_h), 0)
    fod = ImageDraw.Draw(front_outer)
    fod.polygon(b_outer(*c2, h, w, lean), fill=255)

    # Back B fill mask (with counters knocked out)
    back_full = back_outer.copy()
    bd = ImageDraw.Draw(back_full)
    bd.polygon(b_inner(*c1, h, w, stroke, lean, True), fill=0)
    bd.polygon(b_inner(*c1, h, w, stroke, lean, False), fill=0)

    # Front B fill mask (with counters)
    front_full = front_outer.copy()
    fd = ImageDraw.Draw(front_full)
    fd.polygon(b_inner(*c2, h, w, stroke, lean, True), fill=0)
    fd.polygon(b_inner(*c2, h, w, stroke, lean, False), fill=0)

    # Where front overlaps back, front wins. Back fill is back_full minus (back_full ∩ front_outer).
    front_overlay = front_outer  # solid front body
    back_visible = ImageChops.subtract(back_full, front_overlay)

    # Combined silhouette = union of back_outer and front_outer
    silhouette = ImageChops.lighter(back_outer, front_outer)

    # Inner counters that are still visible:
    # back counters: visible only where front isn't
    back_top_counter = Image.new("L", (img_w, img_h), 0)
    btd = ImageDraw.Draw(back_top_counter)
    btd.polygon(b_inner(*c1, h, w, stroke, lean, True), fill=255)
    back_bot_counter = Image.new("L", (img_w, img_h), 0)
    bbd = ImageDraw.Draw(back_bot_counter)
    bbd.polygon(b_inner(*c1, h, w, stroke, lean, False), fill=255)
    front_top_counter = Image.new("L", (img_w, img_h), 0)
    ftd = ImageDraw.Draw(front_top_counter)
    ftd.polygon(b_inner(*c2, h, w, stroke, lean, True), fill=255)
    front_bot_counter = Image.new("L", (img_w, img_h), 0)
    fbd = ImageDraw.Draw(front_bot_counter)
    fbd.polygon(b_inner(*c2, h, w, stroke, lean, False), fill=255)
    back_top_visible = ImageChops.subtract(back_top_counter, front_outer)
    back_bot_visible = ImageChops.subtract(back_bot_counter, front_outer)

    # Compose colours
    out = Image.new("RGBA", (img_w, img_h), (0,0,0,0))
    # back colour (sky)
    back_layer = Image.new("RGBA", (img_w, img_h), SKY + (255,))
    back_layer.putalpha(back_visible)
    out = Image.alpha_composite(out, back_layer)
    # front colour (orange)
    front_layer = Image.new("RGBA", (img_w, img_h), ORANGE + (255,))
    front_layer.putalpha(front_full)
    out = Image.alpha_composite(out, front_layer)

    # Build outline = boundary of silhouette + boundary of visible counters
    # Use erosion trick: outline = silhouette - eroded(silhouette)
    out_w_px = max(3, int(size * 0.04))
    eroded = silhouette.filter(ImageFilter.MinFilter(out_w_px*2 + 1))
    outer_outline_mask = ImageChops.subtract(silhouette, eroded)

    # counter outlines
    def counter_outline(mask):
        # outline outside the counter (so it sits on the body) — dilate then subtract
        dil = mask.filter(ImageFilter.MaxFilter(out_w_px*2 + 1))
        return ImageChops.subtract(dil, mask)

    co_layers = []
    for cm in [back_top_visible, back_bot_visible, front_top_counter, front_bot_counter]:
        co_layers.append(counter_outline(cm))
    counter_mask = co_layers[0]
    for cm in co_layers[1:]:
        counter_mask = ImageChops.lighter(counter_mask, cm)

    # outline mask = outer_outline_mask + counter_mask, but only where silhouette (or extended for outer)
    full_outline_mask = ImageChops.lighter(outer_outline_mask, counter_mask)
    # restrict counter outline to inside silhouette
    counter_in_sil = ImageChops.multiply(counter_mask, silhouette)
    full_outline_mask = ImageChops.lighter(outer_outline_mask, counter_in_sil)

    outline_layer = Image.new("RGBA", (img_w, img_h), INK + (255,))
    outline_layer.putalpha(full_outline_mask)
    out = Image.alpha_composite(out, outline_layer)

    return out

# ---------- Render shield with chosen BB ----------
def render_panel_bc(path, W=2400, H=1700):
    base = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(base)
    for i in range(0, W, 80):
        d.line([(i,0),(i,H)], fill=(14,16,24), width=1)
    for j in range(0, H, 80):
        d.line([(0,j),(W,j)], fill=(14,16,24), width=1)

    try:
        font_h = ImageFont.truetype(os.path.join(FONTS, "BigShoulders-Bold.ttf"), 64)
        font_lbl = ImageFont.truetype(os.path.join(FONTS, "BigShoulders-Bold.ttf"), 56)
        font_sub = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Regular.ttf"), 20)
        font_tag = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Bold.ttf"), 22)
    except:
        font_h = font_lbl = font_sub = font_tag = ImageFont.load_default()

    d.text((60, 50), "BB  —  OPTION  B  vs  OPTION  C", font=font_h, fill=WHITE)
    d.text((60, 130), "Same composition, different overlap treatment.", font=font_sub, fill=(120,130,160))

    # two cells
    cells = [
        ("B", "FLAT  COLOUR  ·  NO  OUTLINE", make_bb_optB),
        ("C", "UNIFIED  OUTLINE  ·  TWO-TONE", make_bb_optC),
    ]

    for idx, (key, label, bb_fn) in enumerate(cells):
        cx = W * (0.25 + idx * 0.5)
        cy = 900
        sw, sh = 900, 1020

        # shadow
        shadow = Image.new("RGBA", (W,H), (0,0,0,0))
        sd = ImageDraw.Draw(shadow)
        sd.polygon([(x, y+40) for (x,y) in shield_points(cx, cy, sw, sh)], fill=(0,0,0,200))
        shadow = shadow.filter(ImageFilter.GaussianBlur(40))
        base.paste(shadow, (0,0), shadow)

        shield_mask = Image.new("L", (W,H), 0)
        smd = ImageDraw.Draw(shield_mask)
        smd.polygon(shield_points(cx, cy, sw, sh), fill=255)
        grad = gradient_fill((W, H), PURPLE_D, PURPLE, 100)
        base.paste(grad, (0,0), shield_mask)

        # band
        band_y1 = int(cy - sh/2 + 50)
        band_y2 = band_y1 + 75
        band_mask = Image.new("L", (W,H), 0)
        bmd = ImageDraw.Draw(band_mask)
        bmd.rectangle([(0, band_y1), (W, band_y2)], fill=255)
        base.paste(Image.new("RGB", (W,H), ORANGE_D), (0,0),
                   ImageChops.multiply(band_mask, shield_mask))
        # sky stripe
        sm2 = Image.new("L", (W,H), 0)
        smd2 = ImageDraw.Draw(sm2)
        smd2.rectangle([(0, band_y2 + 3), (W, band_y2 + 9)], fill=255)
        base.paste(Image.new("RGB", (W,H), SKY), (0,0),
                   ImageChops.multiply(sm2, shield_mask))

        # bolt
        bolt_pts = lightning_bolt(cx, cy + 30, scale=1.18)
        bl = Image.new("RGBA", (W,H), (0,0,0,0))
        ImageDraw.Draw(bl).polygon(bolt_pts, fill=(*ORANGE, 255))
        bla = bl.split()[3]
        bl.putalpha(ImageChops.multiply(bla, shield_mask))
        base.paste(bl, (0,0), bl)
        bo = Image.new("RGBA", (W,H), (0,0,0,0))
        ImageDraw.Draw(bo).line(bolt_pts + [bolt_pts[0]], fill=INK, width=8)
        boa = bo.split()[3]
        bo.putalpha(ImageChops.multiply(boa, shield_mask))
        base.paste(bo, (0,0), bo)

        # outlines
        d2 = ImageDraw.Draw(base)
        pts_out = shield_points(cx, cy, sw + 28, sh + 28)
        d2.line(pts_out + [pts_out[0]], fill=INK, width=18)
        d2.line(shield_points(cx, cy, sw, sh) + [shield_points(cx, cy, sw, sh)[0]],
                fill=SKY, width=10)

        # BB
        bb = bb_fn(440)
        bx = int(cx - bb.size[0]/2)
        by = int(cy - bb.size[1]/2 - sh*0.02)
        base.paste(bb, (bx, by), bb)

        d2 = ImageDraw.Draw(base)
        # tag pill
        tag = f"OPTION  {key}"
        tw = d2.textlength(tag, font=font_tag)
        d2.rounded_rectangle([cx - tw/2 - 22, 220, cx + tw/2 + 22, 270], radius=10, fill=INK)
        d2.text((cx - tw/2, 230), tag, font=font_tag, fill=WHITE)

        lbl_y = cy + sh/2 + 60
        lw = d2.textlength(label, font=font_lbl)
        d2.text((cx - lw/2, lbl_y), label, font=font_lbl, fill=WHITE)

    base.save(path, "PNG")

if __name__ == "__main__":
    render_panel_bc(os.path.join(OUT, "FINAL-bb-option-B-vs-C.png"))
    print("done")
