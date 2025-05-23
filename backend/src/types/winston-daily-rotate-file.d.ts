declare module 'winston-daily-rotate-file' {
  import { transport } from 'winston';
  
  interface DailyRotateFileTransportOptions {
    filename?: string;
    dirname?: string;
    datePattern?: string;
    zippedArchive?: boolean;
    maxSize?: string;
    maxFiles?: string;
    level?: string;
    format?: any;
  }
  
  class DailyRotateFile extends transport {
    constructor(options?: DailyRotateFileTransportOptions);
  }
  
  export = DailyRotateFile;
} 