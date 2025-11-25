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

            if (type === 'followers') {
                followersData = parseInstagramData(data);
                if (followersData.length === 0) {
                    followersStatus.textContent = `⚠️ ${file.name} loaded but found 0 followers. Check browser console for details.`;
                    followersStatus.classList.add('warning');
                    console.error('Could not extract followers from data. Data structure:', data);
                } else {
                    followersStatus.textContent = `✓ ${file.name} loaded (${followersData.length} followers)`;
                    followersStatus.classList.add('success');
                }
            } else {
                followingData = parseInstagramData(data);
                if (followingData.length === 0) {
                    followingStatus.textContent = `⚠️ ${file.name} loaded but found 0 following. Check browser console for details.`;
                    followingStatus.classList.add('warning');
                    console.error('Could not extract following from data. Data structure:', data);
                } else {
                    followingStatus.textContent = `✓ ${file.name} loaded (${followingData.length} following)`;
                    followingStatus.classList.add('success');
                }
            }

            // Enable compare button if both files are loaded
            if (followersData && followingData) {
                compareBtn.disabled = false;
            }
        } catch (error) {
            alert(`Error reading ${type} file. Please make sure it's a valid Instagram JSON file.`);
            console.error('Error details:', error);
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
        usernames = data.map(item => {
            // Try different possible structures
            if (item.string_list_data && item.string_list_data[0]) {
                return item.string_list_data[0].value;
            }
            if (item.username) {
                return item.username;
            }
            if (item.value) {
                return item.value;
            }
            if (typeof item === 'string') {
                return item;
            }
            return null;
        }).filter(Boolean);
        console.log('Extracted', usernames.length, 'usernames from array');
    }
    // Check if it's an object with a nested array
    else if (typeof data === 'object' && data !== null) {
        console.log('Data is an object with keys:', Object.keys(data));

        // Try to find the array in common Instagram data structures
        const possibleKeys = [
            'followers',
            'following',
            'relationships_following',
            'relationships_followers',
            'users',
            'data',
            'items'
        ];

        for (let key of possibleKeys) {
            if (data[key] && Array.isArray(data[key])) {
                console.log('Found array at key:', key);
                return parseInstagramData(data[key]);
            }
        }

        // Check for nested objects that might contain arrays
        for (let key in data) {
            if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
                // Try recursively on nested objects
                const result = parseInstagramData(data[key]);
                if (result.length > 0) {
                    return result;
                }
            }
        }

        // If it's a direct object with string_list_data
        if (data.string_list_data && data.string_list_data[0]) {
            return [data.string_list_data[0].value];
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
