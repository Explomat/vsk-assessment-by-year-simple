import { find, findKey } from 'lodash';
import boolean from 'boolean';

const isCommentRequire = (scales, markText) => {
	const t = find(scales, { name: markText });
	return t ? boolean(t.comment_require) : false;
}

const isCompetenceCompleted = (competenceId, props) => {
	const { competences, commonCompetences } = props;

	const comp = competences[competenceId];
	const commonComp = commonCompetences[commonId(competenceId)];
	return !(
		comp.mark_text === '' ||
		(isCommentRequire(commonComp.scales, comp.mark_text) && !comp.comment)
	);
	/*const comp = competences[competenceId];
	const f = comp.indicators.filter(i => {
		const ind = indicators[i];
		const commonI = commonIndicators[commonId(i)];
		const mark = ind.mark_text;
		const result = (
			mark === '' ||
			(isCommentRequire(commonI.scales, mark) && !ind.comment)
		)
		return result;
	});
	return f.length === 0;*/
}

const isCompetencesCompleted = (props) => {
	const { competences } = props;

	const ids = Object.keys(competences);

	const len = ids.filter(c => {
		const l = isCompetenceCompleted(c, props);
		//console.log('isCompetenceCompleted:' + l);
		return l;
	}).length;
	//console.log(len);
	return len === ids.length;
}

const computeCompetencePercent = (competenceId, props) => {
	const { competences, commonCompetences } = props;

	const comp = competences[competenceId];
	const commonComp = commonCompetences[commonId(competenceId)];

	const s = find(commonComp.scales, { name: comp.mark_text });
	return s ? parseInt(s.percent, 10) : 0;


	/*const comp = competences[competenceId];
	const percents = comp.indicators.map(i => {
		const ui = indicators[i];
		const ci = commonIndicators[commonId(i)];
		const s = find(ci.scales, { name: ui.mark_text });
		if (s) return s.percent;
		return 0;
		//return ci.scales[0].percent;
	});
	const total = percents.reduce((f, s) => {
		return parseInt(f, 10) + parseInt(s, 10);
	}, 0);

	const average = Math.round((total / percents.length) * 100) / 100;

	return average;*/
}

const computeScaleByPercent = (percent, props) => {
	const { rules } = props;
	const r = Math.round(parseInt(percent, 10) / 10) * 10;

	const s = findKey(rules, { percent: r });
	if (s) return rules[s].scale;
	return null;
	//return legends[0].scale;
}

const computeCompetenceMark = (competenceId, props) => {
	const percent = computeCompetencePercent(competenceId, props);
	return computeScaleByPercent(percent, props);
}

const computeResultPercents = (paId, props) => {
	const { pas } = props;
	const pa = pas[paId];
	const comps = pa.competences;
	const percents = comps.reduce((f, s) => f += computeCompetencePercent(s, props), 0);
	//return Math.floor((percents / comps.length) * 100) / 100;

	return Math.round((percents / comps.length) / 10) * 10;
}

const computeResultMark = (paId, props) => {
	const p = computeResultPercents(paId, props);
	return computeScaleByPercent(p, props);
}

//т.к. id индикатора теперь имеет вид paId-competenceId-indicatorId,
// комптенции paId-competenceId для уникальности,
// то нужно вычленить сам id для commonIndicators и commonCompetences
const commonId = id => {
	const arr = id.split('_');
	return arr[arr.length - 1];
}

export {
	isCommentRequire,
	computeScaleByPercent,
	computeCompetenceMark,
	computeCompetencePercent,
	computeResultPercents,
	computeResultMark,
	isCompetenceCompleted,
	isCompetencesCompleted,
	commonId
}