"""One-time helper: extract images from the lab's .docx files in document order,
printing the nearest preceding text so each image can be mapped to its section."""
import re, sys, zipfile, pathlib

src = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)

for docx in sorted(src.glob("*.docx")):
    z = zipfile.ZipFile(docx)
    rels = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="(media/[^"]+)"', z.read("word/_rels/document.xml.rels").decode()))
    xml = z.read("word/document.xml").decode()
    stem = re.sub(r"[^a-z0-9]+", "-", docx.stem.lower()).strip("-")
    last_text, n = "", 0
    for m in re.finditer(r'<w:t[^>]*>([^<]*)</w:t>|r:embed="(rId\d+)"', xml):
        if m.group(1):
            if m.group(1).strip():
                last_text = (last_text + " " + m.group(1)).strip()[-70:]
        elif m.group(2) in rels:
            n += 1
            target = rels[m.group(2)]
            name = f"{stem}-{n:02d}{pathlib.Path(target).suffix.lower()}"
            (out / name).write_bytes(z.read("word/" + target))
            print(f"{name}\t<- ...{last_text}")
