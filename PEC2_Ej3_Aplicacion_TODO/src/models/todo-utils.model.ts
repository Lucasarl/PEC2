import { ITodo, TodoStatus, TodoPriority, ITodoFilter, ITodoSort, TodoCollection } from './todo.model';

/**
 * @class TodoModelUtils
 * 
 * Utility class providing static methods for TODO model operations.
 * Following anemic domain model pattern, business logic is externalized.
 */
export class TodoModelUtils {
    
    /**
     * Filters a collection of TODOs based on provided criteria
     * @param todos Collection of TODOs to filter
     * @param filter Filter criteria
     * @returns Filtered collection
     */
    public static filterTodos(todos: TodoCollection, filter: ITodoFilter): TodoCollection {
        return todos.filter(todo => {
            // Status filter
            if (filter.status !== undefined) {
                const statusArray = Array.isArray(filter.status) ? filter.status : [filter.status];
                if (!statusArray.includes(todo.status)) return false;
            }

            // Priority filter
            if (filter.priority !== undefined) {
                const priorityArray = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
                if (!priorityArray.includes(todo.priority)) return false;
            }

            // Completion filter
            if (filter.complete !== undefined) {
                if (todo.complete !== filter.complete) return false;
            }

            // Tags filter
            if (filter.tags !== undefined) {
                const filterTags = Array.isArray(filter.tags) ? filter.tags : [filter.tags];
                const hasAnyTag = filterTags.some(tag => todo.tags.includes(tag.toLowerCase()));
                if (!hasAnyTag) return false;
            }

            // Due date filters
            if (filter.dueBefore !== undefined) {
                if (!todo.dueDate || todo.dueDate > filter.dueBefore) return false;
            }

            if (filter.dueAfter !== undefined) {
                if (!todo.dueDate || todo.dueDate < filter.dueAfter) return false;
            }

            // Search text filter
            if (filter.searchText !== undefined) {
                const searchLower = filter.searchText.toLowerCase();
                const matchesText = todo.text.toLowerCase().includes(searchLower);
                const matchesDescription = todo.description?.toLowerCase().includes(searchLower) || false;
                const matchesTags = todo.tags.some(tag => tag.includes(searchLower));
                
                if (!matchesText && !matchesDescription && !matchesTags) return false;
            }

            return true;
        });
    }

    /**
     * Sorts a collection of TODOs based on provided criteria
     * @param todos Collection of TODOs to sort
     * @param sort Sort criteria
     * @returns Sorted collection
     */
    public static sortTodos(todos: TodoCollection, sort: ITodoSort): TodoCollection {
        return [...todos].sort((a, b) => {
            const aValue = a[sort.field];
            const bValue = b[sort.field];

            // Handle different types of values
            let comparison = 0;
            
            if (aValue instanceof Date && bValue instanceof Date) {
                comparison = aValue.getTime() - bValue.getTime();
            } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                comparison = aValue === bValue ? 0 : aValue ? 1 : -1;
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            } else {
                // Convert to string for comparison
                comparison = String(aValue).localeCompare(String(bValue));
            }

            return sort.direction === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * Groups TODOs by a specific field
     * @param todos Collection of TODOs to group
     * @param field Field to group by
     * @returns Map of groups
     */
    public static groupTodos<K extends keyof ITodo>(
        todos: TodoCollection, 
        field: K
    ): Map<ITodo[K], ITodo[]> {
        const groups = new Map<ITodo[K], ITodo[]>();
        
        todos.forEach(todo => {
            const key = todo[field];
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(todo);
        });

        return groups;
    }

    /**
     * Gets statistics about a collection of TODOs
     * @param todos Collection of TODOs to analyze
     * @returns Statistics object
     */
    public static getTodoStatistics(todos: TodoCollection): {
        total: number;
        completed: number;
        pending: number;
        overdue: number;
        byStatus: Record<TodoStatus, number>;
        byPriority: Record<TodoPriority, number>;
    } {
        const stats = {
            total: todos.length,
            completed: 0,
            pending: 0,
            overdue: 0,
            byStatus: {
                [TodoStatus.PENDING]: 0,
                [TodoStatus.COMPLETED]: 0,
                [TodoStatus.ARCHIVED]: 0
            },
            byPriority: {
                [TodoPriority.LOW]: 0,
                [TodoPriority.MEDIUM]: 0,
                [TodoPriority.HIGH]: 0,
                [TodoPriority.CRITICAL]: 0
            }
        };

        todos.forEach(todo => {
            if (todo.complete) stats.completed++;
            if (todo.isPending) stats.pending++;
            if (todo.isOverdue) stats.overdue++;
            
            stats.byStatus[todo.status]++;
            stats.byPriority[todo.priority]++;
        });

        return stats;
    }

    /**
     * Validates that a TODO ID exists in a collection
     * @param todos Collection to search
     * @param id ID to find
     * @returns True if ID exists
     */
    public static todoExists(todos: TodoCollection, id: string): boolean {
        return todos.some(todo => todo.id === id);
    }

    /**
     * Finds a TODO by ID in a collection
     * @param todos Collection to search
     * @param id ID to find
     * @returns Found TODO or undefined
     */
    public static findTodoById(todos: TodoCollection, id: string): ITodo | undefined {
        return todos.find(todo => todo.id === id);
    }

    /**
     * Gets all unique tags from a collection of TODOs
     * @param todos Collection of TODOs
     * @returns Array of unique tags
     */
    public static getAllTags(todos: TodoCollection): string[] {
        const tagSet = new Set<string>();
        todos.forEach(todo => {
            todo.tags.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
    }

    /**
     * Converts a collection to a Map indexed by ID
     * @param todos Collection to convert
     * @returns Map indexed by TODO ID
     */
    public static toMap(todos: TodoCollection): Map<string, ITodo> {
        return new Map(todos.map(todo => [todo.id, todo]));
    }

    /**
     * Creates default sort criteria
     * @returns Default sort configuration
     */
    public static getDefaultSort(): ITodoSort {
        return { field: 'createdAt', direction: 'desc' };
    }

    /**
     * Creates an empty filter
     * @returns Empty filter object
     */
    public static getEmptyFilter(): ITodoFilter {
        return {};
    }

    /**
     * Validates a filter object
     * @param filter Filter to validate
     * @returns True if filter is valid
     */
    public static isValidFilter(filter: ITodoFilter): boolean {
        try {
            // Basic validation - could be extended
            if (filter.dueBefore && filter.dueAfter) {
                return filter.dueBefore >= filter.dueAfter;
            }
            return true;
        } catch {
            return false;
        }
    }
}