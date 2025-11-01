import { Todo, ITodo, ITodoData, ITodoUpdate, TodoStatus, TodoPriority, ITodoFilter, ITodoSort } from '../models/todo.model';
import { TodoModelUtils } from '../models/todo-utils.model';
import { TodoConstants, TodoError, TodoErrorCodes } from '../models/todo-constants.model';

/**
 * @type TodoListChangedCallback
 * 
 * Callback function type for todo list changes
 */
export type TodoListChangedCallback = (todos: ITodo[]) => void;

/**
 * @type TodoOperationCallback
 * 
 * Callback function type for individual todo operations
 */
export type TodoOperationCallback = (todo: ITodo, operation: string) => void;

/**
 * @interface ITodoServiceStatistics
 * 
 * Interface for service statistics and metrics
 */
export interface ITodoServiceStatistics {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
    averageCompletionTime?: number;
    priorityDistribution: Record<TodoPriority, number>;
    statusDistribution: Record<TodoStatus, number>;
}

/**
 * @interface ITodoService
 * 
 * Interface defining the contract for comprehensive TODO service operations
 */
export interface ITodoService {
    // Data access
    todos: ITodo[];
    
    // Event binding
    bindTodoListChanged(callback: TodoListChangedCallback): void;
    bindTodoOperation(callback: TodoOperationCallback): void;
    
    // CRUD Operations
    addTodo(text: string, priority?: TodoPriority): ITodo;
    getTodo(id: string): ITodo | null;
    updateTodo(id: string, updates: ITodoUpdate): ITodo;
    editTodo(id: string, updatedText: string): void;
    deleteTodo(id: string): boolean;
    toggleTodo(id: string): ITodo;
    
    // Bulk Operations
    addMultipleTodos(texts: string[]): ITodo[];
    deleteMultipleTodos(ids: string[]): number;
    updateMultipleTodos(updates: { id: string; data: ITodoUpdate }[]): ITodo[];
    toggleAll(complete: boolean): ITodo[];
    clearCompleted(): number;
    
    // Search and Filter Operations
    findTodos(filter: ITodoFilter): ITodo[];
    searchTodos(query: string): ITodo[];
    getTodosByStatus(status: TodoStatus): ITodo[];
    getTodosByPriority(priority: TodoPriority): ITodo[];
    getOverdueTodos(): ITodo[];
    getDueTodosToday(): ITodo[];
    
    // Sorting Operations
    sortTodos(sort: ITodoSort): ITodo[];
    getTodosSorted(criteria: keyof ITodo, ascending?: boolean): ITodo[];
    
    // Statistics and Analytics
    getTodoCount(): { total: number; completed: number; pending: number };
    getStatistics(): ITodoServiceStatistics;
    getCompletionRate(): number;
    getPriorityDistribution(): Record<TodoPriority, number>;
    
    // Data Management
    exportTodos(): string;
    importTodos(data: string): number;
    backupTodos(): string;
    restoreFromBackup(backup: string): boolean;
    clearAllTodos(): void;
    
    // Validation and Integrity
    validateTodo(todo: ITodo): boolean;
    validateTodos(): ITodo[];
    repairData(): number;
}

/**
 * @class TodoService
 * 
 * Comprehensive service class that manages all business logic and data operations for TODOs.
 * Provides complete CRUD operations, filtering, sorting, statistics, and data management.
 * Handles persistence using localStorage and notifies observers of changes.
 */
export class TodoService implements ITodoService {
    public todos: ITodo[] = [];
    private onTodoListChanged: TodoListChangedCallback | null = null;
    private onTodoOperation: TodoOperationCallback | null = null;
    private readonly storageKey: string = TodoConstants.STORAGE.LOCAL_STORAGE_KEY;

    constructor() {
        this.loadTodos();
    }

    // ==================== EVENT BINDING ====================

    /**
     * Binds a callback function to be called when the todo list changes
     * @param callback Function to call when todos change
     */
    public bindTodoListChanged(callback: TodoListChangedCallback): void {
        this.onTodoListChanged = callback;
    }

    /**
     * Binds a callback function to be called when individual todo operations occur
     * @param callback Function to call when todo operations happen
     */
    public bindTodoOperation(callback: TodoOperationCallback): void {
        this.onTodoOperation = callback;
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Loads todos from localStorage
     */
    private loadTodos(): void {
        try {
            const storedTodos = localStorage.getItem(this.storageKey);
            if (storedTodos) {
                const parsedTodos = JSON.parse(storedTodos);
                this.todos = parsedTodos.map((todo: ITodoData) => new Todo(todo));
            } else {
                this.todos = [];
            }
        } catch (error) {
            console.error('Error loading todos from storage:', error);
            this.todos = [];
        }
    }

    /**
     * Commits changes to the todo list and persists them
     * @param todos The current list of todos
     */
    private _commit(todos: ITodo[]): void {
        try {
            // Update internal state
            this.todos = [...todos];
            
            // Persist to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(todos));
            
            // Notify observers
            if (this.onTodoListChanged) {
                this.onTodoListChanged([...todos]);
            }
        } catch (error) {
            throw new TodoError(TodoErrorCodes.STORAGE_ERROR, 'Failed to persist todos', { error });
        }
    }

    /**
     * Notifies operation callback
     * @param todo The todo involved in the operation
     * @param operation The operation performed
     */
    private _notifyOperation(todo: ITodo, operation: string): void {
        if (this.onTodoOperation) {
            this.onTodoOperation(todo, operation);
        }
    }

    /**
     * Validates todo text
     * @param text The text to validate
     * @throws TodoError if text is invalid
     */
    private _validateTodoText(text: string): void {
        if (!text || typeof text !== 'string') {
            throw new TodoError(TodoErrorCodes.VALIDATION_FAILED, 'Todo text is required');
        }
        
        const trimmedText = text.trim();
        if (trimmedText.length === 0) {
            throw new TodoError(TodoErrorCodes.VALIDATION_FAILED, 'Todo text cannot be empty');
        }
        
        if (trimmedText.length > TodoConstants.VALIDATION.MAX_TEXT_LENGTH) {
            throw new TodoError(
                TodoErrorCodes.VALIDATION_FAILED,
                `Todo text cannot exceed ${TodoConstants.VALIDATION.MAX_TEXT_LENGTH} characters`
            );
        }
    }

    /**
     * Finds todo by ID
     * @param id The todo ID
     * @returns The found todo or null
     */
    private _findTodoById(id: string): ITodo | null {
        return this.todos.find(todo => todo.id === id) || null;
    }

    // ==================== CRUD OPERATIONS ====================

    /**
     * Adds a new todo to the list
     * @param text The text content of the new todo
     * @param priority Optional priority level
     * @returns The created todo
     */
    public addTodo(text: string, priority: TodoPriority = TodoPriority.MEDIUM): ITodo {
        this._validateTodoText(text);

        const newTodo = new Todo({ 
            text: text.trim(),
            priority: priority
        });
        
        this.todos.push(newTodo);
        this._commit(this.todos);
        this._notifyOperation(newTodo, 'add');
        
        return newTodo;
    }

    /**
     * Gets a todo by ID
     * @param id The ID of the todo to retrieve
     * @returns The todo or null if not found
     */
    public getTodo(id: string): ITodo | null {
        return this._findTodoById(id);
    }

    /**
     * Updates a todo with partial data
     * @param id The ID of the todo to update
     * @param updates The partial updates to apply
     * @returns The updated todo
     */
    public updateTodo(id: string, updates: ITodoUpdate): ITodo {
        const todo = this._findTodoById(id);
        if (!todo) {
            throw new TodoError(TodoErrorCodes.TODO_NOT_FOUND, `Todo with id ${id} not found`);
        }

        // Validate text if being updated
        if (updates.text !== undefined) {
            this._validateTodoText(updates.text);
        }

        // Create updated todo
        const updatedTodo = new Todo({
            ...todo,
            ...updates,
            text: updates.text?.trim() || todo.text
        });

        // Replace in array
        this.todos = this.todos.map(t => t.id === id ? updatedTodo : t);
        this._commit(this.todos);
        this._notifyOperation(updatedTodo, 'update');

        return updatedTodo;
    }

    /**
     * Edits an existing todo's text (legacy method)
     * @param id The ID of the todo to edit
     * @param updatedText The new text for the todo
     */
    public editTodo(id: string, updatedText: string): void {
        this.updateTodo(id, { text: updatedText });
    }

    /**
     * Deletes a todo from the list
     * @param id The ID of the todo to delete
     * @returns True if deleted, false if not found
     */
    public deleteTodo(id: string): boolean {
        const todo = this._findTodoById(id);
        if (!todo) {
            return false;
        }

        this.todos = this.todos.filter(t => t.id !== id);
        this._commit(this.todos);
        this._notifyOperation(todo, 'delete');
        
        return true;
    }

    /**
     * Toggles the completion status of a todo
     * @param id The ID of the todo to toggle
     * @returns The updated todo
     */
    public toggleTodo(id: string): ITodo {
        const todo = this._findTodoById(id);
        if (!todo) {
            throw new TodoError(TodoErrorCodes.TODO_NOT_FOUND, `Todo with id ${id} not found`);
        }

        return this.updateTodo(id, { 
            complete: !todo.complete,
            status: !todo.complete ? TodoStatus.COMPLETED : TodoStatus.PENDING
        });
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Adds multiple todos at once
     * @param texts Array of todo texts
     * @returns Array of created todos
     */
    public addMultipleTodos(texts: string[]): ITodo[] {
        const newTodos: ITodo[] = [];
        
        for (const text of texts) {
            try {
                this._validateTodoText(text);
                const todo = new Todo({ text: text.trim() });
                newTodos.push(todo);
            } catch (error) {
                console.warn(`Skipping invalid todo text: ${text}`, error);
            }
        }

        this.todos.push(...newTodos);
        this._commit(this.todos);
        
        newTodos.forEach(todo => this._notifyOperation(todo, 'add'));
        return newTodos;
    }

    /**
     * Deletes multiple todos by IDs
     * @param ids Array of todo IDs to delete
     * @returns Number of todos actually deleted
     */
    public deleteMultipleTodos(ids: string[]): number {
        const initialLength = this.todos.length;
        const todosToDelete = this.todos.filter(todo => ids.includes(todo.id));
        
        this.todos = this.todos.filter(todo => !ids.includes(todo.id));
        this._commit(this.todos);
        
        todosToDelete.forEach(todo => this._notifyOperation(todo, 'delete'));
        return initialLength - this.todos.length;
    }

    /**
     * Updates multiple todos with different data
     * @param updates Array of update objects with id and data
     * @returns Array of updated todos
     */
    public updateMultipleTodos(updates: { id: string; data: ITodoUpdate }[]): ITodo[] {
        const updatedTodos: ITodo[] = [];

        for (const { id, data } of updates) {
            try {
                const updatedTodo = this.updateTodo(id, data);
                updatedTodos.push(updatedTodo);
            } catch (error) {
                console.warn(`Failed to update todo ${id}:`, error);
            }
        }

        return updatedTodos;
    }

    /**
     * Marks all todos as completed or uncompleted
     * @param complete Whether to mark all as complete or incomplete
     * @returns Array of updated todos
     */
    public toggleAll(complete: boolean): ITodo[] {
        const updates = this.todos.map(todo => ({
            id: todo.id,
            data: { 
                complete: complete,
                status: complete ? TodoStatus.COMPLETED : TodoStatus.PENDING
            }
        }));

        return this.updateMultipleTodos(updates);
    }

    /**
     * Clears all completed todos
     * @returns Number of todos removed
     */
    public clearCompleted(): number {
        const completedIds = this.todos
            .filter(todo => todo.complete)
            .map(todo => todo.id);
            
        return this.deleteMultipleTodos(completedIds);
    }

    // ==================== SEARCH AND FILTER OPERATIONS ====================

    /**
     * Finds todos based on filter criteria
     * @param filter The filter criteria
     * @returns Array of matching todos
     */
    public findTodos(filter: ITodoFilter): ITodo[] {
        return [...TodoModelUtils.filterTodos(this.todos, filter)];
    }

    /**
     * Searches todos by text query
     * @param query The search query
     * @returns Array of matching todos
     */
    public searchTodos(query: string): ITodo[] {
        if (!query.trim()) {
            return [...this.todos];
        }

        const searchTerm = query.toLowerCase().trim();
        return this.todos.filter(todo => 
            todo.text.toLowerCase().includes(searchTerm) ||
            (todo.description && todo.description.toLowerCase().includes(searchTerm)) ||
            (todo.tags && todo.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    /**
     * Gets todos by status
     * @param status The status to filter by
     * @returns Array of todos with the specified status
     */
    public getTodosByStatus(status: TodoStatus): ITodo[] {
        return this.todos.filter(todo => todo.status === status);
    }

    /**
     * Gets todos by priority
     * @param priority The priority to filter by
     * @returns Array of todos with the specified priority
     */
    public getTodosByPriority(priority: TodoPriority): ITodo[] {
        return this.todos.filter(todo => todo.priority === priority);
    }

    /**
     * Gets overdue todos
     * @returns Array of overdue todos
     */
    public getOverdueTodos(): ITodo[] {
        const now = new Date();
        return this.todos.filter(todo => 
            todo.dueDate && 
            todo.dueDate < now && 
            !todo.complete
        );
    }

    /**
     * Gets todos due today
     * @returns Array of todos due today
     */
    public getDueTodosToday(): ITodo[] {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0); // Start of today

        return this.todos.filter(todo => 
            todo.dueDate && 
            todo.dueDate >= startOfDay && 
            todo.dueDate <= today &&
            !todo.complete
        );
    }

    // ==================== SORTING OPERATIONS ====================

    /**
     * Sorts todos based on sort criteria
     * @param sort The sort criteria
     * @returns Array of sorted todos
     */
    public sortTodos(sort: ITodoSort): ITodo[] {
        return [...TodoModelUtils.sortTodos(this.todos, sort)];
    }

    /**
     * Gets todos sorted by a specific field
     * @param criteria The field to sort by
     * @param ascending Whether to sort ascending (default: true)
     * @returns Array of sorted todos
     */
    public getTodosSorted(criteria: keyof ITodo, ascending: boolean = true): ITodo[] {
        return this.sortTodos({
            field: criteria,
            direction: ascending ? 'asc' : 'desc'
        });
    }

    // ==================== STATISTICS AND ANALYTICS ====================

    /**
     * Gets the current count of todos
     * @returns Object with total, completed, and pending counts
     */
    public getTodoCount(): { total: number; completed: number; pending: number } {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.complete).length;
        const pending = total - completed;

        return { total, completed, pending };
    }

    /**
     * Gets comprehensive statistics
     * @returns Detailed statistics object
     */
    public getStatistics(): ITodoServiceStatistics {
        const counts = this.getTodoCount();
        
        // Priority distribution
        const priorityDistribution = Object.values(TodoPriority).reduce((acc, priority) => {
            acc[priority] = this.todos.filter(todo => todo.priority === priority).length;
            return acc;
        }, {} as Record<TodoPriority, number>);

        // Status distribution
        const statusDistribution = Object.values(TodoStatus).reduce((acc, status) => {
            acc[status] = this.todos.filter(todo => todo.status === status).length;
            return acc;
        }, {} as Record<TodoStatus, number>);

        // Completion rate
        const completionRate = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0;

        // Average completion time (for completed todos)
        const completedTodos = this.todos.filter(todo => todo.complete);
        let averageCompletionTime: number | undefined;
        
        if (completedTodos.length > 0) {
            const totalCompletionTime = completedTodos.reduce((sum, todo) => {
                return sum + (todo.updatedAt.getTime() - todo.createdAt.getTime());
            }, 0);
            averageCompletionTime = totalCompletionTime / completedTodos.length;
        }

        return {
            total: counts.total,
            completed: counts.completed,
            pending: counts.pending,
            completionRate,
            ...(averageCompletionTime !== undefined && { averageCompletionTime }),
            priorityDistribution,
            statusDistribution
        };
    }

    /**
     * Gets the completion rate as a percentage
     * @returns Completion rate (0-100)
     */
    public getCompletionRate(): number {
        const counts = this.getTodoCount();
        return counts.total > 0 ? (counts.completed / counts.total) * 100 : 0;
    }

    /**
     * Gets priority distribution
     * @returns Object with counts per priority level
     */
    public getPriorityDistribution(): Record<TodoPriority, number> {
        return Object.values(TodoPriority).reduce((acc, priority) => {
            acc[priority] = this.todos.filter(todo => todo.priority === priority).length;
            return acc;
        }, {} as Record<TodoPriority, number>);
    }

    // ==================== DATA MANAGEMENT ====================

    /**
     * Exports todos as JSON string
     * @returns JSON string of all todos
     */
    public exportTodos(): string {
        const exportData = {
            version: TodoConstants.STORAGE.CURRENT_VERSION,
            timestamp: new Date().toISOString(),
            todos: this.todos
        };
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Imports todos from JSON string
     * @param data JSON string containing todos
     * @returns Number of todos imported
     */
    public importTodos(data: string): number {
        try {
            const importData = JSON.parse(data);
            
            if (!importData.todos || !Array.isArray(importData.todos)) {
                throw new TodoError(TodoErrorCodes.INVALID_DATA, 'Invalid import data format');
            }

            const importedTodos = importData.todos.map((todo: ITodoData) => new Todo(todo));
            const validTodos = importedTodos.filter((todo: ITodo) => this.validateTodo(todo));

            this.todos.push(...validTodos);
            this._commit(this.todos);

            return validTodos.length;
        } catch (error) {
            if (error instanceof TodoError) {
                throw error;
            }
            throw new TodoError(TodoErrorCodes.INVALID_DATA, 'Failed to parse import data', { error });
        }
    }

    /**
     * Creates a backup of current todos
     * @returns Backup string
     */
    public backupTodos(): string {
        const backup = this.exportTodos();
        try {
            localStorage.setItem(TodoConstants.STORAGE.BACKUP_KEY, backup);
        } catch (error) {
            console.warn('Failed to store backup in localStorage:', error);
        }
        return backup;
    }

    /**
     * Restores todos from backup
     * @param backup Backup string
     * @returns True if successful
     */
    public restoreFromBackup(backup: string): boolean {
        try {
            // Clear current todos
            this.todos = [];
            
            // Import from backup
            this.importTodos(backup);
            
            return true;
        } catch (error) {
            console.error('Failed to restore from backup:', error);
            return false;
        }
    }

    /**
     * Clears all todos
     */
    public clearAllTodos(): void {
        this.todos = [];
        this._commit(this.todos);
    }

    // ==================== VALIDATION AND INTEGRITY ====================

    /**
     * Validates a single todo
     * @param todo The todo to validate
     * @returns True if valid
     */
    public validateTodo(todo: ITodo): boolean {
        try {
            if (!todo.id || !todo.text) {
                return false;
            }
            
            this._validateTodoText(todo.text);
            
            // Validate dates
            if (todo.dueDate && isNaN(todo.dueDate.getTime())) {
                return false;
            }
            
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validates all todos and returns invalid ones
     * @returns Array of invalid todos
     */
    public validateTodos(): ITodo[] {
        return this.todos.filter(todo => !this.validateTodo(todo));
    }

    /**
     * Repairs data by removing invalid todos
     * @returns Number of todos removed
     */
    public repairData(): number {
        const initialLength = this.todos.length;
        this.todos = this.todos.filter(todo => this.validateTodo(todo));
        
        if (this.todos.length !== initialLength) {
            this._commit(this.todos);
        }
        
        return initialLength - this.todos.length;
    }
}