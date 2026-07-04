const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|ogg|mov)(\?|#|$)/i;

export function getPreviewVideoUrl(item = {}) {
  const url = item.preview_video_url || item.video_url || item.trailer_video_url || item.trailer_url || '';
  return DIRECT_VIDEO_PATTERN.test(url) ? url : '';
}

export function showWallpaperPreview(item = {}, type = 'media') {
  const videoUrl = getPreviewVideoUrl(item);
  if (!videoUrl) return;

  window.dispatchEvent(new CustomEvent('elite-wallpaper-preview', {
    detail: {
      type,
      title: item.title || item.name,
      videoUrl,
      imageUrl: item.backdrop_url || item.banner_url || item.cover_url || item.poster_url || ''
    }
  }));
}

export function hideWallpaperPreview() {
  window.dispatchEvent(new CustomEvent('elite-wallpaper-preview-clear'));
}