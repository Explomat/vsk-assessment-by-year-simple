export function pureUrl(){
	//return window.location.protocol + '//192.168.73.37';
	return process.env.NODE_ENV === 'production' ?
		window.location.protocol + window.location.host : window.location.protocol + '//192.168.217.201';
}

const servers = {
	assessment: {
		router: {
			prod: '6824411951688522201',
			test: '6727531844004172765'
		},
		server: {
			prod: '6672233575633323919',
			test: '6672233575633323919'
		}
	},
	idp: {
		router: {
			prod: '6824411951688522201',
			test: '6727531844004172765'
		},
		server: {
			prod: '6906058991562141523',
			test: '6906058991562141523'
		}
	}
}

export function createBaseUrl(appName, actionName, params = {}){
	const aName = actionName || '';
	const isProd = process.env.NODE_ENV === 'production';

	if (!(appName in servers)) {
		throw 'App does not exist';
	}

	const app = servers[appName];
	const baseUrl = pureUrl() + '/custom_web_template.html';

	window.routerId = isProd ? app.router.prod : app.router.test;
	window.serverId = isProd ? app.server.prod : app.server.test;
	const url = new URL(`${baseUrl}?object_id=${window.routerId}&server_id=${window.serverId}&action_name=${aName}&r=${(new Date()).getTime()}`);
	Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
	return url.href;
}

const request = (appName, actionName, urlParams = {}) => {
	const _url = createBaseUrl(appName, actionName, urlParams);

	return {
		get: (params = {}, config) => {
			const url = new URL(_url);
			Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
			return fetch(url, config);
		},
		post: (data = {}, config) => {
			return fetch(_url, {
				method: 'POST',
				body: JSON.stringify(data),
				headers: {
					'Content-Type': 'application/json'
				},
				...config
			});
		},
		form: (data = {}, config) => {
			return fetch(_url, {
				method: 'POST',
				body: data,
				...config
			});
		},
		delete: (data = {}, config) => {
			return fetch(_url, {
				method: 'DELETE',
				body: JSON.stringify(data),
				headers: {
					'Content-Type': 'application/json'
				},
				...config
			});
		},
	}
}

export default request;