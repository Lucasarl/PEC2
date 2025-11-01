/**
 * @fileoverview Main export file for TODO model types and classes
 * 
 * This file centralizes all exports from the model layer following 
 * TypeScript MVC architecture and anemic domain model patterns.
 */

// Core model exports - Enums and Classes
export {
    TodoStatus,
    TodoPriority,
    Todo
} from './todo.model';

// Core model exports - Types and Interfaces
export type {
    ITodoBase,
    ITodoContent,
    ITodo,
    ITodoData,
    ITodoUpdate,
    ITodoValidation,
    ITodoFilter,
    ITodoSort,
    TodoCollection,
    TodoMap
} from './todo.model';

// Utility exports
export {
    TodoModelUtils
} from './todo-utils.model';

// Constants and configuration exports - Classes and Namespaces
export {
    TodoConstants,
    TodoAppDefaults,
    TodoErrorCodes,
    TodoError
} from './todo-constants.model';

// Constants and configuration exports - Types
export type {
    ITodoAppConfig,
    ITodoError
} from './todo-constants.model';

/**
 * @namespace TodoModels
 * 
 * Namespace containing all model-related types and utilities
 */
export namespace TodoModels {
    // Re-export types for namespace access
    export type Todo = import('./todo.model').ITodo;
    export type TodoData = import('./todo.model').ITodoData;
    export type TodoUpdate = import('./todo.model').ITodoUpdate;
    export type TodoValidation = import('./todo.model').ITodoValidation;
    export type TodoFilter = import('./todo.model').ITodoFilter;
    export type TodoSort = import('./todo.model').ITodoSort;
    export type TodoCollection = import('./todo.model').TodoCollection;
    export type TodoMap = import('./todo.model').TodoMap;
    export type AppConfig = import('./todo-constants.model').ITodoAppConfig;
    export type AppError = import('./todo-constants.model').ITodoError;
}

// Import classes for factory use
import { Todo, TodoPriority } from './todo.model';

/**
 * Model factory functions for common use cases
 */
export class TodoModelFactory {
    
    /**
     * Creates a new Todo with default values
     * @param text The todo text
     * @returns New Todo instance
     */
    public static createQuickTodo(text: string): Todo {
        return new Todo({ text });
    }

    /**
     * Creates a high priority todo
     * @param text The todo text
     * @param dueDate Optional due date
     * @returns New Todo instance
     */
    public static createUrgentTodo(text: string, dueDate?: Date): Todo {
        return new Todo({
            text,
            priority: TodoPriority.HIGH,
            dueDate
        });
    }

    /**
     * Creates a todo from legacy format (for migration)
     * @param legacyData Legacy todo data
     * @returns New Todo instance
     */
    public static fromLegacy(legacyData: { id?: string; text: string; complete?: boolean }): Todo {
        const todo = new Todo({
            text: legacyData.text,
            complete: legacyData.complete || false
        });

        // Preserve legacy ID if provided
        if (legacyData.id) {
            (todo as any).id = legacyData.id;
        }

        return todo;
    }
}