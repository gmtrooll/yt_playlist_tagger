const apiKey = "AIzaSyA5_xj25khCHOStMS20I_AeYhKhJW9Ie2s"; // replace with your YouTube Data API v3 key
let videos = [];
let taggedVideos = JSON.parse(localStorage.getItem("taggedVideos") || "{}"); // store by videoId
let currentVideoId = null;

document.getElementById("load-playlist").addEventListener("click", async () => {
  const playlistUrl = document.getElementById("playlist-url").value.trim();
  const playlistId = extractPlaylistId(playlistUrl);

  if (!playlistId) {
    alert("Invalid playlist URL");
    return;
  }

  videos = await fetchPlaylistVideos(playlistId);
  renderVideoList();
  updateTaggedList();
});

// extract playlist ID from URL
function extractPlaylistId(url) {
  const regex = /[?&]list=([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// fetch playlist videos
async function fetchPlaylistVideos(playlistId) {
  const results = [];
  let nextPageToken = "";
  do {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&pageToken=${nextPageToken}&key=${apiKey}`
    );
    const data = await response.json();

    for (const item of data.items) {
      const videoId = item.snippet.resourceId.videoId;
      if (!videoId) continue; // skip broken entries
      results.push({
        videoId,
        title: item.snippet.title
      });
    }
    nextPageToken = data.nextPageToken || "";
  } while (nextPageToken);
  return results;
}

// render video list
function renderVideoList() {
  const container = document.getElementById("video-list");
  container.innerHTML = "";

  const tagsInput = document.getElementById("tag-definitions").value.trim();
  const tagDefs = tagsInput ? tagsInput.split(",").map(t => t.trim()).filter(Boolean) : [];

  videos.forEach(video => {
    const entry = document.createElement("div");
    entry.className = "video-entry";

    // Title
    const title = document.createElement("div");
    title.textContent = video.title;
    entry.appendChild(title);

    // Play button
    const playBtn = document.createElement("button");
    playBtn.textContent = "Play Video";
    playBtn.onclick = () => loadVideo(video.videoId);
    entry.appendChild(playBtn);

    // Tag checkboxes
    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "tag-checkboxes";
    tagDefs.forEach(tag => {
      const label = document.createElement("label");
      label.style.marginRight = "10px";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = tag;

      // restore saved tags if present
      if (taggedVideos[video.videoId] && taggedVideos[video.videoId].tags.includes(tag)) {
        cb.checked = true;
      }

      cb.onchange = () => saveTags(video.videoId, video.title, tagDefs, checkboxContainer);
      label.appendChild(cb);
      label.append(" " + tag);
      checkboxContainer.appendChild(label);
    });
    entry.appendChild(checkboxContainer);

    container.appendChild(entry);
  });
}

// load video in player
function loadVideo(videoId) {
  currentVideoId = videoId;
  document.getElementById("video-player").src =
    `https://www.youtube.com/embed/${videoId}?autoplay=1`;
}

// save selected tags for a video
function saveTags(videoId, title, tagDefs, checkboxContainer) {
  const checkedTags = Array.from(checkboxContainer.querySelectorAll("input:checked"))
    .map(cb => cb.value);

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  taggedVideos[videoId] = {
    title,
    tags: checkedTags,
    url: videoUrl
  };

  localStorage.setItem("taggedVideos", JSON.stringify(taggedVideos));
  updateTaggedList();
}

// update tagged list display
function updateTaggedList() {
  const listDiv = document.getElementById("tagged-list");
  const lines = Object.values(taggedVideos).map(
    v => `${v.title} - {${v.tags.join(", ")}} - ${v.url}`
  );
  listDiv.textContent = lines.join("\n");
}

