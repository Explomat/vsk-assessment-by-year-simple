import { combineReducers } from 'redux';
import assessmentReducer from './assessment/reducer';
import idpReducer from './idp/reducer';
import componentsReducer from './components/reducer';

const reducer = combineReducers({
	assessment: assessmentReducer,
	idp: idpReducer,
	components: componentsReducer,
	wt: (state = {}) => state
});

export default reducer;