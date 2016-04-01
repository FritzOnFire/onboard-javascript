/// <reference path="scripts/typings/jquery.d.ts" />
var Grid = (function () {
    function Grid(startFrom, totalToDisplay) {
        this.starting = false;
        this.finished = false;
        this.totalToDisplay = totalToDisplay;
        this.startFrom = startFrom;
        this.starting = true;
    }
    Grid.prototype.isStarting = function () {
        return this.starting;
    };
    Grid.prototype.setStarting = function (starting) {
        this.starting = starting;
    };
    Grid.prototype.isFinished = function () {
        this.finished = ((this.startFrom + this.totalToDisplay) >= this.totalRecords);
        return this.finished;
    };
    Grid.prototype.setFinished = function (finished) {
        this.finished = finished;
    };
    Grid.prototype.getColumns = function () {
        return this.columns;
    };
    Grid.prototype.setColumns = function (columns) {
        this.columns = columns;
    };
    Grid.prototype.getResults = function () {
        return this.results;
    };
    Grid.prototype.setResults = function (results) {
        this.results = results;
    };
    Grid.prototype.getTotalRecords = function () {
        return this.totalRecords;
    };
    Grid.prototype.setTotalRecords = function (totalRecords) {
        this.totalRecords = totalRecords;
    };
    Grid.prototype.getTotalToDisplay = function () {
        return this.totalToDisplay;
    };
    Grid.prototype.setTotalToDisplay = function (totalToDisplay) {
        this.totalToDisplay = totalToDisplay;
    };
    Grid.prototype.getStartFrom = function () {
        return this.startFrom;
    };
    Grid.prototype.getLastRecordIndex = function () {
        return ((this.isFinished()) ? this.totalRecords - 1 : this.startFrom + this.totalToDisplay - 1);
    };
    Grid.prototype.getDisplayString = function () {
        return (this.startFrom + 1) + " to " + (this.getLastRecordIndex() + 1) + " of " + this.totalRecords;
    };
    return Grid;
}());
var GridService = (function () {
    function GridService(firstIndex, totalToDisplay, ctrl) {
        this.baseURL = "http://localhost:2050/";
        this.canNavToPrev = false;
        this.canNavToNext = false;
        this.ctrl = ctrl;
        this.grid = new Grid(firstIndex, totalToDisplay);
    }
    GridService.prototype.initialize = function () {
        //load 
        this.fetchRecordCount();
    };
    /**
     * retrieves and loads the grid with the relevant data. The idea is to call this
     * method once you have verified that records do exists.
     */
    GridService.prototype.loadGridData = function () {
        console.log("");
        //retrieve column names (doing this every time, just incase something changes)
        this.fetchColumnNames();
        var firstIndex = this.grid.getStartFrom();
        var lastIndex = this.grid.getLastRecordIndex();
        var totRecords = this.grid.getTotalRecords();
        if ((totRecords - 1) > firstIndex) {
            if (totRecords < lastIndex) {
                lastIndex = totRecords - 1;
            }
            this.fetchRecords(firstIndex, lastIndex);
        }
        else {
            console.error("Initial index [" + firstIndex + "] out of scope [totRecords:" + totRecords + "]");
        }
    };
    /**
     * retrieves an array of columns from the repo & assigns it to the grid object
     */
    GridService.prototype.fetchColumnNames = function () {
        var _this = this;
        $.getJSON(this.baseURL + "columns", function (data) {
            _this.grid.setColumns(data);
            _this.ctrl.loadTableHeader();
        });
    };
    /**
     * Retrieves the records from the repo and assigns them into the grid
     */
    GridService.prototype.fetchRecords = function (start, end) {
        var _this = this;
        var totRecords = this.getGrid().getTotalRecords();
        if (end > (totRecords - 1)) {
            end = totRecords - 1;
        }
        console.log("\t- about to fetch: records?from=" + start + "&to=" + end);
        $.getJSON(this.baseURL + "records?from=" + start + "&to=" + end, function (data) {
            _this.grid.setResults(data);
            _this.ctrl.loadTableBody();
        });
    };
    GridService.prototype.fetchRecordCount = function () {
        var _this = this;
        $.getJSON(this.baseURL + "recordCount", function (count) {
            console.log("\t- total record count: " + count);
            _this.grid.setTotalRecords(count);
            if (count > 0) {
                _this.loadGridData();
            }
        });
    };
    GridService.prototype.getGrid = function () {
        return this.grid;
    };
    GridService.prototype.hasPrevious = function () {
        return this.canNavToPrev;
    };
    GridService.prototype.hasNext = function () {
        return this.canNavToNext;
    };
    return GridService;
}());
var GridController = (function () {
    function GridController(tblHeader, tblBody) {
        this.tblHeader = tblHeader;
        this.tblBody = tblBody;
        var initialIndex = 0;
        var totalToDisplay = 7;
        this.service = new GridService(initialIndex, totalToDisplay, this);
        this.service.initialize();
        this.initButtonActions();
    }
    GridController.prototype.initButtonActions = function () {
        var _this = this;
        //btn first
        document.getElementById("btnFirst").addEventListener('click', function () {
            _this.btnFirstAction();
        });
        //btn previous
        document.getElementById("btnPrevious").addEventListener('click', function () {
            _this.btnPreviousAction();
        });
        //btn next
        document.getElementById("btnNext").addEventListener('click', function () {
            _this.btnNextAction();
        });
        //btn next
        document.getElementById("btnLast").addEventListener('click', function () {
            _this.btnLastAction();
        });
    };
    GridController.prototype.loadTableHeader = function () {
        var headerData = this.service.getGrid().getColumns();
        this.tableHeaderTxt = "";
        var headerRow = document.createElement("tr");
        //loop through the header names and append them to the header row
        headerData.forEach(function (col) {
            var headerCol = document.createElement("th");
            headerCol.innerText = col;
            headerRow.appendChild(headerCol);
        });
        this.tblHeader.innerHTML = '';
        this.tblHeader.appendChild(headerRow);
    };
    GridController.prototype.loadTableBody = function () {
        var _this = this;
        console.log("updating tblGrid's body...");
        var tblBodyData = this.service.getGrid().getResults();
        this.tableBodyTxt = "";
        this.tblBody.innerHTML = '';
        //udpate table body's contents
        tblBodyData.forEach(function (row) {
            var tblRow = document.createElement("tr");
            row.forEach(function (col) {
                var tblCol = document.createElement("td");
                tblCol.innerText = col;
                tblRow.appendChild(tblCol);
            });
            _this.tblBody.appendChild(tblRow);
        });
        //update the navigation buttons
        var btnNavigationText = document.getElementById("btnNavigationText");
        btnNavigationText.innerText = "";
        btnNavigationText.innerText = this.service.getGrid().getDisplayString();
        console.log("DISPLAY STRING: " + this.service.getGrid().getDisplayString());
    };
    GridController.prototype.btnFirstAction = function () {
        console.log("btnFirstAction() started...");
        var totalToDisplay = this.service.getGrid().getTotalToDisplay();
        var initialIndex = 0;
        this.service = new GridService(initialIndex, totalToDisplay, this);
        this.service.initialize();
    };
    GridController.prototype.btnPreviousAction = function () {
        console.log("btnPreviousAction() started...");
        var totalToDisplay = this.service.getGrid().getTotalToDisplay();
        var initialIndex = this.service.getGrid().getStartFrom() - totalToDisplay;
        this.service = new GridService(initialIndex, totalToDisplay, this);
        this.service.initialize();
    };
    GridController.prototype.btnNextAction = function () {
        console.log("btnNextAction() started...");
        var totalToDisplay = this.service.getGrid().getTotalToDisplay();
        var initialIndex = totalToDisplay + this.service.getGrid().getStartFrom();
        this.service = new GridService(initialIndex, totalToDisplay, this);
        this.service.initialize();
    };
    GridController.prototype.btnLastAction = function () {
        try {
            console.log("btnLastAction() started...");
            var totalRecords = this.service.getGrid().getTotalRecords();
            var totalToDisplay = this.service.getGrid().getTotalToDisplay();
            var initialIndex = 0;
            var remainder = totalRecords % totalToDisplay;
            if (remainder > 0) {
                initialIndex = totalRecords - remainder - 1;
            }
            else {
                initialIndex = totalRecords - totalToDisplay - 1;
            }
            this.service = new GridService(initialIndex, totalToDisplay, this);
            this.service.initialize();
        }
        catch (ex) {
            console.error("Error while navigating to last: " + ex);
        }
    };
    return GridController;
}());
window.onload = function () {
    var tblHead = document.getElementById("tableHead");
    var tblBody = document.getElementById("tableBody");
    //load the grid
    var ctrl = new GridController(tblHead, tblBody);
};
