import sys
import yt_dlp
import re
from pathlib import Path

def sanitize_filename(title):
    # Remove invalid characters for most OS file systems
    return re.sub(r'[\\/*?:"<>|]', '', title).strip()

def download_video(query):
    try:
        Path("downloads").mkdir(parents=True, exist_ok=True)
        
        # First: Get video metadata
        ydl_extract_opts = {
            'quiet': True,
            'no_warnings': True,
            'default_search': 'ytsearch1' if not query.startswith(('http://', 'https://', 'www.')) else None,
        }
        
        with yt_dlp.YoutubeDL(ydl_extract_opts) as ydl:
            info = ydl.extract_info(query, download=False)
            if 'entries' in info:
                info = info['entries'][0]
            title = sanitize_filename(info['title'])
            video_url = info['webpage_url']
        
        # Now download the video with audio
        ydl_download_opts = {
            # Use a format that ensures we get both video and audio
            'format': 'best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
            'outtmpl': f'downloads/{title}.%(ext)s',
            'merge_output_format': 'mp4',
            'postprocessors': [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4',
            }],
            # Make sure ffmpeg is properly configured for merging
            'ffmpeg_location': None,  # Auto-detect ffmpeg
            'quiet': False,  # Set to True in production, False for debugging
        }
        
        with yt_dlp.YoutubeDL(ydl_download_opts) as ydl:
            ydl.download([video_url])
        
        print("SUCCESS")
        
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("ERROR: No query provided")
    else:
        download_video(" ".join(sys.argv[1:]))