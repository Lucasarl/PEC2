import { ITodoService, TodoListChangedCallback, TodoOperationCallback } from '../services/todo.service';
import { ITodoView, EventHandler, EditEventHandler, FilterEventHandler } from '../views/todo.views';
import { ITodo, TodoPriority } from '../models/todo.model';
import { TodoError, TodoErrorCodes } from '../models/todo-constants.model';

/**
 * @interface ITodoController
 * 
 * Interface defining comprehensive controller operations for MVC communication
 */
export interface ITodoController {
    // Core event handlers
    onTodoListChanged: TodoListChangedCallback;
    onTodoOperation: TodoOperationCallback;
    
    // Basic CRUD handlers
    handleAddTodo: EventHandler<string>;
    handleEditTodo: EditEventHandler;
    handleDeleteTodo: EventHandler<string>;
    handleToggleTodo: EventHandler<string>;
    
    // Advanced handlers
    handleFilterTodos: FilterEventHandler;
    handleClearCompleted: EventHandler<void>;
    handleToggleAll: EventHandler<boolean>;
    
    // Utility methods
    refreshView(): void;
    updateCounter(): void;
    setFilter(filter: string): void;
}

/**
 * @class TodoController
 * 
 * Comprehensive controller that efficiently manages all communication between
 * the service and view layers in the MVC architecture.
 */
export class TodoController implements ITodoController {
    private service: ITodoService;
    private view: ITodoView;
    private currentFilter: string = 'all';
    private filteredTodos: ITodo[] = [];

    constructor(service: ITodoService, view: ITodoView) {
        this.service = service;
        this.view = view;
        
        this.initializeEventBindings();
        this.initializeApplication();
    }

    // ==================== INITIALIZATION ====================

    /**
     * Binds all service and view events efficiently
     */
    private initializeEventBindings(): void {
        // Service event bindings
        this.service.bindTodoListChanged(this.onTodoListChanged);
        this.service.bindTodoOperation(this.onTodoOperation);
        
        // View event bindings
        this.view.bindAddTodo(this.handleAddTodo);
        this.view.bindEditTodo(this.handleEditTodo);
        this.view.bindDeleteTodo(this.handleDeleteTodo);
        this.view.bindToggleTodo(this.handleToggleTodo);
        this.view.bindFilterTodos(this.handleFilterTodos);
        this.view.bindClearCompleted(this.handleClearCompleted);
        this.view.bindToggleAll(this.handleToggleAll);
    }

    /**
     * Initializes the application state
     */
    private initializeApplication(): void {
        // Display initial todos and update counter
        this.refreshView();
        this.updateCounter();
        
        // Focus input for better UX
        this.view.focusInput();
    }

    // ==================== SERVICE CALLBACKS ====================

    /**
     * Handles todo list changes from service
     * @param todos Updated todo list
     */
    public onTodoListChanged = (todos: ITodo[]): void => {
        try {
            this.applyCurrentFilter(todos);
            this.updateCounter();
        } catch (error) {
            this.handleError('Failed to update todo list', error);
        }
    };

    /**
     * Handles individual todo operations from service
     * @param todo The affected todo
     * @param operation The operation performed
     */
    public onTodoOperation = (todo: ITodo, operation: string): void => {
        try {
            // Provide user feedback for operations
            switch (operation) {
                case 'add':
                    this.view.showSuccess('Todo added successfully');
                    break;
                case 'update':
                    this.view.showSuccess('Todo updated');
                    break;
                case 'delete':
                    this.view.showSuccess('Todo deleted');
                    break;
            }
        } catch (error) {
            console.warn('Error handling todo operation feedback:', error);
        }
    };

    // ==================== VIEW EVENT HANDLERS ====================

    /**
     * Handles adding a new todo
     * @param todoText Text content for the new todo
     */
    public handleAddTodo = (todoText: string): void => {
        try {
            this.validateTodoText(todoText);
            
            // Determine priority based on text content (simple heuristic)
            const priority = this.determinePriority(todoText);
            
            this.service.addTodo(todoText, priority);
            this.view.clearInput();
        } catch (error) {
            this.handleError('Failed to add todo', error);
        }
    };

    /**
     * Handles editing an existing todo
     * @param id Todo ID to edit
     * @param todoText New text content
     */
    public handleEditTodo = (id: string, todoText: string): void => {
        try {
            this.validateTodoText(todoText);
            this.validateId(id);
            
            this.service.editTodo(id, todoText);
        } catch (error) {
            this.handleError('Failed to edit todo', error);
        }
    };

    /**
     * Handles deleting a todo
     * @param id Todo ID to delete
     */
    public handleDeleteTodo = (id: string): void => {
        try {
            this.validateId(id);
            
            const success = this.service.deleteTodo(id);
            if (!success) {
                this.view.showError('Todo not found');
            }
        } catch (error) {
            this.handleError('Failed to delete todo', error);
        }
    };

    /**
     * Handles toggling todo completion
     * @param id Todo ID to toggle
     */
    public handleToggleTodo = (id: string): void => {
        try {
            this.validateId(id);
            this.service.toggleTodo(id);
        } catch (error) {
            this.handleError('Failed to toggle todo', error);
        }
    };

    /**
     * Handles filtering todos
     * @param filter Filter criteria ('all', 'active', 'completed')
     */
    public handleFilterTodos = (filter: string): void => {
        try {
            this.setFilter(filter);
        } catch (error) {
            this.handleError('Failed to filter todos', error);
        }
    };

    /**
     * Handles clearing completed todos
     */
    public handleClearCompleted = (): void => {
        try {
            const count = this.service.clearCompleted();
            if (count > 0) {
                this.view.showSuccess(`Cleared ${count} completed todos`);
            } else {
                this.view.showError('No completed todos to clear');
            }
        } catch (error) {
            this.handleError('Failed to clear completed todos', error);
        }
    };

    /**
     * Handles toggling all todos
     * @param complete Whether to mark all as complete
     */
    public handleToggleAll = (complete: boolean): void => {
        try {
            const updatedTodos = this.service.toggleAll(complete);
            const action = complete ? 'completed' : 'activated';
            this.view.showSuccess(`All todos ${action} (${updatedTodos.length} items)`);
        } catch (error) {
            this.handleError('Failed to toggle all todos', error);
        }
    };

    // ==================== UTILITY METHODS ====================

    /**
     * Refreshes the entire view with current data
     */
    public refreshView(): void {
        try {
            this.applyCurrentFilter(this.service.todos);
            this.updateCounter();
        } catch (error) {
            this.handleError('Failed to refresh view', error);
        }
    }

    /**
     * Updates the todo counter in the view
     */
    public updateCounter(): void {
        try {
            const stats = this.service.getTodoCount();
            this.view.updateCounter(stats.total, stats.completed);
        } catch (error) {
            console.warn('Error updating counter:', error);
        }
    }

    /**
     * Sets the current filter and updates display
     * @param filter Filter type
     */
    public setFilter(filter: string): void {
        this.currentFilter = filter;
        this.applyCurrentFilter(this.service.todos);
    }

    // ==================== PRIVATE HELPER METHODS ====================

    /**
     * Applies the current filter to todos and updates view
     * @param todos All todos from service
     */
    private applyCurrentFilter(todos: ITodo[]): void {
        switch (this.currentFilter) {
            case 'active':
                this.filteredTodos = todos.filter(todo => !todo.complete);
                break;
            case 'completed':
                this.filteredTodos = todos.filter(todo => todo.complete);
                break;
            case 'all':
            default:
                this.filteredTodos = [...todos];
                break;
        }
        
        this.view.displayTodos(this.filteredTodos);
    }

    /**
     * Determines priority based on todo text content
     * @param text Todo text
     * @returns Determined priority
     */
    private determinePriority(text: string): TodoPriority {
        const urgentKeywords = ['urgent', 'asap', 'critical', 'emergency', '!!!'];
        const highKeywords = ['important', 'high', 'priority', '!!'];
        
        const lowerText = text.toLowerCase();
        
        if (urgentKeywords.some(keyword => lowerText.includes(keyword))) {
            return TodoPriority.CRITICAL;
        }
        
        if (highKeywords.some(keyword => lowerText.includes(keyword))) {
            return TodoPriority.HIGH;
        }
        
        return TodoPriority.MEDIUM;
    }

    /**
     * Validates todo text input
     * @param text Text to validate
     * @throws TodoError if invalid
     */
    private validateTodoText(text: string): void {
        if (!text || typeof text !== 'string' || !text.trim()) {
            throw new TodoError(TodoErrorCodes.VALIDATION_FAILED, 'Todo text cannot be empty');
        }
    }

    /**
     * Validates todo ID
     * @param id ID to validate
     * @throws TodoError if invalid
     */
    private validateId(id: string): void {
        if (!id || typeof id !== 'string') {
            throw new TodoError(TodoErrorCodes.VALIDATION_FAILED, 'Invalid todo ID');
        }
    }

    /**
     * Handles errors consistently across the controller
     * @param message User-friendly error message
     * @param error Original error
     */
    private handleError(message: string, error: any): void {
        console.error(message, error);
        
        // Show appropriate error message
        if (error instanceof TodoError) {
            this.view.showError(error.message);
        } else {
            this.view.showError(message);
        }
    }

    // ==================== LEGACY METHODS (for compatibility) ====================

    /**
     * Gets statistics about todos
     * @returns Todo statistics
     */
    public getStatistics(): { total: number; completed: number; pending: number } {
        return this.service.getTodoCount();
    }

    /**
     * Legacy method for clearing completed todos
     */
    public clearCompleted(): void {
        this.handleClearCompleted();
    }

    /**
     * Legacy method for toggling all todos
     * @param complete Whether to mark all as complete
     */
    public toggleAll(complete: boolean): void {
        this.handleToggleAll(complete);
    }
}