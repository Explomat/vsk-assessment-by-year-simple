export function pureUrl(){
	//return window.location.protocol + '//192.168.73.37';
	return process.env.NODE_ENV === 'production' ?
			(window.location.protocol + '//' + window.location.host) : window.location.protocol + '//192.168.73.37';
}

export function createBaseUrl(action_name){
	action_name = action_name || '';

	const baseUrl = pureUrl() + '/custom_web_template.html';

	window.routerId = process.env.NODE_ENV === 'production' ? '6824411951688522201' : '6727531844004172765'; // test '6727531844004172765'; prod '6789943271516957593'
	window.serverId = process.env.NODE_ENV === 'production' ? '6672233575633323919' : '6672233575633323919'; // test '6672233575633323919'; prod '6793191618705752266'
	return `${baseUrl}?object_id=${window.routerId}&server_id=${window.serverId}&action_name=${action_name}&r=${(new Date()).getTime()}`
}

const request = action_name => {
	const _url = createBaseUrl(action_name);

	const getUrlWithParams = (_url, params) => {
		const url = new URL(_url);
		Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
		return url;
	}

	return {
		get: (params = {}, config) => {
			return fetch(getUrlWithParams(_url, params), config);
		},
		post: (data = {}, params = {}, config) => {
			return fetch(getUrlWithParams(_url, params), {
				method: 'POST',
				body: JSON.stringify(data),
				headers: {
					'Content-Type': 'application/json'
				},
				...config
			}).then(r => r.json());
		}
	}
}

export default request;