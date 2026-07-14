import os
import re
from datetime import datetime
import json

# ファイルパスなどの定数を設定するよ。
BLOG_DIR = "./"
BLOGFRAME_PATH = "blogframe.html"
INDEX_PATH = "index.html"
JSON_PATH = "bloglist.json"

# ブログ記事ページのHTMLテンプレートを読み込むよ。
with open(BLOGFRAME_PATH, "r", encoding="utf-8") as f:
    blogframe_html = f.read()

# bloglist.jsonから既存のブログデータを読み込むよ。ファイルがなければ空の辞書で始めるよ。
try:
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        blogs_data = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    blogs_data = {}

# jsonに記載されているが、対応する.htmlファイルが削除されている記事の情報をjsonデータから削除するよ。
keys_to_delete = []
for blog_filename in blogs_data:
    if not os.path.exists(os.path.join(BLOG_DIR, blog_filename)):
        keys_to_delete.append(blog_filename)
for key in keys_to_delete:
    del blogs_data[key]

# このスクリプトで処理したファイル名を記録しておくためのセットを用意するよ。
processed_filenames = set()

# 見出しのテキストから目次用のアンカー文字列を作るよ。
def anchorize(title):
    return re.sub(r'\W+', '-', title)

# [ ] で囲まれたインライン構文をHTMLに変換するよ。[> ]や[c ]の中に別の[...]構文がネストすることが
# あるため、深さを数えながら対応する外側の"]"を探し、中身を再帰的に処理してから外側をラップする。
def process_inline(text, top_level=True):
    result = []
    i = 0
    n = len(text)
    while i < n:
        if text[i] == "[":
            depth = 1
            j = i + 1
            while j < n and depth > 0:
                if text[j] == "[":
                    depth += 1
                elif text[j] == "]":
                    depth -= 1
                j += 1
            if depth == 0:
                content = text[i + 1:j - 1]
                result.append(convert_bracket(content, top_level))
                i = j
                continue
        result.append(text[i])
        i += 1
    return "".join(result)

# top_levelは、この[...]が本文に直接書かれたもの（True）か、他の[...]構文の中にネストしたもの（False）かを表すよ。
# YouTube/Twitterの埋め込みは、注釈や引用などにネストした状態だとうまく表示できないため、トップレベルのときだけ行う。
def convert_bracket(content, top_level=True):
    if content.startswith("i "):
        filename = content[2:].strip()
        return f'<img alt="" class="ブログの画像" src="blog_img/{filename}">'

    if content.startswith("s "):
        return f'<span class="小さい文字">{process_inline(content[2:].strip(), top_level=False)}</span>'

    if content.startswith("> "):
        return f'<span class="引用">{process_inline(content[2:].strip(), top_level=False)}</span>'

    if content.startswith("c "):
        return f'<span class="コメント文字">{process_inline(content[2:].strip(), top_level=False)}</span>'

    cursor_m = re.match(r'^(.+?)\s+\{(.+)\}$', content, re.DOTALL)
    if cursor_m:
        text_a = process_inline(cursor_m.group(1), top_level=False)
        text_b = process_inline(cursor_m.group(2), top_level=False)
        return f'<span class="カーソルを"><span>{text_a}</span><span>{text_b}</span></span>'

    link_m = re.match(r'^(.+?)\s+(\S+)$', content, re.DOTALL)
    if link_m:
        text_part, url_part = link_m.group(1), link_m.group(2)
        return f'<a href="{url_part}">{process_inline(text_part, top_level=False)}</a>'

    # ここまでで判定できなければ、中身は単独の [URL] として扱うよ。
    url = content.strip()

    if top_level:
        tweet_m = re.search(r'(?:x|twitter)\.com/([A-Za-z0-9_]+)/status/(\d+)', url)
        if tweet_m:
            return (f'<blockquote class="twitter-tweet"><a href="https://twitter.com/{tweet_m.group(1)}/status/{tweet_m.group(2)}"></a></blockquote>'
                    f'<script async src="https://platform.twitter.com/widgets.js"></script>')

        yt_m = re.match(r'(?:https://www\.youtube\.com/watch\?v=|https://youtu\.be/)([^&\s\?]+)', url)
        if yt_m:
            return f'<iframe src="https://www.youtube.com/embed/{yt_m.group(1)}" allow="picture-in-picture" allowfullscreen></iframe>'

    return f'<a href="{url}">{url}</a>'

# ブログディレクトリ内のファイルを一つずつ処理するループだよ。
for filename in sorted(os.listdir(BLOG_DIR)):
    if not filename.endswith(".txt"):
        continue

    # ファイル名からHTMLファイル名や日付情報を作成するよ。
    path = os.path.join(BLOG_DIR, filename)
    hiduke = filename.rsplit(".", 1)[0]
    output_filename = f"{hiduke}.html"
    processed_filenames.add(output_filename)

    date_str = hiduke[:10]

    # テキストファイルを読み込むよ。
    with open(path, "r", encoding="utf-8") as f:
        text = f.read().strip()
        
    # 1行目は常にタイトル、2行目が 'id=' から始まっていれば著者IDとして扱うよ。
    file_lines = text.splitlines()
    title_line = file_lines[0].strip() if file_lines else "( U̴̺͎͙̔͆̔n̴͙̦̟͛̾͝t̸̼̘̺͑̽̽i̸̝͖̻͋̿͊t̴͉͎̟͊͒̕l̸̝̞͒̕̕è̴͉̫̫̒̓d̴̙͎̟̓͝͝ )"
    rest_lines = file_lines[1:]

    author_id = ""
    if rest_lines and rest_lines[0].strip().startswith("id="):
        author_id = rest_lines[0].strip()[len("id="):].strip()
        body_lines = rest_lines[1:]
    else:
        body_lines = rest_lines

    # 本文を段落・見出し・箇条書きのブロックに分解し、それぞれHTMLに変換していくよ。
    blocks = []
    toc = []
    paragraph_buf = []
    bullet_stack = []  # 箇条書きのネストを深さで管理するスタックだよ。各フレームは<li>1個分。
    bullet_roots = []  # 現在の箇条書きの並びで、トップレベル（親を持たない）<li>を集めるよ。
    table_buf = []  # テーブル行を集めるよ。1行目がヘッダー、残りが本文行になる。

    def close_paragraph():
        if paragraph_buf:
            processed = process_inline("\n".join(paragraph_buf))
            processed = re.sub(r"\r\n|\r|\n", "<br>\n", processed)
            # 画像やTwitter埋め込みはCSS/HTMLの既定でブロック要素になり、それ自体が改行を作るため、
            # 直後の<br>は二重改行になってしまう。例外的にそこだけ<br>を取り除くよ。
            processed = re.sub(
                r'(<img[^>]*>|<script async src="https://platform\.twitter\.com/widgets\.js"></script>)<br>\n',
                r'\1\n',
                processed,
            )
            blocks.append(f"<p>{processed}</p>")
            paragraph_buf.clear()

    def close_bullets(min_depth):
        # 深さがmin_depth以上のフレームを閉じて<li>にし、親フレーム（なければbullet_roots）に積んでいくよ。
        while bullet_stack and bullet_stack[-1]["depth"] >= min_depth:
            frame = bullet_stack.pop()
            children_html = f'<ul>{"".join(frame["children"])}</ul>' if frame["children"] else ""
            li_html = f'<li>{frame["text"]}{children_html}</li>'
            if bullet_stack:
                bullet_stack[-1]["children"].append(li_html)
            else:
                bullet_roots.append(li_html)

    def end_bullet_run():
        # 箇条書きの並びが完全に終わったときに呼ぶ。スタックを全部閉じてから、
        # 集まったトップレベルの<li>たちを1つの<ul>にまとめてblocksへ追加するよ。
        close_bullets(0)
        if bullet_roots:
            blocks.append(f'<ul>{"".join(bullet_roots)}</ul>')
            bullet_roots.clear()

    def close_table():
        # テーブル行の並びが終わったときに呼ぶ。||で始まる行だけheadにし、それ以外はtbodyに積むよ。
        if table_buf:
            thead_html = ""
            tbody_html = ""
            for is_header, cells in table_buf:
                if is_header:
                    row_html = "".join(f"<th>{cell}</th>" for cell in cells)
                    thead_html += f"<thead><tr>{row_html}</tr></thead>"
                else:
                    row_html = "".join(f"<td>{cell}</td>" for cell in cells)
                    tbody_html += f"<tr>{row_html}</tr>"
            blocks.append(f"<table>{thead_html}<tbody>{tbody_html}</tbody></table>")
            table_buf.clear()

    for line in body_lines:
        if line.strip() == "":
            close_paragraph()
            end_bullet_run()
            close_table()
            continue

        heading_m = re.match(r"^(#{1,3})\s+(.+)$", line)
        if heading_m:
            close_paragraph()
            end_bullet_run()
            close_table()
            level = len(heading_m.group(1))
            heading_title = heading_m.group(2).strip()
            anchor = anchorize(heading_title)
            if level <= 2:  # h1とh2のみを目次に追加するよ。
                toc.append((level, heading_title, anchor))
            blocks.append(f'<h{level} id="{anchor}">{process_inline(heading_title)}</h{level}>')
            continue

        bullet_m = re.match(r"^(\s+)(\S.*)$", line)
        if bullet_m:
            close_paragraph()
            close_table()
            depth = len(bullet_m.group(1))
            close_bullets(depth)
            bullet_stack.append({
                "depth": depth,
                "text": process_inline(bullet_m.group(2).strip()),
                "children": [],
            })
            continue

        # テーブル行構文 |セル1  セル2  セル3 （セルは空白2つかタブで区切るよ）。||で始まる行はheadになる。
        table_m = re.match(r"^\|(\|?)(.*)$", line)
        if table_m:
            close_paragraph()
            end_bullet_run()
            is_header = table_m.group(1) == "|"
            cells = [process_inline(cell.strip()) for cell in re.split(r"\t| {2,}", table_m.group(2))]
            table_buf.append((is_header, cells))
            continue

        end_bullet_run()
        close_table()
        paragraph_buf.append(line)

    close_paragraph()
    end_bullet_run()
    close_table()

    # 見出しが3件より多く集まったら、記事の先頭に目次ブロックを挿入するよ。
    if len(toc) > 3:
        toc_html = '<div class="目次"><h4>目次</h4>'
        for level, toc_title, anchor in toc:
            cls = ' class="h2"' if level == 2 else ''
            toc_html += f'<a href="#{anchor}"{cls}>{toc_title}</a><br>'
        toc_html += '</div>'
        blocks.insert(0, toc_html)

    html_body = "\n".join(blocks)

    # 記事内で最初に見つかった画像をサムネイル用に取得するよ。
    img_match = re.search(r'<img[^>]+src="([^"]+)"', html_body)
    first_img = img_match.group(1) if img_match else ""

    # 著者情報があればHTMLに追加するよ。
    author_html = ""
    if author_id:
        author_html = f'<div class="作った人たち">{author_id}</div>\n'

    # --- ここからサマリーとメタ情報を生成するよ ---

    # HTMLタグなどを取り除いて、記事一覧ページに表示する要約文を生成するよ。
    summary_text = re.sub(r'<div class="目次">.*?</div>', '', html_body, flags=re.DOTALL)
    summary_text = re.sub(r'<span class="カーソルを"[^>]*><span>(.*?)</span>.*?</span>', r'\1', summary_text, flags=re.DOTALL)
    summary_text = re.sub(r"<[^>]+>", "", summary_text).strip()
    summary_text = re.sub(r"\s+", " ", summary_text)

    summary_20 = summary_text[:20] + "..." if len(summary_text) > 20 else summary_text
    summary_100 = summary_text[:100] + "..." if len(summary_text) > 100 else summary_text

    # --- ここから個別記事のHTMLファイルを生成するよ ---

    # テンプレートHTMLをベースに、記事のタイトルと本文を挿入するよ。
    full_html = blogframe_html
    full_html = re.sub(
        r'<ブログの中身>',
        f'\n<h1>{title_line}</h1>\n{author_html}{html_body}\n',
        full_html,
        flags=re.DOTALL,
    )

    # 個別記事ページの<head>内のメタ情報を、記事固有のものに差し替えるよ。
    if output_filename != "index.html":
        full_html = re.sub(
            r"<title>.*?</title>",
            f"<title>{title_line} ( 𝐼𝑑𝑒𝑜𝑎𝑣𝑒𝑠 )</title>",
            full_html,
        )
        full_html = re.sub(
            r'<meta name="description" content="[^"]*">',
            f'<meta name="description" content="{summary_20}">',
            full_html,
        )
        full_html = re.sub(
            r'<meta name="twitter:title" content="[^"]*">',
            f'<meta name="twitter:title" content="{title_line}">',
            full_html,
        )
        full_html = re.sub(
            r'<meta name="twitter:description" content="[^"]*">',
            f'<meta name="twitter:description" content="{summary_20}">',
            full_html,
        )
        full_html = re.sub(
            r'<meta name="twitter:image" content="[^"]*">',
            f'<meta name="twitter:image" content="https://ideoaves.github.io/blog/{first_img}">',
            full_html,
        )

    # 完成したHTMLをファイルとして書き出すよ。
    with open(output_filename, "w", encoding="utf-8") as f:
        f.write(full_html)

    # この記事の情報を、あとでJSONに保存するために辞書に格納するよ。
    blogs_data[output_filename] = {
        "filename": output_filename,
        "title": title_line,
        "img": first_img,
        "summary": summary_100,
        "date": date_str,
        "author": author_id,
    }

# --- ここからindex.html（記事一覧ページ）を生成するよ ---

# 辞書形式のブログデータをリストに変換するよ。
blogs = list(blogs_data.values())

# 記事を日付の新しい順に並び替えるよ。
blogs.sort(key=lambda b: b["date"], reverse=True)

# 全記事の情報を元に、記事一覧のHTMLコンテンツを生成するよ。
index_content = ""
for b in blogs:
    author_ids = ' '.join([f'{author}の記事' for author in b["author"].split()])
    index_content += (f'<a class="ブログ" id="{author_ids}" href="{b["filename"]}">'
                      f'<div class="ブログのサムネイル"><img alt="" src="{b.get("img", "")}"></div>'
                      f'<div class="ブログのタイトル"><h2>{b["title"]}</h2></div>'
                      f'<div class="ブログの投稿時間">{b["date"]}</div>'
                      f'<div class="ブログの最初">{b["summary"]}<br></div>'
                      '</a>')

# index.html用のテンプレートを読み込んで、記事一覧部分を今作ったHTMLで置き換えるよ。
index_html = blogframe_html
replacement_html = '''

<div class="横に狭い分類">
    <soan class="チェックボックスたち">
        <span class="チェックボックス">
            <input type="checkbox" id="hazuquを表示" checked>
            <label for="hazuquを表示">hazuqu</label>
        </span>

        <span class="チェックボックス">
            <input type="checkbox" id="sianを表示" checked>
            <label for="sianを表示">思案</label>
        </span>

        <span class="チェックボックス">
            <input type="checkbox" id="yimiruを表示" checked>
            <label for="yimiruを表示">yimiru</label>
        </span>

        <span class="チェックボックス">
            <input type="checkbox" id="ideoavesを表示" checked>
            <label for="ideoavesを表示">ideoaves</label>
        </span>
    </span>
</div>
<div class="横に狭い分類">
''' + index_content

index_html = re.sub(
    r'<div class="横に狭い分類">.*?</div>.*?</div>.*?</div>',
    replacement_html,
    index_html,
    flags=re.DOTALL,
)

# 完成したindex.htmlをファイルに書き出すよ。
with open(INDEX_PATH, "w", encoding="utf-8") as f:
    f.write(index_html)

# --- 最後に、更新したブログ情報をJSONファイルに保存するよ ---

# 最新のブログ情報が詰まった辞書を、bloglist.jsonファイルに書き出すよ。
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(blogs_data, f, ensure_ascii=False, indent=4)

print("ブログ更新　いえい。")
