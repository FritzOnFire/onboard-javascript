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
        return ((this.isFinished()) ? this.totalRecords - 1 : this.startFrom + this.totalToDisplay - 1);
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

        let firstIndex: number = this.grid.getStartFrom();
        let lastIndex: number = this.grid.getLastRecordIndex();
        let totRecords: number = this.grid.getTotalRecords();

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
        $.getJSON(this.baseURL + "columns",
            (data) => {
                this.grid.setColumns(data);
                this.ctrl.loadTableHeader();
            });
    }

    /**
     * Retrieves the records from the repo and assigns them into the grid
     */
    private fetchRecords(start: number, end: number) {

        let totRecords = this.getGrid().getTotalRecords();
        if (end > (totRecords - 1)) {
            end = totRecords - 1;
        }

        console.log("\t- about to fetch: records?from=" + start + "&to=" + end);
        $.getJSON(this.baseURL + "records?from=" + start + "&to=" + end,
            (data) => {
                this.grid.setResults(data);
                this.ctrl.loadTableBody();
            });
    }

    private fetchRecordCount() {
        $.getJSON(this.baseURL + "recordCount",
            (count)=> {
                console.log("\t- total record count: " + count);
                this.grid.setTotalRecords(count);
                if (count > 0) {
                    this.loadGridData();
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
        let initialIndex = 0;
        let totalToDisplay = 7;
        this.service = new GridService(initialIndex, totalToDisplay, this);
        this.service.initialize();
        this.initButtonActions();
    }

    private initButtonActions() {

        //btn first
        document.getElementById("btnFirst").addEventListener('click',()=> {
            this.btnFirstAction();
        });

        //btn previous
        document.getElementById("btnPrevious").addEventListener('click', ()=> {
            this.btnPreviousAction();
        });

        //btn next
        document.getElementById("btnNext").addEventListener('click', ()=> {
            this.btnNextAction();
        });

        //btn next
        document.getElementById("btnLast").addEventListener('click', ()=> {
            this.btnLastAction();
        });

    }

    loadTableHeader() {
        let headerData = this.service.getGrid().getColumns();
        this.tableHeaderTxt = "";
        let headerRow = document.createElement("tr");

        //loop through the header names and append them to the header row
        headerData.forEach(col => {
            let headerCol = document.createElement("th");
            headerCol.innerText = col;
            headerRow.appendChild(headerCol);
        });
        this.tblHeader.innerHTML = '';
        this.tblHeader.appendChild(headerRow);
    }

    loadTableBody() {
        console.log("updating tblGrid's body...");
        let tblBodyData = this.service.getGrid().getResults();
        this.tableBodyTxt = "";
        this.tblBody.innerHTML = '';

        //udpate table body's contents
        tblBodyData.forEach(row => {
            let tblRow = document.createElement("tr");
            row.forEach(col => {
                let tblCol = document.createElement("td");
                tblCol.innerText = col;
                tblRow.appendChild(tblCol);
            });
            this.tblBody.appendChild(tblRow);
        });

        //update the navigation buttons
        let btnNavigationText = document.getElementById("btnNavigationText");
        btnNavigationText.innerText = "";
        btnNavigationText.innerText = this.service.getGrid().getDisplayString();
        console.log("DISPLAY STRING: " + this.service.getGrid().getDisplayString());
    }

    btnFirstAction() {
        console.log("btnFirstAction() started...");
        let totalToDisplay = this.service.getGrid().getTotalToDisplay();
        let initialIndex = 0;

        this.service = new GridService(initialIndex, totalToDisplay, this);
        this.service.initialize();
    }

    btnPreviousAction() {
        console.log("btnPreviousAction() started...");
        let totalToDisplay = this.service.getGrid().getTotalToDisplay();
        let initialIndex = this.service.getGrid().getStartFrom() - totalToDisplay;

        this.service = new GridService(initialIndex, totalToDisplay, this);
        this.service.initialize();
    }

    btnNextAction() {
        console.log("btnNextAction() started...");
        let totalToDisplay = this.service.getGrid().getTotalToDisplay();
        let initialIndex = totalToDisplay + this.service.getGrid().getStartFrom();

        this.service = new GridService(initialIndex, totalToDisplay, this);
        this.service.initialize();
    }

    btnLastAction() {
        try {
            console.log("btnLastAction() started...");
            let totalRecords = this.service.getGrid().getTotalRecords();
            let totalToDisplay = this.service.getGrid().getTotalToDisplay();
            let initialIndex = 0;

            let remainder = totalRecords % totalToDisplay;
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

window.onload = () => {
    let tblHead = document.getElementById("tableHead");
    let tblBody = document.getElementById("tableBody");
    
    //load the grid
    let ctrl = new GridController(tblHead, tblBody);
};
