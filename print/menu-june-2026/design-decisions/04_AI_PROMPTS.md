# 04 — Hideout Miami · AI Image Generation Prompts
## ChatGPT · Gemini · Midjourney · Adobe Firefly

---

## Before you generate anything: read the art direction

The biggest failure mode with AI image generation for Hideout is getting:
- Coffee beans macro shots
- Latte art
- Bright warm Instagram café
- People smiling over drinks
- Stock food photography

These are wrong. Read `00_MASTER_ART_DIRECTION.md` first.

The reference worlds are: boutique hotel collateral, museum print, private club, Japanese specialty coffee.

Generate mood boards first. Then photography. Then use photography as a background layer in Photoshop — never as the hero of the card.

---

## Section A: Mood Board Prompts
### Use these to find the right visual world before designing anything

These prompts are for reference images, not final assets. Generate 10–20 variations from these and pin the ones that feel most like the column boards.

---

**Mood A1 — Boutique hotel collateral**
```
Dark luxury hotel collateral photography. Room service card, amenity envelope, key card holder. Very dark backgrounds — charcoal or near-black paper. Cream or ivory typography. Single warm accent. No branding. No text. Just the objects on a dark surface. Aman Resorts, Rosewood Hotels aesthetic. Flat lay. Ultra clean. Film grain.
```

**Mood A2 — Museum membership print**
```
Museum membership cards and exhibition handout materials. Dark backgrounds. Minimal serif typography. Strong negative space. No logos or text visible. The objects themselves: a cream envelope on dark gray, a thin card on a dark table surface, a folded program on slate. Modern art museum aesthetic. Flat lay or slight angle. Clean and quiet.
```

**Mood A3 — Private club notice**
```
Private members club printed notices and cards. Very restrained. Dark card stock. Cream letterpress typography impression. One warm metallic or amber accent. No text legible. The feel: this was made carefully for a small number of people who already belong. Soho House, Core Club register. No sales language anywhere. Photographed on dark stone or leather surface.
```

**Mood A4 — Japanese specialty coffee**
```
Japanese specialty coffee house printed collateral. Extreme negative space. Black or dark kraft paper. Clean sans-serif or minimal serif typography. No visible text. The objects: a folded menu card, a small tag, a paper sleeve on a cup, all on a dark stone surface. Blue Bottle Japan, %Arabica, Fuglen aesthetic. Side light. Film grain. Very quiet.
```

---

## Section B: Background Photography Prompts
### For use as background layers in Photoshop (text goes on top)

All images should be:
- Dark enough for cream text to sit on top
- No text, no logos, no faces
- Film grain
- Warm highlights, cool/neutral shadows

---

**B1 — Terrace atmosphere (Lobby stand background)**
```
Open-air café terrace, second floor of a building, nightfall or early morning. Edison string lights hanging overhead — not on yet, or just barely glowing. Dense tropical plants visible beyond the railing. Concrete floor. No people. No text. No signage. Mood: deep charcoal blacks, very dark overall, single warm light source. Film grain. Shot from a standing person's eye level, looking into the terrace. Portrait orientation, 5:7 ratio.
```

Gemini / ChatGPT version:
```
Photograph: dark atmospheric open-air terrace on a second floor. String lights overhead not illuminated. Tropical plants in background. Concrete floor. Empty. No people, no text, no logos. Very dark — charcoal blacks with warm highlights. Film grain texture. Portrait 5:7 aspect ratio. Ultra high resolution.
```

Midjourney:
```
/imagine prompt: empty open air cafe terrace second floor, string lights, tropical plants, concrete floor, very dark atmosphere, warm highlights, no people, no text, film grain --ar 5:7 --style raw --v 6 --no people, text, signage, signs
```

---

**B2 — Dark surface texture (universal background)**
```
Extreme close-up photograph of aged dark concrete or stone surface. Very dark — near black with subtle warm gray undertone and natural variation. Not perfectly uniform — natural marks and texture. Used as a design background overlay. No color except warm dark neutrals. 1:1 aspect ratio.
```

Gemini / ChatGPT:
```
Photograph: extreme close-up of dark aged concrete or stone. Very dark, near-black with warm gray tones. Natural surface variation. No objects. No color. Used as a texture background. Square 1:1 aspect ratio.
```

---

**B3 — Cold brew close-up (Counter card background)**
```
Extreme close-up of a cold brew coffee in a clear cup with a paper straw on a dark concrete surface. Morning light from the left. Water condensation on the cup exterior. Very dark background. Caramel and cream tones in the liquid. No people. No text. No logos. 1:1 square. Ultra sharp on the cup, soft blur background. Film grain.
```

---

**B4 — Morning terrace corner (Watermarc card background)**
```
Quiet empty café terrace corner, early morning, before opening. Wooden table, simple metal chair, string lights off. Second floor — trees and sky slightly visible beyond railing. No people. No text. Dark and calm. Slightly warm shadows. Muted. 4:3 landscape. Film grain.
```

---

**B5 — Vinyl record close-up (Sunday exit card background)**
```
Close-up photograph of a vinyl record on a turntable. Very dark background — deep charcoal. Single warm light source from upper left, catching the record grooves. Image slightly soft/out of focus. No text. No people. No room visible. Deep cream and charcoal tones. Film grain. 4:3 ratio. Intimate and warm.
```

---

**B6 — Gallon cold brew containers (Office card background)**
```
Multiple large gallon-size cold brew containers lined up on a dark counter or shelf. Dark background. Morning side-light from one direction catching the deep brown liquid. No branding or labels on containers. Industrial and simple. No people. Film grain. Portrait 4:6 ratio.
```

---

**B7 — Food flat lay (Mini flyer back background)**
```
Overhead flat lay on dark slate surface: a smoothie in a clear cup with a paper straw, egg and avocado toast on sourdough, a small shot glass with amber liquid. Natural overhead light. Simply styled — no props, no garnish. Dark background dominant. Cream and earth tones in the food. Ultra sharp. Bird's eye view, portrait 2:3 ratio. Film grain.
```

---

## Section C: Generation Settings

### For ChatGPT (GPT-4o with image generation)
- Generate 4 variations per prompt
- Request "high quality, photographic" style
- Add "no AI artifacts, no obvious compositing" to any prompt where quality matters

### For Gemini Imagen
- Use Imagen 3 if available
- Select "Photography" mode not "Illustration"
- Aspect ratio: specify exactly as written above

### For Midjourney (if available)
- Always add `--style raw` to prevent AI-polished look
- Add `--v 6` for current model
- Add `--no people, text, logos, signage` to every prompt
- `--ar` flag handles aspect ratio: `--ar 5:7` for portrait, `--ar 1:1` for square

### For Adobe Firefly
- Use "Generative Fill" for extending backgrounds
- Use "Text to Image" for mood boards
- Good for: terrace atmosphere shots
- Less good for: food photography (tends to oversaturate)

---

## Section D: Post-Generation Checklist

Before using any image in Photoshop:

- [ ] No people or faces visible
- [ ] No unintended text or signage in the image
- [ ] No logos from other businesses
- [ ] Dark enough to put cream text over (test by placing a text layer)
- [ ] Correct aspect ratio for the intended piece
- [ ] Saved as PNG (no JPEG artifacts) at highest available resolution
- [ ] Film grain present — prevents stock photo look
- [ ] No obvious AI tells (melting edges, impossible geometry, wrong shadows)

---

## Section E: What to Skip

Do not prompt for or use:
- Coffee beans (any kind — whole bean, scattered, close-up)
- Latte art
- Espresso machine (barista-centric)
- People smiling or drinking
- Sunny bright terrace shots
- Any food styled like a food magazine
- Miami skyline
- Any stock "café" image that could be anywhere

These look like every other café. Hideout is not every other café.
