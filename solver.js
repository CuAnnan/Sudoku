/**
 * A class to abstract the row, column and subgrid of a Sudoku Grid.
 */
class SudokuSpace
{
    /**
     * The search space has 9 cells, these are SudokuCells
     * @see SudokuCell
     */
    cells;
    solved= false;

    constructor()
    {
        // instantiate the array
        this.cells = [];
    }

    /**
     * Add a SudokuCell to the list of cells
     * @param {SudokuCell} cell
     */
    addCell(cell)
    {
        this.cells.push(cell);
    }

    get size()
    {
        return this.cells.length;
    }

    /**
     * Fetch the SudokuCell from the given index
     * @param {Number} index
     * @returns {SudokuCell}
     */
    getCell(index)
    {
        return this.cells[index];
    }

    updateKnownValues()
    {
        let {knownValues, unknownCells} = this.getValues();
        for(let cell of unknownCells)
        {
            cell.updateKnownValues(knownValues);
        }
    }

    /**
     * Run a search through the cells to see if, given the known cell values in the space, any new digits can be found.
     * @returns {Number} returns the number of cells that have been changed by this pass.
     */
    makePass()
    {
        let {knownValues, unknownCells} = this.getValues();
        let changes = 0;
        this.solved = unknownCells.length < 1;
        for(let cell of unknownCells)
        {
            changes += cell.makePass(knownValues);
        }

        return changes;
    }

    isSolved()
    {
        let {knownValues, unknownCells} = this.getValues();
        return unknownCells.length === 0;
    }

    /**
     * Determine if there are any numbers which can go into only one cell. If that is the case, that cell must contain
     * that value.
     * @returns {boolean}  Returns true if there are any changes made, by this process.
     */
    checkForSingleAvailabilities()
    {
        let changed = false
        let {missingValues} = this.getValues();
        for(let [value, indices] of Object.entries(missingValues))
        {
            if(indices.length === 1)
            {
                this.cells[indices[0]].value = value;
                changed = true;
            }
        }
        return changed;
    }

    /**
     * This method returns a dictionary of what we know about the search space. What cells have known values, what cells don't have known values, what numbers need to be found and what cells they can possibly go into.
     * @returns Dictionary of values
     */
    getValues()
    {
        let knownValues = [];
        let unknownCells = [];
        let missingValues = {1: [], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[], 9:[]};
        for(let [key, cell] of Object.entries(this.cells))
        {
            if(cell.value)
            {
                knownValues.push(cell.value);
                delete(missingValues[cell.value]);
            }
            else
            {
                unknownCells.push(cell);
                for(let [value, possible] of Object.entries(cell.possibleValues))
                {
                    if(possible && missingValues[value])
                    {
                        missingValues[value].push(key);
                    }
                }
            }
        }

        return {knownValues:knownValues, unknownCells:unknownCells, missingValues:missingValues};
    }

    /**
     * Makes sure a search space has not been incorrectly inputted by ensuring that each value exists only in one space.
     * @returns {boolean}
     */
    validate()
    {
        let {knownValues} = this.getValues();
        let uniqueKnownValues = knownValues.filter(onlyUnique);
        return uniqueKnownValues.length === knownValues.length;
    }

    makeGuess()
    {
        // get the unsolved cells
        let {unknownCells} = this.getValues();
        return unknownCells;
    }
}

function onlyUnique(value, index, array)
{
    return array.indexOf(value) === index;
}

/**
 * The class to represent the Sudoku Cell itself.
 */
class SudokuCell
{
    /**
     * A hash map of booleans to store whether a given number can still be fit into the Cell
     */
    possibleValues;
    /**
     * The value of the cell, whether provided or derived
     */
    value;
    guess;

    remainingValues;

    constructor(value)
    {
        this.possibleValues = {1: true, 2:true, 3:true, 4:true, 5:true, 6:true, 7:true, 8:true, 9:true}
        this.value = value;
        this.remainingValues= new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }

    updateKnownValues(knownValues)
    {
        for(let value of knownValues)
        {
            this.remainingValues.delete(value);
            this.possibleValues[value] = false;
        }
        return this;
    }


    /**
     * This method takes the values that are known by the search space it belongs to and sets those values in this cell
     * to false. If there is only one possible cell remaining, the value of this cell is set to that and the method
     * returns true. Other-wise false.
     * @param knownValues An array of values that this Cell can possibly contain
     * @returns {boolean} Whether the cell was changed or not
     */
    makePass(knownValues)
    {
        this.updateKnownValues(knownValues)
        for(let [value, possible] of Object.entries(this.possibleValues))
        {
            if(!possible)
            {
                this.remainingValues.delete(value);
            }
        }

        if(this.remainingValues.size === 1)
        {
            [this.value] = this.remainingValues;
            return true;
        }
        return false;
    }

    setGuess(guess)
    {
        this.value = guess;
        for(let value of this.remainingValues.values())
        {
            if(value !== guess)
            {
                this.remainingValues.delete(value);
                this.possibleValues[guess] = false;
            }
        }
    }
}

/**
 * These two classes are just helper methods that I used in programming the solution part. They may be of further use,
 * they may not.
 */
class SolvedSudokuCell extends SudokuCell
{
    constructor(value)
    {
        super(value);
    }
}

class UnsolvedSudokuCell extends SudokuCell
{
    constructor()
    {
        super();
    }
}

class GuessedSudokuCell extends SudokuCell
{
    constructor(guess)
    {
        super();
        this.guess = guess;
    }

}

/**
 * This class represents the grid in total. A game of sudoku is broken up into a nine by nine grid. Each row, column
 * and subgrid of 3x3 must contain the numbers 1 - 9 once only.
 */
class Sudoku
{
    /**
     * An array of SudokuSpaces
     * @see SudokuSpace
     */
    rows;
    /**
     * An array of SudokuSpaces
     * @see SudokuSpace
     */
    cols;
    /**
     * An array of SudokuSpaces
     * @see SudokuSpace
     */
    grids;
    /**
     * An array of strings of the names of valid search spaces
     */
    spaces;
    /**
     * For sequential animation, we need to check each space type one at a time
     * This index is for the currently searched space type
     */
    currentSpaceTypeIndex;
    /**
     * This index is for the search space.
     */
    currentSpaceIndex;

    /**
     * Turns an array of numbers into a sudoku grid
     * @param values A two-dimensional array of integers
     */
    constructor(values)
    {
        /*
         * Instantiate the search spaces
         */
        this.rows = [];
        this.cols = [];
        this.grids = [];
        this.allCells = [];
        this.spaces = ['rows', 'cols', 'grids'];
        this.currentSpaceTypeIndex = 0;
        this.currentSpaceIndex = 0;


        /*
         * Populate the rows first. We'll use the rows to populate the grids and columns. This could be done at once,
         * but honestly it's easier code to read if you do it in three separate steps.
         */
        for(let i = 0; i < 9; i++)
        {
            // instantiate the space
            let row = new SudokuSpace();

            for(let j = 0; j < 9; j++)
            {
                let cell;
                // if the cell has a value, create a solved cell, otherweise create an unsolved cell
                if(values && values[i] && values[i][j])
                {
                    cell = new SolvedSudokuCell(values[i][j])
                }
                else
                {
                    cell = new UnsolvedSudokuCell();
                }
                this.allCells.push(cell);
                // add it to the row
                row.addCell(cell);
            }
            // add the row to the array
            this.rows.push(row);
        }

        // populate the columns
        for(let i = 0; i < 9; i++)
        {
            let col = new SudokuSpace();
            for(let row of this.rows)
            {
                col.addCell(row.getCell(i));
            }
            this.cols.push(col);
        }

        //populate the grids
        let offset_i = 0;
        let offset_j = 0;
        for(let g = 0; g < 9; g++)
        {
            let grid = new SudokuSpace();
            for(let i = 0; i < 3; i++)
            {
                for(let j = 0; j < 3; j++)
                {
                    grid.addCell(
                        this.rows[i + offset_i].getCell(j + offset_j)
                    );
                }
            }
            this.grids.push(grid);
            offset_i += 3;
            if(offset_i >= 9)
            {
                offset_i = 0;
                offset_j += 3;
            }
        }
    }

    updateKnownValues()
    {
        for(let i = 0; i < 9; i++)
        {
            this.rows[i].updateKnownValues();
            this.cols[i].updateKnownValues();
            this.grids[i].updateKnownValues();
        }
    }

    findAmbivalentCells()
    {

    }

    /**
     * This method isn't currently used but will turn this SudokuGrid into an array of numbers identical to the
     * requirements of the constructor
     */
    toArray()
    {
        let values = [];
        for(let row of this.rows)
        {
            let rowValues = [];
            for(let cell of row.cells)
            {
                rowValues.push(
                    cell.value?cell.value:''
                );
            }
            values.push(rowValues);
        }
        return values;
    }

    isSolved()
    {
        for(let row of this.rows)
        {
            if(!row.isSolved())
            {
                return false;
            }
        }
        return true;
    }

    /**
     * Makes a basic pass through each of the search spaces to see if any of them have cells which have only one value
     * based on the values of the other cells in the search space. If any changes are made at all, return true.
     * @returns {boolean}
     */
    makeBasicPass()
    {
        let changed = false;
        // make a pass through all 9 rows, all 9 columns, and all 9 grids
        for(let i = 0; i < 9; i++)
        {
            let rowChanged = this.rows[i].makePass();
            let colChanged = this.cols[i].makePass();
            let gridChanged = this.grids[i].makePass();
            changed = changed ||(rowChanged || colChanged || gridChanged);
        }
        return changed;
    }


    /**
     * Check whether any single value cells have been derived.
     * @returns {boolean} Returns true if any cells have their values changed
     */
    checkForSingleAvailabilities()
    {
        let changed = false;
        for(let i = 0; i < 9; i++)
        {
            let rowChanged = this.rows[i].checkForSingleAvailabilities();
            let colChanged = this.cols[i].checkForSingleAvailabilities();
            let gridChanged = this.grids[i].checkForSingleAvailabilities();
            changed = changed ||(rowChanged || colChanged || gridChanged);
        }
        return changed;
    }

    /**
     *
     */
    getSmallestCell()
    {
        let fewestRemainingValues = 10;
        let smallestCell = null;
        let x = -1, y = -1;
        for(let i in this.rows)
        {
            let row = this.rows[i];
            for(let j = 0; j < row.size; j++)
            {
                let cell = row.getCell(j);
                if(cell.remainingValues.size > 1 && cell.remainingValues.size < fewestRemainingValues)
                {
                    smallestCell = cell;
                    x = i;
                    y = j;
                }
            }
        }
        return {coords:{x:parseInt(x), y:parseInt(y)}, cell:smallestCell};
    }

    generateBranches()
    {
        let smallestCell = this.getSmallestCell();
        let branches = [];
        let currentStateAsArray = this.toArray();
        for(let value of smallestCell.cell.remainingValues.values())
        {
            let branch = new Sudoku(currentStateAsArray);
            let coords = smallestCell.coords;
            branch.getCell(coords.x, coords.y).setGuess(value);
            branches.push(branch);
        }
        return branches;
    }

    /**
     * Get the cell at the given euclidian value.
     * @param i the row to search
     * @param j th cell to get
     * @returns {SudokuCell|*}
     */
    getCell(i, j)
    {
        return this.rows[i].getCell(j);
    }

    /**
     * Ensures the sudoku grid is valid. Returns a hash map with the valid field as true if the grid is fine.
     * If the grid is not the valid field will be false, the index of any offending cell and whether the index refers
     * to a row, column, or grid.
     * @returns {{valid: boolean, index: number, space: string}|{valid: boolean}}
     */
    validate()
    {
        let spaces = {rows:this.rows, cols:this.cols, grids:this.grids};
        for(let i = 0; i < 9; i++)
        {
            for(let [toSearch, field] of Object.entries(spaces))
            {
                if(!field[i].validate())
                {
                    return {valid:false, space:toSearch.slice(0, -1), index:i};
                }
            }
        }
        return {valid:true};
    }
}


//IIFE encapsulating the UI
(function($){
    function createUnFilledSudokuHTMLCell($container, cell)
    {
        let possibleValue = 0;

        for(let i = 0; i < 3; i++)
        {
            let $row = $(`<div class="row"></div>`).appendTo($container);
            for(let j = 0; j < 3; j++)
            {
                possibleValue++;
                $row.append($(`<div class="col emptyCellCell ${cell.possibleValues[possibleValue]?"is":"un"}Available" data-possible-value="${possibleValue}">${possibleValue}</div>`));
            }
        }
    }

    function buildSudokuHTML()
    {
        $sudokuContainer.empty();
        for(let row = 0; row < 9; row ++)
        {
            let $sudokuRow = $(`<div class="row sudokuRow"></div>`).appendTo($sudokuContainer);
            for(let col = 0; col < 9; col++)
            {
                let grid = Math.floor(row/3) * 3 + Math.floor(col/3);
                $sudokuRow.append($(`<div class="col space space_grid_${grid} space_row_${row} space_col_${col} sudokuCell" id="cell_${row}_${col}"></div>`))
            }
        }
    }

    function updateGrid()
    {
        buildSudokuHTML();
        let rawInput = $sudokuInput.val();
        let rows = rawInput.split('\n');
        allValues = [];
        let valid = rows.length === 9;
        for(let i = 0; i < rows.length; i++)
        {
            let row = rows[i];
            let cells = row.split('');
            let values = [];
            if(cells.length !== 9)
            {
                valid = false;
            }
            for(let j = 0; j < cells.length; j ++)
            {
                let cell = cells[j];
                let value = cell===' '?'':parseInt(cell);
                values.push(value);
                $(`#cell_${i}_${j}`).html(cell);
            }
            allValues.push(values);
        }
        if(valid)
        {
            $solveButton.prop("disabled", false)
        }
    }

    function showUpdatedGrid()
    {
        buildSudokuHTML();
        for(let i = 0; i < 9; i ++)
        {
            for (let j = 0; j < 9; j++)
            {
                let cell = solver.getCell(i, j);
                if(cell.value)
                {
                    $(`#cell_${i}_${j}`).html(cell.value);
                }
                else if(cell.guess)
                {
                    $(`#cell_${i}_${j}`)
                        .addClass('guess')
                        .html(cell.value);
                }
                else
                {
                    createUnFilledSudokuHTMLCell($(`#cell_${i}_${j}`), cell);
                }
            }
        }
    }



    function solveSodoku()
    {
        $('.space').removeClass('invalidSpace')
        let result = solver.validate();
        if(!result.valid)
        {
            $(`.space_${result.space}_${result.index}`).addClass('invalidSpace')
            return;
        }
        makePass();
    }

    function makeBranchedPass()
    {
        let invalidBranchFound = false;
        let foundBranch = false;
        for(let branch of branches)
        {
            let branchWorking = branch.makeBasicPass();
            if(!branchWorking)
            {
                branchWorking = branch.checkForSingleAvailabilities();
            }
            if(!foundBranch && branch.isSolved())
            {
                foundBranch = branch;
            }
            else if(!branch.validate())
            {
                invalidBranchFound = true;
            }
        }

        if(foundBranch)
        {
            solver = foundBranch;
            showUpdatedGrid();
        }
        else
        {
            timeout = window.setTimeout(makeBranchedPass, 50);
        }
    }

    function makePass()
    {
        let working= makeSinglePass();
        if(working)
        {
            timeout = window.setTimeout(makePass,50);
        }
        else if(!solver.isSolved())
        {
            branches = solver.generateBranches();
            makeBranchedPass();
        }
    }

    function makeSinglePass()
    {
        let working = solver.makeBasicPass();
        if(!working)
        {
            working = solver.checkForSingleAvailabilities();
        }
        showUpdatedGrid();
        return working;
    }

    function buildRelevantGrid()
    {
        updateGrid();
        solver = new Sudoku(allValues);
        solver.updateKnownValues();
        showUpdatedGrid();
    }

    let allValues;
    let solver;
    let $sudokuInput;
    let $sudokuContainer;
    let $solveButton;
    let $passButton;
    let $showHelpersToggle;
    let timeout;
    let branches;

    // jquery document onload handler
    $(function(){
        $sudokuContainer = $('#sudokuContainer');
        $sudokuInput = $('#sudokuValue').on("input", ()=>{
            buildRelevantGrid();
        });

        let sheet = document.styleSheets[1];
        let rule = sheet.cssRules[7];

        $solveButton = $('#solveButton').on('click', ()=>{solveSodoku();});
        $passButton = $('#passButton').on('click', ()=>{makeSinglePass();});
        buildRelevantGrid();
        let $emptyCellCells = $('.emptyCellCell');
        let shower = ()=>{
            if($showHelpersToggle.is(':checked'))
            {
                rule.style.display = 'block';
            }
            else
            {
                rule.style.display = 'none';
            }
        };

        $showHelpersToggle = $('#showHelperCells').on('change', function(evt){
            shower()
        });
        shower();

    });
})(window.jQuery);