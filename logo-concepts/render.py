"""BarmiBuddy logo concepts — Locker-Room Mythos. v2."""
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

def radial_glow(W, H, cx, cy, color, layers):
    """layers = [(radius, alpha), ...]"""
    layer = Image.new("RGBA", (W, H), (0,0,0,0))
    d = ImageDraw.Draw(layer)
    for r, a in layers:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*color, a))
    return layer.filter(ImageFilter.GaussianBlur(40))

def draw_grid(d, W, H, step=80, color=(14,16,24), width=1):
    for i in range(0, W, step):
        d.line([(i,0),(i,H)], fill=color, width=width)
    for j in range(0, H, step):
        d.line([(0,j),(W,j)], fill=color, width=width)

# ---------- BB monogram layer ----------
def make_bb_layer(size, lean=0.16):
    h = size
    w = size * 0.55
    stroke = size * 0.22
    gap = w * 0.50
    pad = 70
    img_w = int(w*2 + gap + pad*2)
    img_h = int(h + pad*2)
    layer = Image.new("RGBA", (img_w, img_h), (0,0,0,0))

    def shear(pts, anchor_y):
        return [(x + (anchor_y - y)*lean, y) for (x,y) in pts]

    def b_outer(ox, oy):
        top = oy - h/2
        bot = oy + h/2
        left = ox - w/2
        right = ox + w/2
        mid = oy
        steps = 36
        pts = [(left, top)]
        ry_t = (mid - top)/2
        cx_t = right - ry_t
        cy_t = top + ry_t
        pts.append((cx_t, top))
        for i in range(steps+1):
            a = -math.pi/2 + i*math.pi/steps
            pts.append((cx_t + math.cos(a)*ry_t, cy_t + math.sin(a)*ry_t))
        ry_b = (bot - mid)/2
        cx_b = right - ry_b
        cy_b = mid + ry_b
        pts.append((cx_b, mid))
        for i in range(steps+1):
            a = -math.pi/2 + i*math.pi/steps
            pts.append((cx_b + math.cos(a)*ry_b, cy_b + math.sin(a)*ry_b))
        pts.append((left, bot))
        return shear(pts, oy)

    def b_inner(ox, oy, top_half=True):
        top = oy - h/2
        bot = oy + h/2
        left = ox - w/2
        right = ox + w/2
        mid = oy
        steps = 28
        if top_half:
            y1, y2 = top + stroke, mid - stroke*0.30
        else:
            y1, y2 = mid + stroke*0.30, bot - stroke
        ry = (y2 - y1)/2
        cx_c = right - stroke - ry
        cy_c = (y1 + y2)/2
        pts = [(left + stroke, y1)]
        pts.append((cx_c, y1))
        for i in range(steps+1):
            a = -math.pi/2 + i*math.pi/steps
            pts.append((cx_c + math.cos(a)*ry, cy_c + math.sin(a)*ry))
        pts.append((left + stroke, y2))
        return shear(pts, oy)

    centers = [(pad + w/2, pad + h/2),
               (pad + w*1.5 + gap, pad + h/2)]

    fill_mask = Image.new("L", (img_w, img_h), 0)
    fd = ImageDraw.Draw(fill_mask)
    for ox, oy in centers:
        fd.polygon(b_outer(ox, oy), fill=255)
    for ox, oy in centers:
        fd.polygon(b_inner(ox, oy, True), fill=0)
        fd.polygon(b_inner(ox, oy, False), fill=0)

    grad = gradient_fill((img_w, img_h), ORANGE, PURPLE_L, 120).convert("RGBA")
    grad.putalpha(fill_mask)

    od = ImageDraw.Draw(grad)
    for ox, oy in centers:
        outer = b_outer(ox, oy)
        od.line(outer + [outer[0]], fill=INK, width=10)
        it = b_inner(ox, oy, True)
        ib = b_inner(ox, oy, False)
        od.line(it + [it[0]], fill=INK, width=6)
        od.line(ib + [ib[0]], fill=INK, width=6)

    return grad

# ---------- helpers for safe band/bolt ----------
def paste_clipped(base, src_rgba, clip_mask):
    """Paste an RGBA src onto base only inside clip_mask."""
    src_alpha = src_rgba.split()[3]
    final_mask = ImageChops.multiply(src_alpha, clip_mask)
    base.paste(src_rgba, (0, 0), final_mask)

def lightning_bolt(cx, cy, scale=1.0):
    """Closed lightning-bolt polygon (zigzag)."""
    s = scale
    pts = [
        (cx - 130*s, cy - 380*s),   # top-left
        (cx + 110*s, cy - 380*s),   # top-right
        (cx -  20*s, cy -  60*s),   # right inner notch
        (cx + 130*s, cy -  60*s),
        (cx - 110*s, cy + 380*s),   # bottom point
        (cx +  20*s, cy +  60*s),   # left inner notch
        (cx - 130*s, cy +  60*s),
        (cx + 130*s, cy - 380*s),   # close back (this isn't quite right)
    ]
    # cleaner version
    pts = [
        (cx - 110*s, cy - 380*s),
        (cx + 130*s, cy - 380*s),
        (cx +  10*s, cy -  60*s),
        (cx + 150*s, cy -  60*s),
        (cx -  90*s, cy + 380*s),
        (cx +  30*s, cy +  80*s),
        (cx - 130*s, cy +  80*s),
    ]
    return pts

# ---------- CONCEPT 2: BB Shield Crest ----------
def render_shield(path, W=1600, H=1600):
    base = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(base)
    draw_grid(d, W, H)

    cx, cy = W/2, H/2 - 30
    sw, sh = 1080, 1220

    # outer drop shadow
    shadow = Image.new("RGBA", (W,H), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.polygon([(x, y+50) for (x,y) in shield_points(cx, cy, sw, sh)], fill=(0,0,0,200))
    shadow = shadow.filter(ImageFilter.GaussianBlur(50))
    base.paste(shadow, (0,0), shadow)

    # shield mask
    shield_mask = Image.new("L", (W,H), 0)
    smd = ImageDraw.Draw(shield_mask)
    smd.polygon(shield_points(cx, cy, sw, sh), fill=255)

    # gradient fill
    grad = gradient_fill((W, H), PURPLE_D, PURPLE, 100)
    base.paste(grad, (0,0), shield_mask)

    # subtle inner glow at top
    inner_glow = radial_glow(W, H, int(cx), int(cy - sh*0.2), PURPLE_L, [(420, 60), (300, 90), (200, 120)])
    paste_clipped(base, inner_glow, shield_mask)

    # top jersey band — drawn directly with intersection mask
    band_y1 = int(cy - sh/2 + 60)
    band_y2 = band_y1 + 95
    band_mask = Image.new("L", (W,H), 0)
    bmd = ImageDraw.Draw(band_mask)
    bmd.rectangle([(0, band_y1), (W, band_y2)], fill=255)
    band_inter = ImageChops.multiply(band_mask, shield_mask)
    base.paste(Image.new("RGB", (W,H), ORANGE_D), (0,0), band_inter)

    d = ImageDraw.Draw(base)
    # band stripe accents
    d.line([(0, band_y2 + 6),(W, band_y2 + 6)], fill=SKY, width=4)
    # constrain stripe to shield via mask trick: redraw clipped
    stripe_mask = Image.new("L", (W,H), 0)
    smd2 = ImageDraw.Draw(stripe_mask)
    smd2.rectangle([(0, band_y2 + 4), (W, band_y2 + 10)], fill=255)
    stripe_inter = ImageChops.multiply(stripe_mask, shield_mask)
    base.paste(Image.new("RGB", (W,H), SKY), (0,0), stripe_inter)

    # lightning bolt behind BB
    bolt_pts = lightning_bolt(cx, cy + 30, scale=1.4)
    bolt_layer = Image.new("RGBA", (W,H), (0,0,0,0))
    bld = ImageDraw.Draw(bolt_layer)
    bld.polygon(bolt_pts, fill=(*ORANGE, 255))
    # glow
    glow = bolt_layer.filter(ImageFilter.GaussianBlur(28))
    paste_clipped(base, glow, shield_mask)
    # crisp bolt clipped to shield
    paste_clipped(base, bolt_layer, shield_mask)

    d = ImageDraw.Draw(base)
    # bolt outline — clip via redraw on a layer then paste_clipped
    bolt_outline = Image.new("RGBA", (W,H), (0,0,0,0))
    bod = ImageDraw.Draw(bolt_outline)
    bod.line(bolt_pts + [bolt_pts[0]], fill=INK, width=10)
    paste_clipped(base, bolt_outline, shield_mask)

    # outer dark border
    pts_out = shield_points(cx, cy, sw + 32, sh + 32)
    d = ImageDraw.Draw(base)
    d.line(pts_out + [pts_out[0]], fill=INK, width=20)
    # inner sky piping
    pts = shield_points(cx, cy, sw, sh)
    d.line(pts + [pts[0]], fill=SKY, width=10)
    pts_in = shield_points(cx, cy, sw - 70, sh - 70)
    d.line(pts_in + [pts_in[0]], fill=(255,255,255), width=2)

    # BB monogram
    bb = make_bb_layer(540)
    bx = int(cx - bb.size[0]/2)
    by = int(cy - bb.size[1]/2 + 60)
    base.paste(bb, (bx, by), bb)

    # Wordmark + motto
    try:
        font_word  = ImageFont.truetype(os.path.join(FONTS, "BigShoulders-Bold.ttf"), 92)
        font_motto = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Bold.ttf"), 22)
        font_label = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Regular.ttf"), 18)
    except Exception as e:
        print("font err", e)
        font_word = font_motto = font_label = ImageFont.load_default()

    d = ImageDraw.Draw(base)
    word = "BARMIBUDDY"
    tw = d.textlength(word, font=font_word)
    word_y = cy + sh/2 + 80
    d.text((cx - tw/2, word_y), word, font=font_word, fill=WHITE)

    motto = "PRACTICE   ·   BATTLE   ·   CRUSH  IT"
    mw = d.textlength(motto, font=font_motto)
    d.text((cx - mw/2, word_y + 110), motto, font=font_motto, fill=PURPLE_L)

    # corner reference markers
    d.text((60, 60), "CONCEPT  02", font=font_label, fill=(120, 130, 160))
    d.text((60, 88), "BB  SHIELD  CREST", font=font_label, fill=(120, 130, 160))
    rl = "APP · FAVICON · BADGE"
    d.text((W - 60 - d.textlength(rl, font=font_label), 60), rl, font=font_label, fill=(120,130,160))
    rl2 = "LOCKER-ROOM  MYTHOS"
    d.text((W - 60 - d.textlength(rl2, font=font_label), 88), rl2, font=font_label, fill=(120,130,160))

    base.save(path, "PNG")

# ---------- CONCEPT 1: Heroic Silhouette + Chest Reveal ----------
def render_hero(path, W=1600, H=2000):
    base = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(base)
    draw_grid(d, W, H)

    cx = W/2
    figure_cy = H/2 + 80

    # Massive radial spotlight behind figure (purple)
    spot = radial_glow(W, H, int(cx), int(figure_cy - 200), PURPLE,
                       [(900, 30), (700, 55), (520, 90), (380, 130), (240, 170)])
    base.paste(spot, (0,0), spot)

    # speed lines
    for i in range(0, 360, 4):
        a = math.radians(i)
        x1 = cx + math.cos(a)*460
        y1 = (figure_cy - 200) + math.sin(a)*460
        x2 = cx + math.cos(a)*960
        y2 = (figure_cy - 200) + math.sin(a)*960
        d.line([(x1,y1),(x2,y2)], fill=(34, 28, 60), width=2)

    # ------- Silhouette of kid: head + hood + shoulders -------
    # Hood/head silhouette built as one polygon for clean read.
    head_cx = cx
    head_cy = figure_cy - 540
    silhouette = [
        # left shoulder out
        (head_cx - 600, figure_cy + 280),
        (head_cx - 580, figure_cy - 60),
        # hood left
        (head_cx - 360, head_cy + 60),
        (head_cx - 340, head_cy - 140),
        (head_cx - 240, head_cy - 280),
        (head_cx - 80,  head_cy - 340),
        (head_cx + 80,  head_cy - 340),
        (head_cx + 240, head_cy - 280),
        (head_cx + 340, head_cy - 140),
        (head_cx + 360, head_cy + 60),
        # right shoulder
        (head_cx + 580, figure_cy - 60),
        (head_cx + 600, figure_cy + 280),
    ]
    # silhouette fill (deep ink, almost black)
    sil_layer = Image.new("RGBA", (W, H), (0,0,0,0))
    sld = ImageDraw.Draw(sil_layer)
    sld.polygon(silhouette, fill=(14, 16, 26, 255))
    base.paste(sil_layer, (0,0), sil_layer)

    # Subtle rim light on silhouette edge (purple)
    d = ImageDraw.Draw(base)
    rim = silhouette + [silhouette[0]]
    d.line(rim, fill=PURPLE, width=4)

    # Sky-blue inner rim (jacket trim)
    inner_sil = [
        (head_cx - 560, figure_cy + 280),
        (head_cx - 540, figure_cy - 50),
        (head_cx - 330, head_cy + 70),
        (head_cx - 310, head_cy - 130),
        (head_cx - 220, head_cy - 260),
        (head_cx - 70,  head_cy - 320),
        (head_cx + 70,  head_cy - 320),
        (head_cx + 220, head_cy - 260),
        (head_cx + 310, head_cy - 130),
        (head_cx + 330, head_cy + 70),
        (head_cx + 540, figure_cy - 50),
        (head_cx + 560, figure_cy + 280),
    ]
    d.line(inner_sil, fill=SKY, width=2)

    # ------- Hood face cavity (deep shadow) with smirk + eye glints -------
    face_w, face_h = 240, 280
    face_pts = [
        (head_cx - face_w/2, head_cy - 140),
        (head_cx - face_w/2 + 40, head_cy - 200),
        (head_cx + face_w/2 - 40, head_cy - 200),
        (head_cx + face_w/2, head_cy - 140),
        (head_cx + face_w/2 - 30, head_cy + face_h/2 - 80),
        (head_cx - face_w/2 + 30, head_cy + face_h/2 - 80),
    ]
    d.polygon(face_pts, fill=(4, 5, 10))

    # Glowing eyes (orange) — only thing visible in hood shadow
    eye_y = head_cy - 60
    for ex in (head_cx - 50, head_cx + 50):
        # outer glow
        eg = Image.new("RGBA", (W,H), (0,0,0,0))
        egd = ImageDraw.Draw(eg)
        for r, a in [(40, 80), (24, 140), (14, 220)]:
            egd.ellipse([ex - r, eye_y - r, ex + r, eye_y + r], fill=(*ORANGE, a))
        eg = eg.filter(ImageFilter.GaussianBlur(6))
        base.paste(eg, (0,0), eg)
        d = ImageDraw.Draw(base)
        d.ellipse([ex - 8, eye_y - 8, ex + 8, eye_y + 8], fill=WHITE)

    # smirk (small confident curve, only one side raised)
    d.arc([head_cx - 60, head_cy + 40, head_cx + 70, head_cy + 110],
          start=10, end=160, fill=(255, 255, 255, 140), width=5)

    # ------- Headphones around neck -------
    neck_y = head_cy + 140
    d.ellipse([head_cx - 200, neck_y - 30, head_cx - 110, neck_y + 60], outline=SKY, width=10)
    d.ellipse([head_cx + 110, neck_y - 30, head_cx + 200, neck_y + 60], outline=SKY, width=10)
    d.ellipse([head_cx - 200, neck_y - 30, head_cx - 110, neck_y + 60], fill=INK, outline=SKY, width=10)
    d.ellipse([head_cx + 110, neck_y - 30, head_cx + 200, neck_y + 60], fill=INK, outline=SKY, width=10)
    # band
    d.arc([head_cx - 170, head_cy + 30, head_cx + 170, neck_y + 40],
          start=0, end=180, fill=SKY, width=6)

    # ------- Torn hoodie front opening + glowing crest behind -------
    body_top = neck_y + 70
    body_bot = figure_cy + 260

    # Glow zone behind torn opening (where the BB will sit)
    crest_cx = cx
    crest_cy = (body_top + body_bot)/2
    big_glow = Image.new("RGBA", (W,H), (0,0,0,0))
    bgd = ImageDraw.Draw(big_glow)
    for r, a in [(420, 80), (320, 120), (240, 160), (160, 200)]:
        bgd.ellipse([crest_cx - r, crest_cy - r, crest_cx + r*0.9, crest_cy + r], fill=(*ORANGE, a))
    big_glow = big_glow.filter(ImageFilter.GaussianBlur(40))
    base.paste(big_glow, (0,0), big_glow)

    # Light beams shooting out of opening (between flaps)
    beams = Image.new("RGBA", (W,H), (0,0,0,0))
    bmd = ImageDraw.Draw(beams)
    for angle in range(-50, 51, 8):
        a = math.radians(angle - 90)
        x2 = crest_cx + math.cos(a)*1100
        y2 = crest_cy + math.sin(a)*1100
        bmd.polygon([
            (crest_cx - 4, crest_cy),
            (crest_cx + 4, crest_cy),
            (x2 + math.cos(a + math.pi/2)*30, y2 + math.sin(a + math.pi/2)*30),
            (x2 - math.cos(a + math.pi/2)*30, y2 - math.sin(a + math.pi/2)*30),
        ], fill=(*ORANGE, 28))
    beams = beams.filter(ImageFilter.GaussianBlur(8))
    base.paste(beams, (0,0), beams)

    d = ImageDraw.Draw(base)

    # Torn opening: a jagged "V" zigzag down the centre of the chest
    rip_left = [
        (head_cx - 30, body_top),
        (head_cx - 70, body_top + 60),
        (head_cx - 40, body_top + 130),
        (head_cx - 90, body_top + 200),
        (head_cx - 50, body_top + 280),
        (head_cx - 110, body_top + 360),
        (head_cx - 60, body_top + 440),
        (head_cx - 130, body_bot),
    ]
    rip_right = [
        (head_cx + 30, body_top),
        (head_cx + 70, body_top + 60),
        (head_cx + 40, body_top + 130),
        (head_cx + 90, body_top + 200),
        (head_cx + 50, body_top + 280),
        (head_cx + 110, body_top + 360),
        (head_cx + 60, body_top + 440),
        (head_cx + 130, body_bot),
    ]
    # Cut out the opening from the silhouette by overpainting with dark
    opening = Image.new("RGBA", (W,H), (0,0,0,0))
    od = ImageDraw.Draw(opening)
    od.polygon(rip_left + list(reversed(rip_right)), fill=(2, 4, 10, 255))
    base.paste(opening, (0,0), opening)

    d = ImageDraw.Draw(base)
    # rip edge highlights
    d.line(rip_left, fill=ORANGE, width=4)
    d.line(rip_right, fill=ORANGE, width=4)
    # second rim (sky)
    d.line(rip_left, fill=SKY, width=1)
    d.line(rip_right, fill=SKY, width=1)

    # ------- Mini shield crest in the opening -------
    shield_cx, shield_cy = head_cx, (body_top + body_bot)/2 - 20
    sw_s, sh_s = 280, 320

    # shield gradient
    smask = Image.new("L", (W,H), 0)
    smd = ImageDraw.Draw(smask)
    smd.polygon(shield_points(shield_cx, shield_cy, sw_s, sh_s), fill=255)
    sgrad = gradient_fill((W, H), PURPLE_D, PURPLE, 100)
    base.paste(sgrad, (0,0), smask)
    d = ImageDraw.Draw(base)
    # piping
    d.line(shield_points(shield_cx, shield_cy, sw_s + 14, sh_s + 14) +
           [shield_points(shield_cx, shield_cy, sw_s + 14, sh_s + 14)[0]],
           fill=INK, width=8)
    d.line(shield_points(shield_cx, shield_cy, sw_s, sh_s) +
           [shield_points(shield_cx, shield_cy, sw_s, sh_s)[0]],
           fill=SKY, width=4)

    # mini bolt behind BB
    bolt_pts = lightning_bolt(shield_cx, shield_cy, scale=0.5)
    bolt_layer = Image.new("RGBA", (W,H), (0,0,0,0))
    bld = ImageDraw.Draw(bolt_layer)
    bld.polygon(bolt_pts, fill=(*ORANGE, 255))
    paste_clipped(base, bolt_layer, smask)

    # BB monogram inside shield
    bb_small = make_bb_layer(180)
    bx = int(shield_cx - bb_small.size[0]/2)
    by = int(shield_cy - bb_small.size[1]/2 + 8)
    base.paste(bb_small, (bx, by), bb_small)

    # ------- Typography -------
    try:
        font_word = ImageFont.truetype(os.path.join(FONTS, "BigShoulders-Bold.ttf"), 130)
        font_motto = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Bold.ttf"), 26)
        font_label = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Regular.ttf"), 18)
    except:
        font_word = font_motto = font_label = ImageFont.load_default()

    d = ImageDraw.Draw(base)
    word = "BARMIBUDDY"
    tw = d.textlength(word, font=font_word)
    d.text((cx - tw/2, H - 280), word, font=font_word, fill=WHITE)

    motto = "PRACTICE   ·   BATTLE   ·   CRUSH  IT"
    mw = d.textlength(motto, font=font_motto)
    d.text((cx - mw/2, H - 130), motto, font=font_motto, fill=PURPLE_L)

    d.text((60, 60), "CONCEPT  01", font=font_label, fill=(120, 130, 160))
    d.text((60, 88), "BB  CHEST-REVEAL  HERO", font=font_label, fill=(120, 130, 160))
    rl = "PRIMARY · MARKETING · HERO"
    d.text((W - 60 - d.textlength(rl, font=font_label), 60), rl, font=font_label, fill=(120,130,160))
    rl2 = "LOCKER-ROOM  MYTHOS"
    d.text((W - 60 - d.textlength(rl2, font=font_label), 88), rl2, font=font_label, fill=(120,130,160))

    base.save(path, "PNG")

if __name__ == "__main__":
    render_hero(os.path.join(OUT, "concept-01-chest-reveal.png"))
    print("hero done")
    render_shield(os.path.join(OUT, "concept-02-shield-crest.png"))
    print("shield done")
