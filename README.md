# Instagram Following Check

Find out who doesn't follow you back on Instagram with this simple, privacy-focused web tool.

## What Does This Do?

This tool helps you identify which Instagram accounts you follow that don't follow you back. All processing happens locally in your browser - your data never leaves your device.

## How to Use

### Step 1: Get Your Instagram Data

#### Desktop Method:
1. Go to Instagram on your desktop browser
2. Navigate to **Settings → Privacy and Security → Data Download**
3. Request a download of your data in **JSON format**
4. Wait for Instagram to send you the download link via email (this can take up to 48 hours)
5. Download and extract the ZIP file
6. Find the files in the `connections` folder:
   - `followers_1.json` (or similar)
   - `following.json` (or similar)

#### Mobile Method:
1. Open the Instagram app
2. Go to your profile and tap the menu (three lines)
3. Tap **Settings → Security → Download Data**
4. Enter your email and request download
5. Wait for the email from Instagram
6. Download the ZIP file and extract it
7. Transfer the files to your device or use them directly

### Step 2: Use the Tool

1. Open `index.html` in your web browser (or visit the hosted site)
2. Upload your `followers_1.json` file in the "Upload Followers" section
3. Upload your `following.json` file in the "Upload Following" section
4. Click the **Compare** button
5. View your results:
   - Total followers count
   - Total following count
   - List of accounts not following you back

## Features

- **Privacy First**: All data processing happens in your browser - nothing is uploaded to any server
- **Colorful UI**: Fun, modern, and responsive design
- **Easy to Use**: Simple drag-and-drop interface
- **Direct Links**: Click any username to visit their Instagram profile
- **Fast Results**: Instant comparison with smooth animations

## Running Locally

Simply open `index.html` in any modern web browser. No installation or server required!

## Browser Compatibility

Works with all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## Privacy & Security

Your Instagram data is sensitive. This tool:
- Runs entirely in your browser
- Doesn't send any data to external servers
- Doesn't store any of your information
- Is open source - you can review all the code

## License

Free to use and modify.

## Troubleshooting

If you see "0 followers" or "0 following" after uploading files:

1. **Open Browser Console** (Press F12 or Right-click → Inspect → Console tab)
2. **Upload your files again**
3. **Check the console output** - you'll see detailed information about your data structure
4. **Look for messages like:**
   - "Parsing Instagram data: ..."
   - "Data is an array with X items" or "Data is an object with keys: ..."
   - "Extracted X usernames"

The tool now includes enhanced debugging to help identify why parsing might fail. If you still have issues, the console output will show exactly what format your Instagram export is using.

### Other Common Issues:

- Ensure you're using the correct JSON files from Instagram's data download
- Files should be from the `connections` folder in your data download
- Make sure your browser is up to date
- Try refreshing the page and uploading files again

---

**Note**: This tool is not affiliated with Instagram or Meta. It's an independent project designed to help users understand their follower relationships.
