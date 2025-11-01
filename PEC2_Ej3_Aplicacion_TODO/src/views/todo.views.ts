import { ITodo, TodoStatus, TodoPriority } from '../models/todo.model';
import { TodoConstants } from '../models/todo-constants.model';

/**
 * @type EventHandler
 * 
 * Generic event handler type
 */
export type EventHandler<T = string> = (arg: T) => void;
export type EditEventHandler = (id: string, text: string) => void;
export type FilterEventHandler = (filter: string) => void;
export type BulkEventHandler = (action: string) => void;

/**
 * @interface ITodoViewCallbacks
 * 
 * Interface for all view event callbacks
 */
export interface ITodoViewCallbacks {
    onAddTodo?: EventHandler<string>;
    onEditTodo?: EditEventHandler;
    onDeleteTodo?: EventHandler<string>;
    onToggleTodo?: EventHandler<string>;
    onFilterTodos?: FilterEventHandler;
    onClearCompleted?: EventHandler<void>;
    onToggleAll?: EventHandler<boolean>;
}

/**
 * @interface ITodoView
 * 
 * Interface defining comprehensive view operations
 */
export interface ITodoView {
    // Core display operations
    displayTodos(todos: ITodo[]): void;
    updateTodo(todo: ITodo): void;
    removeTodo(id: string): void;
    
    // Event binding
    bindAddTodo(handler: EventHandler<string>): void;
    bindEditTodo(handler: EditEventHandler): void;
    bindDeleteTodo(handler: EventHandler<string>): void;
    bindToggleTodo(handler: EventHandler<string>): void;
    bindFilterTodos(handler: FilterEventHandler): void;
    bindClearCompleted(handler: EventHandler<void>): void;
    bindToggleAll(handler: EventHandler<boolean>): void;
    
    // UI feedback
    showError(message: string): void;
    showSuccess(message: string): void;
    showLoading(show: boolean): void;
    
    // Utility methods
    clearInput(): void;
    focusInput(): void;
    updateCounter(total: number, completed: number): void;
}

/**
 * @class TodoView
 * 
 * Comprehensive view class for all TODO UI operations.
 * Handles DOM manipulation, user interactions, and visual feedback efficiently.
 */
export class TodoView implements ITodoView {
    private app: HTMLElement;
    private form!: HTMLFormElement;
    private input!: HTMLInputElement;
    private submitButton!: HTMLButtonElement;
    private filterSelect!: HTMLSelectElement;
    private counterDiv!: HTMLDivElement;
    private bulkActionsDiv!: HTMLDivElement;
    private todoList!: HTMLUListElement;
    private loadingDiv!: HTMLDivElement;
    private _temporaryTodoText: string = '';

    constructor() {
        this.app = this.getElement('#root') as HTMLElement;
        
        if (!this.app) {
            throw new Error('Root element with id "root" not found');
        }

        this.initializeDOM();
        this._initLocalListeners();
    }

    // ==================== INITIALIZATION ====================

    /**
     * Initializes the DOM structure efficiently
     */
    private initializeDOM(): void {
        // Create header with title and counter
        const header = this.createElement('div', 'todo-header');
        const title = this.createElement('h1');
        title.textContent = 'TODO Application';
        this.counterDiv = this.createElement('div', 'todo-counter') as HTMLDivElement;
        this.counterDiv.textContent = '0 items';
        header.append(title, this.counterDiv);

        // Create input form with filter
        const inputContainer = this.createElement('div', 'input-container');
        this.form = this.createElement('form', 'todo-form') as HTMLFormElement;
        
        this.input = this.createElement('input', 'todo-input') as HTMLInputElement;
        this.input.type = 'text';
        this.input.placeholder = 'What needs to be done?';
        this.input.maxLength = TodoConstants.VALIDATION.MAX_TEXT_LENGTH;
        this.input.required = true;

        this.submitButton = this.createElement('button', 'todo-submit') as HTMLButtonElement;
        this.submitButton.textContent = 'Add';
        this.submitButton.type = 'submit';

        this.form.append(this.input, this.submitButton);

        // Create filter dropdown
        this.filterSelect = this.createElement('select', 'todo-filter') as HTMLSelectElement;
        const filterOptions = [
            { value: 'all', text: 'All' },
            { value: 'active', text: 'Active' },
            { value: 'completed', text: 'Completed' }
        ];
        filterOptions.forEach(option => {
            const opt = this.createElement('option') as HTMLOptionElement;
            opt.value = option.value;
            opt.textContent = option.text;
            this.filterSelect.append(opt);
        });

        inputContainer.append(this.form, this.filterSelect);

        // Create bulk actions
        this.bulkActionsDiv = this.createElement('div', 'bulk-actions') as HTMLDivElement;
        const toggleAllBtn = this.createElement('button', 'toggle-all-btn') as HTMLButtonElement;
        toggleAllBtn.textContent = 'Toggle All';
        toggleAllBtn.type = 'button';
        
        const clearCompletedBtn = this.createElement('button', 'clear-completed-btn') as HTMLButtonElement;
        clearCompletedBtn.textContent = 'Clear Completed';
        clearCompletedBtn.type = 'button';
        
        this.bulkActionsDiv.append(toggleAllBtn, clearCompletedBtn);

        // Create todo list
        this.todoList = this.createElement('ul', 'todo-list') as HTMLUListElement;

        // Create loading indicator
        this.loadingDiv = this.createElement('div', 'loading-indicator') as HTMLDivElement;
        this.loadingDiv.textContent = 'Loading...';
        this.loadingDiv.style.display = 'none';

        // Assemble UI
        this.app.append(header, inputContainer, this.bulkActionsDiv, this.loadingDiv, this.todoList);
    }

    // ==================== UTILITY METHODS ====================

    private get _todoText(): string {
        return this.input.value.trim();
    }

    private createElement(tag: string, className?: string): HTMLElement {
        const element = document.createElement(tag);
        if (className) {
            // Split className by spaces and add each class individually
            const classes = className.split(' ').filter(cls => cls.trim().length > 0);
            element.classList.add(...classes);
        }
        return element;
    }

    private getElement(selector: string): HTMLElement | null {
        return document.querySelector(selector);
    }

    private showMessage(message: string, type: 'error' | 'success' | 'info' = 'info'): void {
        // Remove existing messages
        this.app.querySelectorAll('.message').forEach(el => el.remove());

        const messageDiv = this.createElement('div', `message message-${type}`) as HTMLDivElement;
        messageDiv.textContent = message;
        
        // Style based on type
        const styles = {
            error: { color: '#721c24', backgroundColor: '#f8d7da', borderColor: '#f5c6cb' },
            success: { color: '#155724', backgroundColor: '#d4edda', borderColor: '#c3e6cb' },
            info: { color: '#0c5460', backgroundColor: '#d1ecf1', borderColor: '#bee5eb' }
        };
        
        Object.assign(messageDiv.style, {
            padding: '8px 16px',
            margin: '10px 0',
            border: '1px solid',
            borderRadius: '4px',
            ...styles[type]
        });

        this.app.insertBefore(messageDiv, this.todoList);
        setTimeout(() => messageDiv.remove(), 3000);
    }

    // ==================== DISPLAY OPERATIONS ====================

    public displayTodos(todos: ITodo[]): void {
        // Clear existing todos efficiently
        this.todoList.innerHTML = '';

        if (todos.length === 0) {
            const emptyState = this.createElement('li', 'empty-state');
            emptyState.textContent = TodoConstants.UI.EMPTY_STATE_MESSAGE;
            this.todoList.append(emptyState);
            return;
        }

        // Create todo items efficiently using DocumentFragment
        const fragment = document.createDocumentFragment();
        todos.forEach(todo => fragment.appendChild(this.createTodoElement(todo)));
        this.todoList.appendChild(fragment);
    }

    public updateTodo(todo: ITodo): void {
        const existingElement = document.getElementById(todo.id);
        if (existingElement) {
            existingElement.replaceWith(this.createTodoElement(todo));
        }
    }

    public removeTodo(id: string): void {
        const element = document.getElementById(id);
        element?.remove();
    }

    // ==================== EVENT BINDING ====================

    public bindAddTodo(handler: EventHandler<string>): void {
        this.form.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            if (this._todoText) {
                handler(this._todoText);
                this.clearInput();
            }
        });
    }

    public bindEditTodo(handler: EditEventHandler): void {
        this.todoList.addEventListener('focusout', (e: Event) => {
            if (this._temporaryTodoText) {
                const target = e.target as HTMLElement;
                const listItem = target.closest('.todo-item') as HTMLLIElement;
                if (listItem?.id) {
                    handler(listItem.id, this._temporaryTodoText);
                    this._temporaryTodoText = '';
                }
            }
        });
    }

    public bindDeleteTodo(handler: EventHandler<string>): void {
        this.todoList.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('delete-btn')) {
                const listItem = target.closest('.todo-item') as HTMLLIElement;
                listItem?.id && handler(listItem.id);
            }
        });
    }

    public bindToggleTodo(handler: EventHandler<string>): void {
        this.todoList.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.type === 'checkbox') {
                const listItem = target.closest('.todo-item') as HTMLLIElement;
                listItem?.id && handler(listItem.id);
            }
        });
    }

    public bindFilterTodos(handler: FilterEventHandler): void {
        this.filterSelect.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLSelectElement;
            handler(target.value);
        });
    }

    public bindClearCompleted(handler: EventHandler<void>): void {
        this.bulkActionsDiv.querySelector('.clear-completed-btn')!
            .addEventListener('click', () => handler());
    }

    public bindToggleAll(handler: EventHandler<boolean>): void {
        this.bulkActionsDiv.querySelector('.toggle-all-btn')!
            .addEventListener('click', () => {
                const hasIncomplete = this.todoList.querySelectorAll('input[type="checkbox"]:not(:checked)').length > 0;
                handler(hasIncomplete);
            });
    }

    // ==================== UI FEEDBACK ====================

    public showError(message: string): void {
        this.showMessage(message, 'error');
    }

    public showSuccess(message: string): void {
        this.showMessage(message, 'success');
    }

    public showLoading(show: boolean): void {
        this.loadingDiv.style.display = show ? 'block' : 'none';
    }

    // ==================== UTILITY METHODS ====================

    public clearInput(): void {
        this.input.value = '';
        this.input.focus();
    }

    public focusInput(): void {
        this.input.focus();
    }

    public updateCounter(total: number, completed: number): void {
        const pending = total - completed;
        this.counterDiv.textContent = `${pending} of ${total} items`;
    }

    // ==================== PRIVATE METHODS ====================

    private createTodoElement(todo: ITodo): HTMLLIElement {
        const li = this.createElement('li', 'todo-item') as HTMLLIElement;
        li.id = todo.id;
        
        // Add status classes
        if (todo.complete) li.classList.add('completed');
        if (todo.priority === TodoPriority.HIGH) li.classList.add('high-priority');
        if (todo.priority === TodoPriority.CRITICAL) li.classList.add('critical-priority');

        // Checkbox
        const checkbox = this.createElement('input', 'todo-checkbox') as HTMLInputElement;
        checkbox.type = 'checkbox';
        checkbox.checked = todo.complete;

        // Text content (editable)
        const textSpan = this.createElement('span', 'todo-text') as HTMLSpanElement;
        textSpan.contentEditable = 'true';
        textSpan.textContent = todo.text;
        
        // Priority indicator
        const prioritySpan = this.createElement('span', 'todo-priority') as HTMLSpanElement;
        prioritySpan.textContent = todo.priority;
        prioritySpan.title = `Priority: ${todo.priority}`;

        // Delete button
        const deleteBtn = this.createElement('button', 'delete-btn') as HTMLButtonElement;
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Delete todo';

        li.append(checkbox, textSpan, prioritySpan, deleteBtn);
        return li;
    }

    private _initLocalListeners(): void {
        // Handle editable text input
        this.todoList.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('todo-text')) {
                this._temporaryTodoText = target.textContent || '';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        this.focusInput();
                        e.preventDefault();
                        break;
                }
            }
        });

        // Form validation
        this.input.addEventListener('input', () => {
            const isValid = this.input.value.trim().length > 0;
            this.submitButton.disabled = !isValid;
        });
    }
}