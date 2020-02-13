import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { createLogger  } from 'redux-logger';
import reducers from '../reducers';

// Redux DevTools
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default function configureStore(initialState) {
	const enhancer = composeEnhancers(
		applyMiddleware(thunk, createLogger())
	);
	const store = createStore(reducers, initialState, enhancer);

	if (module.hot) {
		module.hot.accept('../reducers', () =>
			store.replaceReducer(require('../reducers').default)
		);
	}

	return store;
}