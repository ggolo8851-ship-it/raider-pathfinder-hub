// Detects in-app browsers (Instagram/TikTok/FB/etc) where Google OAuth popups break.
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Instagram|FBAN|FBAV|FB_IAB|FBIOS|TikTok|musical_ly|Twitter|Line|MicroMessenger|Snapchat|Pinterest/i.test(ua);
}

export function inAppBrowserName(): string {
  const ua = navigator.userAgent || "";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/TikTok|musical_ly/i.test(ua)) return "TikTok";
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "Facebook";
  if (/Twitter/i.test(ua)) return "X (Twitter)";
  if (/Snapchat/i.test(ua)) return "Snapchat";
  if (/Line/i.test(ua)) return "LINE";
  if (/MicroMessenger/i.test(ua)) return "WeChat";
  return "this app";
}
