/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

/**
 * Global log level setting
 */
let globalLogLevel = LogLevel.INFO;

/**
 * Set the global log level
 * 
 * @param level Log level
 */
export function setLogLevel(level: LogLevel): void {
  globalLogLevel = level;
}

/**
 * Get the global log level
 */
export function getLogLevel(): LogLevel {
  return globalLogLevel;
}

/**
 * Logger class
 */
export class Logger {
  name: string;
  
  /**
   * Create a new logger
   * 
   * @param name Logger name
   */
  constructor(name: string) {
    this.name = name;
  }
  
  /**
   * Log an error message
   * 
   * @param message Message to log
   * @param args Additional arguments
   */
  error(message: string, ...args: any[]): void {
    if (globalLogLevel >= LogLevel.ERROR) {
      console.error(`[ERROR] [${this.name}] ${message}`, ...args);
    }
  }
  
  /**
   * Log a warning message
   * 
   * @param message Message to log
   * @param args Additional arguments
   */
  warn(message: string, ...args: any[]): void {
    if (globalLogLevel >= LogLevel.WARN) {
      console.warn(`[WARN] [${this.name}] ${message}`, ...args);
    }
  }
  
  /**
   * Log an info message
   * 
   * @param message Message to log
   * @param args Additional arguments
   */
  info(message: string, ...args: any[]): void {
    if (globalLogLevel >= LogLevel.INFO) {
      console.info(`[INFO] [${this.name}] ${message}`, ...args);
    }
  }
  
  /**
   * Log a debug message
   * 
   * @param message Message to log
   * @param args Additional arguments
   */
  debug(message: string, ...args: any[]): void {
    if (globalLogLevel >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] [${this.name}] ${message}`, ...args);
    }
  }
}

/**
 * Get a logger for a specific name
 * 
 * @param name Logger name
 */
export function getLogger(name: string): Logger {
  return new Logger(name);
}
