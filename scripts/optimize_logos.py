import os
from PIL import Image

ASSETS_DIR = 'assets'

def optimize_assets():
    # 1. Favicon & App Icon (from KSool_AppIcon.png)
    app_icon_path = os.path.join(ASSETS_DIR, 'KSool_AppIcon.png')
    if os.path.exists(app_icon_path):
        with Image.open(app_icon_path) as im:
            # Favicon 32x32, 64x64, 192x192
            fav32 = im.resize((32, 32), Image.Resampling.LANCZOS)
            fav32.save(os.path.join(ASSETS_DIR, 'favicon-32x32.png'), optimize=True)

            fav64 = im.resize((64, 64), Image.Resampling.LANCZOS)
            fav64.save(os.path.join(ASSETS_DIR, 'favicon.png'), optimize=True)

            fav192 = im.resize((192, 192), Image.Resampling.LANCZOS)
            fav192.save(os.path.join(ASSETS_DIR, 'app_icon_192.png'), optimize=True)

            # Header emblem 128x128 (Retina display crispness)
            emblem = im.resize((128, 128), Image.Resampling.LANCZOS)
            emblem.save(os.path.join(ASSETS_DIR, 'header_emblem.png'), optimize=True)
            print("Generated Favicon & AppIcon assets.")

    # 2. OpenGraph Image for Kakao/SNS sharing (from KSool_MainFullLogo.png)
    main_logo_path = os.path.join(ASSETS_DIR, 'KSool_MainFullLogo.png')
    if os.path.exists(main_logo_path):
        with Image.open(main_logo_path) as im:
            # 1200x630 standard OG image with center crop/fit
            target_w, target_h = 1200, 630
            # Calculate aspect ratios
            src_w, src_h = im.size
            scale = max(target_w / src_w, target_h / src_h)
            new_w, new_h = int(src_w * scale), int(src_h * scale)
            resized = im.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Center crop
            left = (new_w - target_w) // 2
            top = (new_h - target_h) // 2
            og_img = resized.crop((left, top, left + target_w, top + target_h))
            og_img.save(os.path.join(ASSETS_DIR, 'og_image.png'), optimize=True, quality=90)
            print("Generated og_image.png (1200x630).")

    # 3. Watermark background for dark theme
    watermark_path = os.path.join(ASSETS_DIR, 'KSool_WaterMark.png')
    if os.path.exists(watermark_path):
        with Image.open(watermark_path) as im:
            # Resize to max 1000px width for fast loading (~50KB)
            w, h = im.size
            ratio = 1000 / w
            bg_w, bg_h = 1000, int(h * ratio)
            bg_img = im.resize((bg_w, bg_h), Image.Resampling.LANCZOS)
            
            # Save optimized PNG
            bg_img.save(os.path.join(ASSETS_DIR, 'watermark_bg.png'), optimize=True)
            print("Generated watermark_bg.png (1000px).")

if __name__ == '__main__':
    optimize_assets()
