// FOr STATIC_IP
declare module '@env' {
  export const BASE_URL: string;
  export const PORT: string;
  export const API_URL: string;
}

// Image for  settings.png
declare module '*.png' {
  const content: any; 
  export default content;
}


// ✅ Sound file for beep.mp3
declare module '*.mp3' {
  const content: any;
  export default content;
}