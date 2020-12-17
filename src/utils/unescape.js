var tagsToReplace = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': '\''
};

function replaceTag(tag) {
	return tagsToReplace[tag] || tag;
}

export default function unescapeSymbols(str) {
	return str.replace(/(&amp;|&gt;|&lt;|&quot;|&#39)/g, replaceTag);
}