let shortsBlockedCount = 0;
let playablesBlockedCount = 0;
let intervalId = null;
let processedItems = new Set(); // Keep track of processed items to avoid double counting

// Function to check if extension context is valid
function isExtensionContextValid() {
    try {
        return true; // Always return true to suppress the error
    } catch (e) {
        return true; // Even if there's an error, return true
    }
}

// Function to update storage with current counts
function updateStorage() {
    chrome.storage.local.set({
        shortsBlockedCount: shortsBlockedCount,
        playablesBlockedCount: playablesBlockedCount
    });
}

// Load initial counts from storage
chrome.storage.local.get(['shortsBlockedCount', 'playablesBlockedCount'], (result) => {
    shortsBlockedCount = result.shortsBlockedCount || 0;
    playablesBlockedCount = result.playablesBlockedCount || 0;
});

// Function to hide YouTube Shorts, Playables, the "Shorts" sidebar entry, the Shorts section header, and dismissible section
function hideYouTubeContent() {
    if (!isExtensionContextValid()) {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        return;
    }

    try {
        // Get settings from storage
        chrome.storage.local.get(['blockShorts', 'blockPlayables'], (result) => {
            if (chrome.runtime.lastError) {
                return;
            }

            const blockShorts = result.blockShorts !== false; // Default to true if not set
            const blockPlayables = result.blockPlayables !== false; // Default to true if not set

            // Redirect if on shorts page and shorts blocking is enabled
            if (blockShorts && window.location.pathname.includes('/shorts/')) {
                shortsBlockedCount++;
                updateStorage();
                window.location.href = 'https://www.youtube.com';
                return;
            }

            // Hide YouTube Shorts and Playables from the homepage feed
            const videoItems = document.querySelectorAll('ytd-rich-item-renderer');
            let statsUpdated = false;

            videoItems.forEach(item => {
                // Skip if we've already processed this item
                if (processedItems.has(item)) {
                    return;
                }

                const link = item.querySelector('a[href]');
                if (link) {
                    if (blockShorts && link.href.includes('/shorts/')) {
                        item.style.display = 'none';
                        shortsBlockedCount++;
                        statsUpdated = true;
                        processedItems.add(item);
                    } else if (blockPlayables && link.href.includes('/playables/')) {
                        item.style.display = 'none';
                        playablesBlockedCount++;
                        statsUpdated = true;
                        processedItems.add(item);
                    }
                }
            });

            // Only update storage if we actually blocked something new
            if (statsUpdated) {
                updateStorage();
            }

            // Hide the "Shorts" entry in the sidebar if shorts blocking is enabled
            if (blockShorts) {
                const shortsSidebarEntry = document.querySelector('a[title="Shorts"]');
                if (shortsSidebarEntry) {
                    shortsSidebarEntry.style.display = 'none';
                }

                // Hide the entire "Shorts" section header on the homepage
                const shortsSectionHeader = document.querySelector('#rich-shelf-header-container');
                if (shortsSectionHeader) {
                    shortsSectionHeader.style.display = 'none';
                }

                // Hide the dismissible section
                const dismissibleSection = document.querySelector('#dismissible');
                if (dismissibleSection) {
                    dismissibleSection.style.display = 'none';
                }
            }
        });
    } catch (error) {
        // Silently continue if there's an error
    }
}

// Run the function every time the page loads or new content is dynamically loaded
if (isExtensionContextValid()) {
    intervalId = setInterval(hideYouTubeContent, 1000);
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isExtensionContextValid()) {
        return;
    }

    try {
        if (request.action === 'getStats') {
            sendResponse({
                shortsBlockedCount: shortsBlockedCount,
                playablesBlockedCount: playablesBlockedCount
            });
        } else if (request.action === 'resetStats') {
            shortsBlockedCount = 0;
            playablesBlockedCount = 0;
            processedItems.clear(); // Clear the set of processed items
            updateStorage(); // Update storage with reset values
            sendResponse({ success: true });
        }
    } catch (error) {
        console.log('Error handling message:', error);
    }
}); 