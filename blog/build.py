import os
import re
from datetime import datetime

BLOG_DIR = "./"
BLOGFRAME_PATH = "blogframe.html"
INDEX_PATH = "index.html"

with open(BLOGFRAME_PATH, "r", encoding="utf-8") as f:
    blogframe_html = f.read()

blogs = []

for filename in sorted(os.listdir(BLOG_DIR)):
    if not filename.endswith(".txt"):
        continue

    path = os.path.join(BLOG_DIR, filename)

    koushinDay = os.path.getctime(path)
    date_obj = datetime.fromtimestamp(koushinDay)
    hiduke = date_obj.strftime("%Y-%m-%d")

    with open(path, "r", encoding="utf-8") as f:
        text = f.read().strip()

    lines = text.splitlines()
    title_line = lines[0].strip("# ").strip() if lines else "( U̴̺͎͙̔͆̔n̴͙̦̟͛̾͝t̸̼̘̺͑̽̽i̸̝͖̻͋̿͊t̴͉͎̟͊͒̕l̸̝̞͒̕̕è̴͉̫̫̒̓d̴̙͎̟̓͝͝ )"
    body_md = "\n".join(lines[1:])

    html_body = body_md
    
    #構文無視　``````
    blocks = []
    def protect_block(match):
        inner = match.group(1)
        blocks.append(inner)
        return f"__BLOCK_{len(blocks)-1}__"
    pattern = re.compile(r"^```[ \t]*$\n((?:(?!^```[ \t]*$)[\s\S])+?)^```[ \t]*$", flags=re.MULTILINE)
    html_body = re.sub(pattern, protect_block, body_md)

    #タイトル関連
    toc = []
    def anchorize(title):
        return re.sub(r'\W+', '-', title)
    def repl(m):
        level = len(m.group(1))
        title = m.group(2).strip()
        anchor = anchorize(title)
        toc.append((level, title, anchor))
        return f'<h{level} id="{anchor}">{title}</h{level}>'
    # h1h2
    html_body = re.sub(r"^(#{1,2})\s+(.+)$", repl, html_body, flags=re.MULTILINE)

    #目次生成
    if len(toc) > 3:
        toc_html = '<div class="目次"><h4>目次</h4>'
        for level, title, anchor in toc:
            cls = ' class="h2"' if level == 2 else ''
            toc_html += f'<a href="#{anchor}"{cls}>{title}</a><br>'
        toc_html += '</div>\n'
        html_body = toc_html + html_body

    #h3
    html_body = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html_body, flags=re.MULTILINE)
    
    #注釈 <本文。{注釈}>
    html_body = re.sub(
        r"<([^>{]+)\{([^}]+)\}>",
        r'<span class="カーソルを"><span>\1</span><span>\2</span></span>',
        html_body,
    )
    
    #画像 [i URL]
    html_body = re.sub(r"\[i\s+([^\]]+)\]", r'<img alt="" src="blog_img/\1">', html_body)
    
    #小さい文字 [s なんとかかんとか]
    html_body = re.sub(r"\[s\s+([^\]]+)\]", r'<span class="小さい文字">\1</span>', html_body)
    
    #箇条書き [- なんとかかんとか]
    def replace_bullets(text):
        pattern = re.compile(r"\[-\s*([^\[\]]+?)\s*\]")
        while re.search(pattern, text):
            text = re.sub(pattern, r'<span class="箇条書き">\1</span>', text)
        return text
    html_body = replace_bullets(html_body)
    
    #引用 [> なんとかかんとか]
    html_body = re.sub(r"\[>\s+([^\]]+)\]", r'<div class="引用"><span>\1</span></div>', html_body)
    
    #中央揃え [c なんとかかんとか]
    html_body = re.sub(r"\[c\s+([^\]]+)\]", r'<div class="コメント文字">\1</div>', html_body)
    
    #リンク [なんとかかんとか URL]
    html_body = re.sub(r"\[([^\]\[]+?)\s+([^\]\s]+)\]", r'<a href="\2">\1</a>', html_body)
    
    #リンク [URL]
    html_body = re.sub(r"\[([^\]\s]+)\]", r'<a href="\1">\1</a>', html_body)
    
    #Youtube 埋め込み
    html_body = re.sub(
    r"(?:https://www\.youtube\.com/watch\?v=|https://youtu\.be/)([^&\s\?]+)(?:[^\s]*)?",
    r'<iframe src="https://www.youtube.com/embed/\1" allow="picture-in-picture" allowfullscreen></iframe>',
    html_body
    )
    
    #Twitter 埋め込み
    html_body = re.sub(
    r"https://x\.com/([A-Za-z0-9_]+)/status/(\d+)",
    r'<blockquote class="twitter-tweet"><a href="https://twitter.com/\1/status/\2"></a></blockquote>'
    r'<script async src="https://platform.twitter.com/widgets.js"></script>',
    html_body
    )
    
    #改行
    html_body = re.sub(r"\r\n|\r|\n", "<br>\n", html_body)
    
    img_match = re.search(r'<img[^>]+src="([^"]+)"', html_body)
    first_img = img_match.group(1) if img_match else ""
    
    for i, block in enumerate(blocks):
        html_body = html_body.replace(f"__BLOCK_{i}__", block)
        
    #-ここまで構文弄り-
    summary_text = re.sub(r'<div class="目次">.*?</div>', '', html_body, flags=re.DOTALL)
    summary_text = re.sub(r'<span class="カーソルを">.*?</span>', '', summary_text, flags=re.DOTALL)
    summary_text = re.sub(r"<[^>]+>", "", summary_text).strip()
    summary_text = re.sub(r"\s+", " ", summary_text)

    meta_summary = summary_text[:20] + "..." if len(summary_text) > 20 else summary_text
    summary_100 = summary_text[:100] + "..." if len(summary_text) > 100 else summary_text

    full_html = blogframe_html

    full_html = re.sub(
        r'<ブログの中身>',
        f'\n<h1>{title_line}</h1>\n{html_body}\n',
        full_html,
        flags=re.DOTALL,
    )

    #head差し替え
    output_filename = f"{hiduke}.html"
    if output_filename != "index.html":
        full_html = re.sub(
            r"<title>.*?</title>",
            f"<title>{title_line} ( 𝐼𝑑𝑒𝑜𝑎𝑣𝑒𝑠 )</title>",
            full_html,
        )
        full_html = re.sub(
            r'<meta name="description" content="[^"]*">',
            f'<meta name="description" content="{meta_summary}">',
            full_html,
        )
        full_html = re.sub(
            r'<meta name="twitter:title" content="[^"]*">',
            f'<meta name="twitter:title" content="{title_line}">',
            full_html,
        )
        full_html = re.sub(
            r'<meta name="twitter:description" content="[^"]*">',
            f'<meta name="twitter:description" content="{meta_summary}">',
            full_html,
        )
        full_html = re.sub(
            r'<meta name="twitter:image" content="[^"]*">',
            f'<meta name="twitter:image" content="{first_img}">',
            full_html,
        )

    with open(output_filename, "w", encoding="utf-8") as f:
        f.write(full_html)

    blogs.append({
        "filename": output_filename,
        "title": title_line,
        "img": first_img,
        "summary": summary_100,
        "date": hiduke,
        "koushinDay": koushinDay,
    })

#index.html
blogs.sort(key=lambda b: b["koushinDay"], reverse=True)

index_content = ""
for b in blogs:
    index_content += f"""
<a class="ブログ" href="{b['filename']}">
    <div class="ブログのサムネイル">
        <img alt="" src="{b['img']}">
    </div>
    <div class="ブログのタイトル">
        <h2>{b['title']}</h2>
    </div>
    <div class="ブログの投稿時間">{b['date']}</div>
    <div class="ブログの最初">
        {b['summary']}<br>
    </div>
</a>
"""

index_html = blogframe_html
index_html = re.sub(
    r'<div class="横に狭い分類">.*?</div>.*?</div>.*?</div>',
    f'<div class="横に狭い分類">\n{index_content}',
    index_html,
    flags=re.DOTALL,
)

with open(INDEX_PATH, "w", encoding="utf-8") as f:
    f.write(index_html)

print("ブログ更新　いえい。")
