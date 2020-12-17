//import '@babel/polyfill';
//import "core-js/features/set";
//import "core-js/features/map";
import 'react-app-polyfill/ie9';
import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';

import AssessmentApp from './assessment/App';

// Redux Store
import configureStore from './store';

import 'semantic-ui-css/semantic.min.css';
import './css/global.css';
//import './css/roboto.css';


const store = configureStore({
	wt: {
		routerId: window.routerId,
		serverId: window.serverId
	}
});

const render = () => (
	<Provider store={store}>
		<Router>
			<AssessmentApp />
		</Router>
	</Provider>
);

ReactDOM.render(render(), document.getElementById('root'));

