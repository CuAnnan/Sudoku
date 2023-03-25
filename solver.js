class SudokuSpace
{
    cells;
    found;

    constructor()
    {
        this.cells = [];
    }

    addCell(cell)
    {
        this.cells.push(cell);
    }

    getCell(index)
    {
        return this.cells[index];
    }

    makePass()
    {
        let [knownValues, unknownCells] = this.getValues();
        for(let cell of this.cells)
        {
            if(cell.value)
            {
                knownValues.push(cell.value);
            }
            else
            {
                unknownCells.push(cell);
            }
        }
        let changed = false;
        for(let cell of unknownCells)
        {
            changed = changed || cell.makePass(knownValues);
        }
        return changed;

    }

    getValues()
    {
        let knownValues = [];
        let unknownCells = [];
        for(let cell of this.cells)
        {
            if(cell.value)
            {
                knownValues.push(cell.value);
            }
            else
            {
                unknownCells.push(cell);
            }
        }
        return [knownValues, unknownCells];
    }

    validate()
    {
        let [knownValues, unknownCells] = this.getValues();
        let uniqueKnownValues = knownValues.filter(onlyUnique);
        return uniqueKnownValues.length === knownValues.length;
    }
}

function onlyUnique(value, index, array)
{
    return array.indexOf(value) === index;
}

class SudokuCell
{
    possibleValues;
    value;

    constructor(value)
    {
        this.possibleValues = {1: true, 2:true, 3:true, 4:true, 5:true, 6:true, 7:true, 8:true, 9:true}
        if(value)
        {
            this.value = value;
        }
    }

    makePass(knownValues)
    {
        for(let value of knownValues)
        {
            this.possibleValues[value] = false;
        }
        let remainingPossibleValues = [];
        for(let [value, possible] of Object.entries(this.possibleValues))
        {
            if(possible)
            {
                remainingPossibleValues.push(value);
            }
        }

        if(remainingPossibleValues.length === 1)
        {
            this.value = remainingPossibleValues[0];
            return true;
        }
        return false;
    }
}

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

class Sudoku
{
    rows;
    cols;
    grids;
    spaces;

    constructor(values)
    {
        this.rows = [];
        this.cols = [];
        this.grids = [];

        this.spaces = {rows:this.rows, cols:this.cols, grids:this.grids}

        for(let i = 0; i < 9; i++)
        {
            let row = new SudokuSpace();

            for(let j = 0; j < 9; j++)
            {
                let cell;
                if(values[i] && values[i][j])
                {
                    cell = new SolvedSudokuCell(values[i][j])
                }
                else
                {
                    cell = new UnsolvedSudokuCell();
                }
                row.addCell(cell);
            }
            this.rows.push(row);
        }

        for(let i = 0; i < 9; i++)
        {
            let col = new SudokuSpace();
            for(let row of this.rows)
            {
                col.addCell(row.getCell(i));
            }
            this.cols.push(col);
        }

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

    makeBasicPass()
    {
        let changed = false;
        for(let i = 0; i < 9; i++)
        {
            let rowChanged = this.rows[i].makePass();
            let colChanged = this.cols[i].makePass();
            let gridChanged = this.grids[i].makePass();
            changed = changed ||(rowChanged || colChanged || gridChanged);
        }
        return changed;
    }

    getCell(i, j)
    {
        return this.rows[i].getCell(j);
    }

    validate()
    {
        let valid = true;
        for(let i = 0; i < 9; i++)
        {
            for(let [toSearch, field] of Object.entries(this.spaces))
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

function createEmptySudokuHTMLCell()
{

}


//IIFE
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
            let $sudokuRow = $(`<div class="row"></div>`).appendTo($sudokuContainer);
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
            if(cells.length != 9)
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
                else
                {
                    createUnFilledSudokuHTMLCell($(`#cell_${i}_${j}`), cell);
                }
            }
        }
    }



    function solveSodoku()
    {
        solver = new Sudoku(allValues);
        $('.space').removeClass('invalidSpace')
        let result = solver.validate();
        if(!result.valid)
        {
            $(`.space_${result.space}_${result.index}`).addClass('invalidSpace')
            return;
        }
        let working = true;
        while(working)
        {
            working = solver.makeBasicPass();

        }
        showUpdatedGrid();
    }

    let allValues;
    let solver;
    let $sudokuInput;
    let $sudokuContainer;
    let $solveButton;

    // jquery document onload handler
    $(function(){
        $sudokuContainer = $('#sudokuContainer');
        $sudokuInput = $('#sudokuValue').on("input", (e)=>{updateGrid();});
        $solveButton = $('#solveButton').on('click', ()=>{solveSodoku();});
        buildSudokuHTML();
    });
})(window.jQuery);