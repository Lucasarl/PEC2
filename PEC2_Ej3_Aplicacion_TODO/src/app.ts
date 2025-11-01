import { TodoController } from './controllers/todo.controller';
import { TodoService } from './services/todo.service';
import { TodoView } from './views/todo.views';

/**
 * @class App
 * 
 * Main application class that initializes and coordinates all components.
 * Entry point for the TODO application following MVC architecture.
 */
class App {
    private controller: TodoController;
    private service: TodoService;
    private view: TodoView;

    constructor() {
        // Initialize service layer (Model)
        this.service = new TodoService();
        
        // Initialize view layer (View)
        this.view = new TodoView();
        
        // Initialize controller layer (Controller)
        this.controller = new TodoController(this.service, this.view);

        // Log successful initialization
        console.log('TODO App initialized successfully');
        console.log('Service:', this.service);
        console.log('View:', this.view);
        console.log('Controller:', this.controller);
    }

    /**
     * Gets the controller instance
     * @returns TodoController instance
     */
    public getController(): TodoController {
        return this.controller;
    }

    /**
     * Gets the service instance
     * @returns TodoService instance
     */
    public getService(): TodoService {
        return this.service;
    }

    /**
     * Gets the view instance
     * @returns TodoView instance
     */
    public getView(): TodoView {
        return this.view;
    }

    /**
     * Initializes the application when DOM is ready
     */
    public static init(): void {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                new App();
            });
        } else {
            // DOM is already loaded
            new App();
        }
    }

    /**
     * Destroys the application and cleans up resources
     */
    public destroy(): void {
        // Clean up any event listeners or resources if needed
        console.log('TODO App destroyed');
    }
}

/**
 * Initialize the application
 */
App.init();

// Export for potential external use
export default App;