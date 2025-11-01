/**
 * @enum TodoStatus
 * 
 * Enumeration of possible TODO statuses
 */
export enum TodoStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    ARCHIVED = 'archived'
}

/**
 * @enum TodoPriority
 * 
 * Enumeration of TODO priority levels
 */
export enum TodoPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

/**
 * @interface ITodoBase
 * 
 * Base interface defining core TODO properties
 */
export interface ITodoBase {
    readonly id: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

/**
 * @interface ITodoContent
 * 
 * Interface defining the content properties of a TODO
 */
export interface ITodoContent {
    text: string;
    description: string | undefined;
    complete: boolean;
    status: TodoStatus;
    priority: TodoPriority;
    dueDate: Date | undefined;
    tags: string[];
}

/**
 * @interface ITodo
 * 
 * Complete interface defining the structure of a TODO item
 * Combines base properties with content properties
 */
export interface ITodo extends ITodoBase, ITodoContent {
    // Computed properties
    readonly isOverdue: boolean;
    readonly isPending: boolean;
    readonly isCompleted: boolean;
}

/**
 * @interface ITodoData
 * 
 * Interface for creating a new TODO item
 * Contains only the required and optional user-provided data
 */
export interface ITodoData {
    text: string;
    description?: string | undefined;
    complete?: boolean;
    status?: TodoStatus;
    priority?: TodoPriority;
    dueDate?: Date | undefined;
    tags?: string[];
}

/**
 * @interface ITodoUpdate
 * 
 * Interface for updating an existing TODO item
 * All content properties are optional for partial updates
 */
export interface ITodoUpdate extends Partial<ITodoContent> {
    // Explicitly define which properties can be updated
}

/**
 * @interface ITodoValidation
 * 
 * Interface for TODO validation results
 */
export interface ITodoValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * @interface ITodoFilter
 * 
 * Interface for filtering TODO items
 */
export interface ITodoFilter {
    status?: TodoStatus | TodoStatus[];
    priority?: TodoPriority | TodoPriority[];
    complete?: boolean;
    tags?: string | string[];
    dueBefore?: Date;
    dueAfter?: Date;
    searchText?: string;
}

/**
 * @interface ITodoSort
 * 
 * Interface for sorting TODO items
 */
export interface ITodoSort {
    field: keyof ITodo;
    direction: 'asc' | 'desc';
}

/**
 * @type TodoCollection
 * 
 * Type alias for a collection of TODO items
 */
export type TodoCollection = ReadonlyArray<ITodo>;

/**
 * @type TodoMap
 * 
 * Type alias for a map of TODO items indexed by ID
 */
export type TodoMap = ReadonlyMap<string, ITodo>;

/**
 * @class Todo
 * 
 * Anemic domain model class representing a TODO item.
 * Contains data and basic operations following the anemic domain model pattern.
 * Business logic is handled by services, keeping the model focused on data representation.
 */
export class Todo implements ITodo {
    // Base properties (readonly after creation)
    public readonly id: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    // Content properties (mutable)
    public text: string;
    public description: string | undefined;
    public complete: boolean;
    public status: TodoStatus;
    public priority: TodoPriority;
    public dueDate: Date | undefined;
    public tags: string[];

    // Computed properties (getters implementing interface requirements)
    public get isOverdue(): boolean {
        if (!this.dueDate) return false;
        return new Date() > this.dueDate && !this.complete;
    }

    public get isPending(): boolean {
        return this.status === TodoStatus.PENDING && !this.complete;
    }

    public get isCompleted(): boolean {
        return this.complete && this.status === TodoStatus.COMPLETED;
    }

    constructor(data: ITodoData) {
        // Validate input data
        const validation = Todo.validateData(data);
        if (!validation.isValid) {
            throw new Error(`Invalid TODO data: ${validation.errors.join(', ')}`);
        }

        // Initialize base properties
        this.id = this.generateId();
        this.createdAt = new Date();
        this.updatedAt = new Date();

        // Initialize content properties with defaults
        this.text = data.text.trim();
        this.description = data.description?.trim() || undefined;
        this.complete = data.complete ?? false;
        this.status = data.status ?? (data.complete ? TodoStatus.COMPLETED : TodoStatus.PENDING);
        this.priority = data.priority ?? TodoPriority.MEDIUM;
        this.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
        this.tags = data.tags ? [...new Set(data.tags.map(tag => tag.trim().toLowerCase()))] : [];
    }

    /**
     * Generates a unique identifier using UUID v4 format
     * @returns {string} A unique identifier string
     */
    private generateId(): string {
        return (String(1e7) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: string) => {
            const num = parseInt(c);
            try {
                const randomArray = window.crypto.getRandomValues(new Uint8Array(1));
                return (num ^ (randomArray[0]! & (15 >> (num / 4)))).toString(16);
            } catch (error) {
                // Fallback for environments without crypto API
                return (num ^ (Math.random() * 16)).toString(16);
            }
        });
    }

    /**
     * Static method to validate TODO data before creation
     * @param data The data to validate
     * @returns Validation result with errors and warnings
     */
    public static validateData(data: ITodoData): ITodoValidation {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Required field validation
        if (!data.text || data.text.trim().length === 0) {
            errors.push('Text is required and cannot be empty');
        }

        // Text length validation
        if (data.text && data.text.trim().length > 500) {
            errors.push('Text cannot exceed 500 characters');
        }

        // Description length validation
        if (data.description && data.description.trim().length > 1000) {
            errors.push('Description cannot exceed 1000 characters');
        }

        // Due date validation
        if (data.dueDate && data.dueDate < new Date()) {
            warnings.push('Due date is in the past');
        }

        // Priority validation
        if (data.priority && !Object.values(TodoPriority).includes(data.priority)) {
            errors.push('Invalid priority value');
        }

        // Status validation
        if (data.status && !Object.values(TodoStatus).includes(data.status)) {
            errors.push('Invalid status value');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Updates the TODO with new values (mutating operation)
     * In an anemic domain model, this is a simple data setter
     * @param updates Partial updates to apply to the TODO
     */
    public update(updates: ITodoUpdate): void {
        if (updates.text !== undefined) {
            this.text = updates.text.trim();
        }
        if (updates.description !== undefined) {
            this.description = updates.description ? updates.description.trim() : undefined;
        }
        if (updates.complete !== undefined) {
            this.complete = updates.complete;
            // Auto-update status based on completion
            if (updates.complete && this.status === TodoStatus.PENDING) {
                this.status = TodoStatus.COMPLETED;
            } else if (!updates.complete && this.status === TodoStatus.COMPLETED) {
                this.status = TodoStatus.PENDING;
            }
        }
        if (updates.status !== undefined) {
            this.status = updates.status;
        }
        if (updates.priority !== undefined) {
            this.priority = updates.priority;
        }
        if (updates.dueDate !== undefined) {
            this.dueDate = updates.dueDate ? new Date(updates.dueDate) : undefined;
        }
        if (updates.tags !== undefined) {
            this.tags = [...new Set(updates.tags.map(tag => tag.trim().toLowerCase()))];
        }

        // Update timestamp
        (this as any).updatedAt = new Date();
    }

    /**
     * Toggles the completion status of the TODO
     */
    public toggle(): void {
        this.update({ complete: !this.complete });
    }

    /**
     * Adds a tag to the TODO
     * @param tag Tag to add
     */
    public addTag(tag: string): void {
        const normalizedTag = tag.trim().toLowerCase();
        if (normalizedTag && !this.tags.includes(normalizedTag)) {
            this.tags.push(normalizedTag);
            (this as any).updatedAt = new Date();
        }
    }

    /**
     * Removes a tag from the TODO
     * @param tag Tag to remove
     */
    public removeTag(tag: string): void {
        const normalizedTag = tag.trim().toLowerCase();
        const index = this.tags.indexOf(normalizedTag);
        if (index !== -1) {
            this.tags.splice(index, 1);
            (this as any).updatedAt = new Date();
        }
    }

    /**
     * Checks if TODO has a specific tag
     * @param tag Tag to check
     * @returns True if TODO has the tag
     */
    public hasTag(tag: string): boolean {
        return this.tags.includes(tag.trim().toLowerCase());
    }

    /**
     * Converts the TODO to a plain object for JSON serialization
     * @returns {ITodo} Complete plain object representation of the TODO
     */
    public toJSON(): ITodo {
        return {
            // Base properties
            id: this.id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            
            // Content properties
            text: this.text,
            description: this.description,
            complete: this.complete,
            status: this.status,
            priority: this.priority,
            dueDate: this.dueDate,
            tags: [...this.tags],
            
            // Computed properties
            isOverdue: this.isOverdue,
            isPending: this.isPending,
            isCompleted: this.isCompleted
        };
    }

    /**
     * Creates a deep copy of the TODO
     * @returns {Todo} A new Todo instance with the same data
     */
    public clone(): Todo {
        const data: ITodoData = {
            text: this.text,
            description: this.description || undefined,
            complete: this.complete,
            status: this.status,
            priority: this.priority,
            dueDate: this.dueDate || undefined,
            tags: [...this.tags]
        };
        
        const cloned = new Todo(data);
        // Preserve original timestamps
        (cloned as any).createdAt = new Date(this.createdAt);
        (cloned as any).updatedAt = new Date(this.updatedAt);
        (cloned as any).id = this.id;
        
        return cloned;
    }

    /**
     * Static method to create a Todo from a plain object
     * @param obj Plain object representation
     * @returns {Todo} New Todo instance
     */
    public static fromJSON(obj: any): Todo {
        const todo = new Todo({
            text: obj.text || '',
            description: obj.description || undefined,
            complete: obj.complete || false,
            status: obj.status || TodoStatus.PENDING,
            priority: obj.priority || TodoPriority.MEDIUM,
            dueDate: obj.dueDate ? new Date(obj.dueDate) : undefined,
            tags: obj.tags || []
        });

        // Restore original properties if they exist
        if (obj.id) (todo as any).id = obj.id;
        if (obj.createdAt) (todo as any).createdAt = new Date(obj.createdAt);
        if (obj.updatedAt) (todo as any).updatedAt = new Date(obj.updatedAt);

        return todo;
    }

    /**
     * Static method to create an empty/default Todo
     * @returns {Todo} New empty Todo instance
     */
    public static createEmpty(): Todo {
        return new Todo({
            text: 'New Todo',
            complete: false,
            status: TodoStatus.PENDING,
            priority: TodoPriority.MEDIUM,
            tags: []
        });
    }
}