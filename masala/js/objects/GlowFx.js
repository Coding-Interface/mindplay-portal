/**
 * GlowFx
 * Game-style selection highlight: makes (and caches) a soft, blurred halo
 * texture for any size and colour, drawn on a canvas once.
 * Used behind a selected object, together with a pulsing glow filled over
 * the object itself (see VehicleSprite / JarSprite).
 */
class GlowFx {
  /**
   * @returns {{key:string, pad:number}} texture key and the padding around the object
   */
  static halo(scene, w, h, color, radius) {
    const pad = 26;
    const W = Math.round(w + pad * 2);
    const H = Math.round(h + pad * 2);
    const key = 'halo_' + W + 'x' + H + '_' + color.toString(16) + '_' + (radius || 0);
    if (!scene.textures.exists(key)) {
      const tex = scene.textures.createCanvas(key, W, H);
      const ctx = tex.getContext();
      const r = (color >> 16) & 255;
      const g = (color >> 8) & 255;
      const b = color & 255;
      const rr = Math.min(radius === undefined ? 18 : radius, Math.min(w, h) / 2);
      const shape = (inset) => {
        const x = pad + inset;
        const y = pad + inset;
        const ww = w - inset * 2;
        const hh = h - inset * 2;
        const k = Math.max(0, rr - inset);
        ctx.beginPath();
        ctx.moveTo(x + k, y);
        ctx.arcTo(x + ww, y, x + ww, y + hh, k);
        ctx.arcTo(x + ww, y + hh, x, y + hh, k);
        ctx.arcTo(x, y + hh, x, y, k);
        ctx.arcTo(x, y, x + ww, y, k);
        ctx.closePath();
      };
      // outer blurred glow, built up in passes
      ctx.shadowColor = `rgba(${r},${g},${b},1)`;
      [24, 14, 6].forEach((blur, i) => {
        ctx.shadowBlur = blur;
        ctx.fillStyle = `rgba(${r},${g},${b},${0.55 + i * 0.15})`;
        shape(-4);
        ctx.fill();
      });
      // bright inner fill with a white core, like a power-up pad
      ctx.shadowBlur = 0;
      const grad = ctx.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, Math.max(w, h) * 0.65);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(0.45, `rgba(${r},${g},${b},0.85)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0.55)`);
      ctx.fillStyle = grad;
      shape(0);
      ctx.fill();
      // crisp white rim
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      shape(-2);
      ctx.stroke();
      tex.refresh();
    }
    return { key, pad };
  }
}

GlowFx.SELECT = 0xffc21a;
GlowFx.HINT = 0x5ff07a;
