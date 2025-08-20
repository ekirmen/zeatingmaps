 "use strict";

var seatsio = {};
seatsio.version = 11;

var controlerIframe = $(window.parent.document);

(function (S) {
    S.ChartDesigner = function (containerId, idPlano) {

        var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) + 10000;
        var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) + 10000;
        var R = Raphael(containerId, width, height);
        var me = this;
        var shiftWasPressed = false;
        var ctrlWasPressed = false;
        var debug = false;
        var mouseDown;
        var mustNextCanvasClickBeIgnored;
        var canvasCenter;
        var areLabelsShown = false;

        this.state = null;
        this.stateGroup = null;

        function container() {
            return $('#' + containerId);
        }

        function drawRectangle(x1, y1, x2, y2) {
            var startX = Math.min(x1, x2);
            var startY = Math.min(y1, y2);
            var width = Math.abs(x1 - x2);
            var height = Math.abs(y1 - y2);
            return R.rect(startX, startY, width, height).applyZoom(designer);
        }

        function drawLineBetweenPoints(start, end) {
            return R.path("M" + start.x + "," + start.y + "L" + end.x + "," + end.y).applyZoom(designer);
        }

        function drawLine(startX, startY, endX, endY, strokeWidth, opacity) {
            if (typeof strokeWidth === 'undefined') {
                strokeWidth = 1;
            }
            if (typeof opacity === 'undefined') {
                opacity = 0.5;
            }
            var line = R.path("M" + startX + "," + startY + "L" + endX + "," + endY);
            line.attr({"stroke-width": strokeWidth, "opacity": opacity});
            line.applyZoom(designer);
            return line;
        }

        function setCursorToDefault() {
            canvas().css('cursor', 'default');
        }

        function setCursorToNone() {
            canvas().css('cursor', "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjbQg61aAAAADUlEQVQYV2P4//8/IwAI/QL/+TZZdwAAAABJRU5ErkJggg=='), none");
        }

        function showSectionSubChart(section) {
            $('#toMasterSubChart').show();
            $('#chartNameContainer').hide();
            $("#sectionScaleSlider").show();
            designer.sectionScaler.sectionScaleSlider.show();
            designer.setState(new S.SelectionModeState(designer));
            designer.activeSubChart().undraw();
            hideGrid();
            designer.sectionSubChart = section.subChart;
            designer.venueTypeSwitcher.enableFeaturesForCurrentVenueType();
            designer.activeSubChart().draw();
            designer.zoomer.zoom(1);
            centerCanvas();
        }

        function showMasterSubChart() {
            function determineNextState() {
                if (designer.sectionSubChart == null) {
                    return new S.SelectionModeState(designer);
                }
                return new S.ObjectsSelectedState(designer, [designer.sectionSubChart.section]);
            }

            $('#toMasterSubChart').hide();
            $('#chartNameContainer').show();
            $("#sectionScaleSlider").hide();
            designer.sectionScaler.sectionScaleSlider.hide();
            var nextState = determineNextState();
            designer.activeSubChart().undraw();
            designer.sectionSubChart = null;
            designer.venueTypeSwitcher.enableFeaturesForCurrentVenueType();
            designer.activeSubChart().draw();
            designer.setState(nextState);
            designer.zoomer.fillScreen();
            showGrid();
            centerCanvas();
        }

        function snapPoint(point) {
            var pointSnappedToHelperLines = designer.helperLines.snapTo(point);
            if (pointSnappedToHelperLines && point.distanceToPoint(pointSnappedToHelperLines)) {
                return pointSnappedToHelperLines;
            }
            return point.snapToGrid();
        }

        function prependState(s) {
            return me.state.name + "." + s;
        }

        function centerCanvas() {
            var toolbarHeight = 100;
            window.scrollTo((canvas().width() - $(window).width()) / 2, (canvas().height() - ($(window).height() + toolbarHeight)) / 2);
        }

        canvas().bind("contextmenu", function () {
            return false;
        });

        canvas().mousedown(function (e) {
            if (debug) {
                console.log(prependState("onCanvasMouseDown"));
            }
            if (leftMouseButton(e)) {
                mouseDown = true;
                me.state.onCanvasMouseDown(e, designer);
            } else {
                me.state.onCanvasRightMouseButtonDown(e, designer);
            }
        });

        function leftMouseButton(e) {
            return e.which == 1;
        }

        function ignoreNextCanvasClick() {
            mustNextCanvasClickBeIgnored = true;
        }

        canvas().mouseup(function (e) {
            if (debug) {
                console.log(prependState("onCanvasMouseUp"));
            }
            mouseDown = false;
            me.state.onCanvasMouseUp(e, designer);
        });

        canvas().mousemove(function (e) {
            me.state.onCanvasMouseMove(e, designer);
        });

        canvas().mouseleave(function (e) {
            if (debug) {
                console.log(prependState("onCanvasMouseLeave"));
            }
            mouseDown = false;
            me.state.onCanvasMouseLeave(e, designer);
        });

        canvas().clickWhenNotDragged(function (e) {
            if (mustNextCanvasClickBeIgnored) {
                mustNextCanvasClickBeIgnored = false;
                return;
            }
            if (debug) {
                console.log(prependState("onCanvasClick"));
            }
            me.state.onCanvasClick(e, designer);
        });

        function onDuplicate() {
            if (debug) {
                console.log(prependState("onDuplicate"));
            }
            me.state.onDuplicate();
        }

        function onDelete() {
            if (debug) {
                console.log(prependState("onDelete"));
            }
            me.state.onDelete();
        }

        function onPaste() {
            if (debug) {
                console.log(prependState("onDelete"));
            }
            me.state.onPaste();
        }

        $(document).keydown(function (e) {
            ctrlWasPressed = e.ctrlKey || e.metaKey;
            if (e.keyCode == KEYS.DEL) {
                onDelete();
            } else if (e.keyCode == KEYS.SHIFT) {
                me.state.onShiftPressed(e);
                shiftWasPressed = true;
            } else if (e.keyCode == KEYS.ESCAPE) {
                me.state.onEscapePressed();
            }
        });

        $(document).keyup(function (e) {
            ctrlWasPressed = e.ctrlKey || e.metaKey;
            if (e.keyCode == KEYS.SHIFT) {
                me.state.onShiftReleased(e);
                shiftWasPressed = false;
            }
        });

        function serialize() {
            return JSON.stringify(toJson());
        }

        function toJson() {
            designer.json.name = designer.name();
            designer.json.tablesLabelCounter = seatsio.Tables.labelCounter;
            designer.json.uuidCounter = seatsio.Object.uuidCounter;
//            designer.json.idCounter = seatsio.Object.idCounter + 10;
            designer.json.categories = designer.categories.toJson();
            designer.json.version = designer.version;
            designer.json.venueType = designer.venueType;
            designer.json.showAllButtons = designer.showAllButtons;
            designer.json.subChart = subChartsToJson();
            designer.json.sectionScaleFactor = designer.json.subChart.sections != null && designer.json.subChart.sections.length > 0 
            								    ? designer.sectionScaler.scaleFactor : 100;
            designer.json.showRowLabels = $(controlerIframe).find("#showRowLabelsRenderedCheckbox").prop('checked');
			designer.json.showRowLines = $(controlerIframe).find("#showRowLinesRenderedCheckbox").prop('checked');
			designer.json.bookWholeTables = $(controlerIframe).find("#bookWholeTablesCheckbox").prop('checked');
            designer.json.bookWholeTableNotSeats = $(controlerIframe).find("#bookWholeTableNotSeatsCheckbox").prop('checked');

			reassignIdSeats();

            return designer.json;
        }

        function getCachedJsonSubChartForSection(section) {
            var sectionJson = designer.json.subChart.sections.findOne(function (anotherSection) {
                return section.uuid == anotherSection.uuid;
            });
            if (sectionJson) {
                return sectionJson.subChart;
            }
        }

        function setCachedJsonForSection(section, json) {
            designer.json.subChart.sections.push(json);
        }

        function getCachedJsonSubChartForGeneralAdmissionArea(ga) {
            var gaJson = designer.json.subChart.generalAdmissionAreas.findOne(function (anotherGA) {
                return ga.uuid == anotherGA.uuid;
            });
            if (gaJson) {
                return gaJson.subChart;
            }
        }

        function setCachedJsonForGeneralAdmissionArea(section, json) {
            designer.json.subChart.generalAdmissionAreas.push(json);
        }

        function subChartsToJson() {
            if (designer.activeSubChart().isMaster()) {
                return activeMasterSubChartToJson();
            }
            return activeSectionSubChartToJson();
        }

        function activeMasterSubChartToJson() {
            var masterSubChartJson = designer.activeSubChart().toJson();
            masterSubChartJson.sections.forEach(function (section) {
                var existingSectionSubChart = getCachedJsonSubChartForSection(section);
                if (existingSectionSubChart) {
                    section.subChart = existingSectionSubChart;
                }
            });
            return masterSubChartJson;
        }

        function activeSectionSubChartToJson() {
            var sectionInJson = designer.json.subChart.sections.findOne(function (section) {
                return section.uuid == designer.activeSubChart().section.uuid;
            });
            sectionInJson.subChart = designer.activeSubChart().toJson();
            return designer.json.subChart;
        }

        function fromJson(plan) {
            designer.json = plan;
			if (config.categories)
				initCategories(config.categories);
			else
				initCategories(plan.categories);
            designer.masterSubChart = S.MasterSubChart.fromJson(plan.subChart, designer);
            designer.masterSubChart.deserializing = true;
            seatsio.Tables.labelCounter = plan.tablesLabelCounter;
            seatsio.Object.uuidCounter = plan.uuidCounter;
            if (seatsio.Object.uuidCounter == null) seatsio.Object.uuidCounter = 0;
            if (plan.rowSpacing) seatsio.Chair._rowSpacing = plan.rowSpacing;
            designer.version = plan.version;
            designer.venueType = plan.venueType;
            designer.sectionScaler.changeScaleFactor(plan.sectionScaleFactor ? plan.sectionScaleFactor : 100);
            showMasterSubChart();
            initShowAllButtons(plan.showAllButtons);
            designer.masterSubChart.deserializing = false;

            initSeatIds();

            $(controlerIframe).find("#showRowLabelsRenderedCheckbox").prop('checked', plan.showRowLabels);
            $(controlerIframe).find("#showRowLinesRenderedCheckbox").prop('checked', plan.showRowLines);
            $(controlerIframe).find("#bookWholeTablesCheckbox").prop('checked', plan.bookWholeTables);
			$(controlerIframe).find("#bookWholeTableNotSeatsCheckbox").prop('disabled', !plan.bookWholeTables);
            $(controlerIframe).find("#bookWholeTableNotSeatsCheckbox").prop('checked', plan.bookWholeTableNotSeats ? plan.bookWholeTableNotSeats : false);
			
			// En caso de ser un plano que ya hubiera estado guardado anteriormente (ya que bookWholeTables no sería undefined)
			// no se permite en ningún momento editar la opción de solo comprar mesas para evitar posibles problemas con ventas y demás
			if (typeof plan.bookWholeTables !== "undefined" && typeof plan.bookWholeTableNotSeats === "undefined")
			{
				plan.bookWholeTableNotSeats = null;
			}
			
			// Si es la primera vez bookWholeTableNotSeats es undefined por tanto no se deshabilita nada,
			// si ya tenía valor ese parametro se bloquea siempre y en caso de que sea true también se bloquea
			// el parametro de seleccionar mesas completas y en caso de ser un plan
			
			if (typeof plan.bookWholeTableNotSeats !== "undefined") 
			{
				if (plan.bookWholeTableNotSeats) $(controlerIframe).find("#bookWholeTablesCheckbox").prop('disabled', true);
				$(controlerIframe).find("#bookWholeTableNotSeatsCheckbox").prop('disabled', true);
			}
        }

        function initShowAllButtons(showAllButtons) {
            if (showAllButtons) {
                $('#showAllButtonsCheckbox').prop('checked', true);
                setShowAllButtons(true);
            }
        }

        function initCategories(categoriesJson) {
            designer.categories.setCategories(categoriesJson.list.map(function (categoryJson) {
                return new S.Category(categoryJson.label, categoryJson.color, categoryJson.catId);
            }));

            designer.categories.setCategoriesGA(categoriesJson.listGA.map(function (categoryJson) {
                return new S.Category(categoryJson.label, categoryJson.color, categoryJson.catId);
            }));

//            S.Categories.maxCategoryKey = categoriesJson.maxCategoryKey;
        }

        function initSeatIds()
        {
            seatsio.Object.idCounter = config.maxIdButaca ;
            if (seatsio.Object.idCounter == null) seatsio.Object.idCounter = 0;
            seatsio.Object.idCounterInicial = seatsio.Object.idCounter;
            seatsio.Object.idCounterTemp = seatsio.Object.idCounterInicial + 10000;

            designer.originalSeatIds = [];
            designer.originalSeatCarIds = [];

            var subChart = designer.json.subChart;
            if (subChart.sections && subChart.sections.length > 0)
            {
                for (var i=0; i<subChart.sections.length; i++)
                {
                    if (typeof subChart.sections[i].subChart != 'undefined')
                    {
                        initSeatIdsSubchart(subChart.sections[i].subChart);
                    }
                }
            }
            initSeatIdsSubchart(subChart);
        }

        function initSeatIdsSubchart(subChart)
        {
            if (subChart.rows && subChart.rows.length > 0)
            {
                for (var i=0; i<subChart.rows.length; i++)
                {
                    initSeatIdsObjectWithSeats(subChart.rows[i]);
                }
            }
            if (subChart.tables && subChart.tables.length > 0)
            {
                for (var i=0; i<subChart.tables.length; i++)
                {
                    initSeatIdsObjectWithSeats(subChart.tables[i]);
                }
            }
        }


        function initSeatIdsObjectWithSeats(objectWithSeats)
        {
			// Seat ids
			if (objectWithSeats.label && objectWithSeats.seats && objectWithSeats.seats.length > 0)
			{
				for (var j=0; j<objectWithSeats.seats.length; j++)
				{
					var seat = objectWithSeats.seats[j];

					if (seat.catId && seat.label && seat.id)
					{
						designer.originalSeatIds[ seat.catId + "-" + objectWithSeats.label + "-" + seat.label] = seat.id;
						designer.originalSeatCarIds[seat.id] = seat.catId;
					}
				}
			}
			
			// Table ids
			if (objectWithSeats.label && objectWithSeats.objectType == "table")
			{
				var table = objectWithSeats;
				if (table.catId && table.label && table.id)
				{
					designer.originalSeatIds[table.catId + "-" + objectWithSeats.label + "-" + table.label] = table.id;
					designer.originalSeatCarIds[table.id] = table.catId;
				}
			}
		}



        function canvas() {
            return $(R.canvas);
        }

        function activeSubChart() {
            if (designer.sectionSubChart) {
                return designer.sectionSubChart;
            }
            return designer.masterSubChart;
        }

        function name() {
            var chartName = $('#chartDesignerNameInput').val();
            if (isBlank(chartName)) {
                return  'Untitled chart';
            }
            return chartName;
        }

        var setState = function (state) {
            if (debug) {
                console.log('setState from ' + me.state + ' to ' + state);
            }
            if (me.state) {
                me.state.exit();
            }
            me.state = state;
            me.state.init();
        };

        var setStateGroup = function (stateGroup) {
            if (me.stateGroup) {
                me.stateGroup.exit();
            }
            stateGroup.init();
            me.stateGroup = stateGroup;
        };

        var getState = function () {
            return me.state;
        };

        var getShiftWasPressed = function () {
            return shiftWasPressed;
        };

        var getCtrlWasPressed = function () {
            return ctrlWasPressed;
        };

        function toTextMode() {
            designer.setState(new S.TextModeState(designer));
        }

        function toLabelingMode() {
            designer.setState(determineLabelingState());
        }

        function determineLabelingState() {
            if (designer.featureToggler.objectsWithSeatsEnabled()) {
                return new S.SeatLabelingState(designer);
            }
            return new S.ObjectLabelingState(designer);
        }

        function toCategoryMode() {
            designer.setState(new S.CategoryState(designer));
        }

        function toBackgroundImageMode() {
            designer.setState(new S.BackgroundImageModeState(designer));
        }

        function enableRowModeButton() {
            $('#toRowMode').button('toggle');
        }

        function hideDeleteButton() {
            $("#deleteButtonContainer").hide();
        }

        function showDeleteButton() {
            $("#deleteButtonContainer").show();
        }

        function showObjectLabels() {
            designer.setState(new S.ObjectLabelingState(designer));
        }

        function showSeatLabels() {
            designer.setState(new S.SeatLabelingState(designer));
        }

        function drawHelperLines(point, rowToExclude) {
            if (S.ChartDesigner.snapToGridEnabled) {
                designer.helperLines.draw(point, rowToExclude);
            }
        }

        function undrawHelperLines() {
            designer.helperLines.undraw();
        }

        function onAlignCenter() {
            me.state.onAlignCenter();
        }

        function onAlignLeft() {
            me.state.onAlignLeft();
        }

        function onAlignRight() {
            me.state.onAlignRight();
        }

        function onFlipHorizontal() {
            me.state.onFlip(true);
        }

        function onFlipVertical() {
            me.state.onFlip(false);
        }

        function showAlignButtons() {
            $("#alignButtons").show();
        }

        function hideAlignButtons() {
            $("#alignButtons").hide();
        }

        function showFlipButtons() {
            $("#flipButtons").show();
        }

        function hideFlipButtons() {
            $("#flipButtons").hide();
        }

        function drawLineThroughRay(ray) {
            return drawLine(ray.origin.x, ray.origin.y, ray.end.x, ray.end.y);
        }

        function doCurve(amount) {
            me.state.doCurve(amount);
        }

        function reselect() {
            me.state.reselect();
        }

        function isMouseDown() {
            return mouseDown;
        }

        function deactivateAllCategoryButtons() {
            $('#categoryButtons').find('a').each(function () {
                $(this).removeClass('active');
            });
        }

        function activateCategoryButtons(category) {
            $('#categoryButtons').find('a').each(function () {
                if ($(this).data('label') == category.label) {
                    $(this).addClass('active');
                } else {
                    $(this).removeClass('active');
                }
            });
        }

        if (debug) {
            R.circle(width / 2, height / 2, 4).attr("fill", "red");
        }

        function getCanvasCenter() {
            if (!canvasCenter) {
                canvasCenter = new S.Point(width / 2, height / 2);
            }
            return canvasCenter;
        }

        function labelsShown() {
            return areLabelsShown;
        }

        function showLabels() {
            areLabelsShown = true;
            designer.activeSubChart().showLabels();
        }

        function hideLabels() {
            areLabelsShown = false;
            designer.activeSubChart().hideLabels();
        }

        function setShowAllButtons(showAll) {
            designer.showAllButtons = showAll;
            designer.featureToggler.render();
        }

        function showGrid() {
            canvas().css('background-image', 'url("' + urlEstaticosPlanos + 'img/grid.png")');
        }

        function hideGrid() {
            canvas().css('background-image', 'none');
        }


        function reassignIdSeats() {
            seatsio.Object.idCounter = seatsio.Object.idCounterInicial;

			var subChart = seatsio.designer.json.subChart;
			if (subChart.sections && subChart.sections.length > 0)
			{
				for (var i=0; i<subChart.sections.length; i++)
				{
		          if (typeof subChart.sections[i].subChart != 'undefined')
		          {
		            reassignIdSeatsSubchart(subChart.sections[i].subChart);
		          }
				}
			}
			reassignIdSeatsSubchart(subChart);

            seatsio.Object.idCounterTemp = seatsio.Object.idCounter + 10000;
        }


        function reassignIdSeatsSubchart(subChart)
        {
			if (subChart.rows && subChart.rows.length > 0)
			{
				for (var i=0; i<subChart.rows.length; i++)
				{
					reassignIdSeatsObjectWithSeats(subChart.rows[i]);
				}
			}
			if (subChart.tables && subChart.tables.length > 0)
			{
				for (var i=0; i<subChart.tables.length; i++)
				{
					reassignIdSeatsObjectWithSeats(subChart.tables[i]);
				}
			}
		}


        function reassignIdSeatsObjectWithSeats(objectWithSeats)
        {
			// Seats ids
			if (objectWithSeats.seats && objectWithSeats.seats.length > 0)
			{
				for (var j=0; j<objectWithSeats.seats.length; j++)
				{
					var seat = objectWithSeats.seats[j];

					var idOrig = designer.originalSeatIds[ seat.catId + "-" + objectWithSeats.label + "-" + seat.label];
					if (idOrig && (!seat.id || (idOrig != seat.id && seat.id > seatsio.Object.idCounterInicial) ) )
						seat.id = idOrig;

					var catIdOrig = null;
					if (seat.id)
						catIdOrig = designer.originalSeatCarIds[seat.id];

					if (!seat.id || seat.id > seatsio.Object.idCounterInicial || (catIdOrig && catIdOrig != seat.catId)) {
						seat.id = ++seatsio.Object.idCounter;
					}
				}
			}
			
			// Table ids
			if (objectWithSeats.label && objectWithSeats.objectType == "table")
			{
				var table = objectWithSeats;

				var idOrig = designer.originalSeatIds[ table.catId + "-" + table.label + "-" + table.label];
				if (idOrig && (!table.id || (idOrig != table.id && table.id > seatsio.Object.idCounterInicial) ) )
					table.id = idOrig;

				var catIdOrig = null;
				if (table.id)
					catIdOrig = designer.originalSeatCarIds[table.id];

				if (!table.id || table.id > seatsio.Object.idCounterInicial || (catIdOrig && catIdOrig != table.catId)) {
					table.id = ++seatsio.Object.idCounter;
				}
			}
		}


        var designer = {
            fromJson: fromJson,
            toJson: toJson,
            json: {},
            canvas: canvas,
            drawLine: drawLine,
            width: function () {
                return width;
            },
            height: function () {
                return height;
            },
            canvasCenter: getCanvasCenter,
            drawLineBetweenPoints: drawLineBetweenPoints,
            setState: setState,
            getState: getState,
            activeSubChart: activeSubChart,
            drawRectangle: drawRectangle,
            shiftWasPressed: getShiftWasPressed,
            ctrlWasPressed: getCtrlWasPressed,
            paper: R,
            toTextMode: toTextMode,
            toLabelingMode: toLabelingMode,
            toSeatLabelingMode: showSeatLabels,
            toObjectLabelingMode: showObjectLabels,
            toCategoryMode: toCategoryMode,
            toBackgroundImageMode: toBackgroundImageMode,
            showDeleteButton: showDeleteButton,
            hideDeleteButton: hideDeleteButton,
            showSeatLabels: showSeatLabels,
            showObjectLabels: showObjectLabels,
            onDelete: onDelete,
            onDuplicate: onDuplicate,
            drawHelperLines: drawHelperLines,
            undrawHelperLines: undrawHelperLines,
            onAlignCenter: onAlignCenter,
            onAlignLeft: onAlignLeft,
            onAlignRight: onAlignRight,
            onFlipHorizontal: onFlipHorizontal,
            onFlipVertical: onFlipVertical,
            showAlignButtons: showAlignButtons,
            hideAlignButtons: hideAlignButtons,
            showFlipButtons: showFlipButtons,
            hideFlipButtons: hideFlipButtons,
            drawLineThroughRay: drawLineThroughRay,
            snapPoint: snapPoint,
            enableRowModeButton: enableRowModeButton,
            doCurve: doCurve,
            reselect: reselect,
            R: R,
            isMouseDown: isMouseDown,
            deactivateAllCategoryButtons: deactivateAllCategoryButtons,
            activateCategoryButtons: activateCategoryButtons,
            container: container,
            name: name,
            setStateGroup: setStateGroup,
            labelsShown: labelsShown,
            showLabels: showLabels,
            hideLabels: hideLabels,
            ignoreNextCanvasClick: ignoreNextCanvasClick,
            setShowAllButtons: setShowAllButtons,
            setCursorToDefault: setCursorToDefault,
            setCursorToNone: setCursorToNone,
            showSectionSubChart: showSectionSubChart,
            showMasterSubChart: showMasterSubChart,
            serialize: serialize,
            getCachedJsonSubChartForSection: getCachedJsonSubChartForSection,
            setCachedJsonForSection: setCachedJsonForSection,
            getCachedJsonSubChartForGeneralAdmissionArea: getCachedJsonSubChartForGeneralAdmissionArea,
            setCachedJsonForGeneralAdmissionArea: setCachedJsonForGeneralAdmissionArea,
            subChartsToJson: subChartsToJson
        };

        seatsio.designer = designer;

        designer.layers = new S.Layers(designer)
            .createLayer('backgroundLayer')
            .createLayer('sectionsLayer')
            .createLayer('objectsLayer')
            .createLayer('textsLayer')
            .createLayer('selectionRectanglesLayer')
            .createLayer('transformationHandlesLayer');
        designer.zoomer = new S.Zoomer(designer);
        designer.chairMousePointer = new S.ChairMousePointer(designer).init();
        designer.selector = new S.ObjectsSelector(designer);
        designer.itemSelector = new S.ItemSelector(designer);
        designer.helperLines = new S.HelperLines(designer);
        designer.categories = new S.Categories(designer);
        designer.tableMousePointer = new S.TableMousePointer(designer);
        designer.boothMousePointer = new S.BoothMousePointer(designer);
        designer.version = S.version;
        designer.tooltip = new S.Tooltip(designer);
        designer.toolbar = new S.Toolbar(designer);
        designer.setState(new S.SelectionModeState(designer));
        designer.masterSubChart = new S.MasterSubChart(designer);
        designer.sectionSubChart = null;
        designer.numberOfSelectedObjectsMessage = new S.NumberOfSelectedObjectsMessage();
        designer.venueTypeSwitcher = new S.VenueTypeSwitcher(designer);
        designer.spinner = new S.Spinner();
        designer.featureToggler = new S.FeatureToggler(designer);
        designer.shapeDrawingCrosshair = new S.ShapeDrawingCrosshair(designer);
        designer.venueType = 'MIXED';
        designer.showAllButtons = false;
        designer.sectionScaler = new S.SectionScaler(designer);
        designer.idPlano = idPlano;

        return designer;
    };

    S.ChartDesigner.snapToAngle = 2;
    S.ChartDesigner.snapToGridEnabled = true;
})(seatsio);

(function (S) {
    S.Object = function () {

        this.selector;
        this.mover;
        this.labeler;
        this.designer;
        this.uuid;

        this.init = function (designer, noLabeler, labelerWithBackgroundColor) {
            this.selector = new S.ObjectSelector(this, designer);
            this.mover = new S.ObjectMover(this);
            if (!noLabeler) {
                this.labeler = new S.LabelingTextInput(this, designer, labelerWithBackgroundColor);
            }
            this.uuid = S.Object.uuid();
            this.layer = 'objectsLayer';
            this.designer = designer;
        };

        this.blur = function () {
            this.visibleElementsSet().attr({'opacity': 0.5, 'stroke-opacity': 0.5});
        };

        this.blurblur = function () {
            this.visibleElementsSet().attr({'opacity': 0.1, 'stroke-opacity': 0.1});
        };

        this.unblur = function () {
            this.visibleElementsSet().attr({'opacity': 1, 'stroke-opacity': 1});
        };

        this.highlight = S.Object.highlight;

        this.unhighlight = S.Object.unhighlight;

        this.objectDrawn = function () {
            if (this.labeler) {
                this.labeler.objectDrawn();
            }
            this.selector.objectDrawn();
        };

        this.objectUndrawn = function () {
            if (this.labeler) {
                this.labeler.objectUndrawn();
            }
            this.selector.objectUndrawn();
        };

        this.setCursor = function (cursor) {
            this.allElementsSet().attr('cursor', cursor);
        };

        this.hideLabel = function () {
            if (this.labeler) {
                this.labeler.undraw();
            }
            return this;
        };

        this.showLabel = function () {
            if (this.labeler) {
                this.labeler.draw();
            }
            return this;
        };

        this.applyZoom = function () {
            this.allElementsSet().applyZoom(this.designer);
            this.children().forEach(function (child) {
                if (child.labeler) {
                    child.labeler.applyZoom();
                }
            });
            if (this.labeler) {
                this.labeler.applyZoom();
            }
        };

        this.showLabelAndChildLabels = function () {
            this.children().forEach(function (child) {
                child.showLabel();
            });
            this.showLabel();
            return this;
        };

        this.hideLabelAndChildLabels = function () {
            this.hideLabel();
            this.children().forEach(function (child) {
                child.hideLabel();
            });
            return this;
        };

        this.children = function () {
            return [];
        };

        this.allElementsSet = function () {
            return pushAll(this.selector.allElementsSet(), this.visibleElementsSet());
        };

        this.hovered = function () {
            this.selector.changeCursorTo('move');
        };

        this.unhovered = function () {
            this.selector.changeCursorToDefault();
        };

        this.bbox = function () {
            return S.Bbox.from(this.visibleElementsSet().getBBox(), this.designer);
        };

        this.isCategorisable = function () {
            return typeof(this.category) != 'undefined';
        };

        this.createSelectionRectangle = function () {
            return this.bbox().drawPathThroughPoints();
        };

        this.enableObjectSelection = function () {
            this.selector.enable();
        };

        this.disableSelection = function () {
            this.selector.disable();
            return this;
        };

        this.enableSeatSelection = function () {
            this.selector.disable();
        };

        this.numberOfLabeledSeats = function () {
            return chairs.reduce(function (count, chair) {
                if (chair.hasLabel()) {
                    return ++count;
                }
                return count;
            }, 0);
        };

    };

    S.Object.highlight = function () {
        if (this.highlighted) {
            return;
        }
        this.visibleElementsSet().forEach(function (el) {
            el.darker(1.5);
        });
        this.highlighted = true;
        return this;
    };

    S.Object.unhighlight = function () {
        if (!this.highlighted) {
            return;
        }
        this.visibleElementsSet().forEach(function (el) {
            el.resetBrightness();
        });
        this.highlighted = false;
        return this;
    };

    S.Object.regenerateUuids = function (json) {
        for (var property in json) {
            if (json[property] === null) {
                continue;
            }
            if (Array.isArray(json[property])) {
                json[property].forEach(S.Object.regenerateUuids);
            }
            else if (typeof json[property] == 'object') {
                S.Object.regenerateUuids(json[property]);
            }
        }
        if (json.uuid) {
            json.uuid = S.Object.uuid();
        }
        if (json.id) {
            json.id = S.Object.newId();
		}
        return json;
    };

    S.Object.uuid = function () {
        return 'uuid' + ++seatsio.Object.uuidCounter;
    };

    S.Object.newId = function () {
        return ++seatsio.Object.idCounterTemp;
    };

    S.Object.uuidCounter = 0;
    S.Object.idCounter = 0;
    S.Object.idCounterInicial = 0;
    S.Object.idCounterTemp = 100000;

})(seatsio);

function InlineEditable(element) {
    this.element = element;
    this.makeReadOnly();
    this.initEventHandlers();
}

InlineEditable.prototype.initEventHandlers = function () {
    $('.inlineEditableTextField')
        .on("mouseenter", this.makeEditable.bind(this))
        .on("mouseleave", this.makeReadOnly.bind(this))
        .on("click", this.selectText.bind(this))
        .on("keypress", this.blurIfEnter.bind(this))
        .on("blur", this.makeReadOnly.bind(this))
        .on("focus", this.makeEditable.bind(this));
};

InlineEditable.prototype.makeEditable = function () {
    this.element.removeAttr("readonly");
};

InlineEditable.prototype.makeReadOnly = function () {
    if (!this.element.is(":focus")) {
        this.element.attr("readonly", "readonly");
    }

};

InlineEditable.prototype.selectText = function () {
    this.element.select();
};

InlineEditable.prototype.blurIfEnter = function (e) {
    if (e.which == 13) {
        this.element.blur();
    }
};

(function (S) {
    S.ChartValidator = function (subChart) {

        this.validationErrors = function() {
            var errors = [];
            if(hasUnlabeledSeats()) { errors.push("UNLABELED_SEATS") }
            if(hasDuplicateSeats()) { errors.push("DUPLICATE_SEATS") }
            if(hasUnlabeledRows()) { errors.push("UNLABELED_ROWS") }
            if(hasUnlabeledTables()) { errors.push("UNLABELED_TABLES") }
            if(hasUncategorizedSeats()) { errors.push("UNCATEGORIZED_SEATS") }
            if(hasUncategorizedGaZones()) { errors.push("UNCATEGORIZED_GA") }
//            if(hasNoSeats()) { errors.push("NO_SEATS") }
            return errors;
        };

        this.updateValidationMessages = function() {
            updateTotalNumberOfSeatsMessage();
            updateNumberOfUnlabeledSeatsMessage();
            updateNumberOfUnlabeledRowsMessage();
            updateNumberOfUnlabeledTablesMessage();
            updateNumberOfDuplicateSeatsMessage();
            updateNumberOfUncategorizedSeatsMessage();
            updateNumberOfUncategorizedGeneralZonesMessage();
        };

        function hasNoSeats() {
            return subChart.objectsWithSeats().length == 0;
        }

        function hasUnlabeledSeats() {
            return getNumberOfUnlabeledSeats() > 0;
        }

        function hasDuplicateSeats() {
            return getNumberOfDuplicateSeats() > 0;
        }

        function hasUnlabeledRows() {
            return getNumberOfUnlabeledRows() > 0;
        }

        function hasUnlabeledTables() {
            return getNumberOfUnlabeledTables() > 0;
        }

        function hasUncategorizedSeats() {
            return getNumberOfUncategorizedSeats() > 0;
        }

        function hasUncategorizedGaZones() {
            return getNumberOfUncategorizedGaZones() > 0;
        }

        function getNumberOfUnlabeledSeats() {
			var n = 0;
			if (subChart.sections && subChart.sections["sections"] && subChart.sections["sections"].length > 0)
			{
				for (var i=0; i<subChart.sections["sections"].length; i++)
				{
					n += subChart.sections["sections"][i].subChart.objectsWithSeats().reduce(function (total, object) {
						return total + object.numberOfUnlabeledSeats();
					}, 0);
				}
			}

            n += subChart.objectsWithSeats().reduce(function (total, object) {
                return total + object.numberOfUnlabeledSeats();
            }, 0);

            return n;
        }

        function getNumberOfUnlabeledTables() {
			var n = 0;
			if (subChart.sections && subChart.sections["sections"] && subChart.sections["sections"].length > 0)
			{
				for (var i=0; i<subChart.sections["sections"].length; i++)
				{
					n += subChart.sections["sections"][i].subChart.tables.tables.reduce(function (total, table) {
						if (table.hasLabel()) {
							return total;
						}
						return total + 1;
					}, 0);
				}
			}

            n += subChart.tables.tables.reduce(function (total, table) {
                if (table.hasLabel()) {
                    return total;
                }
                return total + 1;
            }, 0);

            return n;
        }

        function getTotalNumberOfSeats(){
            return subChart.allObjectsWithSeats().reduce(function(total, row){
                  return total + row.numberOfChairs();
            }, 0);
        }

        function getNumberOfUnlabeledRows() {
			var n = 0;
			if (subChart.sections && subChart.sections["sections"] && subChart.sections["sections"].length > 0)
			{
				for (var i=0; i<subChart.sections["sections"].length; i++)
				{
					n += subChart.sections["sections"][i].subChart.rows.reduce(function (total, row) {
						if (row.hasLabel()) {
							return total;
						}
						return total + 1;
					}, 0);
				}
			}

            n += subChart.rows.reduce(function (total, row) {
                if (row.hasLabel()) {
                    return total;
                }
                return total + 1;
            }, 0);

            return n;
        }

        function getNumberOfUncategorizedSeats() {
			var n = 0;
			if (subChart.sections && subChart.sections["sections"] && subChart.sections["sections"].length > 0)
			{
				for (var i=0; i<subChart.sections["sections"].length; i++)
				{
					n += subChart.sections["sections"][i].subChart.objectsWithSeats().reduce(function (total, object) {
						return total + object.numberOfUncategorizedSeats();
					}, 0);
				}
			}

            n += subChart.objectsWithSeats().reduce(function (total, object) {
                return total + object.numberOfUncategorizedSeats();
            }, 0);

            return n;
        }

        function getNumberOfUncategorizedGaZones() {
			var n = 0;
			if (subChart.sections && subChart.sections["sections"] && subChart.sections["sections"].length > 0)
			{
				for (var i=0; i<subChart.sections["sections"].length; i++)
				{
					n += subChart.sections["sections"][i].subChart.generalAdmissionAreas.areas().reduce(function (total, object) {
						return total + (object.category == null ? 1 : 0);
					}, 0);
				}
			}
									
			n += subChart.generalAdmissionAreas.areas().reduce(function (total, object) {
						return total + (object.category == null ? 1 : 0);
				}, 0);
            return n;
        }

        function getNumberOfDuplicateSeats() {
            var rowsByLabel = getObjectsWithSeatsGroupedByLabel();
            var total = 0;
            for (var label in rowsByLabel) {
                total += countDuplicateSeats(rowsByLabel[label]);
            }
            return total;
        }

        function countDuplicateSeats(rows) {
            var total = 0;
            var seatsGroupedByLabel = groupSeatsByLabel(rows);
            for (var label in seatsGroupedByLabel) {
                if (seatsGroupedByLabel[label] > 1) {
                    total += seatsGroupedByLabel[label];
                }
            }
            return total;
        }

        function groupSeatsByLabel(rows) {
            var seatCount = {};
            rows.forEach(function (row) {
                row.getChairs().forEach(function (seat) {
                    if (!seat.hasLabel() || !seat.hasCategory()) {
                        return;
                    }
                    var cLabel = seat.label + "-" + seat.category.catId;
                    if (seatCount[cLabel]) {
                        seatCount[cLabel]++;
                    } else {
                        seatCount[cLabel] = 1;
                    }
                })
            });
            return seatCount;
        }

        function getObjectsWithSeatsGroupedByLabel() {
            var objctsWithSeatsGroupedByLabel = {};
            subChart.objectsWithSeats().forEach(function (objectWithSeats) {
                if (!objectWithSeats.hasLabel()) {
                    return;
                }
                if (objctsWithSeatsGroupedByLabel[objectWithSeats.label]) {
                    objctsWithSeatsGroupedByLabel[objectWithSeats.label].push(objectWithSeats);
                } else {
                    objctsWithSeatsGroupedByLabel[objectWithSeats.label] = [objectWithSeats];
                }
            });

            if (subChart.sections && subChart.sections.sections)
            {
				subChart.sections.sections.forEach(function(sec) {

					sec.subChart.objectsWithSeats().forEach(function (objectWithSeats) {
						if (!objectWithSeats.hasLabel()) {
							return;
						}
						if (objctsWithSeatsGroupedByLabel[objectWithSeats.label]) {
							objctsWithSeatsGroupedByLabel[objectWithSeats.label].push(objectWithSeats);
						} else {
							objctsWithSeatsGroupedByLabel[objectWithSeats.label] = [objectWithSeats];
						}
					});
				});
			}

            return objctsWithSeatsGroupedByLabel;
        }

        function updateTotalNumberOfSeatsMessage(){
            //$("#labelingMessages").find("#totalSeatsMessage").find("span").html(getTotalNumberOfSeats());

            $(controlerIframe).find("#totalSeatsMessage_submenu").html(getTotalNumberOfSeats())

        }

        function updateNumberOfUnlabeledSeatsMessage() {
            var numberOfUnlabeledSeats = getNumberOfUnlabeledSeats();
            var numberOfUnlabeledSeatsSpan = $("#labelingMessages").find("#numberOfUnlabeledSeats");
            if (numberOfUnlabeledSeats == 0) {
                numberOfUnlabeledSeatsSpan.hide();
            } else {
                numberOfUnlabeledSeatsSpan.show().find('span').html(numberOfUnlabeledSeats);
            }
            refreshLabelingMessage();
        }

        function updateNumberOfUnlabeledRowsMessage() {
            var numberOfUnlabeledRows = getNumberOfUnlabeledRows();
            var numberOfUnlabeledRowsSpan = $("#labelingMessages").find("#numberOfUnlabeledRows");
            if (numberOfUnlabeledRows == 0) {
                numberOfUnlabeledRowsSpan.hide()
            } else {
                numberOfUnlabeledRowsSpan.show().find('span').html(numberOfUnlabeledRows);
            }
            refreshLabelingMessage();
        }

        function updateNumberOfUnlabeledTablesMessage() {
            var numberOfUnlabeledTables = getNumberOfUnlabeledTables();
            var numberOfUnlabeledTablesSpan = $("#labelingMessages").find("#numberOfUnlabeledTables");
            if (numberOfUnlabeledTables == 0) {
                numberOfUnlabeledTablesSpan.hide()
            } else {
                numberOfUnlabeledTablesSpan.show().find('span').html(numberOfUnlabeledTables);
            }
            refreshLabelingMessage();
        }

        function updateNumberOfDuplicateSeatsMessage() {
            var numberOfDuplicateSeats = getNumberOfDuplicateSeats();
            var numberOfDuplicateSeatsSpan = $("#labelingMessages").find("#numberOfDuplicateSeats");
            if (numberOfDuplicateSeats == 0) {
                numberOfDuplicateSeatsSpan.hide()
            } else {
                numberOfDuplicateSeatsSpan.show().find('span').html(numberOfDuplicateSeats);
            }
            refreshLabelingMessage();
        }

         function updateNumberOfUncategorizedSeatsMessage() {
            var numberOfUncategorizedSeats = getNumberOfUncategorizedSeats();
            var numberOfUncategorizedSeatsSpan = $("#labelingMessages").find("#numberOfUncategorizedSeats");
            if (numberOfUncategorizedSeats == 0) {
                numberOfUncategorizedSeatsSpan.hide()
            } else {
                numberOfUncategorizedSeatsSpan.show().find('span').html(numberOfUncategorizedSeats);
            }
            refreshLabelingMessage();
        }

        function updateNumberOfUncategorizedGeneralZonesMessage() {
            var numberOfUncategorizedGaZones = getNumberOfUncategorizedGaZones();
            var numberOfUncategorizedGaZonesSpan = $("#labelingMessages").find("#numberOfUncategorizedGaZones");
            if (numberOfUncategorizedGaZones == 0) {
                numberOfUncategorizedGaZonesSpan.hide()
            } else {
                numberOfUncategorizedGaZonesSpan.show().find('span').html(numberOfUncategorizedGaZones);
            }
            refreshLabelingMessage();
        }

        function refreshLabelingMessage()
        {
        	 var label1 = getNumberOfUnlabeledSeats();
        	 var label2 = getNumberOfUnlabeledRows();
        	 var label3 = getNumberOfUnlabeledTables();
        	 var label4 = getNumberOfDuplicateSeats();
        	 var label5 = getNumberOfUncategorizedSeats();
        	 var label6 = getNumberOfUncategorizedGaZones();


        	 if(label1 == 0 && label2 == 0 && label3 == 0 && label4 == 0 && label5 == 0 && label6 == 0)
        	 {
        		 $("#labelingMessages").hide();
        	 }
        	 else
        	 {
        		 $("#labelingMessages").show();
        	 }
        }

   }
})(seatsio);

(function (S) {
    S.Chair = function (centerPoint, parent, subChart) {

        var circle = null;
        var me = this;
        var designer = subChart.designer;

        this.label = S.LabelingTextInput.emptyLabel;
        this.labeler = null;
        this.category = null;
        this.parent = parent;
        this.id = S.Object.newId();

        this.drawShape = function () {
            circle = designer.paper.circle(this.center().x, this.center().y, S.Chair.straal())
                .attr({'fill': this.determineColor(), 'stroke': '#a8aebc'})
                .toLayer('objectsLayer', designer)
                .applyZoom(designer);
            circle.seatsioObjectType = 'chair';
        };

        this.draw = function () {
            if (chairDrawn()) {
                return;
            }
            this.labeler = new S.LabelingTextInput(this, designer).objectDrawn();
            this.drawShape();
            circle.click(function (e) {
                designer.getState().onObjectClicked(me);
                e.stopPropagation();
            });
            circle.mouseover(function (e) {
                designer.getState().onObjectMouseOver(me);
            });
            circle.mouseout(function (e) {
                designer.getState().onObjectMouseOut(me);
            });
            return this;
        };

        this.hideLabel = function () {
            this.labeler.undraw();
        };

        this.showLabel = function () {
            this.labeler.draw();
        };

        this.bbox = function () {
            return S.Bbox.from(circle.getBBox(), designer);
        };

        this.labelPosition = function () {
            return this.center();
        };

        this.animate = function (duration) {
            circle.animate({
                fill: '#8b93a6'
            }, duration / 2, function () {
                circle.animate({fill: this.determineColor()}, duration / 2)
            }.bind(this));
        };

        this.highlight = S.Object.highlight;

        this.unhighlight = S.Object.unhighlight;

        this.determineColor = function () {
            if (me.category) {
                return me.category.color;
            }
//            if(subChart.category) {
//                return subChart.category.color;
//            }
            return S.Chair.defaultColor;
        };

        this.getRotation = function () {
            return this.parent.getRotation();
        };

        this.undraw = function () {
            if (circle) {
                if (this.labeler) {
                    this.labeler.undraw();
                }
                circle.remove();
                circle = null;
            }
        };

        this.blur = function () {
            circle.attr({'opacity': 0.5});
            circle.bboxNotDirtyEvenIfRaphaelThinksSo();
        };

        this.isCategorisable = function () {
            return true;
        };

        this.setCursor = function (cursor) {
            circle.attr('cursor', cursor);
        };

        this.hovered = function () {
            this.setCursor('move');
        };

        this.unhovered = function () {
            this.setCursor(null);
        };

        this.unblur = function () {
            circle.attr({'opacity': 1});
            circle.bboxNotDirtyEvenIfRaphaelThinksSo();
        };

        this.move = function (newCenterPoint) {
            centerPoint = newCenterPoint;
            this.redraw();
        };

        this.redraw = function () {
            this.undraw();
            this.draw();
        };

        this.center = function () {
            return centerPoint;
        };

        this.moved = function (distance) {
            centerPoint = centerPoint.add(distance);
            this.redraw();
        };

        this.rotated = function (center, angle) {
            centerPoint = centerPoint.rotateAround(center, angle);
            this.redraw();
        };

        this.hasLabel = function () {
            return this.label != S.LabelingTextInput.emptyLabel;
        };

        this.unlabel = function () {
            this.label = S.LabelingTextInput.emptyLabel;
        };

        function chairDrawn() {
            return circle != null;
        }

        this.toJson = function () {
            var centerAsJson = this.center().toJson(designer);
            if (!this.id)
				this.id = S.Object.newId();
            return {
                'x': centerAsJson.x,
                'y': centerAsJson.y,
                'label': this.label.toString(),
                'catId': this.catId(),
                'id': this.id
            }
        };

        this.hasCategory = function () {
//            if (this.category || subChart.category)
            if (this.category)
				return true;
            return false;
        };

        this.catId = function () {
            if (!this.category) {
                return null;
            }
            return this.category.catId;
        };

        this.changeLabel = function (label) {
			if (this.label != label)
			{
				this.id = null;
			}
            this.label = label;
            new S.AutoLabeler(this.parent, designer).go();
        };

        this.visibleElementsSet = function () {
            return designer.paper.set(circle);
        };

        this.raphaelElement = function () {
            return circle;
        };

        this.highlightRelativeToPoint = function (minDistance, maxDistance, point) {
            var distance = point.distanceToPoint(this.center());
            var pct = (distance - minDistance) / (maxDistance - minDistance);
            circle.attr({'opacity': Math.max(1 - pct, 0.1)});
        };

        this.unhighlightRelativeToFocalPoint = function () {
            circle.attr({'fill': this.determineColor(), 'opacity': 1});
        };

        this.applyCategory = function (category) {
			if (this.category != category)
			{
				this.id = null;
			}
            this.category = category;
        };

        this.removeCategory = function () {
            this.category = null;
        };

    };

    S.Chair.fromJson = function (json, parent, subChart) {
        var chair = new S.Chair(S.Point.fromJson(json, subChart), parent, subChart);
        chair.label = json.label;
        if (json.catId) {
            chair.applyCategory(subChart.designer.categories.getCategory(json.catId));
            chair.catIdOrig = json.catId;
        }
        chair.id = json.id;
        return chair;
    };

    S.Chair.getRowSpacing = function() {
        return S.Chair._rowSpacing;
    };

    S.Chair.width = 16;
    S.Chair.widthPlusStroke = S.Chair.width + 2;
    S.Chair.spacing = 4;
    S.Chair._rowSpacing = 8;
    S.Chair.spacePerChair = function () {
        return S.Chair.width + S.Chair.spacing;
    };
    S.Chair.straal = function () {
        return S.Chair.width / 2;
    };
    S.Chair.straalPlusStroke = function () {
        return S.Chair.straal() + 1;
    };
    S.Chair.defaultColor = 'white';

    S.Chair.drawShape = function (center, designer) {
        var circle = designer.paper.circle(center.x, center.y, S.Chair.straal())
            .attr({'fill': S.Chair.defaultColor, 'stroke': '#8b93a6'})
            .toLayer('objectsLayer', designer)
            .applyZoom(designer);
        circle.seatsioObjectType = 'chair';
        return circle;
    };
})
(seatsio);

(function (S) {
    S.Row = function (subChart) {

        var designer = subChart.designer;

        this.init(designer, false, true);

        var me = this;

        var chairs = [];

        this.numberOfChairsWidget = new S.NumberOfChairs(this, designer);
        this.curve = 0;
        this.label = S.LabelingTextInput.emptyLabel;
        this.canBeAutoLabeled = true;
        this.uuid = S.Object.uuid();

        this.children = function () {
            return chairs;
        };

        this.duplicate = function () {
            var json = seatsio.Object.regenerateUuids(this.toJson());
            return subChart.addRow(S.Row.createFromModel(json, subChart));
        };

        this.select = function () {
            this.highlight();
            this.selector.select();
        };

        this.deselect = function () {
            this.unhighlight();
            this.selector.deselect();
        };

        this.addChair = function (chair) {
            chairs.push(chair);
            return chair;
        };

        this.labelPosition = function () {
            if (chairs.length == 0)
				return null;

            if (chairs.length % 2 == 1)
            {
				var c = (chairs.length - 1) / 2;
				return chairs[c].center();
			}
			else
			{
				var c = (chairs.length) / 2;
				return chairs[c-1].center().averageWith(chairs[c].center());
			}
        };

        this.getRotation = function () {
            return this.createRayFromFirstChairToLast().angle();
        };

        this.blur = function () {
            chairs.forEach(function (chair) {
                chair.blur();
            });
        };

        this.unblur = function () {
            chairs.forEach(function (chair) {
                chair.unblur();
            });
        };

        this.drawShapes = function () {
            chairs.forEach(function (chair) {
                chair.drawShape();
            });
        };

        this.draw = function () {
            chairs.forEach(function (chair) {
                chair.draw();
            });
            this.numberOfChairsWidget.draw();
            this.objectDrawn();
            return this;
        };

        this.moved = function (distance) {
            chairs.forEach(function (chair) {
                chair.moved(distance);
            });
            this.redraw();
        };

        this.rotated = function (center, angle) {
            var wasInFirstOrFourthQuadrant = this.inFirstOrFourthQuadrant();
            chairs.forEach(function (chair) {
                chair.rotated(center, angle);
            });
            if (wasInFirstOrFourthQuadrant && !this.inFirstOrFourthQuadrant()) {
                me.curve = -me.curve;
            }
            this.redraw();
        };

        this.inFirstOrFourthQuadrant = function () {
            var ray = me.createRayFromFirstChairToLast();
            return ray.isInFirstQuadrant() || ray.isInFourthQuadrant();
        };

        this.firstChair = function () {
            if (chairs.length == 0) {
                throw 'Row does not contain any seats';
            }
            return chairs[0];
        };

        this.lastChair = function () {
            if (chairs.length == 0) {
                throw 'Row does not contain any seats';
            }
            return chairs[chairs.length - 1];
        };

        this.numberOfChairs = function () {
            return chairs.length;
        };

        this.undraw = function () {
            undrawAllChairs();
            this.objectUndrawn();
            return this;
        };

        this.redraw = function () {
            this.undraw();
            this.draw();
        };

        function getCurveControlPoint() {
            var angle = me.inFirstOrFourthQuadrant() ? 90 : -90;
            return new S.Ray(me.center(), me.firstChair().center())
                .plusAngle(angle)
                .pointAtDistanceFromOrigin(me.curve * S.Row.curveDelta * 2);
        }

        function isStraight() {
            return me.curve == 0;
        }

        function drawHelperPath() {
            return createHelperPath().attr({
                "opacity": 0,
                "stroke": "#8b93a6",
                "stroke-width": S.Chair.width
            }).applyZoom(designer);
        }

        function createHelperPath() {
            if (isStraight() || chairs.length == 1) {
                return createHelperPathForStraightRow();
            }
            return createHelperPathForCurvedRow();
        }

        function createHelperPathForStraightRow() {
            return me.createRayFromFirstChairToLast().enlargeOnBothSides(S.Chair.widthPlusStroke / 2).drawLine(designer);
        }

        function createHelperPathForCurvedRow() {
            var firstPoint = new seatsio.Ray(chairs[1].center(), chairs[0].center()).enlarge(S.Chair.widthPlusStroke / 2).end;
            var lastPoint = new seatsio.Ray(chairs[chairs.length - 2].center(), chairs[chairs.length - 1].center()).enlarge(S.Chair.widthPlusStroke / 2).end;
            var controlPoint = getCurveControlPoint();
            var pathString =
                "M" + firstPoint.x + "," + firstPoint.y
                + "L" + me.firstChair().center().x + "," + me.firstChair().center().y
                + "Q" + controlPoint.x + "," + controlPoint.y
                + " " + me.lastChair().center().x + "," + me.lastChair().center().y
                + "L" + lastPoint.x + "," + lastPoint.y;
            return designer.R.path(pathString);
        }

        this.createSelectionRectangle = function () {
            return drawHelperPath();
        };

        function mapChairsToCurve() {
            var helperPath = drawHelperPath();
            var distanceBetweenChairsOnHelperPath = (helperPath.getTotalLength() - S.Chair.widthPlusStroke) / (chairs.length - 1);
            var i = 0;
            chairs.forEach(function (chair) {
                var newCenter = helperPath.getPointAtLength((distanceBetweenChairsOnHelperPath * i++) + (S.Chair.widthPlusStroke / 2));
                chair.move(new S.Point(newCenter.x, newCenter.y));
            });
            helperPath.remove();
        }

        this.doCurve = function (amount) {
            var ray = this.createRayFromFirstChairToLast();
            this.curve = amount;
            mapChairsToCurve();
            this.objectDrawn();
        };

        this.transformToAroundFirst = function (endPoint, doNotSnap) {
            return this.transformTo(this.firstChair(), false, endPoint, doNotSnap);
        };

        this.transformToAroundLast = function (endPoint, doNotSnap) {
            return this.transformTo(this.lastChair(), true, endPoint, doNotSnap);
        };

        this.transformTo = function (aroundChair, reverse, endPoint, doNotSnap) {
            var ray = new S.Ray(aroundChair.center(), endPoint).enlarge(S.Chair.spacing);
            if (!doNotSnap) {
                ray = ray.snapToAngle(S.ChartDesigner.snapToAngle);
            }
            var newChairs = ray
                .pointsAtInterval(S.Row.spacePerChair)
                .map(function (centerOfChair) {
                    return new S.Chair(centerOfChair, me, subChart);
                });
            if (reverse) {
                newChairs.reverse();
            }
            me.undraw();
            copyCategoryAndLabelAndUuid(chairs, newChairs);
            chairs = newChairs;
            new S.AutoLabeler(me, designer).go();
            return me;
        };

        function copyCategoryAndLabelAndUuid(oldChairs, newChairs) {
            var onlyCategoryInThisRow = getOnlyCategoryInThisRow();
            for (var i = 0; i < newChairs.length; i++) {
                if (oldChairs[i]) {
                    newChairs[i].applyCategory(onlyCategoryInThisRow ? onlyCategoryInThisRow : oldChairs[i].category);
                    newChairs[i].label = oldChairs[i].label;
                    newChairs[i].uuid = oldChairs[i].uuid;
                } else {
                    if (onlyCategoryInThisRow) {
                        newChairs[i].applyCategory(onlyCategoryInThisRow);
                    }
                }
            }
        }

        function getOnlyCategoryInThisRow() {
            return chairs
                .map(function (c) {
                    return c.category;
                })
                .uniques()
                .onlyElementOr(undefined);
        }

        function undrawAllChairs() {
            chairs.forEach(function (chair) {
                chair.undraw();
            });
        }

        this.hide = function () {
            this.allElementsSet().hide();
        };

        this.show = function () {
            this.allElementsSet().show();
        };

        this.createRayFromFirstChairToLast = function () {
            return new S.Ray(this.firstChair().center(), this.lastChair().center());
        };

        this.createRayFromFirstChairToCenter = function () {
            return new S.Ray(this.firstChair().center(), this.center());
        };

        this.createRayFromFirstChairBorderToLast = function () {
            if (this.numberOfChairs() == 1) {
                return new S.Ray(this.bbox().middleLeft(), this.bbox().middleRight());
            } else {
                var ray = this.createRayFromFirstChairToLast();
                var firstChairBorder = ray.plusAngle(180).pointAtDistanceFromOrigin(S.Chair.straal());
                var lastChairBorder = ray.revert().plusAngle(180).pointAtDistanceFromOrigin(S.Chair.straal());
                return new S.Ray(firstChairBorder, lastChairBorder);
            }
        };

        this.bbox = function () {
            return S.Bbox.from(this._setOfChairElements().getBBox(), designer);
        };

        this.getChairs = function () {
            return chairs;
        };

        this._setOfChairElements = function () {
            return pushAll(designer.paper.set(), chairs.map(function (chair) {
                return chair.raphaelElement();
            }));
        };

        this.visibleElementsSet = function () {
            return this._setOfChairElements();
        };

        this.curvedCenter = function () {
            return this.createRayFromFirstChairToCenter()
                .revert()
                .plusAngle(90)
                .pointAtDistanceFromOrigin(this.curve);
        };

        this.center = function () {
            return this.firstChair().center().averageWith(this.lastChair().center());
        };

        this._elements = function () {
            return this.allElementsSet();
        };

        this.toJson = function () {
            var rowJson = [];
            this.getChairs().forEach(function (chair) {
                rowJson.push(chair.toJson());
            });
            return {
                'label': this.label,
                'seats': rowJson,
                'curve': this.curve,
                'chairSpacing': S.Chair.spacing,
                'objectType': 'row',
                'uuid': this.uuid
            };
        };

        this.rotate = function (angle) {
            this.rotateAround(angle, this.center());
        };

        this.remove = function () {
            subChart.deleteRow(this);
        };

        this.alignCenter = function (minX, maxX) {
            var centerXOfRow = (this.lastChair().center().x + this.firstChair().center().x) / 2;
            var centerX = (maxX + minX) / 2;
            this.moveHorizontally(centerX - centerXOfRow);
            return this;
        };

        this.alignLeft = function (x) {
            this.moveHorizontally(x - this.bbox().middleLeft().x);
            return this;
        };

        this.alignRight = function (x) {
            this.moveHorizontally(x - this.bbox().middleRight().x);
            return this;
        };

        function centersOfChairs() {
            var centersOfChairs = [];
            var ray = me.createRayFromFirstChairToLast();
            centersOfChairs.push(ray.plusAngle(180).pointAtDistanceFromOrigin(S.Row.spacePerChair));
            pushAll(centersOfChairs, chairs.map(function (chair) {
                return chair.center();
            }));
            centersOfChairs.push(ray.revert().plusAngle(180).pointAtDistanceFromOrigin(S.Row.spacePerChair));
            return centersOfChairs;
        }

        this.pointsToSnapTo = function () {
            var centers = centersOfChairs();
            var centersBetweenChairs = S.Point.midpoints(centers);
            return pushAll(centers, centersBetweenChairs);
        };

        this.flip = function (pointOnVerticalLine, isHorizontal) {
            var verticalRay = new S.RayFromOriginAndAngle(pointOnVerticalLine, isHorizontal ? 90 : 0);
            chairs.forEach(function (chair) {
                chair.move(verticalRay.mirror(chair.center()));
            });
            if (!isHorizontal) {
                me.curve = -me.curve;
            }
            this.redraw();
            return this;
        };

        this.areRowAndChairsLabeled = function () {
            return this.hasLabel() && this.allChairsLabeled();
        };

        this.allChairsLabeled = function () {
            return this.numberOfLabeledSeats() == this.numberOfChairs();
        };

        this.numberOfUnlabeledSeats = function () {
            return this.numberOfChairs() - this.numberOfLabeledSeats();
        };

        this.numberOfLabeledSeats = function () {
            return chairs.reduce(function (count, chair) {
                if (chair.hasLabel()) {
                    return ++count;
                }
                return count;
            }, 0);
        };

        this.numberOfUncategorizedSeats = function () {
            return this.numberOfChairs() - this.numberOfCategorizedSeats();
        };

        this.numberOfCategorizedSeats = function () {
            return chairs.reduce(function (count, chair) {
                if (chair.hasCategory()) {
                    return ++count;
                }
                return count;
            }, 0);
        };

        this.changeLabel = function (label) {
			if (label != this.label)
			{
				let chairs = this.getChairs();
				for(let i = 0; i < chairs.length; i++)
				{
					chairs[i].id = null;
				}
			}
            this.label = label;
        };

        this.isStraight = function () {
            return this.curve == 0;
        };

        this.hasLabel = function () {
            return this.label != S.LabelingTextInput.emptyLabel;
        };

    };

    S.NumberOfChairs = function (row, designer) {

        var text;
        var background;

        var showMode = null;

        this.show = function () {
            showMode = "start";
            this.draw();
        };

        this.showAtEnd = function () {
            showMode = "end";
            this.draw();
        };

        this.createRay = function () {
            if (showMode == "start") {
                return row.createRayFromFirstChairToLast();
            } else if (showMode == "end") {
                return row.createRayFromFirstChairToLast().revert();
            }
            throw Error("Cannot create ray for showMode " + showMode);
        };

        this.draw = function () {
            if (!showMode) {
                return;
            }
            undraw();
            var textPosition = this.createRay().plusAngle(180).pointAtDistanceFromOrigin(S.Row.spacePerChair * 1.2);
            text = designer.paper
                .text(textPosition.x, textPosition.y, row.numberOfChairs())
                .attr({'font-size': 16})
                .applyZoom(designer);
            background = S.Rectangle
                .fromBBox(text.getBBox(), designer)
                .enlarge(3)
                .draw({'fill': 'white', 'stroke-width': 0, 'opacity': 0.5});
            text.toLayer('objectsLayer', designer);
        };

        function undraw() {
            if (text) {
                text.remove();
                text = null;
                background.undraw();
                background = null;
            }
        }

        this.hide = function () {
            showMode = null;
            undraw();
        }

    };

    S.Row.createFromModel = function (model, subChart) {
        var row = new S.Row(subChart);
        model.seats.forEach(function (chair) {
            row.addChair(S.Chair.fromJson(chair, row, subChart));
        });
        row.curve = model.curve;
        row.label = model.label;
        row.uuid = model.uuid;
        return row;
    };

    S.Row.drawShapes = function (start, end, designer) {
        return new S.Ray(start, end)
            .pointsAtInterval(S.Row.spacePerChair)
            .map(function (centerOfChair) {
                return S.Chair.drawShape(centerOfChair, designer);
            })
            .toSet(designer);
    };

    S.Row.createFromChairs = function (chairs, designer) {
        var row = new S.Row(designer.activeSubChart());
        chairs.forEach(function (chair) {
            chair.parent = row;
            row.addChair(chair);
        });
        return row;
    };

    S.Row.curveDelta = 8;
    S.Row.height = function () {
        return S.Chair.width + S.Chair.getRowSpacing();
    };
    S.Row.spacePerChair = S.Chair.width + S.Chair.spacing;

    S.Row.prototype = new S.Object();

})(seatsio);

(function (S) {
    S.Rectangle = function (point1, point2, designer) {

        var rectangle;

        this.enlarge = function (distance) {
            return new S.Rectangle(point1.addToXAndY(-distance), point2.addToXAndY(distance), designer);
        };

        this.draw = function (attributes) {
            rectangle = designer.drawRectangle(point1.x, point1.y, point2.x, point2.y).attr(attributes);
            return this;
        };

        this.undraw = function () {
            rectangle.remove();
            rectangle = null;
        }
    };

    S.Rectangle.fromBBox = function (bbox, designer) {
        return new S.Rectangle(new S.Point(bbox.x, bbox.y), new S.Point(bbox.x2, bbox.y2), designer);
    };
})(seatsio);

(function (S) {
    // when a drag ends, browsers (well, at least Chrome) send an additional 'click' event
    // we have to do some bookkeeping to make sure that only the 'drag end' event gets
    // processed and not the click event

    S.Drag = {
        _started: false,

        start: function () {
            this._started = true;
        },

        stop: function () {
            this._started = false;
        },

        isStarted: function () {
            return this._started;
        },

        autoStopDrag: function () {
            setTimeout(function () {
                S.Drag.stop()
            }, 100);
        }
    };

    S.handleEventWhenNotDragged = function (fn) {
        return function (e) {
            e.stopPropagation();
            if (S.Drag.isStarted()) {
                S.Drag.stop();
            } else {
                fn(e);
            }
        }
    };

    Raphael.el.clickWhenNotDragged = function (fn) {
        this.click(S.handleEventWhenNotDragged(fn));
        return this;
    };

    Raphael.st.clickWhenNotDragged = function (fn) {
        this.forEach(function (el) {
            el.clickWhenNotDragged(fn);
        });
        return this;
    };

    jQuery.fn.clickWhenNotDragged = function (fn) {
        this.on("click", S.handleEventWhenNotDragged(fn));
        return this;
    };

    S.translate = function (dx, dy) {
        return 't' + dx + ',' + dy;
    };

    Raphael.el.onDragTransform = function (designer, elementsToTransform, transformationOnMoveFunction, onStartFunction, onEndFunction, noDraggingReallyStartedCheck) {
        var lastDx, lastDy;
        var allElements = S.set(designer.paper, this, elementsToTransform);
        S.onDrag(
            designer,
            this,
            function (dx, dy, e) {
                lastDx = dx;
                lastDy = dy;
                allElements.transform(transformationOnMoveFunction(dx, dy, e))
            },
            function () {
                if (onStartFunction) {
                    onStartFunction();
                }
                allElements.startTransformation()
            },
            function () {
                if (onEndFunction) {
                    onEndFunction(lastDx, lastDy);
                }
                allElements.endTransformation()
            },
            noDraggingReallyStartedCheck
        );
        return this;
    };

    Raphael.el.onDrag = function (designer, onMoveFunction, onStartFunction, onEndFunction, noDraggingReallyStartedCheck) {
        S.onDrag(designer, this, onMoveFunction, onStartFunction, onEndFunction, noDraggingReallyStartedCheck);
        return this;
    };

    S.onDrag = function (designer, draggedElement, onMoveFunction, onStartFunction, onEndFunction, noDraggingReallyStartedCheck) {
        var reallyStarted = false;
        var lastDx, lastDy;
        draggedElement.drag(
            function move(dx, dy, x, y, e) {
                if (reallyStarted || noDraggingReallyStartedCheck || draggingReallyStartedAndNotJustClick(dx, dy)) {
                    if (!reallyStarted) {
                        reallyStarted = true;
                        S.Drag.start();
                        if (onStartFunction) {
                            onStartFunction(e);
                        }
                    }
                    lastDx = dx;
                    lastDy = dy;
                    onMoveFunction(dx, dy, e, x, y);
                }
            },
            function start(x, y, e) {
                e.stopPropagation();
            },
            function end() {
                if (reallyStarted) {
                    S.Drag.autoStopDrag();
                    reallyStarted = false;
                    if (onEndFunction) {
                        onEndFunction(new S.Vector.fromView(lastDx, lastDy, designer));
                    }
                }
            }
        );
    }
})(seatsio);

var INFINITY = 99999999;

seatsio.Point = function (x, y) {
    this.x = seatsio.Point.round(x);
    this.y = seatsio.Point.round(y);
};

seatsio.Point.round = function (i) {
    return parseFloat(i.toFixed(2));
};

seatsio.Point.prototype.type = "Point";

seatsio.Point.prototype.toJson = function (designer) {
    var me = this;

    function transformToSubChartBbox(subChart) {
        var subChartBbox = subChart.getBBox();
        if (subChartBbox) {
            return new seatsio.Point(me.x - subChartBbox.point1().x, me.y - subChartBbox.point1().y);
        }
        return me;
    }

    function doToJson(point) {
        return {
            'x': point.x,
            'y': point.y
        }
    }

    if (designer.activeSubChart().serializing) {
        return doToJson(transformToSubChartBbox(designer.activeSubChart()));
    }
    return doToJson(this);
};

seatsio.Point.prototype.asTranslation = function () {
    return 't' + Math.round(this.x) + "," + Math.round(this.y);
};

seatsio.Point.prototype.vectorTo = function (point, designer) {
    return point.minus(this).asVector(designer);
};

seatsio.Point.prototype.minus = function (point) {
    return new seatsio.Point(this.x - point.x, this.y - point.y);
};

seatsio.Point.prototype.addToXAndY = function (number) {
    return new seatsio.Point(this.x + number, this.y + number);
};

seatsio.Point.prototype.addToX = function (number) {
    return new seatsio.Point(this.x + number, this.y);
};

seatsio.Point.prototype.addToY = function (number) {
    return new seatsio.Point(this.x, this.y + number);
};

seatsio.Point.prototype.averageWith = function (point) {
    return new seatsio.Point(average(this.x, point.x), average(this.y, point.y));
};

seatsio.Point.prototype.add = function (point) {
    return new seatsio.Point(this.x + point.x, this.y + point.y);
};

seatsio.Point.prototype.subtract = function (point) {
    return new seatsio.Point(this.x - point.x, this.y - point.y);
};

seatsio.Point.prototype.snapToGrid = function (precision) {
    return seatsio.Point.snapToGrid(this.x, this.y, precision);
};

seatsio.Point.prototype.snapToGridEvenIfNotEnabled = function () {
    function snapToGrid(coordinate) {
        return Raphael.snapTo(seatsio.Point.SNAP_PRECISION, coordinate);
    }

    return new seatsio.Point(snapToGrid(this.x), snapToGrid(this.y));
};

seatsio.Point.prototype.verticalDistanceTo = function (point) {
    return Math.abs(point.x - this.x);
};

seatsio.Point.prototype.closestVertically = function (p1, p2) {
    if (this.verticalDistanceTo(p1) < this.verticalDistanceTo(p2)) {
        return p1;
    }
    return p2;
};

seatsio.Point.prototype.zoomTo = function (point, zoom) {
    return new seatsio.Ray(point, this)
        .enlargeByFactor(zoom)
        .end;
};

seatsio.Point.prototype.horizontalDistanceTo = function (point) {
    return Math.abs(point.y - this.y);
};

seatsio.Point.prototype.closestHorizontally = function (p1, p2) {
    if (this.horizontalDistanceTo(p1) < this.horizontalDistanceTo(p2)) {
        return p1;
    }
    return p2;
};

seatsio.Point.prototype.rotateAround = function (rotationCenter, angleInDegrees) {
    var cos = Math.cos(Raphael.rad(angleInDegrees));
    var sin = Math.sin(Raphael.rad(angleInDegrees));
    var dx = this.x - rotationCenter.x;
    var dy = this.y - rotationCenter.y;
    var rotatedX = (cos * dx) - (sin * dy) + rotationCenter.x;
    var rotatedY = (sin * dx) + (cos * dy) + rotationCenter.y;
    return new seatsio.Point(rotatedX, rotatedY);
};

seatsio.Point.prototype.asVector = function (designer) {
    return new seatsio.Vector(this.x, this.y, designer);
};

seatsio.Point.prototype.isBeneathOrAbove = function (row) {
    var bbox = row.bbox();
    return bbox.x < this.x && this.x < bbox.x2;
};

seatsio.Point.prototype.isToLeftOrRightOf = function (row) {
    var bbox = row.bbox();
    return bbox.y < this.y && this.y < bbox.y2;
};

seatsio.Point.prototype.distanceToRow = function (row) {
    return row.createRayFromFirstChairBorderToLast().distanceToPoint(this);
};

seatsio.Point.prototype.distanceToPoint = function (point) {
    var deltaX = point.x - this.x;
    var deltaY = point.y - this.y;
    return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
};

seatsio.Point.prototype.withX = function (x) {
    return new seatsio.Point(x, this.y);
};

seatsio.Point.prototype.withY = function (y) {
    return new seatsio.Point(this.x, y);
};

seatsio.Point.prototype.findClosestTo = function (points) {
    var me = this;
    return points.reduce(function (closest, point) {
        if (me.distanceToPoint(point) < me.distanceToPoint(closest)) {
            return point;
        }
        return closest;
    });
};

seatsio.Point.prototype.opposite = function () {
    return new seatsio.Point(-this.x, -this.y);
};

seatsio.Point.prototype.equals = function (point) {
    return this.x == point.x && this.y == point.y;
};

seatsio.Point.prototype.applyMatrix = function (matrix) {
    return new seatsio.Point(matrix.x(this.x, this.y), matrix.y(this.x, this.y));
};

seatsio.Point.prototype.toView = function (designer) {
    return this.zoomTo(designer.canvasCenter(), designer.zoomer.zoomLevel);
};

seatsio.Point.prototype.isInsidePolygon = function (polygon) {
    // thanks to https://github.com/substack/point-in-polygon/
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0], yi = polygon[i][1];
        var xj = polygon[j][0], yj = polygon[j][1];

        var intersect = ((yi > this.y) != (yj > this.y))
            && (this.x < (xj - xi) * (this.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

seatsio.Point.snapToGrid = function (x, y, precision) {
    function snapToGrid(coordinate) {
        if (seatsio.ChartDesigner.snapToGridEnabled) {
            return Raphael.snapTo(precision || seatsio.Point.SNAP_PRECISION, coordinate);
        } else {
            return coordinate;
        }
    }

    return new seatsio.Point(snapToGrid(x), snapToGrid(y));
};

seatsio.Point.fromEventSnapped = function (e, designer) {
    var point = seatsio.Point.fromEvent(e, designer);
    return designer.snapPoint(point);
};

seatsio.Point.fromEvent = function (e, designer) {
    if (typeof(e.offsetX) == "undefined") {
        if (typeof(e.originalEvent) == "undefined") {
            return seatsio.Point.fromView(e.layerX, e.layerY, designer) // firefox
        }
        return seatsio.Point.fromView(e.originalEvent.layerX, e.originalEvent.layerY, designer); // firefox
    }
    return seatsio.Point.fromView(e.pageX, e.pageY, designer);
};

seatsio.Point.midpoints = function (points) {
    var previousPoint;
    var midpoints = [];
    points.forEach(function (point) {
        if (previousPoint) {
            midpoints.push(point.averageWith(previousPoint));
        }
        previousPoint = point;
    });
    return midpoints;
};

seatsio.Point.centerOfBBox = function (bbox) {
    return new seatsio.Point(bbox.x, bbox.y).averageWith(new seatsio.Point(bbox.x2, bbox.y2));
};

seatsio.Point.prototype.moveToViewCenter = function (subChart) {
    var distanceToCenterSnapped = new seatsio.Point(0, 0)
        .addToX((subChart.designer.width() / 2) - (subChart.snapOffset.x + subChart.autoSizedWidth / 2))
        .addToY((subChart.designer.height() / 2) - (subChart.snapOffset.y + subChart.autoSizedHeight / 2))
        .snapToGridEvenIfNotEnabled();
    return this.add(distanceToCenterSnapped);
};

seatsio.Point.fromJson = function (json, subChart) {
    var point = new seatsio.Point(json.x, json.y);
    if (subChart.deserializing) {
        return point.add(subChart.snapOffset).moveToViewCenter(subChart);
    }
    return point;
};

seatsio.Point.fromX = function (x) {
    return new seatsio.Point(x, 0);
};

seatsio.Point.fromY = function (y) {
    return new seatsio.Point(0, y);
};

seatsio.Point.fromView = function (x, y, designer) {
    return new seatsio.Ray(designer.canvasCenter(), new seatsio.Point(x, y))
        .enlargeByFactor(1 / designer.zoomer.zoomLevel)
        .end;
};

seatsio.Point.x = function (point) {
    return point.x;
};

seatsio.Point.y = function (point) {
    return point.y;
};

seatsio.Point.SNAP_PRECISION = 4;

(function (S) {
    S.Vector = function(x, y, designer) {
        this.x = x;
        this.y = y;
        this.designer = designer;
    };

    S.Vector.prototype.snapToGrid = function() {
        return S.Point.snapToGrid(this.x, this.y).asVector(this.designer);
    };

    S.Vector.prototype.asTranslation = function() {
        return 't' + (this.x * this.designer.zoomer.zoomLevel) + "," + (this.y * this.designer.zoomer.zoomLevel);
    };

    S.Vector.fromView = function(x, y, designer) {
        return new S.Vector(x / designer.zoomer.zoomLevel, y / designer.zoomer.zoomLevel, designer);
    };
})(seatsio);

seatsio.AbstractRay = function () {
};

seatsio.AbstractRay.prototype.init = function (origin) {
    this.origin = origin;
};

seatsio.AbstractRay.prototype.angleInRadians = function () {
    return Raphael.rad(this.angle());
};

seatsio.AbstractRay.prototype.plusAngle = function (plusAngleInDegrees) {
    return new seatsio.RayFromOriginAndAngle(this.origin, this.angle() + plusAngleInDegrees);
};

seatsio.AbstractRay.prototype.normalizeAngle = function (angle) {
    var normalizedangle = angle % 360;
    if (normalizedangle < 0) {
        return normalizedangle + 360;
    }
    return normalizedangle;
};

seatsio.AbstractRay.prototype.pointAtDistanceFromPoint = function (distance, point) {
    return new seatsio.Point(
            (distance * Math.cos(this.angleInRadians())) + point.x,
            (distance * Math.sin(this.angleInRadians())) + point.y
    );
};

seatsio.AbstractRay.prototype.pointAtDistanceFromOrigin = function (distance) {
    return this.pointAtDistanceFromPoint(distance, this.origin);
};

seatsio.AbstractRay.prototype.oposingRayAtDistance = function (distance) {
    return new seatsio.Ray(this.pointAtDistanceFromOrigin(distance), this.origin);
};

seatsio.AbstractRay.prototype.angleBetween = function (ray) {
    return this.angle() - ray.angle();
};

seatsio.AbstractRay.prototype.distanceToOrigin = function (point) {
    return point.distanceToPoint(this.origin);
};

seatsio.AbstractRay.prototype.projectPoint = function (point) {
    // http://stackoverflow.com/questions/10301001/perpendicular-on-a-line-segment-from-a-given-point
    var otherPointThanOrigin = this.pointAtDistanceFromOrigin(50);
    var px = otherPointThanOrigin.x - this.origin.x;
    var py = otherPointThanOrigin.y - this.origin.y;
    var dAB = px * px + py * py;
    var u = ((point.x - this.origin.x) * px + (point.y - this.origin.y) * py) / dAB;
    return new seatsio.Point(this.origin.x + u * px, this.origin.y + u * py);
};

seatsio.AbstractRay.prototype.mirror = function (point) {
    var projectedPoint = this.projectPoint(point);
    var distance = point.distanceToPoint(projectedPoint);
    return new seatsio.Ray(projectedPoint, point).plusAngle(180).pointAtDistanceFromOrigin(distance);
};

seatsio.AbstractRay.prototype.isInFirstQuadrant = function () {
    return this.angle() >= 0 && this.angle() < 90;
};

seatsio.AbstractRay.prototype.isInFourthQuadrant = function () {
    return this.angle() >= 270 && this.angle() < 360;
};

seatsio.RayFromOriginAndAngle = function (origin, angleInDegrees) {
    this.angleInDegrees = angleInDegrees;
    this.init(origin);
};

seatsio.RayFromOriginAndAngle.prototype = new seatsio.AbstractRay();

seatsio.RayFromOriginAndAngle.prototype.angle = function () {
    return this.normalizeAngle(this.angleInDegrees);
};

seatsio.RayFromOriginAndAngle.prototype.snapToAngle = function (angle) {
    var snappedAngle = Math.round(this.angle() / angle) * angle;
    return new seatsio.RayFromOriginAndAngle(this.origin, snappedAngle);
};

seatsio.Ray = function (origin, end) {
    this.init(origin);
    this.end = end;
};

seatsio.Ray.prototype = new seatsio.AbstractRay();

seatsio.Ray.prototype.angle = function () {
    return this.normalizeAngle(Raphael.angle(this.end.x, this.end.y, this.origin.x, this.origin.y));
};

seatsio.Ray.prototype.enlarge = function (distance) {
    var newEndpoint = this.pointAtDistanceFromOrigin(this.length() + distance);
    return new seatsio.Ray(this.origin, newEndpoint);
};

seatsio.Ray.prototype.enlargeOnBothSides = function (distance) {
    return this.enlarge(distance).revert().enlarge(distance);
};

seatsio.Ray.prototype.enlargeByFactor = function (factor) {
    return this.enlarge(this.length() * (factor - 1));
};

seatsio.Ray.prototype.snapToAngle = function (angle) {
    var snappedAngle = Math.round(this.angle() / angle) * angle;
    var snappedEndpoint = new seatsio.RayFromOriginAndAngle(this.origin, snappedAngle).pointAtDistanceFromOrigin(this.length());
    return new seatsio.Ray(this.origin, snappedEndpoint);
};

seatsio.Ray.prototype.pointAtDistanceFromPoint = function (distance, point) {
    return new seatsio.Point(
            (distance * Math.cos(this.angleInRadians())) + point.x,
            (distance * Math.sin(this.angleInRadians())) + point.y
    );
};

seatsio.Ray.prototype.pointAtDistanceFromEnd = function (distance) {
    return this.pointAtDistanceFromPoint(distance, this.end);
};

seatsio.Ray.prototype.length = function () {
    return this.origin.distanceToPoint(this.end);
};

seatsio.Ray.prototype.pointsAtInterval = function (interval) {
    var points = [];
    for (var distance = 0; distance <= this.length(); distance += interval) {
        points.push(this.pointAtDistanceFromOrigin(distance));
    }
    return points;
};

seatsio.Ray.prototype.revert = function () {
    return new seatsio.Ray(this.end, this.origin);
};

seatsio.Ray.prototype.distanceToPoint = function (point) {
    // based on http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
    if (this.length() == 0) {
        return point.distanceToPoint(this.origin);
    }
    var t = ((point.x - this.origin.x) * (this.end.x - this.origin.x) + (point.y - this.origin.y) * (this.end.y - this.origin.y)) / (this.length() * this.length());
    if (t < 0) {
        return point.distanceToPoint(this.origin);
    }
    if (t > 1) {
        return point.distanceToPoint(this.end);
    }
    return point.distanceToPoint(this.origin.add(new seatsio.Point(t * (this.end.x - this.origin.x), t * (this.end.y - this.origin.y))))
};

seatsio.Ray.prototype.drawLine = function (designer) {
    return designer.drawLineBetweenPoints(this.origin, this.end);
};


(function (S) {
    S.ChairMousePointer = function (designer) {

        var chairMousePointer;

        this.init = function () {
            chairMousePointer = designer.paper.circle(0, 0, 0)
                .attr({"fill": 'white', "stroke": 'DarkTurquoise'})
                .toLayer('objectsLayer', designer)
                .hide();
            return this;
        };

        this.hide = function () {
            chairMousePointer.hide();
        };

        this.show = function (point) {
            chairMousePointer.attr('r', S.Chair.straal()).toLayer('objectsLayer', designer).show().applyZoom(designer);
            var pointerSnappedToGrid = designer.snapPoint(point);
            chairMousePointer.attr({'cx': pointerSnappedToGrid.x, 'cy': pointerSnappedToGrid.y});
        }

    }
})(seatsio);

Raphael.st.startTransformation = function () {
    this.forEach(function (el) {
        el.transformationAtStart = el.matrix.toTransformString();
    });
    return this;
};
Raphael.st.transform = function (transformation) {
    this.forEach(function (el) {
        el.transform(transformation + el.transformationAtStart);
    });
    return this;
};
Raphael.st.endTransformation = function () {
    this.forEach(function (el) {
        el.transformationAtStart = undefined;
    });
    return this;
};

Raphael.st.toLayer = function (layerName, designer) {
    this.forEach(function (el) {
        el.toLayer(layerName, designer);
    });
    return this;
};

Raphael.st.applyZoom = function (designer) {
    this.forEach(function (el) {
        el.applyZoom(designer);
    });
    return this;
};

Raphael.st.toArray = function () {
    var result = [];
    this.forEach(function (el) {
        result.push(el);
    });
    return result;
};

Raphael.el.applyZoom = function (designer) {
    designer.zoomer.applyToElement(this);
    return this;
};

Raphael.el.applyZoomButKeepSize = function(designer) {
    this.keepSize = true;
    designer.zoomer.applyToElement(this);
    return this;
};

Raphael.el.bboxNotDirtyEvenIfRaphaelThinksSo = function () {
    this._.dirty = 0;
};

Raphael.el.attrIf = function (condition, attrs) {
    if (condition) {
        this.attr(attrs);
    }
    return this;
};

Raphael.el.originalGetBBox = Raphael.el.getBBox;

Raphael.el.bboxNeedsToBeComputed = function () {
    return this._.dirty || this._.dirtyT || !this._.bbox || !this.seatsioBbox;
};

Raphael.el.computeBbox = function () {
    var center = new seatsio.Point(this.attr('cx'), this.attr('cy')).toView(seatsio.designer);
    return {
        'x': center.x - ((seatsio.Chair.straalPlusStroke()) * seatsio.designer.zoomer.zoomLevel),
        'y': center.y - ((seatsio.Chair.straalPlusStroke()) * seatsio.designer.zoomer.zoomLevel),
        'width': seatsio.Chair.widthPlusStroke * seatsio.designer.zoomer.zoomLevel,
        'height': seatsio.Chair.widthPlusStroke * seatsio.designer.zoomer.zoomLevel
    };
};

Raphael.el.getBBox = function (isWithoutTransform) {
    if (isWithoutTransform || this.seatsioObjectType != 'chair') {
        return this.originalGetBBox(isWithoutTransform);
    }
    if (this.bboxNeedsToBeComputed()) {
        this.seatsioBbox = this.computeBbox();
    }
    return this.seatsioBbox;
};

Raphael.el.setExtraZoom = function (zoom) {
    this.extraZoom = zoom;
    return this;
};

Raphael.el.zoomAndRotate = function (rotationAngle, designer) {
    this.rotationAngle = rotationAngle;
    this.applyZoom(designer);
    return this;
};

Raphael.el.zoomAndRotateAround = function (rotationAngle, center, designer) {
    this.applyZoom(designer);
    this.transform('...r' + rotationAngle + ',' + center.x + ',' + center.y);
    return this;
};

Raphael.el.toLayer = function (layerName, designer) {
    designer.layers.add(this, layerName);
    return this;
};

Raphael.el.originalRemove = Raphael.el.remove;
Raphael.el.remove = function () {
    if (this.seatsioLayer) {
        this.seatsioLayer.remove(this);
    }
    this.originalRemove();
};

Raphael.el.getCentroid = function () {
    // thanks to https://gist.github.com/dcousineau/1367663
    var centroid = {x: 0, y: 0}
        , area = 0
        , length = this.getTotalLength()
        , lengthSegment = length / 30.00;

    for (var i = 0; i < length; i += lengthSegment) {
        var curr = this.getPointAtLength(i)
            , next = this.getPointAtLength(i + lengthSegment);

        centroid.x += (curr.x + next.x) * (curr.x * next.y - next.x * curr.y);
        centroid.y += (curr.y + next.y) * (curr.x * next.y - next.x * curr.y);

        area += (curr.x * next.y - next.x * curr.y);
    }

    area = area / 2.0;

    centroid.x = centroid.x / (6 * area);
    centroid.y = centroid.y / (6 * area);

    return new seatsio.Point(centroid.x, centroid.y);
};

Raphael.el.lighter = function (times) {
    times = times || 2;

    var fs = [this.attrs.fill, this.attrs.stroke];

    this.fs = this.fs || [fs[0], fs[1]];

    fs[0] = Raphael.rgb2hsb(Raphael.getRGB(fs[0]).hex);
    fs[1] = Raphael.rgb2hsb(Raphael.getRGB(fs[1]).hex);
    fs[0].b = Math.min(fs[0].b * times, 1);
    fs[0].s = fs[0].s / times;
    fs[1].b = Math.min(fs[1].b * times, 1);
    fs[1].s = fs[1].s / times;

    this.attr({fill: "hsb(" + [fs[0].h, fs[0].s, fs[0].b] + ")", stroke: "hsb(" + [fs[1].h, fs[1].s, fs[1].b] + ")"});
    return this;
};

Raphael.el.darker = function (times) {
    times = times || 2;

    var fs = [this.attrs.fill, this.attrs.stroke];

    this.fs = this.fs || [fs[0], fs[1]];

    fs[0] = Raphael.rgb2hsb(Raphael.getRGB(fs[0]).hex);
    fs[1] = Raphael.rgb2hsb(Raphael.getRGB(fs[1]).hex);
    fs[0].s = Math.min(fs[0].s * times, 1);
    fs[0].b = fs[0].b / times;
    fs[1].s = Math.min(fs[1].s * times, 1);
    fs[1].b = fs[1].b / times;

    this.attr({fill: "hsb(" + [fs[0].h, fs[0].s, fs[0].b] + ")", stroke: "hsb(" + [fs[1].h, fs[1].s, fs[1].b] + ")"});
    return this;
};

Raphael.el.resetBrightness = function () {
    if (this.fs) {
        this.attr({fill: this.fs[0], stroke: this.fs[1]});
        delete this.fs;
    }
    return this;
};

var KEYS = {
    DEL: 46,
    Z: 90,
    SHIFT: 16,
    ENTER: 13,
    ESCAPE: 27
};

function enterPressed(e) {
    return e.keyCode == KEYS.ENTER;
}

function draggingReallyStartedAndNotJustClick(dx, dy) {
    return Math.abs(dx) > 3 || Math.abs(dy) > 3;
}

function average(i, j) {
    return (i + j) / 2;
}

seatsio.set = function (paper) {
    return pushAll(paper.set(), Array.prototype.slice.call(arguments, 1));
};

function pushAll(set, elements) {
    if (typeof elements.forEach == 'function') {
        elements.forEach(function (element) {
            if (element) {
                pushAll(set, element);
            }
        })
    } else if (elements) {
        set.push(elements);
    }
    return set;
}

Array.prototype.flatMap = function (lambda) {
    return Array.prototype.concat.apply([], this.map(lambda));
};

Array.prototype.findOne = function (predicate) {
    for (var i = 0; i < this.length; ++i) {
        if (predicate(this[i])) {
            return this[i];
        }
    }
};

Array.prototype.nonFalsies = function () {
    return this.filter(function (e) {
        return e;
    });
};

Array.prototype.uniques = function () {
    return this.reduce(function (p, c) {
        if (p.indexOf(c) < 0) p.push(c);
        return p;
    }, []);
};

Array.prototype.peek = function () {
    return this[this.length - 1];
};

Array.prototype.first = function () {
    return this[0];
};

Array.prototype.onlyElementOr = function (defaultValue, modifier) {
    if (this.length === 1) {
        if (modifier) {
            return modifier(this[0]);
        } else {
            return this[0];
        }
    }
    return defaultValue;
};

Array.prototype.last = Array.prototype.peek;

Array.prototype.remove = function (el) {
    var index = this.indexOf(el);
    if (index >= 0) {
        this.splice(index, 1);
    }
    return this;
};

Array.prototype.uniques = function () {
    var toUniques = function (p, c) {
        if (p.indexOf(c) < 0) p.push(c);
        return p;
    };
    return this.reduce(toUniques, []);
};

Array.prototype.contains = function (obj) {
    return this.indexOf(obj) != -1;
};

Array.prototype.toSet = function (designer) {
    var set = seatsio.set(designer.paper);
    pushAll(set, this);
    return set;
};

function deepCopy(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for (; i < len; i++) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
}

jQuery.fn.selectText = function () {
    // http://stackoverflow.com/questions/12243898/how-to-select-all-text-in-contenteditable-div
    var doc = document;
    var element = this[0];
    var range;
    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        var selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    return this;
};

jQuery.fn.isFullInViewport = function () {
    var t = this.get(0);
    var viewportWidth = $(window).width();
    var viewportHeight = $(window).height();
    if (typeof t.getBoundingClientRect === 'function') {
        var rect = t.getBoundingClientRect();
        var topVisible = rect.top >= 0 && rect.top < viewportHeight;
        var bottomVisible = rect.bottom >= 0 && rect.bottom <= viewportHeight;
        var leftVisible = rect.left >= 0 && rect.left < viewportWidth;
        var rightVisible = rect.right >= 0 && rect.right <= viewportWidth;
        return topVisible && bottomVisible && leftVisible && rightVisible;
    } else {
        var viewTop = $(window).scrollTop();
        var viewBottom = viewTop + viewportHeight;
        var viewLeft = $(window).scrollLeft();
        var viewRight = viewLeft + viewportWidth;
        var _top = this.offset().top;
        var _bottom = _top + this.height();
        var _left = this.offset().left;
        var _right = _left + this.width();
        return _bottom <= viewBottom
            && _top >= viewTop
            && _right <= viewRight
            && _left >= viewLeft;
    }
};


seatsio.randomUuid = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

function isInteger(x) {
    return /^\+?(0|[1-9]\d*)$/.test(x);
}

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function (suffix) {
        suffix = suffix.toLowerCase();
        return this.toLowerCase().indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

function whitespaceToNonBreakingSpaces(str) {
    return str.replace(/\s/g, String.fromCharCode(160));
}

function toSecondOrThirdQuadrant(angle) {
    if (angle > 90 && angle <= 270) {
        return angle + 180;
    }
    return angle;
}

function toJson(object) {
    return object.toJson();
}

function cloneJson(json) {
    if (!json) {
        return json;
    }
    return JSON.parse(JSON.stringify(json));
}

/*****************************************************************************
 *                                                                            *
 *  SVG Path Rounding Function                                                *
 *  Copyright (C) 2014 Yona Appletree                                         *
 *                                                                            *
 *  Licensed under the Apache License, Version 2.0 (the "License");           *
 *  you may not use this file except in compliance with the License.          *
 *  You may obtain a copy of the License at                                   *
 *                                                                            *
 *      http://www.apache.org/licenses/LICENSE-2.0                            *
 *                                                                            *
 *  Unless required by applicable law or agreed to in writing, software       *
 *  distributed under the License is distributed on an "AS IS" BASIS,         *
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 *  See the License for the specific language governing permissions and       *
 *  limitations under the License.                                            *
 *                                                                            *
 *****************************************************************************/

/**
 * SVG Path rounding function. Takes an input path string and outputs a path
 * string where all line-line corners have been rounded. Only supports absolute
 * commands at the moment.
 *
 * @param pathString The SVG input path
 * @param radius The amount to round the corners, either a value in the SVG
 *               coordinate space, or, if useFractionalRadius is true, a value
 *               from 0 to 1.
 * @param useFractionalRadius If true, the curve radius is expressed as a
 *               fraction of the distance between the point being curved and
 *               the previous and next points.
 * @returns A new SVG path string with the rounding
 */
function roundPathCorners(pathString, radius, useFractionalRadius) {
    function moveTowardsLength(movingPoint, targetPoint, amount) {
        var width = (targetPoint.x - movingPoint.x);
        var height = (targetPoint.y - movingPoint.y);

        var distance = Math.sqrt(width*width + height*height);

        return moveTowardsFractional(movingPoint, targetPoint, Math.min(1, amount / distance));
    }
    function moveTowardsFractional(movingPoint, targetPoint, fraction) {
        return {
            x: movingPoint.x + (targetPoint.x - movingPoint.x)*fraction,
            y: movingPoint.y + (targetPoint.y - movingPoint.y)*fraction
        };
    }

    // Adjusts the ending position of a command
    function adjustCommand(cmd, newPoint) {
        if (cmd.length > 2) {
            cmd[cmd.length - 2] = newPoint.x;
            cmd[cmd.length - 1] = newPoint.y;
        }
    }

    // Gives an {x, y} object for a command's ending position
    function pointForCommand(cmd) {
        return {
            x: parseFloat(cmd[cmd.length - 2]),
            y: parseFloat(cmd[cmd.length - 1])
        };
    }

    // Split apart the path, handing concatonated letters and numbers
    var pathParts = pathString
        .split(/[,\s]/)
        .reduce(function(parts, part){
            var match = part.match("([a-zA-Z])(.+)");
            if (match) {
                parts.push(match[1]);
                parts.push(match[2]);
            } else {
                parts.push(part);
            }

            return parts;
        }, []);

    // Group the commands with their arguments for easier handling
    var commands = pathParts.reduce(function(commands, part) {
        if (parseFloat(part) == part && commands.length) {
            commands[commands.length - 1].push(part);
        } else {
            commands.push([part]);
        }

        return commands;
    }, []);

    // The resulting commands, also grouped
    var resultCommands = [];

    if (commands.length > 1) {
        var startPoint = pointForCommand(commands[0]);

        // Handle the close path case with a "virtual" closing line
        var virtualCloseLine = null;
        if (commands[commands.length - 1][0] == "Z" && commands[0].length > 2) {
            virtualCloseLine = ["L", startPoint.x, startPoint.y];
            commands[commands.length - 1] = virtualCloseLine;
        }

        // We always use the first command (but it may be mutated)
        resultCommands.push(commands[0]);

        for (var cmdIndex=1; cmdIndex < commands.length; cmdIndex++) {
            var prevCmd = resultCommands[resultCommands.length - 1];

            var curCmd = commands[cmdIndex];

            // Handle closing case
            var nextCmd = (curCmd == virtualCloseLine)
                ? commands[1]
                : commands[cmdIndex + 1];

            // Nasty logic to decide if this path is a candidite.
            if (nextCmd && prevCmd && (prevCmd.length > 2) && curCmd[0] == "L" && nextCmd.length > 2 && nextCmd[0] == "L") {
                // Calc the points we're dealing with
                var prevPoint = pointForCommand(prevCmd);
                var curPoint = pointForCommand(curCmd);
                var nextPoint = pointForCommand(nextCmd);

                // The start and end of the cuve are just our point moved towards the previous and next points, respectivly
                var curveStart, curveEnd;

                if (useFractionalRadius) {
                    curveStart = moveTowardsFractional(curPoint, prevCmd.origPoint || prevPoint, radius);
                    curveEnd = moveTowardsFractional(curPoint, nextCmd.origPoint || nextPoint, radius);
                } else {
                    curveStart = moveTowardsLength(curPoint, prevPoint, radius);
                    curveEnd = moveTowardsLength(curPoint, nextPoint, radius);
                }

                // Adjust the current command and add it
                adjustCommand(curCmd, curveStart);
                curCmd.origPoint = curPoint;
                resultCommands.push(curCmd);

                // The curve control points are halfway between the start/end of the curve and
                // the original point
                var startControl = moveTowardsFractional(curveStart, curPoint, .5);
                var endControl = moveTowardsFractional(curPoint, curveEnd, .5);

                // Create the curve
                var curveCmd = ["C", startControl.x, startControl.y, endControl.x, endControl.y, curveEnd.x, curveEnd.y];
                // Save the original point for fractional calculations
                curveCmd.origPoint = curPoint;
                resultCommands.push(curveCmd);
            } else {
                // Pass through commands that don't qualify
                resultCommands.push(curCmd);
            }
        }

        // Fix up the starting point and restore the close path if the path was orignally closed
        if (virtualCloseLine) {
            var newStartPoint = pointForCommand(resultCommands[resultCommands.length-1]);
            resultCommands.push(["Z"]);
            adjustCommand(resultCommands[0], newStartPoint);
        }
    } else {
        resultCommands = commands;
    }

    return resultCommands.reduce(function(str, c){ return str + c.join(" ") + " "; }, "");
}


(function (S) {
    S.ObjectsSelector = function (designer) {

        var selectionRectangle;
        var selectedObjects = [];

        this.startSelection = function (fromPosition) {
            this.fromPosition = fromPosition;
        };

        this.selectMultipleObjects = function (toPosition) {
            selectedObjects.forEach(function (object) {
                object.unhighlight()
            });
            selectedObjects = [];
            if (selectionRectangle) {
                selectionRectangle.remove();
            }
            if (this.fromPosition.equals(toPosition)) {
                return;
            }
            selectionRectangle = designer.drawRectangle(this.fromPosition.x, this.fromPosition.y, toPosition.x, toPosition.y).applyZoom(designer);
            selectionRectangle.attr({'stroke-dasharray': ['--']});
            var selectionRectangleBBox = selectionRectangle.getBBox();
            designer.activeSubChart().allSelectableObjects().forEach(function (object) {
                var visibleElementsSet = object.visibleElementsSet();
                for (var i = 0; i < visibleElementsSet.length; ++i) {
                    if (Raphael.isBBoxIntersect(selectionRectangleBBox, visibleElementsSet[i].getBBox())) {
                        selectedObjects.push(object);
                        object.highlight();
                        break;
                    }
                }
            });
        };

        this.deselectObjects = function () {
            selectedObjects = [];
        };

        this.stopSelecting = function () {
            if (selectionRectangle) {
                selectionRectangle.remove();
                selectionRectangle = null;
            }
        };

        this.selectedObjects = function () {
            return selectedObjects;
        };

        this.objectsSelected = function () {
            return selectedObjects.length > 0;
        };

    }
})(seatsio);

/* etiqueta de texto */
(function (S) {
    S.TextInput = function (origin, subChart) {

        var designer = subChart.designer;

        this.init(designer, true);

        var me = this;
        var textElement;

        this.typedText = S.TextInput.defaultInputValue;
        this.fontSize = S.TextInput.defaultFontSize;
        this.textColor = S.TextInput.defaultTextColor;
        this.rotationAngle = 0;
        this.textAboveEverything = 0;
        this.layer = 'textsLayer';
        this.emojis = [ '&#xe800;','&#xe81c;', '&#xe811;', '&#xe80d;', '&#xe809;', 
                        '&#xe805;', '&#xe802;', '&#xe819;', '&#xe80e;', '&#xe818;',
                        '&#xe81d;', '&#xe816;', '&#xe813;', '&#xe812;', '&#xe822;',
                        '&#xe817;', '&#xe806;', '&#xe804;', '&#xe803;', '&#xe807;', 
                        '&#xe808;', '&#xe801;', '&#xe81f;', '&#xe80a;', '&#xe80b;', 
                        '&#xe821;', '&#xe836','&#xe837','&#xe838','&#xe839',
                        '&#xe83a','&#xe83b','&#xe83c','&#xe83d'];
        
        this.defaultTexts = ["seatmap.seatmap_editor.Corridor", "seatmap.seatmap_editor.Stage", "seatmap.seatmap_editor.Theatre_box", "seatmap.seatmap_editor.Bar", 
                            "seatmap.seatmap_editor.Low_visibility", "seatmap.seatmap_editor.Reduced_mobility", "seatmap.seatmap_editor.Access_gate", 
                            "seatmap.seatmap_editor.Amphitheatre", "seatmap.seatmap_editor.Seating_area", "seatmap.seatmap_editor.Personalised_text"];

        this.duplicate = function () {
            return subChart.addTextInput(S.TextInput.fromJson(this.toJson(), subChart));
        };

        this.center = function () {
            return origin;
        };

        this.moved = function (distance) {
            origin = origin.add(distance);
            this.redraw();
        };

        this.setFontSize = function (fontSize) {
            this.fontSize = fontSize;
            this.redraw();
        };

        this.setTextColor = function (textColor) {
            this.textColor = textColor;
            this.redraw();
        };

        this.setTextAboveEverything = function (bool) {
            this.textAboveEverything = bool ? 1 : 0;
        };

        this.rotated = function (rotationCenter, angle) {
            origin = origin.rotateAround(rotationCenter, angle);
            this.rotationAngle += angle;
            this.redraw();
        };

        this.blur = function () {
            textElement.attr({'opacity': 0.5});
            textElement.bboxNotDirtyEvenIfRaphaelThinksSo();
        };

        this.unblur = function () {
            textElement.attr({'opacity': 1});
            textElement.bboxNotDirtyEvenIfRaphaelThinksSo();
        };

        this.draw = function () {

            var typedText = this.typedText;
            var defaultTextComplement = "";
            if (typedText.indexOf(" - ") !== -1)
            {
                typedText = me.getTranslation(typedText);
                defaultTextComplement = typedText[1];

                if(defaultTextComplement != "" && defaultTextComplement.length > 0)
                {
                    defaultTextComplement = " - " + defaultTextComplement;
                }

                typedText = typedText[0];                
            }

            var isDefaultText = this.defaultTexts.contains(typedText);

            if(this.emojis.contains(this.typedText))
            {
                textElement =  designer.paper.textIcon(origin.x, origin.y, this.typedText);
            }
            else if(isDefaultText)
            {

                typedText = polyglot.t(typedText) + defaultTextComplement;
                textElement =  designer.paper.text(origin.x, origin.y, whitespaceToNonBreakingSpaces(typedText));
            }
            else
            {
                textElement =  designer.paper.text(origin.x, origin.y, whitespaceToNonBreakingSpaces(this.typedText));
            }
            
            textElement = textElement.attr({'font-size': this.fontSize, 'fill': this.textColor, 'font-family': 'Roboto, Arial'})
            .toLayer(this.layer, designer)
            .zoomAndRotate(this.rotationAngle, designer);
            this.objectDrawn();
            return this;
        };

        this.undraw = function () {
            this.objectUndrawn();
            if (textElement) {
                textElement.remove();
            }
            return this;
        };

        this.redraw = function () {
            this.undraw();
            this.draw();
        };

        this.remove = function () {
            subChart.removeTextInput(this);
        };

        this.visibleElementsSet = function () {
            return S.set(designer.paper, textElement);
        };

        this.highlight = function () {
        };

        this.unhighlight = function () {
        };

        this.createEmojisGrid = function () {
            var div = $('<ul class="control text_wrapper emojis-wrapper">');

            this.emojis.forEach(text => {
                $('<li><span style="font-family: \'seatmap_icons\';">' + text + '</span></li>')
                .bind('click', function () {
                    me.typedText = text;
                    me.redraw();
                })
                .appendTo(div);
            });

            return div;
        }

        this.createTextContextMenu = function () {
            var div = $('<ul class="control text_wrapper">');

            this.defaultTexts.forEach((text, i) => {

                if(i == this.defaultTexts.length -1)
                {
                    $('<li id="' + text + '"><button class="button terciary">' + polyglot.t(text) + '</button></li>')
                    .bind('click', function () {
                        me.typedText = S.TextInput.defaultInputValue;
                        $(controlerIframe).find('#label').select().trigger("focus");
                        me.redraw();
                    })
                    .appendTo(div);
                }
                else
                {                    
                    $('<li id="' + text + '" class="' + (i === 0 ? 'text-item-separator' : '') + ' default-text-clickable" >' + polyglot.t(text) + '</li>')
                    .bind('click', function () {
                        me.typedText = $(this)[0].id;
                        me.redraw();
                    })
                    .appendTo(div);
                }
            });

            return div;
        }

        this.getTranslation = function (text) {
            return text.replace(/\s/g,'').split("-");
        }

        this.createInputField = function () {
            var defaultTextComplement = "";
            var typedText = me.typedText;

            if (typedText.indexOf(" - ") !== -1)
            {
                typedText = me.getTranslation(typedText);
                defaultTextComplement = typedText[1];
                typedText = typedText[0];                
            }

            var isDefaultText = this.defaultTexts.contains(typedText);
            var div = $('<div class="control text_wrapper"><label>'+polyglot.t("seatmap.Label_value")+'</label>');
            var mainInputHTML = "";

            if(this.emojis.contains(typedText))
            {
                designer.tooltip.isPlainText = false;

                $('<div class="emoji-container"><span style="font-family: \'seatmap_icons\'">' + this.typedText + '</span>')
                    .bind('change keyup', function () {
                        me.typedText = $(this).val();
                        if (me.typedText === '') {
                            me.remove();
                        } else {
                            me.redraw();
                        }
                    })
                    .bind('keypress', function (e) {
                        if (e.keyCode == 13) {
                            designer.setState(new S.SelectionModeState(designer));
                        }
                    })
                    .bind('shown', function () {
                        $(this).trigger("focus").select();
                    })
                    .appendTo(div);
            }
            else
            {
                designer.tooltip.isPlainText = true;

                mainInputHTML = isDefaultText 
                            ? '<input id="input-text-label" class="shownListener large-8 columns end mr1" readonly />'
                            : '<input id="input-text-label" class="input_text shownListener" />';

                $(mainInputHTML).val(polyglot.t(typedText))
                    .data("trans", typedText)
                    .bind('change keyup', function () {
                        me.typedText = $(this).val();
                        if (me.typedText === '') {
                            me.remove();
                        } else {
                            me.redraw();
                        }
                    })
                    .bind('keypress', function (e) {
                        if (e.keyCode == 13) {
                            designer.setState(new S.SelectionModeState(designer));
                        }
                    })
                    .bind('shown', function () {
                        $(this).trigger("focus").select();
                    })
                    .appendTo(div);
                    
                if(isDefaultText)
                {
                    $('<input class="shownListener large-3 columns end" />').val(defaultTextComplement)
                    .bind('change keyup', function () {
                        var typedValue = $(this).val();
                        
                        if(typedValue != "")
                        {
                            typedValue = " - " + typedValue;
                        }
                        
                        me.typedText = $('#input-text-label').data('trans') + typedValue;
                        if (me.typedText === '') {
                            me.remove();
                        } else {
                            me.redraw();
                        }
                    })
                    .bind('keypress', function (e) {
                        if (e.keyCode == 13) {
                            designer.setState(new S.SelectionModeState(designer));
                        }
                    })
                    .bind('shown', function () {
                        $(this).trigger("focus").select();
                    })
                    .appendTo(div);
                }
            }

            return div;
        };

        this.toJson = function () {
            var centerAsJson = origin.toJson(designer);
            return {
                'text': this.typedText,
                'centerX': centerAsJson.x,
                'centerY': centerAsJson.y,
                'rotationAngle': this.rotationAngle,
                'fontSize': this.fontSize,
                'textColor': this.textColor,
                'textAboveEverything': this.textAboveEverything,
                'objectType': 'text'
            }
        };

    };

    S.TextInput.prototype = new S.Object();

    S.TextInput.fromJson = function (json, subChart) {
        return S.TextInput.fromOriginAndText(S.Point.fromJson({x: json.centerX, y: json.centerY}, subChart), json.text, json.fontSize, json.textColor, json.rotationAngle, json.textAboveEverything, subChart);
    };

    S.TextInput.fromOriginAndText = function (origin, text, fontSize, textColor, rotationAngle, textAboveEverything, subChart) {
        var textInput = new S.TextInput(origin, subChart);
        textInput.typedText = text;
        textInput.rotationAngle = rotationAngle;
        textInput.fontSize = fontSize ? fontSize : S.TextInput.defaultFontSize;
        textInput.textColor = textColor ? textColor : S.TextInput.defaultTextColor;
        textInput.textAboveEverything = textAboveEverything ? textAboveEverything : 0;
        return textInput;
    };


    S.TextInput.defaultFontSize = 20;
    S.TextInput.defaultTextColor = '#000';
    S.TextInput.defaultInputValue = "LABEL";

})(seatsio);


(function (S) {

    var dimensionsStore = {
        cache: {},
        getDimensions: function(element, characterHeight) {
            var textLength = element.text().length;
            var cacheKey = textLength + "|" + characterHeight;
            var dimensions = this.cache[cacheKey];
            if(!dimensions) {
                dimensions = this.cache[cacheKey] = element[0].getBoundingClientRect();
            }
            return dimensions;
        }
    };

    S.LabelingTextInput = function (objectWithLabel, designer, withBackgroundColor, customFontConfig) {

        var me = this;
        var textElement = null;
        var fontConfig = customFontConfig ? customFontConfig : S.LabelingTextInput.FONT_CONFIG_MONOSPACE_NORMAL;

        this.labelAlwaysShown = false;
        this.characterHeight = fontConfig.characterHeight;
        this.rotation = 0;
        this.readOnly = true;

        this.draw = function () {
            textElement = $('<span class="editableText" contenteditable=\"true\">')
                .css({
                    'padding': 0,
                    'position': 'absolute',
                    'font-family': fontConfig.fontFamily,
                    'font-weight': fontConfig.fontWeight,
                    'cursor': 'pointer',
                    'font-size': this.characterHeight + 'px',
                    'line-height': this.characterHeight + 'px',
                    'white-space': 'pre'
                })
                .text(objectWithLabel.label)
                .focus(function () {
                    $(this).selectText()
                        .one('mouseup', function (e) {
                            $(this).off('keyup');
                            e.preventDefault();
                        })
                        .one('keyup', function () {
                            $(this).selectText().off('mouseup');
                        });
                })
                .blur(function () {
                    objectWithLabel.changeLabel(getTypedText());
                    textElement.text(objectWithLabel.label);
                    positionTextElement(textElement);
                })
                .on("click", function () {
                    $(this).selectText();
                })
                .keydown(function (e) {
                    if (enterPressed(e)) {
                        return false;
                    }
                    positionTextElement();
                })
                .appendTo(designer.canvas().parent());
            if (withBackgroundColor) {
                textElement.css({'background-color': '#383c48', 'padding': '0px 3px', 'color': 'white'});
            }
            if (this.readOnly) {
                textElement.css('pointer-events', 'none')
            }
            positionTextElement(textElement);
            rotateTextElement(textElement);
            return this;
        };

        this.setReadOnly = function () {
            this.readOnly = true;
            return this;
        };

        this.setNotReadOnly = function () {
            this.readOnly = false;
            return this;
        };

        this.applyZoom = function () {
            if (textElement) {
                positionTextElement();
            }
        };

        this.objectDrawn = function () {
            if (designer.labelsShown()) {
                this.draw();
            }
            return this;
        };

        this.objectUndrawn = function () {
            this.undraw();
        };

        function rotateTextElement(textElement) {
            textElement
                .css('transform', 'rotate(' + toSecondOrThirdQuadrant(objectWithLabel.getRotation()) + 'deg)')
                .css('transform-origin', 'center center');
        }

        function getTypedText() {
            var typedText = textElement.text();
            if (!typedText) {
                return objectWithLabel.label;
            }
            return typedText;
        }

        function positionTextElement() {
            var dimensions = dimensionsStore.getDimensions(textElement, fontConfig.characterHeight);
            var position = objectWithLabel.labelPosition()
                .toView(designer)
                .addToY(-dimensions.height / 2)
                .addToX(-dimensions.width / 2);
            textElement.css({
                'left': position.x + 'px',
                'top': position.y + 'px'
            });
        }

        this.undraw = function () {
            if (textElement) {
                textElement.remove();
                textElement = null;
            }
            return this;
        };

        this.redraw = function () {
            if(textElement) {
                return this.undraw().draw();
            }
            return this;
        }

    };

    S.LabelingTextInput.FONT_CONFIG_MONOSPACE_NORMAL = {
        'characterHeight': 12,
        'fontFamily': 'Roboto, Helvetica, Arial, sans-serif',
        'fontWeight': 'bold'
    };

    S.LabelingTextInput.FONT_CONFIG_BIG = {
        'characterHeight': 28,
        'fontFamily': 'Roboto, Helvetica, Arial, sans-serif'
    };

    S.LabelingTextInput.emptyLabel = "?";
})(seatsio);

(function (S) {
    S.HelperLines = function (designer) {

        var SENSITIVITY = S.Chair.width / 1.5;

        var helperLines = [];
        var areClosestRowHelperLinesShown = false;

        this.draw = function (point, rowToExclude) {
            this.undraw();
            if (designer.activeSubChart().rows.length == 0) {
                return;
            }
            var closestRow = findRowThatIsCloseEnough(point, rowToExclude);
            if (closestRow) {
                drawHelperLinesForClosestRow(closestRow, point);
                areClosestRowHelperLinesShown = true;
            }
        }

        this.areClosestRowHelperLinesShown = function () {
            return areClosestRowHelperLinesShown;
        }

        this.undraw = function () {
            helperLines.forEach(function (helperLine) {
                helperLine.undraw();
            });
            helperLines = [];
            areClosestRowHelperLinesShown = false;
        }

        function drawHelperLinesForClosestRow(closestRow, point) {
            drawHelperLinePerpendicularToRow(closestRow, point);
            drawLineParallelToRow(closestRow, point);
        }

        function drawHelperLinePerpendicularToRow(row, point) {
            var rayThroughRow = row.createRayFromFirstChairToLast();
            var closestPoint = point.findClosestTo(row.pointsToSnapTo());
            var tmpRay = new S.RayFromOriginAndAngle(closestPoint, rayThroughRow.angle()).plusAngle(90);
            var helperRay = new S.Ray(tmpRay.pointAtDistanceFromOrigin(-rayThroughRow.length()), tmpRay.pointAtDistanceFromOrigin(rayThroughRow.length()));
            helperLines.push(new S.HelperLine(helperRay, designer).draw());
        }

        function drawLineParallelToRow(row, point) {
            var rayThroughRow = row.createRayFromFirstChairToLast();
            var originOfHelperRay = findOriginOfHelperRay(row, rayThroughRow, point)
            var tmpRay = new S.RayFromOriginAndAngle(originOfHelperRay, rayThroughRow.angle());
            var helperRay = new S.Ray(tmpRay.pointAtDistanceFromOrigin(-rayThroughRow.length() * 1.5), tmpRay.pointAtDistanceFromOrigin(rayThroughRow.length() * 1.5));
            helperLines.push(new S.HelperLine(helperRay, designer).draw());
        }

        function findOriginOfHelperRay(row, rayThroughRow, point) {
            var possibleOrigin1 = rayThroughRow.plusAngle(90).pointAtDistanceFromOrigin(S.Chair.width + S.Chair.getRowSpacing());
            var possibleOrigin2 = rayThroughRow.plusAngle(-90).pointAtDistanceFromOrigin(S.Chair.width + S.Chair.getRowSpacing());
            if (possibleOrigin1.distanceToPoint(point) < possibleOrigin2.distanceToPoint(point)) {
                return possibleOrigin1;
            }
            return possibleOrigin2;
        }

        function findRowThatIsCloseEnough(point, rowToExclude) {
            var closestRow = findClosestRowTo(point, rowToExclude);
            if(!closestRow) {
                return;
            }
            var maxDistance = (S.Chair.width  * 2) + S.Chair.getRowSpacing();
            var distance = point.distanceToRow(closestRow);
            if (distance < maxDistance) {
                return closestRow;
            }
        }

        function findClosestRowTo(point, rowToExclude) {
            return designer.activeSubChart().rows.reduce(function (closestRow, row) {
                if (row == rowToExclude) {
                    return closestRow;
                }
                if (point.distanceToRow(row) < point.distanceToRow(closestRow)) {
                    return row;
                }
                return closestRow;
            });
        }

        this.snapTo = function (point) {
            var pointToSnapTo = findPossiblePointToSnapTo(point);
            if(pointToSnapTo && pointToSnapTo.distanceToPoint(point) < SENSITIVITY) {
                return pointToSnapTo;
            }
        }

        function findPossiblePointToSnapTo(point) {
            if (helperLines.length == 0) {
                return;
            }
            if (helperLines.length == 1) {
                return helperLines[0].projectPoint(point);
            }
            return intersectionOrProjection(point);
        }

        function intersectionOrProjection(point) {
            var intersection = helperLines[0].intersectionWith(helperLines[1]);
            if (intersection) {
                return intersection;
            }
            return helperLines[0].projectPoint(point);
        }

    }

    S.HelperLine = function (ray, designer) {

        this.draw = function () {
            this.line = designer.drawLineThroughRay(ray)
                .attr({'stroke-width': 1, 'stroke': '#000', 'stroke-dasharray': '.'})
                .applyZoom(designer)
                .toLayer('objectsLayer', designer);
            return this;
        }

        this.undraw = function () {
            this.line.remove();
        }

        this.projectPoint = function (point) {
            return ray.projectPoint(point);
        }

        this.intersectionWith = function (helperLine) {
            var intersection = Raphael.pathIntersection(this.line.attr('path'), helperLine.line.attr('path'));
            if (intersection.length > 0) {
                return new S.Point(intersection[0].x, intersection[0].y);
            }
        }

    }
})(seatsio);

(function (S) {
    S.Aligner = function () {

        this.alignCenter = function (selectedRowsObject) {
            var bbox = selectedRowsObject.bbox();
            doAndReselect(selectedRowsObject, function (row) {
                row.alignCenter(bbox.point1().x, bbox.point3().x);
            })
        };

        this.alignLeft = function (selectedRowsObject) {
            doAndReselect(selectedRowsObject, function (row) {
                row.alignLeft(selectedRowsObject.bbox().point1().x);
            })
        };

        this.alignRight = function (selectedRowsObject) {
            doAndReselect(selectedRowsObject, function (row) {
                row.alignRight(selectedRowsObject.bbox().point3().x);
            })
        };

        function doAndReselect(selectedRowsObject, f) {
            selectedRowsObject.getArrayOfObjects().forEach(f);
            selectedRowsObject.reselect();
        }
    }
})(seatsio);

(function (S) {
    S.Flipper = function () {

        this.flip = function (selectedRowsObject, isHorizontal) {
            var center = selectedRowsObject.bbox().center();
            selectedRowsObject.getArrayOfObjects().forEach(function (selectedObject) {
                if (selectedObject.flip) {
                    selectedObject.flip(center, isHorizontal);
                }
            });
        }

    }
})(seatsio);

(function (S) {
    S.AutoLabeler = function (objectWithSeats, designer) {

        var labelingPatterns = [
            NumericLabelingPattern
        ];

        this.go = function () {
            if (!canBeAutoLabeled(objectWithSeats)) {
                return;
            }
            var chairsAndNewLabels = generateLabels(objectWithSeats);
            if (chairsAndNewLabels) {
                chairsAndNewLabels.forEach(function (chairAndNewLabel) {
                    chairAndNewLabel.chair.label = chairAndNewLabel.label;
                    if(chairAndNewLabel.chair.labeler) {
                        chairAndNewLabel.chair.labeler.redraw();
                    }
                });
            }
        }

        function canBeAutoLabeled(objectWithSeats) {
            return objectWithSeats.canBeAutoLabeled
                && objectWithSeats.numberOfChairs() > 1
                && objectWithSeats.numberOfLabeledSeats() < objectWithSeats.numberOfChairs()
                && objectWithSeats.numberOfLabeledSeats() >= 2;
        }

        function generateLabels(objectWithSeats) {
            for (var i = 0; i < labelingPatterns.length; ++i) {
                try {
                    var result = new labelingPatterns[i](objectWithSeats).applyTo();
                    if (result) {
                        return result;
                    }
                } catch (err) {
                    if(err != "PatternNotApplicable") {
                        throw err;
                    }
                }
            }
            return null;
        }
    }

    function NumericLabelingPattern(objectWithSeats) {

        function findIndexesAndIntegerLabels() {
            var indexesAndLabels = [];
            objectWithSeats.getChairs().forEach(function (chair, index) {
                if (chair.hasLabel() && isInteger(chair.label)) {
                    indexesAndLabels.push({'index': index, 'label': parseInt(chair.label)});
                }
            });
            return indexesAndLabels;
        }

        this.applyTo = function () {
            var indexesAndLabels = findIndexesAndIntegerLabels();
            var diff = determineDiff(indexesAndLabels[0], indexesAndLabels[1]);
            return objectWithSeats.getChairs().map(function (chair, index) {
                var label = determineLabel(index, diff, indexesAndLabels[0]);
                if (label <= 0) {
                    throw "PatternNotApplicable";
                }
                return {
                    'chair': chair,
                    'label': label
                };
            });
        }

        function determineDiff(indexAndLabel1, indexAndLabel2) {
            var labelsDiff = indexAndLabel2.label - indexAndLabel1.label;
            var indexesDiff = indexAndLabel2.index - indexAndLabel1.index;
            return labelsDiff / indexesDiff;
        }

        function determineLabel(index, diff, referenceIndexAndLabel) {
            return referenceIndexAndLabel.label + (diff * (index - referenceIndexAndLabel.index));
        }
    }
})(seatsio);

(function (S) {
    S.Bbox = function (raphaelBbox, designer) {

        this.raphaelBbox = raphaelBbox;

        this.drawPathThroughPoints = function () {
            var path = 'M' + this.point1().x + ',' + this.point1().y + 'L' + this.point2().x + ',' + this.point2().y + ',' + this.point3().x + ',' + this.point3().y + ',' + this.point4().x + ',' + this.point4().y + ',' + this.point1().x + ',' + this.point1().y;
            return designer.paper.path(path).applyZoom(designer);
        };

        this.drawRectangle = function () {
            return designer.drawRectangle(this.point1().x, this.point1().y, this.point3().x, this.point3().y).applyZoom(designer);
        };

        this.point1 = function () {
            return S.Point.fromView(raphaelBbox.x, raphaelBbox.y, designer);
        };

        this.point2 = function () {
            return this.point1().addToX(this.width());
        };

        this.point3 = function () {
            return this.point1().addToX(this.width()).addToY(this.height());
        };

        this.point4 = function () {
            return this.point1().addToY(this.height());
        };

        this.middleTop = function () {
            return this.point1().averageWith(this.point2());
        };

        this.middleLeft = function () {
            return this.point1().averageWith(this.point4());
        };

        this.middleRight = function () {
            return this.point2().averageWith(this.point3());
        };

        this.center = function () {
            return this.middleLeft().averageWith(this.middleRight());
        };

        this.height = function () {
            return designer.zoomer.unzoom(raphaelBbox.height);
        };

        this.width = function () {
            return designer.zoomer.unzoom(raphaelBbox.width);
        };

        this.bbox = function () {
            return this;
        };

        this.adjustForStrokes = function () {
            var maxStrokeWidth = 1;
            var adjustedBbox = {
                x: this.raphaelBbox.x - maxStrokeWidth,
                y: this.raphaelBbox.y - maxStrokeWidth,
                width: this.raphaelBbox.width + 2 * maxStrokeWidth,
                height: this.raphaelBbox.height + 2 * maxStrokeWidth
            };
            return new S.Bbox(adjustedBbox, designer)
        };
    };

    S.Bbox.from = function (raphaelBbox, designer) {
        if (raphaelBbox.height == -Infinity) {
            return null;
        }
        return new S.Bbox(raphaelBbox, designer);
    }
})(seatsio);

(function (S) {
    S.ItemSelector = function (designer) {

        var me = this;

        var selectionRectangle;
        this.selectedItems = [];

        this.startSelection = function (startpoint) {
            this.startpoint = startpoint;
        };

        this.changeSelectionEndpoint = function (endpoint) {
            if (selectionRectangle) {
                selectionRectangle.remove();
            }
            selectionRectangle = designer
                .drawRectangle(this.startpoint.x, this.startpoint.y, endpoint.x, endpoint.y).applyZoom(designer)
                .attr({'stroke-dasharray': ['--'], 'stroke': 'DarkTurquoise'});
            me.selectedItems = [];
            doSelection(designer.activeSubChart().categorisableObjects());
            designer.numberOfSelectedObjectsMessage.showForSeats(me.selectedItems);
        };

        function doSelection(items) {
            items.forEach(function (item) {
                if (Raphael.isBBoxIntersect(selectionRectangle.getBBox(), item.bbox().raphaelBbox)) {
                    me.selectedItems.push(item);
                    item.highlight();
                } else {
                    item.unhighlight();
                }
            });
        }

        this.hasSelectedItems = function () {
            return this.selectedItems.length > 0;
        };

        this.stopSelecting = function () {
            this.selectedItems.forEach(function (item) {
                item.unhighlight();
            });
            if (selectionRectangle)
            {
                selectionRectangle.remove();
            }
            designer.numberOfSelectedObjectsMessage.hide();
        }

    }
})(seatsio);

(function (S) {
    S.BackgroundImage = function (designer) {

        var DEFAULT_SCALE = 100;
        var OPACITY_WHEN_NOT_SHOWN_ON_RENDERED_CHART = 0.5;

        var me = this;
        var backgroundImage;

        this.opacity = OPACITY_WHEN_NOT_SHOWN_ON_RENDERED_CHART;
        this.backgroundImageWidth = null;
        this.backgroundImageHeight = null;
        this.backgroundImageUrl = null;
        this.backgroundImageSrc = null;
        this.origin = null;
        this.backgroundImageScale = DEFAULT_SCALE;
        this.showOnRenderedCharts = false;
        this.backgroundScaleSlider = new seatsio.ScaleSlider( $(controlerIframe).find('#backgroundScaleSlider'))
            .onValueChanged(function (scale) {
            	$(controlerIframe).find("#backgroundScaleSpan").html(scale+"%");
                this.setScale(scale);
            }.bind(this));

        this.getBackgroundImage = function () {
            return backgroundImage;
        };

        this.hideLabels = function () {
        };

        this.showLabels = function () {
        };

        this.showLabelAndChildLabels = function () {
        };

        this.hideLabelAndChildLabels = function () {
        };

        this.draw = function () {
            if (!me.backgroundImageUrl) {
                return;
            }
            backgroundImage = designer.paper
                .image(
                me.backgroundImageSrc,
                me.origin.x,
                me.origin.y,
                me.backgroundImageWidth,
                me.backgroundImageHeight)
                .attr({'opacity': 0.5 }) //me.opacity})
                .setExtraZoom(me.backgroundImageScale / 100)
                .toLayer("backgroundLayer", designer)
                .applyZoom(designer);
        };

        this.undraw = function () {
            if (backgroundImage) {
                backgroundImage.remove();
                backgroundImage = null;
            }
        };

        this.blur = function () {
        };

        this.unblur = function () {
        };

        this.toJson = function () {
            if (!(me.backgroundImageUrl != null && backgroundImage != null)) {
                return null;
            }
            return {
                'backgroundImageUrl': this.backgroundImageUrl,
                'backgroundImageZoom': this.backgroundImageScale,
                'opacity': 1,//this.opacity,
                'showOnRenderedCharts': this.showOnRenderedCharts,
                'origin': this.origin.toJson(designer)
            };
        };

        this.removeBackgroundImage = function () {
            if (backgroundImage) {
                backgroundImage.remove();
            }
            backgroundImage = null;
            this.origin = null;
            this.backgroundImageHeight = null;
            this.backgroundImageWidth = null;
            this.backgroundImageUrl = null;
            this.backgroundImageScale = DEFAULT_SCALE;
            this.showOnRenderedCharts = false;
            $(controlerIframe).find('#showOnRenderedChartsCheckbox').prop('checked', false);
            //$("#showOnRenderedChartsCheckbox").attr('checked', false);
            this.backgroundScaleSlider.setValue(me.backgroundImageScale);
            $(controlerIframe).find('#backgroundImageUrlError').hide();
            //$(controlerIframe).find('#backgroundDetailButtons').hide();
        };

        this.setBackgroundImage = function (backgroundImageUrl) {
            if (backgroundImageUrl == me.backgroundImageUrl) {
                return;
            }
            me.removeBackgroundImage();
            if (backgroundImageUrl) {
                //$('#backgroundImageSpinner').show();
                me.backgroundImageUrl = backgroundImageUrl;
                me.loadBackgroundImage(function () {
                	//$(controlerIframe).find('#backgroundDetailButtons').show();
                });
            }
        };

        this.loadBackgroundImage = function (successCallback) {
            var image = new Image();
            // En caso de que la cargue del JSON la imagen, entrará en el if, al elegir una nueva, entrará en el else
            if (me.backgroundImageSrc != null && !me.backgroundImageUrl.startsWith("http")) image.src = me.backgroundImageSrc;
			else {
				image.src = me.backgroundImageUrl;
				me.backgroundImageSrc = me.backgroundImageUrl;
			}
            //show remove image
        	$(controlerIframe).find("#removeBackgroundButton").show();
            $(controlerIframe).find("#backgroundImageUrl").val(me.backgroundImageSrc);
            $(controlerIframe).find("#dropboxImageSelected-background_img").attr('src', me.backgroundImageSrc);

            image.onload = function () {
                //$('#backgroundImageSpinner').hide();
            	$(controlerIframe).find('#backgroundImageUrlError').hide();
                me.backgroundImageWidth = this.width;
                me.backgroundImageHeight = this.height;
                if (!me.origin) {
                    me.origin = designer.canvasCenter()
                        .addToX(-1 * me.backgroundImageWidth / 2)
                        .addToY(-1 * me.backgroundImageHeight / 2);
                }
                me.rerender();
                if (successCallback) {
                    successCallback();
                }
            };
            image.onerror = function (e) {
                //$('#backgroundImageSpinner').hide();
            	$(controlerIframe).find('#backgroundImageUrlError').html(polyglot.t("seatmap.seatmap_editor.Failed_to_load_the_image")).show();
            }
        };

        this.setScale = function (scale) {
            this.backgroundImageScale = scale;
            this.rerender();
        };

        this.applyZoom = function () {
            if (backgroundImage) {
                backgroundImage.applyZoom(designer);
            }
        };

        this.rerender = function () {
            this.undraw();
            this.draw();
        };

        this.setOpacity = function (number) {
            if (me.getBackgroundImage()) {
                me.opacity = number;
                backgroundImage.attr({'opacity': me.opacity});
            }
        };

        this.setShowOnRenderedCharts = function (showOnRenderedCharts) {
            this.showOnRenderedCharts = showOnRenderedCharts;
            if (showOnRenderedCharts) {
                this.setOpacity(1);
            } else {
                this.setOpacity(OPACITY_WHEN_NOT_SHOWN_ON_RENDERED_CHART);
            }
        };

        function backgroundImageError(error) {
        	$(controlerIframe).find('#backgroundImageUrlError').html(error).show();
            //$('#backgroundImageSpinner').hide();
        }

    };

    S.BackgroundImage.fromJson = function (json, subChart) {
        var designer = subChart.designer;
        var backgroundImage = new S.BackgroundImage(designer);
        if (json && json.backgroundImageUrl) {
            backgroundImage.backgroundImageScale = json.backgroundImageZoom;
            if (json.origin) {
                backgroundImage.origin = S.Point.fromJson(json.origin, subChart);
            }
            backgroundImage.backgroundImageUrl = json.backgroundImageUrl;
            backgroundImage.backgroundImageSrc = "/tickets/recinto/" + idRecinto + "/sala_" +idSala+ "/"+ backgroundImage.backgroundImageUrl;
            if ((json.backgroundImageUrl).startsWith("http")) backgroundImage.backgroundImageSrc = json.backgroundImageUrl;
            updateBackgroundMap();
            backgroundImage.opacity = json.opacity;
            backgroundImage.showOnRenderedCharts = json.showOnRenderedCharts;
            $(controlerIframe).find("#showOnRenderedChartsCheckbox").prop("checked", backgroundImage.showOnRenderedCharts?"checked":"");
            $(controlerIframe).find("#dropboxImageSelected-background_img").attr("src", backgroundImage.backgroundImageUrl);
            backgroundImage.backgroundScaleSlider.setValue(backgroundImage.backgroundImageScale);
            backgroundImage.loadBackgroundImage();
        }
        return backgroundImage;
    };

})(seatsio);

(function (S) {

    $.fn.disable = function(state) {
        return this.each(function() {
            this.disabled = state;
        });
    };

})(seatsio);

(function (S) {

    S.ChartInfoUpdater = function (designer) {

        function updateChartInfo() {
            designer.activeSubChart().validator.updateValidationMessages();
            scheduleUpdateChartInfo();
        }

        function scheduleUpdateChartInfo() {
            setTimeout(updateChartInfo, 1000);
        }

        this.start = function () {
            updateChartInfo();
            scheduleUpdateChartInfo();
        }

    }

})(seatsio);

(function (S) {
    S.ObjectSelector = function (object, designer) {

        var me = this;
        var selectionRectangle;
        var selectionRectangleBorder;
        var selected;

        function drawSelectionRectangleBorder() {
            return object.bbox().drawPathThroughPoints().attr({'stroke-dasharray': '* ', 'stroke': 'DarkTurquoise'});
        }

        this.select = function () {
            selected = true;
            selectionRectangleBorder = drawSelectionRectangleBorder();
            object.selected();
        };

        this.deselect = function () {
            selected = false;
            selectionRectangleBorder.remove();
            object.deselected();
        };

        this.objectUndrawn = function () {
            this.undraw();
        };

        this.undraw = function () {
            if (selectionRectangle) {
                selectionRectangle.remove();
            }
            if (selectionRectangleBorder) {
                selectionRectangleBorder.remove();
            }
        };

        this.enable = function () {
            selectionRectangle.show();
        };

        this.disable = function () {
            selectionRectangle.hide();
        };

        this.allElementsSet = function () {
            return S.set(designer.paper, selectionRectangle, selectionRectangleBorder);
        };

        this.changeCursorTo = function (cursor) {
            selectionRectangle.attr({'cursor': cursor});
        };

        this.changeCursorToDefault = function () {
            selectionRectangle.attr({'cursor': null});
        };

        this.objectDrawn = function () {
            if (selectionRectangle) {
                selectionRectangle.remove();
            }
            /* clc-color contenedor de etiquetas de texto, poligonos, conjuntos de butacas, etc */
            selectionRectangle = object.createSelectionRectangle().attr({'fill': 'white', 'opacity': 0})
                .toLayer(object.layer, designer)
                .mouseover(function () {
                    designer.getState().onObjectMouseOver(object);
                })
                .mouseout(function () {
                    designer.getState().onObjectMouseOut(object);
                })
                .clickWhenNotDragged(function (e) {
                    designer.getState().onObjectClicked(object, e);
                })
                .onDrag(
                designer,
                function (dx, dy, e) {
                    designer.getState().onObjectDragged(object, dx, dy, new S.Point.fromEvent(e, designer))
                },
                function (e) {
                    designer.getState().onObjectDragStarted(object, new S.Point.fromEvent(e, designer));
                },
                function (totalDrag) {
                    designer.getState().onObjectDragEnded(object, totalDrag);
                }
            );
            if (selected) {
                selectionRectangleBorder.remove();
                selectionRectangleBorder = drawSelectionRectangleBorder();
            }
        };

    }
})(seatsio);

(function (S) {
    S.ObjectMover = function (object) {

        var me = this;

        this.start = function() {
            object.allElementsSet().startTransformation();
        };

        this.move = function(dx, dy) {
            object.allElementsSet().transform(S.Vector.fromView(dx, dy, object.designer).snapToGrid().asTranslation());
            return object;
        };

        this.end = function(totalDistance) {
            object.moved(totalDistance.snapToGrid());
            object.allElementsSet().endTransformation();
        };

        this.doMove = function(distance) {
            this.start();
            this.move(distance.x, distance.y);
            this.end(distance);
            return object;
        };

    }
})(seatsio);

(function (S) {
    S.Tooltip = function (designer) {

        var shown = false;
        var me = this;

        me.width;
        me.height;
        me.DEFAULT_TEXT = "LABEL";
        me.isNewText = false;
        me.isPlainText = true;

        this.show = function (objectWithBbox) {
            me.width = null;
            me.height = null;   
            shown = true;
            me.move(objectWithBbox);
            tooltip().show();
            tooltip().find('.shownListener').trigger('shown');
        };

        this.html = function (html) {
            tooltip().html(html);
            return this;
        }

        this.hide = function () {
            shown = false;
            tooltip().hide();
        };

        function tooltipPositionRight(objectWithBbox) {
            return objectWithBbox.bbox().middleRight().addToX(10).toView(designer).addToY(-tooltipHeight() / 2);
        }

        function tooltipPositionLeft(objectWithBbox) {
            return objectWithBbox.bbox().middleLeft().addToX(-10).toView(designer).addToY(-tooltipHeight() / 2);
        }

        this.move = function (objectWithBbox) {
            if (shown) {
                var point = tooltipPositionRight(objectWithBbox);
                var tt = tooltip().css('display', 'block');
                tt.css({'left': (point.x < 5000 ? "5000" : point.x), 'top': (point.y < 5000 ? "5000" : point.y)});
                if (!tt.isFullInViewport()) {
                    var leftPosition = tooltipPositionLeft(objectWithBbox).x - tooltipWidth();
                    tt.css('left', (leftPosition < 5000 ? "5000" : leftPosition));
                }
            }
        };

        function tooltipWidth() {
            if (!me.width) {
                me.width = tooltip().outerWidth();
            }
            return me.width;
        }

        function tooltipHeight() {
            if (!me.height) {
                me.height = tooltip().outerHeight();
            }
            return me.height;
        }

        function tooltip() {
            var tooltip = $('#seatsIoTooltip');
            if (tooltip.length == 0) {
                return createTooltip();
            }
            return tooltip;
        }

        function createTooltip() {
            return $('<div class="seatsIoTooltip" id="seatsIoTooltip"></div>').appendTo(designer.container());
        }
    }
})(seatsio);

(function (S) {
    S.Toolbar = function (chartDesigner) {

        var togglerButtons = $(".btn");

        togglerButtons.on("click", function () {
            activate(this);
        });

        this.toSelectionSubMode = function () {
            activate('#toDrawMode');
            this.toSelectionMode();
        };

        this.toSelectionMode = function () {
            activate("#toSelectionMode");
        };

        this.toLabelingMode = function () {
            activate("#toLabelingMode");
        };

        this.toSeatLabelingMode = function () {
            this.toLabelingMode();
            activate("#showSeatLabelsButton");
        };

        this.toDrawRoundTableMode = function () {
            activate("#toTablesMode");
            activate("#toDrawRoundTableMode");
        };

        this.toDrawRectTableMode = function () {
            activate("#toTablesMode");
            activate("#toDrawRectTableMode");
        };

        this.toObjectLabelingMode = function () {
            this.toLabelingMode();
            activate("#showObjectLabelsButton");
        };

        this.toSectionLabelingMode = function () {
            this.toLabelingMode();
            activate("#showSectionLabelsButton");
        };

        this.toDrawBoothMode = function () {
            activate("#toBoothsMode");
        };

        this.toCategorySelectionMode = function () {
            activate("#toCategorySelectionMode");
        };

        this.hideSections = function () {
        	$(controlerIframe).find('#toSectionMode').hide();
            this.resizeDrawModeButtons();
        };

        this.hideTables = function () {
        	$(controlerIframe).find('#toTablesMode').hide();
            this.redawLabelButtons();
            this.resizeDrawModeButtons();
        };

        this.hideBooths = function () {
        	$(controlerIframe).find('#toBoothsMode').hide();
            this.redawLabelButtons();
            this.resizeDrawModeButtons();
        };

        this.hideRows = function () {
        	$(controlerIframe).find('#toRowMode').hide();
            this.redawLabelButtons();
            this.resizeDrawModeButtons();
        };

        this.hideGeneralAdmission = function () {
        	$(controlerIframe).find('#toGaMode').hide();
        	$(controlerIframe).find('#toGeneralAdmissionMode_options').hide();
            this.redawLabelButtons();
            this.resizeDrawModeButtons();
        };

        this.hideFocalPoint = function () {
        	$(controlerIframe).find('#toFocalPointMode').hide();
            //this.resizeMainModeButtons();
        };

        this.hideBackground = function () {
        	$(controlerIframe).find('#toBackgroundImageMode').hide();
            //this.resizeMainModeButtons();
        };

        this.enableAll = function () {
            this.enableAllMainModeButtons();
            this.enableAllDrawModeButtons();
            this.redawLabelButtons();
        };

        this.enableAllDrawModeButtons = function () {
        	$(controlerIframe).find('#toSectionMode').show();
        	$(controlerIframe).find('#toTablesMode').show();
//            $('#toBoothsMode').show();
        	$(controlerIframe).find('#toRowMode').show();
            $(controlerIframe).find('#toGaMode').show();
        	$(controlerIframe).find('#toGeneralAdmissionMode_options').show();
            this.resizeDrawModeButtons();
        };

        this.enableAllMainModeButtons = function () {
        	$(controlerIframe).find('#toFocalPointMode').show();
        	$(controlerIframe).find('#toBackgroundImageMode').show();
            this.resizeMainModeButtons();
        };

        this.redawLabelButtons = function () {
        	$(controlerIframe).find('#toLabelingMode').toggle(chartDesigner.featureToggler.labelableObjectsEnabled());
            var seatsEnabled = chartDesigner.featureToggler.objectsWithSeatsEnabled();
            $(controlerIframe).find('#tab_left-2').toggle(seatsEnabled); //revisar si en vez de ocultar, solo desactivar
            $(controlerIframe).find('#showSeatLabelsButton').toggle(seatsEnabled);
            $(controlerIframe).find('#showObjectLabelsButton').toggle(seatsEnabled);
            this.resizeButtonsOfMenubar($('#labelModeButtonsContainer'));
        };

        this.resizeDrawModeButtons = function () {
            this.resizeButtonsOfMenubars($(controlerIframe).find('#drawModeButtonsContainer'));
        };

        this.resizeMainModeButtons = function () {
            //this.resizeButtonsOfMenubars($('#mainModeButtons'));
        };

        this.resizeButtonsOfMenubar = function (menuBar) {
            /*
        	function widthOfWidestElement(items) {
                var widestWidth = 0;
                items.each(function () {
                    var width = $(this).outerWidth();
                    if (width > widestWidth) {
                        widestWidth = width;
                    }
                });
                return widestWidth;
            }
            */

            /*
            var labels = menuBar.find('.btn-group label').filter(function () {
                return $(this).css('display') != 'none';
            });
            */
            /*
            var labels = menuBar.find('.element-opt-seatmap').filter(function () {
                return $(this).css('display') != 'none';
            });
            if (labels.length) {
                var widthOfLargestLabel = widthOfWidestElement(labels);
                labels.width(widthOfLargestLabel - 30);
                menuBar.width(labels.length * widthOfLargestLabel);
            }
            */
        };

        this.resizeButtonsOfMenubars = function () {
            var me = this;
            $('.menubar').each(function () {
                me.resizeButtonsOfMenubar($(this));
            });
        };

        /*
        function applyStyling($button) {
            var $buttonContainer = $button.closest("div[data-level]");
            $buttonContainer.find($('.btn')).removeClass("active");
            $button.addClass("active");
        }
        */


        function hideAllOtherContainersAndShowOnlyContainerFor($button) {
            /*
        	var $buttonContainer = $button.closest("div[data-level]");
            var level = $buttonContainer.data("level");
            for (var l = level + 1; l < 5; l++) {
                $('[data-level="' + l + '"]').hide();
            }
            $($button.data("togglecontainer")).show();
            */
        }



        function activate(togglerButton) {
            /*applyStyling($(togglerButton));*/
            hideAllOtherContainersAndShowOnlyContainerFor($(togglerButton));
        }


        /*
        this.activateSubItem = function (togglerButton, subTogglerButton) {
            activate(togglerButton);
            var container = $(togglerButton).data("togglecontainer");
            applyStyling($(container).find(subTogglerButton));
        };
        */

        this.resizeButtonsOfMenubars();

    }
})(seatsio);


(function (S) {

    S.Zoomer = function (designer) {
        this.designer = designer;
        this.zoomLevel = 1;
    };

    S.Zoomer.prototype.zoomIn = function () {
        this.zoom(this.zoomLevel * S.Zoomer.zoomStep);
    };

    S.Zoomer.prototype.zoomOut = function () {
        this.zoom(this.zoomLevel / S.Zoomer.zoomStep);
    };

    S.Zoomer.prototype.zoom = function (newLevel) {
        this.zoomLevel = cap(newLevel);
        this.designer.activeSubChart().allObjects().forEach(function (object) {
            object.applyZoom();
        });
        this.designer.setState(this.designer.getState());
    };

    function cap(zoomLevel) {
        var maxZoomLevel = Math.pow(S.Zoomer.zoomStep, 5);
        var minZoomLevel = Math.pow(S.Zoomer.zoomStep, -5);
        return Math.max(minZoomLevel, Math.min(zoomLevel, maxZoomLevel));
    }

    S.Zoomer.prototype.applyToElement = function (element) {
        var canvasCenter = this.designer.canvasCenter();
        element.transform(this.transformation());
        if(element.keepSize) {
            element.extraZoom = 1 / this.zoomLevel;
        }
        if (element.extraZoom) {
            element.transform('...s' + element.extraZoom + ',' + element.extraZoom);
        }
        if (element.rotationAngle) {
            element.transform('...r' + element.rotationAngle);
        }
    };

    S.Zoomer.prototype.zoomed = function (number) {
        return number * this.zoomLevel;
    };

    S.Zoomer.prototype.unzoom = function (number) {
        return number / this.zoomLevel;
    };

    S.Zoomer.prototype.transformation = function () {
        var canvasCenter = this.designer.canvasCenter();
        return 's' + this.zoomLevel + ',' + this.zoomLevel + ',' + canvasCenter.x + ',' + canvasCenter.y;
    };

    S.Zoomer.prototype.fillScreen = function () {
        var toolbarHeight = 100;
        var fitToWidthZoomLevel = $(window).width() / this.designer.activeSubChart().autoSizedWidth;
        var fitToHeightZoomLevel = ($(window).height() - toolbarHeight) / this.designer.activeSubChart().autoSizedHeight;
        var zoomLevel = Math.min(fitToHeightZoomLevel, fitToWidthZoomLevel, 1) * 0.90;
        this.zoom(zoomLevel);
    };

    S.Zoomer.zoomStep = 1.5;

})(seatsio);

seatsio.FocalPoint = function (subChart) {
    this.init(subChart.designer, true);
    this.designer = subChart.designer;
    this.pointer = new seatsio.FocalPointPointer(this.designer);
    this.point = null;
    this.focalPointShapes = null;
};

seatsio.FocalPoint.prototype = new seatsio.Object();

seatsio.FocalPoint.prototype.draw = function () {
    if (!this.point) {
        return this;
    }
    this.undraw();
    this.focalPointShapes = seatsio.FocalPoint.createShapes(this.designer, this.point);
    this.objectDrawn();
    return this;
};

seatsio.FocalPoint.prototype.undraw = function () {
    if (this.focalPointShapes) {
        this.focalPointShapes.remove();
    }
    this.objectUndrawn();
    return this;
};

seatsio.FocalPoint.prototype.rotated = function (rotationCenter, angle) {
    this.point = this.point.rotateAround(rotationCenter, angle);
    this.draw();
};

seatsio.FocalPoint.prototype.remove = function () {
    this.undraw();
    this.point = null;
};

seatsio.FocalPoint.prototype.moved = function (distance) {
    this.point = this.point.add(distance);
    this.draw();
};

seatsio.FocalPoint.prototype.visibleElementsSet = function () {
    if (!this.focalPointShapes) {
        return this.designer.paper.set();
    }
    return this.focalPointShapes;
};

seatsio.FocalPoint.prototype.isSet = function () {
    return this.point;
};

seatsio.FocalPoint.prototype.toJson = function () {
    if (!this.point) {
        return null;
    }
    return this.point.toJson(this.designer);
};

seatsio.FocalPoint.prototype.moveTo = function (point) {
    this.point = point;
    this.draw();
    return this;
};

seatsio.FocalPoint.prototype.allElementsSet = function () {
    return this.focalPointShapes;
};

seatsio.FocalPoint.fromJson = function (json, subChart) {
    var focalPoint = new seatsio.FocalPoint(subChart);
    focalPoint.point = seatsio.Point.fromJson(json, subChart);
    return focalPoint;
};

seatsio.FocalPoint.createShapes = function (designer, point) {
	var circle1 = designer.paper.circle(point.x, point.y, 110).attr({'fill': 'transparent', 'stroke': '#4C4FE6', 'stroke-opacity': 1, 'stroke-width': 2});
	var circle2 = designer.paper.circle(point.x, point.y, 77).attr({'fill': 'transparent', 'stroke': '#4C4FE6', 'stroke-opacity': 1, 'stroke-width': 3});
	var circle3 = designer.paper.circle(point.x, point.y, 46).attr({'fill': 'transparent', 'stroke': '#4C4FE6', 'stroke-opacity': 1, 'stroke-width': 4});
    var circle4 = designer.paper.circle(point.x, point.y, 23).attr({'fill': 'transparent', 'stroke': '#4C4FE6', 'stroke-opacity': 1, 'stroke-width': 5});
    var circle5 = designer.paper.circle(point.x, point.y, 7).attr({'fill': '#4C4FE6', 'stroke': 'white', 'stroke-opacity': 0});
    return seatsio.set(designer.paper, circle1, circle2, circle3, circle4, circle5).toLayer('objectsLayer', designer).applyZoom(designer);
};

seatsio.FocalPointPointer = function(designer) {
    this.designer = designer;
    this.shapes = null;
};

seatsio.FocalPointPointer.prototype.showAt = function(point) {
    this.hide();
    this.shapes = seatsio.FocalPoint.createShapes(this.designer, point);
    return this;
};

seatsio.FocalPointPointer.prototype.hide = function() {
    if(this.shapes) {
        this.shapes.remove();
    }
};

seatsio.RowBlockDrawer = function (blockStartpoint, designer) {
    this.blockStartpoint = blockStartpoint;
    this.rows = [];
    this.numberOfRowsAndChairs = seatsio.set(designer.paper);
    this.designer = designer;
};

seatsio.RowBlockDrawer.prototype.redrawTo = function (blockEndpoint) {
    this.undraw();
    this.drawRows(blockEndpoint);
    this.drawNumberOfRowsAndChairs(blockEndpoint);
};

seatsio.RowBlockDrawer.prototype.drawNumberOfRowsAndChairs = function (blockEndpoint) {
    var centerOfText = blockEndpoint.averageWith(this.blockStartpoint);
    var message = this.rows.length + 'x' + this.rows[0].length;
    var text = this.designer.paper.text(centerOfText.x, centerOfText.y, message)
        .attr({
            'font-size': 20,
            'font-family': 'Roboto, Helvetica, Arial, sans-serif'
        })
        .applyZoom(this.designer);
    var textBbox = text.getBBox(true);
    var background = this.designer.paper.rect(textBbox.x - 5, textBbox.y - 5, textBbox.width + 10, textBbox.height + 10)
        .attr({
            'fill': '#00e1e1',
            'stroke': 'none'
        })
        .applyZoom(this.designer);
    text.toFront();
    this.numberOfRowsAndChairs = seatsio.set(this.designer.paper, text, background);
};

seatsio.RowBlockDrawer.prototype.drawRows = function (blockEndpoint) {
    for (var i = 0; i < this.numRows(blockEndpoint); ++i) {
        var yCoordinateOfCurrentRow = this.yCoordinateAtIndex(i, blockEndpoint);
        var startpointOfCurrentRow = new seatsio.Point(this.blockStartpoint.x, yCoordinateOfCurrentRow);
        var endpointOfCurrentRow = new seatsio.Point(blockEndpoint.x, yCoordinateOfCurrentRow);
        this.rows.push(seatsio.Row.drawShapes(startpointOfCurrentRow, endpointOfCurrentRow, this.designer));
    }
};

seatsio.RowBlockDrawer.prototype.yCoordinateAtIndex = function (index, blockEndpoint) {
    var plusOrMinus = ((blockEndpoint.y - this.blockStartpoint.y) > 0) ? 1 : -1;
    return this.blockStartpoint.y + (index * seatsio.Row.height() * plusOrMinus);
};

seatsio.RowBlockDrawer.prototype.numRows = function (blockEndpoint) {
    return Math.max(1, Math.ceil(Math.abs(blockEndpoint.y - this.blockStartpoint.y) / seatsio.Row.height()));
};

seatsio.RowBlockDrawer.prototype.undraw = function () {
    this.rows.forEach(function (row) {
        row.remove();
    });
    this.rows = [];
    this.numberOfRowsAndChairs.remove();
};

seatsio.RowBlockDrawer.prototype.createRowObjects = function () {
    var me = this;
    return this.rows.map(function (chairShapes) {
        return seatsio.RowBlockDrawer.toRowObject(chairShapes, me.designer);
    });
};

seatsio.RowBlockDrawer.toRowObject = function (chairShapes, designer) {
    function toChairs() {
        return chairShapes.toArray().map(function (chairShape) {
            var center = new seatsio.Point(chairShape.attr('cx'), chairShape.attr('cy'));
            return new seatsio.Chair(center, null, designer.activeSubChart());
        });
    }

    return seatsio.Row.createFromChairs(toChairs(), designer);
};

seatsio.VenueTypeSwitcher = function (chartDesigner) {
    this.designer = chartDesigner;
    this.modal = $(controlerIframe).find('#vSelectTypeMap');
};

seatsio.VenueTypeSwitcher.prototype.showModal = function () {
    var me = this;
    parent.showModal("#vSelectTypeMap", null , false);

    $(controlerIframe).find("#select-type-map-btn").on("click", function(){
    	var radios = $(controlerIframe).find('[name="selectTypeSeatmap"]');
    	for(var i = 0, length = radios.length; i < length; i++)
    	{
			if(radios[i].checked)
			{
				me.initVenueType(radios[i].value);
				parent.hideModal("#vSelectTypeMap");
				break;
			}
    	}
    });
};

seatsio.VenueTypeSwitcher.prototype.initVenueType = function (venueType) {
    this.designer.spinner.show();
    $.get(urlEstaticosPlanos + 'chartTemplates/' + venueType + ".json", function (data) {
        this.designer.fromJson(data);
        this.designer.spinner.hide();
    }.bind(this));
};

seatsio.VenueTypeSwitcher.prototype.enableFeaturesForCurrentVenueType = function () {
    if (!this.designer.venueType) {
        return;
    }
    this.venueTypes[this.designer.venueType](this.designer);
};

seatsio.VenueTypeSwitcher.prototype.venueTypes = {
    'ROWS_WITHOUT_SECTIONS': function (chartDesigner) {
        var FT = seatsio.FeatureToggler;
        if (chartDesigner.activeSubChart().isMaster()) {
            chartDesigner.featureToggler.reset().forbid(FT.BOOTHS).render();
        } else {
            chartDesigner.featureToggler.reset().forbid(FT.SECTIONS, FT.BACKGROUND, FT.FOCAL_POINT).render();
        }
    },
    'ROWS_WITH_SECTIONS': function (chartDesigner) {
        var FT = seatsio.FeatureToggler;
        if (chartDesigner.activeSubChart().isMaster()) {
            chartDesigner.featureToggler.reset().forbid(FT.BOOTHS).render();
        } else {
            chartDesigner.featureToggler.reset().forbid(FT.SECTIONS, FT.GA, FT.BACKGROUND, FT.FOCAL_POINT).render();
        }
    },
    'TABLES': function (chartDesigner) {
        var FT = seatsio.FeatureToggler;
        if (chartDesigner.activeSubChart().isMaster()) {
            chartDesigner.featureToggler.reset().forbid(FT.BOOTHS).render();
        } else {
            chartDesigner.featureToggler.reset().forbid(FT.SECTIONS, FT.GA, FT.BACKGROUND, FT.FOCAL_POINT).render();
        }
    },
    'BOOTHS': function (chartDesigner) {
        var FT = seatsio.FeatureToggler;
        chartDesigner.featureToggler.reset().hide(FT.ROWS, FT.GA, FT.TABLES, FT.FOCAL_POINT).render();
    },
    'MIXED': function (chartDesigner) {
        var FT = seatsio.FeatureToggler;
        if (chartDesigner.activeSubChart().isMaster()) {
            chartDesigner.featureToggler.reset().forbid(FT.BOOTHS).render();
        } else {
            chartDesigner.featureToggler.reset().forbid(FT.SECTIONS, FT.GA, FT.BACKGROUND, FT.FOCAL_POINT).render();
        }
    },
    'GENERAL_ADMISSION': function (chartDesigner) {
        var FT = seatsio.FeatureToggler;
        if (chartDesigner.activeSubChart().isMaster()) {
            chartDesigner.featureToggler.reset().forbid(FT.BOOTHS).render();
        } else {
            chartDesigner.featureToggler.reset().forbid(FT.SECTIONS, FT.GA, FT.BACKGROUND, FT.FOCAL_POINT).render();
        }
    }
};


seatsio.Spinner = function () {
    this.container = this.createContainer();
};

seatsio.Spinner.prototype.createContainer = function () {
    return $('<div style="position: fixed; left: 0; right: 0; top: 0; bottom: 0; z-index: 9999;">')
        .append(this.createBackgroundBlur())
        .append(this.createSpinner())
        .hide()
        .appendTo($('body'));
};

seatsio.Spinner.prototype.createBackgroundBlur = function () {
    return $('<div style="position: absolute; width: 100%; height: 100%; background: rgba(34,34,34,0.3);">');
};

seatsio.Spinner.prototype.createSpinner = function () {
    return $('<div style="position: absolute; top: 40%; left: 50%;">')
        .append($('<div class="spinner-backoffice"><svg class="spinner-backoffice" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg></div>'));
};

seatsio.Spinner.prototype.show = function () {
    this.container.show();
};

seatsio.Spinner.prototype.hide = function () {
    this.container.hide();
};

seatsio.FeatureToggler = function (chartDesigner) {
    this.designer = chartDesigner;
    this.hiddenFeatures = [];
    this.forbiddenFeatures = [];
};

seatsio.FeatureToggler.prototype.hide = function () {
    for (var i = 0; i < arguments.length; ++i) {
        this.hideFeatures(arguments[i]);
    }
    return this;
};

seatsio.FeatureToggler.prototype.hideFeatures = function (feature) {
    this.hiddenFeatures.push(feature);
    feature.removeFromToolbar(this.designer.toolbar);
    //$('#showAllButtonsCheckboxContainer').show();
    this.designer.setShowAllButtons(true);
};

seatsio.FeatureToggler.prototype.forbid = function () {
    for (var i = 0; i < arguments.length; ++i) {
        this.forbidFeature(arguments[i]);
    }
    return this;
};

seatsio.FeatureToggler.prototype.forbidFeature = function (feature) {
    this.forbiddenFeatures.push(feature);
    feature.removeFromToolbar(this.designer.toolbar);
};

seatsio.FeatureToggler.prototype.labelableObjectsEnabled = function() {
    return this.objectsWithSeatsEnabled() || this.isEnabled(seatsio.FeatureToggler.BOOTHS);
};

seatsio.FeatureToggler.prototype.objectsWithSeatsEnabled = function () {
    return this.isEnabled(seatsio.FeatureToggler.ROWS) || this.isEnabled(seatsio.FeatureToggler.TABLES);
};

seatsio.FeatureToggler.prototype.isEnabled = function (feature) {
    return !this.hiddenFeatures.contains(feature) && !this.forbiddenFeatures.contains(feature);
};

seatsio.FeatureToggler.prototype.render = function () {
    this.designer.toolbar.enableAll();
    this.disabledFeatures().forEach(function (feature) {
        feature.removeFromToolbar(this.designer.toolbar);
    }.bind(this));
};

seatsio.FeatureToggler.prototype.disabledFeatures = function () {
    if (this.designer.showAllButtons) {
        return this.forbiddenFeatures;
    }
    return this.forbiddenFeatures.concat(this.hiddenFeatures);
};

seatsio.FeatureToggler.prototype.reset = function () {
    this.hiddenFeatures = [];
    this.forbiddenFeatures = [];
    this.designer.toolbar.enableAll();
    return this;
};

seatsio.FeatureToggler.SECTIONS = {
    'removeFromToolbar': function (toolbar) {
        toolbar.hideSections();
    }
};

seatsio.FeatureToggler.TABLES = {
    'removeFromToolbar': function (toolbar) {
        toolbar.hideTables();
    }
};

seatsio.FeatureToggler.BOOTHS = {
    'removeFromToolbar': function (toolbar) {
        toolbar.hideBooths();
    }
};

seatsio.FeatureToggler.ROWS = {
    'removeFromToolbar': function (toolbar) {
        toolbar.hideRows();
    }
};

seatsio.FeatureToggler.BACKGROUND = {
    'removeFromToolbar': function (toolbar) {
        toolbar.hideBackground();
    }
};

seatsio.FeatureToggler.FOCAL_POINT = {
    'removeFromToolbar': function (toolbar) {
        toolbar.hideFocalPoint();
    }
};

seatsio.FeatureToggler.GA = {
    'removeFromToolbar': function (toolbar) {
        toolbar.hideGeneralAdmission();
    }
};

seatsio.ShapeDrawingCrosshair = function (chartDesigner) {
    this.designer = chartDesigner;
    this.crosshair = null;
};

seatsio.ShapeDrawingCrosshair.prototype.moveTo = function (point) {
    if (!this.crosshair) {
        this.initCrosshair();
    }
    this.crosshair.transform('t' + point.toView(this.designer).x + ',' + point.toView(this.designer).y);
};

//cursor pintar section (poligono)
seatsio.ShapeDrawingCrosshair.prototype.initCrosshair = function () {
    this.designer.setCursorToNone();
    this.crosshair = seatsio.set(
        this.designer.paper,
        this.designer.drawLine(-20, 0, 20, 0, 2),
        this.designer.drawLine(0, -20, 0, 20, 2)
    );
};

seatsio.ShapeDrawingCrosshair.prototype.hide = function () {
    if (!this.crosshair) {
        return;
    }
    this.designer.setCursorToDefault();
    this.crosshair.remove();
    this.crosshair = null;
};

seatsio.ScaleSlider = function (container, initialValue) {
    this.container = container;
    this.initialValue = initialValue;
    this.init();
};

seatsio.ScaleSlider.prototype.init = function (e, ui) {

	var initialValue = this.initialValue ? this.initialValue : 100;
	var id_element = this.container[0].id;

	var objElement = null;

	if(id_element == "backgroundScaleSlider")
	{
		objElement = $(controlerIframe).find("#"+id_element);
	}
	else
	{
		objElement = $("#"+id_element);
	}

	objElement.slider({
		"min": 20,
		"max": 500,
		"step": 10,
		"value": initialValue,
		tooltip: 'hide',
		"formater": function (value) {
						return value + '%';
					}
		}
	);

    this.updateScaleSpan();
};

seatsio.ScaleSlider.prototype.updateScaleSpan = function () {
	var id_element = this.container[0].id;
	var objElement = null;
	if(id_element == "backgroundScaleSlider")
	{
		objElement = $(controlerIframe).find("#"+id_element);
	}
	else
	{
		objElement = $("#"+id_element);
	}
	this.getScaleSpan().text(objElement.slider('value') + '%');
};

seatsio.ScaleSlider.prototype.onValueChanged = function (callback) {
	var id_element = this.container[0].id;
	var objElement = null;
	if(id_element == "backgroundScaleSlider")
	{
		objElement = $(controlerIframe).find("#"+id_element);
	}
	else
	{
		objElement = $("#"+id_element);
	}

	objElement.on('slide', function (event, ui) {
		if (typeof ui.value == 'number') {
            callback(ui.value);
		} else if (ui.value instanceof Array) {
            callback(ui.values[0]);
        }
        this.updateScaleSpan();
    }.bind(this));
    return this;
};

seatsio.ScaleSlider.prototype.setValue = function (value) {
	var id_element = this.container[0].id;
	var objElement = null;
	if(id_element == "backgroundScaleSlider")
	{
		objElement = $(controlerIframe).find("#"+id_element);
	}
	else
	{
		objElement = $("#"+id_element);
	}
	objElement.slider('value', value);

    this.updateScaleSpan();
};

seatsio.ScaleSlider.prototype.getSlider = function () {
    return this.container.find('.sliderDiv');
};

seatsio.ScaleSlider.prototype.getScaleSpan = function () {
    return this.container.find('.scaleSpan');
};

seatsio.ScaleSlider.prototype.show = function () {
    this.container.show();
};

seatsio.ScaleSlider.prototype.hide = function () {
    this.container.hide();
};

seatsio.Layers = function (designer) {
    this.designer = designer;
    this.layers = [];
};

seatsio.Layers.prototype.createLayer = function (name) {
    var previousLayer = this.layers.length == 0 ? null : this.layers[this.layers.length - 1];
    this.layers.push(new seatsio.Layer(name, previousLayer));
    return this;
};

seatsio.Layers.prototype.get = function (name) {
    return this.layers.findOne(function (layer) {
        return layer.name == name;
    });
};

seatsio.Layers.prototype.add = function (el, layerName) {
    this.layers
        .filter(function (layer) {
            return layer.name != layerName;
        })
        .forEach(function (layer) {
            layer.remove(el);
        });
    this.get(layerName).add(el);
};

seatsio.Layer = function(name, previousLayer) {
    this.name = name;
    this.previousLayer = previousLayer;
    this.objects = [];
};

seatsio.Layer.prototype.add = function(object) {
    if(this.objects.indexOf(object) != -1) {
        return;
    }
    var objectToInsertAfter = this.findFirstObject();
    if(objectToInsertAfter) {
        object.insertAfter(objectToInsertAfter);
    } else {
        object.toBack();
    }
    this.objects.push(object);
    object.seatsioLayer = this;
};

seatsio.Layer.prototype.findFirstObjectInPreviousLayer = function() {
    if(!this.previousLayer) {
        return;
    }
    return this.previousLayer.findFirstObject();
};

seatsio.Layer.prototype.findFirstObject = function() {
    if(this.objects.length > 0) {
        return this.objects[this.objects.length - 1];
    }
    return this.findFirstObjectInPreviousLayer();
};

seatsio.Layer.prototype.remove = function(el) {
    this.objects.remove(el);
    el.seatsioLayer = null;
};

seatsio.initializeEventHandlers = function (chartDesigner) {


    $("#chartForm").submit(function (e) {
        e.preventDefault();
    });

    $("#chartDesignerWrapper")
        .bind('copy', chartDesigner.onCopy)
        .bind('paste', chartDesigner.onPaste)
        .bind('cut', chartDesigner.onCut);

    $('#numberOfUnlabeledSeats').find("a").on("click", function (e) {
        e.preventDefault();
        chartDesigner.toSeatLabelingMode();
    });

    $('#numberOfUnlabeledRows').find("a").on("click", function (e) {
        e.preventDefault();
        chartDesigner.toObjectLabelingMode();
    });

    $('#numberOfUnlabeledTables').find("a").on("click", function (e) {
        e.preventDefault();
        chartDesigner.toObjectLabelingMode();
    });

    $(controlerIframe).find("#toTextMode").on("click", function () {
    	$(controlerIframe).find("#toTextMode").addClass("active");
        $(controlerIframe).find(".name-page").removeClass("selected");
        $(controlerIframe).find("#toTextMode").find(".name-page").addClass("selected");
    	chartDesigner.toTextMode();
    });

    $(controlerIframe).find("#toDrawFreeGeneralAdmission").on("click", function () {
        $(controlerIframe).find("#toDrawFreeGeneralAdmission").addClass("active");
        $(controlerIframe).find(".name-page").removeClass("selected");
        $(controlerIframe).find("#toDrawFreeGeneralAdmission").find(".name-page").addClass("selected");
        chartDesigner.setState(new seatsio.GeneralAdmissionState(chartDesigner));
    });
    
    $(controlerIframe).find("#toDrawRectGeneralAdmission").on("click", function () {
        $(controlerIframe).find("#toDrawFreeGeneralAdmission").addClass("active");
        $(controlerIframe).find(".name-page").removeClass("selected");
        $(controlerIframe).find("#toDrawFreeGeneralAdmission").find(".name-page").addClass("selected");
        chartDesigner.setState(new seatsio.GeneralAdmissionStateShape(chartDesigner, seatsio.Shapes.Rectangle));
    });
    
    $(controlerIframe).find("#toDrawCircleGeneralAdmission").on("click", function () {
        $(controlerIframe).find("#toDrawFreeGeneralAdmission").addClass("active");
        $(controlerIframe).find(".name-page").removeClass("selected");
        $(controlerIframe).find("#toDrawFreeGeneralAdmission").find(".name-page").addClass("selected");
        chartDesigner.setState(new seatsio.GeneralAdmissionStateShape(chartDesigner, seatsio.Shapes.Circle));
    });
    

//    $("#generalAdmissionModeButtonsContainer").find(".toRectShapeMode").on("click", function () {
//        chartDesigner.setState(new seatsio.GeneralAdmissionState(chartDesigner, seatsio.Shapes.Rectangle));
//    });
//
//    $("#generalAdmissionModeButtonsContainer").find(".toCircleShapeMode").on("click", function () {
//        chartDesigner.setState(new seatsio.GeneralAdmissionState(chartDesigner, seatsio.Shapes.Circle));
//    });

    $("#toShapesMode").on("click", function () {
        chartDesigner.setState(new seatsio.ShapeState(chartDesigner, seatsio.Shapes.Circle));
    });

    $(controlerIframe).find("#bookWholeTablesCheckbox").change(function () {
        if ($(this).prop('checked')) {
			let json = chartDesigner.json;
			if (typeof json.bookWholeTableNotSeats == "undefined" || json.bookWholeTableNotSeats == null || typeof json.subChart == "undefined" || 
            json.subChart == null || json.subChart.tables.length <= 0)
			{
				$(controlerIframe).find("#bookWholeTableNotSeatsCheckbox").prop("disabled", false);
			}
	    } else {
			$(controlerIframe).find("#bookWholeTableNotSeatsCheckbox").prop("checked", false);
			$(controlerIframe).find("#bookWholeTableNotSeatsCheckbox").prop("disabled", true);
		}
    });

    $(controlerIframe).find("#toShapesMode").on("click", function () {
    	$(controlerIframe).find("#toShapesMode_options").hide();
    	if($(controlerIframe).find('#toShapesMode_options').is(':visible')) {
    		$(controlerIframe).find("#toShapesMode_options").hide();
    	}
    	if($(controlerIframe).find("#toShapesMode").hasClass("active"))
    	{
    		$(controlerIframe).find("#toShapesMode").removeClass("active");
	    	$(controlerIframe).find("#toShapesMode_options").hide();
    	}
    	else
    	{
	    	$(controlerIframe).find("#toShapesMode").addClass("active");

	    	$(controlerIframe).find("#toShapesMode_options").show();

	    	chartDesigner.setState(new seatsio.ShapeState(chartDesigner, seatsio.Shapes.Circle));
	    	$(controlerIframe).find("#toCircleShapeMode").addClass("active");
            $(controlerIframe).find(".name-page").removeClass("selected");
            $(controlerIframe).find("#toCircleShapeMode").find(".name-page").addClass("selected");
    	}
    });


    $(controlerIframe).find("#toSectionMode").on("click", function () {
    	$(controlerIframe).find(".element-opt").removeClass("active");
    	$(controlerIframe).find("#toSectionMode").addClass("active");
    	chartDesigner.setState(new seatsio.SectionState(chartDesigner));
    });


    $(controlerIframe).find("#toRectShapeMode").on("click", function () {
    	$(controlerIframe).find("#toShapesMode").addClass("active");

    	$(controlerIframe).find("#toShapesMode_options").show();

    	chartDesigner.setState(new seatsio.ShapeState(chartDesigner, seatsio.Shapes.Rectangle));
    	$(controlerIframe).find("#toRectShapeMode").addClass("active");
        $(controlerIframe).find(".name-page").removeClass("selected");
        $(controlerIframe).find("#toRectShapeMode").find(".name-page").addClass("selected");
    });

    $(controlerIframe).find("#toCircleShapeMode").on("click", function () {
    	$(controlerIframe).find("#toShapesMode").addClass("active");

    	$(controlerIframe).find("#toShapesMode_options").show();

    	chartDesigner.setState(new seatsio.ShapeState(chartDesigner, seatsio.Shapes.Circle));
    	$(controlerIframe).find("#toCircleShapeMode").addClass("active");
        $(controlerIframe).find(".name-page").removeClass("selected");
        $(controlerIframe).find("#toCircleShapeMode").find(".name-page").addClass("selected");
    });

    $(controlerIframe).find("#toTablesMode").on("click", function () {
    	$(controlerIframe).find("#toTablesMode_options").hide();
    	if($(controlerIframe).find('#toTablesMode_options').is(':visible')) {
    		$(controlerIframe).find("#toTablesMode_options").hide();
    	}
    	if($(controlerIframe).find("#toTablesMode").hasClass("active"))
    	{
    		$(controlerIframe).find("#toTablesMode").removeClass("active");
	    	$(controlerIframe).find("#toTablesMode_options").hide();
    	}
    	else
    	{
	    	$(controlerIframe).find("#toTablesMode").addClass("active");

	    	$(controlerIframe).find("#toTablesMode_options").show();

	    	chartDesigner.setState(new seatsio.RoundTableDrawingState(chartDesigner));
	    	$(controlerIframe).find("#toDrawRoundTableMode").addClass("active");
            $(controlerIframe).find(".name-page").removeClass("selected");
            $(controlerIframe).find("#toDrawRoundTableMode").addClass("selected");
    	}
    });


    $(controlerIframe).find("#toDrawRoundTableMode").on("click", function () {
    	$(controlerIframe).find("#toTablesMode").addClass("active");
    	$(controlerIframe).find("#toDrawRoundTableMode").addClass("active");
        $(controlerIframe).find(".name-page").removeClass("selected");
        $(controlerIframe).find("#toDrawRoundTableMode").addClass("selected");
    	$(controlerIframe).find("#toTablesMode_options").show();

    	chartDesigner.setState(new seatsio.RoundTableDrawingState(chartDesigner));
    });


    $(controlerIframe).find("#toDrawRectTableMode").on("click", function () {
    	$(controlerIframe).find("#toTablesMode").addClass("active");
    	$(controlerIframe).find("#toDrawRectTableMode").addClass("active");
        $(controlerIframe).find(".name-page").removeClass("selected");
        $(controlerIframe).find("#toDrawRectTableMode").addClass("selected");

    	$(controlerIframe).find("#toTablesMode_options").show();

    	chartDesigner.setState(new seatsio.RectTableDrawingState(chartDesigner));
    });

    $(controlerIframe).find("#toBoothsMode").on("click", function () {
    	$(controlerIframe).find(".element-opt").removeClass("active");
    	$(controlerIframe).find("#toTablesMode").addClass("active");

    	$(controlerIframe).find("#toTablesMode_options").show();

    	chartDesigner.setState(new seatsio.BoothsDrawingState(chartDesigner, $("#boothWidth").val(), $("#boothHeight").val()));
    	$(controlerIframe).find("#toBoothsMode").addClass("active");
    });

    $(controlerIframe).find("#toBoothsMode").on("click", function () {
    	$(controlerIframe).find(".element-opt").removeClass("active");
    	$(controlerIframe).find("#toBoothsMode").addClass("active");

    });

    $(controlerIframe).find("#boothWidth").on('change', function () {
        chartDesigner.setState(new seatsio.BoothsDrawingState(chartDesigner, $("#boothWidth").val(), $("#boothHeight").val()));
    });

    $(controlerIframe).find("#boothHeight").on('change', function () {
        chartDesigner.setState(new seatsio.BoothsDrawingState(chartDesigner, $("#boothWidth").val(), $("#boothHeight").val()));
    });



    $(controlerIframe).find("#toDrawMode").on("click", function () {
    	$(controlerIframe).find(".element-opt").removeClass("active");
    	$(controlerIframe).find("#toDrawMode").addClass("active");
    	$(controlerIframe).find("#toSelectionMode").addClass("active");
        hideAccordions();
    	chartDesigner.setState(new seatsio.SelectionModeState(chartDesigner));
    });


    $(controlerIframe).find("#toSelectionMode").on("click", function () {
    	$(controlerIframe).find(".element-opt").removeClass("active");
        $(controlerIframe).find(".option-btn").removeClass("active");
    	$(controlerIframe).find("#toSelectionMode").addClass("active");
        hideAccordions();
    	chartDesigner.setState(new seatsio.SelectionModeState(chartDesigner));
    });

    $("#toLabelingMode").on("click", function () {
        chartDesigner.toLabelingMode();
    });

    $(controlerIframe).find("#toCategoryMode").on("click", function () {
    	$(controlerIframe).find(".element-opt").removeClass("active");
        $(controlerIframe).find(".option-btn").removeClass("active");
    	$(controlerIframe).find("#toCategoryMode").addClass("active");
        hideAccordions();
    	chartDesigner.toCategoryMode();
    });

    /*
    $('#toBackgroundImageMode').on("click", function () {
        chartDesigner.toBackgroundImageMode();
        showPanel('#vBackgroundSeatmap');
    });
    */

    $(controlerIframe).find("#toFocalPointMode").on("click", function () {
    	$(controlerIframe).find(".element-opt").removeClass("active");
        $(controlerIframe).find(".option-btn").removeClass("active");
    	$(controlerIframe).find("#toFocalPointMode").addClass("active");
        hideAccordions();
        chartDesigner.setState(new seatsio.FocalPointState(chartDesigner));
    });


    $(controlerIframe).find("#toRowMode").on("click", function () {
    	$(controlerIframe).find("#toRowMode").addClass("active");
        $(controlerIframe).find(".name-page").removeClass("selected");
        $(controlerIframe).find("#toRowMode").find(".name-page").addClass("selected");
    	chartDesigner.setState(new seatsio.RowModeState(chartDesigner));
    });


    $("#copyButton").on("click", function () {
        chartDesigner.onCopy();
    });

    $("#deleteButton").on("click", function () {
        chartDesigner.onDelete();
    });

    $("#pasteButton").on("click", function () {
        chartDesigner.onPaste();
    });

    $("#alignCenterButton").on("click", function () {
        chartDesigner.onAlignCenter();
    });

    $("#alignLeftButton").on("click", function () {
        chartDesigner.onAlignLeft();
    });

    $("#alignRightButton").on("click", function () {
        chartDesigner.onAlignRight();
    });

    $(controlerIframe).find("#showSeatLabelsButton").on("click", function () {
    	$(controlerIframe).find("#showSeatLabelsButton").addClass("active");
        $(controlerIframe).find(".name-page").removeClass("selected");
        $(controlerIframe).find("#showSeatLabelsButton").find(".name-page").addClass("selected");
    	chartDesigner.showSeatLabels();
    });

    $(controlerIframe).find("#showObjectLabelsButton").on("click", function () {
    	$(controlerIframe).find("#showObjectLabelsButton").addClass("active");
        $(controlerIframe).find(".name-page").removeClass("selected");
        $(controlerIframe).find("#showObjectLabelsButton").find(".name-page").addClass("selected");
    	chartDesigner.showObjectLabels();
    });

    /*
    $(controlerIframe).find("#backgroundImageUrl").on("change", function () {
    	chartDesigner.activeSubChart().backgroundImage.setBackgroundImage($(this).val());
    });
    */

    $('#snapToGrid').on("click", function () {
	    if($('#snapToGrid').hasClass('active'))
		{
			$('#snapToGrid').removeClass("active");
			$('#snappingCheckbox').attr('checked', false);
			seatsio.ChartDesigner.snapToGridEnabled = false;
		}
		else
		{
			$('#snapToGrid').addClass("active");
			$('#snappingCheckbox').attr('checked', true);
			seatsio.ChartDesigner.snapToGridEnabled = true;
		}
    });

    $('#snappingCheckbox').on("change", function () {
        seatsio.ChartDesigner.snapToGridEnabled = $(this).is(":checked");
    });

    $(controlerIframe).find("#showOnRenderedChartsCheckbox").on("click", function () {
        chartDesigner.activeSubChart().backgroundImage.setShowOnRenderedCharts($(this).is(":checked"));
    });

    $("#labelAlwaysShownCheckbox").on("change", function () {
        chartDesigner.getState().labelAlwaysShownCheckboxChanged($(this).is(':checked'));
    });

    $('#moveLabelUp').on("click", function () {
        chartDesigner.getState().moveLabelUpClicked();
    });

    $('#moveLabelDown').on("click", function () {
        chartDesigner.getState().moveLabelDownClicked();
    });

    $('#moveLabelLeft').on("click", function () {
        chartDesigner.getState().moveLabelLeftClicked();
    });

    $('#moveLabelRight').on("click", function () {
        chartDesigner.getState().moveLabelRightClicked();
    });

    $('#zoomIn').on("click", function () {
        chartDesigner.zoomer.zoomIn();
        setTimeout(function(){
        	$(controlerIframe).find("#panUp").removeClass("active");
        }, 1000);
    });

    $('#zoomOut').on("click", function () {
        chartDesigner.zoomer.zoomOut();
    });

    $('#showLabels').on("click", function () {
    	if($('#showLabels').hasClass('active'))
    	{
    		$('#showLabels').removeClass("active");
    		$('#showLabelsCheckbox').attr('checked', false);
    		chartDesigner.hideLabels();
    	}
    	else
    	{
    		$('#showLabels').addClass("active");
    		$('#showLabelsCheckbox').attr('checked', true);
    		chartDesigner.showLabels();
    	}
    });

    $('#showLabelsCheckbox').on("change", function () {
        if ($(this).is(':checked')) {
            chartDesigner.showLabels();
        } else {
            chartDesigner.hideLabels();
        }
    });

    $('#showAllButtonsCheckbox').on("change", function () {
        chartDesigner.setShowAllButtons($(this).is(':checked'));
    });

    $('#toMasterSubChartButton').on("click", function () {
		chartDesigner.subChartsToJson();
        chartDesigner.showMasterSubChart();
    });

};

function updateBackgroundMap()
{
	var backgroundImage = $(controlerIframe).find("#backgroundImageUrl").val();
	var backgroundImageSrc = $(controlerIframe).find("#dropboxImageSelected-background_img").attr('src');

	if(backgroundImageSrc != null && backgroundImageSrc != undefined)
	{
    	//show remove image
    	$(controlerIframe).find("#removeBackgroundButton").show();
    	//$(controlerIframe).find("#backgroundImageUrl").val(backgroundImageSrc);

		chartDesigner.activeSubChart().backgroundImage.setBackgroundImage(backgroundImageSrc);
	}
}

function hideAccordions()
{
    $(controlerIframe).find("#cont-tab-left-1").hide();
    $(controlerIframe).find("#cont-tab-left-2").hide();
    $(controlerIframe).find("#cont-tab-left-3").hide();
    $(controlerIframe).find("#tab_left-1").removeClass("active");
    $(controlerIframe).find("#tab_left-2").removeClass("active");
    $(controlerIframe).find("#tab_left-3").removeClass("active");
    $(controlerIframe).find(".name-page").removeClass("selected");
}

(function (S) {
    S.SelectedObjects = function (arrayOfObjects, designer) {

        var me = this;

        var selectionRectangle;
        var rotationLine;
        var rotationHandle;
        var resizeRowAtEndHandle, resizeRowAtStartHandle;
        var movingRectangle;
        var transforming = false;
        var rotation = true;

        this.tooltip = new S.SelectedObjectsTooltip(this, designer);
        this.moveEndListener = null;

        this.bbox = function () {
            return S.Bbox.from(setOfSetsOfElements().getBBox(), designer);
        };

        this.noRotation = function () {
            rotation = false;
            return this;
        };

        this.contains = function (object) {
            return arrayOfObjects.indexOf(object) != -1;
        };

        this.singleObjectSelected = function () {
            return arrayOfObjects.length == 1;
        };

        this.duplicate = function () {
            var copies = arrayOfObjects.map(function (object) {
                return object.duplicate().draw().mover.doMove(new S.Point(S.Chair.width, S.Chair.width));
            });
            designer.setState(new S.ObjectsSelectedState(designer, copies));
        };

        function noRows() {
            return arrayOfObjects.filter(no(S.Row));
        }

        function focalPointSelected() {
            return arrayOfObjects.findOne(a(S.FocalPoint));
        }

        function a(type) {
            return function (e) {
                return e instanceof type;
            };
        }

        function no(type) {
            return function (e) {
                return !(e instanceof type);
            }
        }

        function noTables() {
            return arrayOfObjects.filter(function (e) {
                return !(e instanceof S.RoundTable) && !(e instanceof S.RectTable);
            });
        }

        function noTexts() {
            return arrayOfObjects.filter(function (e) {
                return !(e instanceof S.TextInput);
            });
        }

        function noShapes() {
            return arrayOfObjects.filter(function (e) {
                return !(e instanceof S.ShapedObject) || (e instanceof S.GeneralAdmissionArea);
            });
        }

        function noRectangleShapes() {
            return arrayOfObjects.filter(function (e) {
                return !(e instanceof S.Shapes.Rectangle);
            });
        }

        function noGeneralAdmissionAreas() {
            return arrayOfObjects.filter(function (e) {
                return !(e instanceof S.GeneralAdmissionArea);
            });
        }

        function noSections() {
            return arrayOfObjects.filter(function (e) {
                return !(e instanceof S.Section);
            });
        }

        function noGeneralAdmissionArea() {
            return arrayOfObjects.filter(function (e) {
                return !(e instanceof S.GeneralAdmissionArea);
            });
        }

        function noRoundTables() {
            return arrayOfObjects.filter(function (e) {
                return !(e instanceof S.RoundTable);
            })
        }

        function noRectTables() {
            return arrayOfObjects.filter(function (e) {
                return !(e instanceof S.RectTable);
            })
        }

        function rectTables() {
            return arrayOfObjects.filter(function (e) {
                return (e instanceof S.RectTable);
            });
        }

        function moreThanThreePoints() {
			return arrayOfObjects.some(function (e) {
                return e.points && e.points.length > 3;
            })
		}
		
		function hasPoints() {
			return arrayOfObjects.some(function (e) {
                return e.points;
            })
		}

        function rows() {
            return arrayOfObjects.filter(function (e) {
                return e instanceof S.Row;
            });
        }

        function tables() {
            return arrayOfObjects.filter(function (e) {
                return e instanceof S.RoundTable || e instanceof S.RectTable;
            });
        }

        function shapes() {
            return arrayOfObjects.filter(function (e) {
                return e instanceof S.ShapedObject;
            });
        }

        function rectangles() {
            return arrayOfObjects.filter(function (e) {
                return e instanceof S.Shapes.Rectangle;
            });
        }

        function roundTables() {
            return arrayOfObjects.filter(function (e) {
                return e instanceof S.RoundTable;
            });
        }

        function onlyRowsSelected() {
            return noRows().length === 0;
        }

        function onlyOneRowSelected() {
            return onlyRowsSelected() && rows().length === 1;
        }

        function showResizeHandles() {
            return onlyOneRowSelected();
        }

        this.setNumberOfChairs = function (num) {
            tables().forEach(function (table) {
                table.setNumberOfChairs(num);
            });
        };

        this.setNumberOfOpenSpaces = function (num) {
            tables().forEach(function (table) {
                table.setNumberOfOpenSpaces(num);
            });
        };

        this.setRadius = function (val) {
            roundTables().forEach(function (table) {
                table.setRadius(val);
            });
        };

        this.setFontSize = function (fontSize) {
            arrayOfObjects.forEach(function (textInput) {
                textInput.setFontSize(fontSize);
            })
        };

        this.setLabelSize = function (labelSize) {
            arrayOfObjects.forEach(function (object) {
                object.setLabelSize(labelSize);
            })
        };

        this.setHeight = function (val) {
            rectTables().forEach(function (table) {
                table.setHeight(val);
            });
        };

        this.setWidth = function (val) {
            rectTables().forEach(function (table) {
                table.setWidth(val);
            });
        };

        this.setRotationAngle = function (val) {
            rotatables().forEach(function (rotatable) {
                rotatable.setRotationAngle(val);
            });
        };

        this.setLabelRotationAngle = function (labelRotationAngle) {
            arrayOfObjects.forEach(function (object) {
                object.setLabelRotationAngle(labelRotationAngle);
            });
        };

        this.setStrokeWidth = function (val) {
            shapes().forEach(function (shape) {
                shape.setStrokeWidth(val);
            });
        };

        this.setCornerRadius = function (val) {
            rectangles().forEach(function (rect) {
                rect.setCornerRadius(val);
            })
        };

        this.setStrokeColor = function (val) {
            shapes().forEach(function (shape) {
                shape.setStrokeColor(val);
            });
        };

        this.setFillColor = function (val) {
            shapes().forEach(function (shape) {
                shape.setFillColor(val);
            });
        };

        this.setTextColor = function (textColor) {
            arrayOfObjects.forEach(function (textInput) {
                textInput.setTextColor(textColor);
            });
        };

        this.currentRadius = function () {
            return roundTables()
                .map(function (e) {
                    return e.radius;
                })
                .uniques()
                .onlyElementOr(S.RoundTable.defaultRadius);
        };

        this.currentFontSize = function () {
            return arrayOfObjects
                .map(function (textInput) {
                    return textInput.fontSize;
                })
                .uniques()
                .onlyElementOr(S.TextInput.defaultFontSize);
        };

        this.currentLabelSize = function () {
            return arrayOfObjects
                .map(function (object) {
                    return object.labelSize;
                })
                .uniques()
                .onlyElementOr(seatsio.Section.DEFAULT_LABEL_SIZE);
        };

        this.currentHeight = function () {
            return rectTables()
                .map(function (e) {
                    return e.height;
                })
                .uniques()
                .onlyElementOr(S.RectTable.defaultHeight);
        };

        this.currentWidth = function () {
            return rectTables()
                .map(function (e) {
                    return e.width;
                })
                .uniques()
                .onlyElementOr(S.RectTable.defaultWidth);
        };

        this.currentStrokeWidth = function () {
            return shapes()
                .map(function (e) {
                    return e.strokeWidth;
                })
                .uniques()
                .onlyElementOr(1);
        };

        this.currentStrokeColor = function () {
            return shapes()
                .map(function (e) {
                    return e.strokeColor;
                })
                .uniques()
                .onlyElementOr("#009f9f");
        };

        this.currentFillColor = function () {
            return shapes()
                .map(function (e) {
                    return e.fillColor;
                })
                .uniques()
                .onlyElementOr("#FFF");
        };

        this.currentTextColor = function () {
            return arrayOfObjects
                .map(function (e) {
                    return e.textColor;
                })
                .uniques()
                .onlyElementOr(S.TextInput.defaultTextColor);
        };

        this.currentCornerRadius = function () {
            return rectangles()
                .map(function (e) {
                    return e.cornerRadius;
                })
                .uniques()
                .onlyElementOr(1);
        };

        this.getSelectedObject = function () {
            return arrayOfObjects[0];
        };

        this.size = function () {
            return arrayOfObjects.length;
        }

        this.isSingleText = function () {
            return this.oneObjectSelected() && (this.getSelectedObject() instanceof S.TextInput);
        };

        this.canBeDuplicated = function () {
            return !focalPointSelected();
        };

        this.oneSectionSelected = function () {
            return this.oneObjectSelected() && (this.getSelectedObject() instanceof S.Section);
        };

        this.oneObjectSelected = function () {
            return arrayOfObjects.length == 1;
        };

        this.canBeDeleted = function () {
            return true;
        };

        this.canBeFlipped = function () {
            return onlyRowsSelected() && noRowsWithOneChair();
        };

        this.canBeCurved = function () {
            return onlyRowsSelected() && noRowsWithOneChair();
        };

        this.onlyTablesSelected = function () {
            return noTables().length === 0;
        };

        function noRowsWithOneChair() {
            return !arrayOfObjects.findOne(rowWithOneChair);
        }

        function rowWithOneChair(row) {
            return row.numberOfChairs() == 1;
        }

        function selectedObjectsWithoutFunction(functionName) {
            return arrayOfObjects.filter(function (e) {
                return typeof(e[functionName]) != "function";
            });
        }

        function selectedObjectsWithFunction(functionName) {
            return arrayOfObjects.filter(function (e) {
                return typeof(e[functionName]) == "function";
            });
        }

        this.onlyRotatableObjectsSelected = function () {
            return selectedObjectsWithoutFunction("setRotationAngle").length === 0;
        };

        this.singleGeneralAdmissionAreaSelected = function () {
            return this.oneObjectSelected() && noGeneralAdmissionAreas().length == 0;
        };

        this.singleSectionOrGAAreaSelected = function () {
            return this.oneObjectSelected() && (noSections().length == 0 || noGeneralAdmissionAreas().length == 0);
        };

        this.canDeleteAPoint = function ()
        {
			return this.oneObjectSelected() && moreThanThreePoints();
		}
		
		this.canCreateNewPoint = function ()
        {
			return this.oneObjectSelected() && hasPoints();
		}

        function rotatables() {
            return selectedObjectsWithFunction("setRotationAngle");
        }

        this.currentRotation = function () {
            return rotatables()
                .map(function (e) {
                    return e.rotationAngle;
                })
                .uniques()
                .onlyElementOr(0);
        };

        this.currentLabelRotation = function () {
            return arrayOfObjects
                .map(function (e) {
                    return e.labelRotationAngle;
                })
                .uniques()
                .onlyElementOr(0);
        };

        this.onlyShapesSelected = function () {
            return noShapes().length === 0;
        };

        this.onlyTextsSelected = function () {
            return noTexts().length === 0;
        };

        this.onlyRectangleShapesSelected = function () {
            return noRectangleShapes().length === 0;
        };

        this.onlyRoundTablesSelected = function () {
            return noRoundTables().length === 0;
        };

        this.onlySectionsSelected = function () {
            return noSections().length === 0;
        };

        this.onlyGeneralAdmissionAreaSelected = function () {
            return noGeneralAdmissionArea().length === 0;
        };

        this.onlyRectTablesSelected = function () {
            return noRectTables().length === 0;
        };

        this.currentTableLayoutIs = function (layoutToCheck) {
            return rectTables().filter(function (t) {
                return t.layout !== layoutToCheck;
            }).length === 0;
        };

        this.currentCurve = function () {
            return rows()
                .map(function (e) {
                    return e.curve;
                })
                .uniques()
                .onlyElementOr(0, function (el) {
                    return el;
                });
        };

        this.currentNumberOfChairs = function () {
            return tables()
                .map(function (e) {
                    return e.numberOfChairs();
                })
                .uniques()
                .onlyElementOr(S.RoundTable.defaultNumberOfChairs);
        };

        this.currentNumberOfOpenSpaces = function () {
            return roundTables()
                .map(function (e) {
                    return e.numberOfOpenSpaces();
                })
                .uniques()
                .onlyElementOr(0);
        };

        this.onlyObject = function () {
            return arrayOfObjects[0];
        };

        this.transformingSelection = function () {
            return transforming;
        };

        this.select = function () {
            function drawSelectionRectangle(bbox) {
                return bbox.drawRectangle()
                    .attr({'stroke-dasharray': '* ', 'stroke': 'DarkTurquoise'})
                    .toLayer('selectionRectanglesLayer', designer)
                    .applyZoom(designer);
            }

            function transformElementsOnDrag(draggedElement, transformationOnMoveFunction, onStartFunction, onEndFunction) {
                function onStart() {
                    arrayOfObjects.forEach(function (object) {
                        object.hideLabelAndChildLabels();
                    });
                    me.tooltip.hide();
                    if (onStartFunction) {
                        onStartFunction();
                    }
                }

                function onEnd() {
                    me.tooltip.show();
                    if (onEndFunction) {
                        onEndFunction();
                    }
                    me.reselect();
                }

                draggedElement.onDragTransform(designer, getAllElementsInSelection(), transformationOnMoveFunction, onStart, onEnd);
            }

            function rotationLineTopY(bbox) {
                return bbox.middleTop().y - 24;
            }

            function rotationLineX(bbox) {
                return bbox.middleTop().x;
            }

            function drawRotationLine(bbox) {
                return designer.drawLine(rotationLineX(bbox), bbox.point1().y, bbox.middleTop().x, rotationLineTopY(bbox), 2)
                    .toLayer('transformationHandlesLayer', designer)
                    .attr({'fill': 'DarkTurquoise', 'stroke':'#383c48'})
                    .applyZoom(designer);
            }

            function drawRotationHandle(bbox) {
                return designer.paper.circle(rotationLineX(bbox), rotationLineTopY(bbox), 7)
                    .toLayer('transformationHandlesLayer', designer)
                    .applyZoomButKeepSize(designer)
                    .attr({'fill': 'DarkTurquoise', 'stroke':'#383c48', 'cursor': 'url(' + urlEstaticosPlanos + 'img/rotate.cur), auto'});
            }

            function drawResizeHandle(point, color) {
                return designer.paper.rect(point.x - 3, point.y - 3, 6, 6)
                    .toLayer('transformationHandlesLayer', designer)
                    .applyZoom(designer)
                    .attr({'fill': 'DarkTurquoise', 'stroke':'#383c48', 'cursor': 'col-resize'});
            }

            function drawMovingRectangle(bbox) {
                return bbox.drawRectangle()
                    .toLayer('selectionRectanglesLayer', designer)
                    .applyZoom(designer)
                    .attr({'fill': 'DarkTurquoise', 'stroke':'#383c48', 'opacity': 0.3, 'cursor': 'move'});
            }

            function makeObjectsRotatable() {
                var startX;
                var startY;
                var rotationAngle;
                var bboxCenter;

                function computeRotation(dx, dy, e) {
                    var cursorPosition = new S.Point(startX, startY).add(new S.Point(dx, dy));
                    var mousePointerRay = new S.Ray(bboxCenter.toView(designer), cursorPosition).snapToAngle(S.ChartDesigner.snapToAngle);
                    var rotationHandleAtStartOfRotationRay = new S.Ray(bboxCenter.toView(designer), new S.Point(startX, startY));
                    rotationAngle = mousePointerRay.angleBetween(rotationHandleAtStartOfRotationRay);
                    return 'r' + rotationAngle + ',' + bboxCenter.toView(designer).x + ',' + bboxCenter.toView(designer).y;
                }

                function saveRotationHandleXY() {
                    bboxCenter = me.bbox().center();
                    startX = rotationHandle.matrix.x(rotationHandle.attr('cx'), rotationHandle.attr('cy'));
                    startY = rotationHandle.matrix.y(rotationHandle.attr('cx'), rotationHandle.attr('cy'));
                }

                transformElementsOnDrag(rotationHandle, computeRotation, saveRotationHandleXY, function () {
                    arrayOfObjects.forEach(function (object) {
                        object.rotated(bboxCenter, rotationAngle);
                    });
                });
            }

            function makeRowsResizable() {

                function addChairsAtEnd(dx, dy, e) {
                    var point = S.Point.fromEvent(e, designer);
                    var row = rows()[0];
                    row.transformToAroundFirst(row.createRayFromFirstChairToLast().projectPoint(point), designer.helperLines.areClosestRowHelperLinesShown());
                    row.numberOfChairsWidget.show();
                    row.draw();
                }

                function addChairsAtStart(dx, dy, e) {
                    var point = S.Point.fromEvent(e, designer);
                    var row = rows()[0];
                    row.transformToAroundLast(row.createRayFromFirstChairToLast().projectPoint(point), designer.helperLines.areClosestRowHelperLinesShown());
                    row.numberOfChairsWidget.showAtEnd();
                    row.draw();
                }

                function startFunction() {
                    getSetOfSelectionElements().hide();
                    me.tooltip.hide();
                }

                function endFunction() {
                    var row = rows()[0];
                    row.numberOfChairsWidget.hide();
                    me.reselect();
                }

                S.onDrag(designer, resizeRowAtEndHandle, addChairsAtEnd, startFunction, endFunction);
                S.onDrag(designer, resizeRowAtStartHandle, addChairsAtStart, startFunction, endFunction);

            }

            function makeObjectsMovable() {
                var latestTranslationVector;

                function createTranslation(dx, dy) {
                    latestTranslationVector = S.Vector.fromView(dx, dy, designer).snapToGrid();
                    return latestTranslationVector.asTranslation();
                }

                transformElementsOnDrag(movingRectangle, createTranslation, null, function () {
                    arrayOfObjects.forEach(function (object) {
                        object.moved(latestTranslationVector);
                        if (me.moveEndListener) {
                            me.moveEndListener();
                        }
                    });
                });
            }

            function highlightObjects() {
                arrayOfObjects.forEach(function (object) {
                    object.highlight();
                });
            }

            arrayOfObjects.forEach(function (object) {
                if (object.selected) {
                    object.selected();
                }
            });

            var bbox = me.bbox();
            selectionRectangle = drawSelectionRectangle(bbox);

            if (rotation) {
                rotationLine = drawRotationLine(bbox);
                rotationHandle = drawRotationHandle(bbox);
            }
            movingRectangle = drawMovingRectangle(bbox);

            if (showResizeHandles()) {
                var row = rows()[0];
                var ray = row.createRayFromFirstChairBorderToLast();
                resizeRowAtEndHandle = drawResizeHandle(ray.end, 'white');
                resizeRowAtStartHandle = drawResizeHandle(ray.origin, 'white');
                makeRowsResizable();
            }

            if (rotation) {
                makeObjectsRotatable();
            }

            makeObjectsMovable();

            highlightObjects();
            this.tooltip.show();
            return this;
        };

        this.withMoveEndListener = function (moveEndListener) {
            this.moveEndListener = moveEndListener;
            return this;
        };

        this.hideSelectionElements = function () {
            getSetOfSelectionElements().remove();
        };

        this.deselect = function () {
            arrayOfObjects.forEach(function (object) {
                if (object.deselected) {
                    object.deselected();
                }
            });
            this.tooltip.hide();
            arrayOfObjects.forEach(function (object) {
                object.unhighlight();
            });
            me.hideSelectionElements();
        };

        function getAllElementsInSelection() {
            var allElementsInSelection = getSetOfSelectionElements();
            arrayOfObjects.forEach(function (object) {
                pushAll(allElementsInSelection, object.allElementsSet());
            });
            return allElementsInSelection;
        }

        function getSetOfSelectionElements() {
            var selectionElements = designer.paper.set();
            pushAll(selectionElements, selectionRectangle);
            if (rotation) {
                pushAll(selectionElements, rotationLine);
                pushAll(selectionElements, rotationHandle);
            }
            if (showResizeHandles()) {
                pushAll(selectionElements, S.set(designer.paper, resizeRowAtEndHandle, resizeRowAtStartHandle));
            }
            pushAll(selectionElements, movingRectangle);
            var extraSelectionElements = arrayOfObjects.flatMap(function (object) {
                if (object.selectionElements) {
                    return object.selectionElements();
                }
                return [];
            });
            pushAll(selectionElements, extraSelectionElements);
            return selectionElements;
        }

        function setOfSetsOfElements() {
            var setOfSetsOfChairs = designer.paper.set();
            pushAll(setOfSetsOfChairs, arrayOfObjects.map(function (object) {
                return object.allElementsSet();
            }));
            return setOfSetsOfChairs;
        }

        this.getArrayOfObjects = function () {
            return arrayOfObjects;
        };

        this.reselect = function () {
            this.deselect();
            this.select();
        };

        this.doCurve = function (amount) {
            arrayOfObjects.forEach(function (row) {
                row.doCurve(amount);
            });
        };

        this.deleteSelectedObjects = function () {
            arrayOfObjects.forEach(function (object) {
                object.remove();
            });
        };

        this.setTableLayout = function (layout) {
            arrayOfObjects.forEach(function (table) {
                table.setLayout(layout);
            });
        }

    }
})(seatsio);

seatsio.NumberOfSelectedObjectsMessage = function () {
};

seatsio.NumberOfSelectedObjectsMessage.prototype.showForSeats = function (seats) {
    this.show(seats.length);
};

seatsio.NumberOfSelectedObjectsMessage.prototype.showForObjectsWithSeats = function (objectsWithSeats) {
    this.show(this.countObject(objectsWithSeats));
};

seatsio.NumberOfSelectedObjectsMessage.prototype.countObject = function (objectsWithSeats) {
    return objectsWithSeats
        .flatMap(function (object) {
            if (typeof(object.getChairs) !== 'undefined') {
                return object.getChairs();
            }
            return [{}];
        }).length;
};

seatsio.NumberOfSelectedObjectsMessage.prototype.hide = function () {
    this.el().hide();
};

seatsio.NumberOfSelectedObjectsMessage.prototype.show = function (numberOfSelectedObjects) {
    return this.el().show().find('span').text(numberOfSelectedObjects);
};

seatsio.NumberOfSelectedObjectsMessage.prototype.el = function () {
    return $('#objectsInSelectionMessage');
};

(function (S) {

    S.SelectedObjectsTooltip = function (selectedObjects, designer) {

        var emojisGrid = function () {
            return selectedObjects.getSelectedObject().createEmojisGrid();
        }
        
        var textContextMenu = function () {
            return selectedObjects.getSelectedObject().createTextContextMenu();
        }

        var textInput = function () {
            return selectedObjects.isSingleText() ? selectedObjects.getSelectedObject().createInputField() : undefined;
        };

        var editSectionContentsButton = function () {
            if (selectedObjects.oneSectionSelected()) {
                return largeButton("palco4icon-edit", polyglot.t("seatmap.seatmap_editor.Edit_section_content"))
                    .addClass('edit-section-content-button')
                    .on("click", function () {
						designer.json.subChart = designer.subChartsToJson();
                        designer.showSectionSubChart(selectedObjects.getSelectedObject());
                    });
            }
        };

        var duplicateButton = function () {
            return selectedObjects.canBeDuplicated() ? button("palco4icon-copy", polyglot.t("seatmap.Duplicate")).on("click", function () {
                var nmbrOfSelectedObjects  = selectedObjects.size();
                if(nmbrOfSelectedObjects > 15)
                {
                
                	confirmarMensaje(polyglot.t("seatmap.seatmap_editor.Duplicate_object"), null, polyglot.t("seatmap.Duplicate"), polyglot.t("seatmap.Cancel"), function () {        			
                		designer.onDuplicate();
                    }, 
                    null, polyglot.t("seatmap.seatmap_editor.Do_you_want_to_duplicate_these_objects", { numberObjects: nmbrOfSelectedObjects }));
                	                	                	
                } else {
                    designer.onDuplicate();
                }
            }) : undefined;
        };

        var deleteBtn = function () {
            return selectedObjects.canBeDeleted() ? button("palco4icon-delete", polyglot.t("seatmap.Delete")).on("click", function(){
                var nmbrOfSelectedObjects  = selectedObjects.size();
                var msgPart = (nmbrOfSelectedObjects === 1) ? polyglot.t("seatmap.this_1_object") : polyglot.t("seatmap.seatmap_editor.these_number_object", { number: nmbrOfSelectedObjects })
                		
        		confirmarMensaje(polyglot.t("seatmap.seatmap_editor.Delete_object"), polyglot.t("seatmap.seatmap_editor.Do_you_want_to_delete_object", { objectName: msgPart }), polyglot.t("seatmap.Delete"), polyglot.t("seatmap.Cancel"), function () {        			
        			designer.onDelete();
                }, 
                null);		
                                
            }) : undefined;
        };

        var textPositionCheckbox = function () {
            return selectedObjects.onlyTextsSelected() ? checkbox("palco4icon-font", polyglot.t("seatmap.Put_text_in_front"), selectedObjects.getArrayOfObjects().every(obj => obj.textAboveEverything == 1)).on("click", function() {
			let selObjects = selectedObjects.getArrayOfObjects();
			for (let i = 0; i < selObjects.length; i++)
			{
				selObjects[i].setTextAboveEverything(this.querySelector("input[type='checkbox']").checked);
			}
			
			}) : undefined;
        };

        var flipHorizontalBtn = function () {
            return selectedObjects.canBeFlipped() ? button("palco4icon-reflect-horinzotal", polyglot.t("seatmap.Flip_horizontally")).on("click", designer.onFlipHorizontal) : undefined;
        };

        var flipVerticalBtn = function () {
            return selectedObjects.canBeFlipped() ? button("palco4icon-reflect-vertical", polyglot.t("seatmap.Flip_vertically")).on("click", designer.onFlipVertical) : undefined;
        };

        var curveSlider = function () {
            return selectedObjects.canBeCurved() ? slider('curveSlider', icon("palco4icon-bend"), polyglot.t("seatmap.Curve")) : undefined;
        };

        var chairsSlider = function () {
            return selectedObjects.onlyTablesSelected() ? slider('tableChairsSlider', "<div class='icon-wrapper'><i class='palco4icon' id='numberOfChairsLabel'>" + selectedObjects.currentNumberOfChairs() + "</i></div>", polyglot.t("seatmap.Chairs")) : undefined;
        };

        var openSpacesSlider = function () {
            return selectedObjects.onlyRoundTablesSelected() ? slider('openSpacesSlider', "<div class='icon-wrapper'><i class='palco4icon' id='numberOfOpenSpacesLabel'>" + selectedObjects.currentNumberOfOpenSpaces() + "</i></div>", polyglot.t("seatmap.Open_spaces")) : undefined;
        };

        var widthSlider = function () {
            return selectedObjects.onlyRectTablesSelected() ? slider('widthSlider', "<div class='icon-wrapper'><i class='palco4icon palco4icon-width-size'></i></div></span>", polyglot.t("seatmap.Width")) : undefined;
        };

        var heightSlider = function () {
            return selectedObjects.onlyRectTablesSelected() ? slider('heightSlider', "<div class='icon-wrapper'><i class='palco4icon palco4icon-height-size'></i></div>", polyglot.t("seatmap.Height")) : undefined;
        };

        var radiusSlider = function () {
            return selectedObjects.onlyRoundTablesSelected() ? slider('radiusSlider', "<div class='icon-wrapper'><i class='palco4icon palco4icon-square_shappe'></i></div>", polyglot.t("seatmap.Radius")) : undefined;
        };

        var fontSizeSlider = function () {
            return selectedObjects.onlyTextsSelected() ? slider('fontSizeSlider', "<div class='icon-wrapper'><i class='palco4icon palco4icon-font'></i></div>", polyglot.t("seatmap.Font_size")) : undefined;
        };

        var sectionLabelSizeSlider = function () {
            return selectedObjects.onlySectionsSelected() ? slider('sectionLabelSizeSlider', "<div class='icon-wrapper'><i class='palco4icon palco4icon-flip-to-front'></i></div>", polyglot.t("seatmap.Label_size")) : undefined;
        };

        var generalAdmissionAreaLabelSizeSlider = function () {
            return selectedObjects.onlyGeneralAdmissionAreaSelected() ? slider('sectionLabelSizeSlider', "<div class='icon-wrapper'><i class='palco4icon palco4icon-flip-to-front'></i></div>", polyglot.t("seatmap.Label_size")) : undefined;
        };

        var tableLayoutSelector = function () {
            if (selectedObjects.onlyRectTablesSelected()) {
                return selector([
                    selectorBtn("oneSide", 'palco4icon-table-square-one-lateral', selectedObjects.currentTableLayoutIs("oneSide")).on("click", function () {
                        selectedObjects.setTableLayout("oneSide");
                    }),
                    selectorBtn("twoSides", 'palco4icon-table-square-lateral', selectedObjects.currentTableLayoutIs("twoSides")).on("click", function () {
                        selectedObjects.setTableLayout("twoSides");
                    }),
                    selectorBtn("twoSides", 'palco4icon-table-square', selectedObjects.currentTableLayoutIs("bothHeads")).on("click", function () {
                        selectedObjects.setTableLayout("bothHeads");
                    })
                ]);
            } else {
                return undefined;
            }
        };

/*
        function capacityInput() {
            return selectedObjects.singleGeneralAdmissionAreaSelected() ? createCapacityInput() : undefined;
        }

        function createCapacityInput() {
            function saveCapacity(capacity) {
                var parsedCapacity = parseInt(capacity);
                if (parsedCapacity >= 0) {
                    selectedObjects.getSelectedObject().setCapacity(parsedCapacity);
                }
            }

            var input = $('<input placeholder="Capacity" id="generalAdmissionCapacity" type="text" style="width: 100%; text-align: center;">')
                .val(selectedObjects.getSelectedObject().capacity)
                .on('keypress', function (e) {
                    if (e.which == 13) {
                        saveCapacity($(this).val());
                        designer.tooltip.hide();
                    }
                })
                .on('blur', function () {
                    saveCapacity($(this).val());
                });
            return control($('<div>').append(input), true); //clc controlInputLabel($('<div>').append(input), true);
        }
*/

        function labelInput() {
            return selectedObjects.singleSectionOrGAAreaSelected() ? createLabelInput() : undefined;
        }

        function createLabelInput() {
        	        	
        	function saveLabel(label) {
                selectedObjects.getSelectedObject().changeLabel(label);
            }

            var input = $('<label>'+polyglot.t("seatmap.Name_of_sector")+'</label><input placeholder="Label" id="label" type="text">')
                .val(selectedObjects.getSelectedObject().label)
                .on('keyup', function (e) {
                    saveLabel($(this).val());
                    if (e.which == 13) {
                        designer.tooltip.hide();
                    }
                })
                .on('blur', function () {
                    saveLabel($(this).val());
                });
            return  control($('<div>').append(input), true);
        }

        function canDeletePoint() {
			return selectedObjects.canDeleteAPoint() ? button("palco4icon-copy", polyglot.t("seatmap.Delete_point")).on("click", function () {
                selectedObjects.getArrayOfObjects()[0].deletePoint();
//                var nmbrOfSelectedObjects  = selectedObjects.size();
//                if(nmbrOfSelectedObjects > 15)
//                {
//                
//                	confirmarMensaje(polyglot.t("seatmap.seatmap_editor.Duplicate_object"), null, polyglot.t("seatmap.Duplicate"), polyglot.t("seatmap.Cancel"), function () {        			
//                		designer.onDeletePoint();
//                    }, 
//                    null, polyglot.t("seatmap.seatmap_editor.Do_you_want_to_duplicate_these_objects", { numberObjects: nmbrOfSelectedObjects }));
//                }
            }) : undefined;
		}
		
		function createNewPoint() {
			return selectedObjects.canCreateNewPoint() ? button("palco4icon-copy", polyglot.t("seatmap.Create_new_point")).on("click", function () {
                selectedObjects.getArrayOfObjects()[0].createPoint()
            }) : undefined;
		}

        var textColorControl = function () {
            return selectedObjects.onlyTextsSelected() ? colorPicker("textColorControl", "<div class='icon-wrapper'><i class='palco4icon-paint'></i></div>", polyglot.t("seatmap.Text_color")) : undefined;
        };

        var rotationAngleControl = function () {
            return selectedObjects.onlyRotatableObjectsSelected() ? slider('rotationAngleControl', "<div class='icon-wrapper'><i class='palco4icon-replay'></i></div>", polyglot.t("seatmap.Rotate")) : undefined;
        };

        var sectionLabelRotationAngleControl = function () {
            return selectedObjects.onlySectionsSelected() ? slider('sectionLabelRotationAngleControl', "<div class='icon-wrapper'><i class='palco4icon-replay'></i></div>", polyglot.t("seatmap.Label_rotation")) : undefined;
        };

        var generalAdmissionAreaLabelRotationAngleControl = function () {
            return selectedObjects.onlyGeneralAdmissionAreaSelected() ? slider('sectionLabelRotationAngleControl', "<div class='icon-wrapper'><i class='palco4icon-replay'></i></div>", polyglot.t("seatmap.Label_rotation")) : undefined;
        };

        var roundedCornerControl = function () {
            return selectedObjects.onlyRectangleShapesSelected() ? slider('roundedCornerControl', "<div class='icon-wrapper'><i class='palco4icon-square_shappe'></i></div>", polyglot.t("seatmap.Rounded_corners")) : undefined;
        };

        var strokeWidthControl = function () {
            return selectedObjects.onlyShapesSelected() ? slider('strokeWidthControl', "<div class='icon-wrapper'><i class='palco4icon-minus'></i></div>", polyglot.t("seatmap.Stroke_width")) : undefined;
        };

        var strokeColorControl = function () {
            return selectedObjects.onlyShapesSelected() ? colorPicker("strokeColorControl", "<div class='icon-wrapper'><i class='palco4icon-paint'></i></div>", polyglot.t("seatmap.Stroke_color")) : undefined;
        };

        var fillColorControl = function () {
            return selectedObjects.onlyShapesSelected() ? colorPicker("fillColorControl", "<div class='icon-wrapper'><i class='palco4icon-paint'></i></div>", polyglot.t("seatmap.Fill_color")) : undefined;
        };

        function initSliders() {
        	
        	var tooltip1 = $('<div id="tooltip tooltip-slider-seatmap" />').css({
        	    position: 'absolute',
        	    top: -29,
        	    left: -5,
        	    background: '#00e1e1',
        	    padding: '0px 5px',
        	    borderRadius: '5px'
        	}).hide();
        	
        	var tooltip2 = $('<div id="tooltip tooltip-slider-seatmap" />').css({
        	    position: 'absolute',
        	    top: -29,
        	    left: -5,
        	    background: '#00e1e1',
        	    padding: '0px 5px',
        	    borderRadius: '5px'
        	}).hide();
        	
        	var tooltip3 = $('<div id="tooltip tooltip-slider-seatmap" />').css({
        	    position: 'absolute',
        	    top: -29,
        	    left: -5,
        	    background: '#00e1e1',
        	    padding: '0px 5px',
        	    borderRadius: '5px'
        	}).hide();
        	
        	var tooltip4 = $('<div id="tooltip tooltip-slider-seatmap" />').css({
        	    position: 'absolute',
        	    top: -29,
        	    left: -5,
        	    background: '#00e1e1',
        	    padding: '0px 5px',
        	    borderRadius: '5px'
        	}).hide();
        	
        	var tooltip5 = $('<div id="tooltip tooltip-slider-seatmap" />').css({
        	    position: 'absolute',
        	    top: -29,
        	    left: -5,
        	    background: '#00e1e1',
        	    padding: '0px 5px',
        	    borderRadius: '5px'
        	}).hide();
        	
        	var tooltip6 = $('<div id="tooltip tooltip-slider-seatmap" />').css({
        	    position: 'absolute',
        	    top: -29,
        	    left: -5,
        	    background: '#00e1e1',
        	    padding: '0px 5px',
        	    borderRadius: '5px'
        	}).hide();
        	
        	var tooltip7 = $('<div id="tooltip tooltip-slider-seatmap" />').css({
        	    position: 'absolute',
        	    top: -29,
        	    left: -5,
        	    background: '#00e1e1',
        	    padding: '0px 5px',
        	    borderRadius: '5px'
        	}).hide();
        	
        	var tooltip8 = $('<div id="tooltip tooltip-slider-seatmap" />').css({
        	    position: 'absolute',
        	    top: -29,
        	    left: -5,
        	    background: '#00e1e1',
        	    padding: '0px 5px',
        	    borderRadius: '5px'
        	}).hide();
        	
        	var tooltip9 = $('<div id="tooltip tooltip-slider-seatmap" />').css({
        	    position: 'absolute',
        	    top: -29,
        	    left: -5,
        	    background: '#00e1e1',
        	    padding: '0px 5px',
        	    borderRadius: '5px'
        	}).hide();
        	
        	var tooltip10 = $('<div id="tooltip tooltip-slider-seatmap" />').css({
        	    position: 'absolute',
        	    top: -29,
        	    left: -5,
        	    background: '#00e1e1',
        	    padding: '0px 5px',
        	    borderRadius: '5px'
        	}).hide();
        	
            $("#tableChairsSlider").slider({min: 0, max: 20, step: 1, value: selectedObjects.currentNumberOfChairs(), tooltip: 'hide'})
                .on('slide', function (event, ui) {
                    selectedObjects.setNumberOfChairs(ui.value);
                    $("#numberOfChairsLabel").html(ui.value);
                })
                .on('slideStop', function () {
                    designer.reselect();
                });
            
            $("#curveSlider")
                .slider({"min": -15, "max": 15, "step": 1, "value": selectedObjects.currentCurve(), tooltip: 'show'})
                .on('slide',function (event, ui) {
                	if (typeof ui.value == 'number') {
                        designer.doCurve(ui.value);
                        tooltip1.text(ui.value);
                    } else if (ui.value instanceof Array) {
                        designer.doCurve(ui.values[0]);
                        tooltip1.text(ui.values[0]);
                    }
                }).on('slideStop', function () {
                    designer.reselect();
                }).find(".ui-slider-handle").append(tooltip1).hover(function() {
                    tooltip1.show()
                }, function() {
                    tooltip1.hide()
                });
            
            $("#openSpacesSlider").slider({min: 0, max: 20, step: 1, value: selectedObjects.currentNumberOfOpenSpaces(), tooltip: 'hide'})
                .on('slide', function (event, ui) {
                    selectedObjects.setNumberOfOpenSpaces(ui.value);
                    $("#numberOfOpenSpacesLabel").html(ui.value);
                })
                .on('slideStop', function () {
                    designer.reselect();
                });
            
            $("#radiusSlider").slider({min: 0, max: 60, step: 3, value: selectedObjects.currentRadius(), tooltip: 'show'})
                .on('slide', function (event, ui) {
                	if (typeof ui.value == 'number') {
                        selectedObjects.setRadius(ui.value);
                        tooltip2.text(ui.value);
                    } else if (ui.value instanceof Array) {
                        selectedObjects.setRadius(ui.values[0]);
                        tooltip2.text(ui.values[0]);
                    }
                })
                .on('slideStop', function () {
                    designer.reselect();
                }).find(".ui-slider-handle").append(tooltip2).hover(function() {
                    tooltip2.show()
                }, function() {
                    tooltip2.hide()
                });
            
            $("#fontSizeSlider").slider({min: 6, max: 2000, step: 1, value: selectedObjects.currentFontSize(), tooltip: 'show'})
                .on('slide', function (event, ui) {
                	if (typeof ui.value == 'number') {
                        selectedObjects.setFontSize(ui.value);
                        tooltip3.text(ui.value);
                    } else if (ui.value instanceof Array) {
                        selectedObjects.setFontSize(ui.values[0]);
                        tooltip3.text(ui.values[0]);
                    }
                })
                .on('slideStop', function () {
                    designer.reselect();
                }).find(".ui-slider-handle").append(tooltip3).hover(function() {
                    tooltip3.show()
                }, function() {
                    tooltip3.hide()
                });
            
            $("#sectionLabelSizeSlider").slider({min: 6, max: 100, step: 1, value: selectedObjects.currentLabelSize(), tooltip: 'show'})
                .on('slide', function (event, ui) {
                    if (typeof ui.value == 'number') {
                        selectedObjects.setLabelSize(ui.value);
                        tooltip4.text(ui.value);
                    } else if (ui.value instanceof Array) {
                        selectedObjects.setLabelSize(ui.values[0]);
                        tooltip4.text(ui.values[0]);
                    }
                }).find(".ui-slider-handle").append(tooltip4).hover(function() {
                    tooltip4.show()
                }, function() {
                    tooltip4.hide()
                });
            
            $("#heightSlider").slider({min: 0, max: 180, step: 3, value: selectedObjects.currentHeight(), tooltip: 'hide'})
                .on('slide', function (event, ui) {
                	if (typeof ui.value == 'number') {
                        selectedObjects.setHeight(ui.value);
                        tooltip5.text(ui.value);
                    } else if (ui.value instanceof Array) {
                        selectedObjects.setHeight(ui.values[0]);
                        tooltip5.text(ui.values[0]);
                    }
                })
                .on('slideStop', function () {
                    designer.reselect();
                }).find(".ui-slider-handle").append(tooltip5).hover(function() {
                    tooltip5.show()
                }, function() {
                    tooltip5.hide()
                });
            
            $("#widthSlider").slider({min: 0, max: 400, step: 4, value: selectedObjects.currentWidth(), tooltip: 'hide'})
                .on('slide', function (event, ui) {
                	if (typeof ui.value == 'number') {
                        selectedObjects.setWidth(ui.value);
                        tooltip6.text(ui.value);
                    } else if (ui.value instanceof Array) {
                        selectedObjects.setWidth(ui.values[0]);
                        tooltip6.text(ui.values[0]);
                    }
                })
                .on('slideStop', function () {
                    designer.reselect();
                }).find(".ui-slider-handle").append(tooltip6).hover(function() {
                    tooltip6.show()
                }, function() {
                    tooltip6.hide()
                });
            
            $("#rotationAngleControl").slider({min: -180, max: 180, step: 5, value: selectedObjects.currentRotation(), tooltip: 'hide'})
                .on('slide', function (event, ui) {
                	if (typeof ui.value == 'number') {
                        selectedObjects.setRotationAngle(ui.value);
                        tooltip7.text(ui.value);
                    } else if (ui.value instanceof Array) {
                        selectedObjects.setRotationAngle(ui.values[0]);
                        tooltip7.text(ui.values[0]);
                    }
                })
                .on('slideStop', function () {
                    designer.reselect();
                }).find(".ui-slider-handle").append(tooltip7).hover(function() {
                    tooltip7.show()
                }, function() {
                    tooltip7.hide()
                });
            
            $("#sectionLabelRotationAngleControl").slider({min: -180, max: 180, step: 5, value: selectedObjects.currentLabelRotation(), tooltip: 'hide'})
                .on('slide', function (event, ui) {
                	if (typeof ui.value == 'number') {
                        selectedObjects.setLabelRotationAngle(ui.value);
                        tooltip8.text(ui.value);
                    } else if (ui.value instanceof Array) {
                        selectedObjects.setLabelRotationAngle(ui.values[0]);
                        tooltip8.text(ui.values[0]);
                    }
                }).find(".ui-slider-handle").append(tooltip8).hover(function() {
                    tooltip8.show()
                }, function() {
                    tooltip8.hide()
                });
            
            $("#strokeWidthControl").slider({min: 1, max: 20, step: 1, value: selectedObjects.currentStrokeWidth(), tooltip: 'hide'})
                .on('slide', function (event, ui) {
                	if (typeof ui.value == 'number') {
                        selectedObjects.setStrokeWidth(ui.value);
                        tooltip9.text(ui.value);
                    } else if (ui.value instanceof Array) {
                        selectedObjects.setStrokeWidth(ui.values[0]);
                        tooltip9.text(ui.values[0]);
                    }
                })
                .on('slideStop', function () {
                    designer.reselect();
                }).find(".ui-slider-handle").append(tooltip9).hover(function() {
                    tooltip9.show()
                }, function() {
                    tooltip9.hide()
                });
            
            $("#roundedCornerControl").slider({min: 1, max: 50, step: 1, value: selectedObjects.currentCornerRadius(), tooltip: 'hide'})
                .on('slide', function (event, ui) {
                	if (typeof ui.value == 'number') {
                        selectedObjects.setCornerRadius(ui.value);
                        tooltip10.text(ui.value);
                    } else if (ui.value instanceof Array) {
                        selectedObjects.setCornerRadius(ui.values[0]);
                        tooltip10.text(ui.values[0]);
                    }
                })
                .on('slideStop', function () {
                    designer.reselect();
                }).find(".ui-slider-handle").append(tooltip10).hover(function() {
                    tooltip10.show()
                }, function() {
                    tooltip10.hide()
                });
        }

        function initColorPickers() {

            function initColorPicker($el, currentColor, callback) {
                $el.spectrum({
                    color: currentColor,
                    showInput: true,
                    showAlpha: true,
                    showButtons: false,
                    move: function (color) {
                        callback(color);
                    },
                    change: function (color) {
                        callback(color);
                    }
                });
            }

            initColorPicker(
                $("#strokeColorControl"),
                selectedObjects.currentStrokeColor(),
                function (color) {
                   selectedObjects.setStrokeColor(color.toRgbString());
                }
            );

            initColorPicker(
                $("#fillColorControl"),
                selectedObjects.currentFillColor(),
                function (color) {
                    selectedObjects.setFillColor(color.toRgbString());
                }
            );

            initColorPicker(
                $("#textColorControl"),
                selectedObjects.currentTextColor(),
                function (color) {
                    selectedObjects.setTextColor(color.toRgbString());
                }
            );
        }

        function hideColorPickers() {
            $(".tooltipColorPicker").spectrum("hide");
        }

        function buttons() {
            return [
                labelInput(),
                sectionLabelSizeSlider(),
                sectionLabelRotationAngleControl(),
                generalAdmissionAreaLabelSizeSlider(),
                generalAdmissionAreaLabelRotationAngleControl(),
                createNewPoint(),
                canDeletePoint(),
                tableLayoutSelector(),
                textInput(),
                flipHorizontalBtn(),
                flipVerticalBtn(),
                curveSlider(),
                chairsSlider(),
                openSpacesSlider(),
                widthSlider(),
                radiusSlider(),
                fontSizeSlider(),
                textColorControl(),
                heightSlider(),
                rotationAngleControl(),
                roundedCornerControl(),
                strokeWidthControl(),
                strokeColorControl(),
                fillColorControl(),
                textPositionCheckbox(),
                duplicateButton(),
                deleteBtn(),
                editSectionContentsButton()
//                , capacityInput()
            ];
        }

        this.renderButtonsTooltip = function () {
            designer.tooltip.html($("<div>").append(buttons())).show(selectedObjects);
            initSliders();
            initColorPickers();
        }

        this.show = function () {
            var me = this;

            if (selectedObjects.singleObjectSelected() && selectedObjects.onlyObject().tooltip) {
                selectedObjects.onlyObject().tooltip.show();
                initSliders();
                initColorPickers();
            } else if(designer.tooltip.isNewText) {
                    designer.tooltip.html($("<div id='text-options'>").append(emojisGrid(), textContextMenu())).show(selectedObjects);
    
                    document.getElementById('text-options').addEventListener("click", function()
                    {
                        me.renderButtonsTooltip();
                        if(designer.tooltip.isPlainText)
                        {
                            $("#fontSizeSlider").slider({max: 100});
                        }
                    });
            }
            else
            {
                me.renderButtonsTooltip();
            }
        };

        this.hide = function () {
            designer.tooltip.isNewText = false;
            if (selectedObjects.singleObjectSelected() && selectedObjects.onlyObject().tooltip) {
                selectedObjects.onlyObject().tooltip.hide();
            } else {
                designer.tooltip.hide();
            }
            hideColorPickers();
        };

        function control(content, noHoverEffect) {
            var el = $('<div>').addClass("control").append(content);
            if (!noHoverEffect) {
                el.addClass("hoverEffect")
            }
            return el;
        }
        
        /*
        function controlInputLabel(content, noHoverEffect) {
        	console.log("controlInputLabel");
        	console.log(content);
            var el = $('<div class="control without-padding">').append(content);
            if (!noHoverEffect) {
                el.addClass("hoverEffect")
            }
            return el;
        }
        */

        function icon(iconClass) {
        	var icon = $('<i>').addClass("palco4icon").addClass(iconClass);
            var iconContainer = $('<div>').addClass("icon-wrapper");
            return iconContainer.append(icon);
        }
        
        function iconButton(iconClass) {
        	return $('<i>').addClass("palco4icon").addClass(iconClass);
        }

        function button(iconClass, text) {
            return control($('<div>')
                .append(icon(iconClass))
                .append(text)
            );
        }

        function largeButton(iconClass, text) {
            return control($('<button class="button primary expanded small">')
                .append(iconButton(iconClass))
                .append(text), true
            );
        }

        function slider(id, iconClass, label) {
            return control(
                $('<div>').append(iconClass).append('<span class="sliderLabel">' + label + '</span>' + '<div id="' + id + '" style="width: 100px;"><div class="scaleSpan">'),
                true
            );
        }

        function colorPicker(id, iconClass, label) {
            return control(
                $('<div>').append(iconClass).append('<span class="sliderLabel">' + label + '</span>' + '<input type="text" class="tooltipColorPicker" id="' + id + '">'),
                true
            );
        }
        
        function pickColor(id, iconClass, label) {
            return control(
                $('<div>').append(iconClass).append('<span class="sliderLabel">' + label + '</span>' + '<input type="color" class="pickColor" id="' + id + '" name="color" value="">'),
                true
            );
        }

        function checkbox(iconClass, label, checked) {
			let check = checked ? "checked" : "";
			return control(
                $('<div>').append(icon(iconClass)).append('<input type="checkbox" name="checkboxLabel" id="checkboxLabel" '+ check + ' value="true">' + '<label class="checkboxLabel" for="checkboxLabel">' + label + '</label></div>'),
                true
            );
		}

        function selectorBtn(id, icon, selected) {
            var label = $('<label class="btn btn-default">');
            var radio = $('<input type="radio" name="options" id="' + id + '" autocomplete="off" checked>');
            var img = $('<i style="height:28px" class="' + icon + '"></i>');
            if (selected) {
                label.addClass("active");
            }
            return label.append(radio).append(img);

        }

        function selector(buttons) {
            return control(
                $('<div class="btn-group btn-group-justified" data-toggle="buttons" role="group">').append(buttons),
                true
            );
        }

    }
})(seatsio);


(function (S) {

    S.SubChart = function () {
    };

    S.SubChart.prototype.init = function (designer) {
        this.designer = designer;
        this.validator = new S.ChartValidator(this);
        this.tables = new S.Tables(this);
        this.rows = [];
        this.textInputs = [];
        this.bbox = null;
        this.shapes = new S.Shapes();
        this.booths = new S.Booths();
        this.sections = new S.Sections();
        this.generalAdmissionAreas = new S.GeneralAdmissionAreas();
        this.serializing = false;
        this.deserializing = false;
        return this;
    };

    S.SubChart.prototype.computeBbox = function () {
        this.bbox = S.Bbox.from(this.renderedElementsSet().getBBox(), this.designer);
        if (this.bbox) {
            this.bbox = this.bbox.adjustForStrokes();
        }
    };

    S.SubChart.prototype.getBBox = function () {
        if (!this.bbox) {
            this.computeBbox();
        }
        return this.bbox;
    };

    S.SubChart.prototype.getMinAndMaxDistance = function (point) {
        var me = this;
        var min = null;
        var max = null;
        this.chairs().forEach(function (chair) {
            var distance = point.distanceToPoint(chair.center());
            if (min === null) {
                min = distance;
                max = distance;
            } else if (distance < min) {
                min = distance
            }
            else if (distance > max) {
                max = distance;
            }
        });
        return {
            'min': min,
            'max': max
        };
    };

    S.SubChart.prototype.allRowElementsSet = function () {
        var me = this;
        var allElements = me.designer.paper.set();
        me.rows.forEach(function (row) {
            pushAll(allElements, row.allElementsSet());
        });
        return allElements;
    };

    S.SubChart.prototype.allTextElementsSet = function () {
        var me = this;
        var allElements = me.designer.paper.set();
        me.textInputs.forEach(function (textInput) {
            pushAll(allElements, textInput.allElementsSet());
        });
        return allElements;
    };

    S.SubChart.prototype.deleteRow = function (row) {
        this.rows.splice(this.rows.indexOf(row), 1);
        row.undraw();
    };

    S.SubChart.prototype.addRow = function (row) {
        this.rows.push(row);
        return row;
    };

    S.SubChart.prototype.addTextInput = function (textInput) {
        this.textInputs.push(textInput);
        return textInput;
    };

    S.SubChart.prototype.removeTextInput = function (textInput) {
        textInput.undraw();
        this.textInputs.remove(textInput);
    };

    S.SubChart.prototype.allSelectableObjects = function () {
        return this.allSelectableObjectsExceptSections()
            .concat(this.sections.sections);
    };

    S.SubChart.prototype.allSelectableObjectsExceptSections = function () {
        return this.rows
            .concat(this.tables.tables)
            .concat(this.booths.booths)
            .concat(this.textInputs)
            .concat(this.shapes.shapes())
            .concat(this.generalAdmissionAreas.areas());
    };

    S.SubChart.prototype.categorisableObjects = function () {
        return this.chairs()
            .concat(this.booths.booths)
            .concat(this.generalAdmissionAreas.areas());
    };

    S.SubChart.prototype.hideLabels = function () {
        this.allObjects().forEach(function (object) {
            object.hideLabelAndChildLabels();
        });
    };

    S.SubChart.prototype.showLabels = function () {
        this.allObjects().forEach(function (object) {
            object.showLabelAndChildLabels();
        });
    };

    S.SubChart.prototype.draw = function () {
        this.allObjects().forEach(function (object) {
            object.draw();
        });
        return this;
    };

    S.SubChart.prototype.undraw = function () {
        this.allObjects().forEach(function (object) {
            object.undraw();
        });
    };

    S.SubChart.prototype.redraw = function () {
        this.undraw();
        this.draw();
    };

    S.SubChart.prototype.nonSeatLabelableObjects = function () {
        return this.tables.tables
            .concat(this.rows)
            .concat(this.booths.booths);
    };

    S.SubChart.prototype.allObjectsWithSeats = function () {
        return this.objectsWithSeats();
    };

    S.SubChart.prototype.objectsWithSeats = function () {
        return this.tables.tables.concat(this.rows);
    };

    S.SubChart.prototype.chairs = function () {
        var chairs = [];
        this.objectsWithSeats().forEach(function (row) {
            chairs = chairs.concat(row.getChairs());
        });
        return chairs;
    };

    S.SubChart.prototype.blur = function () {
        this.allObjects().forEach(function (object) {
            object.blur();
        });
    };

    S.SubChart.prototype.unblur = function () {
        this.allObjects().forEach(function (object) {
            object.unblur();
        });
    };

    S.SubChart.prototype.computeSnapOffset = function () {
        if (!this.bbox) {
            return {x: 0, y: 0};
        }
        return { x: this.bbox.point1().x, y: this.bbox.point1().y };
    };

    S.SubChart.prototype.rowsJson = function () {
        return this.rows.map(function (row) {
            return row.toJson();
        });
    };

    S.SubChart.prototype.textsJson = function () {
        return this.textInputs.map(function (textInput) {
            return textInput.toJson();
        });
    };

    S.SubChart.prototype.computeAutoSizedHeight = function () {
        if (!this.bbox) {
            return null;
        }
        this.autoSizedHeight = Math.round(this.bbox.height());
        return this.autoSizedHeight;
    };

    S.SubChart.prototype.computeAutoSizedWidth = function () {
        if (!this.bbox) {
            return null;
        }
        this.autoSizedWidth = Math.round(this.bbox.width());
        return this.autoSizedWidth;
    };

    S.SubChart.prototype.isActive = function() {
        return this.designer.activeSubChart() == this;
    };

    S.SubChart.prototype._toJson = function (extra) {
        this.serializing = true;
        this.computeBbox();
        var height = this.computeAutoSizedHeight();
        var width = this.computeAutoSizedWidth();
        var json = {
            'height': height,
            'width': width,
            'snapOffset': this.computeSnapOffset(),
            'tables': this.tables.tables.map(toJson),
            'texts': this.textInputs.map(toJson),
            'rows': this.rows.map(toJson),
            'shapes': this.shapes.shapes().map(toJson),
            'booths': this.booths.booths.map(toJson),
            'generalAdmissionAreas': this.generalAdmissionAreas.areas().map(toJson)
        };
        if(extra) {
            extra(json);
        }
        this.serializing = false;
        return json;
    };

    S.SubChart._fromJson = function (json, subChart, extra) {
        subChart.deserializing = true;
        subChart.autoSizedWidth = json.width;
        subChart.autoSizedHeight = json.height;
        if (json.snapOffset)
			subChart.snapOffset = new S.Point(json.snapOffset.x, json.snapOffset.y);
		else
			subChart.snapOffset = new S.Point(0, 0);
        var topLeft = S.Point.fromJson({x: 0, y: 0}, subChart);
        subChart.bbox = S.Bbox.from({ height: json.height, width: json.width, x: topLeft.x, y: topLeft.y}, subChart.designer);
        subChart.rows = S.SubChart.rowsFromJson(json.rows, subChart);
        subChart.textInputs = S.SubChart.textsFromJson(json.texts, subChart);
        subChart.tables = S.Tables.fromJson(json.tables, subChart);
        subChart.booths = S.Booths.fromJson(json.booths, subChart);
        subChart.shapes = S.Shapes.fromJson(json.shapes, subChart);
        subChart.generalAdmissionAreas = S.GeneralAdmissionAreas.fromJson(json.generalAdmissionAreas, subChart);
        if (extra) {
            extra(subChart);
        }
        subChart.deserializing = false;
        return subChart;
    };

    S.SubChart.rowsFromJson = function (rows, subChart) {
        return rows.map(function (row) {
            return subChart.addRow(S.Row.createFromModel(row, subChart));
        });
    };

    S.SubChart.textsFromJson = function (texts, subChart) {
        return texts.map(function (text) {
            var textInput = S.TextInput.fromJson(text, subChart);
            subChart.textInputs.push(textInput);
            return textInput;
        });
    };

})(seatsio);

seatsio.SectionSubChart = function (section, designer) {
    this.init(designer);
    this.section = section;
    this.category = section.category;
    this.backgroundSection = new seatsio.BackgroundSection(section, designer);
};

seatsio.SectionSubChart.prototype = new seatsio.SubChart();

seatsio.SectionSubChart.prototype.toJson = function () {
    return this._toJson();
};

seatsio.SectionSubChart.prototype.allObjects = function () {
    return this.allSelectableObjects().concat(this.backgroundSection);
};

seatsio.SectionSubChart.prototype.renderedElementsSet = function () {
    return seatsio.set(this.designer.paper,
        this.tables.allElementsSet(),
        this.shapes.allElementsSet(),
        this.booths.allElementsSet(),
        this.generalAdmissionAreas.allElementsSet(),
        this.allRowElementsSet(),
        this.allTextElementsSet(),
        this.backgroundSection.allElementsSet()
    );
};

seatsio.SectionSubChart.prototype.sectionScaleChanged = function () {
    this.backgroundSection.redraw();
};

seatsio.SectionSubChart.prototype.isMaster = function () {
    return false;
};

seatsio.SectionSubChart.fromJson = function (section, json, designer) {
    return seatsio.SubChart._fromJson(json, new seatsio.SectionSubChart(section, designer));
};

seatsio.MasterSubChart = function (designer) {
    this.init(designer);
    this.focalPoint = new seatsio.FocalPoint(this);
    this.backgroundImage = new seatsio.BackgroundImage(designer);
};

seatsio.MasterSubChart.prototype = new seatsio.SubChart();

seatsio.MasterSubChart.prototype.isMaster = function () {
    return true;
};

seatsio.MasterSubChart.prototype.allObjects = function () {
    return this.allSelectableObjects().concat(this.backgroundImage);
};

seatsio.MasterSubChart.prototype.allObjectsWithSeats = function () {
    return this.allSubCharts()
        .flatMap(function (subChart) {
            return subChart.objectsWithSeats();
        });
};

seatsio.MasterSubChart.prototype.allSubCharts = function () {
    return this.sections.sections
        .map(function (section) {
            return section.subChart
        })
        .concat([this])
};

seatsio.MasterSubChart.prototype.renderedElementsSet = function () {
    return seatsio.set(this.designer.paper,
        this.tables.allElementsSet(),
        this.shapes.allElementsSet(),
        this.booths.allElementsSet(),
        this.generalAdmissionAreas.allElementsSet(),
        this.allRowElementsSet(),
        this.allTextElementsSet(),
        this.sections.allElementsSet(),
        this.backgroundImageSet()
    );
};

seatsio.MasterSubChart.prototype.backgroundImageSet = function () {
    var set = this.designer.paper.set();
    var backgroundImage = this.backgroundImage;
    if (backgroundImage.getBackgroundImage()) {
        set.push(backgroundImage.getBackgroundImage());
    }
    return set;
};

seatsio.MasterSubChart.prototype.toJson = function () {
    return this._toJson.call(this, function (json) {
        json.sections = this.sections.toJson();
        json.focalPoint = this.focalPoint.toJson();
        json.backgroundImage = this.backgroundImage.toJson();
    }.bind(this));
};

seatsio.MasterSubChart.prototype.categorisableObjects = function () {
    return seatsio.SubChart.prototype.categorisableObjects.apply(this).concat(this.sections.sections);
};

seatsio.MasterSubChart.fromJson = function (json, designer) {
    return seatsio.SubChart._fromJson(json, new seatsio.MasterSubChart(designer), function (masterSubChart) {
        masterSubChart.focalPoint = json.focalPoint ? seatsio.FocalPoint.fromJson(json.focalPoint, masterSubChart) : masterSubChart.focalPoint;
        masterSubChart.backgroundImage = seatsio.BackgroundImage.fromJson(json.backgroundImage, masterSubChart);
        masterSubChart.sections = seatsio.Sections.fromJson(json.sections, masterSubChart);
    });
};


(function (S) {
    S.TableMousePointer = function (designer) {

        var table;
        var startPoint;

        this.showAt = function (point, f) {
            if (!table) {
                startPoint = point;
                table = f(point, designer.activeSubChart()).draw().disableSelection().hideLabelAndChildLabels().allElementsSet().startTransformation();
            } else {
                table.transform(startPoint.vectorTo(point, designer).asTranslation());
            }
        };

        this.hide = function () {
            if (table) {
                table.remove();
                table = null;
                startPoint = null;
            }
        };
    }
})(seatsio);

(function (S) {
    S.Tables = function (subChart) {

        this.tables = [];

        this.add = function(table) {
            this.tables.push(table);
            return table;
        };

        this.draw = function(center, f) {
            var table = f(center, subChart);
            table.label = S.Tables.generateLabel();
            table.draw();
            table.animate(60);
            return this.add(table);
        };

        this.remove = function(table) {
            table.undraw();
            this.tables.remove(table);
        };

        this.allElementsSet = function() {
            return this.tables.map(function(table) {
                return table.allElementsSet();
            });
        };
    };

    S.Tables.labelCounter = 1;

    S.Tables.generateLabel = function() {
        return 'T' + S.Tables.labelCounter++;
    };

    S.Tables.chairWidth = 20;
    S.Tables.chairRadius = S.Tables.chairWidth / 2;
    S.Tables.awayFromTableOffset = S.Tables.chairRadius * 0.7;

    S.Tables.fromJson = function(tablesJson, subChart) {
        var tables = new S.Tables(subChart);
        tables.tables = tablesJson.map(function(jsonTable) {
            if (jsonTable.type === "rectangular"){
                return S.RectTable.fromJson(jsonTable, subChart);
            } else {
                return S.RoundTable.fromJson(jsonTable, subChart);
            }
        });
        return  tables;
    };

    S.Tables.createDefaultRound = function (center, subChart) {
        var table = new S.RoundTable(center, undefined, subChart);
        table.setNumberOfChairs(S.RoundTable.defaultNumberOfChairs);
        return table;
    };

    S.Tables.createDefaultRect = function(center, subChart) {
        var table = new S.RectTable(center, S.RectTable.defaultWidth, S.RectTable.defaultHeight, S.RectTable.defaultLayout, subChart);
        table.setNumberOfChairs(S.RectTable.defaultNumberOfChairs);
        return table;
    };


})(seatsio);

(function (S) {

    S.Table = function(){

    };

    S.Table.prototype = new S.Object();

    S.Table.prototype.animate = function (duration) {
        this.chairs.forEach(function (chair) {
            chair.animate(duration);
        });
    };

    S.Table.prototype.determineColor = function() {
        if(this.chairs.length == 0) {
            return S.Chair.defaultColor;
        }
        return this.chairs[0].determineColor();
    };

}(seatsio));

(function (S) {
    S.RoundTable = function (center, radius, subChart) {

        var designer = subChart.designer;

        this.init(designer);

        var me = this;
        var table;

        this.chairs = [];
        this.openSpaces = 0;
        this.rotationAngle = 0;
        this.label;
        me.radius = radius;
        me.category = null;
        me.id = S.Object.newId();


        this.children = function () {
            return this.chairs;
        };

        this.center = function () {
            return center;
        };

        this.drawn = function () {
            return table;
        };

        this.draw = function () {
            this.chairs.forEach(function (chair) {
                chair.draw();
            });
            table = this.drawTable();
            this.objectDrawn();
            return this;
        };

        this.duplicate = function () {
            var json = seatsio.Object.regenerateUuids(this.toJson());
            return subChart.tables.add(S.RoundTable.fromJson(json, subChart));
        };

        this.moved = function (distance) {
            center = center.add(distance);
            this.chairs.forEach(function (chair) {
                chair.moved(distance);
            });
            this.redraw();
        };

        this.rotated = function (rotationCenter, angle) {
            center = center.rotateAround(rotationCenter, angle);
            this.chairs.forEach(function (chair) {
                chair.rotated(rotationCenter, angle);
            });
            this.rotationAngle += angle;
            this.redraw();
        };

        this.setRotationAngle = function(val){
            this.rotationAngle = val;
            redrawIfNeeded(function(){
                repositionChairs();
            })
        };

        this.hasCategory = function () {
    //            if (this.category || subChart.category)
                        if (this.category)
                            return true;
                        return false;
                    };
            
                    this.catId = function () {
                        if (!this.category) {
                            return null;
                        }
                        return this.category.catId;
                    };
                    
                    this.applyCategory = function (category) {
                        if (this.category != category)
                        {
                            this.id = null;
                        }
                        this.category = category;
                    };
            
                    this.removeCategory = function () {
                        this.category = null;
                    };

        function redrawIfNeeded(fn) {
            var wasDrawn = me.drawn();
            if (wasDrawn) {
                me.undraw();
            }
            fn();
            if (wasDrawn) {
                me.draw();
            }
        }

        this.setNumberOfChairs = function (num) {
            redrawIfNeeded(function () {
                me.chairs = me.chairs.splice(0, num);
                while (me.chairs.length < num) {
                    me.chairs.push(new S.Chair(new S.Point(0, 0), me, subChart));
                }
                repositionChairs();
            });
            return me;
        };

        this.setNumberOfOpenSpaces = function (num) {
            this.openSpaces = num;
            repositionChairs();
            return me;
        };

        function repositionChairs() {
            for (var i = 0; i < me.chairs.length; ++i) {
                me.chairs[i].move(computeChairCenter(i));
            }
        }

        this.undraw = function () {
            me.objectUndrawn();
            me.selector.undraw();
            if (table) {
                table.remove();
                table = null;
            }
            this.chairs.forEach(function (chair) {
                chair.undraw();
            });
        };

        this.redraw = function () {
            if (me.drawn()) {
                me.undraw();
                me.draw();
            }
        };

        this.visibleElementsSet = function () {
            return S.set(designer.paper, table, this.chairs.map(function (chair) {
                return chair.raphaelElement();
            }));
        };

        this.hasLabel = function () {
            return this.label != S.LabelingTextInput.emptyLabel;
        };

        this.remove = function () {
            subChart.tables.remove(this);
        };

        this.drawTable = function () {
            return designer.paper.circle(center.x, center.y, tableRadius()).attr({'stroke': '#a8aebc', 'fill': this.determineColor()})
                .toLayer('objectsLayer', designer)
                .applyZoom(designer);
        };

        this.numberOfChairs = function () {
            return this.chairs.length;
        };

        this.numberOfOpenSpaces = function () {
            return this.openSpaces;
        };

        this.getChairs = function () {
            return this.chairs;
        };

        this.labelPosition = function () {
            return this.center();
        };

        this.changeLabel = function (label) {
			if (label != this.label)
			{
				for(let i = 0; i < this.chairs.length; i++)
				{
					this.chairs[i].id = null;
				}
			}     	
            this.label = label;
        };

        function tableRadius() {
            if (me.radius) {
                return me.radius;
            } else {
                var computedRadius = (me.chairs.length * S.Tables.chairWidth * 1.25) / (2 * Math.PI);
                return Math.max(computedRadius, S.RoundTable.defaultRadius);
            }
        }

        this.setRadius = function (val) {
            this.radius = val;
            redrawIfNeeded(function () {
                repositionChairs();
            })
        };

        function computeChairCenter(chairIndex) {
            var rotation = (chairIndex / (me.chairs.length + me.openSpaces) * 360) + me.rotationAngle;
            return center.addToY(tableRadius() + S.Tables.awayFromTableOffset).rotateAround(center, rotation);
        }

        this.numberOfUnlabeledSeats = function () {
            return this.numberOfChairs() - this.numberOfLabeledSeats();
        };

        this.numberOfLabeledSeats = function () {
            return this.chairs.reduce(function (count, chair) {
                if (chair.hasLabel()) {
                    return ++count;
                }
                return count;
            }, 0);
        };
        
        this.numberOfUncategorizedSeats = function () {
            return this.numberOfChairs() - this.numberOfCategorizedSeats();
        };

        this.numberOfCategorizedSeats = function () {
            return this.chairs.reduce(function (count, chair) {
                if (chair.hasCategory()) {
                    return ++count;
                }
                return count;
            }, 0);
        };
        
        this.blur = function () {
            this.chairs.forEach(function (seat) {
                seat.blur();
            });
        };

        this.unblur = function () {
            this.chairs.forEach(function (seat) {
                seat.unblur();
            });
        };

        function chairsToJson() {
            return me.chairs.map(function (chair) {
                return chair.toJson();
            });
        }

        this.getRotation = function () {
            return 0;
        };

        this.toJson = function () {
            return {
                'center': me.center().toJson(designer),
                'radius': tableRadius(),
                'seats': chairsToJson(),
                'rotationAngle': this.rotationAngle,
                'openSpaces': this.openSpaces,
                'label': this.label,
                'type': 'round',
                'objectType': 'table',
                'id': this.id,
                'catId': this.catId(),
                'category': this.category,
                'uuid': this.uuid
            }
        };

    };

    S.RoundTable.prototype = new S.Table();
    S.RoundTable.defaultNumberOfChairs = 6;
    S.RoundTable.defaultRadius = 15;

    S.RoundTable.fromJson = function (tableJson, subChart) {
        var table = new S.RoundTable(S.Point.fromJson(tableJson.center, subChart), tableJson.radius, subChart);
        table.chairs = tableJson.seats.map(function (chair) {
            return S.Chair.fromJson(chair, table, subChart);
        });
        
        if (tableJson.catId) {
            table.applyCategory(subChart.designer.categories.getCategory(tableJson.catId));
            table.catIdOrig = tableJson.catId;
        }
        table.openSpaces = tableJson.openSpaces ? tableJson.openSpaces : 0;
        table.rotationAngle = tableJson.rotationAngle;
        table.label = tableJson.label;
        table.uuid = tableJson.uuid;
        return table;
    };

})(seatsio);

(function (S) {
    S.RectTable = function (center, width, height, layout, subChart) {

        var me = this;
        var designer = subChart.designer;

        me.init(subChart.designer);

        var table;

        me.height = height;
        me.width = width;
        me.chairs = [];
        me.rotationAngle = 0;
        me.layout = layout ? layout : S.RectTable.defaultLayout;
        me.category = null;
        me.id = S.Object.newId();

        this.setLayout = function (layout) {
            me.layout = layout;
            repositionChairs();
        };

        this.getRotation = function () {
            return 0;
        };

        this.setHeight = function (height) {
            me.height = height;
            redrawIfNeeded(function () {
                repositionChairs();
            });
        };

        this.setWidth = function (width) {
            me.width = width;
            redrawIfNeeded(function () {
                repositionChairs();
            });
        };


        this.setRotationAngle = function(val){
            this.rotationAngle = val;
            redrawIfNeeded(function(){
                repositionChairs();
            });
        };

        this.center = function () {
            return center;
        };

        this.drawn = function () {
            return table;
        };

        this.draw = function () {
            this.chairs.forEach(function (chair) {
                chair.draw();
            });
            var topLeft = me.topLeft();
            table = designer.paper.rect(topLeft.x, topLeft.y, me.width, me.height)
                .attr({'stroke': '#a8aebc', 'fill': this.determineColor()})
                .toLayer('objectsLayer', designer)
                .zoomAndRotate(me.rotationAngle, designer);
            this.selector.objectDrawn();
            return this;
        };

        this.duplicate = function () {
            var json = seatsio.Object.regenerateUuids(this.toJson());
            return subChart.tables.add(S.RectTable.fromJson(json, subChart));
        };

        this.moved = function (distance) {
            center = center.add(distance);
            this.chairs.forEach(function (chair) {
                chair.moved(distance);
            });
            this.redraw();
        };

        this.rotated = function (rotationCenter, angle) {
            center = center.rotateAround(rotationCenter, angle);
            this.chairs.forEach(function (chair) {
                chair.rotated(rotationCenter, angle);
            });
            me.rotationAngle += angle;
            this.redraw();
        };

        this.hasCategory = function () {
            //            if (this.category || subChart.category)
            if (this.category)
                return true;
            return false;
        };

        this.catId = function () {
            if (!this.category) {
                return null;
            }
            return this.category.catId;
        };
        
        this.applyCategory = function (category) {
            if (this.category != category)
            {
                this.id = null;
            }
            this.category = category;
        };

        this.removeCategory = function () {
            this.category = null;
        };

        function redrawIfNeeded(fn) {
            var wasDrawn = me.drawn();
            if (wasDrawn) {
                me.undraw();
            }
            fn();
            if (wasDrawn) {
                me.draw();
            }
        }

        this.setNumberOfChairs = function (num) {
            redrawIfNeeded(function () {
                me.chairs = me.chairs.splice(0, num);
                while (me.chairs.length < num) {
                    me.chairs.push(new S.Chair(new S.Point(0, 0), me, subChart));
                }
                repositionChairs();
            });
            return me;
        };

        function repositionChairs() {
            var layout = S.RectTable.tableLayouts[me.layout](me.topLeft(), me.width, me.height, me.chairs.length);
            me.chairs.forEach(function (chair, i) {
                chair.move(layout.calculatePoint(i).rotateAround(center, me.rotationAngle));
            });
        }

        this.undraw = function () {
            me.selector.undraw();
            if (table) {
                table.remove();
                table = null;
            }
            this.chairs.forEach(function (chair) {
                chair.undraw();
            });
        };

        this.redraw = function () {
            if (me.drawn()) {
                me.undraw();
                me.draw();
            }
        };

        this.visibleElementsSet = function () {
            return S.set(designer.paper, table, this.chairs.map(function (chair) {
                return chair.raphaelElement();
            }));
        };

        this.hasLabel = function () {
            return this.label != S.LabelingTextInput.emptyLabel;
        };

        this.remove = function () {
            subChart.tables.remove(this);
        };

        this.topLeft = function () {
            return new S.Point(center.x - me.width / 2, center.y - me.height / 2);
        };

        this.numberOfChairs = function () {
            return this.chairs.length;
        };

        this.getChairs = function () {
            return this.chairs;
        };

        this.labelPosition = function () {
            return this.center();
        };

        this.changeLabel = function (label) {
			if (label != this.label)
			{
				for(let i = 0; i < this.chairs.length; i++)
				{
					this.chairs[i].id = null;
				}
			}
            this.label = label;
        };

        this.numberOfUnlabeledSeats = function () {
            return this.numberOfChairs() - this.numberOfLabeledSeats();
        };

        this.numberOfLabeledSeats = function () {
            return this.chairs.reduce(function (count, chair) {
                if (chair.hasLabel()) {
                    return ++count;
                }
                return count;
            }, 0);
        };
        
        this.numberOfUncategorizedSeats = function () {
            return this.numberOfChairs() - this.numberOfCategorizedSeats();
        };

        this.numberOfCategorizedSeats = function () {
            return this.chairs.reduce(function (count, chair) {
                if (chair.hasCategory()) {
                    return ++count;
                }
                return count;
            }, 0);
        };

        this.blur = function () {
            this.chairs.forEach(function (seat) {
                seat.blur();
            });
        };

        this.unblur = function () {
            this.chairs.forEach(function (seat) {
                seat.unblur();
            });
        };

        function chairsToJson() {
            return me.chairs.map(function (chair) {
                return chair.toJson();
            });
        }

        this.toJson = function () {
            return {
                'center': me.center().toJson(designer),
                'height': me.height,
                'width': me.width,
                'seats': chairsToJson(),
                'rotationAngle': me.rotationAngle,
                'label': me.label,
                'type': 'rectangular',
                'objectType': 'table',
                'layout': me.layout,
                'id': me.id,
                'catId': me.catId(),
                'category': me.category,
                'uuid': me.uuid
            }
        };

    };

    S.RectTable.prototype = new S.Table();
    S.RectTable.defaultNumberOfChairs = 8;
    S.RectTable.defaultHeight = 36;
    S.RectTable.defaultWidth = 120;
    S.RectTable.defaultLayout = "twoSides";

    S.RectTable.tableLayouts = {

        "oneSide": function (topLeft, width, height, numberOfChairs) {
            var part = width / numberOfChairs;
            return {
                calculatePoint: function (chairIndex) {
                    return topLeft
                        .addToX((chairIndex * part) + (part / 2))
                        .addToY(height + (S.Tables.awayFromTableOffset))
                }
            }
        },

        "twoSides": function (topLeft, width, height, numberOfChairs) {
            var halfLength = Math.ceil(numberOfChairs / 2);
            var part = width / halfLength;
            var part2 = width / (numberOfChairs - halfLength);

            return {
                calculatePoint: function (i) {
                    if (i < halfLength) {
                        return topLeft.addToX((i * part) + (part / 2)).addToY(-1 * S.Tables.awayFromTableOffset);
                    } else {
                        return topLeft.addToX(((i - halfLength) * part2) + (part2 / 2)).addToY(height + S.Tables.awayFromTableOffset);
                    }
                }
            }
        },

        "bothHeads": function (topLeft, width, height, numberOfChairs) {

            var halfLength = Math.ceil((numberOfChairs - 2) / 2);
            var part = width / halfLength;
            var part2 = width / (numberOfChairs - 2 - halfLength);

            return {
                calculatePoint: function (i) {
                    if (i == 0) {
                        return topLeft.addToX(-1 * S.Tables.awayFromTableOffset).addToY(height / 2);
                    } else if (i == 1) {
                        return topLeft.addToX(width + S.Tables.awayFromTableOffset).addToY(height / 2);
                    } else {
                        return S.RectTable.tableLayouts.twoSides(topLeft, width, height, numberOfChairs - 2).calculatePoint(i - 2);
                    }
                }
            }
        }
    };

    S.RectTable.fromJson = function (tableJson, subChart) {
        var table = new S.RectTable(S.Point.fromJson(tableJson.center, subChart), tableJson.width, tableJson.height, tableJson.layout, subChart);
        table.chairs = tableJson.seats.map(function (chair) {
            return S.Chair.fromJson(chair, table, subChart);
        });
        
        if (tableJson.catId) {
            table.applyCategory(subChart.designer.categories.getCategory(tableJson.catId));
            table.catIdOrig = tableJson.catId;
        }
        table.rotationAngle = tableJson.rotationAngle;
        table.label = tableJson.label;
        table.uuid = tableJson.uuid;
        return table;
    };

})(seatsio);


(function (S) {
    S.Booths = function () {
        this.booths = [];

        this.draw = function (booth) {
            booth.label = S.Booths.generateLabel();
            booth.draw();
            booth.animate(60);
            return this.add(booth);
        };

        this.add = function (booth) {
            this.booths.push(booth);
            return booth;
        };

        this.remove = function (booth) {
            booth.undraw();
            this.booths.remove(booth);
        };

        this.allElementsSet = function () {
            return this.booths.map(function (booth) {
                return booth.allElementsSet();
            });
        };


        this.toJson = function () {
            return this.booths.map(function (booth) {
                return booth.toJson()
            });
        };

    };

    S.Booths.labelCounter = 1;

    S.Booths.generateLabel = function() {
        return 'B' + S.Booths.labelCounter++;
    };

    S.Booths.fromJson = function (json, subChart) {
        var booths = new S.Booths(subChart);
        if (json) {
            booths.booths = json.map(function (boothJson) {
                return S.Booth.fromJson(boothJson, subChart);
            });
        }
        return booths;

    }

})(seatsio);

(function (S) {
    S.BoothMousePointer = function (designer) {

        var boothShapesSet;
        var startPoint;

        this.showAt = function (point, width, height, f) {
            if (!boothShapesSet) {
                startPoint = point;
                boothShapesSet = f(point, width, height, designer.activeSubChart()).draw().disableSelection().hideLabelAndChildLabels().allElementsSet().startTransformation();
            } else {
                boothShapesSet.transform(startPoint.vectorTo(point, designer).asTranslation());
            }
        };

        this.hide = function () {
            if (boothShapesSet) {
                boothShapesSet.remove();
                boothShapesSet = null;
                startPoint = null;
            }
        };
    }
})(seatsio);

(function (S) {
    S.Booth = function (center, width, height, subChart) {
        var designer = subChart.designer;

        this.init(designer);

        var me = this;
        var booth, line1, line2;

        me.rotationAngle = 0;
        me.width = width;
        me.height = height;
        me.category = null;
        me.label = S.LabelingTextInput.emptyLabel;


        this.center = function () {
            return center;
        };

        this.drawn = function () {
            return booth;
        };

        this.raphaelElement = function () {
            return  booth;
        };

        this.applyCategory = function (category) {
            this.category = category;
        };

        this.removeCategory = function () {
            this.category = null;
        };

        this.determineColor = function () {
            if (me.category) {
                return me.category.color;
            }
            if(subChart.category) {
                return subChart.category.color;
            }
            return S.Booth.defaultColor;
        };

        this.draw = function () {
            var topLeft = center.addToX(-me.width / 2).addToY(-me.height / 2);
            booth = designer.paper.rect(topLeft.x, topLeft.y, me.width, me.height)
                .attr({'stroke': '#383c48', 'fill': me.determineColor()})
                .toLayer('objectsLayer', designer)
                .zoomAndRotate(me.rotationAngle, designer);
            line1 = designer.drawLineThroughRay(new S.Ray(topLeft, topLeft.addToX(me.width).addToY(me.height)))
                .attr({'stroke-width': 2, 'stroke': '#383c48', 'fill': '#383c48', 'stroke-dasharray': '.', 'stroke-opacity': 1})
                .toLayer('objectsLayer', designer)
                .zoomAndRotate(me.rotationAngle, designer);
            line2 = designer.drawLineThroughRay(new S.Ray(topLeft.addToX(me.width), topLeft.addToY(me.height)))
                .attr({'stroke-width': 2, 'stroke': '#383c48', 'fill': '#383c48', 'stroke-dasharray': '.', 'stroke-opacity': 1})
                .toLayer('objectsLayer', designer)
                .zoomAndRotate(me.rotationAngle, designer);
            this.objectDrawn();
            return this;
        };

        this.duplicate = function () {
            var json = seatsio.Object.regenerateUuids(this.toJson());
            return subChart.booths.add(S.Booth.fromJson(json, subChart));
        };

        this.moved = function (distance) {
            center = center.add(distance);
            this.redraw();
        };

        this.rotated = function (rotationCenter, angle) {
            center = center.rotateAround(rotationCenter, angle);
            this.rotationAngle += angle;
            this.redraw();
        };

        this.setRotationAngle = function (val) {
            this.rotationAngle = val;
            this.redraw();
        };

        this.undraw = function () {
            me.objectUndrawn();
            me.selector.undraw();
            if (booth) {
                booth.remove();
                booth = null;
                line1.remove();
                line1 = null;
                line2.remove();
                line2 = null;
            }
        };

        this.redraw = function () {
            if (me.drawn()) {
                me.undraw();
                me.draw();
            }
        };

        this.animate = function (duration) {
            booth.animate({
                fill: '#383c48'
            }, duration / 2, function () {
                booth.animate({fill: this.determineColor()}, duration / 2)
            }.bind(this));
        };

        this.visibleElementsSet = function () {
            return S.set(designer.paper, booth, line1, line2);
        };

        this.remove = function () {
            subChart.booths.remove(this);
        };

        this.blur = function () {
        };

        this.unblur = function () {
        };

        this.getRotation = function () {
            return 0;
        };

        this.labelPosition = function () {
            return this.center();
        };

        this.changeLabel = function (label) {
            this.label = label;
        };

        this.toJson = function () {
            return {
                'label': me.label,
                'center': me.center().toJson(designer),
                'width': me.width,
                'height': me.height,
                'rotationAngle': this.rotationAngle,
                'catId': this.catId(),
                'objectType': 'booth',
                'id': me.id
            }
        };

        this.catId = function () {
            if (!this.category) {
                return null;
            }
            return this.category.catId;
        }

    };

    S.Booth.prototype = new S.Object();
    S.Booth.defaultWidth = 50;
    S.Booth.defaultHeight = 50;
    S.Booth.defaultColor = 'white';

    S.Booth.fromJson = function (json, subChart) {
        var booth = new S.Booth(S.Point.fromJson(json.center, subChart), json.width, json.height, subChart);
        if (json.catId) {
            booth.applyCategory(subChart.designer.categories.getCategory(json.catId));
			booth.catIdOrig = json.catId;
        }
        booth.label = json.label;
        booth.rotationAngle = json.rotationAngle;
        booth.id = json.id;
        return booth;
    };

    S.Booth.create = function (center, width, height, subChart) {
        return new S.Booth(center, width, height, subChart);
    }

})(seatsio);


(function (S) {
    S.Category = function (label, color, catId) {

        this.label = label
        this.color = color;
        this.catId = catId;

    }

})(seatsio);

(function (S) {
    S.Categories = function (designer) {

        var categories = [
        ];

        var categoriesGA = [
        ];

        this.getCategories = function () {
            return categories;
        };

        this.getCategoriesGA = function () {
            return categoriesGA;
        };

        this.setCategories = function (newCategories) {
            categories = newCategories;
        };

        this.setCategoriesGA = function (newCategories) {
            categoriesGA = newCategories;
        };


        this.getCategory = function (catId) {
            let cat = categories.findOne(function (category) {
                return category.catId == catId;
            });

            if (cat == null)
            {
                cat = categoriesGA.findOne(function (category) {
                    return category.catId == catId;
                });
            }

            return cat;
        };

        this.removeCategory = function (category) {
            categories.splice(categories.indexOf(category), 1);
            var objects = this.itemsWithCategory(category);
            objects.forEach(function(object) {
               object.removeCategory();
            });
            this.redrawParents(objects);
        };

        this.itemsWithCategory = function (category) {
            return designer.activeSubChart().categorisableObjects().filter(function (object) {
                return object.category == category;
            });
        };

        this.colorChanged = function (category) {
            this.redrawParents(this.itemsWithCategory(category));
        };

        this.applyCategoryToItems = function (items, category) {
            items.forEach(function (item) {
				if (item.parent instanceof seatsio.Table)
				{
					item.parent.applyCategory(category);
				}
                item.applyCategory(category);
            });
            this.redrawParents(items);
        };

        this.redrawParents = function (items) {
            this.parents(items).forEach(function (parent) {
                parent.redraw();
            });
        };

        this.parents = function (items) {
            return items.map(function (item) {
                if (item.parent) return item.parent;
                else return item;
            }).uniques();
        };

        function getRandomColor() {
            var letters = '0123456789ABCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.round(Math.random() * 15)];
            }
            return color;
        }

//        this.createCategory = function () {
//            var newCategory = new S.Category('New category', getRandomColor(), ++S.Categories.maxCategoryKey);
//            categories.push(newCategory);
//            return newCategory;
//        };

        this.toJson = function () {
            return {
                list: categories,
                listGA: categoriesGA
//                maxCategoryKey: S.Categories.maxCategoryKey
            }
        }

    };

//    S.Categories.maxCategoryKey = 0;

})(seatsio);


seatsio.ShapedObject = function (designer, shape) {
    this.shapeElement = null;
    this.strokeWidth = seatsio.ShapedObject.DEFAULT_STROKEWIDTH;
    this.strokeColor = seatsio.ShapedObject.DEFAULT_STROKECOLOR;
    this.fillColor = seatsio.ShapedObject.DEFAULT_FILLCOLOR;
    this.rotationAngle = 0;
    if (designer) {
        this.doInit(designer, shape, true);
    }
};

seatsio.ShapedObject.prototype = new seatsio.Object();

seatsio.ShapedObject.prototype.center = function() {
    return this.shape.center;
};

seatsio.ShapedObject.prototype.doInit = function (designer, shape, noLabel) {
    this.shape = shape;
    this.init(designer, noLabel, false);
};

seatsio.ShapedObject.prototype.duplicate = function () {
    var json = seatsio.Object.regenerateUuids(this.toJson());
    return this.designer.activeSubChart().shapes.addShape(seatsio.ShapedObject.fromJson(json, this.designer.activeSubChart()));
};

seatsio.ShapedObject.prototype.draw = function () {
    this.shapeElement = this.shape.makeShape()
        .attr({
            "stroke": this.strokeColor,
            "stroke-width": this.strokeWidth,
            'fill': this.determineFillColor()
        })
        .toLayer(this.layer, this.designer)
        .zoomAndRotate(this.rotationAngle, this.designer);
    this.objectDrawn();
    return this;
};

seatsio.ShapedObject.prototype.determineFillColor = function () {
    return this.fillColor;
};

seatsio.ShapedObject.prototype.undraw = function () {
    if (this.shapeElement) {
        this.shapeElement.remove();
    }
    this.objectUndrawn();
};

seatsio.ShapedObject.prototype.createSelectionRectangle = function () {
    return this.shape.makeShape().zoomAndRotate(this.rotationAngle, this.designer);
};

seatsio.ShapedObject.prototype.setStrokeWidth = function (val) {
    this.strokeWidth = val;
    this.redraw();
    return this;
};

seatsio.ShapedObject.prototype.setStrokeColor = function (val) {
    this.strokeColor = val;
    this.redraw();
    return this;
};

seatsio.ShapedObject.prototype.setFillColor = function (val) {
    this.fillColor = val;
    this.redraw();
    return this;
};

seatsio.ShapedObject.prototype.moved = function (distance) {
    this.shape.center = this.shape.center.add(distance);
    this.redraw();
};

seatsio.ShapedObject.prototype.rotated = function (center, angle) {
    this.shape.center = this.shape.center.rotateAround(center, angle);
    this.rotationAngle += angle;
    this.shapeElement.rotationAngle = this.rotationAngle;
    this.redraw();
};

seatsio.ShapedObject.prototype.visibleElementsSet = function () {
    return seatsio.set(this.designer.paper, this.shapeElement);
};

seatsio.ShapedObject.prototype.remove = function () {
    this.designer.activeSubChart().shapes.removeShape(this);
    this.undraw();
};

seatsio.ShapedObject.prototype.highlight = seatsio.Object.highlight;

seatsio.ShapedObject.prototype.unhighlight = seatsio.Object.unhighlight;

seatsio.ShapedObject.prototype.redraw = function () {
    this.undraw();
    this.draw();
};

seatsio.ShapedObject.prototype.toJson = function () {
    var json = {
        'strokeWidth': this.strokeWidth,
        'strokeColor': this.strokeColor,
        'fillColor': this.fillColor,
        'rotationAngle': this.rotationAngle,
        'center': this.shape.center.toJson(this.designer),
        'objectType': 'shapedObject',
        'uuid': this.uuid
    };
    this.shape.extendJson(json);
    return json;
};

seatsio.ShapedObject.fromJson = function (json, subChart) {
    var shapedObject = new seatsio.ShapedObject(subChart.designer, seatsio.ShapeFromJson(json, subChart));
    shapedObject.strokeWidth = json.strokeWidth || seatsio.ShapedObject.DEFAULT_STROKEWIDTH;
    shapedObject.strokeColor = json.strokeColor || "DarkTurquoise"; //seatsio.ShapedObject.DEFAULT_STROKECOLOR;
    shapedObject.fillColor = json.fillColor || seatsio.ShapedObject.DEFAULT_FILLCOLOR;
    shapedObject.rotationAngle = json.rotationAngle || 0;
    shapedObject.uuid = json.uuid;
    return shapedObject;
};

seatsio.ShapeFromJson = function (json, subChart) {
    var type = json.type;
    if (type == "circle") {
        return seatsio.Shapes.Circle.fromJson(json, subChart);
    } else if (type == "rectangle") {
        return seatsio.Shapes.Rectangle.fromJson(json, subChart);
    }
    throw new Error("Unkown shape type: " + json.type);
};

seatsio.ShapedObject.DEFAULT_STROKEWIDTH = 3;
seatsio.ShapedObject.DEFAULT_STROKECOLOR = "#8b93a6";
seatsio.ShapedObject.DEFAULT_FILLCOLOR = "#fff";

(function (S) {
    S.Shapes = function () {

        var shapes = [];

        this.addShape = function (shape) {
            shapes.push(shape);
            return shape;
        };

        this.removeShape = function (shape) {
            shapes.splice(shapes.indexOf(shape), 1);
        };

        this.toJson = function () {
            return shapes.map(function (shape) {
                return shape.toJson();
            });
        };

        this.draw = function () {
            shapes.forEach(function (shape) {
                shape.draw();
            });
        };

        this.undraw = function () {
            shapes.forEach(function (shape) {
                shape.undraw();
            });
        };

        this.allElementsSet = function () {
            return shapes.map(function (shape) {
                return shape.allElementsSet();
            });
        };

        this.shapes = function () {
            return shapes;
        };
    };

    S.Shapes.fromJson = function (json, subChart) {
        var shapes = new S.Shapes(subChart.designer);
        if (json) {
            json.forEach(function (shapeJson) {
                shapes.addShape(seatsio.ShapedObject.fromJson(shapeJson, subChart));
            });
        }
        return shapes;
    }

})(seatsio);


(function (S) {
    S.Shapes.Circle = function (designer, center, radius1, radius2) {

        var me = this;
        me.radius1 = radius1;
        me.radius2 = radius2;
        me.center = center;

        this.makeShape = function () {
            return designer.R.ellipse(me.center.x, me.center.y, me.radius1, me.radius2);
        };

        this.extendJson = function (json) {
            json.type = "circle";
            json.radius1 = me.radius1;
            json.radius2 = me.radius2;
        };

        this.pathString = function () {
            var rx = me.radius1;
            var ry = me.radius2;

            var output = "M" + (me.center.x - rx).toString() + "," + me.center.y.toString();
            output += "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + (2 * rx).toString() + ",0";
            output += "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + (-2 * rx).toString() + ",0";
            return output;
        };
    };

    S.Shapes.Circle.createShape = function(designer, shiftWasPressed, fromPosition, toPosition) {
        var radius1 = Math.abs(toPosition.x - fromPosition.x);
        var radius2 = shiftWasPressed ? radius1 : Math.abs(toPosition.y - fromPosition.y);
        var center = fromPosition;
        return new seatsio.Shapes.Circle(designer, center, Math.max(1, radius1), Math.max(1, radius2));
    };

    S.Shapes.Circle.toolbarItemClass = '.toCircleShapeMode';

    S.Shapes.Circle.fromJson = function (json, subChart) {
        return new S.Shapes.Circle(
            subChart.designer,
            S.Point.fromJson(json.center, subChart),
            json.radius1,
            json.radius2
        );
    };

})(seatsio);


(function (S) {
    S.Shapes.Rectangle = function (designer, center, width, height, cornerRadius) {

        var me = this;
        me.width = width;
        me.height = height;
        me.cornerRadius = cornerRadius || 4;
        me.center = center;

        this.makeShape = function () {
            return designer.R.rect(me.center.x - me.width / 2, me.center.y - me.height / 2, me.width, me.height, me.cornerRadius);
        };

        this.setCornerRadius = function (val) {
            me.cornerRadius = val;
            this.redraw();
            return this;
        };

        this.extendJson = function (json) {
            json.type = "rectangle";
            json.width = me.width;
            json.height = me.height;
            json.cornerRadius = me.cornerRadius;
        };

        this.topLeft = function () {
            return new S.Point(me.center.x - me.width / 2, me.center.y - me.height / 2);
        };

        this.topRight = function () {
            return new S.Point(me.center.x + me.width / 2, me.center.y - me.height / 2);
        };

        me.bottomRight = function () {
            return new S.Point(me.center.x + me.width / 2, me.center.y + me.height / 2);
        };

        me.bottomLeft = function () {
            return new S.Point(me.center.x - me.width / 2, me.center.y + me.height / 2);
        };

        this.pathString = function () {
            var pointsSvg = [me.topLeft(), me.topRight(), me.bottomRight(), me.bottomLeft()].map(function (point) {
                return point.x + "," + point.y;
            }).join(" L");
            return "M" + pointsSvg + " Z";
        };
    };

    S.Shapes.Rectangle.createShape = function (designer, shiftWasPressed, fromPosition, toPosition) {
        var startX = Math.min(fromPosition.x, toPosition.x);
        var startY = Math.min(fromPosition.y, toPosition.y);
        var width = Math.abs(toPosition.x - fromPosition.x);
        var height = shiftWasPressed ? width : Math.abs(toPosition.y - fromPosition.y);
        var center = new seatsio.Point(startX + width / 2, startY + height / 2);
        return new seatsio.Shapes.Rectangle(designer, center, Math.max(1, width), Math.max(1, height));
    };

    S.Shapes.Rectangle.toolbarItemClass = '.toRectShapeMode';

    S.Shapes.Rectangle.fromJson = function (json, subChart) {
        return new S.Shapes.Rectangle(
            subChart.designer,
            S.Point.fromJson(json.center, subChart),
            json.width,
            json.height,
            json.cornerRadius
        );
    };

})(seatsio);


(function (S) {
    S.GeneralAdmissionAreas = function () {

        var areas = [];

        this.add = function (area) {
            areas.push(area);
            return area;
        };

        this.remove = function (area) {
            areas.splice(areas.indexOf(area), 1);
        };

        this.toJson = function () {
            return areas.map(function (area) {
                return area.toJson();
            });
        };

        this.draw = function () {
            areas.forEach(function (area) {
                area.draw();
            });
        };

        this.undraw = function () {
            areas.forEach(function (area) {
                area.undraw();
            });
        };

        this.allElementsSet = function () {
            return areas.map(function (area) {
                return area.allElementsSet();
            });
        };

        this.areas = function () {
            return areas;
        };
    };

    S.GeneralAdmissionAreas.fromJson = function (json, subChart) {
        var areas = new S.GeneralAdmissionAreas(subChart.designer);
        if (json) {
            json.forEach(function (areaJson) {
                areas.add(seatsio.GeneralAdmissionArea.fromJson(areaJson, subChart));
            });
        }
        return areas;
    }

})(seatsio);


seatsio.GeneralAdmissionArea = function (designer, shape) {
	if (shape) 
	{
		this.doInit(designer, shape, true);
	    this.strokeWidth = 1;
	    shape.cornerRadius = 0;
	}
	else
	{
		this.designer = designer;
		this.init(designer, true, false);
		this.points = [];
	    // this.fill = null;
	    // this.labelElement = null;
	    this.closed = false;
	    this.labelSize = seatsio.Section.DEFAULT_LABEL_SIZE;
	    // this.layer = 'sectionsLayer';
	    this.labelRotationAngle = 0;
	    // this.subChart = new seatsio.SectionSubChart(this, designer);
	}
	this.category = null;
    this.capacity = 100;
    this.numBooked = 0;
    this.strokeWidth = 1;
    this.labelElement = null;
    this.label = 'GeneralAdmission';
};

seatsio.GeneralAdmissionArea.prototype = new seatsio.ShapedObject();

seatsio.GeneralAdmissionArea.prototype.add = function (from, to) {
    if (this.points.length == 0) {
        this.points.push(new seatsio.GeneralAdmissionAreaCornerPoint(from, this));
    }
    if (to.equals(this.points[0].point)) {
        this.closed = true;
    } else {
        this.points.push(new seatsio.GeneralAdmissionAreaCornerPoint(to, this));
    }
    this.redraw();
};

seatsio.GeneralAdmissionArea.prototype.determineColor = function () {
    if (this.category) {
        return this.category.color;
    }
    return '#dfdfdf';
};


seatsio.GeneralAdmissionArea.prototype.centroid = function () {
    // http://stackoverflow.com/questions/9692448/how-can-you-find-the-centroid-of-a-concave-irregular-polygon-in-javascript
    var pts = this.points.map(seatsio.SectionCornerPoint.toPoint).slice();
    pts.push(pts[0]);
    var twicearea = 0,
        x = 0, y = 0,
        nPts = pts.length,
        p1, p2, f;
    for (var i = 0, j = nPts - 1; i < nPts; j = i++) {
        p1 = pts[i];
        p2 = pts[j];
        f = p1.x * p2.y - p2.x * p1.y;
        twicearea += f;
        x += ( p1.x + p2.x ) * f;
        y += ( p1.y + p2.y ) * f;
    }
    f = twicearea * 3;
    return new seatsio.Point(x / f, y / f);
};

seatsio.GeneralAdmissionArea.prototype.duplicate = function () {
	let json = seatsio.Object.regenerateUuids(this.toJson());
	if (this.shape)
	{
    	return this.designer.activeSubChart().generalAdmissionAreas.add(seatsio.GeneralAdmissionArea.fromJson(json, this.designer.activeSubChart()));
	}
	
    json = this.toJson();
    json.subChart = cloneJson(this.designer.getCachedJsonSubChartForGeneralAdmissionArea(this));
    seatsio.Object.regenerateUuids(json);
    var duplicatedGeneralAdmissionArea = seatsio.GeneralAdmissionArea.fromJson(json, this.designer.activeSubChart());
    this.designer.setCachedJsonForGeneralAdmissionArea(duplicatedGeneralAdmissionArea, json);
    this.designer.activeSubChart().generalAdmissionAreas.add(duplicatedGeneralAdmissionArea);
    return duplicatedGeneralAdmissionArea;
};

seatsio.GeneralAdmissionArea.prototype.visibleElementsSet = function () {
	if (this.shape) return pushAll(seatsio.ShapedObject.prototype.visibleElementsSet.apply(this), [this.labelElement]);
	else return seatsio.set(this.designer.paper, this.fill, this.labelElement);
};

seatsio.GeneralAdmissionArea.prototype.draw = function () {
    if (this.shape) {
		seatsio.ShapedObject.prototype.draw.apply(this);
	    this.redrawLabel();
	    return this;
    }
    if (this.points.length == 0)
    {
		return;
	}
    var pathString = seatsio.GeneralAdmissionArea.pathString(this.points.map(seatsio.GeneralAdmissionAreaCornerPoint.toPoint), this.closed);
    /* clc-color borde de los poligonos */
    this.fill = this.designer.paper.path(pathString)
        .attr({'stroke': this.closed ? '#8b93a6' : 'DarkTurquoise', 'fill': 'DarkTurquoise', 'stroke-width': 3, 'stroke-linejoin': 'round'})
        .attrIf(this.closed, {'fill': this.determineColor()})
        .toLayer(this.layer, this.designer)
        .applyZoom(this.designer);
    this.redrawLabel();
    this.objectDrawn();
    return this;
};

seatsio.GeneralAdmissionArea.prototype.undraw = function () {
    if (this.labelElement) {
        this.labelElement.remove();
    }
    
    if (this.shape) {
        return seatsio.ShapedObject.prototype.undraw.apply(this);
    }
    
    if (this.fill) {
        this.fill.remove();
    }
    
    this.objectUndrawn();
    return this;
};

seatsio.GeneralAdmissionArea.prototype.labelPosition = function () {
    return this.centroid();
};

seatsio.GeneralAdmissionArea.prototype.determineFillColor = function () {
    if (this.category) {
        return this.category.color;
    }
    if(this.designer.activeSubChart().category) {
        return this.designer.activeSubChart().category.color;
    }
    return this.fillColor;
};

seatsio.GeneralAdmissionArea.prototype.redrawLabel = function () {
    if (this.labelElement) {
        this.labelElement.remove();
    }
    
    if (!this.label) {
        return;
    }
    
    this.labelSize = this.labelSize || '24';
    if (this.shape)
    {
		this.labelElement = this.designer.paper.text(this.shape.center.x, this.shape.center.y, whitespaceToNonBreakingSpaces(this.label))
	        .attr({'font-size': this.labelSize})
	        .toLayer(this.layer, this.designer)
	        .zoomAndRotate(this.labelRotationAngle, this.designer);
	}
    else
    {
	    this.labelElement = this.designer.paper.text(this.labelPosition().x, this.labelPosition().y, whitespaceToNonBreakingSpaces(this.label))
        .attr({'font-size': this.labelSize})
        .toLayer(this.layer, this.designer)
        .zoomAndRotate(this.labelRotationAngle, this.designer);
	}
};

seatsio.GeneralAdmissionArea.prototype.remove = function () {
    this.designer.activeSubChart().generalAdmissionAreas.remove(this);
    this.undraw();
};

seatsio.GeneralAdmissionArea.prototype.raphaelElement = function () {
	if (this.shape)
	{
		return this.shapeElement;
	}
    return this.fill;
};

seatsio.GeneralAdmissionArea.prototype.applyCategory = function (category) {
    this.category = category;
};

seatsio.GeneralAdmissionArea.prototype.setCapacity = function (capacity) {
    this.capacity = capacity;
};

seatsio.GeneralAdmissionArea.prototype.setNumBooked = function (numBooked) {
    this.numBooked = numBooked;
};

seatsio.GeneralAdmissionArea.prototype.removeCategory = function () {
    this.category = null;
};

seatsio.GeneralAdmissionArea.prototype.catId = function () {
    if (!this.category) {
        return null;
    }
    return this.category.catId;
};

seatsio.GeneralAdmissionArea.prototype.getRotation = function () {
    return this.rotationAngle;
};

seatsio.GeneralAdmissionArea.prototype.changeLabel = function (label) {
    if(this.label === label) {
        return;
    }
    this.label = label;
    this.redrawLabel();
};

seatsio.GeneralAdmissionArea.prototype.toJson = function () {
    var json = {
        'rotationAngle': this.rotationAngle,
        'center': this.shape.center.toJson(this.designer),
        'catId': this.catId(),
        'capacity': this.capacity,
        'label': this.label,
        'objectType': 'generalAdmission',
        'id': this.id,
        'numBooked': 0
    };
    this.shape.extendJson(json);
    return json;
};

seatsio.GeneralAdmissionArea.fromJson = function (json, subChart) {
	let area;
	if (json.type)
	{
		area = new seatsio.GeneralAdmissionArea(subChart.designer, seatsio.ShapeFromJson(json, subChart));
	}
	else
	{
		area = new seatsio.GeneralAdmissionArea(subChart.designer);
		area.points = json.points.map(function (point) {
	        return new seatsio.GeneralAdmissionAreaCornerPoint(seatsio.Point.fromJson(point, subChart), area);
	    });
	}
	
	if (json.catId) {
	    area.applyCategory(subChart.designer.categories.getCategory(json.catId));
	    area.catIdOrig = json.catId;
	}
	area.uuid = json.uuid;
	area.capacity = json.capacity;
	area.closed = json.closed;
	area.label = json.label;
	area.labelSize = json.labelSize;
	area.labelRotationAngle = json.labelRotationAngle;
	area.rotationAngle = json.rotationAngle || 0;
    return area;
};


seatsio.GeneralAdmissionAreas.prototype.cornerPointClosestTo = function (point, generalAdmissionAreaToExclude) {
    return this.generalAdmissionAreas
        .filter(function (generalAdmissionArea) {
            return generalAdmissionArea != generalAdmissionAreaToExclude;
        })
        .flatMap(seatsio.GeneralAdmissionArea.toPoints)
        .reduce(function (closestCornerPoint, cornerPoint) {
            if (closestCornerPoint == null) {
                return cornerPoint;
            }
            if (cornerPoint.point.distanceToPoint(point) < 50
                && cornerPoint.point.distanceToPoint(point) < closestCornerPoint.point.distanceToPoint(point)) {
                return cornerPoint;
            }
            return closestCornerPoint;
        }, null);
};

seatsio.GeneralAdmissionArea.prototype.deletePoint = function () {
	this.deselected();
	this.points.pop();
	this.redraw();
	this.selected();
};

seatsio.GeneralAdmissionArea.prototype.createPoint = function () {
	let firstPoint = this.points[this.points.length - 1].point;
	let secondPoint = this.points[0].point;
	let newPoint = calculateMidpoint(secondPoint.x, secondPoint.y, firstPoint.x, firstPoint.y)
	
	this.add(null, newPoint)
	this.redraw();
	this.deselected();
	this.selected();
};

function calculateMidpoint(x1, y1, x2, y2) {
  const x = (x1 + x2) / 2;
  const y = (y1 + y2) / 2;
  return new seatsio.Point(x, y);
}

seatsio.GeneralAdmissionArea.prototype.redraw = function () {
    this.undraw();
    this.draw();
};

seatsio.GeneralAdmissionArea.prototype.determineFillColor = function () {
    if (this.category) {
        return this.category.color;
    }
    if(this.designer.activeSubChart().category) {
        return this.designer.activeSubChart().category.color;
    }
    return this.fillColor;
};

seatsio.GeneralAdmissionArea.prototype.changeLabel = function (label) {
	if(this.label === label) {
        return;
    }
    this.label = label;
    this.redrawLabel();
};

seatsio.GeneralAdmissionArea.prototype.setLabelSize = function (labelSize) {
    this.labelSize = labelSize;
    if (this.labelElement) {
        this.labelElement.attr({'font-size': labelSize});
    }
};

seatsio.GeneralAdmissionArea.prototype.setLabelRotationAngle = function (labelRotationAngle) {
    this.labelRotationAngle = labelRotationAngle;
    if (this.labelElement) {
        this.labelElement.zoomAndRotate(labelRotationAngle, this.designer);
    }
};

seatsio.GeneralAdmissionArea.prototype.selectionElements = function () {
	if (this.shape) return;
    return this.points
        .flatMap(function (point) {
            return point.anchor;
        })
        .nonFalsies();
};

seatsio.GeneralAdmissionArea.prototype.duplicate = function () {
	let json = seatsio.Object.regenerateUuids(this.toJson());
	if (this.shape)
	{
    	return this.designer.activeSubChart().generalAdmissionAreas.add(seatsio.GeneralAdmissionArea.fromJson(json, this.designer.activeSubChart()));
	}
	
    json = this.toJson();
    json.subChart = cloneJson(this.designer.getCachedJsonSubChartForGeneralAdmissionArea(this));
    seatsio.Object.regenerateUuids(json);
    var duplicatedGeneralAdmissionArea = seatsio.GeneralAdmissionArea.fromJson(json, this.designer.activeSubChart());
    this.designer.setCachedJsonForGeneralAdmissionArea(duplicatedGeneralAdmissionArea, json);
    this.designer.activeSubChart().generalAdmissionAreas.add(duplicatedGeneralAdmissionArea);
    return duplicatedGeneralAdmissionArea;
};

seatsio.GeneralAdmissionArea.prototype.getFirstPoint = function () {
    return this.points[0];
};

seatsio.GeneralAdmissionArea.prototype.selected = function () {
	if (this.shape)
	{
		
	}
	else
	{
		this.points.forEach(function (point) {
	        point.makeMovable();
	    });
	}
};

seatsio.GeneralAdmissionArea.prototype.deselected = function () {
	if (this.shape)
	{
		
	}
	else
	{
		this.points.forEach(function (point) {
	        point.makeNotMovable();
	    });	
	}
};

seatsio.GeneralAdmissionArea.prototype.createSelectionRectangle = function () {
	if (this.shape)
	{
		return this.shape.makeShape().zoomAndRotate(this.rotationAngle, this.designer);
	}
    var pathString = seatsio.GeneralAdmissionArea.pathString(this.points.map(seatsio.GeneralAdmissionAreaCornerPoint.toPoint), this.closed);
    return this.designer.paper.path(pathString).applyZoom(this.designer);
};

seatsio.GeneralAdmissionArea.prototype.remove = function () {
    this.designer.activeSubChart().generalAdmissionAreas.remove(this);
    this.undraw();
};

seatsio.GeneralAdmissionArea.prototype.moved = function (distance) {
	if (this.shape) 
	{
		seatsio.ShapedObject.prototype.moved.call(this, distance);
	}
	else
	{
		seatsio.Section.prototype.moved.call(this, distance);
	}
};

seatsio.GeneralAdmissionArea.prototype.rotated = function (rotationCenter, angle) {
	if (this.shape)
	{
		seatsio.ShapedObject.prototype.rotated.call(this, rotationCenter, angle);
	}
	else
	{
		seatsio.Section.prototype.rotated.call(this, rotationCenter, angle);
	}
};

seatsio.GeneralAdmissionArea.prototype.highlight = seatsio.Object.highlight;

seatsio.GeneralAdmissionArea.prototype.unhighlight = seatsio.Object.unhighlight;

seatsio.GeneralAdmissionArea.prototype.toJson = function () {
	let json = {};
	json.catId = this.catId();
	json.capacity = this.capacity;
	json.label = this.label;
	json.objectType = "generalAdmission";
	json.id = this.id;
	json.numBooked = this.numBooked;
	if (this.shape)
	{
		json.rotationAngle = this.rotationAngle;
        json.labelSize = this.labelSize;
		json.labelRotationAngle = this.labelRotationAngle;
		json.center = this.shape.center.toJson(this.designer);
		this.shape.extendJson(json);
	}
	else
	{
		json.points = this.points.map(toJson);
		json.closed = this.closed;
		json.labelSize = this.labelSize;
		json.labelRotationAngle = this.labelRotationAngle;
		json.topLeft = this.bbox().point1().toJson(this.designer);
	}
    return json;
};

seatsio.GeneralAdmissionArea.drawLine = function (from, to, designer) {
    return designer.drawLineBetweenPoints(from, to)
        .attr({'stroke-width': 2, 'stroke': 'DarkTurquoise'})
        .applyZoom(designer);
};

seatsio.GeneralAdmissionArea.toPoints = function (generalAdmissionArea) {
    return generalAdmissionArea.points;
};


seatsio.GeneralAdmissionArea.pathString = function (points, closed) {
    var pathString = "M" + points[0].x + "," + points[0].y;
    for (var i = 1; i < points.length; ++i) {
        pathString += "L" + points[i].x + "," + points[i].y;
    }
    if (closed) {
        pathString += "Z";
    }
    return pathString;
};

seatsio.GeneralAdmissionArea.DEFAULT_LABEL_SIZE = 24;

seatsio.GeneralAdmissionAreaCornerPoint = function (point, generalAdmissionArea) {
    this.point = point;
    this.generalAdmissionArea = generalAdmissionArea;
    this.designer = generalAdmissionArea.designer;
    this.anchor = null;
    this.mover = new seatsio.GeneralAdmissionAreaCornerPointMover(this);
};

seatsio.GeneralAdmissionAreaCornerPoint.prototype.moved = function (distance) {
    this.point = this.point.add(distance);
};

seatsio.GeneralAdmissionAreaCornerPoint.prototype.moveTo = function (point) {
    this.point = point;
    this.anchor
        .attr({'cx': point.x, 'cy': point.y})
        .applyZoomButKeepSize(this.designer);
};

seatsio.GeneralAdmissionAreaCornerPoint.prototype.rotated = function (rotationCenter, angle) {
    this.point = this.point.rotateAround(rotationCenter, angle);
};

seatsio.GeneralAdmissionAreaCornerPoint.prototype.toJson = function () {
    return this.point.toJson(this.designer);
};

seatsio.GeneralAdmissionAreaCornerPoint.prototype.makeMovable = function () {
    this.highlight();
    this.anchor
        .mouseover(function () {
            this.attr({'cursor': 'pointer'})
        })
        .toLayer('transformationHandlesLayer', this.designer)
        .onDrag(this.designer, this.dragged(), this.dragStarted(), this.dragEnded());
};

seatsio.GeneralAdmissionAreaCornerPoint.prototype.makeNotMovable = function () {
    this.unhighlight();
};

seatsio.GeneralAdmissionAreaCornerPoint.prototype.highlight = function () {
    if (!this.anchor) {
        this.anchor = seatsio.GeneralAdmissionAreaCornerPoint.drawCircle(this.point, this.designer);
    }
    return this;
};

seatsio.GeneralAdmissionAreaCornerPoint.prototype.unhighlight = function () {
    if (this.anchor) {
        this.anchor.remove();
        this.anchor = null;
    }
    return this;
};

seatsio.GeneralAdmissionAreaCornerPoint.prototype.dragged = function () {
    var me = this;
    return function (dx, dy, e, x, y) {
        me.designer.getState().onGeneralAdmissionAreaCornerPointDragged(me, x, y, new seatsio.Point.fromEvent(e, me.designer))
    }
};

seatsio.GeneralAdmissionAreaCornerPoint.prototype.dragStarted = function (e) {
    var me = this;
    return function (e) {
        me.designer.getState().onGeneralAdmissionAreaCornerPointDragStarted(me, new seatsio.Point.fromEvent(e, me.designer));
    }
};

seatsio.GeneralAdmissionAreaCornerPoint.prototype.dragEnded = function (totalDrag) {
    var me = this;
    return function (totalDrag) {
        me.designer.getState().onGeneralAdmissionAreaCornerPointDragEnded(me, totalDrag);
    }
};

seatsio.GeneralAdmissionAreaCornerPoint.drawCircle = function (point, designer) {
    return designer.paper.circle(point.x, point.y, 5)
        .attr({'fill': 'DarkTurquoise'})
        .applyZoomButKeepSize(designer);
};

seatsio.GeneralAdmissionAreaCornerPoint.toPoint = function (cornerPoint) {
    return cornerPoint.point;
};

seatsio.GeneralAdmissionAreaCornerPointMover = function(generalAdmissionAreaCornerPoint) {
    this.generalAdmissionAreaCornerPoint = generalAdmissionAreaCornerPoint;
    this.designer = generalAdmissionAreaCornerPoint.designer;
};

seatsio.GeneralAdmissionAreaCornerPointMover.prototype.start = function() {
};

seatsio.GeneralAdmissionAreaCornerPointMover.prototype.move = function(x, y) {
    this.generalAdmissionAreaCornerPoint.moveTo(seatsio.Point.fromView(x, y, this.designer).snapToGrid());
    this.generalAdmissionAreaCornerPoint.generalAdmissionArea.redraw();
};

seatsio.GeneralAdmissionAreaCornerPointMover.prototype.end = function() {
    this.designer.reselect();
};

seatsio.BackgroundGeneralAdmissionArea = function (generalAdmissionArea, designer) {
    this.designer = designer;
    this.generalAdmissionArea = generalAdmissionArea;
    this.element = null;
};

seatsio.BackgroundGeneralAdmissionArea.scaleByFactor = function (factor) {
    return function (point, index, points) {
        var center = seatsio.BackgroundGeneralAdmissionArea.bboxCenter(points);
        return new seatsio.Ray(center, point).enlargeByFactor(factor / 100).end;
    }
};

seatsio.BackgroundGeneralAdmissionArea.moveToViewCenter = function (designer) {
    return function (point, index, points) {
        return point
            .addToX(designer.canvasCenter().x - seatsio.BackgroundGeneralAdmissionArea.bboxCenter(points).x)
            .addToY(designer.canvasCenter().y - seatsio.BackgroundGeneralAdmissionArea.bboxCenter(points).y);
    };
};

seatsio.BackgroundGeneralAdmissionArea.bbox = function (points) {
    var topLeft = seatsio.BackgroundGeneralAdmissionArea.findBboxTopLeft(points);
    var bottomRight = seatsio.BackgroundGeneralAdmissionArea.findBboxBottomRight(points);
    return {
        'topLeft': topLeft,
        'bottomRight': bottomRight,
        'width': bottomRight.x - topLeft.x,
        'height': bottomRight.y - topLeft.y
    };
};

seatsio.BackgroundGeneralAdmissionArea.bboxCenter = function (points) {
    var bbox = seatsio.BackgroundGeneralAdmissionArea.bbox(points);
    return bbox.topLeft.averageWith(bbox.bottomRight);
};

seatsio.BackgroundGeneralAdmissionArea.findBboxTopLeft = function (points) {
    return new seatsio.Point(
        Math.min.apply(null, points.map(seatsio.Point.x)),
        Math.min.apply(null, points.map(seatsio.Point.y))
    );
};

seatsio.BackgroundGeneralAdmissionArea.findBboxBottomRight = function (points) {
    return new seatsio.Point(
        Math.max.apply(null, points.map(seatsio.Point.x)),
        Math.max.apply(null, points.map(seatsio.Point.y))
    );
};

seatsio.BackgroundGeneralAdmissionArea.prototype.draw = function () {
	/* clc-color borde sector a nivel edicion de butacas */
    this.element = this.designer.paper.path(seatsio.GeneralAdmissionArea.pathString(this.scaledPoints(), true))
        .attr({'stroke': '#8b93a6', 'stroke-width': 3, 'stroke-linejoin': 'round', 'fill': "url('" + urlEstaticosPlanos + "img/grid.png')"})
        .toLayer("backgroundLayer", this.designer)
        .applyZoom(this.designer);
};

seatsio.BackgroundGeneralAdmissionArea.prototype.scaledPoints = function () {
    return this.generalAdmissionArea.points
        .map(seatsio.GeneralAdmissionAreaCornerPoint.toPoint)
        .map(seatsio.BackgroundGeneralAdmissionArea.moveToViewCenter(this.designer))
        .map(seatsio.BackgroundGeneralAdmissionArea.scaleByFactor(this.designer.generalAdmissionAreaScaler.scaleFactor));
};

seatsio.BackgroundGeneralAdmissionArea.prototype.redraw = function () {
    this.undraw();
    this.draw();
};

seatsio.BackgroundGeneralAdmissionArea.prototype.undraw = function () {
    if (this.element) {
        this.element.remove();
        this.element = null;
    }
};

seatsio.BackgroundGeneralAdmissionArea.prototype.allElementsSet = function () {
    return seatsio.set(this.designer.paper, this.element);
};

seatsio.BackgroundGeneralAdmissionArea.prototype.applyZoom = function () {
    if (this.element) {
        this.element.applyZoom(this.designer);
    }
};

seatsio.BackgroundGeneralAdmissionArea.prototype.blur = function () {
};

seatsio.BackgroundGeneralAdmissionArea.prototype.unblur = function () {
};

seatsio.BackgroundGeneralAdmissionArea.prototype.showLabelAndChildLabels = function () {
};

seatsio.BackgroundGeneralAdmissionArea.prototype.hideLabelAndChildLabels = function () {
};

seatsio.GeneralAdmissionAreaScaler = function (designer) {
    this.designer = designer;
    this.scaleFactor = 100;
    this.saver = null;
    this.generalAdmissionAreaScaleSlider = this.createGeneralAdmissionAreaScaleSlider();
};

seatsio.GeneralAdmissionAreaScaler.prototype.createGeneralAdmissionAreaScaleSlider = function () {
    return new seatsio.ScaleSlider($('#generalAdmissionAreaScaleSlider_slider'), this.scaleFactor)
        .onValueChanged(function (scaleFactor) {
            this.scaleFactor = scaleFactor;
            if (this.designer.generalAdmissionAreaSubChart) {
                this.designer.generalAdmissionAreaSubChart.generalAdmissionAreaScaleChanged(scaleFactor);
            }
        }.bind(this));
};

seatsio.GeneralAdmissionAreaScaler.prototype.changeScaleFactor = function (scaleFactor) {
    this.scaleFactor = scaleFactor;
    this.generalAdmissionAreaScaleSlider.setValue(scaleFactor);
};

seatsio.GeneralAdmissionAreaDrawingLine = function (designer) {
    this.designer = designer;
    this.line = null;
    this.circle = null;
};

seatsio.GeneralAdmissionAreaDrawingLine.prototype.draw = function (fromPosition, toPosition) {
    this.undraw();
    this.line = seatsio.GeneralAdmissionArea.drawLine(fromPosition, toPosition, this.designer);
    this.drawCircle(toPosition);
};

seatsio.GeneralAdmissionAreaDrawingLine.prototype.drawCircle = function (position) {
    this.circle = seatsio.GeneralAdmissionAreaCornerPoint.drawCircle(position, this.designer);
};

seatsio.GeneralAdmissionAreaDrawingLine.prototype.undraw = function () {
    if (this.circle) {
        this.circle.remove();
        this.circle = null;
    }
    if (this.line) {
        this.line.remove();
        this.line = null;
    }
};

seatsio.Sections = function () {
    this.sections = [];
};

seatsio.Sections.prototype.allElementsSet = function () {
    return this.sections.map(function (section) {
        return section.allElementsSet();
    });
};

seatsio.Sections.prototype.toJson = function () {
    return this.sections.map(function (section) {
        return section.toJson();
    });
};

seatsio.Sections.prototype.add = function (section) {
    this.sections.push(section);
    return section;
};

seatsio.Sections.prototype.remove = function (section) {
    this.sections.remove(section);
    return section;
};

seatsio.Sections.prototype.find = function (uuid) {
    return this.sections.findOne(function(section) {
        return section.uuid == uuid;
    });
};

seatsio.Sections.prototype.cornerPointClosestTo = function (point, sectionToExclude) {
    return this.sections
        .filter(function (section) {
            return section != sectionToExclude;
        })
        .flatMap(seatsio.Section.toPoints)
        .reduce(function (closestCornerPoint, cornerPoint) {
            if (closestCornerPoint == null) {
                return cornerPoint;
            }
            if (cornerPoint.point.distanceToPoint(point) < 50
                && cornerPoint.point.distanceToPoint(point) < closestCornerPoint.point.distanceToPoint(point)) {
                return cornerPoint;
            }
            return closestCornerPoint;
        }, null);
};

seatsio.Sections.fromJson = function (json, subChart) {
    function toSections(sectionsJson) {
        return sectionsJson.map(function (sectionJson) {
            return seatsio.Section.fromJson(sectionJson, subChart, subChart);
        });
    }

    var sections = new seatsio.Sections();
    sections.sections = json ? toSections(json) : [];
    return sections;
};

seatsio.Section = function (designer) {
    this.designer = designer;
    this.points = [];
    this.fill = null;
    this.labelElement = null;
    this.closed = false;
    this.init(designer, true, false);
    this.label = '';
    this.labelSize = seatsio.Section.DEFAULT_LABEL_SIZE;
    this.layer = 'sectionsLayer';
    this.category = null;
    this.labelRotationAngle = 0;
    this.subChart = new seatsio.SectionSubChart(this, designer);
};

seatsio.Section.prototype = new seatsio.Object();

seatsio.Section.prototype.add = function (from, to) {
    if (this.points.length == 0) {
        this.points.push(new seatsio.SectionCornerPoint(from, this));
    }
    if (to.equals(this.points[0].point)) {
        this.closed = true;
    } else {
        this.points.push(new seatsio.SectionCornerPoint(to, this));
    }
    this.redraw();
};

seatsio.Section.prototype.changeLabel = function (label) {
	if(this.label === label) {
        return;
    }
    this.label = label;
    this.redrawLabel();
};

seatsio.Section.prototype.setLabelSize = function (labelSize) {
    this.labelSize = labelSize;
    if (this.labelElement) {
        this.labelElement.attr({'font-size': labelSize});
    }
};

seatsio.Section.prototype.setLabelRotationAngle = function (labelRotationAngle) {
    this.labelRotationAngle = labelRotationAngle;
    if (this.labelElement) {
        this.labelElement.zoomAndRotate(labelRotationAngle, this.designer);
    }
};

seatsio.Section.prototype.raphaelElement = function () {
    return this.fill;
};


seatsio.Section.prototype.deletePoint = function () {
	this.deselected();
	this.points.pop();
	this.redraw();
	this.selected();
};

seatsio.Section.prototype.createPoint = function () {
	let firstPoint = this.points[this.points.length - 1].point;
	let secondPoint = this.points[0].point;
	let newPoint = calculateMidpoint(secondPoint.x, secondPoint.y, firstPoint.x, firstPoint.y)
	
	this.add(null, newPoint)
	this.redraw();
	this.deselected();
	this.selected();
};

seatsio.Section.prototype.applyCategory = function (category) {
    this.category = category;
};

seatsio.Section.prototype.removeCategory = function () {
    this.category = null;
};

seatsio.Section.prototype.catId = function () {
    if (!this.category) {
        return null;
    }
    return this.category.catId;
};

seatsio.Section.prototype.labelPosition = function () {
    return this.centroid();
};

seatsio.Section.prototype.determineColor = function () {
    if (this.category) {
        return this.category.color;
    }
    return '#dfdfdf';
};

seatsio.Section.prototype.centroid = function () {
    // http://stackoverflow.com/questions/9692448/how-can-you-find-the-centroid-of-a-concave-irregular-polygon-in-javascript
    var pts = this.points.map(seatsio.SectionCornerPoint.toPoint).slice();
    pts.push(pts[0]);
    var twicearea = 0,
        x = 0, y = 0,
        nPts = pts.length,
        p1, p2, f;
    for (var i = 0, j = nPts - 1; i < nPts; j = i++) {
        p1 = pts[i];
        p2 = pts[j];
        f = p1.x * p2.y - p2.x * p1.y;
        twicearea += f;
        x += ( p1.x + p2.x ) * f;
        y += ( p1.y + p2.y ) * f;
    }
    f = twicearea * 3;
    return new seatsio.Point(x / f, y / f);
};

seatsio.Section.prototype.getRotation = function () {
    return 0;
};

seatsio.Section.prototype.selectionElements = function () {
    return this.points
        .flatMap(function (point) {
            return point.anchor;
        })
        .nonFalsies();
};

seatsio.Section.prototype.duplicate = function () {
    var json = this.toJson();
    json.subChart = cloneJson(this.designer.getCachedJsonSubChartForSection(this));
    seatsio.Object.regenerateUuids(json);
    var duplicatedSection = seatsio.Section.fromJson(json, this.designer.activeSubChart());
    this.designer.setCachedJsonForSection(duplicatedSection, json);
    this.designer.activeSubChart().sections.add(duplicatedSection);
    return duplicatedSection;
};

seatsio.Section.prototype.getFirstPoint = function () {
    return this.points[0];
};

seatsio.Section.prototype.selected = function () {
    this.points.forEach(function (point) {
        point.makeMovable();
    });
};

seatsio.Section.prototype.deselected = function () {
    this.points.forEach(function (point) {
        point.makeNotMovable();
    });
};

seatsio.Section.prototype.redraw = function () {
    this.undraw();
    this.draw();
};

seatsio.Section.prototype.undraw = function () {
    if (this.fill) {
        this.fill.remove();
    }
    if (this.labelElement) {
        this.labelElement.remove();
    }
    this.objectUndrawn();
    return this;
};

seatsio.Section.prototype.draw = function () {
    if (this.points.length == 0) {
        return;
    }
    var pathString = seatsio.Section.pathString(this.points.map(seatsio.SectionCornerPoint.toPoint), this.closed);
    /* clc-color borde de los poligonos */
    this.fill = this.designer.paper.path(pathString)
        .attr({'stroke': this.closed ? '#8b93a6' : 'DarkTurquoise', 'fill': 'DarkTurquoise', 'stroke-width': 3, 'stroke-linejoin': 'round'})
        .attrIf(this.closed, {'fill': this.determineColor()})
        .toLayer(this.layer, this.designer)
        .applyZoom(this.designer);
    this.redrawLabel();
    this.objectDrawn();
    return this;
};

seatsio.Section.prototype.createSelectionRectangle = function () {
    var pathString = seatsio.Section.pathString(this.points.map(seatsio.SectionCornerPoint.toPoint), this.closed);
    return this.designer.paper.path(pathString).applyZoom(this.designer);
};

seatsio.Section.prototype.redrawLabel = function () {
	
    if (this.labelElement) {
        this.labelElement.remove();
    }
    
    if (!this.label) {
        return;
    }
    
    this.labelElement = this.designer.paper.text(this.labelPosition().x, this.labelPosition().y, whitespaceToNonBreakingSpaces(this.label))
        .attr({'font-size': this.labelSize})
        .toLayer(this.layer, this.designer)
        .zoomAndRotate(this.labelRotationAngle, this.designer);
};

seatsio.Section.prototype.remove = function () {
    this.designer.activeSubChart().sections.remove(this);
    this.undraw();
};

seatsio.Section.prototype.moved = function (distance) {
    this.points.forEach(function (point) {
        point.moved(distance);
    });
    this.redraw();
};

seatsio.Section.prototype.rotated = function (rotationCenter, angle) {
    this.points.forEach(function (point) {
        point.rotated(rotationCenter, angle);
    });
    this.redraw();
};

seatsio.Section.prototype.visibleElementsSet = function () {
    return seatsio.set(this.designer.paper, this.fill, this.labelElement);
};

seatsio.Section.prototype.highlight = seatsio.Object.highlight;

seatsio.Section.prototype.unhighlight = seatsio.Object.unhighlight;

seatsio.Section.prototype.toJson = function () {
    return {
        'points': this.points.map(toJson),
        'closed': this.closed,
        'label': this.label,
        'labelSize': this.labelSize,
        'labelRotationAngle': this.labelRotationAngle,
        'uuid': this.uuid,
        'catId': this.catId(),
        'topLeft': this.bbox().point1().toJson(this.designer)
    };
};

seatsio.Section.drawLine = function (from, to, designer) {
    return designer.drawLineBetweenPoints(from, to)
        .attr({'stroke-width': 2, 'stroke': 'DarkTurquoise'})
        .applyZoom(designer);
};

seatsio.Section.fromJson = function (json, subChart) {
    var section = new seatsio.Section(subChart.designer);
    section.points = json.points.map(function (point) {
        return new seatsio.SectionCornerPoint(seatsio.Point.fromJson(point, subChart), section);
    });
    if (json.catId) {
        section.applyCategory(subChart.designer.categories.getCategory(json.catId));
    }
    section.closed = json.closed;
    section.label = json.label;
    section.labelSize = json.labelSize;
    section.labelRotationAngle = json.labelRotationAngle;
    section.uuid = json.uuid;
    if (json.subChart) {
        section.subChart = seatsio.SectionSubChart.fromJson(section, json.subChart, subChart.designer);
    }
    return section;
};

seatsio.Section.toPoints = function (section) {
    return section.points;
};


seatsio.Section.pathString = function (points, closed) {
    var pathString = "M" + points[0].x + "," + points[0].y;
    for (var i = 1; i < points.length; ++i) {
        pathString += "L" + points[i].x + "," + points[i].y;
    }
    if (closed) {
        pathString += "Z";
    }
    return pathString;
};

seatsio.Section.DEFAULT_LABEL_SIZE = 24;

seatsio.SectionCornerPoint = function (point, section) {
    this.point = point;
    this.section = section;
    this.designer = section.designer;
    this.anchor = null;
    this.mover = new seatsio.SectionCornerPointMover(this);
};

seatsio.SectionCornerPoint.prototype.moved = function (distance) {
    this.point = this.point.add(distance);
};

seatsio.SectionCornerPoint.prototype.moveTo = function (point) {
    this.point = point;
    this.anchor
        .attr({'cx': point.x, 'cy': point.y})
        .applyZoomButKeepSize(this.designer);
};

seatsio.SectionCornerPoint.prototype.rotated = function (rotationCenter, angle) {
    this.point = this.point.rotateAround(rotationCenter, angle);
};

seatsio.SectionCornerPoint.prototype.toJson = function () {
    return this.point.toJson(this.designer);
};

seatsio.SectionCornerPoint.prototype.makeMovable = function () {
    this.highlight();
    this.anchor
        .mouseover(function () {
            this.attr({'cursor': 'pointer'})
        })
        .toLayer('transformationHandlesLayer', this.designer)
        .onDrag(this.designer, this.dragged(), this.dragStarted(), this.dragEnded());
};

seatsio.SectionCornerPoint.prototype.makeNotMovable = function () {
    this.unhighlight();
};

seatsio.SectionCornerPoint.prototype.highlight = function () {
    if (!this.anchor) {
        this.anchor = seatsio.SectionCornerPoint.drawCircle(this.point, this.designer);
    }
    return this;
};

seatsio.SectionCornerPoint.prototype.unhighlight = function () {
    if (this.anchor) {
        this.anchor.remove();
        this.anchor = null;
    }
    return this;
};

seatsio.SectionCornerPoint.prototype.dragged = function () {
    var me = this;
    return function (dx, dy, e, x, y) {
        me.designer.getState().onSectionCornerPointDragged(me, x, y, new seatsio.Point.fromEvent(e, me.designer))
    }
};

seatsio.SectionCornerPoint.prototype.dragStarted = function (e) {
    var me = this;
    return function (e) {
        me.designer.getState().onSectionCornerPointDragStarted(me, new seatsio.Point.fromEvent(e, me.designer));
    }
};

seatsio.SectionCornerPoint.prototype.dragEnded = function (totalDrag) {
    var me = this;
    return function (totalDrag) {
        me.designer.getState().onSectionCornerPointDragEnded(me, totalDrag);
    }
};

seatsio.SectionCornerPoint.drawCircle = function (point, designer) {
    return designer.paper.circle(point.x, point.y, 5)
        .attr({'fill': 'DarkTurquoise'})
        .applyZoomButKeepSize(designer);
};

seatsio.SectionCornerPoint.toPoint = function (cornerPoint) {
    return cornerPoint.point;
};

seatsio.SectionCornerPointMover = function(sectionCornerPoint) {
    this.sectionCornerPoint = sectionCornerPoint;
    this.designer = sectionCornerPoint.designer;
};

seatsio.SectionCornerPointMover.prototype.start = function() {
};

seatsio.SectionCornerPointMover.prototype.move = function(x, y) {
    this.sectionCornerPoint.moveTo(seatsio.Point.fromView(x, y, this.designer).snapToGrid());
    this.sectionCornerPoint.section.redraw();
};

seatsio.SectionCornerPointMover.prototype.end = function() {
    this.designer.reselect();
};

seatsio.BackgroundSection = function (section, designer) {
    this.designer = designer;
    this.section = section;
    this.element = null;
};

seatsio.BackgroundSection.scaleByFactor = function (factor) {
    return function (point, index, points) {
        var center = seatsio.BackgroundSection.bboxCenter(points);
        return new seatsio.Ray(center, point).enlargeByFactor(factor / 100).end;
    }
};

seatsio.BackgroundSection.moveToViewCenter = function (designer) {
    return function (point, index, points) {
        return point
            .addToX(designer.canvasCenter().x - seatsio.BackgroundSection.bboxCenter(points).x)
            .addToY(designer.canvasCenter().y - seatsio.BackgroundSection.bboxCenter(points).y);
    };
};

seatsio.BackgroundSection.bbox = function (points) {
    var topLeft = seatsio.BackgroundSection.findBboxTopLeft(points);
    var bottomRight = seatsio.BackgroundSection.findBboxBottomRight(points);
    return {
        'topLeft': topLeft,
        'bottomRight': bottomRight,
        'width': bottomRight.x - topLeft.x,
        'height': bottomRight.y - topLeft.y
    };
};

seatsio.BackgroundSection.bboxCenter = function (points) {
    var bbox = seatsio.BackgroundSection.bbox(points);
    return bbox.topLeft.averageWith(bbox.bottomRight);
};

seatsio.BackgroundSection.findBboxTopLeft = function (points) {
    return new seatsio.Point(
        Math.min.apply(null, points.map(seatsio.Point.x)),
        Math.min.apply(null, points.map(seatsio.Point.y))
    );
};

seatsio.BackgroundSection.findBboxBottomRight = function (points) {
    return new seatsio.Point(
        Math.max.apply(null, points.map(seatsio.Point.x)),
        Math.max.apply(null, points.map(seatsio.Point.y))
    );
};

seatsio.BackgroundSection.prototype.draw = function () {
	/* clc-color borde sector a nivel edicion de butacas */
    this.element = this.designer.paper.path(seatsio.Section.pathString(this.scaledPoints(), true))
        .attr({'stroke': '#8b93a6', 'stroke-width': 3, 'stroke-linejoin': 'round', 'fill': "url('" + urlEstaticosPlanos + "img/grid.png')"})
        .toLayer("backgroundLayer", this.designer)
        .applyZoom(this.designer);
};

seatsio.BackgroundSection.prototype.scaledPoints = function () {
    return this.section.points
        .map(seatsio.SectionCornerPoint.toPoint)
        .map(seatsio.BackgroundSection.moveToViewCenter(this.designer))
        .map(seatsio.BackgroundSection.scaleByFactor(this.designer.sectionScaler.scaleFactor));
};

seatsio.BackgroundSection.prototype.redraw = function () {
    this.undraw();
    this.draw();
};

seatsio.BackgroundSection.prototype.undraw = function () {
    if (this.element) {
        this.element.remove();
        this.element = null;
    }
};

seatsio.BackgroundSection.prototype.allElementsSet = function () {
    return seatsio.set(this.designer.paper, this.element);
};

seatsio.BackgroundSection.prototype.applyZoom = function () {
    if (this.element) {
        this.element.applyZoom(this.designer);
    }
};

seatsio.BackgroundSection.prototype.blur = function () {
};

seatsio.BackgroundSection.prototype.unblur = function () {
};

seatsio.BackgroundSection.prototype.showLabelAndChildLabels = function () {
};

seatsio.BackgroundSection.prototype.hideLabelAndChildLabels = function () {
};

seatsio.SectionScaler = function (designer) {
    this.designer = designer;
    this.scaleFactor = 100;
    this.saver = null;
    this.sectionScaleSlider = this.createSectionScaleSlider();
};

seatsio.SectionScaler.prototype.createSectionScaleSlider = function () {
    return new seatsio.ScaleSlider($('#sectionScaleSlider_slider'), this.scaleFactor)
        .onValueChanged(function (scaleFactor) {
            this.scaleFactor = scaleFactor;
            if (this.designer.sectionSubChart) {
                this.designer.sectionSubChart.sectionScaleChanged(scaleFactor);
            }
        }.bind(this));
};

seatsio.SectionScaler.prototype.changeScaleFactor = function (scaleFactor) {
    this.scaleFactor = scaleFactor;
    this.sectionScaleSlider.setValue(scaleFactor);
};

seatsio.SectionDrawingLine = function (designer) {
    this.designer = designer;
    this.line = null;
    this.circle = null;
};

seatsio.SectionDrawingLine.prototype.draw = function (fromPosition, toPosition) {
    this.undraw();
    this.line = seatsio.Section.drawLine(fromPosition, toPosition, this.designer);
    this.drawCircle(toPosition);
};

seatsio.SectionDrawingLine.prototype.drawCircle = function (position) {
    this.circle = seatsio.SectionCornerPoint.drawCircle(position, this.designer);
};

seatsio.SectionDrawingLine.prototype.undraw = function () {
    if (this.circle) {
        this.circle.remove();
        this.circle = null;
    }
    if (this.line) {
        this.line.remove();
        this.line = null;
    }
};


(function (S) {
    S.DoNothingState = function () {

        this.name = "?????";

        this.init = function () {
        };

        this.onCanvasMouseDown = function () {
        };

        this.onCanvasRightMouseButtonDown = function () {
        };

        this.onCanvasMouseUp = function () {
        };

        this.onCanvasMouseMove = function () {
        };

        this.onCanvasMouseLeave = function () {
        };

        this.onCanvasClick = function () {
        };

        this.onDelete = function () {
        };

        this.exit = function () {
        };

        this.onDuplicate = function () {
        };

        this.onAlignCenter = function () {
        };

        this.onAlignLeft = function () {
        };

        this.onAlignRight = function () {
        };

        this.onFlip = function (isHorizontal) {
        };

        this.doCurve = function () {
        };

        this.reselect = function () {
        };

        this.onEscapePressed = function () {
        };

        this.categorySelected = function () {
        };

        this.labelAlwaysShownCheckboxChanged = function () {
        };

        this.moveLabelUpClicked = function () {
        };

        this.moveLabelDownClicked = function () {
        };

        this.moveLabelLeftClicked = function () {
        };

        this.moveLabelRightClicked = function () {
        };

        this.onObjectMouseOver = function () {
        };

        this.onObjectClicked = function () {
        };

        this.onObjectMouseOut = function () {
        };

        this.onObjectDragged = function () {
        };

        this.onObjectDragStarted = function () {
        };

        this.onObjectDragEnded = function () {
        };

        this.onSectionCornerPointDragged = function() {
        };

        this.onSectionCornerPointDragStarted = function() {
        };

        this.onSectionCornerPointDragEnded = function() {
        };

        this.onGeneralAdmissionAreaCornerPointDragged = function() {
        };

        this.onGeneralAdmissionAreaCornerPointDragStarted = function() {
        };

        this.onGeneralAdmissionAreaCornerPointDragEnded = function() {
        };

        this.onShiftPressed = function () {
        };

        this.onShiftReleased = function () {
        };

        this.onFocalPointClicked = function() {
        };

        this.toString = function () {
            return this.name;
        };

    }
})(seatsio);

(function (S) {
    S.FocalPointState = function (designer) {

        this.name = "FocalPointState";

        var focalPoint = designer.activeSubChart().focalPoint;

        this.init = function () {
            if (focalPoint.isSet()) {
                focalPoint.draw();
                this.highlightRelativeToPoint(focalPoint.point);
            } else {
                designer.setState(new S.FocalPointNotSetState(designer));
            }
        };

        this.onObjectMouseOver = function (object) {
            if (object instanceof S.FocalPoint) {
                object.hovered();
            }
        };

        this.onObjectMouseOut = function (object) {
            if (object instanceof S.FocalPoint) {
                object.unhighlight();
            }
        };

        this.onObjectDragStarted = function (object) {
            if (object instanceof S.FocalPoint) {
                object.mover.start();
            }
        };

        this.onObjectDragged = function (object, dx, dy) {
            if (object instanceof S.FocalPoint) {
                object.mover.move(dx, dy);
            }
        };

        this.onObjectDragEnded = function (object, totalDrag) {
            if (object instanceof S.FocalPoint) {
                object.mover.end(totalDrag);
                this.highlightRelativeToPoint(focalPoint.point);
            }
        };

        this.onObjectClicked = function (object) {
            if (object instanceof S.FocalPoint) {
                designer.setState(new S.FocalPointSelectedState(designer));
            }
        };

        this.highlightRelativeToPoint = function (point) {
            var minAndMaxDistance = designer.activeSubChart().getMinAndMaxDistance(point);
            designer.activeSubChart().chairs().forEach(function (chair) {
                chair.highlightRelativeToPoint(minAndMaxDistance.min, minAndMaxDistance.max, point);
            });
        };

        this.exit = function () {
            focalPoint.undraw();
            designer.activeSubChart().chairs().forEach(function (chair) {
                chair.unhighlightRelativeToFocalPoint();
            });
        };

    };

    S.FocalPointState.prototype = new S.DoNothingState();
})(seatsio);

(function (S) {
    S.FocalPointNotSetState = function (designer) {

        var subChart = designer.activeSubChart();
        var focalPoint = subChart.focalPoint;

        this.name = "FocalPointNotSetState";

        this.highlightRelativeToPoint = function (point) {
            var minAndMaxDistance = subChart.getMinAndMaxDistance(point);
            subChart.chairs().forEach(function (chair) {
                chair.highlightRelativeToPoint(minAndMaxDistance.min, minAndMaxDistance.max, point);
            });
        };

        this.onCanvasMouseMove = function (e) {
            focalPoint.pointer.showAt(S.Point.fromEvent(e, designer));
        };

        this.onCanvasClick = function (e) {
            this.setFocalPointTo(S.Point.fromEvent(e, designer));
        };

        this.onObjectClicked = function (object, e) {
            this.setFocalPointTo(S.Point.fromEvent(e, designer));
        };

        this.setFocalPointTo = function (point) {
            focalPoint.moveTo(point);
            this.highlightRelativeToPoint(point);
            designer.setState(new S.FocalPointState(designer));
        };

        this.exit = function () {
            focalPoint.undraw();
            subChart.chairs().forEach(function (chair) {
                chair.unhighlightRelativeToFocalPoint();
            });
            focalPoint.pointer.hide();
        };

    };

    S.FocalPointNotSetState.prototype = new S.DoNothingState();
})(seatsio);

(function (S) {
    S.FocalPointSelectedState = function (designer) {

        var selectedObjectsObject;
        var focalPoint = designer.activeSubChart().focalPoint;

        this.init = function () {
            focalPoint.draw();
            var me = this;
            this.highlightRelativeToPoint(focalPoint.point);
            selectedObjectsObject = new S.SelectedObjects([focalPoint], designer)
                .noRotation()
                .withMoveEndListener(function() {
                    me.highlightRelativeToPoint(focalPoint.point);
                })
                .select();
        };

        this.highlightRelativeToPoint = function (point) {
            var minAndMaxDistance = designer.activeSubChart().getMinAndMaxDistance(point);
            designer.activeSubChart().chairs().forEach(function (chair) {
                chair.highlightRelativeToPoint(minAndMaxDistance.min, minAndMaxDistance.max, point);
            });
        };

        this.onCanvasClick = function () {
            designer.setState(new S.FocalPointState(designer));
        };

        this.onDelete = function () {
            selectedObjectsObject.deleteSelectedObjects();
            designer.setState(new S.FocalPointState(designer));
        };

        this.exit = function () {
            focalPoint.undraw();
            designer.activeSubChart().chairs().forEach(function (chair) {
                chair.unhighlightRelativeToFocalPoint();
            });
            selectedObjectsObject.deselect();
            designer.selector.deselectObjects();
        };

    };

    S.FocalPointSelectedState.prototype = new S.DoNothingState();
})(seatsio);

(function (S) {
    S.BackgroundImageModeState = function (designer) {

        var bgImg = designer.activeSubChart().backgroundImage;
        this.name = "BackgroundImageModeState";

        function setInputValue() {
            if(bgImg.getBackgroundImage())
            {
            	var controlerIframe = $(window.parent.document);
            	
            	//show remove image
            	$(controlerIframe).find("#removeBackgroundButton").show();
            	$(controlerIframe).find("#backgroundImageUrl").val(bgImg.backgroundImageUrl);
            	
            	$(controlerIframe).find("#dropboxImageSelected-background img").attr("src",bgImg.backgroundImageUrl);
            }
        }

        this.init = function () {
            setInputValue();
        };

    };

    S.BackgroundImageModeState.prototype = new S.DoNothingState();

})(seatsio);

(function (S) {
    S.RowModeState = function (designer) {

        this.name = "RowModeState";

        this.init = function () {
            designer.enableRowModeButton();
        };

        this.onCanvasRightMouseButtonDown = function () {
            designer.setState(new S.SelectionModeState(designer));
        };

        this.onCanvasMouseMove = function (e) {
            if (designer.isMouseDown()) {
                designer.setState(new S.RowBlockDrawingState(designer.snapPoint(S.Point.fromEvent(e, designer)), designer));
            } else {
                var point = S.Point.fromEvent(e, designer);
                designer.drawHelperLines(point);
                designer.chairMousePointer.show(point);
            }
        };

        this.onCanvasMouseLeave = function (e) {
            designer.chairMousePointer.hide(e);
            designer.undrawHelperLines();
        };

        this.onCanvasClick = function (e) {
            designer.setState(new S.RowDrawingState(designer.snapPoint(S.Point.fromEvent(e, designer)), designer));
        };

        this.exit = function () {
            designer.chairMousePointer.hide();
            designer.undrawHelperLines();
        };

        this.onEscapePressed = function () {
            designer.setState(new S.SelectionModeState(designer));
        };

    };

    S.RowModeState.prototype = new S.DoNothingState();
})(seatsio);

(function (S) {
    S.ObjectsSelectedState = function (designer, selectedObjects) {

        var selectedObjectsObject;
        var me = this;

        this.name = "ObjectsSelectedState";

        this.init = function () {
            designer.chairMousePointer.hide();
            selectedObjectsObject = new S.SelectedObjects(selectedObjects, designer);
            selectedObjectsObject.select();
            designer.numberOfSelectedObjectsMessage.showForObjectsWithSeats(selectedObjects);
        };

        this.onCanvasMouseMove = function (e) {
            if (designer.isMouseDown() && !selectedObjectsObject.transformingSelection()) {
                designer.setState(new S.SelectionModeState(designer));
            }
        };

        this.onCanvasClick = function () {
            designer.setState(new S.SelectionModeState(designer));
        };

        this.onObjectClicked = function (object) {
            function determineSelectedObjects() {
                if (designer.ctrlWasPressed()) {
                    if (selectedObjects.contains(object)) {
                        return selectedObjects.slice(0).remove(object);
                    } else {
                        return selectedObjects.concat([object]);
                    }
                }
                return [object];
            }

            designer.setState(new S.ObjectsSelectedState(designer, determineSelectedObjects()));
        };

        this.onObjectMouseOver = function (object) {
            if (!selectedObjectsObject.contains(object)) {
                object.hovered();
            }
        };

        this.onObjectMouseOut = function (object) {
            if (!selectedObjectsObject.contains(object)) {
                object.unhighlight();
            }
        };

        this.onObjectDragStarted = function (object) {
            object.mover.start();
        };

        this.onObjectDragged = function (object, dx, dy) {
            object.mover.move(dx, dy);
        };

        this.onObjectDragEnded = function (object, totalDrag) {
            object.mover.end(totalDrag);
        };

        this.onDelete = function () {
            selectedObjectsObject.deleteSelectedObjects();
            designer.setState(new S.SelectionModeState(designer));
        };

        this.onDuplicate = function () {
            selectedObjectsObject.duplicate();
        };

        this.onAlignCenter = function () {
            new S.Aligner().alignCenter(selectedObjectsObject);
        };

        this.onAlignLeft = function () {
            new S.Aligner().alignLeft(selectedObjectsObject);
        };

        this.onAlignRight = function () {
            new S.Aligner().alignRight(selectedObjectsObject);
        };

        this.onFlip = function (isHorizontal) {
            new S.Flipper().flip(selectedObjectsObject, isHorizontal);
            selectedObjectsObject.reselect();
        };

        this.reselect = function () {
            selectedObjectsObject.reselect();
        };

        this.doCurve = function (amount) {
            selectedObjectsObject.doCurve(amount);
        };

        function isNotSelected(object) {
            return selectedObjects.indexOf(object) == -1;
        }

        this.onSectionCornerPointDragStarted = function (cornerPoint) {
            cornerPoint.mover.start();
        };

        this.onSectionCornerPointDragged = function (cornerPoint, x, y) {
            cornerPoint.mover.move(x, y);
        };

        this.onSectionCornerPointDragEnded = function (cornerPoint, totalDrag) {
            cornerPoint.mover.end(totalDrag);
        };

        this.onGeneralAdmissionAreaCornerPointDragStarted = function (cornerPoint) {
            cornerPoint.mover.start();
        };

        this.onGeneralAdmissionAreaCornerPointDragged = function (cornerPoint, x, y) {
            cornerPoint.mover.move(x, y);
        };

        this.onGeneralAdmissionAreaCornerPointDragEnded = function (cornerPoint, totalDrag) {
            cornerPoint.mover.end(totalDrag);
        };

        this.exit = function () {
            selectedObjectsObject.deselect();
            designer.selector.deselectObjects();
            designer.numberOfSelectedObjectsMessage.hide();
        };

    };

    S.ObjectsSelectedState.prototype = new S.DoNothingState();
})(seatsio);

(function (S) {
    S.SelectionModeState = function (designer) {

        this.name = "SelectionModeState";

        this.init = function () {
            designer.toolbar.toSelectionSubMode();
        };

        this.onCanvasMouseMove = function (e) {
            var point = S.Point.fromEvent(e, designer);
            if (designer.isMouseDown()) {
                S.Drag.start();
                designer.setState(new S.SelectingState(point, designer));
            }
        };

        this.onObjectMouseOver = function (object) {
            object.hovered();
        };

        this.onObjectMouseOut = function (object) {
            object.unhovered();
            object.unhighlight();
        };

        this.onObjectClicked = function (object) {
            designer.setState(new S.ObjectsSelectedState(designer, [object]));
        };

        this.onObjectDragStarted = function (object) {
            object.mover.start();
        };

        this.onObjectDragged = function (object, dx, dy) {
            object.mover.move(dx, dy);
        };

        this.onObjectDragEnded = function (object, totalDrag) {
            object.mover.end(totalDrag);
        };

        this.onChartBorderMouseOver = function (chartBorder) {
            chartBorder.hovered();
        };

        this.onChartBorderMouseOut = function (chartBorder) {
            chartBorder.unhovered();
        };

        this.exit = function() {
            if(this.closestSectionCornerPoint) {
                this.closestSectionCornerPoint.makeNotMovable();
            }
        };

    };

    S.SelectionModeState.prototype = new S.DoNothingState();
})(seatsio);

(function (S) {
    S.RowDrawingState = function (centerOfFirstChair, designer) {

        var row;

        this.name = "RowDrawingState";

        this.init = function () {
            row = new S.Row(designer.activeSubChart());
            row.addChair(new S.Chair(centerOfFirstChair, row, designer.activeSubChart()));
            row.drawShapes();
            row.numberOfChairsWidget.show();
        };

        this.onCanvasMouseMove = function (e) {
            var point = S.Point.fromEvent(e, designer);
            designer.drawHelperLines(point);
            var pointerSnappedToGrid = designer.snapPoint(S.Point.fromEvent(e, designer));
            row.transformToAroundFirst(pointerSnappedToGrid, designer.helperLines.areClosestRowHelperLinesShown()).drawShapes();
            row.numberOfChairsWidget.show();
        };

        function rowDrawingCompleted() {
            row.duplicate().draw();
            designer.setState(new S.RowModeState(designer));
        }

        this.onCanvasClick = function () {
            rowDrawingCompleted();
        };

        this.onObjectClicked = function () {
            rowDrawingCompleted();
        };

        this.onCanvasRightMouseButtonDown = function () {
            designer.setState(new S.RowModeState(designer));
        };

        this.onEscapePressed = function () {
            designer.setState(new S.RowModeState(designer));
        };

        this.exit = function () {
            row.undraw();
            row.numberOfChairsWidget.hide();
        };

    };

    S.RowDrawingState.prototype = new S.DoNothingState();
})(seatsio);

(function (S) {
    S.RowBlockDrawingState = function (centerOfFirstChair, designer) {

        var rowBlockDrawer = new S.RowBlockDrawer(centerOfFirstChair, designer);

        this.onCanvasMouseMove = function (e) {
            rowBlockDrawer.redrawTo(designer.snapPoint(S.Point.fromEvent(e, designer)));
        };

        this.onEscapePressed = function () {
            designer.ignoreNextCanvasClick();
            designer.setState(new S.RowModeState(designer));
        };

        this.onCanvasRightMouseButtonDown = function () {
            designer.ignoreNextCanvasClick();
            designer.setState(new S.RowModeState(designer));
        };

        this.onCanvasClick = function () {
            var rows = rowBlockDrawer.createRowObjects();
            if (rows.length != 0) {
                rows.forEach(function (row) {
                    designer.activeSubChart().rows.push(row.draw());
                });
                designer.setState(new S.ObjectsSelectedState(designer, rows));
            }
        };

        this.exit = function () {
            rowBlockDrawer.undraw();
        };
    };

    S.RowBlockDrawingState.prototype = new S.DoNothingState();
})(seatsio);

(function(S) {
    S.SelectingState = function(fromPosition, designer) {

        designer.chairMousePointer.hide();
        designer.selector.startSelection(fromPosition);

        this.name = "SelectingState";

        this.onCanvasMouseUp = function () {
            S.Drag.autoStopDrag();
            designer.selector.stopSelecting();
            if (designer.selector.objectsSelected()) {
                designer.setState(new S.ObjectsSelectedState(designer, designer.selector.selectedObjects()));
            } else {
                designer.setState(new S.SelectionModeState(designer));
            }
        };

        this.onCanvasMouseMove = function (e) {
            designer.selector.selectMultipleObjects(S.Point.fromEvent(e, designer));
            designer.numberOfSelectedObjectsMessage.showForObjectsWithSeats(designer.selector.selectedObjects());
        };

        this.exit = function() {
            designer.numberOfSelectedObjectsMessage.hide();
        };

    };

    S.SelectingState.prototype = new S.DoNothingState();
})(seatsio);

(function (S) {
    S.TextModeState = function (designer) {

        this.name = "TextModeState";

        this.init = function () {
            designer.canvas().css('cursor', 'text');
        };

        this.onCanvasClick = function (e) {
            designer.tooltip.isNewText = true;
            var textInput = new S.TextInput(S.Point.fromEvent(e, designer), designer.activeSubChart()).draw();
            designer.activeSubChart().addTextInput(textInput);
            designer.setState(new S.ObjectsSelectedState(designer, [textInput]));
        };

        this.onObjectClicked = function (object, e) {
            var textInput = new S.TextInput(S.Point.fromEvent(e, designer), designer.activeSubChart()).draw();
            designer.activeSubChart().addTextInput(textInput);
            designer.setState(new S.ObjectsSelectedState(designer, [textInput]));
        };

        this.exit = function () {
            designer.canvas().css('cursor', 'default');
        };

        this.onCanvasRightMouseButtonDown = function() {
            designer.setState(new S.SelectionModeState(designer));
        };

        this.onEscapePressed = function() {
            designer.setState(new S.SelectionModeState(designer));
        };

    };

    S.TextModeState.prototype = new S.DoNothingState();
})(seatsio);

(function (S) {
    S.LabelingState = function () {

        this.doInit = function (designer) {
            this.designer = designer;
            $(".labelingButtons").show();
            $('#showLabels').hide();
            this.designer.activeSubChart().blur();
            this.designer.activeSubChart().hideLabels();
        };

        this.doExit = function () {
            $(".labelingButtons").hide();
            $('#showLabels').show();
            this.designer.activeSubChart().unblur();
            if (this.designer.labelsShown()) {
                this.designer.activeSubChart().showLabels();
            }
        };

    };

    S.LabelingState.prototype = new S.DoNothingState();
})(seatsio);

(function(S) {
    S.SeatLabelingState = function(designer) {

        this.name = "SeatLabelingState";

        this.init = function () {
            designer.toolbar.toSeatLabelingMode();
            this.doInit(designer);
            designer.activeSubChart().objectsWithSeats().forEach(function (object) {
                object.getChairs().forEach(function (seat) {
                    seat.labeler.setNotReadOnly().draw();
                });
            });
        };

        this.exit = function () {
            designer.activeSubChart().objectsWithSeats().forEach(function (object) {
                object.getChairs().forEach(function (seat) {
                    seat.labeler.setReadOnly().undraw();
                });
            });
            this.doExit();
            $("#showSeatLabelsButton").removeClass('active');
        };

    }

    S.SeatLabelingState.prototype = new S.LabelingState();
})(seatsio);

(function(S) {
    S.ObjectLabelingState = function(designer) {

        this.name = "ObjectLabelingState";

        this.init = function () {
            designer.toolbar.toObjectLabelingMode();
            this.doInit(designer);
            designer.activeSubChart().nonSeatLabelableObjects().forEach(function (object) {
                object.labeler.setNotReadOnly().draw();
            });
        };

        this.exit = function () {
            designer.activeSubChart().nonSeatLabelableObjects().forEach(function (object) {
                object.labeler.setReadOnly().undraw();
            });
            this.doExit();
            $("#showObjectLabelsButton").removeClass('active');
        };

    };

    S.ObjectLabelingState.prototype = new S.LabelingState();
})(seatsio);

(function (S) {
    S.CategoryState = function (designer) {

        this.name = "CategoryState";

        this.init = function() {
            designer.toolbar.toCategorySelectionMode();
            designer.activeSubChart().objectsWithSeats().forEach(function(object) {
                object.enableSeatSelection();
            });
        };

        this.onCanvasMouseMove = function (e) {
            if (designer.isMouseDown()) {
                designer.setState(new S.SelectingObjectsForCategoryState(S.Point.fromEvent(e, designer), designer));
            }
        };

        this.onObjectClicked = function (object) {
            if(!object.isCategorisable()) {
                return;
            }
            designer.setState(new S.ObjectsSelectedForCategoryState([object], designer));
        };

        this.onObjectMouseOver = function (object) {
            if(!object.isCategorisable()) {
                return;
            }
            object.setCursor('hand');
            object.highlight();
        };

        this.onObjectMouseOut = function (object) {
            if(!object.isCategorisable()) {
                return;
            }
            object.setCursor('default');
            object.unhighlight();
        };

        this.exit = function() {
            designer.activeSubChart().objectsWithSeats().forEach(function(object) {
                object.enableObjectSelection();
            });
        };

    };

    S.CategoryState.prototype = new S.DoNothingState();

})(seatsio);

(function (S) {
    S.ObjectsSelectedForCategoryState = function (selectedObjects, designer) {

        var me = this;
        this.name = "ObjectsSelectedForCategoryState";
        this.tooltip = new S.ChooseCategoryTooltip(selectedObjects, designer);

        var selectionRectangle;

        this.init = function () {
            designer.activeSubChart().objectsWithSeats().forEach(function(object) {
                object.enableSeatSelection();
            });
            designer.numberOfSelectedObjectsMessage.showForSeats(selectedObjects);
            activateCategoryButtonThatMatchesSelection();
            selectedObjects.forEach(function (item) {
                item.highlight();
            });
            drawRectangleAroundSelection();
            me.tooltip.show(selectedItemsBox());
        };

        function activateCategoryButtonThatMatchesSelection() {
            if(allSameCategory()) {
                designer.activateCategoryButtons(selectedObjects[0].category);
            } else {
                designer.deactivateAllCategoryButtons();
            }
        }

        function allSameCategory() {
            if(!selectedObjects[0].category) {
                return false;
            }
            return selectedObjects.every(function(item) {
                return item.category == selectedObjects[0].category;
            });
        }

        function drawRectangleAroundSelection() {
            selectionRectangle = selectedItemsBox().drawPathThroughPoints();
            selectionRectangle.attr({'stroke-dasharray': '- ', 'stroke': 'DarkTurquoise'});
        }

        function selectedItemsBox() {
            var setOfItems = pushAll(designer.paper.set(), selectedItemsRaphaelObjects());
            return S.Bbox.from(setOfItems.getBBox(), designer);
        }

        function selectedItemsRaphaelObjects() {
            return selectedObjects.map(function (item) {
                return item.raphaelElement();
            })
        }

        this.onCanvasMouseMove = function () {
            if (designer.isMouseDown()) {
                designer.setState(new S.CategoryState(designer));
            }
        };

        this.onObjectClicked = function (object) {
            function determineSelectedObjects() {
                if (designer.ctrlWasPressed()) {
                    if (selectedObjects.contains(object)) {
                        return selectedObjects.slice(0).remove(object);
                    } else {
                        return selectedObjects.concat([object]);
                    }
                }
                return [object];
            }

            if(!object.isCategorisable()) {
                return;
            }
            designer.setState(new S.ObjectsSelectedForCategoryState(determineSelectedObjects(), designer));
        };

        this.onCanvasClick = function () {
            designer.setState(new S.CategoryState(designer));
        };

        this.onObjectMouseOver = function (object) {
            if(!object.isCategorisable()) {
                return;
            }
            if (notSelected(object)) {
                object.setCursor('hand');
                object.highlight();
            }
        };

        function notSelected(object) {
            return selectedObjects.indexOf(object) == -1;
        }

        this.onObjectMouseOut = function (object) {
            if(!object.isCategorisable()) {
                return;
            }
            if (notSelected(object)) {
                object.setCursor('default');
                object.unhighlight();
            }
        };

        this.categorySelected = function (category) {
            designer.categories.applyCategoryToItems(selectedObjects, category);
        };

        this.exit = function () {
            designer.activeSubChart().objectsWithSeats().forEach(function(object) {
                object.enableObjectSelection();
            });
            designer.numberOfSelectedObjectsMessage.hide();
            selectedObjects.forEach(function (object) {
                object.unhighlight();
            });
            if (selectionRectangle)
            {
                selectionRectangle.remove();
            }
            me.tooltip.hide();
        };

    };

    S.ObjectsSelectedForCategoryState.prototype = new S.DoNothingState();

})(seatsio);

(function (S) {
    S.SelectingObjectsForCategoryState = function (startpoint, designer) {

        this.name = "SelectingObjectsForCategoryState";

        this.init = function () {
            designer.itemSelector.startSelection(startpoint);
            S.Drag.start();
        };

        this.onCanvasMouseMove = function (e) {
            designer.itemSelector.changeSelectionEndpoint(S.Point.fromEvent(e, designer));
        };

        this.onCanvasMouseUp = function () {
            S.Drag.autoStopDrag();
            if (designer.itemSelector.hasSelectedItems()) {
                designer.setState(new S.ObjectsSelectedForCategoryState(designer.itemSelector.selectedItems, designer));
            } else {
                designer.setState(new S.CategoryState(designer));
            }
        };

        this.onCanvasMouseLeave = function () {
            designer.setState(new S.CategoryState(designer));
        };

        this.exit = function () {
            designer.itemSelector.stopSelecting();
        }

    };

    S.SelectingObjectsForCategoryState.prototype = new S.DoNothingState();

})(seatsio);

(function (S) {
    S.ChooseCategoryTooltip = function (selectedObjects, designer) {

        this.show = function (selectionRectangle) {
            designer.tooltip.html(html()).show(selectionRectangle);
        };

        this.hide = function () {
            designer.tooltip.hide();
        };

        function html() {
			
			let numbered = false;
			let noNumbered = false;
			let generalAdmissionAreas = designer.masterSubChart.generalAdmissionAreas.areas();
			for (let i = 0; i < selectedObjects.length; i++)
			{
				let coincide = false;
				for (let j = 0; j < generalAdmissionAreas.length; j++)
				{
					if (selectedObjects[i] === generalAdmissionAreas[j])
					{
						noNumbered = true;
						coincide = true;
					}
				}
				if (coincide) continue;
				numbered = true;
			}
			
			let div = $('<div id="chartDesignerTooltip">');
			
			if (numbered && noNumbered) {
				div.append('<div style="padding:0.5rem;">' + polyglot.t("seatmap.both_categories") + '</div>')
			} else if (numbered) {
				 let categories = designer.categories.getCategories();
				 if (categories.length > 0) div.append(categories.map(asButton));
				 else div.append('<div style="padding:0.5rem;">' + polyglot.t("seatmap.no_zone") + '</div>')
			} else {
				let categoriesGA = designer.categories.getCategoriesGA();
				 if (categoriesGA.length > 0) div.append(categoriesGA.map(asButton));
				 else div.append('<div style="padding:0.5rem;">' + polyglot.t("seatmap.no_zone") + '</div>')
			}
	
            return div;
/*
                .append($('<div class="categoryButton">')
                    .append($('<span class="fa fa-plus fa-fw fa-2x" style="vertical-align: middle;">'))
                    .append("<span>Add category</span>")
                    .on("click", function () {
                        $(asButton(designer.categories.createCategory())).insertBefore($(this));
                    }));
*/
        }
        var asButton = function (category) {
/*
            var toEditModeButton = $('<a>')
                .append($('<i class="fa fa-pencil">'))
                .on("click", function (e) {
                    e.stopPropagation();
                    toEditMode();
                });
            var deleteCategoryButton = $('<a>')
                .append($('<i class="fa fa-trash-o">'))
                .on("click", function (e) {
                    e.stopPropagation();
                    designer.categories.removeCategory(category);
                    $(this).parent().parent().parent().remove();
                });
            var readOnlyButtons = $('<div style="display: none;" class="editBtns">')
                .append(toEditModeButton)
                .append(deleteCategoryButton);
*/

            var categoryId = $('<span class="categoryKey"></span>').append("&nbsp;(id: " + category.catId + ")");
            var categoryLabel = $('<span class="categoryLabel">').append(category.label);
            var categoryLabelInput = $('<input type="text" name="label">').val(category.label).on("keypress", function (e) {
                if (e.which == 13) {
                    $(this).closest("form").submit();
                }
            });
            var colorPicker = $('<input type="text" name="color" class="colorcolor">');
            var spectrum;
            var submitEditMode = $('<a style="margin-left: 10px;">').append($('<button class="button primary tiny"><i class="palco4icon-check-circle"></i> '+polyglot.t('seatmap.Ok')+'</button>')).on("click", function (e) {
                e.stopPropagation();
                $(this).closest("form").submit();
            });

            function toEditMode() {
                $(".editModeControls").hide();
                $(".readOnlyModeControls").show();
                spectrum = colorPicker.spectrum({
                    color: category.color,
                    showInput: true,
                    showInitial: true,
                    chooseText: "Select"
                });
                editMode.show();
                categoryLabelInput.trigger("focus").select();
                readOnlyMode.hide();
                button.off('click');
            }

            function toReadOnlyMode() {
                readOnlyMode.show();
                editMode.hide();
                button.on('click', selectCategory);
            }

            var colorSquare = $("<div class='colorSquareWrapper'>").append($('<i class="palco4icon-ball_filled">').css('color', category.color));

            var readOnlyMode = $('<span class="readOnlyModeControls">')
//                .append(readOnlyButtons)
                .append(colorSquare)
                .append(categoryLabel)
                .append(categoryId);

            function changeCategoryLabel(label) {
                if(!designer.categories.getCategory(label)) {
                    category.label = label;
                    categoryLabel.html(category.label);
                }
            }

            function changeCategoryColor(color) {
                category.color = color;
                colorSquare.css('color', color);
                colorSquare.find(".fa").css("color", color);
                designer.categories.colorChanged(category);
            }

            var editMode = $('<span class="editModeControls" style="display: none">')
                .append($('<form>')
                    .append(colorPicker)
                    .append(categoryLabelInput)
//                    .append(submitEditMode)
                    .submit(function (e) {
                        e.preventDefault();
                        var formData = {};
                        $.each($(this).serializeArray(), function (index, element) {
                            formData[element.name] = element.value
                        });
                        changeCategoryLabel(formData.label);
                        if (formData.color) {
                            changeCategoryColor(formData.color);
                        }
                        toReadOnlyMode();
                    })
            );

            var button = $('<div class="categoryButton">');

            var selectCategory = function () {
                designer.getState().categorySelected(category);
                designer.setState(new S.CategoryState(designer));
            };

            return button
                .append(readOnlyMode)
                .append(editMode)
                .on("click", selectCategory)
//                .hover(function () {
//                    readOnlyButtons.css('display', 'inline');
//                }, function () {
//                    readOnlyButtons.css('display', 'none');
//                }
//                )
                ;

        };


    }
})(seatsio);

(function (S) {
    S.RoundTableDrawingState = function (designer) {

        this.name = "RoundTableDrawingState";

        this.init = function () {
            designer.toolbar.toDrawRoundTableMode();
        };

        this.onCanvasMouseMove = function (e) {
            designer.tableMousePointer.showAt(S.Point.fromEvent(e, designer), S.Tables.createDefaultRound);
        };

        this.onCanvasMouseLeave = function () {
            designer.tableMousePointer.hide();
        };

        this.onCanvasClick = function (e) {
            designer.activeSubChart().tables.draw(S.Point.fromEvent(e, designer), S.Tables.createDefaultRound);
        };

        this.onCanvasRightMouseButtonDown = function() {
            designer.setState(new S.SelectionModeState(designer));
        };

        this.onEscapePressed = function() {
            designer.setState(new S.SelectionModeState(designer));
        };

        this.exit = function () {
            designer.tableMousePointer.hide();
        };


    };

    S.RoundTableDrawingState.prototype = new S.DoNothingState();
})(seatsio);

(function (S) {
    S.RectTableDrawingState = function (designer) {

        this.name = "RectTableDrawingState";

        this.init = function () {
            designer.toolbar.toDrawRectTableMode();
        };

        this.onCanvasMouseMove = function (e) {
            designer.tableMousePointer.showAt(S.Point.fromEvent(e, designer), S.Tables.createDefaultRect);
        };

        this.onCanvasMouseLeave = function () {
            designer.tableMousePointer.hide();
        };

        this.onObjectClicked = function (object, e) {
            designer.activeSubChart().tables.draw(S.Point.fromEvent(e, designer), S.Tables.createDefaultRect);
        };

        this.onCanvasClick = function (e) {
            designer.activeSubChart().tables.draw(S.Point.fromEvent(e, designer), S.Tables.createDefaultRect);
        };

        this.onCanvasRightMouseButtonDown = function () {
            designer.setState(new S.SelectionModeState(designer));
        };

        this.onEscapePressed = function () {
            designer.setState(new S.SelectionModeState(designer));
        };

        this.exit = function () {
            designer.tableMousePointer.hide();
        };


    };

    S.RectTableDrawingState.prototype = new S.DoNothingState();
})(seatsio);

seatsio.ShapeState = function (designer, shapeCreator) {
    this.designer = designer;
    this.fromPosition = null;
    this.shapeCreator = shapeCreator;
    this.name = "ShapeState";
    this.shape = null;
};

seatsio.ShapeState.prototype = new seatsio.DoNothingState();

seatsio.ShapeState.prototype.init = function () {
    this.designer.canvas().css('cursor', 'crosshair');
    //this.designer.toolbar.activateSubItem(this.menuButton(), this.shapeCreator.toolbarItemClass);
};

seatsio.ShapeState.prototype.menuButton = function () {
    return '#toShapesMode';
};

seatsio.ShapeState.prototype.exit = function () {
    this.designer.canvas().css('cursor', 'default');
};

seatsio.ShapeState.prototype.onCanvasMouseDown = function (e) {
    this.fromPosition = seatsio.Point.fromEvent(e, this.designer);
};

seatsio.ShapeState.prototype.onCanvasMouseUp = function () {
    if (this.shape) {
        this.onShapeCreated();
        this.shape = null;
    }
};

seatsio.ShapeState.prototype.onShapeCreated = function () {
    this.designer.activeSubChart().shapes.addShape(this.shape);
};

seatsio.ShapeState.prototype.onEscapePressed = function () {
    this.cancel();
};

seatsio.ShapeState.prototype.onCanvasRightMouseButtonDown = function () {
    this.cancel();
};

seatsio.ShapeState.prototype.onShiftPressed = function () {
    this.drawShapeIfMouseDown(true);
};

seatsio.ShapeState.prototype.onShiftReleased = function () {
    this.drawShapeIfMouseDown(false);
};

seatsio.ShapeState.prototype.cancel = function () {
    if (this.shape) {
        this.shape.undraw();
        this.shape = null;
    } else {
        this.designer.setState(new seatsio.SelectionModeState(this.designer));
    }
};

seatsio.ShapeState.prototype.onCanvasMouseMove = function (e) {
    this.toPosition = seatsio.Point.fromEvent(e, this.designer);
    this.drawShapeIfMouseDown(this.designer.shiftWasPressed());
};

seatsio.ShapeState.prototype.drawShapeIfMouseDown = function (shiftWasPressed) {
    if (this.designer.isMouseDown()) {
        if (this.shape) {
            this.shape.undraw();
            this.shape = null;
        }
        this.shape = this.createShapedObject(this.shapeCreator.createShape(this.designer, shiftWasPressed, this.fromPosition, this.toPosition)).draw();
    }
};

seatsio.ShapeState.prototype.createShapedObject = function(shape) {
    return new seatsio.ShapedObject(this.designer, shape);
};

seatsio.GeneralAdmissionState = function (designer, shape) {
    this.designer = designer;
    this.snapper = new seatsio.GeneralAdmissionAreaDrawingSnapper(this.designer);
};

seatsio.GeneralAdmissionState.prototype = new seatsio.DoNothingState();

seatsio.GeneralAdmissionState.prototype.init = function () {
};

seatsio.GeneralAdmissionState.prototype.onCanvasMouseDown = function (e) {
    this.designer.setState(new seatsio.GeneralAdmissionAreaDrawingState(this.designer, this.snap(seatsio.Point.fromEvent(e, this.designer))));
};

seatsio.GeneralAdmissionState.prototype.onCanvasMouseMove = function (e) {
    this.designer.shapeDrawingCrosshair.moveTo(this.snap(seatsio.Point.fromEvent(e, this.designer)));   
};

seatsio.GeneralAdmissionState.prototype.onCanvasMouseLeave = function () {
    this.designer.shapeDrawingCrosshair.hide();
};

seatsio.GeneralAdmissionState.prototype.onObjectClicked = function (object, e) {
    this.designer.setState(new seatsio.GeneralAdmissionDrawingState(this.designer, this.snap(seatsio.Point.fromEvent(e, this.designer))));
};

seatsio.GeneralAdmissionState.prototype.onEscapePressed = function () {
    this.cancel();
};

seatsio.GeneralAdmissionState.prototype.onCanvasRightMouseButtonDown = function () {
    this.cancel();
};

seatsio.GeneralAdmissionState.prototype.snap = function (point) {
    return this.snapper.snapFirstPointOfGeneralAdmissionArea(point);
};

seatsio.GeneralAdmissionState.prototype.cancel = function () {
    this.designer.setState(new seatsio.SelectionModeState(this.designer));
};

seatsio.GeneralAdmissionState.prototype.exit = function () {
    this.snapper.unsnap();
    this.designer.shapeDrawingCrosshair.hide();
};


seatsio.GeneralAdmissionStateShape = function (designer, shapeCreator) {
    this.designer = designer;
    this.shapeCreator = shapeCreator;
};

seatsio.GeneralAdmissionStateShape.prototype = new seatsio.ShapeState();

seatsio.GeneralAdmissionStateShape.prototype.createShapedObject = function (shape) {
    return new seatsio.GeneralAdmissionArea(this.designer, shape);
};

seatsio.GeneralAdmissionStateShape.prototype.onShapeCreated = function () {
    this.designer.activeSubChart().generalAdmissionAreas.add(this.shape);
};

(function (S) {
    S.BoothsDrawingState = function (designer, width, height) {

        this.name = "BoothsDrawingState";
        this.width = width * S.Booth.defaultWidth || S.Booth.defaultWidth;
        this.height = height * S.Booth.defaultWidth || S.Booth.defaultHeight;

        this.init = function () {
            designer.toolbar.toDrawBoothMode();
        };

        this.onCanvasMouseMove = function (e) {
            designer.boothMousePointer.showAt(S.Point.fromEventSnapped(e, designer), this.width, this.height, S.Booth.create);
        };

        this.onCanvasMouseLeave = function () {
            designer.boothMousePointer.hide();
        };

        this.onCanvasMouseDown = function (e) {
            var booth = S.Booth.create(S.Point.fromEventSnapped(e, designer), this.width, this.height, designer.activeSubChart());
            designer.activeSubChart().booths.draw(booth);
        };

        this.onCanvasRightMouseButtonDown = function () {
            designer.setState(new S.SelectionModeState(designer));
        };

        this.onEscapePressed = function () {
            designer.setState(new S.SelectionModeState(designer));
        };

        this.exit = function () {
            designer.boothMousePointer.hide();
        };


    };

    S.BoothsDrawingState.prototype = new S.DoNothingState();
})(seatsio);

seatsio.SectionState = function (designer) {
    this.designer = designer;
    this.snapper = new seatsio.SectionDrawingSnapper(this.designer);
};

seatsio.SectionState.prototype = new seatsio.DoNothingState();

seatsio.SectionState.prototype.init = function () {
};

seatsio.SectionState.prototype.onCanvasMouseDown = function (e) {
    this.designer.setState(new seatsio.SectionDrawingState(this.designer, this.snap(seatsio.Point.fromEvent(e, this.designer))));
};

seatsio.SectionState.prototype.onCanvasMouseMove = function (e) {
    this.designer.shapeDrawingCrosshair.moveTo(this.snap(seatsio.Point.fromEvent(e, this.designer)));
};

seatsio.SectionState.prototype.onCanvasMouseLeave = function () {
    this.designer.shapeDrawingCrosshair.hide();
};

seatsio.SectionState.prototype.onObjectClicked = function (object, e) {
    this.designer.setState(new seatsio.SectionDrawingState(this.designer, this.snap(seatsio.Point.fromEvent(e, this.designer))));
};

seatsio.SectionState.prototype.onEscapePressed = function () {
    this.cancel();
};

seatsio.SectionState.prototype.onCanvasRightMouseButtonDown = function () {
    this.cancel();
};

seatsio.SectionState.prototype.snap = function (point) {
    return this.snapper.snapFirstPointOfSection(point);
};

seatsio.SectionState.prototype.cancel = function () {
    this.designer.setState(new seatsio.SelectionModeState(this.designer));
};

seatsio.SectionState.prototype.exit = function () {
    this.snapper.unsnap();
    this.designer.shapeDrawingCrosshair.hide();
};

seatsio.SectionDrawingState = function (designer, fromPosition) {
    this.designer = designer;
    this.fromPosition = fromPosition;
    this.line = new seatsio.SectionDrawingLine(designer);
    this.section = null;
    this.snapper = new seatsio.SectionDrawingSnapper(designer);
};

seatsio.SectionDrawingState.prototype = new seatsio.DoNothingState();

seatsio.SectionDrawingState.prototype.init = function () {
    this.designer.setCursorToNone();
    this.line.drawCircle(this.fromPosition);
};

seatsio.SectionDrawingState.prototype.onCanvasMouseMove = function (e) {
    var toPosition = this.snapper.snap(this.fromPosition, seatsio.Point.fromEvent(e, this.designer), this.section);
    this.line.draw(this.fromPosition, toPosition);
};

seatsio.SectionDrawingState.prototype.onCanvasMouseDown = function (e) {
    this.addPoint(e);
};

seatsio.SectionDrawingState.prototype.onObjectClicked = function (object, e) {
    this.addPoint(e);
};

seatsio.SectionDrawingState.prototype.addPoint = function (e) {
    if (!this.section) {
        this.section = this.designer.activeSubChart().sections.add(new seatsio.Section(this.designer));
    }
    var toPosition = this.snapper.snap(this.fromPosition, seatsio.Point.fromEvent(e, this.designer), this.section);
    this.section.add(this.fromPosition, toPosition);
    this.fromPosition = toPosition;
    if (this.section.closed) {
        this.designer.setState(new seatsio.SectionState(this.designer));
    }
};

seatsio.SectionDrawingState.prototype.onEscapePressed = function () {
    this.cancel();
};

seatsio.SectionDrawingState.prototype.onCanvasRightMouseButtonDown = function () {
    this.cancel();
};

seatsio.SectionDrawingState.prototype.cancel = function () {
    this.designer.setState(new seatsio.SectionState(this.designer));
};

seatsio.SectionDrawingState.prototype.exit = function () {
    if (this.section) {
        if (this.section.closed) {
            this.section.redraw();
        } else {
            this.section.remove();
        }
    }
    this.snapper.unsnap();
    this.line.undraw();
    this.designer.setCursorToDefault();
};

seatsio.SectionDrawingSnapper = function (designer) {
    this.designer = designer;
    this.snappedCornerPoint = null;
};

seatsio.SectionDrawingSnapper.prototype.snap = function (previousPoint, point, section) {
    if (this.closeToFirstPoint(point, section)) {
        return this.snapped(section.getFirstPoint());
    }
    if (!seatsio.ChartDesigner.snapToGridEnabled) {
        return this.snapped(point);
    }
    var closestCornerPoint = this.closeEnoughCornerPoint(point, section);
    if (closestCornerPoint) {
        return this.snapped(closestCornerPoint);
    }
    if (this.designer.shiftWasPressed()) {
        return new seatsio.Ray(previousPoint, point).snapToAngle(45).end;
    }
    return this.snapped(point.snapToGrid());
};

seatsio.SectionDrawingSnapper.prototype.closeEnoughCornerPoint = function (point, section) {
    var closestOtherSectionPoint = this.designer.activeSubChart().sections.cornerPointClosestTo(point, section);
    if (closestOtherSectionPoint && closestOtherSectionPoint.point.distanceToPoint(point) < 10) {
        return closestOtherSectionPoint;
    }
};

seatsio.SectionDrawingSnapper.prototype.snapFirstPointOfSection = function (point) {
    if (!seatsio.ChartDesigner.snapToGridEnabled) {
        return this.snapped(point);
    }
    var closestCornerPoint = this.closeEnoughCornerPoint(point);
    if (closestCornerPoint) {
        return this.snapped(closestCornerPoint);
    }
    return this.snapped(point.snapToGrid());
};

seatsio.SectionDrawingSnapper.prototype.closeToFirstPoint = function (point, section) {
    if (!section) {
        return false;
    }
    var firstPoint = section.getFirstPoint();
    if (!firstPoint) {
        return false;
    }
    return firstPoint.point.distanceToPoint(point) < 10;
};

seatsio.SectionDrawingSnapper.prototype.snapped = function (point) {
    this.unsnap();
    if (point.type == 'Point') {
        return point;
    }
    this.snappedCornerPoint = point.highlight();
    return point.point;
};

seatsio.SectionDrawingSnapper.prototype.unsnap = function () {
    if (this.snappedCornerPoint) {
        this.snappedCornerPoint.unhighlight();
    }
};

seatsio.GeneralAdmissionAreaDrawingSnapper = function (designer) {
    this.designer = designer;
    this.snappedCornerPoint = null;
};

seatsio.GeneralAdmissionAreaDrawingSnapper.prototype.snap = function (previousPoint, point, section) {
    if (this.closeToFirstPoint(point, section)) {
        return this.snapped(section.getFirstPoint());
    }
    if (!seatsio.ChartDesigner.snapToGridEnabled) {
        return this.snapped(point);
    }
    var closestCornerPoint = this.closeEnoughCornerPoint(point, section);
    if (closestCornerPoint) {
        return this.snapped(closestCornerPoint);
    }
    if (this.designer.shiftWasPressed()) {
        return new seatsio.Ray(previousPoint, point).snapToAngle(45).end;
    }
    return this.snapped(point.snapToGrid());
};

seatsio.GeneralAdmissionAreaDrawingSnapper.prototype.closeEnoughCornerPoint = function (point, section) {
    var closestOtherGeneralAdmissionAreaPoint = this.designer.activeSubChart().sections.cornerPointClosestTo(point, section);
    if (closestOtherGeneralAdmissionAreaPoint && closestOtherGeneralAdmissionAreaPoint.point.distanceToPoint(point) < 10) {
        return closestOtherGeneralAdmissionAreaPoint;
    }
};

seatsio.GeneralAdmissionAreaDrawingSnapper.prototype.snapFirstPointOfGeneralAdmissionArea = function (point) {
    if (!seatsio.ChartDesigner.snapToGridEnabled) {
        return this.snapped(point);
    }
    var closestCornerPoint = this.closeEnoughCornerPoint(point);
    if (closestCornerPoint) {
        return this.snapped(closestCornerPoint);
    }
    return this.snapped(point.snapToGrid());
};

seatsio.GeneralAdmissionAreaDrawingSnapper.prototype.closeToFirstPoint = function (point, section) {
    if (!section) {
        return false;
    }
    var firstPoint = section.getFirstPoint();
    if (!firstPoint) {
        return false;
    }
    return firstPoint.point.distanceToPoint(point) < 10;
};

seatsio.GeneralAdmissionAreaDrawingSnapper.prototype.snapped = function (point) {
    this.unsnap();
    if (point.type == 'Point') {
        return point;
    }
    this.snappedCornerPoint = point.highlight();
    return point.point;
};

seatsio.GeneralAdmissionAreaDrawingSnapper.prototype.unsnap = function () {
    if (this.snappedCornerPoint) {
        this.snappedCornerPoint.unhighlight();
    }
};

seatsio.GeneralAdmissionAreaDrawingState = function (designer, fromPosition) {
    this.designer = designer;
    this.fromPosition = fromPosition;
    this.line = new seatsio.GeneralAdmissionAreaDrawingLine(designer);
    this.section = null;
    this.snapper = new seatsio.GeneralAdmissionAreaDrawingSnapper(designer);
};

seatsio.GeneralAdmissionAreaDrawingState.prototype = new seatsio.DoNothingState();

seatsio.GeneralAdmissionAreaDrawingState.prototype.init = function () {
    this.designer.setCursorToNone();
    this.line.drawCircle(this.fromPosition);
};

seatsio.GeneralAdmissionAreaDrawingState.prototype.onCanvasMouseMove = function (e) {
    var toPosition = this.snapper.snap(this.fromPosition, seatsio.Point.fromEvent(e, this.designer), this.section);
    this.line.draw(this.fromPosition, toPosition);
};

seatsio.GeneralAdmissionAreaDrawingState.prototype.onCanvasMouseDown = function (e) {
    this.addPoint(e);
};

seatsio.GeneralAdmissionAreaDrawingState.prototype.onObjectClicked = function (object, e) {
    this.addPoint(e);
};

seatsio.GeneralAdmissionAreaDrawingState.prototype.addPoint = function (e) {
    if (!this.section) {
        this.section = this.designer.activeSubChart().generalAdmissionAreas.add(new seatsio.GeneralAdmissionArea(this.designer));
    }
    var toPosition = this.snapper.snap(this.fromPosition, seatsio.Point.fromEvent(e, this.designer), this.section);
    this.section.add(this.fromPosition, toPosition);
    this.fromPosition = toPosition;
    if (this.section.closed) {
        this.designer.setState(new seatsio.GeneralAdmissionState(this.designer));
    }
};

seatsio.GeneralAdmissionAreaDrawingState.prototype.onEscapePressed = function () {
    this.cancel();
};

seatsio.GeneralAdmissionAreaDrawingState.prototype.onCanvasRightMouseButtonDown = function () {
    this.cancel();
};

seatsio.GeneralAdmissionAreaDrawingState.prototype.cancel = function () {
    this.designer.setState(new seatsio.GeneralAdmissionState(this.designer));
};

seatsio.GeneralAdmissionAreaDrawingState.prototype.exit = function () {
    if (this.section) {
        if (this.section.closed) {
            this.section.redraw();
        } else {
            this.section.remove();
        }
    }
    this.snapper.unsnap();
    this.line.undraw();
    this.designer.setCursorToDefault();
};



if (typeof(seatsio) == 'undefined') {
    (function () {

var seatsio = {};

seatsio.onLoad = function(f)
{
	f();
};

seatsio.charts = [];
seatsio.CHART_ID = 0;

seatsio.getChart = function(chartId)
{
	for (var i = 0; i < this.charts.length; ++i)
	{
		if (this.charts[i].chartId == chartId)
		{
			return this.charts[i];
		}
	}
};

function amdSupport()
{
	return typeof define == 'function' && typeof define.amd == 'object' && define.amd;
}

if (amdSupport())
{
	define([], function()
	{
		return seatsio;
	});
}
else
{
	window.seatsio = seatsio;
}

if (!Array.prototype.indexOf)
{
	Array.prototype.indexOf = function(obj, start)
	{
		for (var i = (start || 0), j = this.length; i < j; i++)
		{
			if (this[i] === obj)
			{
				return i;
			}
		}
		return -1;
	}
}

function Optional(val)
{
	this.val = val;
}

Optional.prototype.orElse = function(val)
{
	if (typeof (this.val) == 'undefined' || this.val == null)
	{
		return val;
	}
	return this.val;
};

function optional(val)
{
	return new Optional(val);
}

function messageReceived(e)
{
	e = e || window.event;
	var data = typeof e.data != "object" ? JSON.parse(e.data) : e.data;
	if(typeof data.chartId != "undefined")
	{		
		var chartOrChartDesigner = seatsio.getChart(data.chartId);
		if (chartOrChartDesigner.messageHandlers[data.type])
		{
			chartOrChartDesigner.messageHandlers[data.type](e, chartOrChartDesigner, data);
		}
	}
}

function keyboardEvent(e)
{
	for (var i = 0; i < seatsio.charts.length; ++i)
	{
		seatsio.charts[i].handleKey(e);
	}
}

seatsio.Embeddable = function()
{
};

seatsio.Embeddable.prototype.init = function(config)
{
	if (!config)
		config = {};
	if (!config.divId)
	{
		config.divId = 'chart';
	}
	if (!config.loading)
	{
		config.loading = '<div class="spinner-loader"></div>';
	}
	this.config = config;
	this.fitToHeight = this.container().offsetHeight;
	this.iframe = null;
};

seatsio.Embeddable.prototype.createIframe = function(src)
{
	this.iframe = document.createElement('iframe');
	this.iframe.style.border = 'none';
	this.iframe.scrolling = 'no';
	this.iframe.frameBorder = 0;
	this.iframe.src = src;
	this.iframe.style.width = '100%';
	if (this.fitToHeight)
	{
		this.iframe.style.height = this.fitToHeight + 'px';
	}
	this.container().appendChild(this.iframe);
};

seatsio.Embeddable.prototype.container = function()
{
	return document.getElementById(this.config.divId);
};

seatsio.Embeddable.prototype.createLoadingDiv = function()
{
	this.createSpinnerStylesheet();
	this.loadingDiv = document.createElement('div');
	this.loadingDiv.style.textAlign = 'center';
	this.loadingDiv.style.padding = '20px 0';
	this.loadingDiv.innerHTML = this.config.loading;
	this.container().appendChild(this.loadingDiv);
};

seatsio.Embeddable.prototype.createSpinnerStylesheet = function()
{
	var link = document.createElement("link");
	link.href = urlEstaticosPlanos + "css/spinner.css";
	link.type = "text/css";
	link.rel = "stylesheet";
	document.getElementsByTagName("head")[0].appendChild(link);
};

seatsio.Embeddable.prototype.sendMsgToIframe = function(msg)
{
	msg.chartId = this.chartId;
	this.iframe.contentWindow.postMessage(JSON.stringify(msg), "*");
};

var KEYS = {
	SHIFT : 16
};

seatsio.Embeddable.prototype.handleKey = function(e)
{
	if (e.keyCode === KEYS.SHIFT)
	{
		this.sendMsgToIframe({
		    'type' : e.type,
		    'keyCode' : e.keyCode
		});
	}
};

seatsio.SeatingChart = function(config)
{
	seatsio.charts.push(this);
	this.chartId = seatsio.CHART_ID++;
	this.init(config);
	this.selectedObjectsInput = null;
	this.config.maxSelectedObjects = optional(this.config.maxSelectedObjects).orElse(this.config.maxSelectedSeats);
	this.config.objectColor = optional(this.config.objectColor).orElse(this.config.seatColor);
	this.config.selectedObjectsInputName = optional(this.config.selectedObjectsInputName).orElse(this.config.selectedSeatsInputName);
	this.config.selectedObjects = optional(this.config.selectedObjects).orElse(this.config.selectedSeats);
	this.config.onObjectSelected = optional(this.config.onObjectSelected).orElse(this.config.onSeatSelected);
	this.config.onObjectDeselected = optional(this.config.onObjectDeselected).orElse(this.config.onSeatDeselected);
	this.config.onObjectMouseOver = optional(this.config.onObjectMouseOver).orElse(this.config.onSeatMouseOver);
	this.config.onObjectMouseOut = optional(this.config.onObjectMouseOut).orElse(this.config.onSeatMouseOut);
	this.config.onSelectedObjectBooked = optional(this.config.onSelectedObjectBooked).orElse(this.config.onSelectedSeatBooked);
	this.selectedObjects = this.selectedSeats = [];
	this.reservationToken = null;
	this.isRendered = false;
};

seatsio.SeatingChart.prototype.createIframe = function()
{
	this.iframe = document.createElement('iframe');
	this.iframe.style.border = 'none';
	this.iframe.scrolling = 'no';
	this.iframe.frameBorder = 0;

	var url = urlBase + 'chartRenderer?chartId=' + this.chartId;
	if (this.config.idPlano != null)
		url += "&idPlano=" + this.config.idPlano;
	if (this.config.idSala != null)
		url += "&idSala=" + this.config.idSala;
	if (this.config.idSesion != null)
		url += "&idSesion=" + this.config.idSesion;
	if (this.config.idCanal != null)
		url += "&idCanal=" + this.config.idCanal;
	if (this.config.idGrupoZonas != null)
		url += "&idGrupoZonas=" + this.config.idGrupoZonas;
	if (this.config.idZona != null)
		url += "&idZona=" + this.config.idZona;
	url += "&tstamp=" + new Date().getTime();

	this.iframe.src = url;
	this.iframe.style.width = '100%';
	this.container().appendChild(this.iframe);
};

seatsio.SeatingChart.prototype = new seatsio.Embeddable();

seatsio.SeatingChart.prototype.createSelectedObjectsInput = function()
{
	if (!this.config.selectedObjectsInputName)
	{
		return;
	}
	this.selectedObjectsInput = document.createElement('input');
	this.selectedObjectsInput.type = 'hidden';
	this.selectedObjectsInput.name = this.config.selectedObjectsInputName;
	this.container().appendChild(this.selectedObjectsInput);
};

seatsio.SeatingChart.prototype.createReservationTokenInput = function()
{
	if (!this.config.reservationTokenInputName)
	{
		return;
	}
	this.reservationTokenInput = document.createElement('input');
	this.reservationTokenInput.type = 'hidden';
	this.reservationTokenInput.name = this.config.reservationTokenInputName;
	this.container().appendChild(this.reservationTokenInput);
};

seatsio.SeatingChart.prototype.updateSelectedObjectsInputValue = function()
{
	if (this.selectedObjectsInput)
	{
		this.selectedObjectsInput.value = this.selectedObjects;
	}
};

seatsio.SeatingChart.prototype.objectSelected = function(object)
{
	this.selectedObjects.push(this.uuidOrLabel(object));
	this.updateSelectedObjectsInputValue();
};

seatsio.SeatingChart.prototype.setReservationToken = function(reservationToken)
{
	this.reservationToken = reservationToken;
	if (this.reservationTokenInput)
	{
		this.reservationTokenInput.value = reservationToken;
	}
};

seatsio.SeatingChart.prototype.uuidOrLabel = function(object)
{
	if (this.config.useObjectUuidsInsteadOfLabels)
	{
		return object.uuid;
	}
	return object.label;
};

seatsio.SeatingChart.prototype.objectDeselected = function(object)
{
	for (var i = 0; i < this.selectedObjects.length; ++i)
	{
		if (this.uuidOrLabel(object) == this.selectedObjects[i])
		{
			this.selectedObjects.splice(i, 1);
			break;
		}
	}
	this.updateSelectedObjectsInputValue();
};

seatsio.SeatingChart.prototype.render = function()
{
	this.createLoadingDiv();

	var url = urlBase + 'chartRenderer?chartId=' + this.chartId;
	if (this.config.idPlano != null)
		url += "&idPlano=" + this.config.idPlano;
	if (this.config.idSala != null)
		url += "&idSala=" + this.config.idSala;
	if (this.config.idSesion != null)
		url += "&idSesion=" + this.config.idSesion;
	if (this.config.idCanal != null)
		url += "&idCanal=" + this.config.idCanal;
	if (this.config.idGrupoZonas != null)
		url += "&idGrupoZonas=" + this.config.idGrupoZonas;
	if (this.config.idZona != null)
		url += "&idZona=" + this.config.idZona;
	url += "&tstamp=" + new Date().getTime();

	this.createIframe(url);
	this.createSelectedObjectsInput();
	this.createReservationTokenInput();
	return this;
};

seatsio.SeatingChart.prototype.selectBestAvailable = function(bestAvailableConfig)
{
	this.sendMsgToIframe({
	    'type' : 'selectBestAvailable',
	    'bestAvailableConfig' : bestAvailableConfig
	});
};

seatsio.SeatingChart.prototype.clearSelection = function()
{
	this.sendMsgToIframe({
		'type' : 'clearSelection'
	});
};

seatsio.SeatingChart.prototype.selectObjects = seatsio.SeatingChart.prototype.selectSeats = function(objectUuidsOrLabels)
{
	this.sendMsgToIframe({
	    'type' : 'selectObjects',
	    'objectUuidsOrLabels' : objectUuidsOrLabels
	});
};

seatsio.SeatingChart.prototype.deselectObjects = seatsio.SeatingChart.prototype.deselectSeats = function(objectUuidsOrLabels)
{
	this.sendMsgToIframe({
	    'type' : 'deselectObjects',
	    'objectUuidsOrLabels' : objectUuidsOrLabels
	});
};

seatsio.SeatingChart.prototype.decreaseSelection = function(objectUuidsOrLabels)
{
	this.sendMsgToIframe({
	    'type' : 'decreaseSelection',
	    'objectUuidsOrLabels' : objectUuidsOrLabels
	});
};

seatsio.SeatingChart.prototype.selectCategories = function(categoryIds)
{
	this.sendMsgToIframe({
	    'type' : 'selectCategories',
	    'ids' : categoryIds
	});
};

seatsio.SeatingChart.prototype.setUnavailableCategories = function(categoryIds)
{
	this.sendMsgToIframe({
	    'type' : 'setUnavailableCategories',
	    'ids' : categoryIds
	});
};

seatsio.SeatingChart.serializeConfig = function(config)
{
	if (config.tooltipText)
	{
		config.customTooltipText = true;
	}
	if (config.onBestAvailableSeatsSelected)
	{
		config.onBestAvailableSeatsSelectedCallbackImplemented = true;
	}
	if (config.onBestAvailableSeatsSelectionFailed)
	{
		config.onBestAvailableSeatsSelectionFailedCallbackImplemented = true;
	}
	if (config.objectColor)
	{
		config.objectColor = config.objectColor.toString();
	}
	if (config.isObjectSelectable)
	{
		config.isObjectSelectable = config.isObjectSelectable.toString();
	}
	if (config.isObjectVisible)
	{
		config.isObjectVisible = config.isObjectVisible.toString();
	}
	if (config.objectCategory)
	{
		config.objectCategory = config.objectCategory.toString();
	}
	return config;
};

seatsio.SeatingChart.enrichObjectDomain = function(chart, object)
{
	object.select = function()
	{
		chart.selectObjects([
			chart.uuidOrLabel(object)
		]);
	};
	object.deselect = function()
	{
		chart.deselectObjects([
			chart.uuidOrLabel(object)
		]);
	};
	object.seatId = object.id;
	object.chart = chart;
	return object;
};

seatsio.SeatingChart.prototype.rendered = function(height)
{
	this.iframe.height = height + 'px';
	if (this.config.onChartRendered)
	{
		this.config.onChartRendered(this);
	}
	this.loadingDiv.style.display = 'none';
	if (typeof window.callPhantom === 'function')
	{
		window.callPhantom("chartRendered");
	}
	this.isRendered = true;
};

seatsio.SeatingChart.prototype.messageHandlers = {
    'seatsioLoaded' : function(e, chart, data)
    {
	    chart.sendMsgToIframe({
	        'type' : 'render',
	        'fitToHeight' : chart.fitToHeight,
	        'configuration' : seatsio.SeatingChart.serializeConfig(chart.config)
	    });
    },
    'onChartRendered' : function(e, chart, data)
    {
	    chart.rendered(data.height);
    },
    'bookableObjectEvent' : function(e, chart, data)
    {
	    seatsio.SeatingChart.enrichObjectDomain(chart, data.object);
	    if (data.subtype == 'onObjectSelected')
	    {
		    chart.objectSelected(data.object, data.priceLevel);
	    }
	    else if (data.subtype == 'onObjectDeselected')
	    {
		    chart.objectDeselected(data.object, data.priceLevel);
	    }
	    if (chart.config[data.subtype])
	    {
		    chart.config[data.subtype](data.object, data.priceLevel);
	    }
    },
    'heightChanged' : function(e, chart, data)
    {
	    chart.iframe.height = data.height + 'px';
    },
    'dragStarted' : function(e, chart)
    {
	    chart.smoothener = new seatsio.iOSScrollSmoothener();
    },
    'dragScrollOutOfBounds' : function(e, chart, data)
    {
	    window.scrollBy(0, chart.smoothener.smoothen(data.amount));
    },
    'reservationTokenChanged' : function(e, chart, data)
    {
	    chart.setReservationToken(data.token);
    },
    'tooltipTextRequested' : function(e, chart, data)
    {
	    seatsio.SeatingChart.enrichObjectDomain(chart, data.object);
	    chart.sendMsgToIframe({
	        'type' : 'tooltipTextGenerated',
	        'text' : chart.config.tooltipText(data.object)
	    });
    },
    'onBestAvailableSeatsSelected' : function(e, chart, data)
    {
	    if (chart.config.onBestAvailableSeatsSelected)
	    {
		    chart.config.onBestAvailableSeatsSelected(data.seats.map(function(seatJson)
		    {
			    return seatsio.SeatingChart.enrichObjectDomain(chart, seatJson);
		    }));
	    }
    },
    'onBestAvailableSeatsSelectionFailed' : function(e, chart, data)
    {
	    if (chart.config.onBestAvailableSeatsSelectionFailed)
	    {
		    chart.config.onBestAvailableSeatsSelectionFailed();
	    }
    }
};




seatsio.iOSScrollSmoothener = function()
{
	this.previousScrollAmount = 0;
};

seatsio.iOSScrollSmoothener.prototype.smoothen = function(scrollAmount)
{
	if (seatsio.iOSScrollSmoothener.differentSigns(scrollAmount, this.previousScrollAmount))
	{
		this.previousScrollAmount = scrollAmount;
		return 0; // prevent stuttering when scrolling out of bounds
					// on iOS
	}
	this.previousScrollAmount = scrollAmount;
	return scrollAmount;
};

seatsio.iOSScrollSmoothener.differentSigns = function(value1, value2)
{
	return value1 < 0 && value2 > 0 || value1 > 0 && value2 < 0;
};




seatsio.SeatingChartDesigner = function(config)
{
	seatsio.charts.push(this);
	this.chartId = seatsio.CHART_ID++;
	this.init(config);
	this.isRendered = false;
};

seatsio.SeatingChartDesigner.prototype = new seatsio.Embeddable();

seatsio.SeatingChartDesigner.prototype.render = function(renderedCallback)
{
	this.renderedCallback = renderedCallback;
	this.createLoadingDiv();
	this.createIframe(urlBase + "chartDesigner?chartId=" + this.chartId + (this.config.idPlano != null ? "&idPlano=" + this.config.idPlano : "") + (this.config.idSala != null ? "&idSala=" + this.config.idSala : "") + "&tstamp=" + new Date().getTime());
	this.iframe.scrolling = 'yes';
	this.iframe.style.height = '100%';
	this.iframe.style.visibility = 'hidden';
	return this;
};

seatsio.SeatingChartDesigner.prototype.messageHandlers = {
    'seatsioLoaded' : function(e, chart, data)
    {
	    chart.sendMsgToIframe({
	        'type' : 'render',
	        'configuration' : chart.config
	    });
    },
    'seatsioRendered' : function(e, chart, data)
    {
	    chart.loadingDiv.style.display = 'none';
	    chart.iframe.style.visibility = 'visible';
	    if (chart.renderedCallback)
	    {
		    chart.renderedCallback();
	    }
	    chart.isRendered = true;
    },
    'chartCreated' : function(e, chart, data)
    {
	    if (chart.config.onChartCreated)
	    {
		    chart.config.onChartCreated(data.idPlano);
	    }
    },
    'saveChart' : function(e, chart, data)
    {
	    if (chart.config.onSaveChart)
	    {
		    chart.config.onSaveChart(data);
	    }
    }
};

seatsio.SeatingChartDesigner.prototype.save = function()
{
	this.sendMsgToIframe({
	    'type' : 'save'
	});
};




function addEvent(eventName, callback)
{
	if (window.addEventListener)
	{
		window.addEventListener(eventName, callback);
	}
	else
	{
		window.attachEvent('on' + eventName, callback);
	}
}

addEvent('message', messageReceived);
addEvent('keydown', keyboardEvent);
addEvent('keyup', keyboardEvent);

    })();
}

function updateBackgroundMap()
{
	var backgroundImage = $(controlerIframe).find("#backgroundImageUrl").val();
	var backgroundImageSrc = $(controlerIframe).find("#dropboxImageSelected-background_img").attr('src');
	if(backgroundImageSrc != null && backgroundImageSrc != undefined)
	{
		chartDesigner.activeSubChart().backgroundImage.setBackgroundImage(backgroundImageSrc);
	}
}
