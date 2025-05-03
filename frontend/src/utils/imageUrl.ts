const BASE_URL = import.meta.env.VITE_BASE_URL;

export const getImageUrl = (path: string): string => {
  if (!path) return "";

  // If it's the logo, serve it directly from the frontend
  if (path === "/logo.svg") {
    return path;
  }

  // Special handling for s1.npass.app images
  if (path.includes('s1.npass.app')) {
    return `${BASE_URL}/proxy-image?url=${encodeURIComponent(path)}`;
  }

  // If the path is already a full URL, proxy it through our backend
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return `${BASE_URL}/proxy-image?url=${encodeURIComponent(path)}`;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  
  // Special handling for logo URLs
  if (cleanPath.startsWith("logos/")) {
    // For logos, serve directly from the backend
    return `${BASE_URL}/${cleanPath}`;
  }

  // Special handling for images in the images directory
  if (cleanPath.startsWith("images/")) {
    // For images, serve directly from the backend
    return `${BASE_URL}/${cleanPath}`;
  }
  
  // All other images are served from the backend's public directory
  return `${BASE_URL}/${cleanPath}`;
};
