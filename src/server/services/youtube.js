import { demoChannels } from '../data/demo-channels.js';
// Внешние запросы ограничены таймаутом, ключ не передаётся в браузер.
export async function youtube(path, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  url.search = new URLSearchParams({ ...params, key: process.env.YOUTUBE_API_KEY });
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('YouTube API недоступен. Проверьте ключ и квоту.');
  return response.json();
}
export async function channels(query, demo) {
  if (demo) return demoChannels;
  const search = await youtube('search', {
    part: 'snippet',
    type: 'channel',
    q: query,
    maxResults: '6',
  });
  const ids = search.items.map((item) => item.id.channelId).join(',');
  if (!ids) return [];
  const data = await youtube('channels', { part: 'snippet,statistics', id: ids });
  return data.items.map((c) => ({
    id: c.id,
    title: c.snippet.title,
    handle: c.snippet.customUrl || c.id,
    subscribers: c.statistics.hiddenSubscriberCount ? null : Number(c.statistics.subscriberCount),
    views: Number(c.statistics.viewCount),
    videos: Number(c.statistics.videoCount),
    color: '#d9eace',
  }));
}
export async function niches(query, demo) {
  if (demo)
    return [
      'Монтаж на телефоне',
      'YouTube с нуля',
      'Съёмка без студии',
      'Обзоры AI-инструментов',
    ].map((title, i) => ({ title, videos: 12 + i * 7, averageViews: 18400 + i * 9300 }));
  const results = await Promise.all(
    ['для начинающих', 'урок', 'обзор', 'ошибки'].map(async (suffix) => {
      const title = `${query} ${suffix}`;
      const search = await youtube('search', {
        part: 'snippet',
        type: 'video',
        q: title,
        maxResults: '10',
        order: 'relevance',
      });
      const ids = search.items.map((v) => v.id.videoId).join(',');
      if (!ids) return { title, videos: 0, averageViews: 0 };
      const data = await youtube('videos', { part: 'statistics', id: ids });
      return {
        title,
        videos: data.items.length,
        averageViews: Math.round(
          data.items.reduce((n, v) => n + Number(v.statistics.viewCount || 0), 0) /
            (data.items.length || 1),
        ),
      };
    }),
  );
  return results.sort((a, b) => b.averageViews - a.averageViews);
}
