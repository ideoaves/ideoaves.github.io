(function(thisObj) {
    
    function createUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "歌詞書き換え");
        win.orientation = "column";

        var resultLabel = win.add("statictext", undefined, "");
        win.add("button", undefined, "書き換え").onClick = replaceLyrics;
        
        function replaceLyrics() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                return;
            }
            
            var repLayer = comp.repLayer;
            if (repLayer.length === 0) {
                resultLabel.text = "レイヤー選択して。";
                return;
            }
            
            var lyrics = win.add("edittext", undefined, "").text;
            if (lyrics === "") {
                resultLabel.text = "歌詞いれてね。";
                return;
            }
            
            // 文字レイヤーのみを抽出し、Indexの降順にソート
            var textLayers = [];
            for (var i = 0; i < repLayer.length; i++) {
                var layer = repLayer[i];
                if (layer instanceof TextLayer) {
                    textLayers.push(layer);
                }
            }
            
            if (textLayers.length === 0) {
                resultLabel.text = "文字レイヤーを選択して。";
                return;
            }

            textLayers.sort(function(a, b) {
                return b.index - a.index;
            });
            
            var lyricsArray = [];
            for (var j = 0; j < lyrics.length; j++) {
                lyricsArray.push(lyrics.charAt(j));
            }
            var replaceCount = Math.min(textLayers.length, lyricsArray.length);
            
            app.beginUndoGroup("歌詞書き換え");
            
            try {
                for (var k = 0; k < replaceCount; k++) {
                    var textLayer = textLayers[k];
                    var newText = lyricsArray[k];
                    
                    var textProp = textLayer.property("Source Text");
                    if (textProp) {
                        textProp.setValue(newText);
                    }
                }
                
                resultLabel.text = replaceCount + "個の歌詞を書き換えたよ";
            } catch (e) {
                resultLabel.text = "エラー！！" + e.message;
            } finally {
                app.endUndoGroup();
            }
        }
        
        win.layout.layout(true);
        win.onResizing = win.onResize = function () {
            win.layout.resize();
        };
        
        return win;
    }

    var ui = createUI(thisObj);
    if (ui instanceof Window) {
        ui.show();
    } else {
        ui.layout.layout(true);
    }
    
})(this);