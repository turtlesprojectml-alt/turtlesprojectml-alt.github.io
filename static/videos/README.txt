Drop your dataset videos in this folder, named to match the <video> sources in
index.html, OR rename the sources in index.html to match your filenames.

Expected filenames (referenced from index.html):

  teaser.mp4              Hero clip at top of page (autoplays, muted, looped)
  circle_re3900.mp4       Circular cylinder, Re=3900
  square_re2000.mp4       Square cylinder, Re=2000
  rectangle_re3000.mp4    Elongated rectangle, Re=3000
  diamond_alpha30.mp4     Diamond geometry at 30 degree angle of attack
  lowre_laminar.mp4       Low Reynolds case, Re=1000
  3d_isosurface.mp4       3D Q-criterion isosurface render

Recommended encoding for fast loading on GitHub Pages:

  ffmpeg -i input.mov \
    -vcodec libx264 -crf 24 -preset slow -pix_fmt yuv420p \
    -movflags +faststart -an \
    -vf "scale='min(1280,iw)':-2" \
    output.mp4

Notes:
- Keep each clip under ~10 MB if possible. GitHub Pages enforces a 100 MB
  per-file limit and a 1 GB soft repo limit.
- For longer or larger clips, host on a service that allows anonymous
  uploads (e.g. an anonymous Google Drive link, Streamable, or
  Internet Archive) and link from the page rather than embedding.
- Strip metadata: ffmpeg's default output is fine, but check that filenames
  do not contain author names.
