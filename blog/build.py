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
        
    # 本文から 'id=著者名' の記述を探して、著者IDを取得するよ。
    id_match = re.search(r'^id=(.*)', text, re.MULTILINE)
    author_id = id_match.group(1).strip() if id_match else ""

    # 著者IDの記述を本文から削除し、タイトル行と本文に分割するよ。
    text = re.sub(r'^id=.*\r?\n?', '', text, flags=re.MULTILINE).strip()
    lines = text.splitlines()
    title_line = lines[0].strip("# ").strip() if lines else "( U̴̺͎͙̔͆̔n̴͙̦̟͛̾͝t̸̼̘̺͑̽̽i̸̝͖̻͋̿͊t̴͉͎̟͊͒̕l̸̝̞͒̕̕è̴͉̫̫̒̓d̴̙͎̟̓͝͝ )"
    body_md = "\n".join(lines[1:])

    html_body = body_md
    
    # --- ここからMarkdown風オリジナル構文をHTMLに変換していくよ ---

    # ```で囲まれたコードブロックを、他の正規表現処理から保護するために一時的に置き換えるよ。
    blocks = []
    def protect_block(match):
        inner = match.group(1)
        blocks.append(inner)
        return f"__BLOCK_{len(blocks)-1}__"
    pattern = re.compile(r"^```[ \t]*$\n((?:(?!^```[ \t]*$)[\s\S])+?)^```[ \t]*$", flags=re.MULTILINE)
    html_body = re.sub(pattern, protect_block, body_md)

    # h1, h2, h3の見出し（#, ##, ###）をHTMLタグに変換するよ。同時に目次用の情報も集めるよ。
    toc = []
    def anchorize(title):
        return re.sub(r'\W+', '-', title)
    def repl(m):
        hashes = m.group(1)
        level = len(hashes)
        title = m.group(2).strip()
        anchor = anchorize(title)
        if level <= 2: # h1とh2のみを目次に追加するよ。
            toc.append((level, title, anchor))
        return f'<h{level} id="{anchor}">{title}</h{level}>'
    html_body = re.sub(r"^(#{1,3})\s+(.+?)(?:\r?\n|$)", repl, html_body, flags=re.MULTILINE)

    # 目次HTMLを生成して記事の先頭に追加するよ。
    if len(toc) > 3:
        toc_html = '<div class="目次"><h4>目次</h4>'
        for level, title, anchor in toc:
            cls = ' class="h2"' if level == 2 else ''
            toc_html += f'<a href="#{anchor}"{cls}>{title}</a><br>'
        toc_html += '</div>\n'
        html_body = toc_html + html_body
    
    # 注釈構文 <本文{注釈}> をカーソルを合わせると表示されるHTMLに変換するよ。
    html_body = re.sub(
        r"<([^>{]+)\{([^}]+)\}>",
        r'<span class="カーソルを"><span>\1</span><span>\2</span></span>',
        html_body,
    )
    
    # 画像構文 [i ファイル名] を<img>タグに変換するよ。URLの場合はそのまま、ファイル名の場合はblog_img/を付けるよ。
    def replace_image_tag(match):
        image_path = match.group(1)
        if image_path.startswith("http"):
            src = image_path
        else:
            src = f"blog_img/{image_path}"

        if image_path.lower().endswith(('.mp4', '.webm', '.mov')):
            return f'<video class="ブログの映像" src="{src}" controls loop></video>'
        else:
            return f'<img alt="" class="ブログの画像" src="{src}">'
    html_body = re.sub(r"\[i\s+([^\]]+)\]", replace_image_tag, html_body)
    
    # 小さい文字構文 [s 文字] を<span>タグに変換するよ。
    html_body = re.sub(r"\[s\s+([^\]]+)\]", r'<span class="小さい文字">\1</span>', html_body)
    
    # 箇条書き構文 [- 内容] を<span>タグに変換するよ。
    def replace_bullets(text):
        pattern = re.compile(r"\[-\s*([^\[\]]+?)\s*\]")
        while re.search(pattern, text):
            text = re.sub(pattern, r'<span class="箇条書き">\1</span>', text)
        return text
    html_body = replace_bullets(html_body)
    
    # 特例：引用ブロック内のネストしたリンクを先に処理するよ。
    def process_nested_links_in_quotes(text):
        # 改行を一時的に特殊文字に置き換えるよ。
        temp_text = text.replace('\n', '__NEWLINE__')
        
        def replace_nested_quote(match):
            content = match.group(1)
            # 特殊文字を改行に戻すよ。
            content = content.replace('__NEWLINE__', '\n')
            # 内容内の [テキスト URL] 形式を<a>タグに変換するよ。
            content = re.sub(r"\[([^\]\[]+?)\s+([^\]\s]+)\]", r'<a href="\2">\1</a>', content)
            # 内容内の [URL] 形式を<a>タグに変換するよ。
            content = re.sub(r"\[([^\]\s]+)\]", r'<a href="\1">\1</a>', content)
            return f'<div class="引用"><span>{content}</span></div>'
        
        # 引用ブロックを正確にマッチさせるよ。[> から対応する ] まで
        def find_quote_blocks(text):
            import re
            pattern = re.compile(r'\[>\s+((?:[^\[\]]|\[[^\]]*\])*)\]')
            return pattern.sub(replace_nested_quote, text)
        
        result = find_quote_blocks(temp_text)
        return result.replace('__NEWLINE__', '\n')
    
    html_body = process_nested_links_in_quotes(html_body)
    
    # 引用構文 [> 内容] を<div>タグに変換するよ。（ネストしていない通常の引用）
    html_body = re.sub(r"\[>\s+([^\]]+)\]", r'<div class="引用"><span>\1</span></div>', html_body)
    
    # 中央揃え構文 [c 内容] を<div>タグに変換するよ。
    html_body = re.sub(r"\[c\s+([^\]]+)\]", r'<div class="コメント文字">\1</div>', html_body)
    
    # 他のブログ記事へのリンクをブログカード形式に変換するよ。
    def create_blog_card(match):
        blog_filename = match.group(1)
        # blogs_dataに記事情報があるか確認するよ。
        blog_info = blogs_data.get(blog_filename)

        if blog_info:
            # 記事情報が見つかったら、index.htmlと同じ形式のHTMLを生成するよ。
            return (f'<a class="ブログ カード" href="{blog_info.get("filename", "")}">'
                    f'<div class="ブログのサムネイル"><img alt="" src="{blog_info.get("img", "")}"></div>'
                    f'<div class="ブログのタイトル"><h2>{blog_info.get("title", "")}</h2></div>'
                    f'<div class="ブログの投稿時間">{blog_info.get("date", "")}</div>'
                    f'<div class="ブログの最初">{blog_info.get("summary", "")}<br></div>'
                    '</a>')
        return match.group(0)
    html_body = re.sub(r"\[blog\s+((?:https?://ideoaves\.github\.io/blog/)?[\w-]+\.html)\]", create_blog_card, html_body)
    
    # [テキスト URL] 形式のリンクを<a>タグに変換するよ。
    html_body = re.sub(r"\[([^\]\[]+?)\s+([^\]\s]+)\]", r'<a href="\2">\1</a>', html_body)
    
    # [URL] 形式のリンクを<a>タグに変換するよ。
    html_body = re.sub(r"\[([^\]\s]+)\]", r'<a href="\1">\1</a>', html_body)
    
    # YouTubeのURLを埋め込み用<iframe>に変換するよ。
    html_body = re.sub(
    r"(?:https://www\.youtube\.com/watch\?v=|https://youtu\.be/)([^&\s\?]+)(?:[^\s]*)?",
    r'<iframe src="https://www.youtube.com/embed/\1" allow="picture-in-picture" allowfullscreen></iframe>',
    html_body
    )
    
    # Twitter(X)のURLを埋め込み用blockquoteに変換するよ。
    html_body = re.sub(
    r"(?<![\"'>])https://(?:x|twitter)\.com/([A-Za-z0-9_]+)/status/(\d+)[^\s]*",
    r'<blockquote class="twitter-tweet"><a href="https://twitter.com/\1/status/\2"></a></blockquote>'
    r'<script async src="https://platform.twitter.com/widgets.js"></script>',
    html_body
    )
    
    # 残った改行文字を<br>タグに変換するよ。
    html_body = re.sub(r"\r\n|\r|\n", "<br>\n", html_body)
    
    # 記事内で最初に見つかった画像をサムネイル用に取得するよ。
    img_match = re.search(r'<img[^>]+src="([^"]+)"', html_body)
    first_img = img_match.group(1) if img_match else ""
    
    # 保護していたコードブロックを元の<pre><code>ブロックに戻すよ。
    for i, block in enumerate(blocks):
        html_body = html_body.replace(f"__BLOCK_{i}__", block)
        
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
