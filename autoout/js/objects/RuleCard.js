/**
 * RuleCard
 * Teaches a rule the first time it appears, using the real game art.
 * "Got it" (or close()) dismisses it.
 */
class RuleCard {
  constructor(scene, rule, onClose) {
    this.scene = scene;
    this.items = [];
    this.onClose = onClose;
    const W = scene.scale.width;
    const H = scene.scale.height;
    const C = GameConfig.COLORS;
    const font = GameConfig.FONT;
    const info = RuleCard.RULES[rule];

    const shade = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.62).setDepth(100).setInteractive();
    const card = scene.add.graphics().setDepth(101);
    card.fillStyle(C.panel, 1).fillRoundedRect(W / 2 - 480, 60, 960, 600, 30);
    card.lineStyle(6, C.panelLine, 1).strokeRoundedRect(W / 2 - 480, 60, 960, 600, 30);
    this.items.push(shade, card);

    this.items.push(scene.add.text(W / 2, 114, info.title, {
      fontFamily: font, fontSize: '42px', color: C.text, fontStyle: '800'
    }).setOrigin(0.5).setDepth(102));

    const cy = 268;
    const gap = info.pics.length > 2 ? 300 : 340;
    info.pics.forEach((p, i) => {
      const x = W / 2 + (i - (info.pics.length - 1) / 2) * gap;
      // a patch of road behind each picture
      const pad = scene.add.graphics().setDepth(102);
      pad.fillStyle(0x4b4f54, 1).fillRoundedRect(x - 130, cy - 110, 260, 220, 18);
      this.items.push(pad);
      const img = scene.add.image(x, cy, p.key).setDepth(103);
      img.setScale(p.scale || 0.62);
      if (p.vertical) img.setAngle(90);
      this.items.push(img);
      if (p.arrows) {
        const g = scene.add.graphics().setDepth(104);
        g.fillStyle(C.accent, 1);
        const d = p.vertical ? 88 : 104;
        if (p.vertical) {
          g.fillTriangle(x, cy - d - 18, x - 15, cy - d + 2, x + 15, cy - d + 2);
          g.fillTriangle(x, cy + d + 18, x - 15, cy + d - 2, x + 15, cy + d - 2);
        } else {
          g.fillTriangle(x - d - 18, cy, x - d + 2, cy - 15, x - d + 2, cy + 15);
          g.fillTriangle(x + d + 18, cy, x + d - 2, cy - 15, x + d - 2, cy + 15);
        }
        this.items.push(g);
      }
      this.items.push(scene.add.text(x, cy + 124, p.caption, {
        fontFamily: font, fontSize: '23px', color: C.text, align: 'center', fontStyle: '700', wordWrap: { width: 270 }
      }).setOrigin(0.5, 0).setDepth(102));
    });

    this.items.push(scene.add.text(W / 2, 520, info.text, {
      fontFamily: font, fontSize: '25px', color: C.textDim, align: 'center', wordWrap: { width: 860 }
    }).setOrigin(0.5).setDepth(102));

    const btn = new TextButton(scene, W / 2, 604, 'Got it!', () => this.close(), { width: 240, height: 64, fontSize: 30 });
    btn.setDepth(103);
    this.items.push(btn);
  }

  close() {
    if (!this.items.length) return;
    this.items.forEach(o => o.destroy());
    this.items = [];
    this.onClose();
  }
}

RuleCard.RULES = {
  slide: {
    title: 'Morning rush at the school gate',
    pics: [
      { key: 'van', caption: 'Get the school van out through the gate', arrows: true },
      { key: 'auto', caption: 'Vehicles slide forward or back', arrows: true, vertical: true },
      { key: 'bus', caption: 'Buses, trucks and tankers are 3 cells long', scale: 0.6 }
    ],
    text: 'Drag a vehicle along its lane. It can never turn or move sideways. A slide of any length is one move.'
  },
  blockers: {
    title: 'Some things never move',
    pics: [
      { key: 'cow', caption: 'A cow resting on the road', scale: 1.25 },
      { key: 'barricade', caption: 'A police barricade', scale: 1.25 },
      { key: 'cart', caption: 'A parked sabzi cart', scale: 1.25 }
    ],
    text: 'Cows, barricades and carts stay where they are, however much you honk. Plan your moves around them.'
  },
  bigger: {
    title: 'Rush hour: a bigger lot!',
    pics: [
      { key: 'cop', caption: 'The lot is now 7×7', scale: 1.1 },
      { key: 'tanker', caption: 'More traffic, and long water tankers', scale: 0.55 }
    ],
    text: 'More lanes and more vehicles. Find the chain: which vehicle blocks the van, and what blocks that one?'
  },
  biggest: {
    title: 'The biggest jam: 8×8',
    pics: [
      { key: 'cop', caption: 'Hawaldar Singh needs your help!', scale: 1.1 },
      { key: 'truck', caption: 'Some vehicles must move twice', scale: 0.55 }
    ],
    text: 'The busiest morning of the year. Work backwards from the gate, and do not undo your own good moves.'
  }
};
