let followersData = null;
let followingData = null;

const followersFileInput = document.getElementById('followersFile');
const followingFileInput = document.getElementById('followingFile');
const compareBtn = document.getElementById('compareBtn');
const resultsSection = document.getElementById('results');
const followersStatus = document.getElementById('followersStatus');
const followingStatus = document.getElementById('followingStatus');
const saveFollowersBtn = document.getElementById('saveFollowersBtn');
const saveInfo = document.getElementById('saveInfo');

// LocalStorage key for saved followers
const STORAGE_KEY = 'instagram_previous_followers';
const STORAGE_DATE_KEY = 'instagram_followers_saved_date';

// File upload handlers
followersFileInput.addEventListener('change', (e) => handleFileUpload(e, 'followers'));
followingFileInput.addEventListener('change', (e) => handleFileUpload(e, 'following'));

// Compare button handler
compareBtn.addEventListener('click', compareFollowers);

// Save followers button handler
saveFollowersBtn.addEventListener('click', saveCurrentFollowers);

// Load saved info on page load
updateSaveInfo();

function handleFileUpload(event, type) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            console.log(`\n=== Parsing ${type} file: ${file.name} ===`);
            console.log('Raw JSON structure:', JSON.stringify(data, null, 2).substring(0, 500) + '...');

            const statusElement = type === 'followers' ? followersStatus : followingStatus;

            // Reset status classes
            statusElement.classList.remove('success', 'warning', 'error');

            if (type === 'followers') {
                followersData = parseInstagramData(data);
                if (followersData.length === 0) {
                    statusElement.textContent = `⚠️ ${file.name} - 0 followers found. Check console (F12).`;
                    statusElement.classList.add('warning');
                    console.error('Could not extract followers. Full data:', data);
                } else {
                    statusElement.textContent = `✓ ${file.name} (${followersData.length} followers)`;
                    statusElement.classList.add('success');
                    console.log('Successfully extracted followers:', followersData.slice(0, 5), '...');
                }
            } else {
                followingData = parseInstagramData(data);
                if (followingData.length === 0) {
                    statusElement.textContent = `⚠️ ${file.name} - 0 following found. Check console (F12).`;
                    statusElement.classList.add('warning');
                    console.error('Could not extract following. Full data:', data);
                } else {
                    statusElement.textContent = `✓ ${file.name} (${followingData.length} following)`;
                    statusElement.classList.add('success');
                    console.log('Successfully extracted following:', followingData.slice(0, 5), '...');
                }
            }

            // Enable compare button if both files are loaded with data
            if (followersData && followersData.length > 0 && followingData && followingData.length > 0) {
                compareBtn.disabled = false;
            }
        } catch (error) {
            const statusElement = type === 'followers' ? followersStatus : followingStatus;
            statusElement.classList.remove('success', 'warning');
            statusElement.classList.add('error');
            statusElement.textContent = `❌ ${file.name} - Invalid JSON file`;
            console.error('JSON parse error:', error);
        }
    };

    reader.readAsText(file);
}

// Validate if a string looks like a valid Instagram username
function isValidUsername(str) {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    // Instagram usernames: 1-30 chars, only letters, numbers, periods, underscores
    // Must not be purely numeric (would be a timestamp)
    const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/;
    return usernameRegex.test(trimmed) && !/^\d+$/.test(trimmed);
}

function parseInstagramData(data) {
    // Instagram data can come in different formats
    // Try to extract usernames from various possible structures

    console.log('Parsing Instagram data:', data);
    let usernames = [];

    // Check if it's an array
    if (Array.isArray(data)) {
        console.log('Data is an array with', data.length, 'items');

        // Log first item structure for debugging
        if (data.length > 0) {
            console.log('First item structure:', JSON.stringify(data[0], null, 2));
        }

        let extractionMethod = '';
        for (const item of data) {
            // PRIORITY 1: Check title field first (newer Instagram export format uses this for username)
            if (item.title && typeof item.title === 'string' && item.title.trim() !== '') {
                if (!extractionMethod) extractionMethod = 'title';
                usernames.push(item.title);
            }
            // PRIORITY 2: Handle string_list_data - extract usernames from value or href
            else if (item.string_list_data && Array.isArray(item.string_list_data)) {
                for (const entry of item.string_list_data) {
                    if (entry.value && typeof entry.value === 'string') {
                        if (!extractionMethod) extractionMethod = 'string_list_data.value';
                        usernames.push(entry.value);
                    } else if (entry.href) {
                        // Extract username from Instagram URL
                        const match = entry.href.match(/instagram\.com\/([^\/\?]+)/);
                        if (match) {
                            if (!extractionMethod) extractionMethod = 'string_list_data.href';
                            usernames.push(match[1]);
                        }
                    }
                }
            }
            // PRIORITY 3: Handle direct username property
            else if (item.username) {
                if (!extractionMethod) extractionMethod = 'username';
                usernames.push(item.username);
            }
            // PRIORITY 4: Handle direct value property (only if it looks like a username, not a timestamp)
            else if (item.value && typeof item.value === 'string' && isNaN(item.value)) {
                if (!extractionMethod) extractionMethod = 'value';
                usernames.push(item.value);
            }
            // PRIORITY 5: Handle string items
            else if (typeof item === 'string') {
                if (!extractionMethod) extractionMethod = 'string';
                usernames.push(item);
            }
            // PRIORITY 6: Handle nested user object
            else if (item.user && item.user.username) {
                if (!extractionMethod) extractionMethod = 'user.username';
                usernames.push(item.user.username);
            }
            // PRIORITY 7: Handle name property (some formats use this)
            else if (item.name) {
                if (!extractionMethod) extractionMethod = 'name';
                usernames.push(item.name);
            }
        }

        console.log('Extraction method used:', extractionMethod || 'none');

        console.log('Extracted', usernames.length, 'usernames from array');

        // Filter out invalid usernames
        const validUsernames = usernames.filter(u => {
            const valid = isValidUsername(u);
            if (!valid) {
                console.log('Filtered out invalid username:', u);
            }
            return valid;
        });
        console.log('After validation:', validUsernames.length, 'valid usernames');
        return validUsernames;
    }
    // Check if it's an object with a nested array
    else if (typeof data === 'object' && data !== null) {
        console.log('Data is an object with keys:', Object.keys(data));

        // Try to find the array in common Instagram data structures
        const possibleKeys = [
            'relationships_following',
            'relationships_followers',
            'followers',
            'following',
            'users',
            'data',
            'items',
            'list',
            'connections'
        ];

        // First check known keys
        for (const key of possibleKeys) {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    console.log('Found array at key:', key);
                    return parseInstagramData(data[key]);
                } else if (typeof data[key] === 'object') {
                    console.log('Found object at key:', key, '- checking nested');
                    const result = parseInstagramData(data[key]);
                    if (result.length > 0) {
                        return result;
                    }
                }
            }
        }

        // Check ALL keys for arrays we might have missed
        for (const key in data) {
            if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
                console.log('Trying array at key:', key);
                const result = parseInstagramData(data[key]);
                if (result.length > 0) {
                    return result;
                }
            }
        }

        // Check for nested objects that might contain arrays
        for (const key in data) {
            if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
                console.log('Trying nested object at key:', key);
                const result = parseInstagramData(data[key]);
                if (result.length > 0) {
                    return result;
                }
            }
        }

        // If it's a direct object with string_list_data - get ALL values
        if (data.string_list_data && Array.isArray(data.string_list_data)) {
            for (const entry of data.string_list_data) {
                if (entry.value) {
                    usernames.push(entry.value);
                }
            }
            if (usernames.length > 0) {
                // Filter and return valid usernames
                const validUsernames = usernames.filter(u => isValidUsername(u));
                console.log('After validation:', validUsernames.length, 'valid usernames');
                return validUsernames;
            }
        }
    }

    console.log('Final extracted usernames:', usernames.length);
    // Filter out invalid usernames before returning
    const validUsernames = usernames.filter(u => isValidUsername(u));
    console.log('After final validation:', validUsernames.length, 'valid usernames');
    return validUsernames;
}

function compareFollowers() {
    if (!followersData || !followingData) {
        alert('Please upload both files first!');
        return;
    }

    console.log('\n=== COMPARISON ===');
    console.log('Followers sample:', followersData.slice(0, 3));
    console.log('Following sample:', followingData.slice(0, 3));

    // Convert followers to a Set for faster lookup (normalized)
    const followersSet = new Set(followersData.map(name => name.toLowerCase().trim()));
    console.log('Unique followers:', followersSet.size);

    // Find people you follow who don't follow you back
    const notFollowingBack = followingData.filter(username => {
        return !followersSet.has(username.toLowerCase().trim());
    });

    console.log('Result:', notFollowingBack.length, 'people dont follow you back');

    // Sort alphabetically
    notFollowingBack.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    // Find unfollowers
    const unfollowerResult = findUnfollowers(followersData);
    console.log('Unfollowers:', unfollowerResult.unfollowers.length);

    // Display results
    displayResults(followersData.length, followingData.length, notFollowingBack, unfollowerResult);
}

function displayResults(followersCount, followingCount, notFollowingBack, unfollowerResult) {
    // Update stats
    document.getElementById('totalFollowers').textContent = followersCount.toLocaleString();
    document.getElementById('totalFollowing').textContent = followingCount.toLocaleString();
    document.getElementById('notFollowingBack').textContent = notFollowingBack.length.toLocaleString();
    document.getElementById('unfollowersCount').textContent = unfollowerResult.unfollowers.length.toLocaleString();

    // Update not following back list
    const listElement = document.getElementById('notFollowingList');
    listElement.innerHTML = '';

    if (notFollowingBack.length === 0) {
        listElement.innerHTML = '<li style="text-align: center; color: #10b981; font-weight: 600;">🎉 Everyone you follow follows you back!</li>';
    } else {
        notFollowingBack.forEach(username => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${username}</span>
                <a href="https://instagram.com/${username}" target="_blank" style="float: right; color: #667eea; text-decoration: none; font-weight: 600;">View Profile →</a>
            `;
            listElement.appendChild(li);
        });
    }

    // Update unfollowers section
    const unfollowersSection = document.getElementById('unfollowersSection');
    const unfollowersList = document.getElementById('unfollowersList');
    const unfollowersInfo = document.getElementById('unfollowersInfo');

    if (unfollowerResult.hasPreviousData) {
        unfollowersSection.style.display = 'block';

        const dateStr = unfollowerResult.savedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        unfollowersInfo.textContent = `Compared to your saved followers from ${dateStr}:`;

        unfollowersList.innerHTML = '';

        if (unfollowerResult.unfollowers.length === 0) {
            unfollowersList.innerHTML = '<li style="text-align: center; color: #10b981; font-weight: 600;">🎉 No one has unfollowed you since then!</li>';
        } else {
            unfollowerResult.unfollowers.forEach(username => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${username}</span>
                    <a href="https://instagram.com/${username}" target="_blank" style="float: right; color: #ee5a24; text-decoration: none; font-weight: 600;">View Profile →</a>
                `;
                unfollowersList.appendChild(li);
            });
        }
    } else {
        unfollowersSection.style.display = 'none';
    }

    // Show results section
    resultsSection.style.display = 'block';

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Smooth scroll for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#') && href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Save current followers to localStorage
function saveCurrentFollowers() {
    if (!followersData || followersData.length === 0) {
        alert('Please upload a followers file first!');
        return;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(followersData));
        localStorage.setItem(STORAGE_DATE_KEY, new Date().toISOString());
        updateSaveInfo();
        alert(`Saved ${followersData.length} followers. Next time you compare, we'll show who unfollowed you!`);
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
        alert('Failed to save. Your browser may have storage disabled.');
    }
}

// Get previously saved followers from localStorage
function getPreviousFollowers() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
    }
    return null;
}

// Get saved date
function getSavedDate() {
    try {
        const date = localStorage.getItem(STORAGE_DATE_KEY);
        if (date) {
            return new Date(date);
        }
    } catch (e) {
        console.error('Failed to load date from localStorage:', e);
    }
    return null;
}

// Update the save info text
function updateSaveInfo() {
    const savedDate = getSavedDate();
    const previousFollowers = getPreviousFollowers();

    if (savedDate && previousFollowers) {
        const dateStr = savedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        saveInfo.textContent = `Last saved: ${dateStr} (${previousFollowers.length} followers)`;
    } else {
        saveInfo.textContent = 'No previous followers saved. Save to track unfollowers next time!';
    }
}

// Find unfollowers (people who were following before but aren't now)
function findUnfollowers(currentFollowers) {
    const previousFollowers = getPreviousFollowers();

    if (!previousFollowers) {
        return { unfollowers: [], hasPreviousData: false };
    }

    // Normalize for comparison
    const currentSet = new Set(currentFollowers.map(u => u.toLowerCase().trim()));

    // Find who was in previous but not in current
    const unfollowers = previousFollowers.filter(username => {
        return !currentSet.has(username.toLowerCase().trim());
    });

    // Sort alphabetically
    unfollowers.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    return { unfollowers, hasPreviousData: true, savedDate: getSavedDate() };
}
