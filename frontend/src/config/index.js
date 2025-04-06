export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const RAW_WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL;

export const WS_BASE_URL = RAW_WS_BASE_URL.startsWith('ws://') && location.protocol === 'https:'
  ? RAW_WS_BASE_URL.replace('ws://', 'wss://')
  : RAW_WS_BASE_URL;
