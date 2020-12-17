import { combineReducers } from 'redux';
import assessmentReducer from './assessment/reducer';
import idpReducer from './idp/reducer';

const reducer = combineReducers({
	assessment: assessmentReducer,
	idp: idpReducer,
	wt: (state = {}) => state
});

export default reducer;