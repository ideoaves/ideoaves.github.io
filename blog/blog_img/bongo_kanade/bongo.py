import tkinter as tk
import random
import os
import time
import unicodedata

try:
    import pygame
    from pynput import mouse, keyboard
except ImportError:
    pygame = None
    mouse = None
    keyboard = None
    print("pygameとpyput入れてね: pip install pygame pynput")

class BongoKanade:
    def __init__(self, root):
        self.root = root
        self.click_count = 0
        self.anim_timer = None
        self.serif_timer = None
        self.last_event_time = 0
        self.last_run_had_voice = False
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.cx = 0
        self.cy = 0

        #ウィンドウ設定: 枠なし、最前面だよ。
        self.root.overrideredirect(True)
        self.root.wm_attributes("-topmost", True)

        #透過設定
        #Transparent一回色塗らないとダメそうですね
        self.transparent_color = '#000001'
        self.root.config(bg=self.transparent_color)
        self.root.wm_attributes("-transparentcolor", self.transparent_color)

        #リソース読み込み
        self.imgLoad()

        #UI構築
        self.setup_ui()

        #初期位置合わせ (右下)
        self.update_position()

        #pygame初期化
        if pygame:
            pygame.mixer.init()

        #グローバル入力の監視を開始
        if mouse and keyboard:
            self.input_sensor()

        # ウィンドウ内クリックイベントのバインド
        self.root.bind_all("<Button-1>", self.speak)
        
        # ウィンドウ移動用のバインド（標準的な実装）
        self.root.bind("<ButtonPress-1>", self.start_move, add='+')
        self.root.bind("<B1-Motion>", self.do_move, add='+')

    def imgLoad(self):
        sh = self.root.winfo_screenheight()

        def load_img(name):
            path = os.path.join(self.base_path, name)
            if os.path.exists(path):
                scale = 2
                img = tk.PhotoImage(file=path)
                return img.subsample(scale)
            return tk.PhotoImage()

        self.img_def = load_img("def.png")
        self.img_hand = load_img("hand.png")
        self.img_knock1 = load_img("knock1.png")
        self.img_knock2 = load_img("knock2.png")
        self.img_quiet = load_img("quiet.png")
        self.img_speak = load_img("speak.png")
        self.img_hat = load_img("hat.png")
        self.img_hat1 = load_img("hat1.png")
        self.img_hat2 = load_img("hat2.png")
        
        self.img_serifB = load_img("serif_b.png")
        self.img_countB = load_img("count_b.png")
        self.img_empty = tk.PhotoImage()

        self.voices = []
        self.voice_texts = []
        voice_dir = os.path.join(self.base_path, "vo")
        if os.path.exists(voice_dir):
            for fn in os.listdir(voice_dir):
                if fn.lower().endswith((".mp3", ".wav", ".ogg")):
                    self.voices.append(os.path.join("vo", fn))
                    self.voice_texts.append(unicodedata.normalize("NFC", os.path.splitext(fn)[0]))

    def setup_ui(self):
        #サイズ
        w = self.img_def.width() if self.img_def.width() > 0 else 200
        h = self.img_def.height() if self.img_def.height() > 0 else 200

        self.canvas = tk.Canvas(self.root, width=w, height=h + 100, 
                                bg=self.transparent_color, highlightthickness=0)
        self.canvas.pack()

        self.cx = w // 2
        self.cy = (h // 2 - 15) + 100

        #def
        self.canvas.create_image(self.cx, self.cy, image=self.img_def)
        self.canvas.create_image(self.cx, self.cy, image=self.img_quiet, tags="mouth")
        self.canvas.create_image(self.cx, self.cy-5, image=self.img_hand, tags="hand")
        self.canvas.create_image(self.cx, self.cy, image=self.img_hat, tags="hat")

        
        #セリフ
        sh = self.img_serifB.height()
        sy = 90 + sh // 2
        self.canvas.create_image(self.cx, sy, image=self.img_empty, tags="serif_bg", anchor="center")
        self.canvas.create_text(self.cx, sy, text="", font=("Noto Sans CJK JP", 12,), 
                                fill="black", tags="serif_text", anchor="center")

        #カウント
        ch = self.img_countB.height()
        cy_count = (h + 95) - ch // 2
        self.canvas.create_image(self.cx, cy_count, image=self.img_countB, tags="count_bg", anchor="center")
        self.canvas.create_text(self.cx, cy_count, text=str(self.click_count), 
                                font=("Noto Sans CJK JP", 14, "bold"), fill="black", 
                                tags="count_text", anchor="center")

    #ウィンドウの位置、マウスで移動もできるよ
    def update_position(self):
        self.root.update_idletasks()
        sw = self.root.winfo_screenwidth()
        sh = self.root.winfo_screenheight()
        w = self.root.winfo_width()
        h = self.root.winfo_height()
        self.root.geometry(f"+{sw - w - 20}+{sh - h - 40}")

    def start_move(self, event):
        self.last_click_x = event.x
        self.last_click_y = event.y

    def do_move(self, event):
        x = self.root.winfo_x() + event.x - self.last_click_x
        y = self.root.winfo_y() + event.y - self.last_click_y
        self.root.geometry(f"+{x}+{y}")

    # 入力判定だよ
    def input_sensor(self):
        self.mouse_listener = mouse.Listener(on_click=self.onClick)
        self.keyboard_listener = keyboard.Listener(on_press=self.onKey)
        self.mouse_listener.start()
        self.keyboard_listener.start()

    def onClick(self, x, y, button, pressed):
        if pressed:
            self.root.after(0, self.BONG)

    def onKey(self, key):
        self.root.after(0, self.BONG)

    def speak(self, event=None):
        self.BONG(event, speak=True)

    def BONG(self, event=None, speak=False):
        now = time.time()
        is_cooldown = (now - self.last_event_time < 0.1)

        # クールダウン
        if is_cooldown:
            if speak and not self.last_run_had_voice:
                pass
            else:
                return
        else:
            self.last_event_time = now
            self.click_count += 1
            self.canvas.itemconfig("count_text", text=str(self.click_count))

            if self.click_count >= 2026:
                self.canvas.itemconfig("hat", image=self.img_hat2)
            elif self.click_count >= 928:
                self.canvas.itemconfig("hat", image=self.img_hat1)
            else:
                self.canvas.itemconfig("hat", image=self.img_hat)

        self.last_run_had_voice = speak

        if self.voices:
            tr = random.randint(0, len(self.voices) - 1)
        else:
            tr = -1

        if speak and tr >= 0:
            # 音声再生
            if pygame:
                try:
                    pygame.mixer.music.load(os.path.join(self.base_path, self.voices[tr]))
                    pygame.mixer.music.play()
                except Exception:
                    pass
            self.canvas.itemconfig("serif_text", text=self.voice_texts[tr])
            self.canvas.itemconfig("serif_bg", image=self.img_serifB)
            self.canvas.itemconfig("mouth", image=self.img_speak)
        else:
            self.canvas.itemconfig("mouth", image=self.img_quiet)

        #bong!
        knock_img = self.img_knock1 if self.click_count % 2 == 0 else self.img_knock2
        
        

        self.canvas.delete("hand")
        self.canvas.create_image(self.cx, self.cy-5, image=knock_img, tags="hand")

        #リセット
        if self.anim_timer:
            self.root.after_cancel(self.anim_timer)
        self.anim_timer = self.root.after(500, self.reset_body)

        if self.serif_timer:
            self.root.after_cancel(self.serif_timer)
        self.serif_timer = self.root.after(1200, self.reset_serif)

    def reset_body(self):
        self.canvas.delete("hand")
        self.canvas.create_image(self.cx, self.cy-5, image=self.img_hand, tags="hand")

    def reset_serif(self):
        self.canvas.itemconfig("serif_text", text="")
        self.canvas.itemconfig("serif_bg", image=self.img_empty)
        self.canvas.itemconfig("mouth", image=self.img_quiet)

if __name__ == "__main__":
    root = tk.Tk()
    app = BongoKanade(root)
    root.mainloop()