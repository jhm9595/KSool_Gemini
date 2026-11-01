/**
 * PixelIconRegistry - K-SOOL Custom Handcrafted Pixel Art System
 * 
 * Provides 16x16 handcrafted retro pixel art SVG icons for all 65 ingredients and 83 recipes.
 * Resembles real-life Korean alcoholic drinks, soft drinks, ice pops, and ingredients.
 * Features crisp pixel edges (shape-rendering="crispEdges"), resolution independence,
 * and high-performance O(1) alias lookup.
 */
(function() {
  window.KSool = window.KSool || {};

  const SPRITE_DATA = {
  "soju": {
    "key": "soju",
    "name": "소주",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"12\" y=\"1\" width=\"8\" height=\"2\" fill=\"#14532d\"/><rect x=\"13\" y=\"1\" width=\"6\" height=\"1\" fill=\"#22c55e\"/><rect x=\"12\" y=\"3\" width=\"8\" height=\"1\" fill=\"#166534\"/><rect x=\"13\" y=\"4\" width=\"1\" height=\"7\" fill=\"#14532d\"/><rect x=\"14\" y=\"4\" width=\"1\" height=\"7\" fill=\"#86efac\"/><rect x=\"15\" y=\"4\" width=\"2\" height=\"7\" fill=\"#22c55e\"/><rect x=\"17\" y=\"4\" width=\"1\" height=\"7\" fill=\"#16a34a\"/><rect x=\"18\" y=\"4\" width=\"1\" height=\"7\" fill=\"#14532d\"/><rect x=\"12\" y=\"11\" width=\"2\" height=\"1\" fill=\"#86efac\"/><rect x=\"14\" y=\"11\" width=\"4\" height=\"1\" fill=\"#22c55e\"/><rect x=\"18\" y=\"11\" width=\"2\" height=\"1\" fill=\"#14532d\"/><rect x=\"10\" y=\"12\" width=\"3\" height=\"1\" fill=\"#86efac\"/><rect x=\"13\" y=\"12\" width=\"6\" height=\"1\" fill=\"#22c55e\"/><rect x=\"19\" y=\"12\" width=\"3\" height=\"1\" fill=\"#14532d\"/><rect x=\"9\" y=\"13\" width=\"3\" height=\"1\" fill=\"#86efac\"/><rect x=\"12\" y=\"13\" width=\"8\" height=\"1\" fill=\"#22c55e\"/><rect x=\"20\" y=\"13\" width=\"3\" height=\"1\" fill=\"#14532d\"/><rect x=\"8\" y=\"14\" width=\"1\" height=\"15\" fill=\"#14532d\"/><rect x=\"9\" y=\"14\" width=\"1\" height=\"15\" fill=\"#4ade80\"/><rect x=\"10\" y=\"14\" width=\"2\" height=\"15\" fill=\"#86efac\"/><rect x=\"12\" y=\"14\" width=\"7\" height=\"15\" fill=\"#22c55e\"/><rect x=\"19\" y=\"14\" width=\"3\" height=\"15\" fill=\"#16a34a\"/><rect x=\"22\" y=\"14\" width=\"1\" height=\"15\" fill=\"#166534\"/><rect x=\"23\" y=\"14\" width=\"1\" height=\"15\" fill=\"#14532d\"/><rect x=\"10\" y=\"17\" width=\"12\" height=\"9\" fill=\"#ffffff\"/><rect x=\"10\" y=\"17\" width=\"12\" height=\"1\" fill=\"#f1f5f9\"/><rect x=\"10\" y=\"25\" width=\"12\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"14\" y=\"18\" width=\"4\" height=\"1\" fill=\"#0284c7\"/><rect x=\"13\" y=\"19\" width=\"6\" height=\"2\" fill=\"#0369a1\"/><rect x=\"14\" y=\"19\" width=\"2\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"15\" y=\"20\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"15\" y=\"22\" width=\"2\" height=\"2\" fill=\"#ef4444\"/><rect x=\"15\" y=\"22\" width=\"1\" height=\"1\" fill=\"#fca5a5\"/><rect x=\"12\" y=\"24\" width=\"8\" height=\"1\" fill=\"#64748b\"/><rect x=\"9\" y=\"29\" width=\"14\" height=\"1\" fill=\"#166534\"/><rect x=\"10\" y=\"30\" width=\"12\" height=\"1\" fill=\"#14532d\"/>"
  },
  "beer": {
    "key": "beer",
    "name": "맥주",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"12\" y=\"1\" width=\"8\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"13\" y=\"1\" width=\"6\" height=\"1\" fill=\"#fde047\"/><rect x=\"12\" y=\"2\" width=\"8\" height=\"1\" fill=\"#b45309\"/><rect x=\"13\" y=\"3\" width=\"6\" height=\"3\" fill=\"#f59e0b\"/><rect x=\"14\" y=\"3\" width=\"2\" height=\"3\" fill=\"#fef08a\"/><rect x=\"16\" y=\"3\" width=\"2\" height=\"3\" fill=\"#d97706\"/><rect x=\"12\" y=\"5\" width=\"8\" height=\"1\" fill=\"#b45309\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"5\" fill=\"#451a03\"/><rect x=\"14\" y=\"6\" width=\"1\" height=\"5\" fill=\"#f59e0b\"/><rect x=\"15\" y=\"6\" width=\"2\" height=\"5\" fill=\"#92400e\"/><rect x=\"17\" y=\"6\" width=\"1\" height=\"5\" fill=\"#78350f\"/><rect x=\"18\" y=\"6\" width=\"1\" height=\"5\" fill=\"#260e02\"/><rect x=\"12\" y=\"11\" width=\"2\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"14\" y=\"11\" width=\"4\" height=\"1\" fill=\"#92400e\"/><rect x=\"18\" y=\"11\" width=\"2\" height=\"1\" fill=\"#451a03\"/><rect x=\"10\" y=\"12\" width=\"3\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"13\" y=\"12\" width=\"6\" height=\"1\" fill=\"#92400e\"/><rect x=\"19\" y=\"12\" width=\"3\" height=\"1\" fill=\"#451a03\"/><rect x=\"9\" y=\"13\" width=\"3\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"12\" y=\"13\" width=\"8\" height=\"1\" fill=\"#92400e\"/><rect x=\"20\" y=\"13\" width=\"3\" height=\"1\" fill=\"#260e02\"/><rect x=\"8\" y=\"14\" width=\"1\" height=\"15\" fill=\"#451a03\"/><rect x=\"9\" y=\"14\" width=\"1\" height=\"15\" fill=\"#d97706\"/><rect x=\"10\" y=\"14\" width=\"2\" height=\"15\" fill=\"#f59e0b\"/><rect x=\"12\" y=\"14\" width=\"7\" height=\"15\" fill=\"#78350f\"/><rect x=\"19\" y=\"14\" width=\"3\" height=\"15\" fill=\"#451a03\"/><rect x=\"22\" y=\"14\" width=\"1\" height=\"15\" fill=\"#260e02\"/><rect x=\"23\" y=\"14\" width=\"1\" height=\"15\" fill=\"#1c0a00\"/><rect x=\"10\" y=\"16\" width=\"12\" height=\"9\" fill=\"#1e3a8a\"/><rect x=\"10\" y=\"16\" width=\"12\" height=\"1\" fill=\"#2563eb\"/><rect x=\"10\" y=\"24\" width=\"12\" height=\"1\" fill=\"#1e40af\"/><rect x=\"14\" y=\"18\" width=\"4\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"13\" y=\"19\" width=\"6\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"12\" y=\"20\" width=\"8\" height=\"1\" fill=\"#fde047\"/><rect x=\"15\" y=\"20\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"21\" width=\"6\" height=\"1\" fill=\"#d97706\"/><rect x=\"14\" y=\"22\" width=\"4\" height=\"1\" fill=\"#ef4444\"/><rect x=\"11\" y=\"23\" width=\"10\" height=\"1\" fill=\"#e2e8f0\"/><rect x=\"9\" y=\"29\" width=\"14\" height=\"1\" fill=\"#451a03\"/><rect x=\"10\" y=\"30\" width=\"12\" height=\"1\" fill=\"#260e02\"/>"
  },
  "mango_ringo": {
    "key": "mango_ringo",
    "name": "망고링고",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"12\" y=\"1\" width=\"8\" height=\"2\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"1\" width=\"6\" height=\"1\" fill=\"#facc15\"/><rect x=\"12\" y=\"3\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"13\" y=\"4\" width=\"1\" height=\"7\" fill=\"#14532d\"/><rect x=\"14\" y=\"4\" width=\"1\" height=\"7\" fill=\"#86efac\"/><rect x=\"15\" y=\"4\" width=\"2\" height=\"7\" fill=\"#22c55e\"/><rect x=\"17\" y=\"4\" width=\"1\" height=\"7\" fill=\"#16a34a\"/><rect x=\"18\" y=\"4\" width=\"1\" height=\"7\" fill=\"#14532d\"/><rect x=\"12\" y=\"11\" width=\"2\" height=\"1\" fill=\"#86efac\"/><rect x=\"14\" y=\"11\" width=\"4\" height=\"1\" fill=\"#22c55e\"/><rect x=\"18\" y=\"11\" width=\"2\" height=\"1\" fill=\"#14532d\"/><rect x=\"10\" y=\"12\" width=\"3\" height=\"1\" fill=\"#86efac\"/><rect x=\"13\" y=\"12\" width=\"6\" height=\"1\" fill=\"#22c55e\"/><rect x=\"19\" y=\"12\" width=\"3\" height=\"1\" fill=\"#14532d\"/><rect x=\"9\" y=\"13\" width=\"3\" height=\"1\" fill=\"#86efac\"/><rect x=\"12\" y=\"13\" width=\"8\" height=\"1\" fill=\"#22c55e\"/><rect x=\"20\" y=\"13\" width=\"3\" height=\"1\" fill=\"#14532d\"/><rect x=\"8\" y=\"14\" width=\"1\" height=\"15\" fill=\"#14532d\"/><rect x=\"9\" y=\"14\" width=\"1\" height=\"15\" fill=\"#4ade80\"/><rect x=\"10\" y=\"14\" width=\"2\" height=\"15\" fill=\"#86efac\"/><rect x=\"12\" y=\"14\" width=\"7\" height=\"15\" fill=\"#22c55e\"/><rect x=\"19\" y=\"14\" width=\"3\" height=\"15\" fill=\"#16a34a\"/><rect x=\"22\" y=\"14\" width=\"1\" height=\"15\" fill=\"#166534\"/><rect x=\"23\" y=\"14\" width=\"1\" height=\"15\" fill=\"#14532d\"/><rect x=\"10\" y=\"16\" width=\"12\" height=\"9\" fill=\"#fde047\"/><rect x=\"10\" y=\"16\" width=\"12\" height=\"1\" fill=\"#fef08a\"/><rect x=\"10\" y=\"24\" width=\"12\" height=\"1\" fill=\"#eab308\"/><circle cx=\"16\" cy=\"19.5\" r=\"2.2\" fill=\"#ea580c\"/><circle cx=\"15.5\" cy=\"19\" r=\"1.8\" fill=\"#f97316\"/><circle cx=\"15\" cy=\"18.5\" r=\"0.8\" fill=\"#fde047\"/><path d=\"M 16.5,18 Q 18,16.5 19,17 Q 18,18.5 16.5,18 Z\" fill=\"#16a34a\"/><rect x=\"12\" y=\"22\" width=\"8\" height=\"2\" fill=\"#ffffff\"/><rect x=\"13\" y=\"23\" width=\"6\" height=\"0.8\" fill=\"#ea580c\"/><rect x=\"9\" y=\"29\" width=\"14\" height=\"1\" fill=\"#166534\"/><rect x=\"10\" y=\"30\" width=\"12\" height=\"1\" fill=\"#14532d\"/>"
  },
  "maesilju": {
    "key": "maesilju",
    "name": "매화수",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"13\" y=\"2\" width=\"6\" height=\"2\" fill=\"#ca8a04\"/><rect x=\"14\" y=\"2\" width=\"4\" height=\"1\" fill=\"#fde047\"/><rect x=\"13\" y=\"4\" width=\"6\" height=\"1\" fill=\"#a16207\"/><rect x=\"13\" y=\"5\" width=\"1\" height=\"7\" fill=\"#cbd5e1\"/><rect x=\"14\" y=\"5\" width=\"1\" height=\"7\" fill=\"#fef08a\"/><rect x=\"15\" y=\"5\" width=\"2\" height=\"7\" fill=\"#facc15\"/><rect x=\"17\" y=\"5\" width=\"1\" height=\"7\" fill=\"#eab308\"/><rect x=\"18\" y=\"5\" width=\"1\" height=\"7\" fill=\"#94a3b8\"/><rect x=\"12\" y=\"12\" width=\"2\" height=\"1\" fill=\"#fef08a\"/><rect x=\"14\" y=\"12\" width=\"4\" height=\"1\" fill=\"#facc15\"/><rect x=\"18\" y=\"12\" width=\"2\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"10\" y=\"13\" width=\"3\" height=\"1\" fill=\"#fef08a\"/><rect x=\"13\" y=\"13\" width=\"6\" height=\"1\" fill=\"#facc15\"/><rect x=\"19\" y=\"13\" width=\"3\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"9\" y=\"14\" width=\"3\" height=\"1\" fill=\"#fef08a\"/><rect x=\"12\" y=\"14\" width=\"8\" height=\"1\" fill=\"#facc15\"/><rect x=\"20\" y=\"14\" width=\"3\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"9\" y=\"15\" width=\"1\" height=\"14\" fill=\"#cbd5e1\"/><rect x=\"10\" y=\"15\" width=\"1\" height=\"14\" fill=\"#fef08a\"/><rect x=\"11\" y=\"15\" width=\"2\" height=\"14\" fill=\"#fde047\"/><rect x=\"13\" y=\"15\" width=\"6\" height=\"14\" fill=\"#eab308\"/><rect x=\"19\" y=\"15\" width=\"2\" height=\"14\" fill=\"#ca8a04\"/><rect x=\"21\" y=\"15\" width=\"1\" height=\"14\" fill=\"#a16207\"/><rect x=\"22\" y=\"15\" width=\"1\" height=\"14\" fill=\"#64748b\"/><rect x=\"10\" y=\"17\" width=\"12\" height=\"9\" fill=\"#ffffff\" opacity=\"0.95\"/><rect x=\"10\" y=\"17\" width=\"12\" height=\"1\" fill=\"#fce7f3\"/><rect x=\"10\" y=\"25\" width=\"12\" height=\"1\" fill=\"#fbcfe8\"/><line x1=\"12\" y1=\"23\" x2=\"19\" y2=\"19\" stroke=\"#15803d\" stroke-width=\"1\"/><circle cx=\"13\" cy=\"22\" r=\"1\" fill=\"#22c55e\"/><circle cx=\"18\" cy=\"19\" r=\"1\" fill=\"#22c55e\"/><circle cx=\"16\" cy=\"19.5\" r=\"1.4\" fill=\"#fb7185\"/><circle cx=\"14.5\" cy=\"21\" r=\"1.4\" fill=\"#f472b6\"/><circle cx=\"17.5\" cy=\"21\" r=\"1.4\" fill=\"#f472b6\"/><circle cx=\"15\" cy=\"22.5\" r=\"1.4\" fill=\"#fb7185\"/><circle cx=\"17\" cy=\"22.5\" r=\"1.4\" fill=\"#fb7185\"/><circle cx=\"16\" cy=\"21\" r=\"1\" fill=\"#fde047\"/><rect x=\"10\" y=\"29\" width=\"12\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"11\" y=\"30\" width=\"10\" height=\"1\" fill=\"#94a3b8\"/>"
  },
  "bokbunjaju": {
    "key": "bokbunjaju",
    "name": "복분자주",
    "innerSvg": "<rect x=\"6\" y=\"1\" width=\"4\" height=\"1\" fill=\"#b91c1c\"/><rect x=\"7\" y=\"2\" width=\"1\" height=\"4\" fill=\"#a855f7\"/><rect x=\"8\" y=\"2\" width=\"2\" height=\"4\" fill=\"#581c87\"/><rect x=\"5\" y=\"6\" width=\"2\" height=\"1\" fill=\"#7e22ce\"/><rect x=\"7\" y=\"6\" width=\"4\" height=\"1\" fill=\"#3b0764\"/><rect x=\"4\" y=\"7\" width=\"1\" height=\"8\" fill=\"#2e1065\"/><rect x=\"5\" y=\"7\" width=\"1\" height=\"8\" fill=\"#9333ea\"/><rect x=\"6\" y=\"7\" width=\"4\" height=\"8\" fill=\"#3b0764\"/><rect x=\"10\" y=\"7\" width=\"1\" height=\"8\" fill=\"#1e1b4b\"/><rect x=\"5\" y=\"9\" width=\"5\" height=\"4\" fill=\"#fef08a\"/><rect x=\"6\" y=\"10\" width=\"3\" height=\"2\" fill=\"#dc2626\"/><rect x=\"7\" y=\"10\" width=\"1\" height=\"1\" fill=\"#7e22ce\"/><rect x=\"5\" y=\"15\" width=\"6\" height=\"1\" fill=\"#1e1b4b\"/>"
  },
  "makgeolli": {
    "key": "makgeolli",
    "name": "막걸리",
    "innerSvg": "<rect x=\"6\" y=\"1\" width=\"4\" height=\"1\" fill=\"#15803d\"/><rect x=\"7\" y=\"2\" width=\"2\" height=\"3\" fill=\"#f8fafc\"/><rect x=\"6\" y=\"2\" width=\"1\" height=\"3\" fill=\"#e2e8f0\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"2\" fill=\"#f1f5f9\"/><rect x=\"4\" y=\"7\" width=\"8\" height=\"8\" fill=\"#f8fafc\"/><rect x=\"4\" y=\"7\" width=\"1\" height=\"8\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"7\" width=\"1\" height=\"8\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"8\" width=\"6\" height=\"5\" fill=\"#15803d\"/><rect x=\"6\" y=\"9\" width=\"4\" height=\"3\" fill=\"#fef08a\"/><rect x=\"7\" y=\"10\" width=\"2\" height=\"1\" fill=\"#1e293b\"/><rect x=\"5\" y=\"15\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/>"
  },
  "ice": {
    "key": "ice",
    "name": "얼음",
    "viewBox": "0 0 32 32",
    "innerSvg": "<polygon points=\"16,3 28,9 16,15 4,9\" fill=\"#e0f2fe\"/><polygon points=\"16,4 26,9 16,14 6,9\" fill=\"#f0f9ff\"/><polygon points=\"16,5 24,9 16,13 8,9\" fill=\"#ffffff\"/><polygon points=\"4,9 16,15 16,28 4,22\" fill=\"#38bdf8\"/><polygon points=\"5,10 15,15 15,27 5,22\" fill=\"#0ea5e9\"/><polygon points=\"6,12 14,16 14,25 6,21\" fill=\"#0284c7\"/><line x1=\"7\" y1=\"13\" x2=\"13\" y2=\"23\" stroke=\"#e0f2fe\" stroke-width=\"1\"/><circle cx=\"8\" cy=\"18\" r=\"1\" fill=\"#ffffff\"/><circle cx=\"11\" cy=\"21\" r=\"0.75\" fill=\"#ffffff\"/><polygon points=\"16,15 28,9 28,22 16,28\" fill=\"#0369a1\"/><polygon points=\"17,15 27,10 27,21 17,26\" fill=\"#075985\"/><polygon points=\"18,17 25,12 25,19 18,24\" fill=\"#0c4a6e\"/><circle cx=\"22\" cy=\"16\" r=\"0.8\" fill=\"#bae6fd\"/><circle cx=\"20\" cy=\"21\" r=\"1.1\" fill=\"#38bdf8\"/><line x1=\"16\" y1=\"3\" x2=\"16\" y2=\"28\" stroke=\"#ffffff\" stroke-width=\"0.8\" opacity=\"0.85\"/><line x1=\"4\" y1=\"9\" x2=\"16\" y2=\"15\" stroke=\"#ffffff\" stroke-width=\"0.8\" opacity=\"0.9\"/><line x1=\"28\" y1=\"9\" x2=\"16\" y2=\"15\" stroke=\"#e0f2fe\" stroke-width=\"0.8\" opacity=\"0.7\"/><line x1=\"3\" y1=\"5\" x2=\"7\" y2=\"5\" stroke=\"#ffffff\" stroke-width=\"1\"/><line x1=\"5\" y1=\"3\" x2=\"5\" y2=\"7\" stroke=\"#ffffff\" stroke-width=\"1\"/><circle cx=\"5\" cy=\"5\" r=\"1.5\" fill=\"#ffffff\"/><circle cx=\"28\" cy=\"8\" r=\"1\" fill=\"#ffffff\"/>"
  },
  "water": {
    "key": "water",
    "name": "물",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"6\" y=\"2\" width=\"4\" height=\"2\" fill=\"#0ea5e9\"/><rect x=\"5\" y=\"4\" width=\"6\" height=\"3\" fill=\"#0284c7\"/><rect x=\"4\" y=\"7\" width=\"8\" height=\"4\" fill=\"#0369a1\"/><rect x=\"5\" y=\"11\" width=\"6\" height=\"3\" fill=\"#075985\"/><rect x=\"6\" y=\"14\" width=\"4\" height=\"1\" fill=\"#0c4a6e\"/><rect x=\"6\" y=\"4\" width=\"2\" height=\"4\" fill=\"#ffffff\"/><rect x=\"5\" y=\"6\" width=\"1\" height=\"2\" fill=\"#ffffff\"/><rect x=\"8\" y=\"10\" width=\"2\" height=\"2\" fill=\"#bae6fd\"/>"
  },
  "fire": {
    "key": "fire",
    "name": "불",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"2\" fill=\"#ef4444\"/><rect x=\"6\" y=\"3\" width=\"4\" height=\"2\" fill=\"#f97316\"/><rect x=\"4\" y=\"5\" width=\"7\" height=\"3\" fill=\"#ea580c\"/><rect x=\"9\" y=\"3\" width=\"2\" height=\"3\" fill=\"#f97316\"/><rect x=\"3\" y=\"8\" width=\"10\" height=\"4\" fill=\"#dc2626\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"3\" fill=\"#b91c1c\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"5\" fill=\"#fde047\"/><rect x=\"7\" y=\"7\" width=\"2\" height=\"4\" fill=\"#fef08a\"/><rect x=\"7\" y=\"8\" width=\"2\" height=\"2\" fill=\"#ffffff\"/>"
  },
  "air": {
    "key": "air",
    "name": "공기",
    "innerSvg": "<rect x=\"3\" y=\"4\" width=\"8\" height=\"1\" fill=\"#bae6fd\"/><rect x=\"11\" y=\"5\" width=\"2\" height=\"2\" fill=\"#7dd3fc\"/><rect x=\"9\" y=\"7\" width=\"2\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"5\" y=\"8\" width=\"7\" height=\"1\" fill=\"#e0f2fe\"/><rect x=\"12\" y=\"9\" width=\"2\" height=\"2\" fill=\"#bae6fd\"/><rect x=\"2\" y=\"11\" width=\"10\" height=\"1\" fill=\"#7dd3fc\"/><rect x=\"12\" y=\"12\" width=\"2\" height=\"2\" fill=\"#38bdf8\"/><rect x=\"10\" y=\"14\" width=\"2\" height=\"1\" fill=\"#0284c7\"/>"
  },
  "snow": {
    "key": "snow",
    "name": "눈",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"14\" fill=\"#38bdf8\"/><rect x=\"1\" y=\"7\" width=\"14\" height=\"2\" fill=\"#38bdf8\"/><rect x=\"4\" y=\"4\" width=\"2\" height=\"2\" fill=\"#7dd3fc\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"2\" fill=\"#7dd3fc\"/><rect x=\"4\" y=\"10\" width=\"2\" height=\"2\" fill=\"#7dd3fc\"/><rect x=\"10\" y=\"10\" width=\"2\" height=\"2\" fill=\"#7dd3fc\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"4\" fill=\"#ffffff\"/><rect x=\"7\" y=\"5\" width=\"2\" height=\"6\" fill=\"#ffffff\"/><rect x=\"5\" y=\"7\" width=\"6\" height=\"2\" fill=\"#ffffff\"/><rect x=\"7\" y=\"2\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"2\" y=\"7\" width=\"1\" height=\"2\" fill=\"#ffffff\"/><rect x=\"13\" y=\"7\" width=\"1\" height=\"2\" fill=\"#ffffff\"/><rect x=\"7\" y=\"13\" width=\"2\" height=\"1\" fill=\"#ffffff\"/>"
  },
  "rec_ringelju": {
    "key": "rec_ringelju",
    "name": "링겔주",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"11\" y=\"1\" width=\"10\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"10\" y=\"2\" width=\"12\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"10\" y=\"3\" width=\"1\" height=\"7\" fill=\"#cbd5e1\"/><rect x=\"11\" y=\"3\" width=\"2\" height=\"7\" fill=\"#fef08a\"/><rect x=\"13\" y=\"3\" width=\"5\" height=\"7\" fill=\"#eab308\"/><rect x=\"18\" y=\"3\" width=\"2\" height=\"7\" fill=\"#ca8a04\"/><rect x=\"20\" y=\"3\" width=\"1\" height=\"7\" fill=\"#64748b\"/><circle cx=\"15.5\" cy=\"6\" r=\"1.5\" fill=\"#f472b6\"/><circle cx=\"15.5\" cy=\"6\" r=\"0.6\" fill=\"#fde047\"/><rect x=\"11\" y=\"10\" width=\"10\" height=\"1\" fill=\"#eab308\"/><rect x=\"12\" y=\"11\" width=\"8\" height=\"1\" fill=\"#eab308\"/><rect x=\"13\" y=\"12\" width=\"6\" height=\"1\" fill=\"#ca8a04\"/><rect x=\"14\" y=\"13\" width=\"4\" height=\"2\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"14\" width=\"6\" height=\"1\" fill=\"#facc15\"/><rect x=\"13\" y=\"15\" width=\"6\" height=\"1\" fill=\"#84cc16\"/><rect x=\"13\" y=\"16\" width=\"6\" height=\"1\" fill=\"#22c55e\"/><rect x=\"14\" y=\"16\" width=\"4\" height=\"2\" fill=\"#22c55e\"/><rect x=\"13\" y=\"18\" width=\"6\" height=\"1\" fill=\"#22c55e\"/><rect x=\"11\" y=\"19\" width=\"10\" height=\"1\" fill=\"#16a34a\"/><rect x=\"10\" y=\"20\" width=\"12\" height=\"1\" fill=\"#15803d\"/><rect x=\"9\" y=\"21\" width=\"1\" height=\"8\" fill=\"#14532d\"/><rect x=\"10\" y=\"21\" width=\"2\" height=\"8\" fill=\"#4ade80\"/><rect x=\"12\" y=\"21\" width=\"6\" height=\"8\" fill=\"#22c55e\"/><rect x=\"18\" y=\"21\" width=\"3\" height=\"8\" fill=\"#16a34a\"/><rect x=\"21\" y=\"21\" width=\"1\" height=\"8\" fill=\"#14532d\"/><rect x=\"11\" y=\"23\" width=\"10\" height=\"5\" fill=\"#ffffff\"/><rect x=\"14\" y=\"24\" width=\"4\" height=\"1\" fill=\"#0284c7\"/><rect x=\"15\" y=\"25\" width=\"2\" height=\"1\" fill=\"#ef4444\"/><rect x=\"10\" y=\"29\" width=\"12\" height=\"1\" fill=\"#14532d\"/><rect x=\"11\" y=\"30\" width=\"10\" height=\"1\" fill=\"#052e16\"/><rect x=\"23\" y=\"10\" width=\"3\" height=\"6\" fill=\"#e2e8f0\" stroke=\"#94a3b8\" stroke-width=\"0.5\"/><rect x=\"24\" y=\"12\" width=\"1.5\" height=\"3\" fill=\"#facc15\"/><path d=\"M 24.5,16 Q 27,20 25,25 Q 23.5,28 21,29\" fill=\"none\" stroke=\"#f8fafc\" stroke-width=\"1.2\" stroke-linecap=\"round\"/><path d=\"M 24.5,16 Q 27,20 25,25 Q 23.5,28 21,29\" fill=\"none\" stroke=\"#38bdf8\" stroke-width=\"0.5\" opacity=\"0.6\"/><rect x=\"24\" y=\"21\" width=\"2.5\" height=\"2\" fill=\"#2563eb\" rx=\"0.5\"/>"
  },
  "rec_somaek": {
    "key": "rec_somaek",
    "name": "소맥",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"8\" height=\"2\" fill=\"#ffffff\"/><rect x=\"3\" y=\"4\" width=\"1\" height=\"2\" fill=\"#e2e8f0\"/><rect x=\"12\" y=\"4\" width=\"1\" height=\"2\" fill=\"#e2e8f0\"/><rect x=\"4\" y=\"6\" width=\"8\" height=\"8\" fill=\"#f59e0b\"/><rect x=\"4\" y=\"6\" width=\"1\" height=\"8\" fill=\"#fde047\"/><rect x=\"11\" y=\"6\" width=\"1\" height=\"8\" fill=\"#d97706\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#b45309\"/><rect x=\"6\" y=\"15\" width=\"4\" height=\"1\" fill=\"#e2e8f0\"/><rect x=\"5\" y=\"2\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"8\" y=\"1\" width=\"3\" height=\"3\" fill=\"#ffffff\"/><rect x=\"10\" y=\"3\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"6\" y=\"8\" width=\"3\" height=\"4\" fill=\"#86efac\"/><rect x=\"7\" y=\"9\" width=\"1\" height=\"2\" fill=\"#16a34a\"/>"
  },
  "rec_kkulju": {
    "key": "rec_kkulju",
    "name": "꿀주",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"8\" height=\"2\" fill=\"#ffffff\"/><rect x=\"4\" y=\"6\" width=\"8\" height=\"8\" fill=\"#f59e0b\"/><rect x=\"5\" y=\"7\" width=\"2\" height=\"4\" fill=\"#fbbf24\"/><rect x=\"4\" y=\"14\" width=\"8\" height=\"1\" fill=\"#d97706\"/><rect x=\"8\" y=\"0\" width=\"1\" height=\"5\" fill=\"#d97706\"/><rect x=\"7\" y=\"4\" width=\"3\" height=\"3\" fill=\"#f59e0b\"/><rect x=\"8\" y=\"7\" width=\"2\" height=\"3\" fill=\"#fde047\"/><rect x=\"7\" y=\"10\" width=\"4\" height=\"2\" fill=\"#f59e0b\"/><rect x=\"6\" y=\"15\" width=\"4\" height=\"1\" fill=\"#e2e8f0\"/>"
  },
  "rec_sotonic": {
    "key": "rec_sotonic",
    "name": "소토닉",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#e2e8f0\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"9\" fill=\"#e0f2fe\"/><rect x=\"6\" y=\"6\" width=\"3\" height=\"3\" fill=\"#bae6fd\"/><rect x=\"7\" y=\"7\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"7\" y=\"10\" width=\"3\" height=\"3\" fill=\"#7dd3fc\"/><rect x=\"5\" y=\"9\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"10\" y=\"7\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"8\" y=\"12\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"2\" y=\"2\" width=\"4\" height=\"4\" fill=\"#fde047\"/><rect x=\"3\" y=\"3\" width=\"2\" height=\"2\" fill=\"#fef08a\"/><rect x=\"3\" y=\"2\" width=\"1\" height=\"1\" fill=\"#84cc16\"/>"
  },
  "rec_gojingamlae": {
    "key": "rec_gojingamlae",
    "name": "고진감래주",
    "innerSvg": "<rect x=\"4\" y=\"3\" width=\"1\" height=\"12\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"3\" width=\"1\" height=\"12\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"5\" y=\"3\" width=\"6\" height=\"1\" fill=\"#ffffff\"/><rect x=\"5\" y=\"4\" width=\"6\" height=\"3\" fill=\"#f59e0b\"/><rect x=\"5\" y=\"7\" width=\"6\" height=\"3\" fill=\"#e0f2fe\"/><rect x=\"6\" y=\"8\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"5\" y=\"10\" width=\"6\" height=\"4\" fill=\"#451a03\"/><rect x=\"6\" y=\"11\" width=\"4\" height=\"2\" fill=\"#78350f\"/>"
  },
  "rec_milkisju": {
    "key": "rec_milkisju",
    "name": "밀키스주",
    "innerSvg": "<rect x=\"4\" y=\"3\" width=\"8\" height=\"12\" fill=\"#f8fafc\"/><rect x=\"4\" y=\"3\" width=\"1\" height=\"12\" fill=\"#cbd5e1\"/><rect x=\"11\" y=\"3\" width=\"1\" height=\"12\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"6\" y=\"5\" width=\"2\" height=\"2\" fill=\"#38bdf8\"/><rect x=\"9\" y=\"7\" width=\"2\" height=\"2\" fill=\"#7dd3fc\"/><rect x=\"5\" y=\"9\" width=\"2\" height=\"2\" fill=\"#38bdf8\"/><rect x=\"8\" y=\"11\" width=\"2\" height=\"2\" fill=\"#0ea5e9\"/><rect x=\"6\" y=\"13\" width=\"1\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"9\" y=\"0\" width=\"1\" height=\"5\" fill=\"#0284c7\"/>"
  },
  "rec_energizerju": {
    "key": "rec_energizerju",
    "name": "에너자이저주",
    "innerSvg": "<rect x=\"4\" y=\"3\" width=\"1\" height=\"12\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"3\" width=\"1\" height=\"12\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"5\" y=\"3\" width=\"6\" height=\"6\" fill=\"#00f0ff\"/><rect x=\"6\" y=\"4\" width=\"3\" height=\"2\" fill=\"#e0f2fe\"/><rect x=\"5\" y=\"9\" width=\"6\" height=\"5\" fill=\"#dc2626\"/><rect x=\"6\" y=\"10\" width=\"4\" height=\"3\" fill=\"#f97316\"/><rect x=\"7\" y=\"6\" width=\"2\" height=\"4\" fill=\"#fde047\"/>"
  },
  "rec_taegeukju": {
    "key": "rec_taegeukju",
    "name": "태극주",
    "innerSvg": "<rect x=\"4\" y=\"3\" width=\"1\" height=\"12\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"3\" width=\"1\" height=\"12\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"5\" y=\"3\" width=\"6\" height=\"5\" fill=\"#dc2626\"/><rect x=\"6\" y=\"4\" width=\"4\" height=\"2\" fill=\"#ef4444\"/><rect x=\"5\" y=\"8\" width=\"6\" height=\"6\" fill=\"#1d4ed8\"/><rect x=\"6\" y=\"9\" width=\"4\" height=\"3\" fill=\"#2563eb\"/><rect x=\"6\" y=\"7\" width=\"2\" height=\"2\" fill=\"#dc2626\"/><rect x=\"8\" y=\"7\" width=\"2\" height=\"2\" fill=\"#1d4ed8\"/>"
  },
  "rec_pocariju": {
    "key": "rec_pocariju",
    "name": "뽕가리스웨트",
    "innerSvg": "<rect x=\"4\" y=\"3\" width=\"1\" height=\"12\" fill=\"#93c5fd\"/><rect x=\"11\" y=\"3\" width=\"1\" height=\"12\" fill=\"#93c5fd\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#60a5fa\"/><rect x=\"5\" y=\"4\" width=\"6\" height=\"10\" fill=\"#f0f9ff\"/><rect x=\"5\" y=\"8\" width=\"6\" height=\"2\" fill=\"#0284c7\"/><rect x=\"6\" y=\"7\" width=\"2\" height=\"1\" fill=\"#0284c7\"/><rect x=\"8\" y=\"10\" width=\"2\" height=\"1\" fill=\"#0284c7\"/><rect x=\"6\" y=\"5\" width=\"3\" height=\"2\" fill=\"#bae6fd\"/>"
  },
  "rec_dutch_lager": {
    "key": "rec_dutch_lager",
    "name": "더치 라거",
    "innerSvg": "<rect x=\"4\" y=\"3\" width=\"1\" height=\"12\" fill=\"#cbd5e1\"/><rect x=\"11\" y=\"3\" width=\"1\" height=\"12\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"5\" y=\"3\" width=\"6\" height=\"1\" fill=\"#d97706\"/><rect x=\"5\" y=\"4\" width=\"6\" height=\"3\" fill=\"#451a03\"/><rect x=\"6\" y=\"5\" width=\"4\" height=\"1\" fill=\"#78350f\"/><rect x=\"5\" y=\"7\" width=\"6\" height=\"7\" fill=\"#f59e0b\"/><rect x=\"5\" y=\"7\" width=\"1\" height=\"7\" fill=\"#fde047\"/><rect x=\"10\" y=\"7\" width=\"1\" height=\"7\" fill=\"#d97706\"/>"
  },
  "rec_tesla": {
    "key": "rec_tesla",
    "name": "테스형라",
    "innerSvg": "<rect x=\"2\" y=\"2\" width=\"2\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"2\" y=\"3\" width=\"2\" height=\"2\" fill=\"#15803d\"/><rect x=\"1\" y=\"5\" width=\"4\" height=\"10\" fill=\"#16a34a\"/><rect x=\"2\" y=\"7\" width=\"2\" height=\"3\" fill=\"#1d4ed8\"/><rect x=\"10\" y=\"3\" width=\"2\" height=\"1\" fill=\"#15803d\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"2\" fill=\"#22c55e\"/><rect x=\"9\" y=\"6\" width=\"4\" height=\"9\" fill=\"#22c55e\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"3\" fill=\"#ffffff\"/><rect x=\"6\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fde047\"/><rect x=\"5\" y=\"4\" width=\"2\" height=\"3\" fill=\"#fde047\"/><rect x=\"6\" y=\"6\" width=\"3\" height=\"2\" fill=\"#fde047\"/><rect x=\"5\" y=\"8\" width=\"2\" height=\"3\" fill=\"#f59e0b\"/>"
  },
  "rec_tejina": {
    "key": "rec_tejina",
    "name": "테진아",
    "innerSvg": "<rect x=\"2\" y=\"3\" width=\"2\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"2\" y=\"4\" width=\"2\" height=\"2\" fill=\"#15803d\"/><rect x=\"1\" y=\"6\" width=\"4\" height=\"9\" fill=\"#16a34a\"/><rect x=\"2\" y=\"8\" width=\"2\" height=\"3\" fill=\"#1d4ed8\"/><rect x=\"10\" y=\"3\" width=\"2\" height=\"1\" fill=\"#0284c7\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"2\" fill=\"#38bdf8\"/><rect x=\"9\" y=\"6\" width=\"4\" height=\"9\" fill=\"#38bdf8\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"3\" fill=\"#ffffff\"/><rect x=\"10\" y=\"9\" width=\"2\" height=\"1\" fill=\"#ef4444\"/><rect x=\"6\" y=\"3\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"5\" y=\"5\" width=\"3\" height=\"2\" fill=\"#fde047\"/>"
  },
  "rec_casscheorom": {
    "key": "rec_casscheorom",
    "name": "카아스처럼",
    "innerSvg": "<rect x=\"2\" y=\"3\" width=\"2\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"1\" y=\"4\" width=\"4\" height=\"11\" fill=\"#1d4ed8\"/><rect x=\"2\" y=\"7\" width=\"2\" height=\"3\" fill=\"#ffffff\"/><rect x=\"10\" y=\"3\" width=\"2\" height=\"1\" fill=\"#15803d\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"2\" fill=\"#22c55e\"/><rect x=\"9\" y=\"6\" width=\"4\" height=\"9\" fill=\"#22c55e\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"3\" fill=\"#ffffff\"/><rect x=\"10\" y=\"9\" width=\"2\" height=\"1\" fill=\"#16a34a\"/><rect x=\"6\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fde047\"/><rect x=\"7\" y=\"3\" width=\"1\" height=\"4\" fill=\"#ffffff\"/><rect x=\"5\" y=\"4\" width=\"4\" height=\"1\" fill=\"#ffffff\"/>"
  },
  "rec_kelly_is_back": {
    "key": "rec_kelly_is_back",
    "name": "캘리포니아 이즈백",
    "innerSvg": "<rect x=\"2\" y=\"3\" width=\"2\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"2\" y=\"4\" width=\"2\" height=\"2\" fill=\"#b45309\"/><rect x=\"1\" y=\"6\" width=\"4\" height=\"9\" fill=\"#b45309\"/><rect x=\"2\" y=\"8\" width=\"2\" height=\"3\" fill=\"#fde047\"/><rect x=\"10\" y=\"3\" width=\"2\" height=\"1\" fill=\"#0284c7\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"2\" fill=\"#38bdf8\"/><rect x=\"9\" y=\"6\" width=\"4\" height=\"9\" fill=\"#38bdf8\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"3\" fill=\"#ffffff\"/><rect x=\"6\" y=\"4\" width=\"2\" height=\"2\" fill=\"#ffffff\"/>"
  },
  "rec_castella": {
    "key": "rec_castella",
    "name": "카스텔라",
    "innerSvg": "<rect x=\"1\" y=\"5\" width=\"4\" height=\"10\" fill=\"#1d4ed8\"/><rect x=\"9\" y=\"5\" width=\"4\" height=\"10\" fill=\"#16a34a\"/><rect x=\"3\" y=\"2\" width=\"8\" height=\"3\" fill=\"#ffffff\"/><rect x=\"4\" y=\"1\" width=\"6\" height=\"2\" fill=\"#ffffff\"/><rect x=\"6\" y=\"5\" width=\"2\" height=\"8\" fill=\"#f59e0b\"/><rect x=\"5\" y=\"6\" width=\"4\" height=\"2\" fill=\"#fde047\"/>"
  },
  "rec_maksa": {
    "key": "rec_maksa",
    "name": "막사",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"3\" y=\"11\" width=\"10\" height=\"1\" fill=\"#ca8a04\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#f8fafc\"/><rect x=\"4\" y=\"7\" width=\"2\" height=\"2\" fill=\"#22c55e\"/><rect x=\"7\" y=\"6\" width=\"2\" height=\"2\" fill=\"#86efac\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"2\" fill=\"#22c55e\"/><rect x=\"5\" y=\"9\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"8\" y=\"9\" width=\"2\" height=\"1\" fill=\"#ffffff\"/>"
  },
  "rec_honey_makgeolli": {
    "key": "rec_honey_makgeolli",
    "name": "꿀 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#f8fafc\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"4\" fill=\"#f59e0b\"/><rect x=\"7\" y=\"7\" width=\"2\" height=\"2\" fill=\"#fde047\"/><rect x=\"5\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fbbf24\"/><rect x=\"9\" y=\"8\" width=\"2\" height=\"2\" fill=\"#d97706\"/>"
  },
  "rec_strawberry_makgeolli": {
    "key": "rec_strawberry_makgeolli",
    "name": "딸기우유 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#fbcfe8\"/><rect x=\"4\" y=\"7\" width=\"8\" height=\"3\" fill=\"#f472b6\"/><rect x=\"7\" y=\"4\" width=\"3\" height=\"3\" fill=\"#ef4444\"/><rect x=\"8\" y=\"3\" width=\"1\" height=\"1\" fill=\"#15803d\"/><rect x=\"8\" y=\"5\" width=\"1\" height=\"1\" fill=\"#fde047\"/>"
  },
  "rec_banana_milk_makgeolli": {
    "key": "rec_banana_milk_makgeolli",
    "name": "바나나우유 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#fef08a\"/><rect x=\"5\" y=\"7\" width=\"6\" height=\"3\" fill=\"#fde047\"/><rect x=\"6\" y=\"4\" width=\"4\" height=\"4\" fill=\"#fde047\"/><rect x=\"7\" y=\"5\" width=\"2\" height=\"2\" fill=\"#fef9c3\"/><rect x=\"8\" y=\"6\" width=\"1\" height=\"1\" fill=\"#78350f\"/>"
  },
  "rec_yuzu_makgeolli": {
    "key": "rec_yuzu_makgeolli",
    "name": "유자 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#fef9c3\"/><rect x=\"6\" y=\"4\" width=\"4\" height=\"4\" fill=\"#facc15\"/><rect x=\"7\" y=\"5\" width=\"2\" height=\"2\" fill=\"#fef08a\"/><rect x=\"6\" y=\"3\" width=\"1\" height=\"1\" fill=\"#15803d\"/>"
  },
  "rec_maesil_makgeolli": {
    "key": "rec_maesil_makgeolli",
    "name": "매실 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#f1f5f9\"/><rect x=\"6\" y=\"5\" width=\"4\" height=\"4\" fill=\"#84cc16\"/><rect x=\"7\" y=\"4\" width=\"1\" height=\"1\" fill=\"#78350f\"/>"
  },
  "rec_sikhye_makgeolli": {
    "key": "rec_sikhye_makgeolli",
    "name": "식혜 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#fef3c7\"/><rect x=\"4\" y=\"7\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"7\" y=\"6\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"6\" y=\"9\" width=\"2\" height=\"1\" fill=\"#ffffff\"/>"
  },
  "rec_misutgaru_makgeolli": {
    "key": "rec_misutgaru_makgeolli",
    "name": "미숫가루 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#78350f\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#522409\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#522409\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#522409\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#d4a373\"/><rect x=\"5\" y=\"7\" width=\"6\" height=\"3\" fill=\"#c5925a\"/><rect x=\"7\" y=\"5\" width=\"2\" height=\"2\" fill=\"#99582a\"/>"
  },
  "rec_peach_makgeolli": {
    "key": "rec_peach_makgeolli",
    "name": "복숭아 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#fed7aa\"/><rect x=\"6\" y=\"4\" width=\"4\" height=\"4\" fill=\"#fb923c\"/><rect x=\"7\" y=\"3\" width=\"1\" height=\"1\" fill=\"#15803d\"/>"
  },
  "rec_pear_makgeolli": {
    "key": "rec_pear_makgeolli",
    "name": "배 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#fef08a\"/><rect x=\"6\" y=\"4\" width=\"4\" height=\"4\" fill=\"#fde047\"/><rect x=\"7\" y=\"4\" width=\"1\" height=\"1\" fill=\"#78350f\"/>"
  },
  "rec_pineapple_makgeolli": {
    "key": "rec_pineapple_makgeolli",
    "name": "파인애플 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#fef08a\"/><rect x=\"6\" y=\"4\" width=\"4\" height=\"4\" fill=\"#eab308\"/><rect x=\"7\" y=\"3\" width=\"2\" height=\"1\" fill=\"#15803d\"/>"
  },
  "rec_yakult_makgeolli": {
    "key": "rec_yakult_makgeolli",
    "name": "요구르트 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#ffedd5\"/><rect x=\"7\" y=\"3\" width=\"3\" height=\"3\" fill=\"#fed7aa\"/><rect x=\"7\" y=\"2\" width=\"3\" height=\"1\" fill=\"#ef4444\"/>"
  },
  "rec_honey_misutgaru_makgeolli": {
    "key": "rec_honey_misutgaru_makgeolli",
    "name": "꿀 미숫가루 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#78350f\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#522409\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#522409\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#522409\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#d4a373\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"3\" fill=\"#f59e0b\"/><rect x=\"7\" y=\"5\" width=\"2\" height=\"2\" fill=\"#fde047\"/>"
  },
  "rec_pomegranate_makgeolli": {
    "key": "rec_pomegranate_makgeolli",
    "name": "석류 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#f43f5e\"/><rect x=\"4\" y=\"7\" width=\"8\" height=\"3\" fill=\"#be123c\"/><rect x=\"7\" y=\"5\" width=\"2\" height=\"2\" fill=\"#ffe4e6\"/>"
  },
  "rec_bibibig_makgeolli": {
    "key": "rec_bibibig_makgeolli",
    "name": "단팥 막걸리",
    "innerSvg": "<rect x=\"2\" y=\"5\" width=\"12\" height=\"1\" fill=\"#eab308\"/><rect x=\"2\" y=\"6\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"6\" fill=\"#a16207\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#f8fafc\"/><rect x=\"6\" y=\"7\" width=\"5\" height=\"3\" fill=\"#881337\"/><rect x=\"7\" y=\"4\" width=\"3\" height=\"4\" fill=\"#881337\"/>"
  },
  "rec_icheon_makgeolli": {
    "key": "rec_icheon_makgeolli",
    "name": "이천 수라상 생막걸리",
    "innerSvg": "<rect x=\"6\" y=\"2\" width=\"4\" height=\"1\" fill=\"#0284c7\"/><rect x=\"5\" y=\"3\" width=\"6\" height=\"2\" fill=\"#f8fafc\"/><rect x=\"4\" y=\"5\" width=\"8\" height=\"8\" fill=\"#f8fafc\"/><rect x=\"4\" y=\"5\" width=\"1\" height=\"8\" fill=\"#cbd5e1\"/><rect x=\"11\" y=\"5\" width=\"1\" height=\"8\" fill=\"#94a3b8\"/><rect x=\"5\" y=\"13\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"7\" y=\"6\" width=\"2\" height=\"5\" fill=\"#f59e0b\"/><rect x=\"6\" y=\"7\" width=\"4\" height=\"1\" fill=\"#fde047\"/><rect x=\"6\" y=\"9\" width=\"4\" height=\"1\" fill=\"#fde047\"/>"
  },
  "rec_hallasan_sotonic": {
    "key": "rec_hallasan_sotonic",
    "name": "제주 화산 쏘토닉",
    "innerSvg": "<rect x=\"3\" y=\"3\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"3\" y=\"4\" width=\"2\" height=\"2\" fill=\"#e0f2fe\"/><rect x=\"2\" y=\"6\" width=\"4\" height=\"9\" fill=\"#e0f2fe\"/><rect x=\"3\" y=\"8\" width=\"2\" height=\"3\" fill=\"#0284c7\"/><rect x=\"8\" y=\"5\" width=\"6\" height=\"10\" fill=\"#38bdf8\"/><rect x=\"9\" y=\"6\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"8\" y=\"2\" width=\"3\" height=\"3\" fill=\"#fde047\"/><rect x=\"11\" y=\"12\" width=\"4\" height=\"3\" fill=\"#1e293b\"/>"
  },
  "melona": {
    "key": "melona",
    "name": "올때메론바",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"11\" fill=\"#86efac\"/><rect x=\"5\" y=\"1\" width=\"1\" height=\"11\" fill=\"#4ade80\"/><rect x=\"7\" y=\"1\" width=\"1\" height=\"11\" fill=\"#bbf7d0\"/><rect x=\"9\" y=\"1\" width=\"1\" height=\"11\" fill=\"#4ade80\"/><rect x=\"10\" y=\"1\" width=\"1\" height=\"11\" fill=\"#22c55e\"/><rect x=\"7\" y=\"12\" width=\"2\" height=\"4\" fill=\"#d97706\"/><rect x=\"7\" y=\"12\" width=\"1\" height=\"4\" fill=\"#fde68a\"/>"
  },
    "screwbar": {
    "key": "screwbar",
    "name": "배배꼬인바",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"15\" y=\"24\" width=\"2\" height=\"8\" fill=\"#b45309\"/><rect x=\"15\" y=\"24\" width=\"1.5\" height=\"8\" fill=\"#d97706\"/><rect x=\"15\" y=\"24\" width=\"0.8\" height=\"4\" fill=\"#fde68a\"/><rect x=\"12\" y=\"23\" width=\"8\" height=\"1\" fill=\"#700824\"/><rect x=\"15\" y=\"1\" width=\"2\" height=\"1\" fill=\"#e11d48\"/><rect x=\"15\" y=\"1\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"14\" y=\"2\" width=\"4\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"15\" y=\"2\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"14\" y=\"3\" width=\"4\" height=\"1\" fill=\"#e11d48\"/><rect x=\"16\" y=\"3\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"4\" width=\"6\" height=\"1\" fill=\"#e11d48\"/><rect x=\"14\" y=\"4\" width=\"2\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"16\" y=\"4\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"18\" y=\"4\" width=\"1\" height=\"1\" fill=\"#ffe4e6\"/><rect x=\"12\" y=\"5\" width=\"8\" height=\"1\" fill=\"#be123c\"/><rect x=\"13\" y=\"5\" width=\"2\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"15\" y=\"5\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"18\" y=\"5\" width=\"2\" height=\"1\" fill=\"#ffe4e6\"/><rect x=\"12\" y=\"6\" width=\"8\" height=\"1\" fill=\"#e11d48\"/><rect x=\"14\" y=\"6\" width=\"2\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"16\" y=\"6\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"19\" y=\"6\" width=\"1\" height=\"1\" fill=\"#fecdd3\"/><rect x=\"13\" y=\"7\" width=\"7\" height=\"1\" fill=\"#9f1239\"/><rect x=\"14\" y=\"7\" width=\"3\" height=\"1\" fill=\"#e11d48\"/><rect x=\"17\" y=\"7\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"8\" width=\"6\" height=\"1\" fill=\"#700824\"/><rect x=\"17\" y=\"8\" width=\"2\" height=\"1\" fill=\"#be123c\"/><rect x=\"11\" y=\"9\" width=\"8\" height=\"1\" fill=\"#be123c\"/><rect x=\"11\" y=\"9\" width=\"2\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"13\" y=\"9\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"16\" y=\"9\" width=\"2\" height=\"1\" fill=\"#ffe4e6\"/><rect x=\"11\" y=\"10\" width=\"9\" height=\"1\" fill=\"#e11d48\"/><rect x=\"12\" y=\"10\" width=\"2\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"14\" y=\"10\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"17\" y=\"10\" width=\"2\" height=\"1\" fill=\"#ffe4e6\"/><rect x=\"11\" y=\"11\" width=\"10\" height=\"1\" fill=\"#be123c\"/><rect x=\"13\" y=\"11\" width=\"2\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"15\" y=\"11\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"18\" y=\"11\" width=\"2\" height=\"1\" fill=\"#fecdd3\"/><rect x=\"12\" y=\"12\" width=\"9\" height=\"1\" fill=\"#9f1239\"/><rect x=\"14\" y=\"12\" width=\"3\" height=\"1\" fill=\"#e11d48\"/><rect x=\"17\" y=\"12\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"20\" y=\"12\" width=\"1\" height=\"1\" fill=\"#fecdd3\"/><rect x=\"12\" y=\"13\" width=\"8\" height=\"1\" fill=\"#700824\"/><rect x=\"18\" y=\"13\" width=\"2\" height=\"1\" fill=\"#be123c\"/><rect x=\"10\" y=\"14\" width=\"10\" height=\"1\" fill=\"#be123c\"/><rect x=\"10\" y=\"14\" width=\"2\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"12\" y=\"14\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"15\" y=\"14\" width=\"3\" height=\"1\" fill=\"#ffe4e6\"/><rect x=\"10\" y=\"15\" width=\"11\" height=\"1\" fill=\"#e11d48\"/><rect x=\"11\" y=\"15\" width=\"2\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"13\" y=\"15\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"16\" y=\"15\" width=\"3\" height=\"1\" fill=\"#ffe4e6\"/><rect x=\"10\" y=\"16\" width=\"12\" height=\"1\" fill=\"#be123c\"/><rect x=\"12\" y=\"16\" width=\"2\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"14\" y=\"16\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"17\" y=\"16\" width=\"3\" height=\"1\" fill=\"#fecdd3\"/><rect x=\"11\" y=\"17\" width=\"11\" height=\"1\" fill=\"#9f1239\"/><rect x=\"13\" y=\"17\" width=\"3\" height=\"1\" fill=\"#e11d48\"/><rect x=\"16\" y=\"17\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"19\" y=\"17\" width=\"2\" height=\"1\" fill=\"#fecdd3\"/><rect x=\"11\" y=\"18\" width=\"9\" height=\"1\" fill=\"#700824\"/><rect x=\"19\" y=\"18\" width=\"2\" height=\"1\" fill=\"#be123c\"/><rect x=\"10\" y=\"19\" width=\"11\" height=\"1\" fill=\"#be123c\"/><rect x=\"10\" y=\"19\" width=\"2\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"12\" y=\"19\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"15\" y=\"19\" width=\"3\" height=\"1\" fill=\"#ffe4e6\"/><rect x=\"10\" y=\"20\" width=\"12\" height=\"1\" fill=\"#e11d48\"/><rect x=\"11\" y=\"20\" width=\"2\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"13\" y=\"20\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"16\" y=\"20\" width=\"3\" height=\"1\" fill=\"#ffe4e6\"/><rect x=\"10\" y=\"21\" width=\"13\" height=\"1\" fill=\"#be123c\"/><rect x=\"12\" y=\"21\" width=\"2\" height=\"1\" fill=\"#f43f5e\"/><rect x=\"14\" y=\"21\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"17\" y=\"21\" width=\"3\" height=\"1\" fill=\"#fecdd3\"/><rect x=\"11\" y=\"22\" width=\"12\" height=\"1\" fill=\"#9f1239\"/><rect x=\"13\" y=\"22\" width=\"3\" height=\"1\" fill=\"#e11d48\"/><rect x=\"16\" y=\"22\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"19\" y=\"22\" width=\"3\" height=\"1\" fill=\"#fecdd3\"/><rect x=\"12\" y=\"23\" width=\"10\" height=\"1\" fill=\"#700824\"/>"
  },
    "tankboy": {
    "key": "tankboy",
    "name": "배즙보이",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"13\" y=\"2\" width=\"6\" height=\"1\" fill=\"#ca8a04\"/><rect x=\"14\" y=\"2\" width=\"4\" height=\"1\" fill=\"#fde047\"/><rect x=\"12\" y=\"3\" width=\"2\" height=\"2\" fill=\"#a16207\"/><rect x=\"13\" y=\"3\" width=\"1\" height=\"2\" fill=\"#fef08a\"/><rect x=\"18\" y=\"3\" width=\"2\" height=\"2\" fill=\"#a16207\"/><rect x=\"18\" y=\"3\" width=\"1\" height=\"2\" fill=\"#eab308\"/><rect x=\"13\" y=\"5\" width=\"6\" height=\"1\" fill=\"#ca8a04\"/><rect x=\"14\" y=\"5\" width=\"4\" height=\"1\" fill=\"#eab308\"/><rect x=\"14\" y=\"6\" width=\"4\" height=\"1\" fill=\"#a16207\"/><rect x=\"15\" y=\"6\" width=\"2\" height=\"1\" fill=\"#fde047\"/><rect x=\"15\" y=\"7\" width=\"2\" height=\"2\" fill=\"#a16207\"/><rect x=\"15\" y=\"7\" width=\"1\" height=\"2\" fill=\"#fde047\"/><rect x=\"13\" y=\"9\" width=\"6\" height=\"1\" fill=\"#a16207\"/><rect x=\"14\" y=\"9\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"16\" y=\"9\" width=\"2\" height=\"1\" fill=\"#fef08a\"/><rect x=\"11\" y=\"10\" width=\"10\" height=\"1\" fill=\"#a16207\"/><rect x=\"12\" y=\"10\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"15\" y=\"10\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"19\" y=\"10\" width=\"1\" height=\"1\" fill=\"#ca8a04\"/><rect x=\"10\" y=\"11\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"11\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"11\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"11\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"11\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"11\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"12\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"12\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"12\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"12\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"12\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"12\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"13\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"13\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"13\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"13\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"13\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"13\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"14\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"14\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"14\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"14\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"14\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"14\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"15\" width=\"1\" height=\"1\" fill=\"#854d0e\"/><rect x=\"11\" y=\"15\" width=\"2\" height=\"1\" fill=\"#fef08a\"/><rect x=\"13\" y=\"15\" width=\"4\" height=\"1\" fill=\"#fde047\"/><rect x=\"17\" y=\"15\" width=\"3\" height=\"1\" fill=\"#eab308\"/><rect x=\"20\" y=\"15\" width=\"1\" height=\"1\" fill=\"#ca8a04\"/><rect x=\"21\" y=\"15\" width=\"1\" height=\"1\" fill=\"#854d0e\"/><rect x=\"10\" y=\"16\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"16\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"16\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"16\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"16\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"16\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"17\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"17\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"17\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"17\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"17\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"17\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"18\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"18\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"18\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"18\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"18\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"18\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"19\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"19\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"19\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"19\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"19\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"19\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"20\" width=\"1\" height=\"1\" fill=\"#854d0e\"/><rect x=\"11\" y=\"20\" width=\"2\" height=\"1\" fill=\"#fef08a\"/><rect x=\"13\" y=\"20\" width=\"4\" height=\"1\" fill=\"#fde047\"/><rect x=\"17\" y=\"20\" width=\"3\" height=\"1\" fill=\"#eab308\"/><rect x=\"20\" y=\"20\" width=\"1\" height=\"1\" fill=\"#ca8a04\"/><rect x=\"21\" y=\"20\" width=\"1\" height=\"1\" fill=\"#854d0e\"/><rect x=\"10\" y=\"21\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"21\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"21\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"21\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"21\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"21\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"22\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"22\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"22\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"22\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"22\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"22\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"23\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"23\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"23\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"23\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"23\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"23\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"24\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"24\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"24\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"24\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"24\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"24\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"25\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"25\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"25\" width=\"4\" height=\"1\" fill=\"#fef08a\"/><rect x=\"17\" y=\"25\" width=\"3\" height=\"1\" fill=\"#fde047\"/><rect x=\"20\" y=\"25\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"21\" y=\"25\" width=\"1\" height=\"1\" fill=\"#a16207\"/><rect x=\"14\" y=\"12\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"16\" y=\"13\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"14\" y=\"17\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"17\" y=\"18\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"14\" y=\"22\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"16\" y=\"23\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"15\" y=\"13\" width=\"2\" height=\"1\" fill=\"#4d7c0f\"/><rect x=\"14\" y=\"14\" width=\"3\" height=\"1\" fill=\"#65a30d\"/><rect x=\"15\" y=\"14\" width=\"1\" height=\"1\" fill=\"#bef264\"/><rect x=\"10\" y=\"26\" width=\"12\" height=\"1\" fill=\"#854d0e\"/><rect x=\"11\" y=\"26\" width=\"10\" height=\"1\" fill=\"#ca8a04\"/><rect x=\"10\" y=\"27\" width=\"12\" height=\"1\" fill=\"#a16207\"/><rect x=\"11\" y=\"27\" width=\"2\" height=\"1\" fill=\"#fde047\"/><rect x=\"14\" y=\"27\" width=\"2\" height=\"1\" fill=\"#fde047\"/><rect x=\"17\" y=\"27\" width=\"2\" height=\"1\" fill=\"#fde047\"/><rect x=\"10\" y=\"28\" width=\"12\" height=\"1\" fill=\"#ca8a04\"/><rect x=\"11\" y=\"28\" width=\"10\" height=\"1\" fill=\"#a16207\"/><rect x=\"10\" y=\"29\" width=\"2\" height=\"1\" fill=\"#854d0e\"/><rect x=\"13\" y=\"29\" width=\"2\" height=\"1\" fill=\"#854d0e\"/><rect x=\"16\" y=\"29\" width=\"2\" height=\"1\" fill=\"#854d0e\"/><rect x=\"19\" y=\"29\" width=\"2\" height=\"1\" fill=\"#854d0e\"/>"
  },
  "jawsbar": {
    "key": "jawsbar",
    "name": "상어바",
    "innerSvg": "<rect x=\"6\" y=\"1\" width=\"4\" height=\"2\" fill=\"#64748b\"/><rect x=\"5\" y=\"3\" width=\"6\" height=\"7\" fill=\"#475569\"/><rect x=\"4\" y=\"4\" width=\"1\" height=\"5\" fill=\"#64748b\"/><rect x=\"7\" y=\"5\" width=\"4\" height=\"4\" fill=\"#dc2626\"/><rect x=\"8\" y=\"6\" width=\"3\" height=\"2\" fill=\"#ef4444\"/><rect x=\"6\" y=\"5\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"6\" y=\"7\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"7\" y=\"9\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"7\" y=\"10\" width=\"2\" height=\"5\" fill=\"#d97706\"/>"
  },
  "bibibig": {
    "key": "bibibig",
    "name": "단팥바",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"10\" fill=\"#881337\"/><rect x=\"5\" y=\"1\" width=\"1\" height=\"10\" fill=\"#be123c\"/><rect x=\"10\" y=\"1\" width=\"1\" height=\"10\" fill=\"#4c0519\"/><rect x=\"7\" y=\"3\" width=\"2\" height=\"2\" fill=\"#4c0519\"/><rect x=\"6\" y=\"6\" width=\"2\" height=\"2\" fill=\"#4c0519\"/><rect x=\"8\" y=\"8\" width=\"2\" height=\"2\" fill=\"#4c0519\"/><rect x=\"7\" y=\"11\" width=\"2\" height=\"5\" fill=\"#d97706\"/><rect x=\"7\" y=\"11\" width=\"1\" height=\"5\" fill=\"#fde68a\"/>"
  },
  "chocolate": {
    "key": "chocolate",
    "name": "초콜릿",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"5\" y=\"3\" width=\"22\" height=\"26\" rx=\"1.5\" fill=\"#1a0802\"/><rect x=\"6\" y=\"4\" width=\"20\" height=\"24\" fill=\"#381304\"/><rect x=\"15\" y=\"4\" width=\"2\" height=\"24\" fill=\"#180601\"/><rect x=\"6\" y=\"11\" width=\"20\" height=\"2\" fill=\"#180601\"/><rect x=\"6\" y=\"19\" width=\"20\" height=\"2\" fill=\"#180601\"/><rect x=\"7\" y=\"5\" width=\"8\" height=\"6\" fill=\"#2a0d03\"/><rect x=\"8\" y=\"6\" width=\"6\" height=\"1\" fill=\"#9c4a23\"/><rect x=\"8\" y=\"7\" width=\"1\" height=\"3\" fill=\"#823916\"/><rect x=\"9\" y=\"7\" width=\"4\" height=\"2\" fill=\"#69290c\"/><rect x=\"13\" y=\"7\" width=\"1\" height=\"3\" fill=\"#381203\"/><rect x=\"8\" y=\"9\" width=\"6\" height=\"1\" fill=\"#1f0701\"/><rect x=\"17\" y=\"5\" width=\"8\" height=\"6\" fill=\"#2a0d03\"/><rect x=\"18\" y=\"6\" width=\"6\" height=\"1\" fill=\"#9c4a23\"/><rect x=\"18\" y=\"7\" width=\"1\" height=\"3\" fill=\"#823916\"/><rect x=\"19\" y=\"7\" width=\"4\" height=\"2\" fill=\"#69290c\"/><rect x=\"23\" y=\"7\" width=\"1\" height=\"3\" fill=\"#381203\"/><rect x=\"18\" y=\"9\" width=\"6\" height=\"1\" fill=\"#1f0701\"/><rect x=\"7\" y=\"13\" width=\"8\" height=\"6\" fill=\"#2a0d03\"/><rect x=\"8\" y=\"14\" width=\"6\" height=\"1\" fill=\"#9c4a23\"/><rect x=\"8\" y=\"15\" width=\"1\" height=\"3\" fill=\"#823916\"/><rect x=\"9\" y=\"15\" width=\"4\" height=\"2\" fill=\"#69290c\"/><rect x=\"13\" y=\"15\" width=\"1\" height=\"3\" fill=\"#381203\"/><rect x=\"8\" y=\"17\" width=\"6\" height=\"1\" fill=\"#1f0701\"/><rect x=\"17\" y=\"13\" width=\"8\" height=\"6\" fill=\"#2a0d03\"/><rect x=\"18\" y=\"14\" width=\"6\" height=\"1\" fill=\"#9c4a23\"/><rect x=\"18\" y=\"15\" width=\"1\" height=\"3\" fill=\"#823916\"/><rect x=\"19\" y=\"15\" width=\"4\" height=\"2\" fill=\"#69290c\"/><rect x=\"23\" y=\"15\" width=\"1\" height=\"3\" fill=\"#381203\"/><rect x=\"18\" y=\"17\" width=\"6\" height=\"1\" fill=\"#1f0701\"/><rect x=\"7\" y=\"21\" width=\"8\" height=\"6\" fill=\"#2a0d03\"/><rect x=\"8\" y=\"22\" width=\"6\" height=\"1\" fill=\"#9c4a23\"/><rect x=\"8\" y=\"23\" width=\"1\" height=\"3\" fill=\"#823916\"/><rect x=\"9\" y=\"23\" width=\"4\" height=\"2\" fill=\"#69290c\"/><rect x=\"13\" y=\"23\" width=\"1\" height=\"3\" fill=\"#381203\"/><rect x=\"8\" y=\"25\" width=\"6\" height=\"1\" fill=\"#1f0701\"/><rect x=\"17\" y=\"21\" width=\"8\" height=\"6\" fill=\"#2a0d03\"/><rect x=\"18\" y=\"22\" width=\"6\" height=\"1\" fill=\"#9c4a23\"/><rect x=\"18\" y=\"23\" width=\"1\" height=\"3\" fill=\"#823916\"/><rect x=\"19\" y=\"23\" width=\"4\" height=\"2\" fill=\"#69290c\"/><rect x=\"23\" y=\"23\" width=\"1\" height=\"3\" fill=\"#381203\"/><rect x=\"18\" y=\"25\" width=\"6\" height=\"1\" fill=\"#1f0701\"/><rect x=\"9\" y=\"6\" width=\"2\" height=\"1\" fill=\"#c46f41\" opacity=\"0.8\"/><rect x=\"10\" y=\"7\" width=\"1\" height=\"1\" fill=\"#ffffff\" opacity=\"0.4\"/>"
  },
    "rec_screwbarju": {
    "key": "rec_screwbarju",
    "name": "배배꼬인주",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"7\" y=\"10\" width=\"1\" height=\"19\" fill=\"#94a3b8\"/><rect x=\"24\" y=\"10\" width=\"1\" height=\"19\" fill=\"#64748b\"/><rect x=\"8\" y=\"28\" width=\"16\" height=\"2\" fill=\"#475569\"/><rect x=\"9\" y=\"29\" width=\"14\" height=\"1\" fill=\"#334155\"/><rect x=\"8\" y=\"12\" width=\"16\" height=\"16\" fill=\"#fb7185\"/><rect x=\"8\" y=\"12\" width=\"16\" height=\"2\" fill=\"#f43f5e\"/><rect x=\"8\" y=\"18\" width=\"16\" height=\"10\" fill=\"#e11d48\"/><rect x=\"8\" y=\"12\" width=\"2\" height=\"16\" fill=\"rgba(255,255,255,0.4)\"/><rect x=\"11\" y=\"15\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"19\" y=\"17\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"21\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"20\" y=\"23\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"17\" y=\"2\" width=\"2\" height=\"4\" fill=\"#d97706\"/><rect x=\"17\" y=\"2\" width=\"1\" height=\"4\" fill=\"#fde68a\"/><rect x=\"15\" y=\"5\" width=\"5\" height=\"2\" fill=\"#be123c\"/><rect x=\"16\" y=\"5\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"14\" y=\"7\" width=\"6\" height=\"2\" fill=\"#e11d48\"/><rect x=\"17\" y=\"7\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"13\" y=\"9\" width=\"6\" height=\"2\" fill=\"#be123c\"/><rect x=\"15\" y=\"9\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"12\" y=\"11\" width=\"7\" height=\"2\" fill=\"#e11d48\"/><rect x=\"16\" y=\"11\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"11\" y=\"13\" width=\"7\" height=\"2\" fill=\"#9f1239\"/><rect x=\"14\" y=\"13\" width=\"2\" height=\"2\" fill=\"#ffffff\"/>"
  },
  "rec_melonaju": {
    "key": "rec_melonaju",
    "name": "올때메론주",
    "innerSvg": "<rect x=\"3\" y=\"5\" width=\"1\" height=\"10\" fill=\"#e2e8f0\"/><rect x=\"12\" y=\"5\" width=\"1\" height=\"10\" fill=\"#cbd5e1\"/><rect x=\"4\" y=\"14\" width=\"8\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"4\" y=\"6\" width=\"8\" height=\"8\" fill=\"#bbf7d0\"/><rect x=\"6\" y=\"2\" width=\"4\" height=\"7\" fill=\"#4ade80\"/><rect x=\"7\" y=\"0\" width=\"2\" height=\"3\" fill=\"#d97706\"/>"
  },
    "rec_tankboyju": {
    "key": "rec_tankboyju",
    "name": "배즙보이주",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"7\" y=\"10\" width=\"1\" height=\"19\" fill=\"#94a3b8\"/><rect x=\"24\" y=\"10\" width=\"1\" height=\"19\" fill=\"#64748b\"/><rect x=\"8\" y=\"28\" width=\"16\" height=\"2\" fill=\"#475569\"/><rect x=\"9\" y=\"29\" width=\"14\" height=\"1\" fill=\"#334155\"/><rect x=\"8\" y=\"12\" width=\"16\" height=\"16\" fill=\"#fef08a\"/><rect x=\"8\" y=\"12\" width=\"16\" height=\"3\" fill=\"#fef9c3\"/><rect x=\"8\" y=\"19\" width=\"16\" height=\"9\" fill=\"#fde047\"/><rect x=\"8\" y=\"12\" width=\"2\" height=\"16\" fill=\"rgba(255,255,255,0.4)\"/><rect x=\"11\" y=\"14\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"18\" y=\"16\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"13\" y=\"20\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"21\" y=\"22\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"16\" y=\"1\" width=\"4\" height=\"1\" fill=\"#ca8a04\"/><rect x=\"17\" y=\"1\" width=\"2\" height=\"1\" fill=\"#fde047\"/><rect x=\"15\" y=\"2\" width=\"2\" height=\"2\" fill=\"#a16207\"/><rect x=\"19\" y=\"2\" width=\"2\" height=\"2\" fill=\"#a16207\"/><rect x=\"16\" y=\"4\" width=\"4\" height=\"1\" fill=\"#ca8a04\"/><rect x=\"17\" y=\"5\" width=\"2\" height=\"2\" fill=\"#a16207\"/><rect x=\"17\" y=\"5\" width=\"1\" height=\"2\" fill=\"#fde047\"/><rect x=\"15\" y=\"7\" width=\"5\" height=\"2\" fill=\"#a16207\"/><rect x=\"16\" y=\"7\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"18\" y=\"7\" width=\"2\" height=\"2\" fill=\"#fef08a\"/><rect x=\"14\" y=\"9\" width=\"6\" height=\"3\" fill=\"#a16207\"/><rect x=\"15\" y=\"9\" width=\"2\" height=\"3\" fill=\"#ffffff\"/><rect x=\"17\" y=\"9\" width=\"2\" height=\"3\" fill=\"#fde047\"/><rect x=\"19\" y=\"9\" width=\"1\" height=\"3\" fill=\"#eab308\"/><rect x=\"13\" y=\"12\" width=\"7\" height=\"3\" fill=\"#a16207\"/><rect x=\"14\" y=\"12\" width=\"2\" height=\"3\" fill=\"#ffffff\"/><rect x=\"16\" y=\"12\" width=\"3\" height=\"3\" fill=\"#fde047\"/><rect x=\"19\" y=\"12\" width=\"1\" height=\"3\" fill=\"#ca8a04\"/>"
  },
  "rec_jawsbarju": {
    "key": "rec_jawsbarju",
    "name": "상어바주",
    "innerSvg": "<rect x=\"3\" y=\"5\" width=\"1\" height=\"10\" fill=\"#e2e8f0\"/><rect x=\"12\" y=\"5\" width=\"1\" height=\"10\" fill=\"#cbd5e1\"/><rect x=\"4\" y=\"14\" width=\"8\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"4\" y=\"6\" width=\"8\" height=\"4\" fill=\"#38bdf8\"/><rect x=\"4\" y=\"10\" width=\"8\" height=\"4\" fill=\"#dc2626\"/><rect x=\"7\" y=\"2\" width=\"3\" height=\"5\" fill=\"#475569\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"3\" fill=\"#d97706\"/>"
  },
  "rec_kahlua_milk": {
    "key": "rec_kahlua_milk",
    "name": "조선 깔루아 밀크",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"5\" y=\"4\" width=\"6\" height=\"5\" fill=\"#ffffff\"/><rect x=\"5\" y=\"9\" width=\"6\" height=\"5\" fill=\"#451a03\"/><rect x=\"9\" y=\"1\" width=\"1\" height=\"6\" fill=\"#dc2626\"/><rect x=\"9\" y=\"0\" width=\"2\" height=\"2\" fill=\"#ffffff\"/>"
  },
  "rec_choco_soju": {
    "key": "rec_choco_soju",
    "name": "초코방울주",
    "innerSvg": "<rect x=\"4\" y=\"6\" width=\"1\" height=\"9\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"6\" width=\"1\" height=\"9\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"5\" y=\"8\" width=\"6\" height=\"6\" fill=\"#522409\"/><rect x=\"5\" y=\"7\" width=\"6\" height=\"1\" fill=\"#ffffff\"/><rect x=\"7\" y=\"5\" width=\"3\" height=\"3\" fill=\"#451a03\"/><rect x=\"8\" y=\"5\" width=\"1\" height=\"1\" fill=\"#ffffff\"/>"
  },
  "rec_calamansiju": {
    "key": "rec_calamansiju",
    "name": "깔라만시주",
    "innerSvg": "<rect x=\"4\" y=\"6\" width=\"1\" height=\"9\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"6\" width=\"1\" height=\"9\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"5\" y=\"7\" width=\"6\" height=\"7\" fill=\"#a3e635\"/><rect x=\"6\" y=\"8\" width=\"2\" height=\"4\" fill=\"#fef08a\"/><rect x=\"3\" y=\"4\" width=\"3\" height=\"3\" fill=\"#65a30d\"/><rect x=\"4\" y=\"5\" width=\"1\" height=\"1\" fill=\"#fef08a\"/>"
  },
  "rec_hongchaju": {
    "key": "rec_hongchaju",
    "name": "홍차주",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"9\" fill=\"#b45309\"/><rect x=\"6\" y=\"6\" width=\"2\" height=\"3\" fill=\"#bae6fd\"/><rect x=\"8\" y=\"10\" width=\"2\" height=\"2\" fill=\"#bae6fd\"/><rect x=\"3\" y=\"3\" width=\"3\" height=\"3\" fill=\"#fde047\"/>"
  },
  "rec_kibum_tea": {
    "key": "rec_kibum_tea",
    "name": "만능열쇠 홍차주",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"9\" fill=\"#b45309\"/><rect x=\"6\" y=\"6\" width=\"2\" height=\"3\" fill=\"#bae6fd\"/><rect x=\"8\" y=\"10\" width=\"2\" height=\"2\" fill=\"#bae6fd\"/><rect x=\"3\" y=\"3\" width=\"3\" height=\"3\" fill=\"#fde047\"/>"
  },
  "rec_blue_lemon_soju": {
    "key": "rec_blue_lemon_soju",
    "name": "블루레몬주",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"9\" fill=\"#0284c7\"/><rect x=\"6\" y=\"6\" width=\"2\" height=\"3\" fill=\"#ffffff\"/><rect x=\"3\" y=\"3\" width=\"4\" height=\"4\" fill=\"#fde047\"/><rect x=\"4\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fef08a\"/>"
  },
  "rec_mango_ringo": {
    "key": "rec_mango_ringo",
    "name": "망고톡톡",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"12\" y=\"1\" width=\"8\" height=\"2\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"1\" width=\"6\" height=\"1\" fill=\"#facc15\"/><rect x=\"12\" y=\"3\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"13\" y=\"4\" width=\"1\" height=\"7\" fill=\"#14532d\"/><rect x=\"14\" y=\"4\" width=\"1\" height=\"7\" fill=\"#86efac\"/><rect x=\"15\" y=\"4\" width=\"2\" height=\"7\" fill=\"#22c55e\"/><rect x=\"17\" y=\"4\" width=\"1\" height=\"7\" fill=\"#16a34a\"/><rect x=\"18\" y=\"4\" width=\"1\" height=\"7\" fill=\"#14532d\"/><rect x=\"12\" y=\"11\" width=\"2\" height=\"1\" fill=\"#86efac\"/><rect x=\"14\" y=\"11\" width=\"4\" height=\"1\" fill=\"#22c55e\"/><rect x=\"18\" y=\"11\" width=\"2\" height=\"1\" fill=\"#14532d\"/><rect x=\"10\" y=\"12\" width=\"3\" height=\"1\" fill=\"#86efac\"/><rect x=\"13\" y=\"12\" width=\"6\" height=\"1\" fill=\"#22c55e\"/><rect x=\"19\" y=\"12\" width=\"3\" height=\"1\" fill=\"#14532d\"/><rect x=\"9\" y=\"13\" width=\"3\" height=\"1\" fill=\"#86efac\"/><rect x=\"12\" y=\"13\" width=\"8\" height=\"1\" fill=\"#22c55e\"/><rect x=\"20\" y=\"13\" width=\"3\" height=\"1\" fill=\"#14532d\"/><rect x=\"8\" y=\"14\" width=\"1\" height=\"15\" fill=\"#14532d\"/><rect x=\"9\" y=\"14\" width=\"1\" height=\"15\" fill=\"#4ade80\"/><rect x=\"10\" y=\"14\" width=\"2\" height=\"15\" fill=\"#86efac\"/><rect x=\"12\" y=\"14\" width=\"7\" height=\"15\" fill=\"#22c55e\"/><rect x=\"19\" y=\"14\" width=\"3\" height=\"15\" fill=\"#16a34a\"/><rect x=\"22\" y=\"14\" width=\"1\" height=\"15\" fill=\"#166534\"/><rect x=\"23\" y=\"14\" width=\"1\" height=\"15\" fill=\"#14532d\"/><rect x=\"10\" y=\"16\" width=\"12\" height=\"9\" fill=\"#fde047\"/><rect x=\"10\" y=\"16\" width=\"12\" height=\"1\" fill=\"#fef08a\"/><rect x=\"10\" y=\"24\" width=\"12\" height=\"1\" fill=\"#eab308\"/><circle cx=\"16\" cy=\"19.5\" r=\"2.2\" fill=\"#ea580c\"/><circle cx=\"15.5\" cy=\"19\" r=\"1.8\" fill=\"#f97316\"/><circle cx=\"15\" cy=\"18.5\" r=\"0.8\" fill=\"#fde047\"/><path d=\"M 16.5,18 Q 18,16.5 19,17 Q 18,18.5 16.5,18 Z\" fill=\"#16a34a\"/><rect x=\"12\" y=\"22\" width=\"8\" height=\"2\" fill=\"#ffffff\"/><rect x=\"13\" y=\"23\" width=\"6\" height=\"0.8\" fill=\"#ea580c\"/><rect x=\"9\" y=\"29\" width=\"14\" height=\"1\" fill=\"#166534\"/><rect x=\"10\" y=\"30\" width=\"12\" height=\"1\" fill=\"#14532d\"/>"
  },
  "rec_mango_ringoju": {
    "key": "rec_mango_ringoju",
    "name": "망고톡톡주",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"12\" y=\"1\" width=\"8\" height=\"2\" fill=\"#ca8a04\"/><rect x=\"13\" y=\"1\" width=\"6\" height=\"1\" fill=\"#facc15\"/><rect x=\"12\" y=\"3\" width=\"8\" height=\"1\" fill=\"#a16207\"/><rect x=\"13\" y=\"4\" width=\"1\" height=\"7\" fill=\"#14532d\"/><rect x=\"14\" y=\"4\" width=\"1\" height=\"7\" fill=\"#86efac\"/><rect x=\"15\" y=\"4\" width=\"2\" height=\"7\" fill=\"#22c55e\"/><rect x=\"17\" y=\"4\" width=\"1\" height=\"7\" fill=\"#16a34a\"/><rect x=\"18\" y=\"4\" width=\"1\" height=\"7\" fill=\"#14532d\"/><rect x=\"12\" y=\"11\" width=\"2\" height=\"1\" fill=\"#86efac\"/><rect x=\"14\" y=\"11\" width=\"4\" height=\"1\" fill=\"#22c55e\"/><rect x=\"18\" y=\"11\" width=\"2\" height=\"1\" fill=\"#14532d\"/><rect x=\"10\" y=\"12\" width=\"3\" height=\"1\" fill=\"#86efac\"/><rect x=\"13\" y=\"12\" width=\"6\" height=\"1\" fill=\"#22c55e\"/><rect x=\"19\" y=\"12\" width=\"3\" height=\"1\" fill=\"#14532d\"/><rect x=\"9\" y=\"13\" width=\"3\" height=\"1\" fill=\"#86efac\"/><rect x=\"12\" y=\"13\" width=\"8\" height=\"1\" fill=\"#22c55e\"/><rect x=\"20\" y=\"13\" width=\"3\" height=\"1\" fill=\"#14532d\"/><rect x=\"8\" y=\"14\" width=\"1\" height=\"15\" fill=\"#14532d\"/><rect x=\"9\" y=\"14\" width=\"1\" height=\"15\" fill=\"#4ade80\"/><rect x=\"10\" y=\"14\" width=\"2\" height=\"15\" fill=\"#86efac\"/><rect x=\"12\" y=\"14\" width=\"7\" height=\"15\" fill=\"#22c55e\"/><rect x=\"19\" y=\"14\" width=\"3\" height=\"15\" fill=\"#16a34a\"/><rect x=\"22\" y=\"14\" width=\"1\" height=\"15\" fill=\"#166534\"/><rect x=\"23\" y=\"14\" width=\"1\" height=\"15\" fill=\"#14532d\"/><rect x=\"10\" y=\"16\" width=\"12\" height=\"9\" fill=\"#fde047\"/><rect x=\"10\" y=\"16\" width=\"12\" height=\"1\" fill=\"#fef08a\"/><rect x=\"10\" y=\"24\" width=\"12\" height=\"1\" fill=\"#eab308\"/><circle cx=\"16\" cy=\"19.5\" r=\"2.2\" fill=\"#ea580c\"/><circle cx=\"15.5\" cy=\"19\" r=\"1.8\" fill=\"#f97316\"/><circle cx=\"15\" cy=\"18.5\" r=\"0.8\" fill=\"#fde047\"/><path d=\"M 16.5,18 Q 18,16.5 19,17 Q 18,18.5 16.5,18 Z\" fill=\"#16a34a\"/><rect x=\"12\" y=\"22\" width=\"8\" height=\"2\" fill=\"#ffffff\"/><rect x=\"13\" y=\"23\" width=\"6\" height=\"0.8\" fill=\"#ea580c\"/><rect x=\"9\" y=\"29\" width=\"14\" height=\"1\" fill=\"#166534\"/><rect x=\"10\" y=\"30\" width=\"12\" height=\"1\" fill=\"#14532d\"/>"
  },
  "rec_maeksato": {
    "key": "rec_maeksato",
    "name": "맥사토",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"8\" height=\"11\" fill=\"#ef4444\"/><rect x=\"4\" y=\"4\" width=\"8\" height=\"3\" fill=\"#f59e0b\"/><rect x=\"4\" y=\"3\" width=\"8\" height=\"1\" fill=\"#ffffff\"/><rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/>"
  },
  "rec_soju_cola": {
    "key": "rec_soju_cola",
    "name": "소콜",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"9\" fill=\"#451a03\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"2\" fill=\"#ffffff\"/><rect x=\"6\" y=\"8\" width=\"2\" height=\"2\" fill=\"#bae6fd\"/>"
  },
  "rec_energy_soju": {
    "key": "rec_energy_soju",
    "name": "에너지주",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"9\" fill=\"#eab308\"/><rect x=\"6\" y=\"6\" width=\"2\" height=\"3\" fill=\"#fde047\"/><rect x=\"7\" y=\"3\" width=\"2\" height=\"2\" fill=\"#38bdf8\"/>"
  },
  "rec_boksosa": {
    "key": "rec_boksosa",
    "name": "복소사",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"9\" fill=\"#701a75\"/><rect x=\"6\" y=\"6\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"1\" fill=\"#fbcfe8\"/>"
  },
  "rec_golden_somaek": {
    "key": "rec_golden_somaek",
    "name": "황금소맥",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/><rect x=\"4\" y=\"3\" width=\"8\" height=\"2\" fill=\"#ffffff\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"9\" fill=\"#f59e0b\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"4\" fill=\"#fde047\"/><rect x=\"7\" y=\"10\" width=\"2\" height=\"3\" fill=\"#86efac\"/>"
  },
  "rec_sowonju": {
    "key": "rec_sowonju",
    "name": "소원주",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"9\" fill=\"#0284c7\"/><rect x=\"6\" y=\"7\" width=\"4\" height=\"4\" fill=\"#fde047\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/>"
  },
  "rec_icetea": {
    "key": "rec_icetea",
    "name": "아이스티",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"9\" fill=\"#d97706\"/><rect x=\"6\" y=\"6\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"8\" y=\"9\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"9\" y=\"1\" width=\"1\" height=\"5\" fill=\"#fb923c\"/>"
  },
  "yakult": {
    "key": "yakult",
    "name": "요구르트",
    "innerSvg": "<rect x=\"6\" y=\"2\" width=\"4\" height=\"1\" fill=\"#ef4444\"/><rect x=\"6\" y=\"3\" width=\"4\" height=\"2\" fill=\"#fed7aa\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"1\" fill=\"#fdba74\"/><rect x=\"5\" y=\"6\" width=\"6\" height=\"7\" fill=\"#fed7aa\"/><rect x=\"5\" y=\"6\" width=\"1\" height=\"7\" fill=\"#ea580c\"/><rect x=\"6\" y=\"8\" width=\"4\" height=\"2\" fill=\"#ef4444\"/><rect x=\"5\" y=\"13\" width=\"6\" height=\"1\" fill=\"#f97316\"/>"
  },
  "banana_milk": {
    "key": "banana_milk",
    "name": "바나나우유",
    "innerSvg": "<rect x=\"6\" y=\"2\" width=\"4\" height=\"1\" fill=\"#16a34a\"/><rect x=\"8\" y=\"0\" width=\"1\" height=\"3\" fill=\"#0284c7\"/><rect x=\"6\" y=\"3\" width=\"4\" height=\"2\" fill=\"#fde047\"/><rect x=\"4\" y=\"5\" width=\"8\" height=\"2\" fill=\"#fde047\"/><rect x=\"3\" y=\"7\" width=\"10\" height=\"6\" fill=\"#fef08a\"/><rect x=\"3\" y=\"7\" width=\"1\" height=\"6\" fill=\"#eab308\"/><rect x=\"12\" y=\"7\" width=\"1\" height=\"6\" fill=\"#ca8a04\"/><rect x=\"4\" y=\"13\" width=\"8\" height=\"1\" fill=\"#fde047\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#ca8a04\"/>"
  },
  "milk": {
    "key": "milk",
    "name": "우유",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"1\" fill=\"#1d4ed8\"/><rect x=\"5\" y=\"2\" width=\"6\" height=\"2\" fill=\"#2563eb\"/><rect x=\"4\" y=\"4\" width=\"8\" height=\"11\" fill=\"#ffffff\"/><rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#cbd5e1\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#94a3b8\"/><rect x=\"4\" y=\"7\" width=\"8\" height=\"3\" fill=\"#1d4ed8\"/><rect x=\"6\" y=\"8\" width=\"4\" height=\"1\" fill=\"#ffffff\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/>"
  },
  "strawberry_milk": {
    "key": "strawberry_milk",
    "name": "딸기우유",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"1\" fill=\"#ec4899\"/><rect x=\"5\" y=\"2\" width=\"6\" height=\"2\" fill=\"#f472b6\"/><rect x=\"4\" y=\"4\" width=\"8\" height=\"11\" fill=\"#fbcfe8\"/><rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#f472b6\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#db2777\"/><rect x=\"6\" y=\"8\" width=\"4\" height=\"4\" fill=\"#ef4444\"/><rect x=\"7\" y=\"7\" width=\"2\" height=\"1\" fill=\"#15803d\"/>"
  },
  "choco_milk": {
    "key": "choco_milk",
    "name": "초코우유",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"1\" fill=\"#78350f\"/><rect x=\"5\" y=\"2\" width=\"6\" height=\"2\" fill=\"#522409\"/><rect x=\"4\" y=\"4\" width=\"8\" height=\"11\" fill=\"#78350f\"/><rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#522409\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"11\" fill=\"#3b1806\"/><rect x=\"6\" y=\"8\" width=\"4\" height=\"4\" fill=\"#3b1806\"/><rect x=\"7\" y=\"7\" width=\"2\" height=\"1\" fill=\"#ffffff\"/>"
  },
  "cider": {
    "key": "cider",
    "name": "사이다",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"4\" y=\"2\" width=\"8\" height=\"12\" fill=\"#16a34a\"/><rect x=\"4\" y=\"2\" width=\"1\" height=\"12\" fill=\"#15803d\"/><rect x=\"11\" y=\"2\" width=\"1\" height=\"12\" fill=\"#14532d\"/><rect x=\"7\" y=\"5\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"6\" y=\"9\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"9\" y=\"8\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"4\" y=\"7\" width=\"8\" height=\"1\" fill=\"#dc2626\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/>"
  },
  "cola": {
    "key": "cola",
    "name": "콜라",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"4\" y=\"2\" width=\"8\" height=\"12\" fill=\"#dc2626\"/><rect x=\"4\" y=\"2\" width=\"1\" height=\"12\" fill=\"#b91c1c\"/><rect x=\"11\" y=\"2\" width=\"1\" height=\"12\" fill=\"#991b1b\"/><rect x=\"5\" y=\"7\" width=\"6\" height=\"1\" fill=\"#ffffff\"/><rect x=\"6\" y=\"8\" width=\"4\" height=\"1\" fill=\"#ffffff\"/><rect x=\"7\" y=\"9\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/>"
  },
  "milksoda": {
    "key": "milksoda",
    "name": "밀크소다",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"4\" y=\"2\" width=\"8\" height=\"12\" fill=\"#38bdf8\"/><rect x=\"4\" y=\"2\" width=\"1\" height=\"12\" fill=\"#0284c7\"/><rect x=\"11\" y=\"2\" width=\"1\" height=\"12\" fill=\"#0369a1\"/><rect x=\"5\" y=\"6\" width=\"6\" height=\"4\" fill=\"#ffffff\"/><rect x=\"7\" y=\"7\" width=\"2\" height=\"2\" fill=\"#0284c7\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/>"
  },
  "energy_drink": {
    "key": "energy_drink",
    "name": "에너지드링크",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"2\" width=\"3\" height=\"12\" fill=\"#94a3b8\"/><rect x=\"8\" y=\"2\" width=\"3\" height=\"12\" fill=\"#1e3a8a\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"4\" fill=\"#ef4444\"/><rect x=\"7\" y=\"7\" width=\"2\" height=\"2\" fill=\"#fde047\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/>"
  },
  "ion_drink": {
    "key": "ion_drink",
    "name": "이온음료",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"4\" y=\"2\" width=\"8\" height=\"12\" fill=\"#0284c7\"/><rect x=\"4\" y=\"6\" width=\"8\" height=\"2\" fill=\"#ffffff\"/><rect x=\"6\" y=\"5\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"8\" y=\"8\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/>"
  },
  "sikhye": {
    "key": "sikhye",
    "name": "식혜",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"4\" y=\"2\" width=\"8\" height=\"12\" fill=\"#f59e0b\"/><rect x=\"4\" y=\"6\" width=\"8\" height=\"3\" fill=\"#dc2626\"/><rect x=\"6\" y=\"7\" width=\"4\" height=\"1\" fill=\"#ffffff\"/><rect x=\"6\" y=\"10\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"8\" y=\"11\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/>"
  },
  "pear_drink": {
    "key": "pear_drink",
    "name": "배음료",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"4\" y=\"2\" width=\"8\" height=\"12\" fill=\"#15803d\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"4\" fill=\"#fde047\"/><rect x=\"7\" y=\"5\" width=\"1\" height=\"1\" fill=\"#78350f\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/>"
  },
  "tomato_juice": {
    "key": "tomato_juice",
    "name": "토마토주스",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"4\" y=\"2\" width=\"8\" height=\"12\" fill=\"#dc2626\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"4\" fill=\"#b91c1c\"/><rect x=\"7\" y=\"5\" width=\"2\" height=\"1\" fill=\"#15803d\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/>"
  },
  "black_tea": {
    "key": "black_tea",
    "name": "홍차",
    "innerSvg": "<rect x=\"6\" y=\"1\" width=\"4\" height=\"1\" fill=\"#78350f\"/><rect x=\"7\" y=\"2\" width=\"2\" height=\"3\" fill=\"#d97706\"/><rect x=\"4\" y=\"5\" width=\"8\" height=\"10\" fill=\"#b45309\"/><rect x=\"6\" y=\"8\" width=\"4\" height=\"3\" fill=\"#15803d\"/><rect x=\"5\" y=\"15\" width=\"6\" height=\"1\" fill=\"#78350f\"/>"
  },
  "peach_drink": {
    "key": "peach_drink",
    "name": "복숭아음료",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"4\" y=\"2\" width=\"8\" height=\"12\" fill=\"#f472b6\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"4\" fill=\"#fb923c\"/><rect x=\"7\" y=\"5\" width=\"1\" height=\"1\" fill=\"#15803d\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/>"
  },
  "pineapple_juice": {
    "key": "pineapple_juice",
    "name": "파인애플주스",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"4\" y=\"2\" width=\"8\" height=\"12\" fill=\"#facc15\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"4\" fill=\"#ca8a04\"/><rect x=\"7\" y=\"5\" width=\"2\" height=\"1\" fill=\"#15803d\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#cbd5e1\"/>"
  },
  "blue_lemonade": {
    "key": "blue_lemonade",
    "name": "블루레몬에이드",
    "innerSvg": "<rect x=\"4\" y=\"4\" width=\"8\" height=\"11\" fill=\"#0284c7\"/><rect x=\"3\" y=\"4\" width=\"1\" height=\"11\" fill=\"#38bdf8\"/><rect x=\"12\" y=\"4\" width=\"1\" height=\"11\" fill=\"#0369a1\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"4\" fill=\"#fde047\"/><rect x=\"7\" y=\"7\" width=\"2\" height=\"2\" fill=\"#fef08a\"/><rect x=\"9\" y=\"1\" width=\"1\" height=\"5\" fill=\"#ffffff\"/>"
  },
  "pomegranate_juice": {
    "key": "pomegranate_juice",
    "name": "석류주스",
    "innerSvg": "<rect x=\"6\" y=\"1\" width=\"4\" height=\"1\" fill=\"#881337\"/><rect x=\"7\" y=\"2\" width=\"2\" height=\"3\" fill=\"#be123c\"/><rect x=\"4\" y=\"5\" width=\"8\" height=\"10\" fill=\"#9f1239\"/><rect x=\"6\" y=\"8\" width=\"4\" height=\"3\" fill=\"#f43f5e\"/><rect x=\"5\" y=\"15\" width=\"6\" height=\"1\" fill=\"#4c0519\"/>"
  },
  "tonic_water": {
    "key": "tonic_water",
    "name": "토닉워터",
    "innerSvg": "<rect x=\"6\" y=\"1\" width=\"4\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"7\" y=\"2\" width=\"2\" height=\"4\" fill=\"#e0f2fe\"/><rect x=\"5\" y=\"6\" width=\"6\" height=\"1\" fill=\"#bae6fd\"/><rect x=\"4\" y=\"7\" width=\"8\" height=\"8\" fill=\"#e0f2fe\"/><rect x=\"4\" y=\"7\" width=\"1\" height=\"8\" fill=\"#ffffff\"/><rect x=\"4\" y=\"9\" width=\"8\" height=\"3\" fill=\"#0284c7\"/><rect x=\"6\" y=\"10\" width=\"4\" height=\"1\" fill=\"#ffffff\"/><rect x=\"5\" y=\"15\" width=\"6\" height=\"1\" fill=\"#94a3b8\"/>"
  },
  "calamansi_pouch": {
    "key": "calamansi_pouch",
    "name": "깔라만시 원액",
    "innerSvg": "<rect x=\"7\" y=\"0\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"6\" y=\"2\" width=\"4\" height=\"1\" fill=\"#84cc16\"/><rect x=\"4\" y=\"3\" width=\"8\" height=\"11\" fill=\"#84cc16\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"6\" fill=\"#eab308\"/><rect x=\"6\" y=\"7\" width=\"4\" height=\"3\" fill=\"#fde047\"/><rect x=\"4\" y=\"14\" width=\"8\" height=\"1\" fill=\"#4d7c0f\"/>"
  },
  "iced_americano": {
    "key": "iced_americano",
    "name": "아이스 아메리카노",
    "innerSvg": "<rect x=\"5\" y=\"2\" width=\"6\" height=\"2\" fill=\"#e2e8f0\"/><rect x=\"4\" y=\"4\" width=\"8\" height=\"1\" fill=\"#cbd5e1\"/><rect x=\"9\" y=\"0\" width=\"1\" height=\"4\" fill=\"#15803d\"/><rect x=\"4\" y=\"5\" width=\"8\" height=\"10\" fill=\"#451a03\"/><rect x=\"4\" y=\"5\" width=\"1\" height=\"10\" fill=\"#e2e8f0\"/><rect x=\"11\" y=\"5\" width=\"1\" height=\"10\" fill=\"#cbd5e1\"/><rect x=\"5\" y=\"6\" width=\"3\" height=\"2\" fill=\"#ffffff\"/><rect x=\"8\" y=\"7\" width=\"3\" height=\"2\" fill=\"#bae6fd\"/><rect x=\"6\" y=\"10\" width=\"2\" height=\"2\" fill=\"#bae6fd\"/><rect x=\"5\" y=\"15\" width=\"6\" height=\"1\" fill=\"#260e02\"/>"
  },
  "hongcho": {
    "key": "hongcho",
    "name": "홍초",
    "innerSvg": "<rect x=\"6\" y=\"1\" width=\"4\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"7\" y=\"2\" width=\"2\" height=\"4\" fill=\"#be123c\"/><rect x=\"4\" y=\"6\" width=\"8\" height=\"9\" fill=\"#9f1239\"/><rect x=\"4\" y=\"6\" width=\"1\" height=\"9\" fill=\"#e11d48\"/><rect x=\"5\" y=\"9\" width=\"6\" height=\"3\" fill=\"#f43f5e\"/><rect x=\"5\" y=\"15\" width=\"6\" height=\"1\" fill=\"#4c0519\"/>"
  },
  "sparkling_water": {
    "key": "sparkling_water",
    "name": "탄산수",
    "innerSvg": "<rect x=\"6\" y=\"1\" width=\"4\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"7\" y=\"2\" width=\"2\" height=\"4\" fill=\"#bae6fd\"/><rect x=\"4\" y=\"6\" width=\"8\" height=\"9\" fill=\"#7dd3fc\"/><rect x=\"6\" y=\"8\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"9\" y=\"10\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"7\" y=\"12\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"5\" y=\"15\" width=\"6\" height=\"1\" fill=\"#0284c7\"/>"
  },
  "lemon": {
    "key": "lemon",
    "name": "레몬",
    "innerSvg": "<rect x=\"7\" y=\"2\" width=\"2\" height=\"1\" fill=\"#15803d\"/><rect x=\"8\" y=\"1\" width=\"2\" height=\"1\" fill=\"#16a34a\"/><rect x=\"5\" y=\"4\" width=\"6\" height=\"8\" fill=\"#fde047\"/><rect x=\"4\" y=\"5\" width=\"8\" height=\"6\" fill=\"#facc15\"/><rect x=\"3\" y=\"7\" width=\"1\" height=\"2\" fill=\"#eab308\"/><rect x=\"12\" y=\"7\" width=\"1\" height=\"2\" fill=\"#eab308\"/><rect x=\"6\" y=\"5\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"6\" y=\"12\" width=\"4\" height=\"1\" fill=\"#ca8a04\"/>"
  },
  "melon": {
    "key": "melon",
    "name": "멜론",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"2\" fill=\"#78350f\"/><rect x=\"6\" y=\"1\" width=\"4\" height=\"1\" fill=\"#15803d\"/><rect x=\"3\" y=\"4\" width=\"10\" height=\"9\" fill=\"#4ade80\"/><rect x=\"4\" y=\"5\" width=\"8\" height=\"1\" fill=\"#fef08a\"/><rect x=\"4\" y=\"8\" width=\"8\" height=\"1\" fill=\"#fef08a\"/><rect x=\"4\" y=\"11\" width=\"8\" height=\"1\" fill=\"#fef08a\"/><rect x=\"6\" y=\"4\" width=\"1\" height=\"9\" fill=\"#fef08a\"/><rect x=\"9\" y=\"4\" width=\"1\" height=\"9\" fill=\"#fef08a\"/><rect x=\"4\" y=\"13\" width=\"8\" height=\"1\" fill=\"#16a34a\"/>"
  },
  "mango": {
    "key": "mango",
    "name": "망고",
    "innerSvg": "<rect x=\"6\" y=\"1\" width=\"2\" height=\"2\" fill=\"#78350f\"/><rect x=\"7\" y=\"1\" width=\"3\" height=\"1\" fill=\"#15803d\"/><rect x=\"4\" y=\"3\" width=\"7\" height=\"10\" fill=\"#f59e0b\"/><rect x=\"3\" y=\"5\" width=\"8\" height=\"7\" fill=\"#facc15\"/><rect x=\"3\" y=\"4\" width=\"3\" height=\"4\" fill=\"#ef4444\"/><rect x=\"5\" y=\"13\" width=\"6\" height=\"1\" fill=\"#ea580c\"/>"
  },
  "maesil": {
    "key": "maesil",
    "name": "매실",
    "innerSvg": "<rect x=\"6\" y=\"2\" width=\"2\" height=\"2\" fill=\"#78350f\"/><rect x=\"7\" y=\"2\" width=\"3\" height=\"1\" fill=\"#15803d\"/><rect x=\"4\" y=\"4\" width=\"8\" height=\"8\" fill=\"#84cc16\"/><rect x=\"3\" y=\"6\" width=\"10\" height=\"5\" fill=\"#65a30d\"/><rect x=\"5\" y=\"5\" width=\"2\" height=\"2\" fill=\"#bef264\"/><rect x=\"5\" y=\"12\" width=\"6\" height=\"1\" fill=\"#4d7c0f\"/>"
  },
  "tomato": {
    "key": "tomato",
    "name": "토마토",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"2\" fill=\"#15803d\"/><rect x=\"5\" y=\"3\" width=\"6\" height=\"1\" fill=\"#16a34a\"/><rect x=\"4\" y=\"2\" width=\"2\" height=\"2\" fill=\"#15803d\"/><rect x=\"10\" y=\"2\" width=\"2\" height=\"2\" fill=\"#15803d\"/><rect x=\"3\" y=\"4\" width=\"10\" height=\"9\" fill=\"#ef4444\"/><rect x=\"5\" y=\"5\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"4\" y=\"13\" width=\"8\" height=\"1\" fill=\"#b91c1c\"/>"
  },
  "apple": {
    "key": "apple",
    "name": "사과",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"2\" fill=\"#78350f\"/><rect x=\"8\" y=\"1\" width=\"3\" height=\"1\" fill=\"#15803d\"/><rect x=\"3\" y=\"4\" width=\"10\" height=\"9\" fill=\"#ef4444\"/><rect x=\"5\" y=\"5\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"6\" y=\"3\" width=\"4\" height=\"1\" fill=\"#dc2626\"/><rect x=\"4\" y=\"13\" width=\"8\" height=\"1\" fill=\"#b91c1c\"/>"
  },
  "strawberry": {
    "key": "strawberry",
    "name": "딸기",
    "innerSvg": "<rect x=\"6\" y=\"1\" width=\"4\" height=\"2\" fill=\"#16a34a\"/><rect x=\"4\" y=\"2\" width=\"8\" height=\"1\" fill=\"#15803d\"/><rect x=\"4\" y=\"3\" width=\"8\" height=\"6\" fill=\"#ef4444\"/><rect x=\"5\" y=\"9\" width=\"6\" height=\"3\" fill=\"#dc2626\"/><rect x=\"6\" y=\"12\" width=\"4\" height=\"2\" fill=\"#b91c1c\"/><rect x=\"7\" y=\"14\" width=\"2\" height=\"1\" fill=\"#991b1b\"/><rect x=\"6\" y=\"5\" width=\"1\" height=\"1\" fill=\"#fde047\"/><rect x=\"9\" y=\"6\" width=\"1\" height=\"1\" fill=\"#fde047\"/><rect x=\"7\" y=\"8\" width=\"1\" height=\"1\" fill=\"#fde047\"/><rect x=\"8\" y=\"10\" width=\"1\" height=\"1\" fill=\"#fde047\"/>"
  },
  "cacao": {
    "key": "cacao",
    "name": "카카오",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"2\" fill=\"#78350f\"/><rect x=\"4\" y=\"3\" width=\"8\" height=\"10\" fill=\"#92400e\"/><rect x=\"3\" y=\"5\" width=\"10\" height=\"6\" fill=\"#78350f\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"5\" fill=\"#ffffff\"/><rect x=\"7\" y=\"7\" width=\"2\" height=\"3\" fill=\"#451a03\"/>"
  },
  "pear": {
    "key": "pear",
    "name": "배",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"2\" fill=\"#78350f\"/><rect x=\"8\" y=\"1\" width=\"2\" height=\"1\" fill=\"#15803d\"/><rect x=\"4\" y=\"3\" width=\"8\" height=\"10\" fill=\"#fde047\"/><rect x=\"3\" y=\"5\" width=\"10\" height=\"7\" fill=\"#facc15\"/><rect x=\"5\" y=\"5\" width=\"2\" height=\"2\" fill=\"#ffffff\"/><rect x=\"4\" y=\"13\" width=\"8\" height=\"1\" fill=\"#ca8a04\"/>"
  },
  "banana": {
    "key": "banana",
    "name": "바나나",
    "innerSvg": "<rect x=\"6\" y=\"1\" width=\"3\" height=\"2\" fill=\"#15803d\"/><rect x=\"7\" y=\"3\" width=\"4\" height=\"3\" fill=\"#fde047\"/><rect x=\"8\" y=\"6\" width=\"4\" height=\"4\" fill=\"#fde047\"/><rect x=\"7\" y=\"10\" width=\"4\" height=\"3\" fill=\"#facc15\"/><rect x=\"5\" y=\"12\" width=\"4\" height=\"2\" fill=\"#eab308\"/><rect x=\"4\" y=\"13\" width=\"2\" height=\"2\" fill=\"#78350f\"/>"
  },
  "yuzu": {
    "key": "yuzu",
    "name": "유자",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"2\" fill=\"#15803d\"/><rect x=\"8\" y=\"1\" width=\"3\" height=\"1\" fill=\"#16a34a\"/><rect x=\"4\" y=\"3\" width=\"8\" height=\"9\" fill=\"#fde047\"/><rect x=\"3\" y=\"5\" width=\"10\" height=\"6\" fill=\"#facc15\"/><rect x=\"5\" y=\"5\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"9\" y=\"7\" width=\"1\" height=\"1\" fill=\"#eab308\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#ca8a04\"/>"
  },
  "calamansi": {
    "key": "calamansi",
    "name": "깔라만시",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"2\" fill=\"#4d7c0f\"/><rect x=\"4\" y=\"3\" width=\"8\" height=\"9\" fill=\"#65a30d\"/><rect x=\"3\" y=\"5\" width=\"10\" height=\"6\" fill=\"#84cc16\"/><rect x=\"5\" y=\"5\" width=\"6\" height=\"6\" fill=\"#fef08a\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"4\" fill=\"#eab308\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#4d7c0f\"/>"
  },
  "bokbunja": {
    "key": "bokbunja",
    "name": "복분자",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"2\" fill=\"#15803d\"/><rect x=\"5\" y=\"3\" width=\"6\" height=\"2\" fill=\"#16a34a\"/><rect x=\"5\" y=\"5\" width=\"3\" height=\"3\" fill=\"#581c87\"/><rect x=\"8\" y=\"5\" width=\"3\" height=\"3\" fill=\"#3b0764\"/><rect x=\"4\" y=\"8\" width=\"3\" height=\"3\" fill=\"#3b0764\"/><rect x=\"7\" y=\"8\" width=\"3\" height=\"3\" fill=\"#7e22ce\"/><rect x=\"9\" y=\"8\" width=\"3\" height=\"3\" fill=\"#581c87\"/><rect x=\"6\" y=\"11\" width=\"4\" height=\"3\" fill=\"#3b0764\"/>"
  },
  "pomegranate": {
    "key": "pomegranate",
    "name": "석류",
    "innerSvg": "<rect x=\"6\" y=\"1\" width=\"1\" height=\"2\" fill=\"#be123c\"/><rect x=\"8\" y=\"1\" width=\"1\" height=\"2\" fill=\"#be123c\"/><rect x=\"5\" y=\"3\" width=\"6\" height=\"9\" fill=\"#e11d48\"/><rect x=\"4\" y=\"5\" width=\"8\" height=\"7\" fill=\"#be123c\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"5\" fill=\"#881337\"/><rect x=\"7\" y=\"7\" width=\"2\" height=\"2\" fill=\"#fda4af\"/><rect x=\"5\" y=\"12\" width=\"6\" height=\"1\" fill=\"#881337\"/>"
  },
  "orange": {
    "key": "orange",
    "name": "오렌지",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"2\" fill=\"#15803d\"/><rect x=\"8\" y=\"1\" width=\"3\" height=\"1\" fill=\"#16a34a\"/><rect x=\"4\" y=\"3\" width=\"8\" height=\"9\" fill=\"#f97316\"/><rect x=\"3\" y=\"5\" width=\"10\" height=\"6\" fill=\"#ea580c\"/><rect x=\"5\" y=\"5\" width=\"2\" height=\"2\" fill=\"#fed7aa\"/><rect x=\"4\" y=\"12\" width=\"8\" height=\"1\" fill=\"#c2410c\"/>"
  },
  "barley": {
    "key": "barley",
    "name": "맥(보리)",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"14\" fill=\"#d97706\"/><rect x=\"5\" y=\"3\" width=\"2\" height=\"2\" fill=\"#fde047\"/><rect x=\"9\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fde047\"/><rect x=\"5\" y=\"6\" width=\"2\" height=\"2\" fill=\"#f59e0b\"/><rect x=\"9\" y=\"7\" width=\"2\" height=\"2\" fill=\"#f59e0b\"/><rect x=\"5\" y=\"9\" width=\"2\" height=\"2\" fill=\"#fde047\"/><rect x=\"9\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fde047\"/>"
  },
  "rice": {
    "key": "rice",
    "name": "쌀",
    "innerSvg": "<rect x=\"6\" y=\"3\" width=\"4\" height=\"2\" fill=\"#ffffff\"/><rect x=\"4\" y=\"5\" width=\"8\" height=\"3\" fill=\"#ffffff\"/><rect x=\"3\" y=\"7\" width=\"10\" height=\"2\" fill=\"#f8fafc\"/><rect x=\"2\" y=\"8\" width=\"12\" height=\"1\" fill=\"#0284c7\"/><rect x=\"3\" y=\"9\" width=\"10\" height=\"4\" fill=\"#e0f2fe\"/><rect x=\"4\" y=\"13\" width=\"8\" height=\"1\" fill=\"#bae6fd\"/><rect x=\"6\" y=\"14\" width=\"4\" height=\"1\" fill=\"#0284c7\"/>"
  },
  "misutgaru": {
    "key": "misutgaru",
    "name": "미숫가루",
    "innerSvg": "<rect x=\"5\" y=\"4\" width=\"6\" height=\"3\" fill=\"#d4a373\"/><rect x=\"6\" y=\"3\" width=\"4\" height=\"2\" fill=\"#c5925a\"/><rect x=\"2\" y=\"7\" width=\"12\" height=\"1\" fill=\"#78350f\"/><rect x=\"3\" y=\"8\" width=\"10\" height=\"5\" fill=\"#522409\"/><rect x=\"4\" y=\"13\" width=\"8\" height=\"1\" fill=\"#3b1806\"/><rect x=\"6\" y=\"14\" width=\"4\" height=\"1\" fill=\"#3b1806\"/>"
  },
  "coffee_beans": {
    "key": "coffee_beans",
    "name": "커피콩",
    "innerSvg": "<rect x=\"2\" y=\"4\" width=\"6\" height=\"8\" fill=\"#78350f\"/><rect x=\"3\" y=\"3\" width=\"4\" height=\"10\" fill=\"#451a03\"/><rect x=\"5\" y=\"4\" width=\"1\" height=\"8\" fill=\"#260e02\"/><rect x=\"3\" y=\"5\" width=\"1\" height=\"4\" fill=\"#9a3412\"/><rect x=\"8\" y=\"4\" width=\"6\" height=\"8\" fill=\"#78350f\"/><rect x=\"9\" y=\"3\" width=\"4\" height=\"10\" fill=\"#451a03\"/><rect x=\"10\" y=\"4\" width=\"1\" height=\"8\" fill=\"#260e02\"/><rect x=\"12\" y=\"5\" width=\"1\" height=\"4\" fill=\"#9a3412\"/>"
  },
  "sugar": {
    "key": "sugar",
    "name": "설탕",
    "innerSvg": "<rect x=\"3\" y=\"6\" width=\"5\" height=\"5\" fill=\"#ffffff\"/><rect x=\"3\" y=\"6\" width=\"5\" height=\"1\" fill=\"#e0f2fe\"/><rect x=\"3\" y=\"6\" width=\"1\" height=\"5\" fill=\"#cbd5e1\"/><rect x=\"7\" y=\"6\" width=\"1\" height=\"5\" fill=\"#94a3b8\"/><rect x=\"3\" y=\"11\" width=\"5\" height=\"1\" fill=\"#94a3b8\"/><rect x=\"7\" y=\"3\" width=\"5\" height=\"5\" fill=\"#ffffff\"/><rect x=\"7\" y=\"3\" width=\"5\" height=\"1\" fill=\"#e0f2fe\"/><rect x=\"7\" y=\"3\" width=\"1\" height=\"5\" fill=\"#cbd5e1\"/><rect x=\"11\" y=\"3\" width=\"1\" height=\"5\" fill=\"#94a3b8\"/><rect x=\"7\" y=\"8\" width=\"5\" height=\"1\" fill=\"#94a3b8\"/>"
  },
  "nuruk": {
    "key": "nuruk",
    "name": "누룩",
    "innerSvg": "<rect x=\"3\" y=\"4\" width=\"10\" height=\"8\" fill=\"#d4a373\"/><rect x=\"4\" y=\"3\" width=\"8\" height=\"10\" fill=\"#c5925a\"/><rect x=\"3\" y=\"4\" width=\"10\" height=\"1\" fill=\"#faedcd\"/><rect x=\"5\" y=\"5\" width=\"1\" height=\"4\" fill=\"#78350f\"/><rect x=\"8\" y=\"7\" width=\"3\" height=\"1\" fill=\"#78350f\"/><rect x=\"6\" y=\"8\" width=\"1\" height=\"3\" fill=\"#78350f\"/><rect x=\"3\" y=\"12\" width=\"10\" height=\"1\" fill=\"#522409\"/>"
  },
  "yuzu_cheong": {
    "key": "yuzu_cheong",
    "name": "유자청",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"2\" fill=\"#fde047\"/><rect x=\"4\" y=\"3\" width=\"8\" height=\"1\" fill=\"#eab308\"/><rect x=\"4\" y=\"4\" width=\"8\" height=\"10\" fill=\"#fef08a\"/><rect x=\"4\" y=\"4\" width=\"1\" height=\"10\" fill=\"#ffffff\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"10\" fill=\"#ca8a04\"/><rect x=\"6\" y=\"6\" width=\"4\" height=\"3\" fill=\"#eab308\"/><rect x=\"5\" y=\"10\" width=\"4\" height=\"3\" fill=\"#ca8a04\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#ca8a04\"/>"
  },
  "maesil_cheong": {
    "key": "maesil_cheong",
    "name": "매실청",
    "innerSvg": "<rect x=\"5\" y=\"1\" width=\"6\" height=\"2\" fill=\"#84cc16\"/><rect x=\"4\" y=\"3\" width=\"8\" height=\"1\" fill=\"#65a30d\"/><rect x=\"4\" y=\"4\" width=\"8\" height=\"10\" fill=\"#fde047\"/><rect x=\"4\" y=\"4\" width=\"1\" height=\"10\" fill=\"#ffffff\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"10\" fill=\"#ca8a04\"/><rect x=\"6\" y=\"5\" width=\"3\" height=\"3\" fill=\"#65a30d\"/><rect x=\"7\" y=\"9\" width=\"3\" height=\"3\" fill=\"#84cc16\"/><rect x=\"5\" y=\"14\" width=\"6\" height=\"1\" fill=\"#ca8a04\"/>"
  },
  "honey": {
    "key": "honey",
    "name": "꿀",
    "viewBox": "0 0 32 32",
    "innerSvg": "<rect x=\"4\" y=\"0\" width=\"1\" height=\"1\" fill=\"#deb887\"/><rect x=\"5\" y=\"0\" width=\"3\" height=\"1\" fill=\"#2e1202\"/><rect x=\"5\" y=\"1\" width=\"1\" height=\"1\" fill=\"#deb887\"/><rect x=\"6\" y=\"1\" width=\"2\" height=\"1\" fill=\"#d97434\"/><rect x=\"8\" y=\"1\" width=\"1\" height=\"1\" fill=\"#8c4315\"/><rect x=\"9\" y=\"1\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"6\" y=\"2\" width=\"1\" height=\"1\" fill=\"#deb887\"/><rect x=\"7\" y=\"2\" width=\"2\" height=\"1\" fill=\"#d97434\"/><rect x=\"9\" y=\"2\" width=\"1\" height=\"1\" fill=\"#8c4315\"/><rect x=\"10\" y=\"2\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"22\" y=\"2\" width=\"1\" height=\"1\" fill=\"#18181b\"/><rect x=\"26\" y=\"2\" width=\"1\" height=\"1\" fill=\"#18181b\"/><rect x=\"7\" y=\"3\" width=\"1\" height=\"1\" fill=\"#deb887\"/><rect x=\"8\" y=\"3\" width=\"2\" height=\"1\" fill=\"#d97434\"/><rect x=\"10\" y=\"3\" width=\"1\" height=\"1\" fill=\"#8c4315\"/><rect x=\"11\" y=\"3\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"23\" y=\"3\" width=\"1\" height=\"1\" fill=\"#18181b\"/><rect x=\"25\" y=\"3\" width=\"1\" height=\"1\" fill=\"#18181b\"/><rect x=\"8\" y=\"4\" width=\"1\" height=\"1\" fill=\"#deb887\"/><rect x=\"9\" y=\"4\" width=\"2\" height=\"1\" fill=\"#d97434\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"1\" fill=\"#8c4315\"/><rect x=\"12\" y=\"4\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"22\" y=\"4\" width=\"1\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"23\" y=\"4\" width=\"1\" height=\"1\" fill=\"#bae6fd\"/><rect x=\"24\" y=\"4\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"25\" y=\"4\" width=\"1\" height=\"1\" fill=\"#bae6fd\"/><rect x=\"26\" y=\"4\" width=\"1\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"9\" y=\"5\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"10\" y=\"5\" width=\"2\" height=\"1\" fill=\"#8c4315\"/><rect x=\"12\" y=\"5\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"21\" y=\"5\" width=\"1\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"22\" y=\"5\" width=\"1\" height=\"1\" fill=\"#bae6fd\"/><rect x=\"23\" y=\"5\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"25\" y=\"5\" width=\"2\" height=\"1\" fill=\"#bae6fd\"/><rect x=\"27\" y=\"5\" width=\"1\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"28\" y=\"5\" width=\"2\" height=\"1\" fill=\"#18181b\"/><rect x=\"10\" y=\"6\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"11\" y=\"6\" width=\"2\" height=\"1\" fill=\"#5c2807\"/><rect x=\"13\" y=\"6\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"20\" y=\"6\" width=\"1\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"21\" y=\"6\" width=\"1\" height=\"1\" fill=\"#bae6fd\"/><rect x=\"22\" y=\"6\" width=\"3\" height=\"1\" fill=\"#ffffff\"/><rect x=\"25\" y=\"6\" width=\"2\" height=\"1\" fill=\"#bae6fd\"/><rect x=\"27\" y=\"6\" width=\"1\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"28\" y=\"6\" width=\"1\" height=\"1\" fill=\"#18181b\"/><rect x=\"29\" y=\"6\" width=\"1\" height=\"1\" fill=\"#facc15\"/><rect x=\"30\" y=\"6\" width=\"1\" height=\"1\" fill=\"#fef08a\"/><rect x=\"31\" y=\"6\" width=\"1\" height=\"1\" fill=\"#facc15\"/><rect x=\"11\" y=\"7\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"12\" y=\"7\" width=\"1\" height=\"1\" fill=\"#5c2807\"/><rect x=\"13\" y=\"7\" width=\"1\" height=\"1\" fill=\"#d97434\"/><rect x=\"14\" y=\"7\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"15\" y=\"7\" width=\"1\" height=\"1\" fill=\"#5c2807\"/><rect x=\"21\" y=\"7\" width=\"1\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"22\" y=\"7\" width=\"1\" height=\"1\" fill=\"#bae6fd\"/><rect x=\"23\" y=\"7\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"25\" y=\"7\" width=\"1\" height=\"1\" fill=\"#bae6fd\"/><rect x=\"26\" y=\"7\" width=\"1\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"28\" y=\"7\" width=\"1\" height=\"1\" fill=\"#18181b\"/><rect x=\"29\" y=\"7\" width=\"1\" height=\"1\" fill=\"#facc15\"/><rect x=\"30\" y=\"7\" width=\"1\" height=\"1\" fill=\"#fef08a\"/><rect x=\"31\" y=\"7\" width=\"1\" height=\"1\" fill=\"#facc15\"/><rect x=\"12\" y=\"8\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"13\" y=\"8\" width=\"1\" height=\"1\" fill=\"#b45309\"/><rect x=\"14\" y=\"8\" width=\"1\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"15\" y=\"8\" width=\"1\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"16\" y=\"8\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"22\" y=\"8\" width=\"1\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"23\" y=\"8\" width=\"2\" height=\"1\" fill=\"#bae6fd\"/><rect x=\"25\" y=\"8\" width=\"1\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"29\" y=\"8\" width=\"2\" height=\"1\" fill=\"#18181b\"/><rect x=\"31\" y=\"8\" width=\"1\" height=\"1\" fill=\"#000000\"/><rect x=\"13\" y=\"9\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"14\" y=\"9\" width=\"1\" height=\"1\" fill=\"#b45309\"/><rect x=\"15\" y=\"9\" width=\"1\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"16\" y=\"9\" width=\"1\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"17\" y=\"9\" width=\"1\" height=\"1\" fill=\"#2e1202\"/><rect x=\"23\" y=\"9\" width=\"2\" height=\"1\" fill=\"#38bdf8\"/><rect x=\"28\" y=\"9\" width=\"1\" height=\"1\" fill=\"#18181b\"/><rect x=\"31\" y=\"9\" width=\"1\" height=\"1\" fill=\"#18181b\"/><rect x=\"6\" y=\"10\" width=\"13\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"5\" y=\"11\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"6\" y=\"11\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"7\" y=\"11\" width=\"11\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"18\" y=\"11\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"20\" y=\"11\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"4\" y=\"12\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"5\" y=\"12\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"6\" y=\"12\" width=\"1\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"7\" y=\"12\" width=\"1\" height=\"1\" fill=\"#ba5018\"/><rect x=\"8\" y=\"12\" width=\"9\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"17\" y=\"12\" width=\"1\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"18\" y=\"12\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"20\" y=\"12\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"3\" y=\"13\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"4\" y=\"13\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"5\" y=\"13\" width=\"1\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"6\" y=\"13\" width=\"2\" height=\"1\" fill=\"#ba5018\"/><rect x=\"8\" y=\"13\" width=\"10\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"18\" y=\"13\" width=\"1\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"19\" y=\"13\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"20\" y=\"13\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"2\" y=\"14\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"3\" y=\"14\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"4\" y=\"14\" width=\"1\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"5\" y=\"14\" width=\"1\" height=\"1\" fill=\"#ba5018\"/><rect x=\"6\" y=\"14\" width=\"1\" height=\"1\" fill=\"#9c3d10\"/><rect x=\"7\" y=\"14\" width=\"1\" height=\"1\" fill=\"#ba5018\"/><rect x=\"8\" y=\"14\" width=\"3\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"11\" y=\"14\" width=\"1\" height=\"1\" fill=\"#fde047\"/><rect x=\"12\" y=\"14\" width=\"6\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"18\" y=\"14\" width=\"2\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"20\" y=\"14\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"21\" y=\"14\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"22\" y=\"14\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"1\" y=\"15\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"2\" y=\"15\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"3\" y=\"15\" width=\"1\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"4\" y=\"15\" width=\"2\" height=\"1\" fill=\"#ba5018\"/><rect x=\"6\" y=\"15\" width=\"2\" height=\"1\" fill=\"#9c3d10\"/><rect x=\"8\" y=\"15\" width=\"3\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"11\" y=\"15\" width=\"1\" height=\"1\" fill=\"#fde047\"/><rect x=\"12\" y=\"15\" width=\"6\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"18\" y=\"15\" width=\"4\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"22\" y=\"15\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"23\" y=\"15\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"24\" y=\"15\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"1\" y=\"16\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"2\" y=\"16\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"3\" y=\"16\" width=\"2\" height=\"1\" fill=\"#ba5018\"/><rect x=\"5\" y=\"16\" width=\"1\" height=\"1\" fill=\"#d97434\"/><rect x=\"6\" y=\"16\" width=\"2\" height=\"1\" fill=\"#9c3d10\"/><rect x=\"8\" y=\"16\" width=\"2\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"10\" y=\"16\" width=\"1\" height=\"1\" fill=\"#fde047\"/><rect x=\"11\" y=\"16\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"12\" y=\"16\" width=\"6\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"18\" y=\"16\" width=\"5\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"23\" y=\"16\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"24\" y=\"16\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"25\" y=\"16\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"1\" y=\"17\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"2\" y=\"17\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"3\" y=\"17\" width=\"1\" height=\"1\" fill=\"#ba5018\"/><rect x=\"4\" y=\"17\" width=\"1\" height=\"1\" fill=\"#d97434\"/><rect x=\"5\" y=\"17\" width=\"3\" height=\"1\" fill=\"#9c3d10\"/><rect x=\"8\" y=\"17\" width=\"2\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"10\" y=\"17\" width=\"1\" height=\"1\" fill=\"#fde047\"/><rect x=\"11\" y=\"17\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rect x=\"12\" y=\"17\" width=\"6\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"18\" y=\"17\" width=\"6\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"24\" y=\"17\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"25\" y=\"17\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"26\" y=\"17\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"1\" y=\"18\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"2\" y=\"18\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"3\" y=\"18\" width=\"1\" height=\"1\" fill=\"#ba5018\"/><rect x=\"4\" y=\"18\" width=\"1\" height=\"1\" fill=\"#d97434\"/><rect x=\"5\" y=\"18\" width=\"3\" height=\"1\" fill=\"#9c3d10\"/><rect x=\"8\" y=\"18\" width=\"1\" height=\"1\" fill=\"#b45309\"/><rect x=\"9\" y=\"18\" width=\"1\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"10\" y=\"18\" width=\"1\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"11\" y=\"18\" width=\"1\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"12\" y=\"18\" width=\"1\" height=\"1\" fill=\"#fde047\"/><rect x=\"13\" y=\"18\" width=\"1\" height=\"1\" fill=\"#fef08a\"/><rect x=\"14\" y=\"18\" width=\"3\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"17\" y=\"18\" width=\"1\" height=\"1\" fill=\"#b45309\"/><rect x=\"18\" y=\"18\" width=\"6\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"24\" y=\"18\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"25\" y=\"18\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"26\" y=\"18\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"1\" y=\"19\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"2\" y=\"19\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"3\" y=\"19\" width=\"1\" height=\"1\" fill=\"#ba5018\"/><rect x=\"4\" y=\"19\" width=\"1\" height=\"1\" fill=\"#d97434\"/><rect x=\"5\" y=\"19\" width=\"2\" height=\"1\" fill=\"#9c3d10\"/><rect x=\"7\" y=\"19\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"8\" y=\"19\" width=\"1\" height=\"1\" fill=\"#853205\"/><rect x=\"9\" y=\"19\" width=\"1\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"10\" y=\"19\" width=\"1\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"11\" y=\"19\" width=\"1\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"12\" y=\"19\" width=\"2\" height=\"1\" fill=\"#ffffff\"/><rect x=\"14\" y=\"19\" width=\"4\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"18\" y=\"19\" width=\"1\" height=\"1\" fill=\"#853205\"/><rect x=\"19\" y=\"19\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"20\" y=\"19\" width=\"4\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"24\" y=\"19\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"25\" y=\"19\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"26\" y=\"19\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"1\" y=\"20\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"2\" y=\"20\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"3\" y=\"20\" width=\"1\" height=\"1\" fill=\"#ba5018\"/><rect x=\"4\" y=\"20\" width=\"1\" height=\"1\" fill=\"#d97434\"/><rect x=\"5\" y=\"20\" width=\"2\" height=\"1\" fill=\"#9c3d10\"/><rect x=\"7\" y=\"20\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"8\" y=\"20\" width=\"1\" height=\"1\" fill=\"#853205\"/><rect x=\"9\" y=\"20\" width=\"1\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"10\" y=\"20\" width=\"1\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"11\" y=\"20\" width=\"7\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"18\" y=\"20\" width=\"1\" height=\"1\" fill=\"#853205\"/><rect x=\"19\" y=\"20\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"20\" y=\"20\" width=\"4\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"24\" y=\"20\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"25\" y=\"20\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"26\" y=\"20\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"1\" y=\"21\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"2\" y=\"21\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"3\" y=\"21\" width=\"2\" height=\"1\" fill=\"#ba5018\"/><rect x=\"5\" y=\"21\" width=\"1\" height=\"1\" fill=\"#d97434\"/><rect x=\"6\" y=\"21\" width=\"1\" height=\"1\" fill=\"#9c3d10\"/><rect x=\"7\" y=\"21\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"8\" y=\"21\" width=\"1\" height=\"1\" fill=\"#853205\"/><rect x=\"9\" y=\"21\" width=\"1\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"10\" y=\"21\" width=\"1\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"11\" y=\"21\" width=\"5\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"16\" y=\"21\" width=\"1\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"17\" y=\"21\" width=\"1\" height=\"1\" fill=\"#853205\"/><rect x=\"18\" y=\"21\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"20\" y=\"21\" width=\"3\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"23\" y=\"21\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"24\" y=\"21\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"25\" y=\"21\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"1\" y=\"22\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"2\" y=\"22\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"3\" y=\"22\" width=\"1\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"4\" y=\"22\" width=\"2\" height=\"1\" fill=\"#ba5018\"/><rect x=\"6\" y=\"22\" width=\"1\" height=\"1\" fill=\"#9c3d10\"/><rect x=\"8\" y=\"22\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"9\" y=\"22\" width=\"1\" height=\"1\" fill=\"#853205\"/><rect x=\"10\" y=\"22\" width=\"1\" height=\"1\" fill=\"#fbbf24\"/><rect x=\"11\" y=\"22\" width=\"4\" height=\"1\" fill=\"#f59e0b\"/><rect x=\"15\" y=\"22\" width=\"1\" height=\"1\" fill=\"#853205\"/><rect x=\"16\" y=\"22\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"20\" y=\"22\" width=\"4\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"24\" y=\"22\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"25\" y=\"22\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"26\" y=\"22\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"1\" y=\"23\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"2\" y=\"23\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"3\" y=\"23\" width=\"2\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"5\" y=\"23\" width=\"1\" height=\"1\" fill=\"#ba5018\"/><rect x=\"6\" y=\"23\" width=\"1\" height=\"1\" fill=\"#9c3d10\"/><rect x=\"10\" y=\"23\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"11\" y=\"23\" width=\"3\" height=\"1\" fill=\"#853205\"/><rect x=\"14\" y=\"23\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"19\" y=\"23\" width=\"4\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"23\" y=\"23\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"24\" y=\"23\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"25\" y=\"23\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"2\" y=\"24\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"3\" y=\"24\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"4\" y=\"24\" width=\"2\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"6\" y=\"24\" width=\"1\" height=\"1\" fill=\"#ba5018\"/><rect x=\"7\" y=\"24\" width=\"1\" height=\"1\" fill=\"#9c3d10\"/><rect x=\"18\" y=\"24\" width=\"4\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"22\" y=\"24\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"23\" y=\"24\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"24\" y=\"24\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"3\" y=\"25\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"4\" y=\"25\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"5\" y=\"25\" width=\"2\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"7\" y=\"25\" width=\"12\" height=\"1\" fill=\"#9c3d10\"/><rect x=\"19\" y=\"25\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"20\" y=\"25\" width=\"3\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"23\" y=\"25\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"24\" y=\"25\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"25\" y=\"25\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"4\" y=\"26\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"5\" y=\"26\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"6\" y=\"26\" width=\"1\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"7\" y=\"26\" width=\"12\" height=\"1\" fill=\"#381303\"/><rect x=\"19\" y=\"26\" width=\"2\" height=\"1\" fill=\"#7a2e0b\"/><rect x=\"21\" y=\"26\" width=\"1\" height=\"1\" fill=\"#381303\"/><rect x=\"22\" y=\"26\" width=\"1\" height=\"1\" fill=\"#521d05\"/><rect x=\"23\" y=\"26\" width=\"1\" height=\"1\" fill=\"#1c0a00\"/><rect x=\"5\" y=\"27\" width=\"17\" height=\"1\" fill=\"#1c0a00\"/>"
  },
  "vinegar": {
    "key": "vinegar",
    "name": "식초",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"2\" fill=\"#d97706\"/><rect x=\"7\" y=\"3\" width=\"2\" height=\"3\" fill=\"#e2e8f0\"/><rect x=\"4\" y=\"6\" width=\"8\" height=\"9\" fill=\"#fef08a\"/><rect x=\"4\" y=\"6\" width=\"1\" height=\"9\" fill=\"#ffffff\"/><rect x=\"11\" y=\"6\" width=\"1\" height=\"9\" fill=\"#ca8a04\"/><rect x=\"5\" y=\"15\" width=\"6\" height=\"1\" fill=\"#ca8a04\"/>"
  },
  "pomegranate_concentrate": {
    "key": "pomegranate_concentrate",
    "name": "석류농축액",
    "innerSvg": "<rect x=\"7\" y=\"1\" width=\"2\" height=\"3\" fill=\"#1e293b\"/><rect x=\"6\" y=\"3\" width=\"4\" height=\"1\" fill=\"#475569\"/><rect x=\"4\" y=\"4\" width=\"8\" height=\"11\" fill=\"#881337\"/><rect x=\"4\" y=\"4\" width=\"1\" height=\"11\" fill=\"#be123c\"/><rect x=\"6\" y=\"7\" width=\"4\" height=\"4\" fill=\"#f43f5e\"/><rect x=\"5\" y=\"15\" width=\"6\" height=\"1\" fill=\"#4c0519\"/>"
  }
  };

  const ALIAS_MAP = {
  "1": "rec_somaek",
  "2": "rec_kkulju",
  "6": "rec_hongchaju",
  "7": "rec_kibum_tea",
  "8": "rec_energy_soju",
  "9": "rec_blue_lemon_soju",
  "10": "rec_boksosa",
  "13": "rec_icetea",
  "16": "rec_mango_ringo",
  "17": "rec_mango_ringoju",
  "18": "rec_soju_cola",
  "19": "rec_ringelju",
  "21": "rec_maeksato",
  "24": "rec_screwbarju",
  "27": "rec_maksa",
  "30": "rec_choco_soju",
  "31": "rec_golden_somaek",
  "33": "rec_tankboyju",
  "38": "rec_strawberry_makgeolli",
  "39": "rec_honey_makgeolli",
  "40": "rec_yuzu_makgeolli",
  "41": "rec_maesil_makgeolli",
  "42": "rec_sikhye_makgeolli",
  "43": "rec_misutgaru_makgeolli",
  "44": "rec_banana_milk_makgeolli",
  "45": "rec_peach_makgeolli",
  "46": "rec_pear_makgeolli",
  "47": "rec_pineapple_makgeolli",
  "48": "rec_yakult_makgeolli",
  "49": "rec_honey_misutgaru_makgeolli",
  "50": "rec_pomegranate_makgeolli",
  "51": "rec_sotonic",
  "54": "rec_calamansiju",
  "55": "rec_icheon_makgeolli",
  "56": "rec_hallasan_sotonic",
  "68": "rec_tesla",
  "69": "rec_tejina",
  "70": "rec_casscheorom",
  "71": "rec_kelly_is_back",
  "72": "rec_castella",
  "73": "rec_milkisju",
  "74": "rec_gojingamlae",
  "75": "rec_pocariju",
  "76": "rec_energizerju",
  "77": "rec_taegeukju",
  "78": "rec_sowonju",
  "79": "rec_dutch_lager",
  "80": "rec_melonaju",
  "81": "rec_jawsbarju",
  "82": "rec_bibibig_makgeolli",
  "83": "rec_kahlua_milk",
  "101": "soju",
  "102": "beer",
  "103": "bokbunjaju",
  "104": "maesilju",
  "105": "makgeolli",
  "201": "ice",
  "202": "water",
  "203": "fire",
  "204": "sparkling_water",
  "205": "air",
  "206": "snow",
  "301": "lemon",
  "302": "melon",
  "303": "mango",
  "304": "maesil",
  "305": "tomato",
  "306": "apple",
  "307": "strawberry",
  "308": "cacao",
  "309": "pear",
  "310": "banana",
  "311": "yuzu",
  "312": "calamansi",
  "313": "bokbunja",
  "314": "pomegranate",
  "315": "orange",
  "401": "milk",
  "501": "barley",
  "502": "rice",
  "503": "misutgaru",
  "504": "coffee_beans",
  "601": "black_tea",
  "602": "energy_drink",
  "603": "ion_drink",
  "604": "milksoda",
  "605": "blue_lemonade",
  "606": "cider",
  "607": "cola",
  "608": "tomato_juice",
  "609": "choco_milk",
  "610": "strawberry_milk",
  "611": "banana_milk",
  "612": "sikhye",
  "613": "peach_drink",
  "614": "pear_drink",
  "615": "pineapple_juice",
  "616": "yakult",
  "617": "pomegranate_juice",
  "618": "tonic_water",
  "619": "calamansi_pouch",
  "620": "iced_americano",
  "621": "hongcho",
  "701": "sugar",
  "702": "nuruk",
  "703": "yuzu_cheong",
  "704": "maesil_cheong",
  "705": "honey",
  "706": "vinegar",
  "707": "pomegranate_concentrate",
  "801": "screwbar",
  "802": "chocolate",
  "803": "tankboy",
  "804": "melona",
  "805": "jawsbar",
  "806": "bibibig",
  "soju": "soju",
  "소주": "soju",
  "ing_101": "soju",
  "rec_5": "soju",
  "beer": "beer",
  "맥주": "beer",
  "ing_102": "beer",
  "rec_4": "beer",
  "bokbunjaju": "bokbunjaju",
  "복분자주": "bokbunjaju",
  "ing_103": "bokbunjaju",
  "rec_57": "bokbunjaju",
  "maesilju": "maesilju",
  "매실주": "maesilju",
  "ing_104": "maesilju",
  "rec_20": "maesilju",
  "매화수": "maesilju",
  "makgeolli": "makgeolli",
  "막걸리": "makgeolli",
  "ing_105": "makgeolli",
  "rec_26": "makgeolli",
  "ice": "ice",
  "얼음": "ice",
  "ing_201": "ice",
  "rec_11": "ice",
  "water": "water",
  "물": "water",
  "ing_202": "water",
  "fire": "fire",
  "불": "fire",
  "ing_203": "fire",
  "sparkling_water": "sparkling_water",
  "탄산수": "sparkling_water",
  "ing_204": "sparkling_water",
  "rec_12": "sparkling_water",
  "air": "air",
  "공기": "air",
  "ing_205": "air",
  "snow": "snow",
  "눈": "snow",
  "ing_206": "snow",
  "lemon": "lemon",
  "레몬": "lemon",
  "ing_301": "lemon",
  "melon": "melon",
  "멜론": "melon",
  "ing_302": "melon",
  "mango": "mango",
  "망고": "mango",
  "ing_303": "mango",
  "maesil": "maesil",
  "매실": "maesil",
  "ing_304": "maesil",
  "tomato": "tomato",
  "토마토": "tomato",
  "ing_305": "tomato",
  "apple": "apple",
  "사과": "apple",
  "ing_306": "apple",
  "strawberry": "strawberry",
  "딸기": "strawberry",
  "ing_307": "strawberry",
  "cacao": "cacao",
  "카카오": "cacao",
  "ing_308": "cacao",
  "pear": "pear",
  "배": "pear",
  "ing_309": "pear",
  "banana": "banana",
  "바나나": "banana",
  "ing_310": "banana",
  "yuzu": "yuzu",
  "유자": "yuzu",
  "ing_311": "yuzu",
  "calamansi": "calamansi",
  "깔라만시": "calamansi",
  "ing_312": "calamansi",
  "bokbunja": "bokbunja",
  "복분자": "bokbunja",
  "ing_313": "bokbunja",
  "pomegranate": "pomegranate",
  "석류": "pomegranate",
  "ing_314": "pomegranate",
  "orange": "orange",
  "오렌지": "orange",
  "ing_315": "orange",
  "milk": "milk",
  "우유": "milk",
  "ing_401": "milk",
  "barley": "barley",
  "맥(보리)": "barley",
  "ing_501": "barley",
  "맥": "barley",
  "보리": "barley",
  "rice": "rice",
  "쌀": "rice",
  "ing_502": "rice",
  "misutgaru": "misutgaru",
  "미숫가루": "misutgaru",
  "ing_503": "misutgaru",
  "rec_61": "misutgaru",
  "coffee_beans": "coffee_beans",
  "커피콩": "coffee_beans",
  "ing_504": "coffee_beans",
  "커피원두": "coffee_beans",
  "black_tea": "black_tea",
  "홍차": "black_tea",
  "ing_601": "black_tea",
  "energy_drink": "energy_drink",
  "에너지드링크": "energy_drink",
  "ing_602": "energy_drink",
  "핫식스": "energy_drink",
  "ion_drink": "ion_drink",
  "이온음료": "ion_drink",
  "ing_603": "ion_drink",
  "포카리스웨트": "ion_drink",
  "milksoda": "milksoda",
  "밀크소다": "milksoda",
  "ing_604": "milksoda",
  "rec_15": "milksoda",
  "밀키스": "milksoda",
  "blue_lemonade": "blue_lemonade",
  "블루레몬에이드": "blue_lemonade",
  "ing_605": "blue_lemonade",
  "rec_14": "blue_lemonade",
  "cider": "cider",
  "사이다": "cider",
  "ing_606": "cider",
  "rec_58": "cider",
  "칠성사이다": "cider",
  "cola": "cola",
  "콜라": "cola",
  "ing_607": "cola",
  "코카콜라": "cola",
  "tomato_juice": "tomato_juice",
  "토마토주스": "tomato_juice",
  "ing_608": "tomato_juice",
  "rec_22": "tomato_juice",
  "choco_milk": "choco_milk",
  "초코우유": "choco_milk",
  "ing_609": "choco_milk",
  "rec_29": "choco_milk",
  "초코에몽": "choco_milk",
  "strawberry_milk": "strawberry_milk",
  "딸기우유": "strawberry_milk",
  "ing_610": "strawberry_milk",
  "rec_34": "strawberry_milk",
  "banana_milk": "banana_milk",
  "바나나우유": "banana_milk",
  "ing_611": "banana_milk",
  "rec_35": "banana_milk",
  "단지우유": "banana_milk",
  "sikhye": "sikhye",
  "식혜": "sikhye",
  "ing_612": "sikhye",
  "rec_60": "sikhye",
  "비락식혜": "sikhye",
  "peach_drink": "peach_drink",
  "복숭아음료": "peach_drink",
  "ing_613": "peach_drink",
  "2프로": "peach_drink",
  "코코팜": "peach_drink",
  "pear_drink": "pear_drink",
  "배음료": "pear_drink",
  "ing_614": "pear_drink",
  "rec_59": "pear_drink",
  "갈아만든배": "pear_drink",
  "pineapple_juice": "pineapple_juice",
  "파인애플주스": "pineapple_juice",
  "ing_615": "pineapple_juice",
  "yakult": "yakult",
  "요구르트": "yakult",
  "ing_616": "yakult",
  "야쿠르트": "yakult",
  "pomegranate_juice": "pomegranate_juice",
  "석류주스": "pomegranate_juice",
  "ing_617": "pomegranate_juice",
  "미녀는석류를좋아해": "pomegranate_juice",
  "tonic_water": "tonic_water",
  "토닉워터": "tonic_water",
  "ing_618": "tonic_water",
  "rec_52": "tonic_water",
  "calamansi_pouch": "calamansi_pouch",
  "깔라만시 원액": "calamansi_pouch",
  "ing_619": "calamansi_pouch",
  "rec_53": "calamansi_pouch",
  "iced_americano": "iced_americano",
  "아이스 아메리카노": "iced_americano",
  "ing_620": "iced_americano",
  "rec_65": "iced_americano",
  "hongcho": "hongcho",
  "홍초": "hongcho",
  "ing_621": "hongcho",
  "rec_64": "hongcho",
  "sugar": "sugar",
  "설탕": "sugar",
  "ing_701": "sugar",
  "nuruk": "nuruk",
  "누룩": "nuruk",
  "ing_702": "nuruk",
  "rec_25": "nuruk",
  "yuzu_cheong": "yuzu_cheong",
  "유자청": "yuzu_cheong",
  "ing_703": "yuzu_cheong",
  "rec_36": "yuzu_cheong",
  "maesil_cheong": "maesil_cheong",
  "매실청": "maesil_cheong",
  "ing_704": "maesil_cheong",
  "rec_37": "maesil_cheong",
  "honey": "honey",
  "꿀": "honey",
  "ing_705": "honey",
  "vinegar": "vinegar",
  "식초": "vinegar",
  "ing_706": "vinegar",
  "rec_62": "vinegar",
  "양조식초": "vinegar",
  "pomegranate_concentrate": "pomegranate_concentrate",
  "석류농축액": "pomegranate_concentrate",
  "ing_707": "pomegranate_concentrate",
  "rec_63": "pomegranate_concentrate",
  "screwbar": "screwbar",
  "배배꼬인바": "screwbar",
  "ing_801": "screwbar",
  "rec_23": "screwbar",
  "스크류바": "screwbar",
  "chocolate": "chocolate",
  "초콜릿": "chocolate",
  "ing_802": "chocolate",
  "rec_28": "chocolate",
  "가나초콜릿": "chocolate",
  "tankboy": "tankboy",
  "배즙보이": "tankboy",
  "ing_803": "tankboy",
  "rec_32": "tankboy",
  "탱크보이": "tankboy",
  "melona": "melona",
  "올때메론바": "melona",
  "ing_804": "melona",
  "rec_3": "melona",
  "메로나": "melona",
  "jawsbar": "jawsbar",
  "상어바": "jawsbar",
  "ing_805": "jawsbar",
  "rec_66": "jawsbar",
  "죠스바": "jawsbar",
  "bibibig": "bibibig",
  "단팥바": "bibibig",
  "ing_806": "bibibig",
  "rec_67": "bibibig",
  "비비빅": "bibibig",
  "rec_somaek": "rec_somaek",
  "소맥": "rec_somaek",
  "rec_1": "rec_somaek",
  "rec_kkulju": "rec_kkulju",
  "꿀주": "rec_kkulju",
  "rec_2": "rec_kkulju",
  "rec_hongchaju": "rec_hongchaju",
  "홍차주": "rec_hongchaju",
  "rec_6": "rec_hongchaju",
  "rec_kibum_tea": "rec_kibum_tea",
  "만능열쇠 홍차주": "rec_kibum_tea",
  "rec_7": "rec_kibum_tea",
  "기범주": "rec_kibum_tea",
  "rec_energy_soju": "rec_energy_soju",
  "에너지주": "rec_energy_soju",
  "rec_8": "rec_energy_soju",
  "rec_blue_lemon_soju": "rec_blue_lemon_soju",
  "블루레몬주": "rec_blue_lemon_soju",
  "rec_9": "rec_blue_lemon_soju",
  "rec_boksosa": "rec_boksosa",
  "복소사": "rec_boksosa",
  "rec_10": "rec_boksosa",
  "rec_icetea": "rec_icetea",
  "아이스티": "rec_icetea",
  "rec_13": "rec_icetea",
  "rec_mango_ringo": "rec_mango_ringo",
  "망고톡톡": "rec_mango_ringo",
  "rec_16": "rec_mango_ringo",
  "망고링고": "rec_mango_ringo",
  "rec_mango_ringoju": "rec_mango_ringoju",
  "망고톡톡주": "rec_mango_ringoju",
  "rec_17": "rec_mango_ringoju",
  "망고링고주": "rec_mango_ringoju",
  "rec_soju_cola": "rec_soju_cola",
  "소콜": "rec_soju_cola",
  "rec_18": "rec_soju_cola",
  "rec_ringelju": "rec_ringelju",
  "링겔주": "rec_ringelju",
  "rec_19": "rec_ringelju",
  "rec_maeksato": "rec_maeksato",
  "맥사토": "rec_maeksato",
  "rec_21": "rec_maeksato",
  "rec_screwbarju": "rec_screwbarju",
  "배배꼬인주": "rec_screwbarju",
  "rec_24": "rec_screwbarju",
  "스크류바주": "rec_screwbarju",
  "rec_maksa": "rec_maksa",
  "막사": "rec_maksa",
  "rec_27": "rec_maksa",
  "rec_choco_soju": "rec_choco_soju",
  "초코방울주": "rec_choco_soju",
  "rec_30": "rec_choco_soju",
  "초코에몽주": "rec_choco_soju",
  "rec_golden_somaek": "rec_golden_somaek",
  "황금소맥": "rec_golden_somaek",
  "rec_31": "rec_golden_somaek",
  "rec_tankboyju": "rec_tankboyju",
  "배즙보이주": "rec_tankboyju",
  "rec_33": "rec_tankboyju",
  "탱크보이주": "rec_tankboyju",
  "rec_strawberry_makgeolli": "rec_strawberry_makgeolli",
  "딸기우유 막걸리": "rec_strawberry_makgeolli",
  "rec_38": "rec_strawberry_makgeolli",
  "rec_honey_makgeolli": "rec_honey_makgeolli",
  "꿀 막걸리": "rec_honey_makgeolli",
  "rec_39": "rec_honey_makgeolli",
  "rec_yuzu_makgeolli": "rec_yuzu_makgeolli",
  "유자 막걸리": "rec_yuzu_makgeolli",
  "rec_40": "rec_yuzu_makgeolli",
  "rec_maesil_makgeolli": "rec_maesil_makgeolli",
  "매실 막걸리": "rec_maesil_makgeolli",
  "rec_41": "rec_maesil_makgeolli",
  "rec_sikhye_makgeolli": "rec_sikhye_makgeolli",
  "식혜 막걸리": "rec_sikhye_makgeolli",
  "rec_42": "rec_sikhye_makgeolli",
  "rec_misutgaru_makgeolli": "rec_misutgaru_makgeolli",
  "미숫가루 막걸리": "rec_misutgaru_makgeolli",
  "rec_43": "rec_misutgaru_makgeolli",
  "rec_banana_milk_makgeolli": "rec_banana_milk_makgeolli",
  "바나나우유 막걸리": "rec_banana_milk_makgeolli",
  "rec_44": "rec_banana_milk_makgeolli",
  "rec_peach_makgeolli": "rec_peach_makgeolli",
  "복숭아 막걸리": "rec_peach_makgeolli",
  "rec_45": "rec_peach_makgeolli",
  "rec_pear_makgeolli": "rec_pear_makgeolli",
  "배 막걸리": "rec_pear_makgeolli",
  "rec_46": "rec_pear_makgeolli",
  "rec_pineapple_makgeolli": "rec_pineapple_makgeolli",
  "파인애플 막걸리": "rec_pineapple_makgeolli",
  "rec_47": "rec_pineapple_makgeolli",
  "rec_yakult_makgeolli": "rec_yakult_makgeolli",
  "요구르트 막걸리": "rec_yakult_makgeolli",
  "rec_48": "rec_yakult_makgeolli",
  "rec_honey_misutgaru_makgeolli": "rec_honey_misutgaru_makgeolli",
  "꿀 미숫가루 막걸리": "rec_honey_misutgaru_makgeolli",
  "rec_49": "rec_honey_misutgaru_makgeolli",
  "rec_pomegranate_makgeolli": "rec_pomegranate_makgeolli",
  "석류 막걸리": "rec_pomegranate_makgeolli",
  "rec_50": "rec_pomegranate_makgeolli",
  "rec_sotonic": "rec_sotonic",
  "소토닉": "rec_sotonic",
  "rec_51": "rec_sotonic",
  "rec_calamansiju": "rec_calamansiju",
  "깔라만시주": "rec_calamansiju",
  "rec_54": "rec_calamansiju",
  "rec_icheon_makgeolli": "rec_icheon_makgeolli",
  "이천 수라상 생막걸리": "rec_icheon_makgeolli",
  "rec_55": "rec_icheon_makgeolli",
  "이천 임금님표 생막걸리": "rec_icheon_makgeolli",
  "rec_hallasan_sotonic": "rec_hallasan_sotonic",
  "제주 화산 쏘토닉": "rec_hallasan_sotonic",
  "rec_56": "rec_hallasan_sotonic",
  "한라산 21 쏘토닉": "rec_hallasan_sotonic",
  "rec_tesla": "rec_tesla",
  "테스형라": "rec_tesla",
  "rec_68": "rec_tesla",
  "테슬라": "rec_tesla",
  "rec_tejina": "rec_tejina",
  "테진아": "rec_tejina",
  "rec_69": "rec_tejina",
  "rec_casscheorom": "rec_casscheorom",
  "카아스처럼": "rec_casscheorom",
  "rec_70": "rec_casscheorom",
  "카스처럼": "rec_casscheorom",
  "rec_kelly_is_back": "rec_kelly_is_back",
  "캘리포니아 이즈백": "rec_kelly_is_back",
  "rec_71": "rec_kelly_is_back",
  "캘리이즈백": "rec_kelly_is_back",
  "rec_castella": "rec_castella",
  "카스텔라": "rec_castella",
  "rec_72": "rec_castella",
  "rec_milkisju": "rec_milkisju",
  "밀키스주": "rec_milkisju",
  "rec_73": "rec_milkisju",
  "암바사주": "rec_milkisju",
  "rec_gojingamlae": "rec_gojingamlae",
  "고진감래주": "rec_gojingamlae",
  "rec_74": "rec_gojingamlae",
  "rec_pocariju": "rec_pocariju",
  "뽕가리스웨트": "rec_pocariju",
  "rec_75": "rec_pocariju",
  "포카리주": "rec_pocariju",
  "rec_energizerju": "rec_energizerju",
  "에너자이저주": "rec_energizerju",
  "rec_76": "rec_energizerju",
  "rec_taegeukju": "rec_taegeukju",
  "태극주": "rec_taegeukju",
  "rec_77": "rec_taegeukju",
  "rec_sowonju": "rec_sowonju",
  "소원주": "rec_sowonju",
  "rec_78": "rec_sowonju",
  "rec_dutch_lager": "rec_dutch_lager",
  "더치 라거": "rec_dutch_lager",
  "rec_79": "rec_dutch_lager",
  "커피맥주": "rec_dutch_lager",
  "rec_melonaju": "rec_melonaju",
  "올때메론주": "rec_melonaju",
  "rec_80": "rec_melonaju",
  "메로나주": "rec_melonaju",
  "rec_jawsbarju": "rec_jawsbarju",
  "상어바주": "rec_jawsbarju",
  "rec_81": "rec_jawsbarju",
  "죠스바주": "rec_jawsbarju",
  "rec_bibibig_makgeolli": "rec_bibibig_makgeolli",
  "단팥 막걸리": "rec_bibibig_makgeolli",
  "rec_82": "rec_bibibig_makgeolli",
  "비비빅 막걸리": "rec_bibibig_makgeolli",
  "rec_kahlua_milk": "rec_kahlua_milk",
  "조선 깔루아 밀크": "rec_kahlua_milk",
  "rec_83": "rec_kahlua_milk",
  "깔루아밀크": "rec_kahlua_milk",
  // [상세 재료 13종 도트 스프라이트 매핑]
  "이천 임금님쌀": "rice",
  "철원 두루미쌀": "rice",
  "김제 황금지평선쌀": "rice",
  "해남 땅끝해풍쌀": "rice",
  "상주 낙동강삼백쌀": "rice",
  "참방울 후레쉬": "soju",
  "두꺼비 이즈백": "soju",
  "처음부터 부드럽게": "soju",
  "부산 파도소주": "soju",
  "제주 화산암반 21": "soju",
  "카아스 프레시": "beer",
  "청정라거 테라피": "beer",
  "더블숙성 켈리포니아": "beer"
};

  const THEME_STORAGE_KEY = 'ksool_icon_theme';
  let currentTheme = 'pixel'; // 'pixel' or 'emoji'

  try {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'emoji' || savedTheme === 'pixel') {
        currentTheme = savedTheme;
      }
    }
  } catch (e) {}

  const PixelIconRegistry = {
    /**
     * Get current icon theme ('pixel' or 'emoji')
     */
    getTheme: function() {
      return currentTheme;
    },

    /**
     * Set icon theme ('pixel' or 'emoji')
     */
    setTheme: function(theme) {
      currentTheme = (theme === 'emoji') ? 'emoji' : 'pixel';
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
        }
      } catch (e) {}
      return currentTheme;
    },

    /**
     * Toggle between 'pixel' and 'emoji'
     */
    toggleTheme: function() {
      return this.setTheme(currentTheme === 'pixel' ? 'emoji' : 'pixel');
    },

    /**
     * Resolve any item or key to its primary sprite key
     */
    resolveKey: function(item) {
      if (!item) return null;
      if (typeof item === 'string' || typeof item === 'number') {
        const str = String(item).trim();
        if (SPRITE_DATA[str]) return str;
        if (ALIAS_MAP[str]) return ALIAS_MAP[str];
        if (ALIAS_MAP[item]) return ALIAS_MAP[item];
        // Strip common prefixes
        const clean = str.replace(/^(ing_|rec_)/, '');
        if (SPRITE_DATA[clean]) return clean;
        if (ALIAS_MAP[clean]) return ALIAS_MAP[clean];
        if (SPRITE_DATA['rec_' + clean]) return 'rec_' + clean;
        if (SPRITE_DATA['ing_' + clean]) return 'ing_' + clean;
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

      // [아이콘 스위처] 기본 이모지 모드일 경우 해당 재료/레시피의 이모지 즉시 반환
      if (currentTheme === 'emoji') {
        const emoji = (item && (item.emoji || item.icon)) || opts.fallbackEmoji || '🍶';
        return '<span class="k-pixel-icon-fallback' + cls + '" style="display:inline-block;font-size:' + (size * 0.85) + 'px;line-height:1;vertical-align:middle' + extraStyle + '">' + emoji + '</span>';
      }

      const key = this.resolveKey(item);

      if (key && SPRITE_DATA[key]) {
        const sprite = SPRITE_DATA[key];
        return '<svg class="k-pixel-icon' + cls + '" viewBox="' + (sprite.viewBox || "0 0 16 16") + '" width="' + size + '" height="' + size + '" ' +
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
