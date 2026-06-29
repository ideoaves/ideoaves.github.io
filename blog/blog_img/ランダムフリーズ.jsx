(function() {
    
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("コンポジション選んで。");
        return;
    }

    app.beginUndoGroup("seedRandom追加");
    
    var repLayer = 0;
    var repEffect = 0;
    
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        var layerName = layer.name;
        processProperties(layer, layer, layerName);
    }

    if (repLayer > 0) {
        alert(repLayer + "個のレイヤーで\n" + repEffect + "個のプロパティを弄ったよ。");
    } else {
        alert("random()もwiggle()も無いです。");
    }

    app.endUndoGroup();
    
    function processProperties(layer, property, layerName) {
        if (property.propertyType === PropertyType.PROPERTY) {
            if (property.canSetExpression && property.expressionEnabled) {
                var expression = property.expression;
                if (expression) {
                    if (expression.indexOf("random(") !== -1 || expression.indexOf("wiggle(") !== -1) {
                        if (expression.indexOf("seedRandom(") === -1) {
                            // seedrandomを追加
                            var freezeRandom = 'seedRandom(' + layer.index + ', false);\n' + expression;
                            property.expression = freezeRandom;
                            
                            repEffect++;
                            if (repEffect === 1) {
                                repLayer++;
                            }
                        } else {
                            // 既存のseedRandomを書き換え
                            var freezeRandom = expression.replace(/seedRandom\(\s*index\s*,/g, 'seedRandom(' + layer.index + ',');
                            if (freezeRandom !== expression) {
                                property.expression = freezeRandom;
                                
                                repEffect++;
                                if (repEffect === 1) {
                                    repLayer++;
                                }
                            }
                        }
                    }
                }
            }
        }

        // 子プロパティを再帰的に処理
        if (property.numProperties > 0) {
            for (var j = 1; j <= property.numProperties; j++) {
                try {
                    processProperties(layer, property.property(j), layerName);
                } catch (e) {
                }
            }
        }
    }
    
})();
