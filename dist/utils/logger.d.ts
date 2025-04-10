/**
 * Log levels
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
/**
 * Set the global log level
 *
 * @param level Log level
 */
export declare function setLogLevel(level: LogLevel): void;
/**
 * Get the global log level
 */
export declare function getLogLevel(): LogLevel;
/**
 * Logger class
 */
export declare class Logger {
    name: string;
    /**
     * Create a new logger
     *
     * @param name Logger name
     */
    constructor(name: string);
    /**
     * Log an error message
     *
     * @param message Message to log
     * @param args Additional arguments
     */
    error(message: string, ...args: any[]): void;
    /**
     * Log a warning message
     *
     * @param message Message to log
     * @param args Additional arguments
     */
    warn(message: string, ...args: any[]): void;
    /**
     * Log an info message
     *
     * @param message Message to log
     * @param args Additional arguments
     */
    info(message: string, ...args: any[]): void;
    /**
     * Log a debug message
     *
     * @param message Message to log
     * @param args Additional arguments
     */
    debug(message: string, ...args: any[]): void;
}
/**
 * Get a logger for a specific name
 *
 * @param name Logger name
 */
export declare function getLogger(name: string): Logger;
