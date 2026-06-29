app.beginUndoGroup("Add/Re-use Slider Control + Expression");

var comp = app.project.activeItem;
if (!(comp instanceof CompItem)) {
    alert("コンポジションを選択してね");
} else {
    var props = comp.selectedProperties;

    if (props.length === 0) {
        alert("プロパティを選択してね");
    } else {
        for (var i = 0; i < props.length; i++) {
            var p = props[i];
            if (!p.canSetExpression) continue;

            var layer = p.propertyGroup(p.propertyDepth);
            var effects = layer.property("ADBE Effect Parade");

            function getOrCreateSlider(name) {
                for (var j = 1; j <= effects.numProperties; j++) {
                    var ef = effects.property(j);
                    if (ef.matchName === "ADBE Slider Control" && ef.name === name) {
                        return ef;
                    }
                }
                var s = effects.addProperty("ADBE Slider Control");
                s.name = name;
                return s;
            }

            if (
                p.matchName === "ADBE Position" ||
                p.matchName === "ADBE Position_0" ||
                p.matchName === "ADBE Position_1" ||
                p.matchName === "ADBE Position_2"
            ) {

                var axes = ["X", "Y", "Z"];

                if (p.matchName !== "ADBE Position") {

                    var axisIndex = parseInt(p.matchName.split("_")[1], 10);
                    var sliderName = "Position " + axes[axisIndex];

                    getOrCreateSlider(sliderName);

                    var sliderPath = 'effect("' + sliderName + '")(1)';
                    p.expression = "value + " + sliderPath;

                } else {
                    var dim = p.value.length;
                    var paths = [];

                    for (var d = 0; d < dim; d++) {
                        var sliderName = "Position " + axes[d];
                        getOrCreateSlider(sliderName);
                        paths.push('effect("' + sliderName + '")(1)');
                    }

                    p.expression = "value + [" + paths.join(",") + "]";
                }

            } else if (p.matchName === "ADBE Scale") {

                var sliderName = p.name;
                getOrCreateSlider(sliderName);

                var sliderPath = 'effect("' + sliderName + '")(1)';
                var dim = p.value.length;
                var arr = [];

                for (var d = 0; d < dim; d++) {
                    arr.push(sliderPath);
                }

                p.expression = "value + [" + arr.join(",") + "]";

            } else {
                var sliderName = p.name;
                getOrCreateSlider(sliderName);

                var sliderPath = 'effect("' + sliderName + '")(1)';

                if (typeof p.value === "number") {
                    p.expression = "value + " + sliderPath;
                } else {
                    var dim = p.value.length;
                    var arr = [];
                    for (var d = 0; d < dim; d++) {
                        arr.push(sliderPath);
                    }
                    p.expression = "value + [" + arr.join(",") + "]";
                }
            }
        }
    }
}

app.endUndoGroup();