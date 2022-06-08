


let column_no = 0; //今回クリックされた列番号
let column_no_prev = 0; //前回クリックされた列番号
window.addEventListener('load', function () {
	document.querySelectorAll('#sort_table th').forEach(elm => {
		elm.onclick = function () {
			column_no = this.cellIndex; //クリックされた列番号
			let table = this.parentNode.parentNode.parentNode;
			let sortType = 0; //0:数値 1:文字
			let sortArray = new Array; //クリックした列のデータを全て格納する配列
			for (let r = 1; r < table.rows.length; r++) {
				//行番号と値を配列に格納
				let column = new Object;
				column.row = table.rows[r];
				column.value = table.rows[r].cells[column_no].textContent;
				sortArray.push(column);
				//数値判定
				if (isNaN(Number(column.value))) {
					sortType = 1; //値が数値変換できなかった場合は文字列ソート
				}
			}
			if (sortType == 0) { //数値ソート
				if (column_no_prev == column_no) { //同じ列が2回クリックされた場合は降順ソート
					sortArray.sort(compareNumberDesc);
				} else {
					sortArray.sort(compareNumber);
				}
			} else { //文字列ソート
				if (column_no_prev == column_no) { //同じ列が2回クリックされた場合は降順ソート
					sortArray.sort(compareStringDesc);
				} else {
					sortArray.sort(compareString);
				}
			}
			//ソート後のTRオブジェクトを順番にtbodyへ追加（移動）
			let tbody = this.parentNode.parentNode;
			for (let i = 0; i < sortArray.length; i++) {
				tbody.appendChild(sortArray[i].row);
			}
			//昇順／降順ソート切り替えのために列番号を保存
			if (column_no_prev == column_no) {
				column_no_prev = -1; //降順ソート
			} else {
				column_no_prev = column_no;
			}
		};
	});
});
//数値ソート（昇順）
function compareNumber(a, b)
{
	return a.value - b.value;
}
//数値ソート（降順）
function compareNumberDesc(a, b)
{
	return b.value - a.value;
}
//文字列ソート（昇順）
function compareString(a, b) {
	if (a.value < b.value) {
		return -1;
	} else {
		return 1;
	}
	return 0;
}
//文字列ソート（降順）
function compareStringDesc(a, b) {
	if (a.value > b.value) {
		return -1;
	} else {
		return 1;
	}
	return 0;
}

(function(document) {
	'use strict';
	var LightTableFilter = (function(Arr) {
	  var _input;
	  function _onInputEvent(e) {
		_input = e.target;
		var tables = document.getElementsByClassName(_input.getAttribute('data-table'));
		Arr.forEach.call(tables, function(table) {
		  Arr.forEach.call(table.tBodies, function(tbody) {
			Arr.forEach.call(tbody.rows, _filter);
		  });
		});
	  }
   
	  function _filter(row) {
		var text = row.textContent.toLowerCase(), val = _input.value.toLowerCase();
		row.style.display = text.indexOf(val) === -1 ? 'none' : 'table-row';
	  }
   
	  return {
		init: function() {
		  var inputs = document.getElementsByClassName('light-table-filter');
		  Arr.forEach.call(inputs, function(input) {
			input.oninput = _onInputEvent;
		  });
		}
	  };
	})(Array.prototype);
   
	document.addEventListener('readystatechange', function() {
	  if (document.readyState === 'complete') {
		LightTableFilter.init();
	  }
	});
   
  })(document);