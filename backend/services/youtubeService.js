/**
 * youtubeService.js
 * 
 * Quantiva YouTube Video Integration Service
 * 
 * Responsibilities:
 * 1. Discover top viewed/liked educational videos for quantum computing topics using YouTube Data API v3.
 * 2. Graceful fallback when YOUTUBE_API_KEY is missing, rate-limited, or network fails.
 * 3. Curated video grounding for core quantum algorithms and foundations.
 */

const CURATED_TOPIC_VIDEOS = {
  "phase-kickback": {
    videoId: "mAHB_K68q6s",
    title: "Phase Kickback Explained Visually",
    channelTitle: "Qiskit",
    embedUrl: "https://www.youtube-nocookie.com/embed/mAHB_K68q6s",
    url: "https://www.youtube.com/watch?v=mAHB_K68q6s",
    description: "Visual exploration of phase kickback and controlled unitary gates in quantum computing.",
  },
  "quantum-phase-estimation": {
    videoId: "4nT0BTUxhJY",
    title: "Phase Estimation and Factoring — Understanding Quantum Information",
    channelTitle: "Qiskit",
    embedUrl: "https://www.youtube-nocookie.com/embed/4nT0BTUxhJY",
    url: "https://www.youtube.com/watch?v=4nT0BTUxhJY",
    description: "In-depth derivation and circuit architecture for Quantum Phase Estimation (QPE).",
  },
  "grover-search": {
    videoId: "hnpjC8WQVrQ",
    title: "Grover's Algorithm — Understanding Quantum Information & Computation",
    channelTitle: "Qiskit",
    embedUrl: "https://www.youtube-nocookie.com/embed/hnpjC8WQVrQ",
    url: "https://www.youtube.com/watch?v=hnpjC8WQVrQ",
    description: "Geometric and algebraic analysis of amplitude amplification and Grover's search algorithm.",
  },
  "vqe": {
    videoId: "DUq-0r-Prw0",
    title: "What Is the Variational Quantum Eigensolver? (VQE Explained)",
    channelTitle: "Qiskit",
    embedUrl: "https://www.youtube-nocookie.com/embed/DUq-0r-Prw0",
    url: "https://www.youtube.com/watch?v=DUq-0r-Prw0",
    description: "Explore near-term hybrid quantum-classical algorithms and molecular simulation using VQE.",
  },
  "bb84": {
    videoId: "ui40G_kE3q0",
    title: "Quantum Cryptography and the BB84 Protocol",
    channelTitle: "Qiskit",
    embedUrl: "https://www.youtube-nocookie.com/embed/ui40G_kE3q0",
    url: "https://www.youtube.com/watch?v=ui40G_kE3q0",
    description: "How quantum mechanics guarantees secure key distribution and detects eavesdropping.",
  },
  "quantum-teleportation": {
    videoId: "DfZZS8Spe7U",
    title: "Quantum Teleportation & Entanglement in Action",
    channelTitle: "Qiskit",
    embedUrl: "https://www.youtube-nocookie.com/embed/DfZZS8Spe7U",
    url: "https://www.youtube.com/watch?v=DfZZS8Spe7U",
    description: "Transmitting quantum states using shared Bell pairs and classical communication.",
  },
};

/**
 * Searches for the top viewed/liked YouTube video for a given quantum topic.
 * 
 * @param {string} topic - Search topic (e.g. "Phase Kickback", "HHL Algorithm", "Quantum Cryptography")
 * @returns {Promise<Object>} Video metadata object
 */
async function fetchTopVideo(topic) {
  const cleanTopic = (topic || "").trim();
  const slug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!cleanTopic) {
    return null;
  }

  // If live API key is available, query YouTube Data API v3
  if (apiKey && typeof apiKey === "string" && apiKey.trim().length > 10) {
    try {
      const query = `${cleanTopic} quantum computing`;
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=relevance&videoEmbeddable=true&maxResults=5&q=${encodeURIComponent(query)}&key=${apiKey.trim()}`;

      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const items = searchData.items || [];
        const videoIds = items
          .map((it) => it.id?.videoId)
          .filter(Boolean);

        if (videoIds.length > 0) {
          // Fetch statistics (viewCount, likeCount) for the found videos
          const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${apiKey.trim()}`;
          const statsRes = await fetch(statsUrl);

          if (statsRes.ok) {
            const statsData = await statsRes.json();
            const statItems = statsData.items || [];

            // Sort by viewCount descending to pick the top-viewed/liked video
            statItems.sort((a, b) => {
              const viewsA = Number(a.statistics?.viewCount || 0);
              const viewsB = Number(b.statistics?.viewCount || 0);
              return viewsB - viewsA;
            });

            const topItem = statItems[0] || items[0];
            const vId = topItem.id?.videoId || topItem.id;
            const snippet = topItem.snippet || {};
            const stats = topItem.statistics || {};

            return {
              videoId: vId,
              title: snippet.title || `${cleanTopic} Explained`,
              channelTitle: snippet.channelTitle || "Quantum Computing",
              description: snippet.description || `Educational video on ${cleanTopic}.`,
              embedUrl: `https://www.youtube-nocookie.com/embed/${vId}`,
              url: `https://www.youtube.com/watch?v=${vId}`,
              viewCount: Number(stats.viewCount || 0),
              likeCount: Number(stats.likeCount || 0),
            };
          }
        }
      } else {
        console.warn(`[youtubeService] YouTube API error (${searchRes.status}):`, await searchRes.text());
      }
    } catch (err) {
      console.error("[youtubeService] Failed to query YouTube API:", err.message);
    }
  }

  // Curated Fallback
  if (CURATED_TOPIC_VIDEOS[slug]) {
    return { ...CURATED_TOPIC_VIDEOS[slug] };
  }

  // Safe fallback search embed
  const encodedQuery = encodeURIComponent(`${cleanTopic} quantum computing`);
  return {
    videoId: "",
    title: `${cleanTopic} — Video Guide`,
    channelTitle: "Quantum Computing Curated",
    embedUrl: `https://www.youtube-nocookie.com/embed?listType=search&list=${encodedQuery}`,
    url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
    description: `Explore top tutorials, lectures, and visual walkthroughs for ${cleanTopic}.`,
    viewCount: 0,
    likeCount: 0,
  };
}

module.exports = {
  fetchTopVideo,
  CURATED_TOPIC_VIDEOS,
};
