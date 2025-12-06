let followersData = null;
let followingData = null;

const followersFileInput = document.getElementById('followersFile');
const followingFileInput = document.getElementById('followingFile');
const compareBtn = document.getElementById('compareBtn');
const resultsSection = document.getElementById('results');
const followersStatus = document.getElementById('followersStatus');
const followingStatus = document.getElementById('followingStatus');

// File upload handlers
followersFileInput.addEventListener('change', (e) => handleFileUpload(e, 'followers'));
followingFileInput.addEventListener('change', (e) => handleFileUpload(e, 'following'));

// Compare button handler
compareBtn.addEventListener('click', compareFollowers);

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

function parseInstagramData(data) {
    // Instagram data can come in different formats
    // Try to extract usernames from various possible structures

    console.log('Parsing Instagram data:', data);
    let usernames = [];

    // Check if it's an array
    if (Array.isArray(data)) {
        console.log('Data is an array with', data.length, 'items');

        for (const item of data) {
            // Handle string_list_data - extract ALL users from it, not just first
            if (item.string_list_data && Array.isArray(item.string_list_data)) {
                for (const entry of item.string_list_data) {
                    if (entry.value) {
                        usernames.push(entry.value);
                    } else if (entry.href) {
                        // Extract username from Instagram URL
                        const match = entry.href.match(/instagram\.com\/([^\/\?]+)/);
                        if (match) {
                            usernames.push(match[1]);
                        }
                    }
                }
            }
            // Handle direct username property
            else if (item.username) {
                usernames.push(item.username);
            }
            // Handle direct value property
            else if (item.value) {
                usernames.push(item.value);
            }
            // Handle string items
            else if (typeof item === 'string') {
                usernames.push(item);
            }
            // Handle nested user object
            else if (item.user && item.user.username) {
                usernames.push(item.user.username);
            }
            // Handle name property (some formats use this)
            else if (item.name) {
                usernames.push(item.name);
            }
        }

        console.log('Extracted', usernames.length, 'usernames from array');
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
                return usernames;
            }
        }
    }

    console.log('Final extracted usernames:', usernames.length);
    return usernames;
}

function compareFollowers() {
    if (!followersData || !followingData) {
        alert('Please upload both files first!');
        return;
    }

    // Convert followers to a Set for faster lookup
    const followersSet = new Set(followersData.map(name => name.toLowerCase()));

    // Find people you follow who don't follow you back
    const notFollowingBack = followingData.filter(username => {
        return !followersSet.has(username.toLowerCase());
    });

    // Sort alphabetically
    notFollowingBack.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    // Display results
    displayResults(followersData.length, followingData.length, notFollowingBack);
}

function displayResults(followersCount, followingCount, notFollowingBack) {
    // Update stats
    document.getElementById('totalFollowers').textContent = followersCount.toLocaleString();
    document.getElementById('totalFollowing').textContent = followingCount.toLocaleString();
    document.getElementById('notFollowingBack').textContent = notFollowingBack.length.toLocaleString();

    // Update list
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
