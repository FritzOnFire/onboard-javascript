/// <reference path="scripts/typings/jquery.d.ts" />

class Grid {
    private columns: string[];
    private results: string[][];
    private totalRecords: number;
    private totalToDisplay: number;
    private startFrom: number;
    private starting: boolean = false;
    private finished: boolean = false;

    constructor(startFrom: number, totalToDisplay: number) {
        this.totalToDisplay = totalToDisplay;
        this.startFrom = startFrom;
        this.starting = true;
    }

    isStarting(): boolean {
        return this.starting;
    }

    setStarting(starting: boolean) {
        this.starting = starting;
    }

    isFinished(): boolean {
        this.finished = ((this.startFrom + this.totalToDisplay) >= this.totalRecords);
        return this.finished;
    }

    setFinished(finished: boolean) {
        this.finished = finished;
    }

    getColumns() {
        return this.columns;
    }

    setColumns(columns: string[]) {
        this.columns = columns;
    }

    getResults() {
        return this.results;
    }

    setResults(results: string[][]) {
        this.results = results;
    }

    getTotalRecords() {
        return this.totalRecords;
    }

    setTotalRecords(totalRecords: number) {
        this.totalRecords = totalRecords;
    }

    getTotalToDisplay() {
        return this.totalToDisplay;
    }

    setTotalToDisplay(totalToDisplay: number) {
        this.totalToDisplay = totalToDisplay;
    }

    getStartFrom(): number {
        return this.startFrom;
    }

    getLastRecordIndex() {
        var endValue = ((this.isFinished()) ? this.totalRecords - 1 : this.startFrom + this.totalToDisplay - 1);
        return endValue;
    }

    getDisplayString(): string {
        return (this.startFrom + 1) + " to " + (this.getLastRecordIndex() + 1) + " of " + this.totalRecords;
    }
}

class GridService {
    private grid: Grid;
    private columns: string[];
    private baseURL = "http://localhost:2050/";
    private canNavToPrev = false;
    private canNavToNext = false;

    private ctrl: GridController;

    constructor(firstIndex: number, totalToDisplay: number, ctrl: GridController) {
        this.ctrl = ctrl;
        this.grid = new Grid(firstIndex, totalToDisplay);
    }

    initialize() {
        //load 
        this.fetchRecordCount();
    }

    /**
     * retrieves and loads the grid with the relevant data. The idea is to call this 
     * method once you have verified that records do exists.
     */
    private loadGridData() {
        console.log("");

        //retrieve column names (doing this every time, just incase something changes)
        this.fetchColumnNames();

        var firstIndex: number = this.grid.getStartFrom();
        var lastIndex: number = this.grid.getLastRecordIndex();
        var totRecords: number = this.grid.getTotalRecords();

        if ((totRecords - 1) > firstIndex) {
            if (totRecords < lastIndex) {
                lastIndex = totRecords - 1;
            }

            this.fetchRecords(firstIndex, lastIndex);
        } else {
            console.error("Initial index [" + firstIndex + "] out of scope [totRecords:" + totRecords + "]");
        }
    }

    /**
     * retrieves an array of columns from the repo & assigns it to the grid object
     */
    private fetchColumnNames() {
        var self = this;
        $.getJSON(this.baseURL + "columns",
            function(data) {
                self.grid.setColumns(data);
                self.ctrl.loadTableHeader();
            });
    }

    /**
     * Retrieves the records from the repo and assigns them into the grid
     */
    private fetchRecords(start: number, end: number) {
        var self = this;

        var totRecords = this.getGrid().getTotalRecords();
        if (end > (totRecords - 1)) {
            end = totRecords - 1;
        }

        console.log("\t- about to fetch: records?from=" + start + "&to=" + end);
        $.getJSON(this.baseURL + "records?from=" + start + "&to=" + end,
            function(data) {
                self.grid.setResults(data);
                self.ctrl.loadTableBody();
            });
    }

    private fetchRecordCount() {
        var self = this;
        $.getJSON(this.baseURL + "recordCount",
            function(count) {
                console.log("\t- total record count: " + count);
                self.grid.setTotalRecords(count);
                if (count > 0) {
                    self.loadGridData();
                }
            });
    }

    public getGrid(): Grid {
        return this.grid;
    }

    public hasPrevious(): boolean {
        return this.canNavToPrev;
    }

    public hasNext(): boolean {
        return this.canNavToNext;
    }

}

class GridController {

    tblHeader: HTMLElement;
    tblBody: HTMLElement;
    private service: GridService;
    private tableHeaderTxt: string;
    private tableBodyTxt: string;

    constructor(tblHeader: HTMLElement, tblBody: HTMLElement) {
        this.tblHeader = tblHeader;
        this.tblBody = tblBody;
        var initialIndex = 0;
        var totalToDisplay = 7;
        this.service = new GridService(initialIndex, totalToDisplay, this);
        this.service.initialize();
        this.initButtonActions();
    }

    private initButtonActions() {
        var self = this;

        //btn first
        document.getElementById("btnFirst").addEventListener('click', function() {
            self.btnFirstAction();
        });

        //btn previous
        document.getElementById("btnPrevious").addEventListener('click', function() {
            self.btnPreviousAction();
        });

        //btn next
        document.getElementById("btnNext").addEventListener('click', function() {
            self.btnNextAction();
        });

        //btn next
        document.getElementById("btnLast").addEventListener('click', function() {
            self.btnLastAction();
        });

    }

    loadTableHeader() {
        var headerData = this.service.getGrid().getColumns();
        this.tableHeaderTxt = "";
        // var row = row;
        var headerRow = document.createElement("tr");

        //loop through the header names and append them to the header row
        headerData.forEach(col => {
            var headerCol = document.createElement("th");
            headerCol.innerText = col;
            headerRow.appendChild(headerCol);
        });
        this.tblHeader.innerHTML = '';
        this.tblHeader.appendChild(headerRow);
    }

    loadTableBody() {
        console.log("updating tblGrid's body...");
        var tblBodyData = this.service.getGrid().getResults();
        this.tableBodyTxt = "";
        this.tblBody.innerHTML = '';

        //udpate table body's contents
        tblBodyData.forEach(row => {
            var tblRow = document.createElement("tr");
            row.forEach(col => {
                var tblCol = document.createElement("td");
                tblCol.innerText = col;
                tblRow.appendChild(tblCol);
            });
            this.tblBody.appendChild(tblRow);
        });

        //update the navigation buttons
        var btnNavigationText = document.getElementById("btnNavigationText");
        btnNavigationText.innerText = "";
        btnNavigationText.innerText = this.service.getGrid().getDisplayString();
        console.log("DISPLAY STRING: " + this.service.getGrid().getDisplayString());
    }

    btnFirstAction() {
        console.log("btnFirstAction() started...");
        var totalToDisplay = this.service.getGrid().getTotalToDisplay();
        var initialIndex = 0;

        this.service = new GridService(initialIndex, totalToDisplay, this);
        this.service.initialize();
    }

    btnPreviousAction() {
        console.log("btnPreviousAction() started...");
        var totalToDisplay = this.service.getGrid().getTotalToDisplay();
        var initialIndex = this.service.getGrid().getStartFrom() - totalToDisplay;

        this.service = new GridService(initialIndex, totalToDisplay, this);
        this.service.initialize();
    }

    btnNextAction() {
        console.log("btnNextAction() started...");
        var totalToDisplay = this.service.getGrid().getTotalToDisplay();
        var initialIndex = totalToDisplay + this.service.getGrid().getStartFrom();

        this.service = new GridService(initialIndex, totalToDisplay, this);
        this.service.initialize();
    }

    btnLastAction() {
        try {
            console.log("btnLastAction() started...");
            var totalRecords = this.service.getGrid().getTotalRecords();
            var totalToDisplay = this.service.getGrid().getTotalToDisplay();
            var initialIndex = 0;

            var remainder = totalRecords % totalToDisplay;
            if (remainder > 0) {
                initialIndex = totalRecords - remainder - 1;
            } else {
                initialIndex = totalRecords - totalToDisplay - 1;
            }

            this.service = new GridService(initialIndex, totalToDisplay, this);
            this.service.initialize();
        } catch (ex) {
            console.error("Error while navigating to last: " + ex);
        }
    }
}

class Greeter {
    element: HTMLElement;
    span: HTMLElement;
    timerToken: number;

    constructor(element: HTMLElement) {
        this.element = element;
        this.element.innerHTML += "The time is: ";
        this.span = document.createElement('span');

        this.element.appendChild(this.span);
        this.span.innerText = new Date().toUTCString();
    }

    start() {
        this.timerToken = setInterval(() => this.span.innerHTML = new Date().toUTCString(), 500);
    }

    stop() {
        clearTimeout(this.timerToken);
    }

}

window.onload = () => {
    var tblHead = document.getElementById("tableHead");
    var tblBody = document.getElementById("tableBody");
    //load the grid
    var ctrl = new GridController(tblHead, tblBody);


    //below is the default data that i found here
    var el = document.getElementById('footerTime');
    var greeter = new Greeter(el);
    greeter.start();
};
