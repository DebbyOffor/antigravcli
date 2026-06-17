import os
import requests
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# Constants
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
TIMEOUT_SECONDS = 10

def parse_feed_content(feed_content):
    """
    Parses the BigQuery Release Notes feed XML content and splits
    it into individual updates grouped by type and date.
    """
    feed = feedparser.parse(feed_content)
    updates = []
    
    for entry in feed.entries:
        date = entry.get("title", "Unknown Date")
        link = entry.get("link", "")
        updated_time = entry.get("updated", entry.get("published", ""))
        
        # Extract HTML content
        html_content = ""
        if "content" in entry and entry.content:
            html_content = entry.content[0].value
        elif "summary" in entry:
            html_content = entry.summary
            
        if not html_content:
            continue
            
        soup = BeautifulSoup(html_content, "html.parser")
        
        current_type = "General"
        current_elements = []
        
        # Function to add an update segment
        def add_segment(el_list, u_type):
            if not el_list:
                return
            segment_html = "".join([str(el) for el in el_list])
            if segment_html.strip():
                # Extract clean text for search and tweet preview
                segment_text = BeautifulSoup(segment_html, "html.parser").get_text()
                # Clean up white space
                segment_text = " ".join(segment_text.split())
                
                # Create a unique ID
                update_id = f"{date}-{u_type}-{len(updates)}".replace(" ", "-").lower()
                
                updates.append({
                    "id": update_id,
                    "date": date,
                    "updated_time": updated_time,
                    "type": u_type,
                    "html": segment_html,
                    "text": segment_text,
                    "link": link
                })

        for child in soup.children:
            # Skip empty strings or whitespace
            if isinstance(child, str) and not child.strip():
                continue
                
            if child.name == "h3":
                # Save the accumulated elements for the previous header
                add_segment(current_elements, current_type)
                current_elements = []
                current_type = child.get_text().strip()
            else:
                current_elements.append(child)
                
        # Save the final accumulated elements
        add_segment(current_elements, current_type)
        
    return updates

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/releases")
def get_releases():
    try:
        # Fetch with timeout and custom headers
        headers = {
            "User-Agent": "BigQueryReleaseNotesViewer/1.0 (Flask webapp)"
        }
        response = requests.get(FEED_URL, headers=headers, timeout=TIMEOUT_SECONDS)
        response.raise_for_status()
        
        updates = parse_feed_content(response.content)
        
        # Sort updates (they are already sorted by date descending, but we can verify)
        return jsonify({
            "status": "success",
            "count": len(updates),
            "updates": updates
        })
    except requests.exceptions.RequestException as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to fetch release notes: {str(e)}"
        }), 502
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"An unexpected error occurred: {str(e)}"
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
