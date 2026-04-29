"""BarmiBuddy — final mark (simple diagonal BB, no bolt, no band)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import math, os

FONTS = "/Users/jonathankrywicki/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/737b41ef-898f-4501-a97d-73cd81a1496c/bac370a3-d81b-4df4-bd3c-44de844593a9/skills/canvas-design/canvas-fonts"
OUT = "/Users/jonathankrywicki/Claude/barmibuddy/logo-concepts"

BG       = (8, 9, 13)
PURPLE   = (124, 58, 237)
PURPLE_L = (167, 139, 250)
PURPLE_D = (76, 29, 149)
ORANGE   = (251, 146, 60)
AMBER    = (251, 191, 36)
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
    steps = 40
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

def make_bb_simple(size, lean=0.16):
    """Two equal B's, diagonal ↘ stagger, single shared orange→purple gradient."""
    h = size
    w = size * 0.55
    stroke = size * 0.22

    pad = max(40, int(size * 0.18))
    img_w = int(w * 2.2 + pad*2)
    img_h = int(h * 1.55 + pad*2)

    # diagonal ↘: left B upper, right B lower
    c1 = (img_w*0.40, img_h*0.36)
    c2 = (img_w*0.62, img_h*0.64)
    centers = [c1, c2]

    fill_mask = Image.new("L", (img_w, img_h), 0)
    fd = ImageDraw.Draw(fill_mask)
    for ox, oy in centers:
        fd.polygon(b_outer(ox, oy, h, w, lean), fill=255)
    for ox, oy in centers:
        fd.polygon(b_inner(ox, oy, h, w, stroke, lean, True), fill=0)
        fd.polygon(b_inner(ox, oy, h, w, stroke, lean, False), fill=0)

    grad = Image.new("RGBA", (img_w, img_h), ORANGE + (255,))
    grad.putalpha(fill_mask)

    od = ImageDraw.Draw(grad)
    out_w = max(4, int(size * 0.035))
    in_w  = max(3, int(size * 0.022))
    for ox, oy in centers:
        outer = b_outer(ox, oy, h, w, lean)
        ti = b_inner(ox, oy, h, w, stroke, lean, True)
        bi = b_inner(ox, oy, h, w, stroke, lean, False)
        od.line(outer + [outer[0]], fill=INK, width=out_w)
        od.line(ti + [ti[0]], fill=INK, width=in_w)
        od.line(bi + [bi[0]], fill=INK, width=in_w)

    return grad

def lightning_bolt(cx, cy, scale=1.0):
    """↗ bolt opposing the ↘ BB stagger."""
    s = scale
    pts = [
        (cx - 360*s, cy + 320*s),
        (cx + 100*s, cy +  60*s),
        (cx -  40*s, cy +  20*s),
        (cx + 360*s, cy - 320*s),
        (cx -  60*s, cy -  60*s),
        (cx + 100*s, cy -  20*s),
    ]
    return pts

ORANGE_D = (234, 88, 12)

def render_shield_simple(path, W=1800, H=1800, with_chrome=True):
    base = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(base)
    if with_chrome:
        for i in range(0, W, 80):
            d.line([(i,0),(i,H)], fill=(14,16,24), width=1)
        for j in range(0, H, 80):
            d.line([(0,j),(W,j)], fill=(14,16,24), width=1)

    cx, cy = W/2, H/2 - (60 if with_chrome else 0)
    sw, sh = 1180, 1320

    # shadow
    shadow = Image.new("RGBA", (W,H), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.polygon([(x, y+50) for (x,y) in shield_points(cx, cy, sw, sh)], fill=(0,0,0,200))
    shadow = shadow.filter(ImageFilter.GaussianBlur(50))
    base.paste(shadow, (0,0), shadow)

    shield_mask = Image.new("L", (W,H), 0)
    smd = ImageDraw.Draw(shield_mask)
    smd.polygon(shield_points(cx, cy, sw, sh), fill=255)

    # solid purple gradient fill
    grad = gradient_fill((W, H), PURPLE_D, PURPLE, 100)
    base.paste(grad, (0,0), shield_mask)

    # top jersey band (orange)
    band_y1 = int(cy - sh/2 + 70)
    band_y2 = band_y1 + 100
    band_mask = Image.new("L", (W,H), 0)
    bmd = ImageDraw.Draw(band_mask)
    bmd.rectangle([(0, band_y1), (W, band_y2)], fill=255)
    band_inter = ImageChops.multiply(band_mask, shield_mask)
    base.paste(Image.new("RGB", (W,H), ORANGE_D), (0,0), band_inter)

    # sky stripe under the band, clipped to shield
    stripe_mask = Image.new("L", (W,H), 0)
    smd2 = ImageDraw.Draw(stripe_mask)
    smd2.rectangle([(0, band_y2 + 4), (W, band_y2 + 10)], fill=255)
    stripe_inter = ImageChops.multiply(stripe_mask, shield_mask)
    base.paste(Image.new("RGB", (W,H), SKY), (0,0), stripe_inter)

    # outer dark + sky piping
    d = ImageDraw.Draw(base)
    pts_out = shield_points(cx, cy, sw + 36, sh + 36)
    d.line(pts_out + [pts_out[0]], fill=INK, width=22)
    pts = shield_points(cx, cy, sw, sh)
    d.line(pts + [pts[0]], fill=SKY, width=14)

    # Bolt FIRST — BIG, amber, dark outline, BEHIND BB
    bolt_pts = lightning_bolt(cx, cy + 40, scale=1.30)
    # outer glow
    bolt_glow = Image.new("RGBA", (W,H), (0,0,0,0))
    ImageDraw.Draw(bolt_glow).polygon(bolt_pts, fill=(*AMBER, 255))
    bolt_glow = bolt_glow.filter(ImageFilter.GaussianBlur(50))
    bga = bolt_glow.split()[3]
    bolt_glow.putalpha(ImageChops.multiply(bga, shield_mask))
    base.paste(bolt_glow, (0,0), bolt_glow)
    # bolt fill + thick outline
    bolt_layer = Image.new("RGBA", (W,H), (0,0,0,0))
    bld = ImageDraw.Draw(bolt_layer)
    bld.line(bolt_pts + [bolt_pts[0]], fill=(*INK, 255), width=50)
    bld.polygon(bolt_pts, fill=(*AMBER, 255))
    bla = bolt_layer.split()[3]
    bolt_layer.putalpha(ImageChops.multiply(bla, shield_mask))
    base.paste(bolt_layer, (0,0), bolt_layer)

    # BB ON TOP of bolt
    bb = make_bb_simple(560)
    bx = int(cx - bb.size[0]/2)
    by = int(cy - bb.size[1]/2 - sh*0.02)
    base.paste(bb, (bx, by), bb)

    if with_chrome:
        try:
            font_word = ImageFont.truetype(os.path.join(FONTS, "BigShoulders-Bold.ttf"), 110)
            font_motto = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Bold.ttf"), 26)
            font_label = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Regular.ttf"), 18)
        except:
            font_word = font_motto = font_label = ImageFont.load_default()

        word = "BARMIBUDDY"
        tw = d.textlength(word, font=font_word)
        word_y = cy + sh/2 + 80
        d.text((cx - tw/2, word_y), word, font=font_word, fill=WHITE)

        motto = "PRACTICE   ·   BATTLE   ·   CRUSH  IT"
        mw = d.textlength(motto, font=font_motto)
        d.text((cx - mw/2, word_y + 130), motto, font=font_motto, fill=PURPLE_L)

        d.text((60, 60), "FINAL  ·  BB  CREST", font=font_label, fill=(120, 130, 160))
        d.text((60, 88), "TWO  B's  =  BARMI  +  BUDDY", font=font_label, fill=(120, 130, 160))
        rl = "DIAGONAL ↘  ·  CLEAN"
        d.text((W - 60 - d.textlength(rl, font=font_label), 60), rl, font=font_label, fill=(120,130,160))

    base.save(path, "PNG")

def render_badge_simple(path, size=1024):
    W = H = size
    base = Image.new("RGBA", (W, H), (0,0,0,0))
    cx, cy = W/2, H/2

    sw_, sh_ = int(W*0.78), int(H*0.86)

    shadow = Image.new("RGBA", (W,H), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.polygon([(x, y + size*0.025) for (x,y) in shield_points(cx, cy, sw_, sh_)], fill=(0,0,0,180))
    shadow = shadow.filter(ImageFilter.GaussianBlur(max(1, int(size*0.025))))
    base = Image.alpha_composite(base, shadow)

    shield_mask = Image.new("L", (W,H), 0)
    smd = ImageDraw.Draw(shield_mask)
    smd.polygon(shield_points(cx, cy, sw_, sh_), fill=255)

    grad = gradient_fill((W, H), PURPLE_D, PURPLE, 100).convert("RGBA")
    grad.putalpha(shield_mask)
    base = Image.alpha_composite(base, grad)

    # band
    band_y1 = int(cy - sh_/2 + size*0.045)
    band_y2 = band_y1 + max(4, int(size*0.062))
    band_mask = Image.new("L", (W,H), 0)
    bmd = ImageDraw.Draw(band_mask)
    bmd.rectangle([(0, band_y1), (W, band_y2)], fill=255)
    band_inter = ImageChops.multiply(band_mask, shield_mask)
    band_layer = Image.new("RGBA", (W,H), ORANGE_D + (255,))
    band_layer.putalpha(band_inter)
    base = Image.alpha_composite(base, band_layer)
    # sky stripe
    sw_h = max(2, int(size*0.005))
    stripe_mask = Image.new("L", (W,H), 0)
    smd2 = ImageDraw.Draw(stripe_mask)
    smd2.rectangle([(0, band_y2 + 2), (W, band_y2 + 2 + sw_h)], fill=255)
    stripe_inter = ImageChops.multiply(stripe_mask, shield_mask)
    stripe_layer = Image.new("RGBA", (W,H), SKY + (255,))
    stripe_layer.putalpha(stripe_inter)
    base = Image.alpha_composite(base, stripe_layer)

    out_layer = Image.new("RGBA", (W,H), (0,0,0,0))
    od = ImageDraw.Draw(out_layer)
    pts_out = shield_points(cx, cy, sw_ + int(size*0.022), sh_ + int(size*0.022))
    od.line(pts_out + [pts_out[0]], fill=INK + (255,), width=max(3, int(size*0.014)))
    pts = shield_points(cx, cy, sw_, sh_)
    od.line(pts + [pts[0]], fill=SKY + (255,), width=max(2, int(size*0.009)))
    base = Image.alpha_composite(base, out_layer)

    # bolt BEHIND BB — big amber with dark outline
    bolt_pts = lightning_bolt(cx, cy + size*0.025, scale=size/1800*1.30)
    bolt_layer = Image.new("RGBA", (W,H), (0,0,0,0))
    bld = ImageDraw.Draw(bolt_layer)
    bld.line(bolt_pts + [bolt_pts[0]], fill=INK + (255,), width=max(6, int(size*0.028)))
    bld.polygon(bolt_pts, fill=AMBER + (255,))
    bla = bolt_layer.split()[3]
    bolt_layer.putalpha(ImageChops.multiply(bla, shield_mask))
    base = Image.alpha_composite(base, bolt_layer)

    bb = make_bb_simple(int(size * 0.38))
    bx = int(cx - bb.size[0]/2)
    by = int(cy - bb.size[1]/2 - sh_*0.015)
    bb_canvas = Image.new("RGBA", (W,H), (0,0,0,0))
    bb_canvas.paste(bb, (bx, by), bb)
    base = Image.alpha_composite(base, bb_canvas)

    base.save(path, "PNG")

if __name__ == "__main__":
    render_shield_simple(os.path.join(OUT, "FINAL-bb-simple-presentation.png"))
    print("presentation done")
    for sz, name in [(16, "icon-16.png"), (32, "icon-32.png"), (64, "icon-64.png"),
                     (192, "icon-192.png"), (512, "icon-512.png"), (1024, "icon-1024.png")]:
        render_badge_simple(os.path.join(OUT, name), size=sz)
        print(f"{name} done")
