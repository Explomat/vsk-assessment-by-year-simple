import faker from 'faker';
import { times, escapeRegExp, filter, take } from 'lodash';

faker.locale = 'ru';

const users = times(50, () => {
	const position = faker.name.jobType();
	const department = faker.name.jobArea();

	return {
		id: faker.random.number(),
		title: faker.name.findName(),
		position,
		department,
		description: `${department} -> ${position}`
	}
});

let step = 'first';

export function getStepMock(){
	return step;
}

export function setStepMock(_step){
	step = _step;
}

export function searchManagersMock(value){
	const re = new RegExp(escapeRegExp(value), 'i');
	const isMatch = result => re.test(result.title);

	return take(filter(users, isMatch), 5);
}

export function saveAssessmentMock(pa){
	step = 'second';
	console.log(pa);
}