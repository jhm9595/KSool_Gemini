const fs = require('fs');
const path = require('path');

const g1 = require('./pixel_sprites/ingredients_1.js');
const g2 = require('./pixel_sprites/ingredients_2.js');
const g3 = require('./pixel_sprites/ingredients_3.js');
const r1 = require('./pixel_sprites/recipes_unique_1.js');
const r2 = require('./pixel_sprites/recipes_unique_2.js');
const r3 = require('./pixel_sprites/recipes_unique_3.js');

const allSprites = [...g1, ...g2, ...g3, ...r1, ...r2, ...r3];

console.log(`Loaded ${allSprites.length} total sprite definitions.`);

// Generate coalesced SVG rect paths for 12x12
function compileSvgInner(sprite) {
  const { palette, rows } = sprite;
  let rects = [];
  
  for (let y = 0; y < 12; y++) {
    const row = rows[y];
    let startX = -1;
    let currentColor = null;
    
    for (let x = 0; x < 12; x++) {
      const char = row[x];
      const color = palette[char];
      
      if (color !== currentColor) {
        if (currentColor && startX !== -1) {
          const w = x - startX;
          rects.push(`<rect x="${startX}" y="${y}" width="${w}" height="1" fill="${currentColor}"/>`);
        }
        currentColor = color;
        startX = color ? x : -1;
      }
    }
    
    if (currentColor && startX !== -1) {
      const w = 12 - startX;
      rects.push(`<rect x="${startX}" y="${y}" width="${w}" height="1" fill="${currentColor}"/>`);
    }
  }
  
  return rects.join('');
}

// Precompile sprite data
const spriteData = {};
const aliasMap = {};

allSprites.forEach(s => {
  const innerSvg = compileSvgInner(s);
  spriteData[s.key] = {
    key: s.key,
    name: s.name,
    innerSvg
  };

  // Register aliases
  aliasMap[s.key] = s.key;
  aliasMap[s.name] = s.key;
  if (s.id) {
    aliasMap[s.id] = s.key;
    aliasMap[String(s.id)] = s.key;
  }
  if (s.aliases) {
    s.aliases.forEach(a => {
      aliasMap[a] = s.key;
      aliasMap[String(a)] = s.key;
    });
  }
});

// Write PixelIconRegistry.js
const outputFile = path.resolve(__dirname, '../src/js/services/PixelIconRegistry.js');

const registryCode = `/**
 * PixelIconRegistry - K-SOOL Custom Handcrafted Pixel Art System
 * 
 * Provides 12x12 retro pixel art SVG icons for all 65 ingredients and 83 recipes.
 * Resembles real-life Korean alcoholic drinks, soft drinks, ice pops, and ingredients.
 * Features crisp pixel edges (shape-rendering="crispEdges"), resolution independence,
 * and high-performance O(1) alias lookup.
 */
(function() {
  window.KSool = window.KSool || {};

  const SPRITE_DATA = ${JSON.stringify(spriteData, null, 2)};
  const ALIAS_MAP = ${JSON.stringify(aliasMap, null, 2)};

  const PixelIconRegistry = {
    /**
     * Resolve any item or key to its primary sprite key
     */
    resolveKey: function(item) {
      if (!item) return null;
      if (typeof item === 'string' || typeof item === 'number') {
        const str = String(item).trim();
        if (ALIAS_MAP[str]) return ALIAS_MAP[str];
        if (ALIAS_MAP[item]) return ALIAS_MAP[item];
        // Strip common prefixes
        const clean = str.replace(/^(ing_|rec_)/, '');
        if (ALIAS_MAP[clean]) return ALIAS_MAP[clean];
        return null;
      }
      
      // Object inspection
      const candidates = [
        item.key,
        item.recipe_id,
        item.ingredient_id,
        item.unlocks_ingredient_id,
        item.id,
        item.display_name,
        item.real_name,
        item.name
      ];

      for (let i = 0; i < candidates.length; i++) {
        const val = candidates[i];
        if (val !== undefined && val !== null) {
          if (ALIAS_MAP[val]) return ALIAS_MAP[val];
          const str = String(val).trim();
          if (ALIAS_MAP[str]) return ALIAS_MAP[str];
        }
      }

      return null;
    },

    /**
     * Get SVG string for the specified item or key
     * @param {string|number|object} item - Item object, ID, or key
     * @param {object} options - { size: 24, className: '', style: '', fallbackEmoji: '' }
     * @returns {string} SVG HTML string or fallback
     */
    getSvg: function(item, options) {
      const opts = options || {};
      const size = opts.size || 24;
      const cls = opts.className ? ' ' + opts.className : '';
      const extraStyle = opts.style ? ';' + opts.style : '';
      const key = this.resolveKey(item);

      if (key && SPRITE_DATA[key]) {
        const sprite = SPRITE_DATA[key];
        return '<svg class="k-pixel-icon' + cls + '" viewBox="0 0 12 12" width="' + size + '" height="' + size + '" ' +
               'style="shape-rendering:crispEdges;image-rendering:pixelated;vertical-align:middle;flex-shrink:0' + extraStyle + '" ' +
               'aria-label="' + (sprite.name || key) + '">' +
               sprite.innerSvg +
               '</svg>';
      }

      // Fallback: if emoji is available
      const fallback = (item && (item.emoji || item.icon)) || opts.fallbackEmoji || '🍶';
      return '<span class="k-pixel-icon-fallback' + cls + '" style="display:inline-block;font-size:' + (size * 0.85) + 'px;line-height:1;vertical-align:middle' + extraStyle + '">' + fallback + '</span>';
    },

    /**
     * Render as an HTML wrapper element
     */
    render: function(item, options) {
      return this.getSvg(item, options);
    },

    /**
     * Get Data URL for use in CSS background or src
     */
    getDataUrl: function(item) {
      const svg = this.getSvg(item, { size: 48 });
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    },

    /**
     * Check if a sprite exists for the given item
     */
    has: function(item) {
      return !!this.resolveKey(item);
    },

    /**
     * Get all registered keys
     */
    getAllKeys: function() {
      return Object.keys(SPRITE_DATA);
    }
  };

  // Attach to window.KSool
  window.KSool.PixelIconRegistry = PixelIconRegistry;

  /**
   * Global shorthand helper
   * @param {string|number|object} item
   * @param {number} [size=24]
   * @param {string} [className='']
   * @returns {string}
   */
  window.KSool.pixelIcon = function(item, size, className) {
    return PixelIconRegistry.render(item, { size: size || 24, className: className || '' });
  };

  console.log('[PixelIconRegistry] Initialized with', Object.keys(SPRITE_DATA).length, 'custom pixel art sprites.');
})();
`;

fs.writeFileSync(outputFile, registryCode, 'utf8');
console.log(`Successfully generated ${outputFile} (${Math.round(registryCode.length / 1024)} KB)!`);
