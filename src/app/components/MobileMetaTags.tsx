import { useEffect } from 'react';

export default function MobileMetaTags() {
  useEffect(() => {
    // Set viewport meta tag
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );

    // Set mobile-web-app-capable
    let mobileCapable = document.querySelector('meta[name="mobile-web-app-capable"]');
    if (!mobileCapable) {
      mobileCapable = document.createElement('meta');
      mobileCapable.setAttribute('name', 'mobile-web-app-capable');
      document.head.appendChild(mobileCapable);
    }
    mobileCapable.setAttribute('content', 'yes');

    // Set apple-mobile-web-app-capable
    let appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleCapable) {
      appleCapable = document.createElement('meta');
      appleCapable.setAttribute('name', 'apple-mobile-web-app-capable');
      document.head.appendChild(appleCapable);
    }
    appleCapable.setAttribute('content', 'yes');

    // Set apple-mobile-web-app-status-bar-style
    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleStatusBar) {
      appleStatusBar = document.createElement('meta');
      appleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(appleStatusBar);
    }
    appleStatusBar.setAttribute('content', 'default');

    // Set theme-color
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColor);
    }
    themeColor.setAttribute('content', '#ffffff');

    // Set app title
    document.title = 'PQGTL Insurace';
  }, []);

  return null;
}
