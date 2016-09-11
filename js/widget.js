var Widget = (function() {

	var isOpen = false,
		all_overlays = [],
		polygons = [],
		drawingManager,
		map,
		canvas,
		geoBlockInfo,
		self = this;

	function loadElem() {
		if (!document.getElementById("widjetApiScript")) {
			var script = document.createElement("script");
			script.type = "text/javascript";
			script.setAttribute("id", "widjetApiScript");
			script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyAlNg3eJiCSlF-d61TEQir7jqaPkOFNLd4&libraries=drawing";
			document.getElementsByTagName('head')[0].appendChild(script);
		}

		var wrapp = document.createElement("div");
		wrapp.setAttribute("id", "widgetWrapp" + self.id);
		wrapp.setAttribute("class", "widgetWrapp");
		document.body.appendChild(wrapp);

		var close = document.createElement("div");
		close.setAttribute("id", "widgetClose" + self.id);
		close.setAttribute("class", "widgetClose");
		close.innerHTML = "Закрыть";
		close.addEventListener('click', closeWidget);
		wrapp.appendChild(close);

		canvas = document.createElement("div");
		canvas.setAttribute("id", "widgetCanvas" + self.id);
		canvas.setAttribute("class", "widgetCanvas");
		wrapp.appendChild(canvas);

		var style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = '.widgetWrapp { z-index: 99999; color: #ffffff; width: 600px; margin: auto; border: 2px solid grey; padding: 10px; -webkit-transition: all 0.2s ease; -moz-transition: all 0.2s ease; transition: all 0.2s ease; top: -1000px; position: relative;} .widgetWrapp:before{content: ""; position: fixed; top: 0; left: 0; height: 100%; background-color: #000000; width: 100%; opacity: 0.8;} .widgetCanvas { height: 300px; border: 1px solid grey;} .geoBlockInfo{position: relative; padding: 30px; background-color: #3d423b; text-align: center; max-height: 150px; overflow-y: auto;} .widgetClose{position: absolute; color: #ffffff; right: 11px; top: -23px; cursor: pointer;}';
		document.getElementsByTagName('head')[0].appendChild(style);

	}

	function getLocation() {
		navigator.geolocation.getCurrentPosition(showMap, showMapError);
	}

	function showMap(position) {

		var LatLng = {
			lat: position.coords.latitude,
			lng: position.coords.longitude
		};

		map = new google.maps.Map(canvas, {
			center: LatLng,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			mapTypeControl: false,
			zoom: 13
		});

		var marker = new google.maps.Marker({
			position: LatLng,
			map: map
		});

		drawingManager = new google.maps.drawing.DrawingManager({
			drawingMode: google.maps.drawing.OverlayType.POLYGON,
			drawingControlOptions: {
				drawingModes: [
					google.maps.drawing.OverlayType.POLYGON
				]
			}
		});

		var controlDiv = document.createElement('div');
		var addControl = new Control(controlDiv, "Добавить полигон", "addPoly_ctrl" + self.id),
			delControl = new Control(controlDiv, "Удалить все", "removeAll_ctrl" + self.id),
			expControl = new Control(controlDiv, "Экспорт", "export_ctrl" + self.id),
			impControl = new Control(controlDiv, "Импорт", "import_ctrl" + self.id);

		controlDiv.index = 1;
		map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);

		controlDiv.addEventListener('click', function(e) {

			var attribute = e.target.parentNode.getAttribute("id");

			switch (attribute) {
				case "addPoly_ctrl" + self.id:
					if (!google.maps.drawing.isDraw) {
						startDraw();
					}
					break;
				case "export_ctrl" + self.id:
					exportGeoJSON()
					break;
				case "import_ctrl" + self.id:
					importGeoJSON()
					break;
				case "removeAll_ctrl" + self.id:
					removeAllPolygon()
					break;
			}


		}, false);

	}

	function showPopup() {
		setTimeout(function() {
			document.getElementsByClassName("widgetWrapp")[0].style.top = "0";

		}, 200);
	}

	function showMapError() {
		alert("Невозможно загрузить Ваше местоположение!");
		closeWidget();
	}

	function Control(controlDiv, controlName, id) {

		var controlUI = document.createElement('div');
		controlUI.setAttribute("id", id);
		controlUI.style.backgroundColor = '#fff';
		controlUI.style.border = '2px solid #fff';
		controlUI.style.paddingInlineStart = '0';
		controlUI.style.listStyleType = 'none';
		controlUI.style.borderRadius = '3px';
		controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
		controlUI.style.cursor = 'pointer';
		controlUI.style.marginBottom = '22px';
		controlUI.style.marginLeft = '1px';
		controlUI.style.marginRight = '1px';
		controlUI.style.textAlign = 'center';
		controlUI.title = controlName;
		controlDiv.appendChild(controlUI);

		var controlText = document.createElement('div');
		controlText.style.color = 'rgb(25,25,25)';
		controlUI.style.display = 'inline-block';
		controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
		controlText.style.fontSize = '16px';
		controlText.style.lineHeight = '38px';
		controlText.style.paddingLeft = '5px';
		controlText.style.paddingRight = '5px';
		controlText.innerHTML = controlName;
		controlUI.appendChild(controlText);

	}

	function startDraw() {

		drawingManager.setMap(map);
		map.data.setStyle({
			fillColor: 'green',
			strokeWeight: 2
		});

		document.getElementById("addPoly_ctrl" + self.id).addEventListener("click", function() {

			if (google.maps.drawing.isDraw == true) {
				google.maps.drawing.isDraw == false;
			} else {
				google.maps.drawing.isDraw == true;
			}

			if (google.maps.drawing.isDraw == true) {
				drawingManager.setDrawingMode(null);
			} else {
				drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
				google.maps.drawing.isDraw == false;
			}

		});

		google.maps.event.addListener(drawingManager, 'overlaycomplete', function(ev) {
			polygons.push(map.data.add(new google.maps.Data.Feature({
				geometry: new google.maps.Data.Polygon([ev.overlay.getPath().getArray()])
			})));
			all_overlays.push(ev);
			drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
		});

	}

	function removeAllPolygon() {

		for (var i = 0; i < all_overlays.length; i++) {
			all_overlays[i].overlay.setMap(null);
		}

		all_overlays = [];
		polygons = [];

		map.data.forEach(function(f) {
			map.data.remove(f);
		});

		drawingManager.setMap(null);

	}

	function exportGeoJSON() {

		if (!document.getElementById("geoBlockInfo" + self.id)) {

			geoBlockInfo = document.createElement("div");
			geoBlockInfo.setAttribute("id", "geoBlockInfo" + self.id);
			geoBlockInfo.setAttribute("class", "geoBlockInfo");
			insertAfter(geoBlockInfo, document.getElementById("widgetCanvas" + self.id));

			geoBlockInfo.innerHTML = '';
			addStringifyJson(geoBlockInfo);

		} else {
			geoBlockInfo.innerHTML = '';
			addStringifyJson(geoBlockInfo);
		}

		if (polygons.length == 0) {
			geoBlockInfo.remove();
		}

	}

	function importGeoJSON() {
		var geoText = geoBlockInfo.innerText || "",
			geoJson = JSON.parse(geoText);

		removeAllPolygon();

		map.data.setStyle({
			fillColor: 'blue',
			strokeWeight: 2
		});

		map.data.addGeoJson(geoJson);
	}

	function addStringifyJson(block) {

		var pathString = '',
			txt = '';

		for (i = 0; i < polygons.length; i++) {

			polygons[i].toGeoJson(function(json) {

				if ((txt == JSON.stringify(json))) {
					pathString += "";
				} else {
					txt = JSON.stringify(json);
					pathString += (txt + ',');
				}

			});
		}

		if (pathString.substr((pathString.length - 1) == ",")) {
			pathString = pathString.substr(0, (pathString.length - 1));
		}

		block.innerHTML = '{"type":"FeatureCollection","features":[' + pathString + ']}';

	}

	function insertAfter(elem, refElem) {
		var parent = refElem.parentNode;
		var next = refElem.nextSibling;
		if (next) {
			return parent.insertBefore(elem, next);
		} else {
			return parent.appendChild(elem);
		}
	}

	function startWidget(e) {
		e.preventDefault();

		if (!isOpen) {
			loadElem();
			getLocation();
			showPopup();
			isOpen = true;
		}

	}

	function closeWidget() {
		document.getElementsByClassName("widgetWrapp")[0].style.top = "-1000px";
		setTimeout(function() {
			document.getElementsByClassName("widgetWrapp")[0].remove();
		}, 500)

		isOpen = false;
	}

	return {

		init: function(options) {
			options = options || {};
			options.idWidget = options.idWidget || ("Id_" + Math.round(Math.random() * 100));
			self.id = options.idWidget;
			self.idLink = options.idLink;
			document.getElementById(self.idLink).addEventListener('click', startWidget);
		}

	}

})();
