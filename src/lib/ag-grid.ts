import type { GridOptions, ColDef } from 'ag-grid-community';

/**
 * Default AG Grid configuration
 */
export const defaultGridOptions: GridOptions = {
    animateRows: true,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    pagination: false,
    suppressCellFocus: false,
    suppressMovableColumns: false,
    suppressRowClickSelection: false,
    rowHeight: 48,
    headerHeight: 48,
    defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 100,
    },
};

/**
 * Get column state from localStorage
 */
export function getColumnState(gridId: string) {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(`ag-grid-${gridId}-column-state`);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Failed to load column state:', error);
        return null;
    }
}

/**
 * Save column state to localStorage
 */
export function saveColumnState(gridId: string, columnState: any) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(`ag-grid-${gridId}-column-state`, JSON.stringify(columnState));
    } catch (error) {
        console.error('Failed to save column state:', error);
    }
}

/**
 * Apply saved column state to grid
 */
export function applyColumnState(api: any, gridId: string) {
    const columnState = getColumnState(gridId);
    if (columnState && api) {
        api.applyColumnState({ state: columnState, applyOrder: true });
    }
}

/**
 * Handle column state changes
 */
export function onColumnStateChanged(api: any, gridId: string) {
    if (api) {
        const columnState = api.getColumnState();
        saveColumnState(gridId, columnState);
    }
}
