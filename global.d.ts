// Extend the Window interface to include the ga property
interface Window {
  ga: (command: string, ...args: any[]) => void;
}