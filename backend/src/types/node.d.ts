// Custom Node.js type declarations
declare function setTimeout(callback: (...args: any[]) => void, ms: number): NodeJS.Timeout;
declare function clearTimeout(timeoutId: NodeJS.Timeout): void; 