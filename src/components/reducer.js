import listReducer from './list/listReducer';
import { combineReducers } from 'redux';

const reducer = combineReducers({
	listComponent: listReducer
});

export default reducer;