const PLATFORM = "Tiktok";

const API_URL = "http://192.168.92.182:3002";
const URL_SEARCH_CHANNEL = `${API_URL}/search/`;
const URL_CHANNEL_INFO = `${API_URL}/user/info/`;
const URL_CHANNEL_VIDEOS = `${API_URL}/user/videos`;
const URL_VIDEO_COMMENTS = `${API_URL}/video/comments`;
const URL_VIDEO_INFO = `${API_URL}/video/info`;
const URL_VIDEO_STREAM = `${API_URL}/video/stream`;

const REGEX_VIDEO_CHANNEL_URL =  /^(https:\/\/)?(www\.|m\.)?tiktok\.com\/@([\w.-]+)(\?.*)?$/
const REGEX_EMBED_VIDEO_URL = /^(https:\/\/)?(www\.|m\.)?tiktok\.com\/@([\w.-]+)\/video\/\d+(\?.*)?$/
const REGEX_VIDEO_ID_URL = /@[\w.-]+\/video\/(\d+)/

var config = {};

//Source Methods
source.enable = function(conf, settings, savedState){
	config = conf ?? {};
	log(config);
}
source.getHome = function() {
	return new ContentPager([], false);
};

source.searchSuggestions = function(query) {
	return [];
};
source.getSearchCapabilities = () => {
	return {
		types: [Type.Feed.Mixed],
		sorts: [Type.Order.Chronological],
		filters: [ ]
	};
};
source.search = function (query, type, order, filters) {
	return new ContentPager([]. false);
};
source.getSearchChannelContentsCapabilities = function () {
	return {
		types: [Type.Feed.Mixed],
		sorts: [Type.Order.Chronological],
		filters: []
	};
};
source.searchChannelContents = function (channelUrl, query, type, order, filters) {
	throw new ScriptException("This is a sample");
};

source.searchChannels = function (query) {
	const results = []
	const res = http.GET(URL_SEARCH_CHANNEL + query, {});
	if (!res.isOk) {
		return [];
	}

	const data = JSON.parse(res.body);
	console.log(data);
	data.forEach(c => {
		results.push(new PlatformAuthorLink(
			new PlatformID(PLATFORM, c.uid, config.id),
			c.unique_id,
			"https://www.tiktok.com/@"+c.unique_id,
			c.avatar_thumb.url_list[0],
			c.follower_count
		))
	});

	return new TiktokChannelPager(results)
};

//Channel
source.isChannelUrl = function(url) {
	return REGEX_VIDEO_CHANNEL_URL.test(url);
};
source.getChannel = function(url) {
	const match = url.match(REGEX_VIDEO_CHANNEL_URL);
	
	if (!(match && match[3])) {
		throw new ScriptException("Channel regex doesn't match")
	}

	const username = match[3];
	console.log(URL_CHANNEL_INFO+username);
	const res = http.GET(URL_CHANNEL_INFO+username, {});
	if(!res.isOk){
		throw new ScriptException(`Failed to get channel (${res.status}).`);
	}

	const data = JSON.parse(res.body);
	const c = data.userInfo;
	return new PlatformChannel({
		id: new PlatformID(PLATFORM, c.user.id, config.id),
		name: c.user.uniqueId,
		thumbnail: c.user.avatarThumb,
		banner: "",
		subscribers: c.stats.followerCount,
		description: c.user.signature,
		url: url,
		links: {}
	})

};
source.getChannelContents = function(url, type, order, filters) {
	console.log("get contents: "+url);
	const match = url.match(REGEX_VIDEO_CHANNEL_URL);
	console.log(match);
	
	if (!(match && match[3])) {
		throw new ScriptException("Channel regex doesn't match");
	}

	const username = match[3];

	console.log(`query: ${URL_CHANNEL_VIDEOS+"?username="+username}`)
	
	const res = http.POST(URL_CHANNEL_VIDEOS+"?username="+username, '{}', {}, false);
	if(!res.isOk){
		throw new ScriptException(`Failed to get channel (${res.body}).`);
	}

	const data = JSON.parse(res.body);
	const videos = [];

	
	data.forEach(v=>{
		console.log(v);
		videos.push(new PlatformVideo({
			id: new PlatformID(PLATFORM, v.id, config.id),
			name: v.desc,
			// thumbnails: new Thumbnails([new Thumbnail(v.video.cover, 0)]),
			thumbnails: new Thumbnails([new Thumbnail(v.video.zoomCover["240"], 0)]),
			author: new PlatformAuthorLink(
				new PlatformID(PLATFORM, v.author.id, config.id),
				v.author.uniqueId,
				"https://www.tiktok.com/@"+v.author.uniqueId,
				v.author.avatarThumb,
			),
			uploadDate: parseInt(v.createTime),
			duration: v.video.duration,
			viewCount: v.stats.playCount,
			url: `https://www.tiktok.com/@${v.author.uniqueId}/video/${v.id}`,
			isLive: false
		}))
	});

	return new VideoPager(videos, false, {});
};

//Video
source.isContentDetailsUrl = function(url) {
	return REGEX_EMBED_VIDEO_URL.test(url);
};
source.getContentDetails = function(url) {
	const res = http.GET(`${URL_VIDEO_INFO}?url=${url}`, {});
	if (!res.isOk) {
		throw new ScriptException(`Failed to get video details (${res.body}).`);
	}

	const data = JSON.parse(res.body);
	console.log(data);
	const author = data.author;
	const video = data.video;

	const sources = [];
	sources.push(new VideoUrlSource({
		name: "Original 540P",
		url: `${URL_VIDEO_STREAM}?url=${url}`,
		container: "video/mp4",
		width: 540,
		duration: video.duration
	}));

	return new PlatformVideoDetails({
		id: new PlatformID(PLATFORM, data.id, config.id),
		name: data.desc,
		thumbnails: new Thumbnails([new Thumbnail(video.zoomCover["240"])]),
		author: new PlatformAuthorLink(
			new PlatformID(PLATFORM, author.id, config.id),
			author.uniqueId,
			"https://www.tiktok.com/@"+author.uniqueId,
			author.avatarThumb,
		),
		datetime: parseInt(data.createTime),
		duration: data.duration,
		viewCount: data.stats.playCount,
		url: url,
		isLive: false,
		description: data.desc,
		rating: new RatingLikes(data.stats.diggCount),
		video: new VideoSourceDescriptor(sources),
		live: null,
	});
};

//Comments
source.getComments = function (url) {
	const match = url.match(REGEX_VIDEO_ID_URL);
	if (!(match && match[1])) {
		throw new ScriptException(`Failed to get video id from url. ${url}`);
	}
	const video_id = match[1];
	const res = http.POST(`${URL_VIDEO_COMMENTS}?video_id=${video_id}`, '{}', {}, false);
	if(!res.isOk){
		throw new ScriptException(`Failed to get video comments (${res.body}).`);
	}

	const data = JSON.parse(res.body);
	const comments = [];
	data.forEach(comment=>{
		comments.push(new TiktokComment({
			contextUrl: url,
			author: new PlatformAuthorLink(
				new PlatformID(PLATFORM, comment.author.id, config.id),
				comment.author.username,
				"https://www.tiktok.com/@"+comment.author.username,
				comment.author.thumbnail
			),
			message: comment.text,
			date: comment.create_time,
			replyCount: comment.reply_total,
			replies: [],
			rating: new RatingLikes(comment.likes_count),
		}))
	})
	return new TiktokCommentPager(comments);
}
source.getSubComments = function (comment) {
	if(typeof comment === 'string'){
		comment = JSON.parse(comment);
	}
	return new TiktokCommentPager([]);
}

class TiktokCommentPager extends CommentPager {
	constructor(results){
		super(results, false, {});
	}

	nextPage() {
		return this;
	}
}

class TiktokComment extends Comment {
	constructor(obj) {
		super(obj);
	}

	getReplies() {
		return new TiktokCommentPager([], 20);
	}
}


class TiktokChannelPager extends ChannelPager {
	constructor(results) {
		super(results, false);
	}

	nextPage() {
		return this;
	}
}

log("LOADED");