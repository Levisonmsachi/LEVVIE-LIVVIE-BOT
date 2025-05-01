import sys
import yt_dlp
import os
import re
from pathlib import Path

def sanitize_filename(title):
    # Remove invalid characters for most OS file systems
    return re.sub(r'[\\/*?:"<>|]', '', title).strip()

def download_audio(query):
    try:
        # Create downloads directory if it doesn't exist
        Path("downloads").mkdir(parents=True, exist_ok=True)

        # Use this to capture info without downloading yet
        ydl_extract_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'default_search': 'ytsearch1' if not query.startswith(('http://', 'https://', 'www.')) else None,
        }

        with yt_dlp.YoutubeDL(ydl_extract_opts) as ydl:
            info = ydl.extract_info(query, download=False)
            if 'entries' in info:
                info = info['entries'][0]  # Take first result if a playlist/search
            title = sanitize_filename(info['title'])

        # Now set output filename using sanitized title
        ydl_download_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f'downloads/{title}.%(ext)s',
            'quiet': True,
            'no_warnings': True,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }

        with yt_dlp.YoutubeDL(ydl_download_opts) as ydl:
            ydl.download([info['webpage_url']])

        print("SUCCESS")

    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("ERROR: No query provided")
    else:
        download_audio(" ".join(sys.argv[1:]))
