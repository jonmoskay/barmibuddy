"""BarmiBuddy — final BB mark (VAR 01 diagonal, refined).
Two B's = Barmi + Buddy. Front B (Barmi) overlaps Back B (Buddy).
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import math, os

FONTS = "/Users/jonathankrywicki/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/737b41ef-898f-4501-a97d-73cd81a1496c/bac370a3-d81b-4df4-bd3c-44de844593a9/skills/canvas-design/canvas-fonts"
OUT = "/Users/jonathankrywicki/Claude/barmibuddy/logo-concepts"

BG       = (8, 9, 13)
PURPLE   = (124, 58, 237)
PURPLE_L = (167, 139, 250)
PURPLE_D = (76, 29, 149)
PURPLE_XD = (50, 18, 100)
ORANGE   = (251, 146, 60)
ORANGE_D = (234, 88, 12)
SKY      = (14, 165, 233)
SKY_L    = (125, 211, 252)
WHITE    = (255, 255, 255)
INK      = (10, 12, 20)

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

def make_bb_final(size, simple=False):
    """
    Refined BB mark.
    - Diagonal ↘ stagger, tightened overlap (front B kisses back B's lower bowl)
    - Front B = Barmi (orange→purple gradient, lit)
    - Back B = Buddy (cooler purple gradient, recessed, ~12% smaller stroke)
    - Knockout halo around front B where it crosses back B
    - Variable outline (heavier bottom-right)
    - Sky-blue highlight on front B's top-left edges
    simple=True: drop tiny details for small sizes (16/32px).
    """
    h_front = size
    w_front = size * 0.55
    s_front = size * 0.22
    h_back = size * 0.95
    w_back = size * 0.55 * 0.95
    s_back = size * 0.22 * 0.86  # back B = thinner strokes
    lean = 0.14  # forward italic, matches diagonal axis

    # canvas
    pad = max(40, int(size * 0.18))
    img_w = int(w_front + w_back + size * 0.55 + pad*2)
    img_h = int(h_front + size * 0.50 + pad*2)

    # centers — diagonal ↘: back B upper-left, front B lower-right
    back_c  = (pad + w_back/2 + size*0.10, pad + h_back/2 - size*0.05)
    front_c = (pad + w_back/2 + size*0.50, pad + h_back/2 + size*0.40)

    # --- BACK B (Buddy) ---
    back_mask = Image.new("L", (img_w, img_h), 0)
    bm = ImageDraw.Draw(back_mask)
    bm.polygon(b_outer(*back_c, h_back, w_back, lean), fill=255)
    bm.polygon(b_inner(*back_c, h_back, w_back, s_back, lean, True), fill=0)
    bm.polygon(b_inner(*back_c, h_back, w_back, s_back, lean, False), fill=0)

    # back gradient: cool deep-purple → purple-light (recessive)
    back_grad = gradient_fill((img_w, img_h), PURPLE_XD, PURPLE_L, 110).convert("RGBA")
    back_grad.putalpha(back_mask)

    # --- FRONT B (Barmi) ---
    front_mask = Image.new("L", (img_w, img_h), 0)
    fm = ImageDraw.Draw(front_mask)
    fm.polygon(b_outer(*front_c, h_front, w_front, lean), fill=255)
    fm.polygon(b_inner(*front_c, h_front, w_front, s_front, lean, True), fill=0)
    fm.polygon(b_inner(*front_c, h_front, w_front, s_front, lean, False), fill=0)

    # knockout halo: dilate front B and subtract from back B
    halo_w = max(6, int(size * 0.025))
    front_halo = front_mask.filter(ImageFilter.MaxFilter(halo_w*2 + 1))
    # subtract halo from back mask so back B has a clean cut where front overlaps
    inv_halo = ImageChops.invert(front_halo)
    back_grad_alpha = back_grad.split()[3]
    new_back_alpha = ImageChops.multiply(back_grad_alpha, inv_halo)
    back_grad.putalpha(new_back_alpha)

    # back outline (variable thickness simulated by drawing bottom/right offset)
    back_outline = Image.new("RGBA", (img_w, img_h), (0,0,0,0))
    bod = ImageDraw.Draw(back_outline)
    outer = b_outer(*back_c, h_back, w_back, lean)
    bod.line(outer + [outer[0]], fill=INK, width=max(4, int(size * 0.025)))
    # subtract halo from outline too
    bo_alpha = back_outline.split()[3]
    back_outline.putalpha(ImageChops.multiply(bo_alpha, inv_halo))

    # front gradient: warm orange → purple (lit, dominant)
    front_grad = gradient_fill((img_w, img_h), ORANGE, PURPLE, 130).convert("RGBA")
    front_grad.putalpha(front_mask)

    # front outline — variable: heavier on bottom + right
    front_outline = Image.new("RGBA", (img_w, img_h), (0,0,0,0))
    fod = ImageDraw.Draw(front_outline)
    outer_f = b_outer(*front_c, h_front, w_front, lean)
    # base outline
    base_w = max(4, int(size * 0.022))
    fod.line(outer_f + [outer_f[0]], fill=INK, width=base_w)
    # extra weight on bottom-right (offset duplicate)
    if not simple:
        offset = max(2, int(size * 0.012))
        offset_outer = [(x + offset, y + offset) for (x, y) in outer_f]
        # build a "shadow rim" mask
        rim_mask = Image.new("L", (img_w, img_h), 0)
        rmd = ImageDraw.Draw(rim_mask)
        rmd.polygon(offset_outer, fill=255)
        rmd.polygon(outer_f, fill=0)
        rim_layer = Image.new("RGBA", (img_w, img_h), INK + (0,))
        rim_solid = Image.new("RGBA", (img_w, img_h), INK + (255,))
        rim_layer = rim_solid
        rim_layer.putalpha(rim_mask)
        # composite under front_grad
        front_grad = Image.alpha_composite(rim_layer, front_grad)

    # sky-blue highlight on front B (top-left edge) — only at larger sizes
    if not simple and size >= 120:
        hl_layer = Image.new("RGBA", (img_w, img_h), (0,0,0,0))
        hd = ImageDraw.Draw(hl_layer)
        # take outer points and draw a partial line on the upper-left segment
        n = len(outer_f)
        # roughly first ~25% of points are top-left arc
        seg = outer_f[:max(2, n//4)]
        if len(seg) >= 2:
            hd.line(seg, fill=SKY_L, width=max(2, int(size * 0.012)))

    # --- composite: back gradient + back outline + front rim/grad + front outline + highlight ---
    img = Image.new("RGBA", (img_w, img_h), (0,0,0,0))
    img = Image.alpha_composite(img, back_grad)
    img = Image.alpha_composite(img, back_outline)
    img = Image.alpha_composite(img, front_grad)
    img = Image.alpha_composite(img, front_outline)
    if not simple and size >= 120:
        img = Image.alpha_composite(img, hl_layer)

    return img

def lightning_bolt_uptright(cx, cy, scale=1.0):
    """Bolt running ↗ (opposing the ↘ BB stagger)."""
    s = scale
    pts = [
        (cx - 360*s, cy + 220*s),    # bottom-left start
        (cx - 100*s, cy + 320*s),
        (cx -  50*s, cy +  60*s),
        (cx + 200*s, cy + 100*s),
        (cx +  60*s, cy - 220*s),
        (cx + 380*s, cy - 320*s),
        # back to start through inner spine
        (cx + 120*s, cy - 100*s),
        (cx + 160*s, cy +  20*s),
        (cx -  60*s, cy -  20*s),
    ]
    # cleaner zigzag
    pts = [
        (cx - 360*s, cy + 320*s),
        (cx + 100*s, cy +  60*s),
        (cx -  40*s, cy +  20*s),
        (cx + 360*s, cy - 320*s),
        (cx -  60*s, cy -  60*s),
        (cx + 100*s, cy -  20*s),
    ]
    return pts

# ---------- Final shield render ----------
def render_final_shield(path, W=1800, H=1800, with_chrome=True):
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

    grad = gradient_fill((W, H), PURPLE_D, PURPLE, 100)
    base.paste(grad, (0,0), shield_mask)

    # inner glow upper area
    glow = Image.new("RGBA", (W,H), (0,0,0,0))
    gd = ImageDraw.Draw(glow)
    for r, a in [(440, 70), (320, 100), (220, 130)]:
        gd.ellipse([cx - r, cy - sh*0.18 - r, cx + r, cy - sh*0.18 + r], fill=(*PURPLE_L, a))
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    glow_alpha = glow.split()[3]
    glow.putalpha(ImageChops.multiply(glow_alpha, shield_mask))
    base.paste(glow, (0,0), glow)

    # top jersey band
    band_y1 = int(cy - sh/2 + 70)
    band_y2 = band_y1 + 100
    band_mask = Image.new("L", (W,H), 0)
    bmd = ImageDraw.Draw(band_mask)
    bmd.rectangle([(0, band_y1), (W, band_y2)], fill=255)
    band_inter = ImageChops.multiply(band_mask, shield_mask)
    base.paste(Image.new("RGB", (W,H), ORANGE_D), (0,0), band_inter)

    # sky stripe under band, clipped
    stripe_mask = Image.new("L", (W,H), 0)
    smd2 = ImageDraw.Draw(stripe_mask)
    smd2.rectangle([(0, band_y2 + 4), (W, band_y2 + 10)], fill=255)
    stripe_inter = ImageChops.multiply(stripe_mask, shield_mask)
    base.paste(Image.new("RGB", (W,H), SKY), (0,0), stripe_inter)

    # lightning bolt — ↗ opposing diagonal, positioned BEHIND BB
    # Move it so it peeks top-right and bottom-left corners only
    bolt_pts = lightning_bolt_uptright(cx, cy + 40, scale=1.55)
    bolt_layer = Image.new("RGBA", (W,H), (0,0,0,0))
    bld = ImageDraw.Draw(bolt_layer)
    bld.polygon(bolt_pts, fill=(*ORANGE, 255))
    # glow
    bglow = bolt_layer.filter(ImageFilter.GaussianBlur(28))
    bglow_a = bglow.split()[3]
    bglow.putalpha(ImageChops.multiply(bglow_a, shield_mask))
    base.paste(bglow, (0,0), bglow)
    # crisp bolt clipped
    bolt_a = bolt_layer.split()[3]
    bolt_layer.putalpha(ImageChops.multiply(bolt_a, shield_mask))
    base.paste(bolt_layer, (0,0), bolt_layer)

    # bolt outline clipped
    bolt_out = Image.new("RGBA", (W,H), (0,0,0,0))
    bod = ImageDraw.Draw(bolt_out)
    bod.line(bolt_pts + [bolt_pts[0]], fill=INK, width=10)
    bo_a = bolt_out.split()[3]
    bolt_out.putalpha(ImageChops.multiply(bo_a, shield_mask))
    base.paste(bolt_out, (0,0), bolt_out)

    # outer dark + sky piping
    d = ImageDraw.Draw(base)
    pts_out = shield_points(cx, cy, sw + 36, sh + 36)
    d.line(pts_out + [pts_out[0]], fill=INK, width=22)
    pts = shield_points(cx, cy, sw, sh)
    d.line(pts + [pts[0]], fill=SKY, width=12)

    # BB monogram — final
    bb = make_bb_final(560)
    # nudge ~8% upward of geometric center (visual centering on tapered shield)
    bx = int(cx - bb.size[0]/2)
    by = int(cy - bb.size[1]/2 - sh*0.04)
    base.paste(bb, (bx, by), bb)

    # Mask BB under bolt? — already drawn after bolt so BB sits ABOVE bolt (correct: bolt behind)

    if with_chrome:
        try:
            font_word = ImageFont.truetype(os.path.join(FONTS, "BigShoulders-Bold.ttf"), 110)
            font_motto = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Bold.ttf"), 26)
            font_label = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Regular.ttf"), 18)
        except:
            font_word = font_motto = font_label = ImageFont.load_default()

        d = ImageDraw.Draw(base)
        word = "BARMIBUDDY"
        tw = d.textlength(word, font=font_word)
        word_y = cy + sh/2 + 80
        d.text((cx - tw/2, word_y), word, font=font_word, fill=WHITE)

        motto = "PRACTICE   ·   BATTLE   ·   CRUSH  IT"
        mw = d.textlength(motto, font=font_motto)
        d.text((cx - mw/2, word_y + 130), motto, font=font_motto, fill=PURPLE_L)

        d.text((60, 60), "FINAL  ·  BB  CREST", font=font_label, fill=(120, 130, 160))
        d.text((60, 88), "TWO  B's  =  BARMI  +  BUDDY", font=font_label, fill=(120, 130, 160))
        rl = "VAR 01 · DIAGONAL ↘ · REFINED"
        d.text((W - 60 - d.textlength(rl, font=font_label), 60), rl, font=font_label, fill=(120,130,160))
        rl2 = "LOCKER-ROOM  MYTHOS"
        d.text((W - 60 - d.textlength(rl2, font=font_label), 88), rl2, font=font_label, fill=(120,130,160))

    base.save(path, "PNG")

# ---------- Standalone "clean" badge (no chrome, no wordmark, transparent-bg friendly) ----------
def render_badge_clean(path, size=1024):
    W = H = size
    base = Image.new("RGBA", (W, H), (0,0,0,0))
    cx, cy = W/2, H/2

    # shadow
    shadow = Image.new("RGBA", (W,H), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sw_, sh_ = int(W*0.74), int(H*0.82)
    sd.polygon([(x, y + size*0.025) for (x,y) in shield_points(cx, cy, sw_, sh_)], fill=(0,0,0,180))
    shadow = shadow.filter(ImageFilter.GaussianBlur(int(size*0.025)))
    base = Image.alpha_composite(base, shadow)

    shield_mask = Image.new("L", (W,H), 0)
    smd = ImageDraw.Draw(shield_mask)
    smd.polygon(shield_points(cx, cy, sw_, sh_), fill=255)

    grad = gradient_fill((W, H), PURPLE_D, PURPLE, 100).convert("RGBA")
    grad.putalpha(shield_mask)
    base = Image.alpha_composite(base, grad)

    # top band
    band_y1 = int(cy - sh_/2 + size*0.045)
    band_y2 = band_y1 + int(size*0.062)
    band_mask = Image.new("L", (W,H), 0)
    bmd = ImageDraw.Draw(band_mask)
    bmd.rectangle([(0, band_y1), (W, band_y2)], fill=255)
    band_inter = ImageChops.multiply(band_mask, shield_mask)
    band_layer = Image.new("RGBA", (W,H), ORANGE_D + (255,))
    band_layer.putalpha(band_inter)
    base = Image.alpha_composite(base, band_layer)

    # sky stripe
    stripe_mask = Image.new("L", (W,H), 0)
    smd2 = ImageDraw.Draw(stripe_mask)
    smd2.rectangle([(0, band_y2 + 3), (W, band_y2 + 7)], fill=255)
    stripe_inter = ImageChops.multiply(stripe_mask, shield_mask)
    stripe_layer = Image.new("RGBA", (W,H), SKY + (255,))
    stripe_layer.putalpha(stripe_inter)
    base = Image.alpha_composite(base, stripe_layer)

    # bolt
    bolt_pts = lightning_bolt_uptright(cx, cy + size*0.025, scale=size/1800*1.55)
    bolt_layer = Image.new("RGBA", (W,H), (0,0,0,0))
    bld = ImageDraw.Draw(bolt_layer)
    bld.polygon(bolt_pts, fill=(*ORANGE, 255))
    ba = bolt_layer.split()[3]
    bolt_layer.putalpha(ImageChops.multiply(ba, shield_mask))
    base = Image.alpha_composite(base, bolt_layer)
    # bolt outline
    bo = Image.new("RGBA", (W,H), (0,0,0,0))
    bod = ImageDraw.Draw(bo)
    bod.line(bolt_pts + [bolt_pts[0]], fill=INK, width=max(3, int(size*0.006)))
    boa = bo.split()[3]
    bo.putalpha(ImageChops.multiply(boa, shield_mask))
    base = Image.alpha_composite(base, bo)

    # outlines
    out_layer = Image.new("RGBA", (W,H), (0,0,0,0))
    od = ImageDraw.Draw(out_layer)
    pts_out = shield_points(cx, cy, sw_ + int(size*0.022), sh_ + int(size*0.022))
    od.line(pts_out + [pts_out[0]], fill=INK + (255,), width=max(4, int(size*0.013)))
    pts = shield_points(cx, cy, sw_, sh_)
    od.line(pts + [pts[0]], fill=SKY + (255,), width=max(2, int(size*0.0075)))
    base = Image.alpha_composite(base, out_layer)

    # BB
    simple = size <= 64
    bb = make_bb_final(int(size * 0.35), simple=simple)
    bx = int(cx - bb.size[0]/2)
    by = int(cy - bb.size[1]/2 - sh_*0.04)
    bb_canvas = Image.new("RGBA", (W,H), (0,0,0,0))
    bb_canvas.paste(bb, (bx, by), bb)
    base = Image.alpha_composite(base, bb_canvas)

    base.save(path, "PNG")

# ---------- Size sheet ----------
def render_size_sheet(path, W=2400, H=1400):
    base = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(base)
    for i in range(0, W, 80):
        d.line([(i,0),(i,H)], fill=(14,16,24), width=1)
    for j in range(0, H, 80):
        d.line([(0,j),(W,j)], fill=(14,16,24), width=1)

    try:
        font_h = ImageFont.truetype(os.path.join(FONTS, "BigShoulders-Bold.ttf"), 64)
        font_lbl = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Bold.ttf"), 22)
        font_sub = ImageFont.truetype(os.path.join(FONTS, "GeistMono-Regular.ttf"), 16)
    except:
        font_h = font_lbl = font_sub = ImageFont.load_default()

    d.text((60, 50), "SCALE TEST  —  16 / 32 / 64 / 192 / 512 px", font=font_h, fill=WHITE)
    d.text((60, 130), "Same artwork, rendered at each export size. Front B = Barmi, Back B = Buddy.", font=font_sub, fill=(120,130,160))

    sizes = [16, 32, 64, 192, 512]
    # Render each clean badge, then paste centered in row at native size
    y_base = 320
    x = 120
    spacing = 60
    # First, make tmp files for each size
    for sz in sizes:
        tmpp = os.path.join(OUT, f"_tmp_badge_{sz}.png")
        render_badge_clean(tmpp, size=sz)
    # display row
    for sz in sizes:
        img = Image.open(os.path.join(OUT, f"_tmp_badge_{sz}.png")).convert("RGBA")
        # cell width = max size
        cell_w = max(sz, 600) if sz >= 192 else 360
        cell_w = 380
        if sz >= 192: cell_w = 540
        if sz >= 512: cell_w = 720
        # paste centered horizontally in cell, vertically anchored
        cy = y_base + 380 - sz/2
        cx = x + cell_w/2 - sz/2
        base.paste(img, (int(cx), int(cy)), img)
        # label
        lbl = f"{sz} × {sz}"
        d = ImageDraw.Draw(base)
        tw = d.textlength(lbl, font=font_lbl)
        d.text((x + cell_w/2 - tw/2, y_base + 800), lbl, font=font_lbl, fill=WHITE)
        usage = {16:"FAVICON · TAB", 32:"FAVICON · TAB", 64:"WEB · UI", 192:"PWA · ANDROID", 512:"APP · iOS"}[sz]
        tw2 = d.textlength(usage, font=font_sub)
        d.text((x + cell_w/2 - tw2/2, y_base + 840), usage, font=font_sub, fill=(120,130,160))
        x += cell_w + spacing

    base.save(path, "PNG")
    # cleanup tmps? keep them — they're useful exports
    print("size sheet done")

if __name__ == "__main__":
    render_final_shield(os.path.join(OUT, "FINAL-shield-presentation.png"))
    print("presentation done")
    # Clean exports
    for sz, name in [(64, "icon-64.png"), (192, "icon-192.png"),
                     (512, "icon-512.png"), (1024, "icon-1024.png")]:
        render_badge_clean(os.path.join(OUT, name), size=sz)
        print(f"{name} done")
    render_badge_clean(os.path.join(OUT, "icon-32.png"), size=32)
    render_badge_clean(os.path.join(OUT, "icon-16.png"), size=16)
    render_size_sheet(os.path.join(OUT, "FINAL-size-sheet.png"))
