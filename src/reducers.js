import { combineReducers } from 'redux';
import appReducer from './assessment/reducer';

const reducer = combineReducers({
	app: appReducer,
	wt: (state = {}) => state
});

export default reducer;
