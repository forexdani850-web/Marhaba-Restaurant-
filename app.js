// Marhaba Restaurant PWA - Main Application Script

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Marhaba-Restaurant-/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// PWA Installation Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Stash the event for later use
    deferredPrompt = e;
    console.log('Install prompt ready');
    
    // Show your custom install button
    showInstallPrompt();
});

function showInstallPrompt() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.style.display = 'block';
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                // Show the install prompt
                deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                // Clear the deferredPrompt for next time
                deferredPrompt = null;
                // Hide the install button
                installButton.style.display = 'none';
            }
        });
    }
}

// Handle app installed event
window.addEventListener('appinstalled', () => {
    console.log('PWA app installed');
    // Hide install button
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.style.display = 'none';
    }
    // Track installation
    trackEvent('app-installed');
});

// Handle when app is launched
if (window.navigator.standalone === true) {
    console.log('App is running in standalone mode');
    document.body.classList.add('standalone');
}

// Detect app running in standalone mode
window.addEventListener('resize', () => {
    if (window.navigator.standalone === true) {
        document.body.classList.add('standalone');
    }
});

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
                // Subscribe to push notifications
                subscribeToPushNotifications();
            }
        });
    }
}

function subscribeToPushNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
            registration.pushManager.getSubscription()
                .then(subscription => {
                    if (subscription === null) {
                        // Create a new subscription
                        registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
                        })
                        .then(subscription => {
                            console.log('Subscribed to push notifications');
                            // Send subscription to server
                            savePushSubscription(subscription);
                        })
                        .catch(err => {
                            console.log('Failed to subscribe to push notifications:', err);
                        });
                    }
                });
        });
    }
}

function savePushSubscription(subscription) {
    // Save subscription to server
    console.log('Push subscription:', subscription);
    // This would typically be sent to your backend
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Track events for analytics
function trackEvent(eventName, eventData = {}) {
    console.log('Event tracked:', eventName, eventData);
    // Send to analytics service
    if ('sendBeacon' in navigator) {
        const payload = JSON.stringify({
            event: eventName,
            data: eventData,
            timestamp: new Date().toISOString()
        });
        navigator.sendBeacon('/api/analytics', payload);
    }
}

// Request periodic background sync
function requestBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-orders')
                .then(() => {
                    console.log('Background sync registered');
                })
                .catch(err => {
                    console.log('Background sync registration failed:', err);
                });
        });
    }
}

// Check online/offline status
window.addEventListener('online', () => {
    console.log('App is online');
    document.body.classList.remove('offline');
    document.body.classList.add('online');
    showNotification('Connection Restored', 'You are back online');
    trackEvent('app-online');
});

window.addEventListener('offline', () => {
    console.log('App is offline');
    document.body.classList.remove('online');
    document.body.classList.add('offline');
    showNotification('Connection Lost', 'You are offline. Some features may be limited.');
    trackEvent('app-offline');
});

function showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/Marhaba-Restaurant-/images/icon-192.png'
        });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('Marhaba Restaurant PWA initialized');
    
    // Request permissions
    requestNotificationPermission();
    
    // Register background sync
    requestBackgroundSync();
    
    // Check initial connection status
    if (navigator.onLine) {
        document.body.classList.add('online');
    } else {
        document.body.classList.add('offline');
    }
});

// Share API for sharing menu items
function shareMenuItem(title, text, url) {
    if ('share' in navigator) {
        navigator.share({
            title: title,
            text: text,
            url: url || window.location.href
        })
        .then(() => {
            trackEvent('menu-item-shared', { title });
        })
        .catch(err => {
            console.log('Error sharing:', err);
        });
    } else {
        // Fallback: copy to clipboard
        copyToClipboard(url || window.location.href);
    }
}

function copyToClipboard(text) {
    if ('clipboard' in navigator) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Copied to clipboard');
        });
    }
}

// Export functions for use in HTML
window.MarhabaApp = {
    shareMenuItem,
    requestNotificationPermission,
    trackEvent
};
