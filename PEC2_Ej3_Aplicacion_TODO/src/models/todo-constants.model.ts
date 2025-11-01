import { TodoStatus, TodoPriority } from './todo.model';

/**
 * @namespace TodoConstants
 * 
 * Constants used throughout the TODO application
 */
export namespace TodoConstants {
    
    /**
     * Validation constraints
     */
    export const VALIDATION = {
        MAX_TEXT_LENGTH: 500,
        MAX_DESCRIPTION_LENGTH: 1000,
        MIN_TEXT_LENGTH: 1,
        MAX_TAGS_COUNT: 10,
        MAX_TAG_LENGTH: 50
    } as const;

    /**
     * Default values for TODO creation
     */
    export const DEFAULTS = {
        STATUS: TodoStatus.PENDING,
        PRIORITY: TodoPriority.MEDIUM,
        COMPLETE: false,
        TAGS: [] as string[]
    } as const;

    /**
     * UI configuration
     */
    export const UI = {
        EMPTY_STATE_MESSAGE: 'Nothing to do! Add a task?',
        ERROR_DISPLAY_DURATION: 3000, // milliseconds
        AUTO_SAVE_DELAY: 1000 // milliseconds
    } as const;

    /**
     * Storage configuration
     */
    export const STORAGE = {
        LOCAL_STORAGE_KEY: 'todos',
        BACKUP_KEY: 'todos_backup',
        VERSION_KEY: 'todos_version',
        CURRENT_VERSION: '1.0'
    } as const;

    /**
     * Priority weights for sorting
     */
    export const PRIORITY_WEIGHTS = {
        [TodoPriority.CRITICAL]: 4,
        [TodoPriority.HIGH]: 3,
        [TodoPriority.MEDIUM]: 2,
        [TodoPriority.LOW]: 1
    } as const;

    /**
     * Status display names
     */
    export const STATUS_LABELS = {
        [TodoStatus.PENDING]: 'Pending',
        [TodoStatus.COMPLETED]: 'Completed',
        [TodoStatus.ARCHIVED]: 'Archived'
    } as const;

    /**
     * Priority display names
     */
    export const PRIORITY_LABELS = {
        [TodoPriority.CRITICAL]: 'Critical',
        [TodoPriority.HIGH]: 'High',
        [TodoPriority.MEDIUM]: 'Medium',
        [TodoPriority.LOW]: 'Low'
    } as const;

    /**
     * CSS classes for styling
     */
    export const CSS_CLASSES = {
        TODO_ITEM: 'todo-item',
        COMPLETED: 'completed',
        OVERDUE: 'overdue',
        HIGH_PRIORITY: 'high-priority',
        CRITICAL_PRIORITY: 'critical-priority',
        EDITABLE: 'editable',
        ERROR_MESSAGE: 'error-message',
        EMPTY_STATE: 'empty-state'
    } as const;
}

/**
 * @interface ITodoAppConfig
 * 
 * Configuration interface for the TODO application
 */
export interface ITodoAppConfig {
    readonly autoSave: boolean;
    readonly autoSaveDelay: number;
    readonly enableNotifications: boolean;
    readonly enableDarkMode: boolean;
    readonly defaultSort: {
        field: string;
        direction: 'asc' | 'desc';
    };
    readonly pagination: {
        enabled: boolean;
        itemsPerPage: number;
    };
    readonly features: {
        enableTags: boolean;
        enableDueDates: boolean;
        enablePriorities: boolean;
        enableDescriptions: boolean;
    };
}

/**
 * @class TodoAppDefaults
 * 
 * Default configuration for the TODO application
 */
export class TodoAppDefaults {
    
    /**
     * Gets the default application configuration
     * @returns Default configuration object
     */
    public static getDefaultConfig(): ITodoAppConfig {
        return {
            autoSave: true,
            autoSaveDelay: TodoConstants.UI.AUTO_SAVE_DELAY,
            enableNotifications: false,
            enableDarkMode: false,
            defaultSort: {
                field: 'createdAt',
                direction: 'desc'
            },
            pagination: {
                enabled: false,
                itemsPerPage: 20
            },
            features: {
                enableTags: true,
                enableDueDates: true,
                enablePriorities: true,
                enableDescriptions: true
            }
        };
    }

    /**
     * Gets a minimal configuration for basic usage
     * @returns Minimal configuration object
     */
    public static getMinimalConfig(): ITodoAppConfig {
        return {
            autoSave: true,
            autoSaveDelay: TodoConstants.UI.AUTO_SAVE_DELAY,
            enableNotifications: false,
            enableDarkMode: false,
            defaultSort: {
                field: 'createdAt',
                direction: 'desc'
            },
            pagination: {
                enabled: false,
                itemsPerPage: 50
            },
            features: {
                enableTags: false,
                enableDueDates: false,
                enablePriorities: false,
                enableDescriptions: false
            }
        };
    }
}

/**
 * @type TodoErrorCodes
 * 
 * Enumeration of possible error codes
 */
export enum TodoErrorCodes {
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    TODO_NOT_FOUND = 'TODO_NOT_FOUND',
    STORAGE_ERROR = 'STORAGE_ERROR',
    INVALID_DATA = 'INVALID_DATA',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    NETWORK_ERROR = 'NETWORK_ERROR'
}

/**
 * @interface ITodoError
 * 
 * Interface for structured error handling
 */
export interface ITodoError {
    code: TodoErrorCodes;
    message: string;
    details?: any;
    timestamp: Date;
}

/**
 * @class TodoError
 * 
 * Custom error class for TODO-specific errors
 */
export class TodoError extends Error implements ITodoError {
    public readonly code: TodoErrorCodes;
    public readonly details?: any;
    public readonly timestamp: Date;

    constructor(code: TodoErrorCodes, message: string, details?: any) {
        super(message);
        this.name = 'TodoError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date();

        // Maintains proper stack trace for where our error was thrown
        if ('captureStackTrace' in Error) {
            (Error as any).captureStackTrace(this, TodoError);
        }
    }

    /**
     * Converts the error to a plain object for logging/serialization
     * @returns Plain object representation
     */
    public toJSON(): ITodoError {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp
        };
    }

    /**
     * Creates a validation error
     * @param message Error message
     * @param details Validation details
     * @returns TodoError instance
     */
    public static validation(message: string, details?: any): TodoError {
        return new TodoError(TodoErrorCodes.VALIDATION_FAILED, message, details);
    }

    /**
     * Creates a not found error
     * @param id The ID that was not found
     * @returns TodoError instance
     */
    public static notFound(id: string): TodoError {
        return new TodoError(TodoErrorCodes.TODO_NOT_FOUND, `Todo with ID ${id} not found`);
    }

    /**
     * Creates a storage error
     * @param message Error message
     * @param details Storage details
     * @returns TodoError instance
     */
    public static storage(message: string, details?: any): TodoError {
        return new TodoError(TodoErrorCodes.STORAGE_ERROR, message, details);
    }
}